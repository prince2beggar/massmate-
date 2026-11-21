'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CreditCard,
  HelpCircle,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import {
  FAQ_CATEGORIES,
  FAQ_CATEGORY_GROUPS,
  FAQ_ITEMS,
  type FaqCategory,
} from '@/data/faq';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FaqPreviewSectionProps {
  background?: 'white' | 'tint';
}

const CATEGORY_ICONS: Record<
  FaqCategory,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  general: HelpCircle,
  'subscription-pricing': CreditCard,
  'features-management': Layers,
  'security-support': ShieldCheck,
};

export function FaqPreviewSection({
  background = 'white',
}: FaqPreviewSectionProps) {
  const { locale, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'all'>(
    'all'
  );

  const visibleGroups = useMemo(() => {
    const groups =
      activeCategory === 'all'
        ? FAQ_CATEGORY_GROUPS
        : FAQ_CATEGORY_GROUPS.filter((group) => group.id === activeCategory);

    return groups.map((group) => ({
      ...group,
      items: FAQ_ITEMS.filter((item) => item.category === group.id).map(
        (item) => ({
          id: item.id,
          badge: item.number,
          question: item.question[locale],
          answer: item.answer[locale],
        })
      ),
    }));
  }, [activeCategory, locale]);

  const handleJumpToContact = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof document === 'undefined') return;
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      event.preventDefault();
      contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-section-heading"
      className={cn(
        'py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70',
        background === 'white' ? 'bg-white' : 'bg-[#F8F9FE]'
      )}
    >
      <Container>
        {/* 1. Section Introduction */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div id="faq-section-heading">
            <SectionHeader
              kicker={t.faq.kicker}
              title={t.faq.title}
              subtitle={t.faq.subtitle}
            />
          </div>

          <div className="shrink-0">
            <Button href="/faq" variant="outline" size="md">
              <span>{t.faq.viewAllCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* 2. Category Filter Bar */}
        <div
          role="tablist"
          aria-label={
            locale === 'en' ? 'FAQ categories' : 'প্রশ্নোত্তর বিভাগসমূহ'
          }
          className="mt-10 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-5"
        >
          {FAQ_CATEGORIES.map((category, tabIndex) => {
            const isSelected = activeCategory === category.id;
            const count =
              category.id === 'all'
                ? FAQ_ITEMS.length
                : FAQ_ITEMS.filter((i) => i.category === category.id).length;

            const handleTabKeyDown = (
              event: React.KeyboardEvent<HTMLButtonElement>
            ) => {
              let nextIdx: number | null = null;
              if (event.key === 'ArrowRight') {
                nextIdx = (tabIndex + 1) % FAQ_CATEGORIES.length;
              } else if (event.key === 'ArrowLeft') {
                nextIdx =
                  (tabIndex - 1 + FAQ_CATEGORIES.length) %
                  FAQ_CATEGORIES.length;
              } else if (event.key === 'Home') {
                nextIdx = 0;
              } else if (event.key === 'End') {
                nextIdx = FAQ_CATEGORIES.length - 1;
              }
              if (nextIdx !== null) {
                event.preventDefault();
                const nextCategory = FAQ_CATEGORIES[nextIdx];
                setActiveCategory(nextCategory.id);
                document
                  .getElementById(`faq-tab-${nextCategory.id}`)
                  ?.focus();
              }
            };

            return (
              <button
                key={category.id}
                id={`faq-tab-${category.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="faq-tabpanel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveCategory(category.id)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  'inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
                  isSelected
                    ? 'border-[#324CDD] bg-[#324CDD] text-white shadow-xs'
                    : 'border-slate-200/90 bg-[#F8F9FE] text-[#525F7F] hover:border-slate-300 hover:bg-white hover:text-[#172B4D]'
                )}
              >
                <span>{category.label[locale]}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-[#525F7F] border border-slate-200/80'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Grouped Interactive FAQ Accordions */}
        <div
          id="faq-tabpanel"
          role="tabpanel"
          aria-labelledby={`faq-tab-${activeCategory}`}
          className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
        >
          {visibleGroups.map((group, groupIndex) => {
            const Icon = CATEGORY_ICONS[group.id];
            const isSingleCategory = activeCategory !== 'all';

            return (
              <div
                key={`${activeCategory}-${group.id}`}
                className={cn(
                  'rounded-2xl border border-slate-200/90 bg-[#F8F9FE]/60 p-4 sm:p-7',
                  isSingleCategory && 'lg:col-span-2 max-w-4xl w-full mx-auto'
                )}
              >
                <div className="flex items-start gap-3.5 pb-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/90 text-[#324CDD] shadow-2xs shrink-0">
                    <Icon className="h-5 w-5" aria-hidden={true} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#172B4D]">
                      {group.label[locale]}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[#525F7F] leading-relaxed">
                      {group.description[locale]}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white px-3.5 sm:px-5 py-1 shadow-2xs">
                  <Accordion
                    items={group.items}
                    headingLevel="h4"
                    defaultOpenId={
                      isSingleCategory || groupIndex === 0
                        ? group.items[0]?.id ?? null
                        : null
                    }
                    className="border-y-0"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Subtle Support Footer Link */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-[#F8F9FE] px-5 py-4 text-sm text-[#525F7F]">
          <p>
            {t.faq.supportPrompt}{' '}
            <Link
              href="#contact"
              onClick={handleJumpToContact}
              className="inline-flex min-h-[32px] items-center font-semibold text-[#324CDD] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs"
            >
              {t.faq.supportLink}
            </Link>
            .
          </p>
          <span className="text-xs font-medium text-[#64748B]">
            {locale === 'en'
              ? 'Use Tab, Arrow keys, Enter, or Space to navigate questions.'
              : 'কিবোর্ডে Tab, Arrow, Enter বা Space দিয়ে প্রশ্নোত্তর নেভিগেট করুন।'}
          </span>
        </div>
      </Container>
    </section>
  );
}
