import React from 'react';
import { CreditCard } from 'lucide-react';
import { UpcomingModuleView } from '@/components/admin/UpcomingModuleView';

export default function SuperAdminSubscriptionsPage() {
  return (
    <UpcomingModuleView
      title="SaaS Subscriptions"
      modulePhase="Phase 3 Pending"
      icon={CreditCard}
      description="Track active recurring subscriptions, trial accounts, renewals, and billing lifecycles."
      plannedFeatures={[
        'Live subscriptions table with expiration countdowns',
        'Trial account conversion funnels and automated reminders',
        'Direct subscription tier overrides and manual license extensions',
        'Failed renewal tracking and automated grace periods',
      ]}
    />
  );
}
