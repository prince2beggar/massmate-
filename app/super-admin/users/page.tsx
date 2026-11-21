import React from 'react';
import { Users } from 'lucide-react';
import { UpcomingModuleView } from '@/components/admin/UpcomingModuleView';

export default function SuperAdminUsersPage() {
  return (
    <UpcomingModuleView
      title="Platform Users"
      modulePhase="Phase 3 Pending"
      icon={Users}
      description="Global user identities, cross-mess memberships, and platform administrator roles."
      plannedFeatures={[
        'Global directory of all platform users with search by name, email, phone',
        'Platform administrator role assignments (Platform Owner, Admin, Support, Finance)',
        'Multi-tenant membership inspection across all messes for any user',
        'Account lifecycle actions: suspend, reactivate, or reset verification status',
      ]}
    />
  );
}
