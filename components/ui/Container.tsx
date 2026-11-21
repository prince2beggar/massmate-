import React from 'react';
import { cn } from '@/lib/utils';

export type ContainerSize = 'narrow' | 'default' | 'wide';

const SIZE_CLASSES: Record<ContainerSize, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-[1440px]',
};

interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  className?: string;
}

export function Container({
  children,
  size = 'default',
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </div>
  );
}
