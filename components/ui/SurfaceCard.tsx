import React from 'react';
import { cn } from '@/lib/utils';

interface SurfaceCardProps {
  children: React.ReactNode;
  elevation?: 'bordered' | 'shadow';
  interactive?: boolean;
  className?: string;
}

export function SurfaceCard({
  children,
  elevation = 'bordered',
  interactive = false,
  className,
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white',
        elevation === 'bordered'
          ? 'border border-slate-200/90'
          : 'argon-card-shadow',
        interactive && 'argon-card-shadow-hover',
        className
      )}
    >
      {children}
    </div>
  );
}
