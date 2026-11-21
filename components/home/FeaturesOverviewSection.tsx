'use client';

import React from 'react';
import {
  ArrowRight,
  BedDouble,
  Bell,
  Building2,
  ShieldAlert,
  ShoppingBag,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import {
  HOMEPAGE_OVERVIEW_FEATURES,
  type OverviewFeatureIconName,
} from '@/data/homepage-overview';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { MotionReveal } from '@/components/ui/MotionReveal';
import { FeatureCard } from '@/components/home/FeatureCard';

const FEATURE_ICON_MAP: Record<
  OverviewFeatureIconName,
  React.ComponentType<{ className?: string }>
> = {
  Users,
  Utensils,
  ShoppingBag,
  Wallet,
  BedDouble,
  Bell,
  Building2,
  ShieldAlert,
};

export function FeaturesOverviewSection() {
  const { locale, t } = useLanguage();

  return (
    <section
      id="features"
      className="bg-[#F8F9FE] py-14 sm:py-18 lg:py-24 border-b border-slate-200/70 scroll-mt-16"
    >
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <SectionHeader
            kicker={t.featuresOverview.kicker}
            title={t.featuresOverview.title}
            subtitle={t.featuresOverview.subtitle}
          />
          <Button
            href="/features"
            variant="outline"
            size="md"
            className="self-start lg:self-auto"
          >
            <span>{t.featuresOverview.viewAllCta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Balanced 4x2 desktop (xl+) / 2x4 tablet (sm-lg) / 1x8 mobile grid */}
        <MotionReveal className="mt-10 sm:mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 items-start">
            {HOMEPAGE_OVERVIEW_FEATURES.map((feature) => {
              const Icon = FEATURE_ICON_MAP[feature.iconName];
              return (
                <FeatureCard
                  key={feature.id}
                  id={feature.id}
                  icon={Icon}
                  title={feature.title[locale]}
                  description={feature.description[locale]}
                  expandedDetail={feature.expandedDetail[locale]}
                  detailsLabel={locale === 'en' ? 'Details' : 'বিস্তারিত'}
                  hideDetailsLabel={locale === 'en' ? 'Hide details' : 'সংক্ষেপ করুন'}
                  href={feature.sectionHref}
                  linkLabel={feature.linkLabel[locale]}
                />
              );
            })}
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
