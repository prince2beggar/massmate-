import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { memberService } from '@/server/members/member-service';
import { prisma } from '@/server/db/prisma';
import { MemberProfileView } from '@/components/mess-admin/members/MemberProfileView';

interface PageProps {
  params: Promise<{ tenantSlug: string; id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { tenantSlug, id } = await params;
  if (!tenantSlug || !id) notFound();

  const session = await getMessAdminSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  const tenantId = session.tenantContext.tenantId;

  let member: any = null;
  try {
    member = await memberService.getMemberById(tenantId, id, {
      permissions: session.tenantContext.permissions,
      isOwner: session.tenantContext.isOwner,
      roleSlug: session.tenantContext.roleSlug,
    });
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.message?.includes('does not exist')) {
      notFound();
    }
    throw err;
  }

  if (!member) notFound();

  // Fetch available tenant roles for role assignment
  let roles: Array<{ id: string; name: string; slug: string }> = [];
  try {
    roles = await prisma.role.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  } catch {
    roles = [
      { id: 'role_member', name: 'Member', slug: 'member' },
      { id: 'role_admin', name: 'Admin', slug: 'admin' },
    ];
  }

  const canEdit =
    session.tenantContext.isOwner ||
    session.tenantContext.permissions.has('members.update') ||
    session.tenantContext.permissions.has('members.manage_status');

  return (
    <MemberProfileView
      tenantSlug={tenantSlug}
      member={member}
      roles={roles}
      canEdit={canEdit}
    />
  );
}
