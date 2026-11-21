'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { MESS_NAV_ITEMS } from './mess-nav-data';

interface MessModulePlaceholderProps {
  tenantSlug: string;
  moduleId: string;
}

export function MessModulePlaceholder({
  tenantSlug,
  moduleId,
}: MessModulePlaceholderProps) {
  const item = MESS_NAV_ITEMS.find((nav) => nav.id === moduleId);

  const title = item?.name || 'Upcoming Feature';
  const description =
    item?.description ||
    'This mess management module is currently scheduled on the development roadmap.';
  const upcomingTask = item?.upcomingTask || 'Upcoming Task';
  const Icon = item?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb/Back link */}
      <div>
        <Link
          href={`/mess/${tenantSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard Overview</span>
        </Link>
      </div>

      {/* Main Placeholder Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs mb-4">
          <Icon className="h-8 w-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 mb-3">
          <Clock className="h-3.5 w-3.5" />
          <span>Scheduled for {upcomingTask}</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 leading-relaxed">
          {description}
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Multi-Tenant Isolation Notice
              </p>
              <p>
                When activated in {upcomingTask}, all data in this module will be
                strictly partitioned to your verified mess boundary. Unauthenticated
                or cross-tenant access is prohibited by design.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/mess/${tenantSlug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
