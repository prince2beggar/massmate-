import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#F8F9FE]/70 px-6 py-12 text-center',
        className
      )}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#324CDD] shadow-xs">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-semibold tracking-tight text-[#172B4D]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#525F7F]">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
