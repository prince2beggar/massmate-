'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SubscriptionPlansGrid } from '@/components/pricing/SubscriptionPlansGrid';
import { CustomSolutionsBanner } from '@/components/pricing/CustomSolutionsBanner';
import { CustomPricingInquiryForm } from '@/components/pricing/CustomPricingInquiryForm';

interface PricingSectionProps {
  compactFooterLink?: boolean;
  background?: 'white' | 'tint';
}

export function PricingSection({
  compactFooterLink = true,
  background = 'tint',
}: PricingSectionProps) {
  const { locale, t } = useLanguage();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('multiple-mess');
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const scrollToInquiry = () => {
    const target = document.getElementById('custom-pricing-inquiry');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = setTimeout(() => {
      const firstInput = document.getElementById('inquiry-business-name');
      if (firstInput instanceof HTMLInputElement) {
        firstInput.focus({ preventScroll: true });
      }
    }, 420);
  };

  const handleSelectDiscoveryCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    scrollToInquiry();
  };

  return (
    <section
      id="pricing"
      className={
        background === 'tint'
          ? 'bg-[#F8F9FE] py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70'
          : 'bg-white py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70'
      }
    >
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <SectionHeader
            kicker={t.pricing.kicker}
            title={t.pricing.title}
            subtitle={t.pricing.subtitle}
          />
          {compactFooterLink && (
            <Link
              href="/pricing"
              className="inline-flex min-h-[40px] items-center gap-2 py-1.5 text-sm font-semibold text-[#324CDD] hover:text-[#172B4D] transition-colors shrink-0 self-start lg:self-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-md"
            >
              <span>
                {locale === 'en'
                  ? 'Open Dedicated Pricing Page'
                  : 'সম্পূর্ণ প্রাইসিং পেজ দেখুন'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Two-Option Subscription Model: Starter Plan & Customized Business Plan */}
        <div className="mt-12">
          <SubscriptionPlansGrid onRequestCustomPricing={scrollToInquiry} />
        </div>

        {/* Custom Package Discovery: "Need More Than One Mess?" */}
        <CustomSolutionsBanner
          onSelectCategory={handleSelectDiscoveryCategory}
          onExploreCustomSolutions={scrollToInquiry}
        />

        {/* Custom Pricing Inquiry Form (Validated Frontend Placeholder) */}
        <CustomPricingInquiryForm
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
        />
      </Container>
    </section>
  );
}
