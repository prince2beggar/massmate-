'use client';

import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  UserPlus,
} from 'lucide-react';
import {
  HOW_IT_WORKS_STEPS,
  type WorkflowStepIconName,
} from '@/data/homepage-workflow-rentals';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { MotionReveal } from '@/components/ui/MotionReveal';

const STEP_ICON_MAP: Record<
  WorkflowStepIconName,
  React.ComponentType<{ className?: string }>
> = {
  Building2,
  UserPlus,
  ClipboardList,
  BarChart3,
};

export function HowItWorksSection() {
  const { locale, t } = useLanguage();

  return (
    <section
      id="how-it-works"
      className="bg-white py-14 sm:py-18 lg:py-24 border-b border-slate-200/70 scroll-mt-16"
    >
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <SectionHeader
            kicker={t.howItWorks.kicker}
            title={t.howItWorks.title}
            subtitle={t.howItWorks.subtitle}
          />
          <Button
            href="#get-started"
            variant="primary"
            size="md"
            className="self-start lg:self-auto"
          >
            <span>{t.howItWorks.cta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <MotionReveal className="mt-10 sm:mt-14">
          <div className="relative">
            {/* Desktop horizontal connecting track across all 4 step nodes (xl+) */}
            <div
              aria-hidden="true"
              className="hidden xl:block pointer-events-none absolute left-[12.5%] right-[12.5%] top-6 h-[2px] bg-gradient-to-r from-[#324CDD]/20 via-[#324CDD]/45 to-[#324CDD]/20"
            />

            <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {HOW_IT_WORKS_STEPS.map((step, index) => {
                const Icon = STEP_ICON_MAP[step.iconName];
                const isLast = index === HOW_IT_WORKS_STEPS.length - 1;

                return (
                  <li
                    key={step.id}
                    className="group relative pl-14 md:pl-0 flex flex-col"
                  >
                    {/* Mobile vertical timeline connector */}
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="md:hidden pointer-events-none absolute left-[19px] top-11 bottom-[-20px] w-[2px] bg-slate-200"
                      />
                    )}

                    {/* Step Number Node (mobile left rail, tablet inline, xl desktop centered on horizontal connector) */}
                    <div className="absolute left-0 top-0 md:static md:mb-5 xl:flex xl:justify-center">
                      <span className="relative z-10 inline-flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-full border-2 border-[#324CDD]/25 bg-white font-mono tabular-nums text-xs xl:text-sm font-bold text-[#324CDD] shadow-xs transition-colors duration-200 group-hover:border-[#324CDD] group-hover:bg-[#324CDD] group-hover:text-white">
                        {step.number}
                      </span>
                    </div>

                    {/* Step Content Card */}
                    <Card className="h-full gap-0 py-0 p-5 sm:p-6 border-slate-200/90 bg-[#F8F9FE]/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[#324CDD]/35 group-hover:bg-white group-hover:shadow-[0_10px_28px_rgba(23,43,77,0.07)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-[#324CDD] shadow-2xs transition-colors duration-200 group-hover:border-[#324CDD]/30 group-hover:bg-[#EEF2FF]">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                          {locale === 'en' ? `Step ${step.number}` : `ধাপ ${step.number}`}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold tracking-tight text-[#172B4D]">
                        {step.title[locale]}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-[#525F7F]">
                        {step.description[locale]}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
