import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { memberService } from '@/server/members/member-service';
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

  // Fetch available tenant roles for member creation
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
      orderBy: { name: 'asc' },
    });
  } catch {
    // If DB offline/fallback
    roles = [
      { id: 'role_member', name: 'Member', slug: 'member' },
      { id: 'role_moderator', name: 'Moderator', slug: 'moderator' },
      { id: 'role_accountant', name: 'Accountant', slug: 'accountant' },
      { id: 'role_meal_manager', name: 'Meal Manager', slug: 'meal-manager' },
      { id: 'role_admin', name: 'Admin', slug: 'admin' },
    ];
  }

  const canCreate =
    session.tenantContext.isOwner ||
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
