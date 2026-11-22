import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { pollService } from '@/server/polls/poll-service';

export const POST = withMemberAuth(async (req, { memberContext, params }) => {
  const rawId = (params as any)?.id;
  const pollId = Array.isArray(rawId) ? rawId[0] : rawId || '';
  const body = await req.json();

  const selectedOptionIds = body.selectedOptionIds || (body.optionId ? [body.optionId] : []);

  const updatedPoll = await pollService.castVote(
    memberContext.tenantSlug,
    memberContext.userId,
    pollId,
    selectedOptionIds
  );

  return NextResponse.json({
    success: true,
    data: updatedPoll,
    message: 'Your vote has been securely recorded.',
  });
});
