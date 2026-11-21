import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { domainService } from '@/server/domain/domain-service';
import { DomainDirectoryView } from '@/components/admin/domains/DomainDirectoryView';

export default async function SuperAdminDomainsPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const result = await domainService.listDomains({ page: 1, limit: 10 });

  return (
    <DomainDirectoryView
      initialDomains={result.domains}
      initialPagination={result.pagination}
    />
  );
}
