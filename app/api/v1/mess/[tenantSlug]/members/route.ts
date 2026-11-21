import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { memberService } from '@/server/members/member-service';

export const GET = withTenantAuth(
  { permission: 'members.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const roleId = url.searchParams.get('roleId') || undefined;
    const sortBy = (url.searchParams.get('sortBy') as any) || undefined;
    const sortOrder = (url.searchParams.get('sortOrder') as any) || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const result = await memberService.listMembers(tenantContext.tenantId, {
      search,
      status,
      roleId,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);

export const POST = withTenantAuth(
  { permissions: ['members.create', 'members.invite'] },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const member = await memberService.createMember(
      tenantContext.tenantId,
      body,
      {
        userId: tenantContext.userId,
        roleName: tenantContext.roleName,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    );
  }
);
