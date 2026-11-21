'use client';

import React from 'react';
import {
  CheckCircle2,
  Flame,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import {
  NATIONAL_EMERGENCY_CONTACTS,
  getSafeTelHref,
  type NationalEmergencyContact,
} from '@/data/emergency-safety';
import { useLanguage } from '@/context/LanguageContext';

const NATIONAL_ICON_MAP: Record<
  NationalEmergencyContact['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  ShieldAlert,
  Flame,
  HeartPulse,
};

export function NationalEmergencyPanel() {
  const { locale } = useLanguage();

  return (
    <div className="rounded-2xl bg-[#172B4D] p-5 sm:p-8 lg:p-9 text-white shadow-[0_14px_38px_rgba(23,43,77,0.16)] border border-[#1E3A63]">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            {locale === 'en'
              ? 'Bangladesh National Emergency Services'
              : 'বাংলাদেশ জাতীয় জরুরি সেবাসমূহ'}
          </p>
          <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-white">
            {locale === 'en'
              ? 'Immediate National Helplines'
              : 'তাৎক্ষণিক জাতীয় জরুরি হটলাইন'}
          </h3>
          <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
            {locale === 'en'
              ? 'Verified against official Bangladesh government service portals. Tap any verified number below to open your device dialer.'
              : 'বাংলাদেশ সরকারের অফিসিয়াল সেবা পোর্টাল থেকে যাচাইকৃত। আপনার ডিভাইস থেকে কল করতে নিচের যাচাইকৃত নম্বরে ট্যাপ করুন।'}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" aria-hidden="true" />
          <span>
            {locale === 'en'
              ? 'Official .gov.bd Verified'
              : 'সরকারি পোর্টালে যাচাইকৃত'}
          </span>
        </div>
      </div>

      {/* 3 National Emergency Contact Cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {NATIONAL_EMERGENCY_CONTACTS.map((contact) => {
          const Icon = NATIONAL_ICON_MAP[contact.iconName];
          const telHref = getSafeTelHref(contact);

          return (
            <article
              key={contact.id}
              className="flex flex-col rounded-xl border border-white/12 bg-white/[0.06] p-5 sm:p-6 transition-colors hover:bg-white/[0.09]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sky-200 border border-white/10 shrink-0">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                  <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>
                    {contact.verified
                      ? locale === 'en'
                        ? 'Verified'
                        : 'যাচাইকৃত'
                      : locale === 'en'
                      ? 'Requires Confirmation'
                      : 'যাচাই প্রয়োজন'}
                  </span>
                </span>
              </div>

              <h4 className="mt-4 text-base font-bold text-white">
                {contact.serviceName[locale]}
              </h4>
              <p className="mt-1 text-xs font-medium text-sky-200">
                {contact.availability[locale]}
              </p>

              <p className="mt-4 font-mono tabular-nums text-[clamp(1.875rem,3.4vw,2.25rem)] font-bold tracking-tight text-white">
                {contact.number}
              </p>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 flex-1">
                {contact.description[locale]}
              </p>

              <p className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300/90 font-mono">
                {contact.officialSourceLabel[locale]}
              </p>

              <div className="mt-4">
                {telHref ? (
                  <a
                    href={telHref}
                    aria-label={
                      locale === 'en'
                        ? `Call ${contact.serviceName.en} at ${contact.number}`
                        : `${contact.serviceName.bn} (${contact.number}) নম্বরে কল করুন`
                    }
                    className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#172B4D] shadow-xs transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#172B4D]"
                  >
                    <PhoneCall className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
                    <span>
                      {locale === 'en'
                        ? `Tap to Call ${contact.number}`
                        : `কল করুন ${contact.number}`}
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex w-full min-h-[44px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300">
                    {locale === 'en'
                      ? 'Confirmation required before calling'
                      : 'কল করার আগে নম্বর নিশ্চিত করুন'}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
