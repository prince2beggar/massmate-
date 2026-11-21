'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: Array<SegmentedTabOption<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] cursor-pointer',
              active
                ? 'bg-white text-[#172B4D] shadow-sm'
                : 'text-[#525F7F] hover:text-[#172B4D]'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
