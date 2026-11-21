import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { platformUserService } from '@/server/platform/platform-user-service';
import { UserDirectoryView } from '@/components/admin/users/UserDirectoryView';

export default async function SuperAdminUsersPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const result = await platformUserService.listUsers({ page: 1, limit: 10 });

  return (
    <UserDirectoryView
      initialUsers={result.users}
      initialPagination={result.pagination}
      currentUserRole={platformSession.platformRole}
    />
  );
}
