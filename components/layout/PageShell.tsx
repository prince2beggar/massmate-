import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('min-h-full w-full bg-white text-[#525F7F]', className)}>
      {children}
    </div>
  );
}
