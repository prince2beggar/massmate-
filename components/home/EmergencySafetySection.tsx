'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { NationalEmergencyPanel } from '@/components/safety/NationalEmergencyPanel';
import { MessEmergencyDirectoryGrid } from '@/components/safety/MessEmergencyDirectoryGrid';
import { SafetyInfoPlaceholders } from '@/components/safety/SafetyInfoPlaceholders';

export function EmergencySafetySection() {
  const { locale, t } = useLanguage();

  return (
    <section
      id="safety"
      aria-labelledby="emergency-safety-heading"
      className="relative bg-[#F8F9FE] py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70"
    >
      {/* Secondary anchor alias for Feature Cards linking to #emergency-safety */}
      <span
        id="emergency-safety"
        className="pointer-events-none absolute top-0 left-0 scroll-mt-16"
        aria-hidden="true"
      />

      <Container>
        {/* 1. Section Introduction */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div id="emergency-safety-heading">
            <SectionHeader
              kicker={t.safety.kicker}
              title={t.safety.title}
              subtitle={t.safety.subtitle}
            />
          </div>

          <div className="inline-flex max-w-full items-center gap-2 self-start lg:self-end rounded-lg border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-[#172B4D] shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-[#059669] shrink-0" aria-hidden="true" />
            <span>
              {locale === 'en'
                ? 'Verified National Hotlines + Mess Directory Preview'
                : 'যাচাইকৃত জাতীয় হটলাইন ও মেস ডিরেক্টরি প্রিভিউ'}
            </span>
          </div>
        </div>

        {/* 2. National Emergency Contacts (999, 102, 16263) */}
        <div className="mt-10">
          <NationalEmergencyPanel />
        </div>

        {/* 3. Mess-Specific Emergency Contacts (9 Illustrative DEMO DATA Categories) */}
        <MessEmergencyDirectoryGrid />

        {/* 4. Safety Information Placeholders (6 Expandable Topics) + Public/Private Boundaries & Future Page CTA */}
        <SafetyInfoPlaceholders />
      </Container>
    </section>
  );
}
