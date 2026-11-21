'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Globe,
  CreditCard,
  History,
  Edit,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import type { PlatformTenantDetails } from '@/server/platform/platform-tenant-service';
import { EditTenantModal } from './EditTenantModal';
import { TenantStatusModal } from './TenantStatusModal';
import { TenantVerificationModal } from './TenantVerificationModal';
import { cn } from '@/lib/utils';

interface TenantDetailsViewProps {
  initialDetails: PlatformTenantDetails;
}

type TabKey = 'overview' | 'owner' | 'members' | 'subscription' | 'domain' | 'activity';

export function TenantDetailsView({ initialDetails }: TenantDetailsViewProps) {
  const [details, setDetails] = useState<PlatformTenantDetails>(initialDetails);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const reloadTenant = async () => {
    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${details.tenant.id}`, {
        headers: {
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDetails(json.data);
      }
    } catch {
      // Keep existing state on error
    }
  };

  const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'owner', label: 'Owner & Contact', icon: User },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'domain', label: 'Domain', icon: Globe },
    { id: 'activity', label: 'Activity Log', icon: History },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumb & Quick Administrative Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/super-admin/tenants"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Tenant Directory</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {details.tenant.name}
            </h1>

            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
                details.tenant.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : details.tenant.status === 'SUSPENDED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {details.tenant.status}
            </span>

            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                details.tenant.verificationStatus === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              Verification: {details.tenant.verificationStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="mt-1 font-mono text-xs text-slate-400">
            ID: {details.tenant.id} • Slug: {details.tenant.slug}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVerifyOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStatusOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span>Change Status</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Organization Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mess / Organization:</span>
                  <span className="font-bold text-slate-900">{details.tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant Type:</span>
                  <span className="font-semibold text-slate-800">
                    {details.tenant.tenantType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subdomain Identifier:</span>
                  <span className="font-mono text-indigo-600 font-semibold">{details.tenant.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City / Region:</span>
                  <span className="font-medium text-slate-800">{details.tenant.city || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Country & Timezone:</span>
                  <span className="text-slate-700">{details.tenant.country} ({details.tenant.timezone})</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Status:</span>
                  <span className="font-bold text-slate-900">{details.tenant.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="font-semibold text-slate-800">{details.tenant.verificationStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified On:</span>
                  <span className="text-slate-700">
                    {details.tenant.verifiedAt ? new Date(details.tenant.verifiedAt).toLocaleDateString() : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created Date:</span>
                  <span className="text-slate-700">{new Date(details.tenant.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="text-slate-700">{new Date(details.tenant.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Description</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {details.tenant.description || 'No descriptive bio recorded for this organization.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: OWNER & CONTACT */}
        {activeTab === 'owner' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Designated Mess Owner & Contact Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Info Card */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Primary Account Holder</span>
                </div>

                {details.owner ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="font-bold text-slate-800">{details.owner.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-800">{details.owner.email || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono text-slate-800">{details.owner.phone || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">User Account Status:</span>
                      <span className="font-semibold text-emerald-700">{details.owner.status}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No owner assigned yet.</p>
                )}
              </div>

              {/* Organization Contact Card */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">Mess Contact Point</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Email:</span>
                    <span className="text-slate-800">{details.tenant.email || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="font-mono text-slate-800">{details.tenant.phone || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="text-slate-800">{details.tenant.address || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City / District:</span>
                    <span className="text-slate-800">{details.tenant.city || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Resident Membership Overview</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-center">
                <span className="text-xs text-slate-500 block mb-1">Total Members</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {details.membersSummary.total}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                <span className="text-xs text-emerald-700 block mb-1">Active Residents</span>
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  {details.membersSummary.active}
                </span>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
                <span className="text-xs text-amber-700 block mb-1">Pending Approval</span>
                <span className="text-2xl font-bold font-mono text-amber-800">
                  {details.membersSummary.pending}
                </span>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-4 text-center">
                <span className="text-xs text-rose-700 block mb-1">Suspended</span>
                <span className="text-2xl font-bold font-mono text-rose-800">
                  {details.membersSummary.suspended}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-xs text-slate-500">
              <p>
                Individual resident meal counts, bazar ledgers, and room assignment details are isolated
                inside the tenant’s own Mess Admin Portal. Platform administrators inspect aggregate
                capacity and membership compliance.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: SUBSCRIPTION */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900">SaaS License & Subscription Tiers</h3>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Active Plan:</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">{details.subscription.planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Lifecycle Status:</span>
                <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 uppercase text-[10px]">
                  {details.subscription.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">14-Day Evaluation End:</span>
                <span className="font-mono text-slate-800">
                  {details.subscription.trialEnd
                    ? new Date(details.subscription.trialEnd).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <span className="font-bold text-slate-700 block mb-1">Billing Integration Notice:</span>
              Automated recurring bKash, Nagad, and card gateway settlements are scheduled for Phase 3
              Billing development. License dates are tracked with zero fake statistics.
            </div>
          </div>
        )}

        {/* TAB 5: DOMAIN */}
        {activeTab === 'domain' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Domain & URL Routing Configuration</h3>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 space-y-2">
                <span className="font-bold text-slate-800 block">Default Subdomain</span>
                <div className="flex items-center justify-between font-mono bg-white border border-slate-200 rounded-md p-2.5">
                  <span className="text-indigo-600 font-semibold">{details.domain.fullSubdomain}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                    Active
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 space-y-2">
                <span className="font-bold text-slate-800 block">Custom Domain Mapping</span>
                <p className="text-slate-500">No custom domain configured for this mess.</p>
                <span className="text-[10px] text-slate-400 block">
                  Custom domain DNS mapping (e.g. mess.princemess.com) is scheduled for the Phase 3 Domains module.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Audit Trail for this Tenant</h3>

            {details.recentActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                <History className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p>No audit events recorded yet for this organization.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {details.recentActivity.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-semibold text-indigo-600 mr-2">{act.action}</span>
                      <span className="text-slate-700">{act.description || act.entityType}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditTenantModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tenant={{
          id: details.tenant.id,
          name: details.tenant.name,
          description: details.tenant.description,
          email: details.tenant.email,
          phone: details.tenant.phone,
          address: details.tenant.address,
          city: details.tenant.city,
          tenantType: details.tenant.tenantType,
        }}
        onUpdated={reloadTenant}
      />

      <TenantStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        tenantId={details.tenant.id}
        tenantName={details.tenant.name}
        currentStatus={details.tenant.status}
        onStatusChanged={reloadTenant}
      />

      <TenantVerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        tenantId={details.tenant.id}
        tenantName={details.tenant.name}
        currentStatus={details.tenant.verificationStatus}
        documentType={details.verification?.documentType}
        documentNumberMasked={details.verification?.documentNumberMasked}
        onReviewed={reloadTenant}
      />
    </div>
  );
}
