import React from 'react';
import { Building2 } from 'lucide-react';
import { UpcomingModuleView } from '@/components/admin/UpcomingModuleView';

export default function SuperAdminTenantsPage() {
  return (
    <UpcomingModuleView
      title="Mess & Tenant Management"
      modulePhase="Task 25 Upcoming"
      icon={Building2}
      description="Monitor registered messes, student hostels, bachelor apartments, and boarding organizations."
      plannedFeatures={[
        'Full tenant directory with search and filter by type (Student, Bachelor, Hostel)',
        'Approval queue for pending mess registrations',
        'Emergency suspension and reactivation controls',
        'Tenant data overview, room counts, and active member limits',
      ]}
    />
  );
}
