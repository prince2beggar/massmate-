import { NextResponse } from 'next/server';
import { documentService } from '@/server/documents/document-service';

export async function GET(
  req: Request,
  props: { params: Promise<{ tenantSlug: string; id: string }> }
) {
  const { tenantSlug, id } = await props.params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const expires = searchParams.get('expires');
  const download = searchParams.get('download') === 'true';

  if (!token || !expires) {
    return new NextResponse('Unauthorized: Missing secure access token or timestamp.', {
      status: 401,
    });
  }

  const expiresAt = parseInt(expires, 10);
  if (isNaN(expiresAt) || !documentService.verifySignedToken(id, token, expiresAt)) {
    return new NextResponse('Forbidden: Invalid or expired signed URL token.', {
      status: 403,
    });
  }

  // Fetch document metadata to resolve content-type and filename
  let doc: any = null;
  try {
    doc = await documentService.getDocumentById(tenantSlug, id, true);
  } catch {
    return new NextResponse('Document not found', { status: 404 });
  }

  // Record preview/download activity
  await documentService.recordActivity(
    doc.id,
    doc.uploadedById || 'system',
    download ? 'DOWNLOAD' : 'PREVIEW',
    `Secure ${download ? 'download' : 'preview'} accessed via signed token.`
  );

  // Return file payload (mock binary stream)
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  const contentType = mimeMap[doc.fileType.toLowerCase()] || 'application/octet-stream';
  const disposition = download
    ? `attachment; filename="${doc.fileName}"`
    : `inline; filename="${doc.fileName}"`;

  // Return placeholder byte stream safely
  const mockContent = Buffer.from(`%PDF-1.4 Mock document vault binary stream for ${doc.fileName}`);

  return new NextResponse(mockContent, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Content-Length': mockContent.length.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
