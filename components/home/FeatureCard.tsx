'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FeatureCardProps {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  expandedDetail?: string;
  detailsLabel?: string;
  hideDetailsLabel?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function FeatureCard({
  id,
  icon: Icon,
  title,
  description,
  expandedDetail,
  detailsLabel = 'Details',
  hideDetailsLabel = 'Hide details',
  href,
  linkLabel,
  className,
}: FeatureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReduced = useReducedMotion();
  const detailPanelId = id ? `feature-detail-${id}` : undefined;

  const hasExpandable = Boolean(expandedDetail);

  const cardBody = (
    <Card
      className={cn(
        'h-full gap-0 py-0 p-5 sm:p-6 transition-all duration-200 border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(23,43,77,0.04)]',
        'group-hover:-translate-y-0.5 group-hover:border-[#324CDD]/35 group-hover:shadow-[0_10px_28px_rgba(23,43,77,0.08)]',
        isExpanded &&
          'border-[#324CDD]/45 shadow-[0_10px_28px_rgba(23,43,77,0.08)]',
        className
      )}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/80 bg-[#F8F9FE] text-[#324CDD] transition-colors duration-200 group-hover:border-[#324CDD] group-hover:bg-[#324CDD] group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-base font-semibold tracking-tight text-[#172B4D]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#525F7F] flex-1">
        {description}
      </p>

      {hasExpandable && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={detailPanelId}
              initial={prefersReduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { height: 'auto', opacity: 1 }
              }
              exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-3 rounded-lg border border-[#324CDD]/15 bg-[#F8F9FE] px-3 py-2.5 text-xs leading-relaxed text-[#334155]">
                {expandedDetail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {(hasExpandable || (href && linkLabel)) && (
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          {hasExpandable ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={detailPanelId}
              aria-label={`${isExpanded ? hideDetailsLabel : detailsLabel}: ${title}`}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-md px-1.5 -ml-1.5 py-1.5 text-[#525F7F] hover:text-[#324CDD] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD]"
            >
              <span>{isExpanded ? hideDetailsLabel : detailsLabel}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  isExpanded && 'rotate-180 text-[#324CDD]'
                )}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span />
          )}

          {href && linkLabel && (
            hasExpandable ? (
              <Link
                href={href}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-md px-1.5 -mr-1.5 py-1.5 text-[#324CDD] hover:text-[#172B4D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD]"
              >
                <span>{linkLabel}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#324CDD]">
                <span>{linkLabel}</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            )
          )}
        </div>
      )}
    </Card>
  );

  // When expandable details are present, avoid nesting <button> inside <Link>
  if (href && !hasExpandable) {
    return (
      <Link
        href={href}
        className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD] focus-visible:ring-offset-2"
      >
        {cardBody}
      </Link>
    );
  }

  return <article className="group h-full">{cardBody}</article>;
}
