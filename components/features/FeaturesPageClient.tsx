'use client';

import React, { useMemo, useState } from 'react';
import {
  BedDouble,
  Bell,
  Building2,
  Check,
  CreditCard,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  Users,
  Utensils,
} from 'lucide-react';
import {
  PLATFORM_FEATURES,
  type FeatureCategory,
  type PlatformFeature,
} from '@/data/features';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

const ICON_MAP: Record<PlatformFeature['iconName'], React.ComponentType<{ className?: string }>> = {
  Users,
  BedDouble,
  Utensils,
  ShoppingBag,
  Receipt,
  CreditCard,
  Building2,
  Bell,
  ShieldAlert,
};

export function FeaturesPageClient() {
  const { locale, t } = useLanguage();
  const [category, setCategory] = useState<FeatureCategory | 'all'>('all');

  const tabs: Array<{ value: FeatureCategory | 'all'; label: string }> = [
    { value: 'all', label: t.pages.features.tabs.all },
    { value: 'operations', label: t.pages.features.tabs.operations },
    { value: 'finance', label: t.pages.features.tabs.finance },
    { value: 'rentals', label: t.pages.features.tabs.rentals },
    { value: 'safety', label: t.pages.features.tabs.safety },
  ];

  const filtered = useMemo(() => {
    if (category === 'all') return PLATFORM_FEATURES;
    return PLATFORM_FEATURES.filter((f) => f.category === category);
  }, [category]);

  return (
    <div>
      <PageHero
        kicker={t.featuresOverview.kicker}
        title={t.pages.features.title}
        subtitle={t.pages.features.subtitle}
      />

      <section className="bg-[#F8F9FE] py-16 lg:py-20">
        <Container>
          <div className="mb-10">
            <SegmentedTabs
              options={tabs}
              value={category}
              onChange={setCategory}
              ariaLabel="Feature categories"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((feat, idx) => {
              const Icon = ICON_MAP[feat.iconName];
              return (
                <article
                  key={feat.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-7 argon-card-shadow-hover flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#324CDD]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs text-[#8898AA]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-bold tracking-tight text-[#172B4D]">
                    {feat.title[locale]}
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#525F7F]">
                    {feat.summary[locale]}
                  </p>

                  <ul className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-sm text-[#525F7F] flex-1">
                    {feat.bullets[locale].map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <Check
                          className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </div>
  );
}
