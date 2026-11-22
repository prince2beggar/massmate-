import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { pollService } from '@/server/polls/poll-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const result = await pollService.listSuggestions(
    memberContext.tenantSlug,
    { category, limit, offset },
    false, // isStaff = false
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: result.suggestions,
    meta: {
      total: result.total,
      limit,
      offset,
    },
  });
});

export const POST = withMemberAuth(async (req, { memberContext }) => {
  const body = await req.json();

  const created = await pollService.submitSuggestion(
    memberContext.tenantSlug,
    memberContext.userId,
    body
  );

  return NextResponse.json({
    success: true,
    data: created,
    message: 'Community suggestion submitted successfully.',
  });
});
