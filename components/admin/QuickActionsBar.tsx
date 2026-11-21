'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  Layers,
  CreditCard,
  Globe,
  Headphones,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  statusText?: string;
  isAvailable: boolean;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'all-tenants',
    label: 'View All Tenants',
    href: '/super-admin/tenants',
    icon: Building2,
    description: 'Inspect all registered messes & businesses',
    statusText: 'Task 25',
    isAvailable: true,
  },
  {
    id: 'pending-tenants',
    label: 'Review Pending Tenants',
    href: '/super-admin/tenants?status=PENDING',
    icon: Clock,
    description: 'Approve or reject pending onboarding requests',
    statusText: 'Task 25',
    isAvailable: true,
  },
  {
    id: 'manage-plans',
    label: 'Manage Plans',
    href: '/super-admin/plans',
    icon: Layers,
    description: 'Configure subscription packages & pricing',
    statusText: 'Phase 3',
    isAvailable: true,
  },
  {
    id: 'review-subscriptions',
    label: 'Review Subscriptions',
    href: '/super-admin/subscriptions',
    icon: CreditCard,
    description: 'Monitor active, expiring & trial subscriptions',
    statusText: 'Phase 3',
    isAvailable: true,
  },
  {
    id: 'domain-requests',
    label: 'Review Domain Requests',
    href: '/super-admin/domains',
    icon: Globe,
    description: 'Verify custom domains & subdomains',
    statusText: 'Phase 3',
    isAvailable: true,
  },
  {
    id: 'support-center',
    label: 'Open Support Center',
    href: '/super-admin/support',
    icon: Headphones,
    description: 'Respond to urgent mess inquiries & tickets',
    statusText: 'Phase 3',
    isAvailable: true,
  },
];

export function QuickActionsBar() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick Governance Shortcuts
          </h3>
          <p className="text-xs text-slate-500">
            Direct navigation to platform administrative queues and management workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="group flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-xs"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {action.label}
                  </span>
                  {action.statusText && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500">
                      {action.statusText}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
