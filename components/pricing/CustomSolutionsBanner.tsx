'use client';

import React from 'react';
import { ArrowRight, BedDouble, Building2, Layers } from 'lucide-react';
import {
  CUSTOM_PACKAGE_DISCOVERY_CARDS,
  type CustomPackageDiscoveryItem,
} from '@/lib/pricing-config';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

const DISCOVERY_ICON_MAP: Record<
  CustomPackageDiscoveryItem['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  Building2,
  BedDouble,
  Layers,
};

interface CustomSolutionsBannerProps {
  onSelectCategory?: (categoryId: string) => void;
  onExploreCustomSolutions?: () => void;
}

export function CustomSolutionsBanner({
  onSelectCategory,
  onExploreCustomSolutions,
}: CustomSolutionsBannerProps) {
  const { locale } = useLanguage();

  return (
    <div
      id="custom-solutions"
      className="mt-10 sm:mt-14 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 lg:p-10 shadow-[0_2px_12px_rgba(23,43,77,0.04)] scroll-mt-24"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold tracking-tight text-[#324CDD]">
            {locale === 'en'
              ? 'Custom Package Discovery'
              : 'কাস্টম প্যাকেজ সমাধান'}
          </p>
          <h3 className="mt-2 text-[clamp(1.35rem,2.2vw+0.6rem,1.875rem)] font-bold tracking-tight text-[#172B4D]">
            {locale === 'en'
              ? 'Need More Than One Mess?'
              : 'একাধিক মেস বা আবাসন পরিচালনা করছেন?'}
          </h3>
          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#525F7F]">
            {locale === 'en'
              ? 'Managing multiple messes, hostels or accommodation businesses? Get a solution customized around your operations.'
              : 'একাধিক মেস, হোস্টেল বা আবাসন ব্যবসা পরিচালনার জন্য আপনার কার্যক্রম অনুযায়ী কাস্টমাইজড সমাধান নিন।'}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onExploreCustomSolutions}
          className="self-start lg:self-auto"
        >
          <span>
            {locale === 'en'
              ? 'Explore Custom Solutions'
              : 'কাস্টম সমাধান দেখুন'}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Three Package Discovery Cards (1-col mobile/tablet-portrait, 3-col lg+) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {CUSTOM_PACKAGE_DISCOVERY_CARDS.map((card) => {
          const Icon = DISCOVERY_ICON_MAP[card.iconName];
          return (
            <Card
              key={card.id}
              className="group h-full gap-0 py-0 p-5 sm:p-6 border-slate-200/90 bg-[#F8F9FE]/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#324CDD]/35 hover:bg-white hover:shadow-[0_10px_24px_rgba(23,43,77,0.07)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-[#324CDD] shadow-2xs transition-colors duration-200 group-hover:border-[#324CDD] group-hover:bg-[#324CDD] group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <h4 className="mt-4 text-base font-semibold tracking-tight text-[#172B4D]">
                {card.title[locale]}
              </h4>
              <p className="mt-1 text-xs font-medium text-[#324CDD]">
                {card.useCaseLabel[locale]}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-[#525F7F] flex-1">
                {card.description[locale]}
              </p>

              {onSelectCategory && (
                <div className="mt-4 pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(card.defaultCategoryId)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 py-1.5 text-xs font-semibold text-[#324CDD] hover:text-[#172B4D] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD] rounded-md"
                  >
                    <span>
                      {locale === 'en'
                        ? 'Select for custom inquiry'
                        : 'ইনকোয়ারির জন্য নির্বাচন করুন'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
