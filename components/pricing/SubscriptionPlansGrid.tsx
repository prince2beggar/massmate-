'use client';

import React from 'react';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  CUSTOM_PLAN_CONFIG,
  STARTER_PLAN_CONFIG,
  formatBdtPrice,
} from '@/lib/pricing-config';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { openAuthModal } from '@/components/auth/AuthModal';

interface SubscriptionPlansGridProps {
  onRequestCustomPricing?: () => void;
}

export function SubscriptionPlansGrid({
  onRequestCustomPricing,
}: SubscriptionPlansGridProps) {
  const { locale } = useLanguage();
  const starterPrice = formatBdtPrice(STARTER_PLAN_CONFIG.monthlyPriceBdt);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
      {/* OPTION 01 — Starter Plan */}
      <Card className="lg:col-span-5 h-full gap-0 py-0 overflow-hidden rounded-2xl border-[#324CDD]/25 ring-1 ring-[#324CDD]/15 bg-white shadow-[0_8px_28px_rgba(23,43,77,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(23,43,77,0.1)]">
        <div className="h-1.5 w-full bg-[#324CDD]" aria-hidden="true" />
        <div className="flex flex-1 flex-col p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              {locale === 'en' ? 'Option 01' : 'প্ল্যান ০১'}
            </span>
            <Badge variant="default" className="font-semibold">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{STARTER_PLAN_CONFIG.badge[locale]}</span>
            </Badge>
          </div>

          <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D]">
            {STARTER_PLAN_CONFIG.name[locale]}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#525F7F]">
            {STARTER_PLAN_CONFIG.summary[locale]}
          </p>

          {/* Trial + Monthly Price Block */}
          <div className="mt-6 rounded-xl border border-slate-200/80 bg-[#F8F9FE] p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono tabular-nums text-[clamp(1.875rem,3.2vw,2.25rem)] font-bold tracking-tight text-[#172B4D]">
                {starterPrice}
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#525F7F]">
                {locale === 'en' ? '/ month after 7-day free trial' : '/ মাস (৭ দিনের ফ্রি ট্রায়াল শেষে)'}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-medium text-[#172B4D]">
              {STARTER_PLAN_CONFIG.trialExplanation[locale]}
            </p>
            <div className="mt-2.5 flex items-start gap-2 border-t border-slate-200/80 pt-2.5 text-xs leading-relaxed text-[#525F7F]">
              <ShieldCheck
                className="h-4 w-4 text-[#059669] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{STARTER_PLAN_CONFIG.postTrialPolicy[locale]}</span>
            </div>
          </div>

          {/* Included Features */}
          <div className="mt-6 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              {locale === 'en' ? 'What you receive' : 'যা যা থাকছে'}
            </p>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#172B4D]">
              {STARTER_PLAN_CONFIG.features.map((feature) => (
                <li key={feature.en} className="flex items-start gap-2.5">
                  <Check
                    className="h-4 w-4 text-[#059669] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{feature[locale]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => openAuthModal('trial')}
              variant="primary"
              size="lg"
              className="w-full cursor-pointer"
            >
              <span>
                {locale === 'en'
                  ? 'Start 7-Day Free Trial'
                  : '৭ দিনের ফ্রি ট্রায়াল শুরু করুন'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {/* OPTION 02 — Customized Business Plan */}
      <Card className="lg:col-span-7 h-full gap-0 py-0 overflow-hidden rounded-2xl border-[#172B4D] bg-[#172B4D] text-white shadow-[0_14px_40px_rgba(23,43,77,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(23,43,77,0.24)]">
        <div className="flex flex-1 flex-col p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              {locale === 'en' ? 'Option 02' : 'প্ল্যান ০২'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-sky-200">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{CUSTOM_PLAN_CONFIG.badge[locale]}</span>
            </span>
          </div>

          <h3 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white">
            {CUSTOM_PLAN_CONFIG.name[locale]}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {CUSTOM_PLAN_CONFIG.summary[locale]}
          </p>

          {/* Custom Pricing Header */}
          <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.06] p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {CUSTOM_PLAN_CONFIG.priceHeadline[locale]}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                {locale === 'en' ? 'Contact Us' : 'যোগাযোগ করুন'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {CUSTOM_PLAN_CONFIG.priceNote[locale]}
            </p>
            <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-sky-100/90">
              {locale === 'en'
                ? 'Custom pricing depends on the number of messes, properties, members, and required features.'
                : 'কাস্টম প্রাইসিং নির্ধারিত হয় মেস ও প্রপার্টির সংখ্যা, মোট সদস্য এবং প্রয়োজনীয় ফিচারের ওপর ভিত্তি করে।'}
            </p>
          </div>

          {/* Target Business Categories + Package-Dependent Capabilities */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* 9 Target Business Categories */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">
                {locale === 'en'
                  ? 'Target Business Categories'
                  : 'যাদের জন্য উপযোগী'}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {CUSTOM_PLAN_CONFIG.targetCategories.map((category) => (
                  <li key={category.id} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"
                    />
                    <span>{category.label[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 11 Package-Dependent Capabilities */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">
                {locale === 'en'
                  ? 'Available Custom Capabilities'
                  : 'কাস্টম প্যাকেজ সুবিধাসমূহ'}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {CUSTOM_PLAN_CONFIG.capabilities.map((capability) => (
                  <li key={capability.en} className="flex items-start gap-2">
                    <Check
                      className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{capability[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Explicit Package Scope Disclaimer */}
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-xs leading-relaxed text-slate-300">
            <Info
              className="h-4 w-4 text-sky-300 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{CUSTOM_PLAN_CONFIG.capabilityDisclaimer[locale]}</span>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10">
            {onRequestCustomPricing ? (
              <Button
                type="button"
                variant="white"
                size="lg"
                className="w-full"
                onClick={onRequestCustomPricing}
              >
                <span>
                  {locale === 'en'
                    ? 'Request Custom Pricing'
                    : 'কাস্টম প্রাইসিং অনুরোধ করুন'}
                </span>
                <ArrowRight className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                href="#custom-pricing-inquiry"
                variant="white"
                size="lg"
                className="w-full"
              >
                <span>
                  {locale === 'en'
                    ? 'Request Custom Pricing'
                    : 'কাস্টম প্রাইসিং অনুরোধ করুন'}
                </span>
                <ArrowRight className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
