'use client';

import React from 'react';
import {
  History,
  Shield,
  User,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { RecentActivityItem } from '@/server/platform/platform-overview-service';
import { cn } from '@/lib/utils';

interface RecentActivityListProps {
  activities: RecentActivityItem[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  // Format action badge style
  const getActionBadge = (action: string) => {
    if (action.includes('suspend') || action.includes('delete')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertTriangle,
      };
    }
    if (action.includes('create') || action.includes('activate') || action.includes('verify')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
      };
    }
    return {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Shield,
    };
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <History className="h-4 w-4 text-indigo-600" />
            Recent Platform Activity
          </h3>
          <p className="text-xs text-slate-500">
            Security, governance, and tenant lifecycle audit trail
          </p>
        </div>

        <Link
          href="/super-admin/audit-logs"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All Logs</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="pt-4">
        {activities.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg bg-slate-50 text-center p-6 border border-dashed border-slate-200">
            <History className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No platform activity recorded</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Platform administrative events, role changes, and mess lifecycle events will stream into this audit ledger in real-time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((item) => {
              const badge = getActionBadge(item.action);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                        badge.bg
                      )}
                    >
                      <BadgeIcon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {item.action}
                        </span>
                        {item.tenant && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            <Building className="h-2.5 w-2.5" />
                            {item.tenant.name}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-600 truncate">
                        {item.description || `Operation on ${item.entityType}`}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        {item.actor ? (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {item.actor.name || item.actor.email}
                          </span>
                        ) : (
                          <span>System Action</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right shrink-0">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
