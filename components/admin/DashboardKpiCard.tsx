'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'live' | 'upcoming' | 'neutral' | 'warning';
  };
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  accentColor?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  tooltip?: string;
}

export function DashboardKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  accentColor = 'indigo',
  tooltip,
}: KpiCardProps) {
  const accentClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  }[accentColor];

  const badgeClasses = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    upcoming: 'bg-slate-100 text-slate-600 border-slate-200',
    neutral: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  }[badge?.variant || 'neutral'];

  return (
    <div
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            accentClasses
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {subtitle && (
          <span className="text-xs text-slate-500 truncate">{subtitle}</span>
        )}

        {badge && (
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
              badgeClasses
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
