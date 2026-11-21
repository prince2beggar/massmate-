import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { subscriptionService } from '@/server/subscription/subscription-service';
import { customProposalService } from '@/server/subscription/custom-proposal-service';
import { subscriptionAnalyticsService } from '@/server/subscription/subscription-analytics-service';
import { SubscriptionDirectoryView } from '@/components/admin/subscriptions/SubscriptionDirectoryView';

export default async function SuperAdminSubscriptionsPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  // Pre-load data on the server
  const [subResult, inquiries, analytics] = await Promise.all([
    subscriptionService.listSubscriptions({ page: 1, limit: 10 }),
    customProposalService.listInquiries(),
    subscriptionAnalyticsService.getSubscriptionAnalytics(),
  ]);

  return (
    <SubscriptionDirectoryView
      initialSubscriptions={subResult.subscriptions}
      initialPagination={subResult.pagination}
      initialInquiries={inquiries}
      initialAnalytics={analytics}
    />
  );
}
