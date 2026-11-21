'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { PricingSection } from '@/components/home/PricingSection';
import { FaqPreviewSection } from '@/components/home/FaqPreviewSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

export function PricingPageClient() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHero
        kicker={t.pricing.kicker}
        title={t.pages.pricing.title}
        subtitle={t.pages.pricing.subtitle}
      />
      <PricingSection compactFooterLink={false} background="white" />
      <FaqPreviewSection />
      <FinalCtaSection />
    </div>
  );
}
