import React from 'react';
import { cn } from '@/lib/utils';

export type SectionSurface = 'white' | 'subtle' | 'dark';
export type SectionSpacing = 'sm' | 'md' | 'lg';

const SURFACE_MAP: Record<SectionSurface, string> = {
  white: 'bg-white text-[#525F7F]',
  subtle: 'bg-[#F8F9FE] text-[#525F7F]',
  dark: 'bg-[#172B4D] text-slate-200',
};

const SPACING_MAP: Record<SectionSpacing, string> = {
  sm: 'py-12 lg:py-16',
  md: 'py-16 lg:py-20',
  lg: 'py-20 lg:py-24',
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  surface?: SectionSurface;
  spacing?: SectionSpacing;
  bordered?: boolean;
}

export function Section({
  surface = 'white',
  spacing = 'md',
  bordered = false,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      {...rest}
      className={cn(
        SURFACE_MAP[surface],
        SPACING_MAP[spacing],
        bordered && (surface === 'dark' ? 'border-y border-slate-800' : 'border-y border-slate-200/80'),
        className
      )}
    >
      {children}
    </section>
  );
}
