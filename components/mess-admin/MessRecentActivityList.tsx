'use client';

import React from 'react';
import {
  History,
  Shield,
  User,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import type { MessDashboardOverviewDto } from '@/server/mess-admin/mess-dashboard-service';

interface MessRecentActivityListProps {
  activities: MessDashboardOverviewDto['recentActivities'];
}

export function MessRecentActivityList({ activities }: MessRecentActivityListProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Recent Audit & Operations Activity
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="h-3 w-3 text-slate-400" />
          <span>Immutable Ledger (Read-Only)</span>
        </div>
      </div>

      {activities && activities.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {activities.map((act) => {
            const dateStr = new Date(act.createdAt).toLocaleString('en-US', {
              timeZone: 'Asia/Dhaka',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={act.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/80 rounded-lg px-2 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 break-words">
                      {act.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{act.actorName}</span>
                      </span>
                      <span>•</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        {act.actorRole}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {act.module}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-10 sm:pl-0">
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {dateStr}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>Logged</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <History className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            No Recent Activities Recorded
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Audit events will appear here automatically when members join, payments are
            verified, or administrative settings are adjusted.
          </p>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200 flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          Compliance policy: Ordinary administrators and moderators cannot delete or alter
          audit records. All mutations are permanently logged.
        </span>
      </div>
    </div>
  );
}
