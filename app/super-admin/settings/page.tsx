import React from 'react';
import { Settings } from 'lucide-react';
import { UpcomingModuleView } from '@/components/admin/UpcomingModuleView';

export default function SuperAdminSettingsPage() {
  return (
    <UpcomingModuleView
      title="Platform Settings & Policies"
      modulePhase="Phase 3 Pending"
      icon={Settings}
      description="Platform maintenance toggles, security thresholds, SMS gateways, and system parameters."
      plannedFeatures={[
        'Global maintenance mode toggle with custom announcement message',
        'Rate limit adjustments and authentication brute-force protections',
        'SMS gateway provider configuration (Bangladeshi aggregators)',
        'Email notification SMTP templates and system broadcast alerts',
      ]}
    />
  );
}
