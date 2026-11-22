import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withMemberAuth(async (req, { memberContext, params }) => {
  const rawId = (params as any)?.id;
  const pollId = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const poll = await pollService.getPollById(
    memberContext.tenantSlug,
    pollId,
    false, // isStaff = false
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: poll,
  });
});
