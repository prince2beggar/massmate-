'use client';

import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRangePreset } from '@/server/platform/platform-overview-service';

interface DateRangeFilterBarProps {
  currentPreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const PRESETS: Array<{ id: DateRangePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export function DateRangeFilterBar({
  currentPreset,
  onSelectPreset,
  isLoading = false,
  onRefresh,
}: DateRangeFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Calendar className="h-4 w-4 text-indigo-600" />
        <span>Time Range Filter:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const isSelected = currentPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectPreset(p.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer',
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              )}
            >
              {p.label}
            </button>
          );
        })}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-indigo-600')} />
          </button>
        )}
      </div>
    </div>
  );
}
