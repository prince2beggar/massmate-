'use client';

import React from 'react';
import {
  HeartHandshake,
  Home,
  Hospital,
  Info,
  Lock,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  MESS_DIRECTORY_CATEGORIES,
  type MessEmergencyCategory,
} from '@/data/emergency-safety';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CATEGORY_ICON_MAP: Record<
  MessEmergencyCategory['iconName'],
  React.ComponentType<{ className?: string }>
> = {
  Home,
  UserCog,
  Stethoscope,
  Hospital,
  Pill,
  Zap,
  Wrench,
  ShieldCheck,
  HeartHandshake,
};

export function MessEmergencyDirectoryGrid() {
  const { locale } = useLanguage();

  return (
    <div className="mt-12 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 lg:p-9 shadow-[0_2px_12px_rgba(23,43,77,0.04)]">
      {/* Header + Explicit DEMO DATA Notice */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D]">
              {locale === 'en'
                ? 'Mess-Specific Emergency Contact Directory'
                : 'প্রতিটি মেসের নিজস্ব জরুরি যোগাযোগ ডিরেক্টরি'}
            </h3>
            <Badge variant="outline" className="bg-amber-50/80 text-[#92400E] border-amber-300/80 font-mono text-[11px]">
              DEMO DATA
            </Badge>
          </div>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#525F7F]">
            {locale === 'en'
              ? 'Every mess on MessMate can maintain its own organized contact directory across essential household, medical, maintenance, and guardian roles.'
              : 'MessMate-এ প্রতিটি মেস নিজের আবাসন, চিকিৎসা, রক্ষণাবেক্ষণ ও পারিবারিক জরুরি যোগাযোগের আলাদা ডিরেক্টরি সাজিয়ে রাখতে পারবে।'}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-slate-200/90 bg-[#F8F9FE] px-3.5 py-2.5 text-xs leading-relaxed text-[#525F7F] max-w-full lg:max-w-sm lg:shrink-0">
          <Info className="h-4 w-4 text-[#324CDD] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {locale === 'en'
              ? 'Illustrative DEMO DATA only — no real or fictional personal phone numbers are published on the public homepage.'
              : 'এগুলো শুধুমাত্র প্রদর্শনের জন্য ডেমো ক্যাটাগরি—পাবলিক হোমপেজে কোনো ব্যক্তিগত ফোন নম্বর প্রদর্শন করা হয় না।'}
          </span>
        </div>
      </div>

      {/* 9 Mess-Specific Category Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MESS_DIRECTORY_CATEGORIES.map((item) => {
          const Icon = CATEGORY_ICON_MAP[item.iconName];
          const isPrivate = item.visibility === 'private';

          return (
            <Card
              key={item.id}
              className="gap-0 py-0 p-5 border-slate-200/90 bg-[#F8F9FE]/55 transition-colors hover:border-[#324CDD]/30 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-[#324CDD] shadow-2xs shrink-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                {isPrivate ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[#172B4D]">
                    <Lock className="h-3 w-3 text-[#525F7F]" aria-hidden="true" />
                    <span>{locale === 'en' ? 'Private' : 'ব্যক্তিগত'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-[#525F7F]">
                    <Users className="h-3 w-3 text-[#324CDD]" aria-hidden="true" />
                    <span>
                      {item.visibility === 'public'
                        ? locale === 'en'
                          ? 'Area Info'
                          : 'এলাকা তথ্য'
                        : locale === 'en'
                        ? 'Member-Only'
                        : 'সদস্যদের জন্য'}
                    </span>
                  </span>
                )}
              </div>

              <h4 className="mt-3.5 text-sm sm:text-base font-semibold tracking-tight text-[#172B4D]">
                {item.category[locale]}
              </h4>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#525F7F] flex-1">
                {item.roleSummary[locale]}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px] font-mono text-[#64748B]">
                <span>{item.demoPlaceholderNote[locale]}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
