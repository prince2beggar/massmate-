import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withMemberAuth(async (req, { memberContext }) => {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') || undefined;
  const fileType = searchParams.get('fileType') || undefined;
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const result = await documentService.listDocuments(
    memberContext.tenantSlug,
    {
      categoryId,
      fileType,
      search,
      includeArchived: false,
      limit,
      offset,
    },
    false, // isStaff = false (Strict member privacy boundary)
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: result.documents,
    meta: {
      total: result.total,
      limit,
      offset,
    },
  });
});
