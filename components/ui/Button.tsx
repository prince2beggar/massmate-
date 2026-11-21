import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  "group/button inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-normal text-center sm:whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5E72E4] focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-[#324CDD] text-white shadow-xs hover:bg-[#263DC2]',
        primary:
          'bg-[#324CDD] text-white shadow-xs hover:bg-[#263DC2]',
        secondary:
          'bg-[#172B4D] text-white shadow-xs hover:bg-[#101F38] focus-visible:ring-[#172B4D]',
        subtle:
          'bg-[#EEF2FF] text-[#324CDD] hover:bg-[#E0E7FF]',
        outline:
          'border-slate-300 bg-white text-[#172B4D] hover:bg-slate-50 hover:border-slate-400',
        ghost:
          'text-[#525F7F] hover:bg-slate-100 hover:text-[#172B4D]',
        destructive:
          'bg-[#DC2626] text-white shadow-xs hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]/40',
        white:
          'bg-white text-[#172B4D] shadow-xs hover:bg-slate-50 focus-visible:ring-white',
        link:
          'text-[#324CDD] underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-10 px-4 py-2 text-sm',
        sm: 'min-h-9 px-3.5 py-1.5 text-xs',
        md: 'min-h-[44px] px-4 sm:px-5 py-2.5 text-sm',
        lg: 'min-h-[46px] px-5 sm:px-6 py-2.5 text-sm sm:text-base',
        icon: 'size-10',
        'icon-sm': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface BaseProps extends ButtonVariantProps {
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  'aria-label'?: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = 'default', size = 'default', className, children, ...rest } = props;
  const classes = cn(buttonVariants({ variant, size, className }));

  if ('href' in props && props.href) {
    return (
      <Link
        href={props.href}
        onClick={props.onClick}
        aria-label={props['aria-label']}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
    >
      {children}
    </button>
  );
}
