import { NextResponse } from 'next/server';
import { withMemberAuth } from '@/server/api/with-member-auth';
import { documentService } from '@/server/documents/document-service';

export const GET = withMemberAuth(async (req, { memberContext, params }) => {
  const rawId = (params as any)?.id;
  const documentId = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const doc = await documentService.getDocumentById(
    memberContext.tenantSlug,
    documentId,
    false, // isStaff = false
    memberContext.userId
  );

  return NextResponse.json({
    success: true,
    data: doc,
  });
});
