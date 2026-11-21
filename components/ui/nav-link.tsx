'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface NavLinkProps {
  href: string;
  active?: boolean;
  variant?: 'horizontal' | 'vertical';
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  children: React.ReactNode;
}

export function NavLink({
  href,
  active = false,
  variant = 'horizontal',
  onClick,
  className,
  children,
}: NavLinkProps) {
  if (variant === 'vertical') {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium min-h-[40px] whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
          active
            ? 'bg-[#EEF2FF] text-[#324CDD] font-semibold'
            : 'text-[#525F7F] hover:bg-slate-100 hover:text-[#172B4D]',
          className
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center py-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs',
        active
          ? 'border-[#324CDD] text-[#172B4D] font-semibold'
          : 'border-transparent text-[#525F7F] hover:text-[#172B4D] hover:border-slate-300',
        className
      )}
    >
      {children}
    </Link>
  );
}
