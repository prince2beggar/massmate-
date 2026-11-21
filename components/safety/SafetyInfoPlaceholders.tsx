'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Building2,
  ChevronDown,
  Cross,
  DoorOpen,
  FileText,
  Flame,
  Globe,
  Info,
  Lock,
  MapPin,
  Users,
} from 'lucide-react';
import {
  SAFETY_INFORMATION_BLOCKS,
  SAFETY_PRIVACY_SCOPES,
  type SafetyInfoPlaceholder,
  type SafetyPrivacyScope,
} from '@/data/emergency-safety';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const SAFETY_INFO_ICON_MAP: Record<
  SafetyInfoPlaceholder['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  DoorOpen,
  Flame,
  Cross,
  MapPin,
  Building2,
  BellRing,
};

const PRIVACY_ICON_MAP: Record<
  SafetyPrivacyScope['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  Globe,
  Users,
  Lock,
  FileText,
};

export function SafetyInfoPlaceholders() {
  const { locale } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('emergency-exit');

  const toggleBlock = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-12 space-y-12">
      {/* Part 1: 6 Expandable Safety Information Placeholder Cards */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold tracking-tight text-[#324CDD]">
              {locale === 'en'
                ? 'Building Safety Readiness'
                : 'ভবন ও আবাসন নিরাপত্তা তথ্য'}
            </p>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D]">
              {locale === 'en'
                ? 'Structured Safety Information Blocks'
                : 'সুশৃঙ্খল নিরাপত্তা তথ্য ও নির্দেশিকা'}
            </h3>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#525F7F]">
              {locale === 'en'
                ? 'Every mess workspace provides dedicated fields for location-specific safety instructions. Select any topic below to see what each mess owner should configure.'
                : 'প্রতিটি মেস ওয়ার্কস্পেসে ভবন-নির্দিষ্ট নিরাপত্তা তথ্য সংরক্ষণের আলাদা অংশ থাকবে। প্রতিটি বিষয়ে মেস মালিক কী তথ্য যুক্ত করবেন তা জানতে নিচে ক্লিক করুন।'}
            </p>
          </div>

          <div className="inline-flex items-start gap-2 rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs text-[#525F7F] max-w-md shrink-0">
            <Info className="h-4 w-4 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {locale === 'en'
                ? 'Informational placeholders only — each mess owner must enter accurate, building-specific exits and safety details.'
                : 'এগুলো তথ্যমূলক প্লেসহোল্ডার—প্রতিটি মেস মালিককে নিজ ভবনের সঠিক বহির্গমন পথ ও নিরাপত্তা তথ্য যুক্ত করতে হবে।'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {SAFETY_INFORMATION_BLOCKS.map((block) => {
            const Icon = SAFETY_INFO_ICON_MAP[block.iconName];
            const isExpanded = expandedId === block.id;
            const panelId = `safety-placeholder-panel-${block.id}`;
            const triggerId = `safety-placeholder-trigger-${block.id}`;

            return (
              <Card
                key={block.id}
                className={cn(
                  'gap-0 py-0 overflow-hidden border-slate-200/90 bg-white transition-colors',
                  isExpanded && 'border-[#324CDD]/40 shadow-[0_6px_20px_rgba(23,43,77,0.06)]'
                )}
              >
                <h4>
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleBlock(block.id)}
                    className="flex w-full min-h-[56px] items-start justify-between gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors hover:bg-[#F8F9FE]/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#324CDD]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#324CDD] shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-semibold text-[#172B4D]">
                            {block.title[locale]}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-medium bg-slate-50">
                            {locale === 'en' ? 'Placeholder' : 'প্লেসহোল্ডার'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#525F7F]">
                          {block.shortSummary[locale]}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-[#64748B] shrink-0 mt-1 transition-transform duration-200',
                        isExpanded && 'rotate-180 text-[#324CDD]'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h4>

                {isExpanded && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className="border-t border-slate-100 bg-[#F8F9FE]/80 px-5 py-4 text-xs sm:text-sm leading-relaxed text-[#172B4D]"
                  >
                    {block.ownerGuidance[locale]}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Part 2: Public & Private Information Boundaries + Future Emergency & Safety Page CTA */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-[0_2px_12px_rgba(23,43,77,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#324CDD]">
              {locale === 'en'
                ? 'Public & Private Safety Boundaries'
                : 'পাবলিক ও ব্যক্তিগত তথ্যের সুরক্ষা'}
            </p>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D]">
              {locale === 'en'
                ? 'Built to Protect Resident Privacy'
                : 'সদস্যদের গোপনীয়তা সুরক্ষায় পরিকল্পিত'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#525F7F]">
              {locale === 'en'
                ? 'MessMate separates public emergency resources from member-only directories and private family contacts—ensuring private information is never exposed on the public website.'
                : 'MessMate পাবলিক জরুরি সেবা, সদস্যদের ডিরেক্টরি এবং ব্যক্তিগত পারিবারিক তথ্যকে সম্পূর্ণ আলাদা রাখে—ব্যক্তিগত তথ্য কখনো পাবলিক ওয়েবসাইটে প্রকাশিত হয় না।'}
            </p>
          </div>

          <div className="flex w-full sm:w-auto flex-col items-stretch sm:items-start lg:items-end gap-1.5 shrink-0">
            <Link
              href="/emergency-safety"
              prefetch={false}
              className={cn(
                buttonVariants({ variant: 'primary', size: 'md' }),
                'w-full sm:w-auto'
              )}
            >
              <span>
                {locale === 'en'
                  ? 'Explore Emergency & Safety Guide'
                  : 'জরুরি ও নিরাপত্তা গাইড দেখুন'}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            <span className="text-[11px] text-[#64748B]">
              {locale === 'en'
                ? 'Links to upcoming dedicated Emergency & Safety page'
                : 'আসন্ন পূর্ণাঙ্গ জরুরি ও নিরাপত্তা পেজের লিংক'}
            </span>
          </div>
        </div>

        {/* 4 Access / Visibility Tiers */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SAFETY_PRIVACY_SCOPES.map((item) => {
            const Icon = PRIVACY_ICON_MAP[item.iconName];
            return (
              <div
                key={item.id}
                className="flex flex-col rounded-xl border border-slate-200/80 bg-[#F8F9FE]/60 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/90 text-[#324CDD]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#525F7F]">
                    {item.badgeLabel[locale]}
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-semibold text-[#172B4D]">
                  {item.title[locale]}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#525F7F]">
                  {item.description[locale]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
