'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AccordionEntry {
  id: string;
  badge?: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionEntry[];
  defaultOpenId?: string | null;
  headingLevel?: 'h3' | 'h4';
  className?: string;
}

export function Accordion({
  items,
  defaultOpenId,
  headingLevel = 'h3',
  className,
}: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    defaultOpenId === undefined ? (items[0]?.id ?? null) : defaultOpenId
  );
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const count = items.length;
    if (count === 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown') {
      nextIndex = (index + 1) % count;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (index - 1 + count) % count;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = count - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      triggerRefs.current[nextIndex]?.focus();
    }
  };

  const HeadingTag = headingLevel;

  return (
    <div
      className={cn(
        'divide-y divide-slate-200/90 border-y border-slate-200/90',
        className
      )}
    >
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <HeadingTag className="m-0">
              <button
                ref={(el) => {
                  triggerRefs.current[index] = el;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                id={`trigger-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="group flex w-full min-h-[48px] items-center justify-between gap-3 sm:gap-4 py-3.5 sm:py-4 px-1 text-left text-[0.9375rem] sm:text-base font-semibold text-[#172B4D] hover:text-[#324CDD] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-md cursor-pointer"
              >
                <span className="flex items-start gap-2.5 sm:gap-3 leading-snug">
                  {item.badge && (
                    <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md bg-[#EEF2FF] px-2 py-0.5 font-mono text-[11px] font-bold text-[#324CDD]">
                      {item.badge}
                    </span>
                  )}
                  <span>{item.question}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
                    isOpen
                      ? 'border-[#324CDD]/25 bg-[#EEF2FF] text-[#324CDD]'
                      : 'border-slate-200 bg-slate-50 text-[#525F7F] group-hover:border-[#324CDD]/30 group-hover:text-[#324CDD]'
                  )}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </span>
              </button>
            </HeadingTag>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`panel-${item.id}`}
                  role="region"
                  aria-labelledby={`trigger-${item.id}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'pb-5 pr-2 sm:pr-8 text-sm sm:text-[0.95rem] leading-relaxed text-[#525F7F]',
                      item.badge ? 'pl-1 sm:pl-[3.25rem]' : 'pl-1'
                    )}
                  >
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
