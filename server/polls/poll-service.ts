if (typeof window !== 'undefined') {
  throw new Error('PollService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/server/api/errors';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export type PollType =
  | 'GENERAL_FEEDBACK'
  | 'MEAL_PREFERENCE'
  | 'EVENT_PREFERENCE'
  | 'FACILITY_DECISION'
  | 'COMMUNITY_SUGGESTION'
  | 'OTHER';

export type PollStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
export type VotingMode = 'IDENTIFIED' | 'ANONYMOUS';
export type SelectionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
export type ResultsVisibility = 'ALWAYS' | 'AFTER_VOTE' | 'AFTER_CLOSE' | 'STAFF_ONLY';

export interface PollOptionDto {
  id: string;
  pollId: string;
  text: string;
  orderIndex: number;
  voteCount: number;
  percentage: number;
}

export interface PollDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  title: string;
  description: string | null;
  pollType: PollType | string;
  status: PollStatus | string;
  votingMode: VotingMode | string;
  selectionType: SelectionType | string;
  maxSelections: number;
  resultsVisibility: ResultsVisibility | string;
  startDate: string | null;
  formattedStartDate: string | null;
  endDate: string | null;
  formattedEndDate: string | null;
  createdById: string | null;
  creatorName?: string | null;
  publishedAt: string | null;
  formattedPublishedAt: string | null;
  closedAt: string | null;
  formattedClosedAt: string | null;
  isFeatured: boolean;
  createdAt: string;
  formattedCreatedAt: string;
  options: PollOptionDto[];
  totalVotes: number;
  totalVoters: number;
  hasVoted?: boolean;
  userVoteOptionIds?: string[];
  resultsLocked?: boolean;
}

export interface PollDashboardDto {
  activePollsCount: number;
  closedPollsCount: number;
  draftPollsCount: number;
  totalVotesCastAllTime: number;
  pendingSuggestionsCount: number;
  activePolls: PollDto[];
  recentSuggestions: MemberSuggestionDto[];
}

export interface CreatePollInput {
  title: string;
  description?: string | null;
  pollType?: PollType | string;
  votingMode?: VotingMode | string;
  selectionType?: SelectionType | string;
  maxSelections?: number;
  resultsVisibility?: ResultsVisibility | string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  options: string[];
}

export interface UpdatePollInput {
  title?: string;
  description?: string | null;
  pollType?: PollType | string;
  votingMode?: VotingMode | string;
  selectionType?: SelectionType | string;
  maxSelections?: number;
  resultsVisibility?: ResultsVisibility | string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  options?: string[];
}

export interface MemberSuggestionDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  userId: string;
  userName?: string | null;
  title: string;
  description: string;
  category: string;
  isAnonymous: boolean;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED_FOR_POLL' | 'RESOLVED' | 'DECLINED' | string;
  adminNotes: string | null; // Protected: only staff can see
  isPublished: boolean;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface CreateSuggestionInput {
  title: string;
  description: string;
  category?: string;
  isAnonymous?: boolean;
}

export class PollService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockMemberships: any[] = [];
  public mockPolls: any[] = [];
  public mockPollOptions: any[] = [];
  public mockPollVotes: any[] = [];
  public mockSuggestions: any[] = [];

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || (defaultPrisma as any);
    this.seedMockData();
  }

  public seedMockData() {
    this.mockTenants = [
      {
        id: 'tenant_prince_mess',
        slug: 'prince-mess',
        name: 'Prince Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_owner_1',
        name: 'Prince Mess Manager',
        email: 'manager@prince-mess.dev',
      },
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
      {
        id: 'usr_resident_2',
        name: 'Sabbir Hossain',
        email: 'sabbir@messmate.dev',
      },
      {
        id: 'usr_resident_3',
        name: 'Rahim Uddin',
        email: 'rahim@messmate.dev',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_resident_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        status: 'ACTIVE',
      },
      {
        id: 'mem_resident_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        status: 'ACTIVE',
      },
      {
        id: 'mem_resident_3',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_3',
        status: 'ACTIVE',
      },
      {
        id: 'mem_green_1',
        tenantId: 'tenant_green_villa',
        userId: 'usr_resident_1',
        status: 'ACTIVE',
      },
    ];

    // Seeded Polls
    this.mockPolls = [
      {
        id: 'poll_seed_1',
        referenceNumber: 'POLL-2611-001',
        tenantId: 'tenant_prince_mess',
        title: 'Friday Special Dinner Menu Selection',
        description: 'Choose our community feast menu for this upcoming Friday dinner.',
        pollType: 'MEAL_PREFERENCE',
        status: 'PUBLISHED',
        votingMode: 'IDENTIFIED',
        selectionType: 'SINGLE_CHOICE',
        maxSelections: 1,
        resultsVisibility: 'ALWAYS',
        startDate: new Date('2026-11-20T00:00:00Z'),
        endDate: new Date('2026-11-28T23:59:59Z'),
        createdById: 'usr_owner_1',
        publishedAt: new Date('2026-11-20T10:00:00Z'),
        closedAt: null,
        isFeatured: true,
        createdAt: new Date('2026-11-20T09:00:00Z'),
        updatedAt: new Date('2026-11-20T10:00:00Z'),
      },
      {
        id: 'poll_seed_2',
        referenceNumber: 'POLL-2611-002',
        tenantId: 'tenant_prince_mess',
        title: 'High-Speed Broadband ISP Upgrade Provider',
        description: 'Select your preferred Internet Service Provider for optical fiber upgrade.',
        pollType: 'FACILITY_DECISION',
        status: 'CLOSED',
        votingMode: 'ANONYMOUS',
        selectionType: 'SINGLE_CHOICE',
        maxSelections: 1,
        resultsVisibility: 'AFTER_CLOSE',
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-15T23:59:59Z'),
        createdById: 'usr_owner_1',
        publishedAt: new Date('2026-11-01T10:00:00Z'),
        closedAt: new Date('2026-11-16T00:00:00Z'),
        isFeatured: false,
        createdAt: new Date('2026-11-01T09:00:00Z'),
        updatedAt: new Date('2026-11-16T00:00:00Z'),
      },
      {
        id: 'poll_green_1',
        referenceNumber: 'POLL-GV-001',
        tenantId: 'tenant_green_villa',
        title: 'Green Villa Rooftop Garden Cleaning Schedule',
        description: 'Vote on weekly community rooftop cleaning slot.',
        pollType: 'GENERAL_FEEDBACK',
        status: 'PUBLISHED',
        votingMode: 'IDENTIFIED',
        selectionType: 'SINGLE_CHOICE',
        maxSelections: 1,
        resultsVisibility: 'ALWAYS',
        startDate: new Date('2026-11-20T00:00:00Z'),
        endDate: new Date('2026-11-30T23:59:59Z'),
        createdById: 'usr_owner_1',
        publishedAt: new Date('2026-11-20T10:00:00Z'),
        closedAt: null,
        isFeatured: false,
        createdAt: new Date('2026-11-20T09:00:00Z'),
        updatedAt: new Date('2026-11-20T10:00:00Z'),
      },
    ];

    // Seeded Options
    this.mockPollOptions = [
      // For poll_seed_1
      {
        id: 'opt_1_1',
        pollId: 'poll_seed_1',
        text: 'Kacchi Biryani with Borhani',
        orderIndex: 0,
        voteCount: 1,
      },
      {
        id: 'opt_1_2',
        pollId: 'poll_seed_1',
        text: 'Beef Khichuri with Fried Eggplant',
        orderIndex: 1,
        voteCount: 0,
      },
      {
        id: 'opt_1_3',
        pollId: 'poll_seed_1',
        text: 'Chicken Roast & Polao with Firni',
        orderIndex: 2,
        voteCount: 0,
      },
      // For poll_seed_2
      {
        id: 'opt_2_1',
        pollId: 'poll_seed_2',
        text: 'Carnival Broadband (100 Mbps Dedicated)',
        orderIndex: 0,
        voteCount: 2,
      },
      {
        id: 'opt_2_2',
        pollId: 'poll_seed_2',
        text: 'AmberIT Fiber (80 Mbps)',
        orderIndex: 1,
        voteCount: 1,
      },
      // For poll_green_1
      {
        id: 'opt_gv_1',
        pollId: 'poll_green_1',
        text: 'Friday Morning 8:00 AM',
        orderIndex: 0,
        voteCount: 0,
      },
      {
        id: 'opt_gv_2',
        pollId: 'poll_green_1',
        text: 'Saturday Evening 5:00 PM',
        orderIndex: 1,
        voteCount: 0,
      },
    ];

    // Seeded Votes
    this.mockPollVotes = [
      {
        id: 'vote_1_1',
        tenantId: 'tenant_prince_mess',
        pollId: 'poll_seed_1',
        optionId: 'opt_1_1',
        userId: 'usr_resident_1',
        membershipId: 'mem_resident_1',
        createdAt: new Date('2026-11-21T12:00:00Z'),
      },
      {
        id: 'vote_2_1',
        tenantId: 'tenant_prince_mess',
        pollId: 'poll_seed_2',
        optionId: 'opt_2_1',
        userId: 'usr_resident_1',
        membershipId: 'mem_resident_1',
        createdAt: new Date('2026-11-05T12:00:00Z'),
      },
      {
        id: 'vote_2_2',
        tenantId: 'tenant_prince_mess',
        pollId: 'poll_seed_2',
        optionId: 'opt_2_1',
        userId: 'usr_resident_2',
        membershipId: 'mem_resident_2',
        createdAt: new Date('2026-11-06T14:00:00Z'),
      },
      {
        id: 'vote_2_3',
        tenantId: 'tenant_prince_mess',
        pollId: 'poll_seed_2',
        optionId: 'opt_2_2',
        userId: 'usr_resident_3',
        membershipId: 'mem_resident_3',
        createdAt: new Date('2026-11-07T16:00:00Z'),
      },
    ];

    // Seeded Suggestions
    this.mockSuggestions = [
      {
        id: 'sug_seed_1',
        referenceNumber: 'SUG-2611-001',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        membershipId: 'mem_resident_1',
        title: 'Install RO Drinking Water Purifier Filter in 2nd Floor Dining',
        description: 'The current dispenser filter is frequently clogged. A multi-stage RO filter would significantly improve water quality.',
        category: 'FACILITY',
        isAnonymous: false,
        status: 'UNDER_REVIEW',
        adminNotes: 'Requested quotes from Eureka Forbes and Walton.',
        isPublished: true,
        createdAt: new Date('2026-11-18T10:00:00Z'),
        updatedAt: new Date('2026-11-19T10:00:00Z'),
      },
      {
        id: 'sug_seed_2',
        referenceNumber: 'SUG-2611-002',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        membershipId: 'mem_resident_2',
        title: 'Change Breakfast Timing on Sundays to 10:30 AM',
        description: 'Most residents wake up late on weekends. Extending breakfast to 10:30 AM will avoid wasted meal preparations.',
        category: 'MEAL',
        isAnonymous: true,
        status: 'SUBMITTED',
        adminNotes: null,
        isPublished: false,
        createdAt: new Date('2026-11-22T08:00:00Z'),
        updatedAt: new Date('2026-11-22T08:00:00Z'),
      },
    ];
  }

  private isDbConfigured(): boolean {
    return inspectDatabaseConfig().configured;
  }

  private async resolveTenant(tenantSlug: string): Promise<any> {
    if (this.isDbConfigured()) {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
      }
      return tenant;
    }

    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!mock) {
      throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
    }
    if (mock.status === 'SUSPENDED') {
      throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
    }
    return mock;
  }

  private mapPollToDto(
    poll: any,
    options: {
      isStaff?: boolean;
      requestingUserId?: string;
      userMap?: Map<string, string>;
      votes?: any[];
      optionsList?: any[];
    } = {}
  ): PollDto {
    const isStaff = options.isStaff !== false;
    const requestingUserId = options.requestingUserId;
    const rawOptions = options.optionsList || poll.options || [];

    // Calculate votes
    const allVotes = options.votes || poll.votes || [];
    const userVotes = requestingUserId
      ? allVotes.filter((v: any) => v.userId === requestingUserId)
      : [];
    const hasVoted = userVotes.length > 0;
    const userVoteOptionIds = userVotes.map((v: any) => v.optionId);

    // Unique voters count
    const uniqueVoters = new Set(allVotes.map((v: any) => v.userId)).size;
    const totalVotes = allVotes.length;

    // Results visibility logic
    // Visibility modes: ALWAYS, AFTER_VOTE, AFTER_CLOSE, STAFF_ONLY
    let resultsLocked = false;
    if (!isStaff) {
      if (poll.resultsVisibility === 'STAFF_ONLY') {
        resultsLocked = true;
      } else if (poll.resultsVisibility === 'AFTER_CLOSE' && poll.status !== 'CLOSED') {
        resultsLocked = true;
      } else if (poll.resultsVisibility === 'AFTER_VOTE' && !hasVoted && poll.status !== 'CLOSED') {
        resultsLocked = true;
      }
    }

    // Map options with safe percentage calculation
    const mappedOptions: PollOptionDto[] = rawOptions
      .sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0))
      .map((opt: any) => {
        const count = resultsLocked ? 0 : opt.voteCount || 0;
        const percentage =
          resultsLocked || totalVotes === 0
            ? 0
            : Math.round((count / totalVotes) * 100);

        return {
          id: opt.id,
          pollId: opt.pollId,
          text: opt.text,
          orderIndex: opt.orderIndex || 0,
          voteCount: count,
          percentage,
        };
      });

    const creatorName =
      poll.creator?.name ||
      (poll.createdById && options.userMap ? options.userMap.get(poll.createdById) : null) ||
      null;

    return {
      id: poll.id,
      referenceNumber: poll.referenceNumber,
      tenantId: poll.tenantId,
      title: poll.title,
      description: poll.description || null,
      pollType: poll.pollType,
      status: poll.status,
      votingMode: poll.votingMode,
      selectionType: poll.selectionType,
      maxSelections: poll.maxSelections || 1,
      resultsVisibility: poll.resultsVisibility,
      startDate: poll.startDate ? poll.startDate.toISOString() : null,
      formattedStartDate: poll.startDate ? formatDhakaDateTime(poll.startDate) : null,
      endDate: poll.endDate ? poll.endDate.toISOString() : null,
      formattedEndDate: poll.endDate ? formatDhakaDateTime(poll.endDate) : null,
      createdById: poll.createdById || null,
      creatorName,
      publishedAt: poll.publishedAt ? poll.publishedAt.toISOString() : null,
      formattedPublishedAt: poll.publishedAt ? formatDhakaDateTime(poll.publishedAt) : null,
      closedAt: poll.closedAt ? poll.closedAt.toISOString() : null,
      formattedClosedAt: poll.closedAt ? formatDhakaDateTime(poll.closedAt) : null,
      isFeatured: !!poll.isFeatured,
      createdAt: poll.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(poll.createdAt),
      options: mappedOptions,
      totalVotes: resultsLocked ? 0 : totalVotes,
      totalVoters: resultsLocked ? 0 : uniqueVoters,
      hasVoted,
      userVoteOptionIds,
      resultsLocked,
    };
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD & EXECUTIVE KPIS
  // ---------------------------------------------------------------------------

  async getPollDashboard(
    tenantSlug: string,
    requestingUserId?: string,
    isStaff = true
  ): Promise<PollDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const [polls, suggestions, totalVotesCount] = await Promise.all([
        this.db.poll.findMany({
          where: { tenantId: tenant.id },
          include: {
            options: true,
            votes: true,
            creator: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.db.memberSuggestion.findMany({
          where: { tenantId: tenant.id },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        this.db.pollVote.count({ where: { tenantId: tenant.id } }),
      ]);

      let activePollsCount = 0;
      let closedPollsCount = 0;
      let draftPollsCount = 0;

      for (const p of polls) {
        if (p.status === 'PUBLISHED') activePollsCount++;
        else if (p.status === 'CLOSED') closedPollsCount++;
        else if (p.status === 'DRAFT') draftPollsCount++;
      }

      const activePolls = polls
        .filter((p) => p.status === 'PUBLISHED')
        .map((p: any) => this.mapPollToDto(p, { isStaff, requestingUserId }));

      const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'SUBMITTED').length;

      const mappedSuggestions: MemberSuggestionDto[] = suggestions.slice(0, 5).map((s: any) => ({
        id: s.id,
        referenceNumber: s.referenceNumber,
        tenantId: s.tenantId,
        userId: s.userId,
        userName: s.isAnonymous && !isStaff ? 'Anonymous Resident' : s.user?.name || 'Resident',
        title: s.title,
        description: s.description,
        category: s.category,
        isAnonymous: s.isAnonymous,
        status: s.status,
        adminNotes: isStaff ? s.adminNotes : null,
        isPublished: s.isPublished,
        createdAt: s.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(s.createdAt),
        updatedAt: s.updatedAt.toISOString(),
      }));

      return {
        activePollsCount,
        closedPollsCount,
        draftPollsCount,
        totalVotesCastAllTime: totalVotesCount,
        pendingSuggestionsCount,
        activePolls,
        recentSuggestions: mappedSuggestions,
      };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const polls = this.mockPolls.filter((p) => p.tenantId === tenant.id);
    const votes = this.mockPollVotes.filter((v) => v.tenantId === tenant.id);
    const suggestions = this.mockSuggestions.filter((s) => s.tenantId === tenant.id);

    let activePollsCount = 0;
    let closedPollsCount = 0;
    let draftPollsCount = 0;

    for (const p of polls) {
      if (p.status === 'PUBLISHED') activePollsCount++;
      else if (p.status === 'CLOSED') closedPollsCount++;
      else if (p.status === 'DRAFT') draftPollsCount++;
    }

    const activePolls = polls
      .filter((p) => p.status === 'PUBLISHED')
      .map((p) => {
        const pollOpts = this.mockPollOptions.filter((o) => o.pollId === p.id);
        const pollVotes = votes.filter((v) => v.pollId === p.id);
        return this.mapPollToDto(p, {
          isStaff,
          requestingUserId,
          userMap,
          optionsList: pollOpts,
          votes: pollVotes,
        });
      });

    const pendingSuggestionsCount = suggestions.filter((s) => s.status === 'SUBMITTED').length;

    const mappedSuggestions: MemberSuggestionDto[] = suggestions.slice(0, 5).map((s) => ({
      id: s.id,
      referenceNumber: s.referenceNumber,
      tenantId: s.tenantId,
      userId: s.userId,
      userName: s.isAnonymous && !isStaff ? 'Anonymous Resident' : userMap.get(s.userId) || 'Resident',
      title: s.title,
      description: s.description,
      category: s.category,
      isAnonymous: s.isAnonymous,
      status: s.status,
      adminNotes: isStaff ? s.adminNotes : null,
      isPublished: s.isPublished,
      createdAt: s.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(s.createdAt),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      activePollsCount,
      closedPollsCount,
      draftPollsCount,
      totalVotesCastAllTime: votes.length,
      pendingSuggestionsCount,
      activePolls,
      recentSuggestions: mappedSuggestions,
    };
  }

  // ---------------------------------------------------------------------------
  // LIST POLLS
  // ---------------------------------------------------------------------------

  async listPolls(
    tenantSlug: string,
    filters: {
      status?: string;
      pollType?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
    isStaff = true,
    requestingUserId?: string
  ): Promise<{ polls: PollDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };

      // Non-staff members only see PUBLISHED or CLOSED polls
      if (!isStaff) {
        where.status = { in: ['PUBLISHED', 'CLOSED'] };
      } else if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status;
      }

      if (filters.pollType && filters.pollType !== 'ALL') {
        where.pollType = filters.pollType;
      }

      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        where.OR = [
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, rawPolls] = await Promise.all([
        this.db.poll.count({ where }),
        this.db.poll.findMany({
          where,
          include: {
            options: true,
            votes: true,
            creator: { select: { name: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const polls = rawPolls.map((p: any) =>
        this.mapPollToDto(p, { isStaff, requestingUserId })
      );

      return { polls, total };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    let filtered = this.mockPolls.filter((p) => p.tenantId === tenant.id);

    if (!isStaff) {
      filtered = filtered.filter((p) => p.status === 'PUBLISHED' || p.status === 'CLOSED');
    } else if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.pollType && filters.pollType !== 'ALL') {
      filtered = filtered.filter((p) => p.pollType === filters.pollType);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.referenceNumber.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const paginated = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    const polls = paginated.map((p) => {
      const pollOpts = this.mockPollOptions.filter((o) => o.pollId === p.id);
      const pollVotes = this.mockPollVotes.filter((v) => v.pollId === p.id);
      return this.mapPollToDto(p, {
        isStaff,
        requestingUserId,
        userMap,
        optionsList: pollOpts,
        votes: pollVotes,
      });
    });

    return { polls, total };
  }

  // ---------------------------------------------------------------------------
  // GET POLL BY ID
  // ---------------------------------------------------------------------------

  async getPollById(
    tenantSlug: string,
    pollId: string,
    isStaff = true,
    requestingUserId?: string
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const poll = await this.db.poll.findFirst({
        where: { id: pollId, tenantId: tenant.id },
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      if (!poll) {
        throw new NotFoundError('Community poll not found.');
      }

      if (!isStaff && poll.status === 'DRAFT') {
        throw new NotFoundError('Community poll not found.');
      }

      return this.mapPollToDto(poll, { isStaff, requestingUserId });
    }

    // In-memory fallback
    const poll = this.mockPolls.find((p) => p.id === pollId && p.tenantId === tenant.id);
    if (!poll) {
      throw new NotFoundError('Community poll not found.');
    }

    if (!isStaff && poll.status === 'DRAFT') {
      throw new NotFoundError('Community poll not found.');
    }

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const pollOpts = this.mockPollOptions.filter((o) => o.pollId === poll.id);
    const pollVotes = this.mockPollVotes.filter((v) => v.pollId === poll.id);

    return this.mapPollToDto(poll, {
      isStaff,
      requestingUserId,
      userMap,
      optionsList: pollOpts,
      votes: pollVotes,
    });
  }

  // ---------------------------------------------------------------------------
  // CREATE POLL
  // ---------------------------------------------------------------------------

  async createPoll(
    tenantSlug: string,
    staffUserId: string,
    input: CreatePollInput
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Poll title is required.');
    }

    const cleanOptions = (input.options || [])
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (cleanOptions.length < 2) {
      throw new ValidationError('At least 2 distinct voting options are required.');
    }

    const start = input.startDate ? new Date(input.startDate) : null;
    const end = input.endDate ? new Date(input.endDate) : null;

    if (start && isNaN(start.getTime())) {
      throw new ValidationError('Invalid poll start date.');
    }
    if (end && isNaN(end.getTime())) {
      throw new ValidationError('Invalid poll end date.');
    }
    if (start && end && end <= start) {
      throw new ValidationError('Poll closing date must be after the start date.');
    }

    const maxSel =
      input.selectionType === 'MULTIPLE_CHOICE'
        ? Math.min(Math.max(input.maxSelections || 2, 2), cleanOptions.length)
        : 1;

    const refNumber = `POLL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    if (this.isDbConfigured()) {
      const created = await this.db.poll.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          pollType: input.pollType || 'GENERAL_FEEDBACK',
          status: 'DRAFT',
          votingMode: input.votingMode || 'IDENTIFIED',
          selectionType: input.selectionType || 'SINGLE_CHOICE',
          maxSelections: maxSel,
          resultsVisibility: input.resultsVisibility || 'ALWAYS',
          startDate: start,
          endDate: end,
          createdById: staffUserId,
          options: {
            create: cleanOptions.map((optText, index) => ({
              text: optText,
              orderIndex: index,
            })),
          },
        },
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      return this.mapPollToDto(created, { isStaff: true });
    }

    // In-memory fallback
    const now = new Date();
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPoll = {
      id: pollId,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      pollType: input.pollType || 'GENERAL_FEEDBACK',
      status: 'DRAFT',
      votingMode: input.votingMode || 'IDENTIFIED',
      selectionType: input.selectionType || 'SINGLE_CHOICE',
      maxSelections: maxSel,
      resultsVisibility: input.resultsVisibility || 'ALWAYS',
      startDate: start,
      endDate: end,
      createdById: staffUserId,
      publishedAt: null,
      closedAt: null,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    };

    const newOptions = cleanOptions.map((optText, index) => ({
      id: `opt_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
      pollId,
      text: optText,
      orderIndex: index,
      voteCount: 0,
    }));

    this.mockPolls.unshift(newPoll);
    this.mockPollOptions.push(...newOptions);

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return this.mapPollToDto(newPoll, {
      isStaff: true,
      userMap,
      optionsList: newOptions,
      votes: [],
    });
  }

  // ---------------------------------------------------------------------------
  // UPDATE DRAFT POLL
  // ---------------------------------------------------------------------------

  async updatePoll(
    tenantSlug: string,
    staffUserId: string,
    pollId: string,
    input: UpdatePollInput
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const poll = await this.getPollById(tenantSlug, pollId, true);

    // Rule: Options and core voting rules cannot be altered once votes exist
    if (poll.totalVotes > 0 && input.options && input.options.length > 0) {
      throw new ConflictError('Cannot modify poll options after voting has commenced.');
    }

    if (this.isDbConfigured()) {
      const updateData: any = {};
      if (input.title) updateData.title = input.title.trim();
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.pollType) updateData.pollType = input.pollType;
      if (input.resultsVisibility) updateData.resultsVisibility = input.resultsVisibility;
      if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate) : null;
      if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;

      const updated = await this.db.poll.update({
        where: { id: pollId },
        data: updateData,
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      return this.mapPollToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockPolls.find((p) => p.id === pollId && p.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Community poll not found.');
    }

    if (input.title) target.title = input.title.trim();
    if (input.description !== undefined) target.description = input.description?.trim() || null;
    if (input.pollType) target.pollType = input.pollType;
    if (input.resultsVisibility) target.resultsVisibility = input.resultsVisibility;
    if (input.startDate !== undefined) target.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.endDate !== undefined) target.endDate = input.endDate ? new Date(input.endDate) : null;
    target.updatedAt = new Date();

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const pollOpts = this.mockPollOptions.filter((o) => o.pollId === poll.id);
    const pollVotes = this.mockPollVotes.filter((v) => v.pollId === poll.id);

    return this.mapPollToDto(target, {
      isStaff: true,
      userMap,
      optionsList: pollOpts,
      votes: pollVotes,
    });
  }

  // ---------------------------------------------------------------------------
  // PUBLISH POLL
  // ---------------------------------------------------------------------------

  async publishPoll(
    tenantSlug: string,
    staffUserId: string,
    pollId: string
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const poll = await this.getPollById(tenantSlug, pollId, true);

    if (poll.status === 'PUBLISHED') {
      throw new ValidationError('Poll is already published.');
    }
    if (poll.status === 'CLOSED' || poll.status === 'CANCELLED') {
      throw new ValidationError(`Cannot publish a poll with status '${poll.status}'.`);
    }

    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.poll.update({
        where: { id: pollId },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
        },
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      await this.notifyMembersPollPublished(tenantSlug, updated);
      return this.mapPollToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockPolls.find((p) => p.id === pollId && p.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Community poll not found.');
    }

    target.status = 'PUBLISHED';
    target.publishedAt = now;
    target.updatedAt = now;

    await this.notifyMembersPollPublished(tenantSlug, target);

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const pollOpts = this.mockPollOptions.filter((o) => o.pollId === poll.id);
    const pollVotes = this.mockPollVotes.filter((v) => v.pollId === poll.id);

    return this.mapPollToDto(target, {
      isStaff: true,
      userMap,
      optionsList: pollOpts,
      votes: pollVotes,
    });
  }

  // ---------------------------------------------------------------------------
  // CLOSE POLL
  // ---------------------------------------------------------------------------

  async closePoll(
    tenantSlug: string,
    staffUserId: string,
    pollId: string
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const poll = await this.getPollById(tenantSlug, pollId, true);

    if (poll.status === 'CLOSED') {
      throw new ValidationError('Poll is already closed.');
    }

    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.poll.update({
        where: { id: pollId },
        data: {
          status: 'CLOSED',
          closedAt: now,
        },
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      await this.notifyMembersPollClosed(tenantSlug, updated);
      return this.mapPollToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockPolls.find((p) => p.id === pollId && p.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Community poll not found.');
    }

    target.status = 'CLOSED';
    target.closedAt = now;
    target.updatedAt = now;

    await this.notifyMembersPollClosed(tenantSlug, target);

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const pollOpts = this.mockPollOptions.filter((o) => o.pollId === poll.id);
    const pollVotes = this.mockPollVotes.filter((v) => v.pollId === poll.id);

    return this.mapPollToDto(target, {
      isStaff: true,
      userMap,
      optionsList: pollOpts,
      votes: pollVotes,
    });
  }

  // ---------------------------------------------------------------------------
  // CANCEL POLL
  // ---------------------------------------------------------------------------

  async cancelPoll(
    tenantSlug: string,
    staffUserId: string,
    pollId: string,
    reason?: string
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const poll = await this.getPollById(tenantSlug, pollId, true);

    const now = new Date();

    if (this.isDbConfigured()) {
      const updated = await this.db.poll.update({
        where: { id: pollId },
        data: {
          status: 'CANCELLED',
        },
        include: {
          options: true,
          votes: true,
          creator: { select: { name: true } },
        },
      });

      return this.mapPollToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockPolls.find((p) => p.id === pollId && p.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Community poll not found.');
    }

    target.status = 'CANCELLED';
    target.updatedAt = now;

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const pollOpts = this.mockPollOptions.filter((o) => o.pollId === poll.id);
    const pollVotes = this.mockPollVotes.filter((v) => v.pollId === poll.id);

    return this.mapPollToDto(target, {
      isStaff: true,
      userMap,
      optionsList: pollOpts,
      votes: pollVotes,
    });
  }

  // ---------------------------------------------------------------------------
  // CAST VOTE
  // ---------------------------------------------------------------------------

  async castVote(
    tenantSlug: string,
    voterUserId: string,
    pollId: string,
    selectedOptionIds: string[]
  ): Promise<PollDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const poll = await this.getPollById(tenantSlug, pollId, true);

    // Rule 1: Poll must be in PUBLISHED state
    if (poll.status !== 'PUBLISHED') {
      throw new ValidationError(`Voting is not active. This poll is currently ${poll.status}.`);
    }

    // Rule 2: Active voting window
    const now = new Date();
    if (poll.startDate && new Date(poll.startDate) > now) {
      throw new ValidationError('Voting has not started yet.');
    }
    if (poll.endDate && new Date(poll.endDate) < now) {
      throw new ValidationError('Voting for this poll has ended.');
    }

    // Rule 3: Voter eligibility (Must be active member of this tenant)
    let voterMembershipId: string | null = null;
    if (this.isDbConfigured()) {
      const membership = await this.db.membership.findFirst({
        where: { tenantId: tenant.id, userId: voterUserId, status: 'ACTIVE' },
      });
      if (!membership) {
        throw new ForbiddenError('Only active members of this mess are eligible to vote.');
      }
      voterMembershipId = membership.id;

      // Rule 4: Prevent duplicate voting
      const existingVote = await this.db.pollVote.findFirst({
        where: { pollId: poll.id, userId: voterUserId },
      });
      if (existingVote) {
        throw new ConflictError('You have already cast your vote on this poll.');
      }
    } else {
      const membership = this.mockMemberships.find(
        (m) => m.tenantId === tenant.id && m.userId === voterUserId && m.status === 'ACTIVE'
      );
      if (!membership) {
        throw new ForbiddenError('Only active members of this mess are eligible to vote.');
      }
      voterMembershipId = membership.id;

      const existingVote = this.mockPollVotes.find(
        (v) => v.pollId === poll.id && v.userId === voterUserId
      );
      if (existingVote) {
        throw new ConflictError('You have already cast your vote on this poll.');
      }
    }

    // Rule 5: Validate option selections
    if (!selectedOptionIds || !Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) {
      throw new ValidationError('Please select at least one option.');
    }

    const uniqueSelected = Array.from(new Set(selectedOptionIds));

    if (poll.selectionType === 'SINGLE_CHOICE' && uniqueSelected.length !== 1) {
      throw new ValidationError('This is a single-choice poll. Only 1 option may be selected.');
    }

    if (poll.selectionType === 'MULTIPLE_CHOICE' && uniqueSelected.length > poll.maxSelections) {
      throw new ValidationError(
        `You may select at most ${poll.maxSelections} option${poll.maxSelections > 1 ? 's' : ''}.`
      );
    }

    // Validate that all selected options belong to this poll
    const validOptionIds = new Set(poll.options.map((o) => o.id));
    for (const optId of uniqueSelected) {
      if (!validOptionIds.has(optId)) {
        throw new ValidationError(`Option ID '${optId}' does not belong to this poll.`);
      }
    }

    // Record votes atomically
    if (this.isDbConfigured()) {
      await this.db.$transaction(async (tx) => {
        for (const optId of uniqueSelected) {
          await tx.pollVote.create({
            data: {
              tenantId: tenant.id,
              pollId: poll.id,
              optionId: optId,
              userId: voterUserId,
              membershipId: voterMembershipId,
            },
          });
          await tx.pollOption.update({
            where: { id: optId },
            data: { voteCount: { increment: 1 } },
          });
        }
      });

      return this.getPollById(tenantSlug, pollId, false, voterUserId);
    }

    // In-memory fallback
    for (const optId of uniqueSelected) {
      this.mockPollVotes.push({
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: tenant.id,
        pollId: poll.id,
        optionId: optId,
        userId: voterUserId,
        membershipId: voterMembershipId,
        createdAt: now,
      });

      const opt = this.mockPollOptions.find((o) => o.id === optId);
      if (opt) {
        opt.voteCount = (opt.voteCount || 0) + 1;
      }
    }

    return this.getPollById(tenantSlug, pollId, false, voterUserId);
  }

  // ---------------------------------------------------------------------------
  // MEMBER SUGGESTIONS
  // ---------------------------------------------------------------------------

  async submitSuggestion(
    tenantSlug: string,
    userId: string,
    input: CreateSuggestionInput
  ): Promise<MemberSuggestionDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Suggestion title is required.');
    }
    if (!input.description || !input.description.trim()) {
      throw new ValidationError('Suggestion description is required.');
    }

    const refNumber = `SUG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    if (this.isDbConfigured()) {
      const membership = await this.db.membership.findFirst({
        where: { tenantId: tenant.id, userId, status: 'ACTIVE' },
      });
      if (!membership) {
        throw new ForbiddenError('Only active members of this mess can submit suggestions.');
      }

      const created = await this.db.memberSuggestion.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          userId,
          membershipId: membership.id,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category || 'GENERAL',
          isAnonymous: !!input.isAnonymous,
          status: 'SUBMITTED',
        },
        include: { user: { select: { name: true } } },
      });

      return {
        id: created.id,
        referenceNumber: created.referenceNumber,
        tenantId: created.tenantId,
        userId: created.userId,
        userName: created.isAnonymous ? 'Anonymous Resident' : created.user?.name || 'Resident',
        title: created.title,
        description: created.description,
        category: created.category,
        isAnonymous: created.isAnonymous,
        status: created.status,
        adminNotes: null,
        isPublished: created.isPublished,
        createdAt: created.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(created.createdAt),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    // In-memory fallback
    const membership = this.mockMemberships.find(
      (m) => m.tenantId === tenant.id && m.userId === userId && m.status === 'ACTIVE'
    );
    if (!membership) {
      throw new ForbiddenError('Only active members of this mess can submit suggestions.');
    }

    const now = new Date();
    const newSug = {
      id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      userId,
      membershipId: membership.id,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category || 'GENERAL',
      isAnonymous: !!input.isAnonymous,
      status: 'SUBMITTED',
      adminNotes: null,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    this.mockSuggestions.unshift(newSug);
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));

    return {
      id: newSug.id,
      referenceNumber: newSug.referenceNumber,
      tenantId: newSug.tenantId,
      userId: newSug.userId,
      userName: newSug.isAnonymous ? 'Anonymous Resident' : userMap.get(userId) || 'Resident',
      title: newSug.title,
      description: newSug.description,
      category: newSug.category,
      isAnonymous: newSug.isAnonymous,
      status: newSug.status,
      adminNotes: null,
      isPublished: newSug.isPublished,
      createdAt: newSug.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(newSug.createdAt),
      updatedAt: newSug.updatedAt.toISOString(),
    };
  }

  async listSuggestions(
    tenantSlug: string,
    filters: {
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {},
    isStaff = false,
    requestingUserId?: string
  ): Promise<{ suggestions: MemberSuggestionDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    if (this.isDbConfigured()) {
      const where: any = { tenantId: tenant.id };

      if (!isStaff) {
        // Members see their own suggestions OR suggestions that admin published
        if (requestingUserId) {
          where.OR = [
            { userId: requestingUserId },
            { isPublished: true },
          ];
        } else {
          where.isPublished = true;
        }
      } else {
        if (filters.status && filters.status !== 'ALL') {
          where.status = filters.status;
        }
      }

      if (filters.category && filters.category !== 'ALL') {
        where.category = filters.category;
      }

      const [total, rawList] = await Promise.all([
        this.db.memberSuggestion.count({ where }),
        this.db.memberSuggestion.findMany({
          where,
          include: { user: { select: { name: true } } },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const suggestions: MemberSuggestionDto[] = rawList.map((s: any) => ({
        id: s.id,
        referenceNumber: s.referenceNumber,
        tenantId: s.tenantId,
        userId: s.userId,
        userName: s.isAnonymous && !isStaff ? 'Anonymous Resident' : s.user?.name || 'Resident',
        title: s.title,
        description: s.description,
        category: s.category,
        isAnonymous: s.isAnonymous,
        status: s.status,
        adminNotes: isStaff ? s.adminNotes : null,
        isPublished: s.isPublished,
        createdAt: s.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(s.createdAt),
        updatedAt: s.updatedAt.toISOString(),
      }));

      return { suggestions, total };
    }

    // In-memory fallback
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    let filtered = this.mockSuggestions.filter((s) => s.tenantId === tenant.id);

    if (!isStaff) {
      if (requestingUserId) {
        filtered = filtered.filter((s) => s.userId === requestingUserId || s.isPublished);
      } else {
        filtered = filtered.filter((s) => s.isPublished);
      }
    } else {
      if (filters.status && filters.status !== 'ALL') {
        filtered = filtered.filter((s) => s.status === filters.status);
      }
    }

    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter((s) => s.category === filters.category);
    }

    const total = filtered.length;
    const paginated = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    const suggestions: MemberSuggestionDto[] = paginated.map((s) => ({
      id: s.id,
      referenceNumber: s.referenceNumber,
      tenantId: s.tenantId,
      userId: s.userId,
      userName: s.isAnonymous && !isStaff ? 'Anonymous Resident' : userMap.get(s.userId) || 'Resident',
      title: s.title,
      description: s.description,
      category: s.category,
      isAnonymous: s.isAnonymous,
      status: s.status,
      adminNotes: isStaff ? s.adminNotes : null,
      isPublished: s.isPublished,
      createdAt: s.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(s.createdAt),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { suggestions, total };
  }

  async reviewSuggestion(
    tenantSlug: string,
    staffUserId: string,
    suggestionId: string,
    update: {
      status?: 'UNDER_REVIEW' | 'APPROVED_FOR_POLL' | 'RESOLVED' | 'DECLINED' | string;
      adminNotes?: string | null;
      isPublished?: boolean;
    }
  ): Promise<MemberSuggestionDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const existing = await this.db.memberSuggestion.findFirst({
        where: { id: suggestionId, tenantId: tenant.id },
      });
      if (!existing) {
        throw new NotFoundError('Member suggestion not found.');
      }

      const updated = await this.db.memberSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: update.status || existing.status,
          adminNotes: update.adminNotes !== undefined ? update.adminNotes : existing.adminNotes,
          isPublished: update.isPublished !== undefined ? update.isPublished : existing.isPublished,
        },
        include: { user: { select: { name: true } } },
      });

      return {
        id: updated.id,
        referenceNumber: updated.referenceNumber,
        tenantId: updated.tenantId,
        userId: updated.userId,
        userName: updated.user?.name || 'Resident',
        title: updated.title,
        description: updated.description,
        category: updated.category,
        isAnonymous: updated.isAnonymous,
        status: updated.status,
        adminNotes: updated.adminNotes,
        isPublished: updated.isPublished,
        createdAt: updated.createdAt.toISOString(),
        formattedCreatedAt: formatDhakaDateTime(updated.createdAt),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    // In-memory fallback
    const target = this.mockSuggestions.find((s) => s.id === suggestionId && s.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Member suggestion not found.');
    }

    if (update.status) target.status = update.status;
    if (update.adminNotes !== undefined) target.adminNotes = update.adminNotes;
    if (update.isPublished !== undefined) target.isPublished = update.isPublished;
    target.updatedAt = new Date();

    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    return {
      id: target.id,
      referenceNumber: target.referenceNumber,
      tenantId: target.tenantId,
      userId: target.userId,
      userName: userMap.get(target.userId) || 'Resident',
      title: target.title,
      description: target.description,
      category: target.category,
      isAnonymous: target.isAnonymous,
      status: target.status,
      adminNotes: target.adminNotes,
      isPublished: target.isPublished,
      createdAt: target.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(target.createdAt),
      updatedAt: target.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS INTEGRATION
  // ---------------------------------------------------------------------------

  private async notifyMembersPollPublished(tenantSlug: string, poll: any) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: poll.tenantId, // Broadcast
        category: 'POLL',
        title: `New Community Poll: ${poll.title}`,
        message: `Your voice matters! A new community poll has been published. Participate and cast your vote before ${formatDhakaDateTime(poll.endDate || new Date())}.`,
        link: `/portal/${tenantSlug}/polls`,
        eventReference: `POLL_PUB_${poll.id}`,
      });
    } catch (err: any) {
      console.warn('[PollService] Notification publish warning:', err?.message || err);
    }
  }

  private async notifyMembersPollClosed(tenantSlug: string, poll: any) {
    try {
      await tenantNotificationService.createNotification({
        tenantSlug,
        userId: poll.tenantId, // Broadcast
        category: 'POLL',
        title: `Poll Closed: ${poll.title}`,
        message: `Voting has closed for "${poll.title}". Community results are now available.`,
        link: `/portal/${tenantSlug}/polls`,
        eventReference: `POLL_CLOSE_${poll.id}`,
      });
    } catch (err: any) {
      console.warn('[PollService] Notification close warning:', err?.message || err);
    }
  }
}

export const pollService = new PollService();
