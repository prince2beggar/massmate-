'use client';

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Lock,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export interface PlaceholderRouteProps {
  icon: 'lock' | 'users' | 'receipt' | 'shield';
  kicker: { en: string; bn: string };
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  highlights: Array<{ en: string; bn: string }>;
  primaryCta: { label: { en: string; bn: string }; href: string };
  secondaryCta: { label: { en: string; bn: string }; href: string };
}

const ICONS = {
  lock: Lock,
  users: Users,
  receipt: ReceiptText,
  shield: ShieldCheck,
};

export function PlaceholderRouteView({
  icon,
  kicker,
  title,
  description,
  highlights,
  primaryCta,
  secondaryCta,
}: PlaceholderRouteProps) {
  const { locale } = useLanguage();
  const Icon = ICONS[icon];

  return (
    <section className="bg-[#F8F9FE] py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-11 shadow-[0_8px_28px_rgba(23,43,77,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#324CDD]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-[#92400E]">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {locale === 'en'
                  ? 'Placeholder Route · Planned Release'
                  : 'প্লেসহোল্ডার পেজ · আসন্ন রিলিজ'}
              </span>
            </span>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#324CDD]">
            {kicker[locale]}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
            {title[locale]}
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#525F7F]">
            {description[locale]}
          </p>

          <ul className="mt-6 space-y-2.5 rounded-xl border border-slate-200/80 bg-[#F8F9FE] p-5">
            {highlights.map((item) => (
              <li
                key={item.en}
                className="flex items-start gap-2.5 text-sm text-[#32325D]"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#324CDD] shrink-0"
                />
                <span>{item[locale]}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              href={primaryCta.href}
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              <span>{primaryCta.label[locale]}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              href={secondaryCta.href}
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{secondaryCta.label[locale]}</span>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
