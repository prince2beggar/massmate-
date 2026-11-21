'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, ClipboardList, Receipt } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

type RoleView = 'manager' | 'member' | 'owner';

const ROLE_WORKFLOWS: Record<
  RoleView,
  Array<{
    step: string;
    title: { en: string; bn: string };
    desc: { en: string; bn: string };
  }>
> = {
  manager: [
    {
      step: '01.',
      title: { en: 'Configure Rooms & Rent Structure', bn: 'রুম ও ভাড়ার কাঠামো সেটআপ' },
      desc: {
        en: 'Add each room, seat count, individual rent share, and recurring utility categories once.',
        bn: 'একবারই প্রতিটি রুম, সিট সংখ্যা, ভাড়া ও মাসিক ইউটিলিটি খাত যুক্ত করুন।',
      },
    },
    {
      step: '02.',
      title: { en: 'Log Daily Meals & Bazar Receipts', bn: 'দৈনিক মিল ও বাজার এন্ট্রি' },
      desc: {
        en: 'Confirm daily meal counts after cutoff and enter itemized market expenses from your phone.',
        bn: 'নির্ধারিত সময়ের পর দৈনিক মিল নিশ্চিত করুন এবং মোবাইল থেকেই বাজারের হিসাব লিখুন।',
      },
    },
    {
      step: '03.',
      title: { en: 'Record Deposits & Rent Payments', bn: 'জমা ও ভাড়া পেমেন্ট লিপিবদ্ধ' },
      desc: {
        en: 'Mark cash, bKash, or Nagad payments against each resident with instant balance updates.',
        bn: 'নগদ, বিকাশ বা নগদে প্রাপ্ত টাকা সদস্যদের লেজারে সাথে সাথে যুক্ত করুন।',
      },
    },
    {
      step: '04.',
      title: { en: 'Close the Month in One Click', bn: 'এক ক্লিকেই মাসিক হিসাব ক্লোজিং' },
      desc: {
        en: 'Lock final meal rates, publish clear statements, and hand over manager duty cleanly if rotating.',
        bn: 'চূড়ান্ত মিল রেট লক করুন, স্টেটমেন্ট শেয়ার করুন এবং চাইলে নতুন ম্যানেজারকে দায়িত্ব দিন।',
      },
    },
  ],
  member: [
    {
      step: '01.',
      title: { en: 'Join Your Mess Workspace', bn: 'আপনার মেস ওয়ার্কস্পেসে যুক্ত হোন' },
      desc: {
        en: 'Accept your manager invite to view your room assignment, house rules, and pinned notices.',
        bn: 'ম্যানেজারের আমন্ত্রণ গ্রহণ করে রুম, হাউস রুলস ও নোটিশ বোর্ড দেখুন।',
      },
    },
    {
      step: '02.',
      title: { en: 'Update Daily Meals & Guests', bn: 'দৈনিক মিল ও গেস্ট আপডেট' },
      desc: {
        en: 'Toggle meals off when traveling home or request guest meals before the daily kitchen cutoff.',
        bn: 'বাড়ি যাওয়ার সময় মিল অফ করুন বা কাট-অফ সময়ের আগে গেস্ট মিল যোগ করুন।',
      },
    },
    {
      step: '03.',
      title: { en: 'Verify Live Meal Rate Anytime', bn: 'যেকোনো সময় লাইভ মিল রেট যাচাই' },
      desc: {
        en: 'Inspect bazar entries, your exact meal count, and deposit balance without waiting for month end.',
        bn: 'মাস শেষের অপেক্ষা না করেই বাজার খরচ, নিজের মিল সংখ্যা এবং ব্যালেন্স দেখুন।',
      },
    },
    {
      step: '04.',
      title: { en: 'Access Emergency & Safety Info', bn: 'জরুরি নম্বর ও নিরাপত্তা অ্যাক্সেস' },
      desc: {
        en: 'Reach the house owner, caretaker, or nearest hospital ER in one tap whenever needed.',
        bn: 'প্রয়োজনের মুহূর্তে বাড়িওয়ালা, কেয়ারটেকার বা নিকটস্থ হাসপাতালের নম্বর হাতের নাগালে রাখুন।',
      },
    },
  ],
  owner: [
    {
      step: '01.',
      title: { en: 'Monitor Occupancy Across Floors', bn: 'সব ফ্লোরের অকুপেন্সি পর্যবেক্ষণ' },
      desc: {
        en: 'See active seats, upcoming move-out notices, and vacant rooms across every managed flat.',
        bn: 'প্রতিটি ফ্ল্যাটের পূর্ণ সিট, আসন্ন খালি সিট ও নোটিশ-পিরিয়ড এক নজরে দেখুন।',
      },
    },
    {
      step: '02.',
      title: { en: 'Publish Verified Vacant Listings', bn: 'ভেরিফায়েড খালি রুম প্রকাশ' },
      desc: {
        en: 'Showcase rooms on your branded MessMate website and the public Room Rental directory.',
        bn: 'নিজস্ব MessMate ওয়েবসাইট ও পাবলিক রুম রেন্টাল পোর্টালে খালি রুম প্রকাশ করুন।',
      },
    },
    {
      step: '03.',
      title: { en: 'Track Monthly Rent Collection', bn: 'মাসিক ভাড়া সংগ্রহের স্বচ্ছ রিপোর্ট' },
      desc: {
        en: 'Review house rent and utility settlement summaries submitted by designated floor managers.',
        bn: 'ফ্লোর ম্যানেজারদের জমা দেওয়া ভাড়া ও ইউটিলিটি সংগ্রহের সারসংক্ষেপ পর্যালোচনা করুন।',
      },
    },
    {
      step: '04.',
      title: { en: 'Maintain House Safety Standards', bn: 'ভবনের নিরাপত্তা মান বজায় রাখুন' },
      desc: {
        en: 'Keep verified resident rosters and emergency house contacts updated across turnover cycles.',
        bn: 'সদস্য পরিবর্তনের সাথে সাথে ভেরিফায়েড তালিকা ও জরুরি যোগাযোগ হালনাগাদ রাখুন।',
      },
    },
  ],
};

const MONTHLY_PHASES = [
  {
    icon: Calendar,
    period: { en: 'Days 1 – 5', bn: '১ – ৫ তারিখ' },
    title: { en: 'Opening Deposits & Fixed Rent', bn: 'প্রাথমিক জমা ও ফিক্সড ভাড়া' },
    desc: {
      en: 'Carry-forward balances populate automatically while members submit monthly meal deposits and room rent.',
      bn: 'আগের মাসের ব্যালেন্স স্বয়ংক্রিয়ভাবে যুক্ত হয় এবং সদস্যরা বাজার জমা ও রুম ভাড়া পরিশোধ করেন।',
    },
  },
  {
    icon: ClipboardList,
    period: { en: 'Days 6 – 28', bn: '৬ – ২৮ তারিখ' },
    title: { en: 'Daily Meals, Bazar & Notices', bn: 'দৈনিক মিল, বাজার ও নোটিশ' },
    desc: {
      en: 'Meals and grocery receipts update the running meal rate live so everyone sees real spending trends.',
      bn: 'প্রতিদিনের মিল ও বাজারের রশিদে লাইভ মিল রেট আপডেট হয় যাতে সবাই প্রকৃত খরচ বুঝতে পারেন।',
    },
  },
  {
    icon: Receipt,
    period: { en: 'Days 29 – 30', bn: '২৯ – ৩০ তারিখ' },
    title: { en: 'Utility Split & Final Settlement', bn: 'ইউটিলিটি বিভাজন ও চূড়ান্ত হিসাব' },
    desc: {
      en: 'Add electricity, gas, water, and Wi-Fi bills; MessMate outputs exact payable or refundable balances per resident.',
      bn: 'বিদ্যুৎ, গ্যাস, পানি ও ওয়াই-ফাই বিল বসালেই প্রতিটি সদস্যের চূড়ান্ত পাওনা বা বাকি বের হয়ে আসে।',
    },
  },
];

export function HowItWorksPageClient() {
  const { locale, t } = useLanguage();
  const [role, setRole] = useState<RoleView>('manager');

  const roleTabs: Array<{ value: RoleView; label: string }> = [
    { value: 'manager', label: t.pages.howItWorks.roleTabs.manager },
    { value: 'member', label: t.pages.howItWorks.roleTabs.member },
    { value: 'owner', label: t.pages.howItWorks.roleTabs.owner },
  ];

  const steps = ROLE_WORKFLOWS[role];

  return (
    <div>
      <PageHero
        kicker={t.howItWorks.kicker}
        title={t.pages.howItWorks.title}
        subtitle={t.pages.howItWorks.subtitle}
      />

      {/* Role-Based Workflows */}
      <section className="bg-white py-16 lg:py-20">
        <Container>
          <SegmentedTabs
            options={roleTabs}
            value={role}
            onChange={setRole}
            ariaLabel="Role workflows"
          />

          <ol className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {steps.map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-slate-200 bg-[#F8F9FE] p-6"
              >
                <span className="font-mono tabular-nums text-sm font-bold text-[#324CDD]">
                  {item.step}
                </span>
                <h2 className="mt-3 text-lg font-bold text-[#172B4D]">
                  {item.title[locale]}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[#525F7F]">
                  {item.desc[locale]}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Automated Monthly Closing Lifecycle */}
      <section className="bg-[#F8F9FE] py-16 lg:py-20 border-t border-slate-200/70">
        <Container>
          <SectionHeader
            title={t.pages.howItWorks.cycleTitle}
            subtitle={t.pages.howItWorks.cycleSubtitle}
          />

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-7">
            {MONTHLY_PHASES.map((phase) => {
              const Icon = phase.icon;
              return (
                <article
                  key={phase.period.en}
                  className="rounded-xl border border-slate-200/90 bg-white p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#324CDD]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#324CDD]">
                      {phase.period[locale]}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#172B4D]">
                    {phase.title[locale]}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#525F7F]">
                    {phase.desc[locale]}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-[#172B4D] font-medium">
                {locale === 'en'
                  ? 'Switching mid-month? Enter your current bazar total and meal count to resume seamlessly without waiting for the 1st.'
                  : 'মাসের মাঝখানে শুরু করতে চান? চলতি বাজার ও মিল সংখ্যা বসিয়েই সাথে সাথে শুরু করা যায়।'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </div>
  );
}
