import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  PollService,
  CreatePollInput,
  CreateSuggestionInput,
  ASIA_DHAKA_TIMEZONE,
} from './poll-service';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '../api/errors';

describe('Task 45 — Community Polling, Voting & Member Participation', () => {
  let service: PollService;

  beforeEach(() => {
    // Instantiate fresh service with seeded mock data
    service = new PollService(null as any);
  });

  describe('1. Tenant Isolation for Polls & Results', () => {
    it('Tenant A cannot access Tenant B polls or voting results', async () => {
      // Prince Mess has seeded polls (poll_seed_1, poll_seed_2)
      const princePolls = await service.listPolls('prince-mess', {}, true);
      assert.ok(princePolls.polls.length >= 2);
      for (const p of princePolls.polls) {
        assert.strictEqual(p.tenantId, 'tenant_prince_mess');
      }

      // Green Villa Mess has only its own poll (poll_green_1)
      const greenPolls = await service.listPolls('green-villa-mess', {}, true);
      assert.strictEqual(greenPolls.polls.length, 1);
      assert.strictEqual(greenPolls.polls[0].referenceNumber, 'POLL-GV-001');
      assert.strictEqual(greenPolls.polls[0].tenantId, 'tenant_green_villa');

      // Attempting to access Prince Mess poll with Green Villa slug throws NotFoundError
      await assert.rejects(
        async () => {
          await service.getPollById('green-villa-mess', 'poll_seed_1', true);
        },
        (err: any) => {
          assert.ok(err instanceof NotFoundError);
          assert.match(err.message, /not found/i);
          return true;
        }
      );
    });

    it('rejects poll operations on suspended mess tenants with ForbiddenError', async () => {
      await assert.rejects(
        async () => {
          await service.listPolls('suspended-mess', {}, true);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /suspended/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await service.getPollDashboard('suspended-mess', undefined, true);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          return true;
        }
      );
    });
  });

  describe('2. Poll Creation, Validation & Lifecycle', () => {
    it('staff can create a valid draft poll with multiple options', async () => {
      const input: CreatePollInput = {
        title: 'Common Room Air Conditioner Temperature Policy',
        description: 'Should AC remain at 24°C or 26°C during summer peak hours?',
        pollType: 'FACILITY_DECISION',
        votingMode: 'IDENTIFIED',
        selectionType: 'SINGLE_CHOICE',
        resultsVisibility: 'ALWAYS',
        options: ['Keep at 24°C', 'Eco-mode at 26°C', 'Turn off after midnight'],
      };

      const result = await service.createPoll('prince-mess', 'usr_owner_1', input);

      assert.ok(result.id);
      assert.strictEqual(result.title, input.title);
      assert.strictEqual(result.status, 'DRAFT');
      assert.strictEqual(result.options.length, 3);
      assert.ok(result.referenceNumber.startsWith('POLL-'));
    });

    it('rejects poll creation with fewer than 2 options', async () => {
      const input: CreatePollInput = {
        title: 'Invalid Single Option Poll',
        options: ['Only Option'],
      };

      await assert.rejects(
        async () => {
          await service.createPoll('prince-mess', 'usr_owner_1', input);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /at least 2 distinct/i);
          return true;
        }
      );
    });

    it('rejects poll creation if end date is before start date', async () => {
      const input: CreatePollInput = {
        title: 'Invalid Date Poll',
        startDate: new Date('2026-11-25T12:00:00Z'),
        endDate: new Date('2026-11-20T12:00:00Z'), // Past date!
        options: ['Option A', 'Option B'],
      };

      await assert.rejects(
        async () => {
          await service.createPoll('prince-mess', 'usr_owner_1', input);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /closing date must be after/i);
          return true;
        }
      );
    });

    it('publishing and closing changes poll status and notifies members', async () => {
      const created = await service.createPoll('prince-mess', 'usr_owner_1', {
        title: 'Weekly Cleaning Day Vote',
        options: ['Friday', 'Saturday'],
      });

      // 1. Publish
      const published = await service.publishPoll('prince-mess', 'usr_owner_1', created.id);
      assert.strictEqual(published.status, 'PUBLISHED');
      assert.ok(published.publishedAt);

      // 2. Close
      const closed = await service.closePoll('prince-mess', 'usr_owner_1', created.id);
      assert.strictEqual(closed.status, 'CLOSED');
      assert.ok(closed.closedAt);
    });
  });

  describe('3. Voting Eligibility & Authorization', () => {
    it('active member can cast a valid single-choice vote', async () => {
      // poll_seed_1 has usr_resident_1 voted; usr_resident_2 has not voted yet
      const optionId = 'opt_1_2'; // 'Beef Khichuri'
      const updated = await service.castVote('prince-mess', 'usr_resident_2', 'poll_seed_1', [optionId]);

      assert.strictEqual(updated.hasVoted, true);
      assert.deepStrictEqual(updated.userVoteOptionIds, [optionId]);
      assert.strictEqual(updated.totalVotes, 2); // 1 seeded + 1 cast
    });

    it('rejects voting if user is not an active member of the tenant', async () => {
      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_outsider_99', 'poll_seed_1', ['opt_1_2']);
        },
        (err: any) => {
          assert.ok(err instanceof ForbiddenError);
          assert.match(err.message, /only active members/i);
          return true;
        }
      );
    });
  });

  describe('4. Duplicate Voting & Voting Window Enforcement', () => {
    it('prevents duplicate voting by the same resident on the same poll', async () => {
      // usr_resident_1 already voted on poll_seed_1 in seeded mock data
      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_resident_1', 'poll_seed_1', ['opt_1_2']);
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.match(err.message, /already cast your vote/i);
          return true;
        }
      );
    });

    it('rejects voting on a closed or draft poll', async () => {
      // poll_seed_2 is CLOSED
      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_resident_2', 'poll_seed_2', ['opt_2_1']);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /currently closed/i);
          return true;
        }
      );
    });

    it('rejects voting outside active voting window', async () => {
      // Create poll with future start date
      const futurePoll = await service.createPoll('prince-mess', 'usr_owner_1', {
        title: 'Future Ramadan Schedule Poll',
        startDate: new Date('2026-12-01T00:00:00Z'),
        options: ['Schedule 1', 'Schedule 2'],
      });
      await service.publishPoll('prince-mess', 'usr_owner_1', futurePoll.id);

      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_resident_2', futurePoll.id, [
            futurePoll.options[0].id,
          ]);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /voting has not started yet/i);
          return true;
        }
      );
    });
  });

  describe('5. Multiple-Choice & Option Integrity Rules', () => {
    it('enforces multiple-choice selection limits', async () => {
      const multiPoll = await service.createPoll('prince-mess', 'usr_owner_1', {
        title: 'Sports Equipment Purchase Vote',
        selectionType: 'MULTIPLE_CHOICE',
        maxSelections: 2,
        options: ['Cricket Bat', 'Football', 'Badminton Rackets', 'Carrom Board'],
      });
      await service.publishPoll('prince-mess', 'usr_owner_1', multiPoll.id);

      // Attempting to select 3 options when max is 2
      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_resident_2', multiPoll.id, [
            multiPoll.options[0].id,
            multiPoll.options[1].id,
            multiPoll.options[2].id,
          ]);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /you may select at most 2/i);
          return true;
        }
      );

      // Selecting 2 valid options succeeds
      const voted = await service.castVote('prince-mess', 'usr_resident_2', multiPoll.id, [
        multiPoll.options[0].id,
        multiPoll.options[1].id,
      ]);
      assert.strictEqual(voted.hasVoted, true);
      assert.strictEqual(voted.userVoteOptionIds?.length, 2);
    });

    it('rejects option ID belonging to a different poll', async () => {
      // opt_2_1 belongs to poll_seed_2, not poll_seed_1
      await assert.rejects(
        async () => {
          await service.castVote('prince-mess', 'usr_resident_2', 'poll_seed_1', ['opt_2_1']);
        },
        (err: any) => {
          assert.ok(err instanceof ValidationError);
          assert.match(err.message, /does not belong to this poll/i);
          return true;
        }
      );
    });

    it('restricts poll option changes once voting has commenced', async () => {
      // poll_seed_1 already has votes cast
      await assert.rejects(
        async () => {
          await service.updatePoll('prince-mess', 'usr_owner_1', 'poll_seed_1', {
            options: ['Option X', 'Option Y'],
          });
        },
        (err: any) => {
          assert.ok(err instanceof ConflictError);
          assert.match(err.message, /cannot modify poll options after voting has commenced/i);
          return true;
        }
      );
    });
  });

  describe('6. Results Visibility & Zero-Vote Render Safety', () => {
    it('AFTER_CLOSE poll hides vote breakdown from members while voting is active', async () => {
      // Create poll with AFTER_CLOSE visibility
      const secretPoll = await service.createPoll('prince-mess', 'usr_owner_1', {
        title: 'Secret Ballot for Mess Committee Secretary',
        resultsVisibility: 'AFTER_CLOSE',
        options: ['Candidate A', 'Candidate B'],
      });
      await service.publishPoll('prince-mess', 'usr_owner_1', secretPoll.id);

      // Resident 1 votes
      await service.castVote('prince-mess', 'usr_resident_1', secretPoll.id, [
        secretPoll.options[0].id,
      ]);

      // Resident 1 views the poll while still open
      const memberView = await service.getPollById(
        'prince-mess',
        secretPoll.id,
        false, // non-staff member!
        'usr_resident_1'
      );

      assert.strictEqual(memberView.resultsLocked, true);
      assert.strictEqual(memberView.totalVotes, 0); // Redacted
      for (const opt of memberView.options) {
        assert.strictEqual(opt.voteCount, 0);
        assert.strictEqual(opt.percentage, 0);
      }

      // Staff viewer can still see true metrics
      const staffView = await service.getPollById('prince-mess', secretPoll.id, true);
      assert.strictEqual(staffView.resultsLocked, false);
      assert.strictEqual(staffView.totalVotes, 1);
    });

    it('zero-vote poll results render safely without division-by-zero error', async () => {
      const emptyPoll = await service.createPoll('prince-mess', 'usr_owner_1', {
        title: 'New Empty Poll',
        options: ['Choice 1', 'Choice 2'],
      });
      await service.publishPoll('prince-mess', 'usr_owner_1', emptyPoll.id);

      const view = await service.getPollById('prince-mess', emptyPoll.id, false, 'usr_resident_2');
      assert.strictEqual(view.totalVotes, 0);
      assert.strictEqual(view.totalVoters, 0);
      for (const opt of view.options) {
        assert.strictEqual(opt.voteCount, 0);
        assert.strictEqual(opt.percentage, 0);
      }
    });

    it('anonymous voting mode does not expose voter identity', async () => {
      // poll_seed_2 is ANONYMOUS
      const poll = await service.getPollById('prince-mess', 'poll_seed_2', false, 'usr_resident_1');
      assert.strictEqual(poll.votingMode, 'ANONYMOUS');
      // No voter names or IDs exposed on Dto
      assert.strictEqual((poll as any).voters, undefined);
    });
  });

  describe('7. Member Suggestions & Moderation Privacy', () => {
    it('member can submit a community proposal', async () => {
      const input: CreateSuggestionInput = {
        title: 'Add Table Tennis Rackets to 3rd Floor',
        description: 'Residents want indoor recreation equipment during monsoon season.',
        category: 'FACILITY',
        isAnonymous: false,
      };

      const result = await service.submitSuggestion('prince-mess', 'usr_resident_1', input);

      assert.ok(result.id);
      assert.strictEqual(result.title, input.title);
      assert.strictEqual(result.status, 'SUBMITTED');
      assert.strictEqual(result.isPublished, false);
      assert.strictEqual(result.adminNotes, null);
    });

    it('unapproved suggestions are hidden from other residents until published', async () => {
      // sug_seed_2 is isPublished = false by usr_resident_2
      const resident1List = await service.listSuggestions(
        'prince-mess',
        {},
        false, // non-staff
        'usr_resident_1'
      );

      // Resident 1 should only see published suggestions or their own (not resident 2's unpublished)
      const foundOtherUnpublished = resident1List.suggestions.find(
        (s) => s.id === 'sug_seed_2'
      );
      assert.strictEqual(foundOtherUnpublished, undefined);

      // Staff sees all suggestions including unpublished
      const staffList = await service.listSuggestions('prince-mess', {}, true);
      const foundInStaff = staffList.suggestions.find((s) => s.id === 'sug_seed_2');
      assert.ok(foundInStaff);
    });

    it('staff can review suggestion and attach internal admin notes', async () => {
      const reviewed = await service.reviewSuggestion('prince-mess', 'usr_owner_1', 'sug_seed_2', {
        status: 'UNDER_REVIEW',
        adminNotes: 'Discussed in monthly mess committee meeting. Cost estimated at 500 BDT.',
        isPublished: true,
      });

      assert.strictEqual(reviewed.status, 'UNDER_REVIEW');
      assert.strictEqual(
        reviewed.adminNotes,
        'Discussed in monthly mess committee meeting. Cost estimated at 500 BDT.'
      );
      assert.strictEqual(reviewed.isPublished, true);
    });
  });

  describe('8. Poll Dashboard Metrics & Overview', () => {
    it('calculates dashboard counts accurately', async () => {
      const dash = await service.getPollDashboard('prince-mess', 'usr_owner_1', true);

      assert.strictEqual(typeof dash.activePollsCount, 'number');
      assert.strictEqual(typeof dash.closedPollsCount, 'number');
      assert.strictEqual(typeof dash.totalVotesCastAllTime, 'number');
      assert.strictEqual(typeof dash.pendingSuggestionsCount, 'number');
      assert.ok(dash.activePollsCount >= 1);
      assert.ok(dash.totalVotesCastAllTime >= 1);
    });
  });
});
