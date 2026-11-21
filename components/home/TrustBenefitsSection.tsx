'use client';

import React from 'react';
import { Bell, Layers, ReceiptText, ShieldCheck } from 'lucide-react';
import {
  TRUST_BENEFITS,
  type TrustBenefitIconName,
} from '@/data/homepage-overview';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { MotionReveal } from '@/components/ui/MotionReveal';

const TRUST_ICON_MAP: Record<
  TrustBenefitIconName,
  React.ComponentType<{ className?: string }>
> = {
  Layers,
  ReceiptText,
  Bell,
  ShieldCheck,
};

export function TrustBenefitsSection() {
  const { locale } = useLanguage();

  return (
    <section
      id="trust"
      aria-label={
        locale === 'en' ? 'Key Platform Benefits' : 'প্ল্যাটফর্মের মূল সুবিধাসমূহ'
      }
      className="relative bg-white py-12 sm:py-14 lg:py-16 border-b border-slate-200/80 scroll-mt-16"
    >
      <Container>
        <MotionReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 xl:gap-7">
            {TRUST_BENEFITS.map((benefit) => {
              const Icon = TRUST_ICON_MAP[benefit.iconName];
              return (
                <article
                  key={benefit.id}
                  className="group flex flex-col rounded-xl border border-slate-200/80 bg-[#F8F9FE]/45 p-5 sm:p-6 transition-colors duration-200 hover:border-[#324CDD]/30 hover:bg-white"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-[#324CDD] shadow-2xs transition-colors duration-200 group-hover:border-[#324CDD]/30 group-hover:bg-[#EEF2FF]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold tracking-tight text-[#172B4D]">
                    {benefit.title[locale]}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#525F7F]">
                    {benefit.description[locale]}
                  </p>
                </article>
              );
            })}
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
