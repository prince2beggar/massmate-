import React from 'react';
import { redirect } from 'next/navigation';
import { getPlatformSession } from '@/server/platform/platform-session';
import { planService } from '@/server/subscription/plan-service';
import { PlanDirectoryView } from '@/components/admin/subscriptions/PlanDirectoryView';

export default async function SuperAdminPlansPage() {
  const platformSession = await getPlatformSession();

  if (!platformSession) {
    redirect('/super-admin/access-denied');
  }

  const plans = await planService.listPlans(true);

  return <PlanDirectoryView initialPlans={plans} />;
}
