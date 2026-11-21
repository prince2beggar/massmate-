import React from 'react';
import { Layers } from 'lucide-react';
import { UpcomingModuleView } from '@/components/admin/UpcomingModuleView';

export default function SuperAdminPlansPage() {
  return (
    <UpcomingModuleView
      title="Plans & Pricing"
      modulePhase="Phase 3 Pending"
      icon={Layers}
      description="Define SaaS packages, member thresholds, storage limits, and custom business tiers."
      plannedFeatures={[
        'Tier configuration: Free Starter, Standard Mess, and Enterprise Hostel',
        'Monthly & Annual billing toggle with discount configurations',
        'Custom enterprise quote generator for large university hostels',
        'Feature gating matrix for meal management, bKash checkout, and SMS alerts',
      ]}
    />
  );
}
