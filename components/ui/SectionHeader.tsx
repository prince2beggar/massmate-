import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = 'left',
  tone = 'light',
  className,
}: SectionHeaderProps) {
  const isCenter = align === 'center';
  const isDark = tone === 'dark';

  return (
    <div
      className={cn(
        'max-w-3xl',
        isCenter && 'mx-auto text-center',
        className
      )}
    >
      {kicker && (
        <p
          className={cn(
            'text-sm font-semibold tracking-tight mb-3',
            isDark ? 'text-[#7DD3FC]' : 'text-[#324CDD]'
          )}
        >
          {kicker}
        </p>
      )}
      <h2
        className={cn(
          'text-[clamp(1.5rem,2.4vw+0.75rem,2.25rem)] font-bold tracking-tight leading-[1.2] text-balance',
          isDark ? 'text-white' : 'text-[#172B4D]'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-3.5 sm:mt-4 text-[0.95rem] sm:text-[1.0625rem] leading-relaxed',
            isCenter ? 'mx-auto max-w-2xl' : 'max-w-2xl',
            isDark ? 'text-slate-200' : 'text-[#525F7F]'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
