'use client';

import React from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  Layers,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ABOUT_HOW_MESSMATE_HELPS,
  ABOUT_MISSION_VISION,
  ABOUT_PROBLEMS_SOLVED,
  ABOUT_TARGET_AUDIENCES,
  ABOUT_WHY_CHOOSE_ITEMS,
  type AboutHighlightItem,
} from '@/data/about-contact';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';

const HIGHLIGHT_ICONS: Record<
  AboutHighlightItem['iconName'],
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  Sparkles,
  Eye,
  Layers,
  Users,
};

export function AboutSection() {
  const { locale } = useLanguage();

  return (
    <section
      id="about"
      aria-labelledby="about-messmate-heading"
      className="bg-white py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70"
    >
      <Container>
        {/* 1. Editorial Section Introduction */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div id="about-messmate-heading">
            <SectionHeader
              kicker={locale === 'en' ? 'About MessMate' : 'MessMate সম্পর্কে'}
              title={
                locale === 'en'
                  ? 'Making Shared Living Simpler and Smarter'
                  : 'শেয়ার্ড লিভিং ব্যবস্থাপনাকে আরও সহজ ও স্মার্ট করে তোলা'
              }
              subtitle={
                locale === 'en'
                  ? 'MessMate brings everyday mess management into one organized platform, helping people manage shared living with greater transparency, convenience and confidence.'
                  : 'MessMate প্রতিদিনের মেস ব্যবস্থাপনাকে একটি সুশৃঙ্খল প্ল্যাটফর্মে একত্রিত করে, যাতে শেয়ার্ড লিভিং পরিচালনা হয় আরও স্বচ্ছ, সহজ এবং নির্ভরযোগ্য।'
              }
            />
          </div>

          <div className="inline-flex max-w-full items-center gap-2 self-start lg:self-end rounded-lg border border-slate-200/90 bg-[#F8F9FE] px-3.5 py-2 text-xs font-semibold text-[#172B4D]">
            <Building2
              className="h-4 w-4 text-[#324CDD] shrink-0"
              aria-hidden="true"
            />
            <span>
              {locale === 'en'
                ? 'Built for Everyday Shared Accommodation'
                : 'দৈনন্দিন শেয়ার্ড আবাসনের জন্য নির্মিত'}
            </span>
          </div>
        </div>

        {/* 2. Who MessMate Is Designed For (7 Target Audiences) */}
        <div className="mt-10 sm:mt-12 rounded-2xl border border-slate-200/90 bg-[#F8F9FE] p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 border-b border-slate-200/80">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#172B4D]">
              {locale === 'en'
                ? 'Designed for Every Shared Living Community'
                : 'সব ধরনের শেয়ার্ড লিভিং কমিউনিটির জন্য উপযোগী'}
            </h3>
            <p className="text-xs sm:text-sm text-[#525F7F]">
              {locale === 'en'
                ? 'From a single student mess to multi-property accommodation operators'
                : 'একটি স্টুডেন্ট মেস থেকে শুরু করে একাধিক প্রপার্টি অপারেটর পর্যন্ত'}
            </p>
          </div>

          <ul
            aria-label={
              locale === 'en'
                ? 'Who MessMate is designed for'
                : 'যাদের জন্য MessMate নির্মিত'
            }
            className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {ABOUT_TARGET_AUDIENCES.map((audience, idx) => (
              <li
                key={audience.en}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-[#172B4D] shadow-2xs"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#EEF2FF] font-mono text-[11px] font-bold text-[#324CDD]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="leading-snug">{audience[locale]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Problems Solved vs. How MessMate Helps */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Editorial Column: Problems We Aim to Solve */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(23,43,77,0.03)] flex flex-col">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-[#B45309] shrink-0">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B45309]">
                  {locale === 'en' ? 'The Everyday Challenge' : 'প্রতিদিনের চ্যালেঞ্জ'}
                </p>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D]">
                  {locale === 'en'
                    ? 'Problems MessMate Aims to Solve'
                    : 'যে সমস্যাগুলো সমাধানের জন্য MessMate'}
                </h3>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#525F7F]">
              {locale === 'en'
                ? 'Shared residences often rely on scattered notebooks, spreadsheets, and informal chat threads that lead to end-of-month confusion.'
                : 'অনেক শেয়ার্ড মেস ও হোস্টেল এখনো খাতা-কলম, স্প্রেডশিট ও ছড়ানো চ্যাটের ওপর নির্ভর করে—যার ফলে মাস শেষে হিসাব নিয়ে বিভ্রান্তি তৈরি হয়।'}
            </p>

            <ul className="mt-6 space-y-3 flex-1">
              {ABOUT_PROBLEMS_SOLVED.map((problem) => (
                <li
                  key={problem.en}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#F8F9FE]/70 px-4 py-3 text-sm text-[#32325D]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0"
                  />
                  <span className="font-medium leading-relaxed">
                    {problem[locale]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Editorial Column: How MessMate Helps */}
          <div className="rounded-2xl border border-[#324CDD]/20 bg-white p-6 sm:p-8 shadow-[0_4px_18px_rgba(50,76,221,0.05)] flex flex-col">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] border border-[#324CDD]/15 text-[#324CDD] shrink-0">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#324CDD]">
                  {locale === 'en' ? 'Structured Solution' : 'সুশৃঙ্খল সমাধান'}
                </p>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D]">
                  {locale === 'en'
                    ? 'How MessMate Helps'
                    : 'যেভাবে MessMate সাহায্য করে'}
                </h3>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#525F7F]">
              {locale === 'en'
                ? 'One structured digital workspace keeps daily operations clear for managers, property owners, and residents alike.'
                : 'একটি সাজানো ডিজিটাল ওয়ার্কস্পেস ম্যানেজার, মালিক এবং প্রতিটি সদস্যের জন্য প্রতিদিনের কার্যক্রমকে স্পষ্ট ও সহজ রাখে।'}
            </p>

            <ul className="mt-6 space-y-3 flex-1">
              {ABOUT_HOW_MESSMATE_HELPS.map((item) => (
                <li
                  key={item.en}
                  className="flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-4 py-3 text-sm text-[#172B4D]"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 text-[#059669] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium leading-relaxed">
                    {item[locale]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Mission & Vision (Two Visually Distinct Editorial Blocks) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mission Card — Light Cobalt-Accented Editorial Surface */}
          <article className="relative overflow-hidden rounded-2xl border border-[#324CDD]/20 bg-[#F8F9FE] p-6 sm:p-9">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-[#324CDD]"
            />
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#324CDD]/20 text-[#324CDD] shadow-2xs shrink-0">
                <Target className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D]">
                {ABOUT_MISSION_VISION.mission.heading[locale]}
              </h3>
            </div>
            <blockquote className="mt-5 text-base sm:text-lg font-medium leading-relaxed text-[#172B4D]">
              &ldquo;{ABOUT_MISSION_VISION.mission.statement[locale]}&rdquo;
            </blockquote>
          </article>

          {/* Vision Card — Deep Navy High-Contrast Editorial Surface */}
          <article className="relative overflow-hidden rounded-2xl border border-[#172B4D] bg-[#172B4D] p-6 sm:p-9 text-white shadow-[0_12px_30px_rgba(23,43,77,0.14)]">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-[#5E72E4]"
            />
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-[#93C5FD] shrink-0">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {ABOUT_MISSION_VISION.vision.heading[locale]}
              </h3>
            </div>
            <blockquote className="mt-5 text-base sm:text-lg font-medium leading-relaxed text-slate-100">
              &ldquo;{ABOUT_MISSION_VISION.vision.statement[locale]}&rdquo;
            </blockquote>
          </article>
        </div>

        {/* 5. Why Choose MessMate? (4 Core Highlights) */}
        <div className="mt-12 sm:mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#324CDD]">
                {locale === 'en' ? 'Platform Principles' : 'প্ল্যাটফর্মের মূল ভিত্তি'}
              </p>
              <h3 className="mt-1.5 text-[clamp(1.375rem,2.2vw+0.6rem,1.875rem)] font-bold tracking-tight text-[#172B4D]">
                {locale === 'en'
                  ? 'Why Choose MessMate?'
                  : 'কেন MessMate বেছে নেবেন?'}
              </h3>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {ABOUT_WHY_CHOOSE_ITEMS.map((item) => {
              const Icon = HIGHLIGHT_ICONS[item.iconName];
              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-[#324CDD]/35 hover:shadow-[0_8px_24px_rgba(23,43,77,0.06)]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#324CDD] transition-colors duration-200 group-hover:bg-[#324CDD] group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden={true} />
                  </span>
                  <h4 className="mt-4 text-base font-bold tracking-tight text-[#172B4D]">
                    {item.title[locale]}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#525F7F]">
                    {item.description[locale]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
