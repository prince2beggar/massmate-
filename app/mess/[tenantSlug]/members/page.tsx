import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { memberService } from '@/server/members/member-service';
import { ensureTenantRoles } from '@/server/rbac/role-templates';
import { prisma } from '@/server/db/prisma';
import { MemberDirectoryView } from '@/components/mess-admin/members/MemberDirectoryView';

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function MembersDirectoryPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  if (!tenantSlug) notFound();

  const session = await getMessAdminSession(tenantSlug);
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  const tenantId = session.tenantContext.tenantId;

  // Pre-fetch initial members directory data
  const initialData = await memberService.listMembers(tenantId, {
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch and guarantee standard mess roles (General Member, Meal Manager, Accountant, Co-Admin, etc.)
  const roles = await ensureTenantRoles(tenantId);

  const canCreate =
    session.tenantContext.isOwner ||
    session.tenantContext.roleSlug === 'admin' ||
    session.tenantContext.permissions.has('members.create') ||
    session.tenantContext.permissions.has('members.invite');

  return (
    <MemberDirectoryView
      tenantSlug={tenantSlug}
      initialData={initialData}
      roles={roles}
      canCreate={canCreate}
    />
  );
}
