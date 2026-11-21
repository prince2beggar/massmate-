import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { supportTicketService } from '@/server/support/support-ticket-service';
import { SupportCenterView } from '@/components/admin/support/SupportCenterView';

export default async function SuperAdminSupportPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const [ticketResult, stats] = await Promise.all([
    supportTicketService.listTickets({ page: 1, limit: 10 }),
    supportTicketService.getTicketStats(),
  ]);

  return (
    <SupportCenterView
      initialTickets={ticketResult.tickets}
      initialPagination={ticketResult.pagination}
      initialStats={stats}
      currentUserRole={platformSession.platformRole}
    />
  );
}
