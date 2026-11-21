'use client';

import React, { useState } from 'react';
import { Bell, Building2, Check, Globe, Layout } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface AccentThemePreset {
  id: 'argon-blue' | 'deep-navy' | 'emerald-teal' | 'slate-graphite';
  label: { en: string; bn: string };
  swatch: string;
  headerBg: string;
  buttonBg: string;
  accentText: string;
  softBg: string;
}

const THEME_PRESETS: AccentThemePreset[] = [
  {
    id: 'argon-blue',
    label: { en: 'Argon Cobalt', bn: 'আর্গন কোবাল্ট' },
    swatch: '#324CDD',
    headerBg: 'linear-gradient(135deg, #172B4D 0%, #324CDD 100%)',
    buttonBg: '#324CDD',
    accentText: '#324CDD',
    softBg: '#EEF2FF',
  },
  {
    id: 'deep-navy',
    label: { en: 'Deep Navy', bn: 'ডিপ নেভি' },
    swatch: '#0F172A',
    headerBg: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    buttonBg: '#0F172A',
    accentText: '#1E3A8A',
    softBg: '#F1F5F9',
  },
  {
    id: 'emerald-teal',
    label: { en: 'Emerald Teal', bn: 'এমেরাল্ড টিল' },
    swatch: '#0F766E',
    headerBg: 'linear-gradient(135deg, #134E4A 0%, #0F766E 100%)',
    buttonBg: '#0F766E',
    accentText: '#0F766E',
    softBg: '#F0FDFA',
  },
  {
    id: 'slate-graphite',
    label: { en: 'Slate Graphite', bn: 'স্লেট গ্রাফাইট' },
    swatch: '#334155',
    headerBg: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    buttonBg: '#334155',
    accentText: '#334155',
    softBg: '#F8FAFC',
  },
];

export function ThemeShowcaseSection() {
  const { locale, t } = useLanguage();
  const [presetId, setPresetId] = useState<AccentThemePreset['id']>('argon-blue');
  const [layoutMode, setLayoutMode] = useState<'editorial' | 'compact'>('editorial');
  const [showNotices, setShowNotices] = useState(true);
  const [showRentals, setShowRentals] = useState(true);

  const activePreset =
    THEME_PRESETS.find((p) => p.id === presetId) ?? THEME_PRESETS[0];

  return (
    <section id="theme-showcase" className="bg-white py-20 lg:py-24">
      <Container>
        <SectionHeader
          kicker={t.themeShowcase.kicker}
          title={t.themeShowcase.title}
          subtitle={t.themeShowcase.subtitle}
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Theme Controls */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-[#F8F9FE] p-6 space-y-6">
            <h3 className="text-base font-bold text-[#172B4D]">
              {t.themeShowcase.controlsTitle}
            </h3>

            {/* Accent Selector */}
            <div>
              <p className="text-xs font-semibold text-[#525F7F] mb-3">
                {t.themeShowcase.accentLabel}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const selected = preset.id === presetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPresetId(preset.id)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] ${
                        selected
                          ? 'border-[#324CDD] bg-white text-[#172B4D] shadow-xs'
                          : 'border-slate-200 bg-white/70 text-[#525F7F] hover:bg-white'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.swatch }}
                      >
                        {selected && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span className="truncate">{preset.label[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Presentation */}
            <div>
              <p className="text-xs font-semibold text-[#525F7F] mb-3">
                {t.themeShowcase.layoutLabel}
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => setLayoutMode('editorial')}
                  aria-pressed={layoutMode === 'editorial'}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    layoutMode === 'editorial'
                      ? 'bg-white text-[#172B4D] shadow-xs'
                      : 'text-[#525F7F] hover:text-[#172B4D]'
                  }`}
                >
                  <Layout className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.themeShowcase.layoutEditorial}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('compact')}
                  aria-pressed={layoutMode === 'compact'}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    layoutMode === 'compact'
                      ? 'bg-white text-[#172B4D] shadow-xs'
                      : 'text-[#525F7F] hover:text-[#172B4D]'
                  }`}
                >
                  <Layout className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.themeShowcase.layoutCompact}</span>
                </button>
              </div>
            </div>

            {/* Toggle Visible Public Modules */}
            <div>
              <p className="text-xs font-semibold text-[#525F7F] mb-3">
                {t.themeShowcase.sectionsLabel}
              </p>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B4D] cursor-pointer">
                  <span className="font-medium">{t.themeShowcase.toggleNotices}</span>
                  <input
                    type="checkbox"
                    checked={showNotices}
                    onChange={(e) => setShowNotices(e.target.checked)}
                    className="h-4 w-4 accent-[#324CDD] cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#172B4D] cursor-pointer">
                  <span className="font-medium">{t.themeShowcase.toggleRentals}</span>
                  <input
                    type="checkbox"
                    checked={showRentals}
                    onChange={(e) => setShowRentals(e.target.checked)}
                    className="h-4 w-4 accent-[#324CDD] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Live Microsite Browser Frame Preview */}
          <div className="lg:col-span-8">
            <div
              data-testid="theme-preview-frame"
              data-theme-preset={presetId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white argon-card-shadow"
            >
              {/* Browser Address Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-mono text-[#525F7F]">
                  <Globe className="h-3.5 w-3.5 text-[#324CDD]" aria-hidden="true" />
                  <span>{t.themeShowcase.previewDomain}</span>
                </div>
                <span className="text-xs font-medium text-[#8898AA]">
                  {activePreset.label[locale]}
                </span>
              </div>

              {/* Microsite Header */}
              {layoutMode === 'editorial' ? (
                <div
                  className="p-6 sm:p-8 text-white transition-all duration-200"
                  style={{ background: activePreset.headerBg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight">
                      {t.themeShowcase.previewMessName}
                    </span>
                    <span className="text-xs text-white/80">
                      {locale === 'en' ? 'Dhanmondi · 18 Members' : 'ধানমন্ডি · ১৮ সদস্য'}
                    </span>
                  </div>
                  <h4 className="mt-5 text-xl sm:text-2xl font-bold text-white leading-snug max-w-lg">
                    {t.themeShowcase.previewHeadline}
                  </h4>
                  <p className="mt-2.5 text-sm text-white/85 max-w-xl leading-relaxed">
                    {t.themeShowcase.previewSub}
                  </p>
                </div>
              ) : (
                <div className="border-b border-slate-200 p-6 sm:p-7 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: activePreset.accentText }}
                      >
                        {t.themeShowcase.previewMessName}
                      </p>
                      <h4 className="mt-1 text-lg sm:text-xl font-bold text-[#172B4D]">
                        {t.themeShowcase.previewHeadline}
                      </h4>
                    </div>
                    <span
                      className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white"
                      style={{ backgroundColor: activePreset.buttonBg }}
                    >
                      {t.themeShowcase.previewApplyBtn}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm text-[#525F7F]">
                    {t.themeShowcase.previewSub}
                  </p>
                </div>
              )}

              {/* Preview Dynamic Public Modules */}
              <div className="p-6 sm:p-7 space-y-4 bg-white">
                {showNotices && (
                  <div
                    className="rounded-xl p-4 border border-slate-200/80 transition-colors"
                    style={{ backgroundColor: activePreset.softBg }}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: activePreset.accentText }}>
                      <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.themeShowcase.previewNoticeTitle}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#172B4D] leading-relaxed">
                      {t.themeShowcase.previewNoticeBody}
                    </p>
                  </div>
                )}

                {showRentals && (
                  <div className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: activePreset.buttonBg }}
                      >
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#172B4D]">
                          {t.themeShowcase.previewVacancyTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-[#525F7F] font-mono tabular-nums">
                          {t.themeShowcase.previewVacancyMeta}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                      style={{ backgroundColor: activePreset.buttonBg }}
                    >
                      {t.themeShowcase.previewApplyBtn}
                    </span>
                  </div>
                )}

                {!showNotices && !showRentals && (
                  <p className="py-6 text-center text-sm text-[#8898AA]">
                    {locale === 'en'
                      ? 'Toggle a public module on the left to preview notices or open seat listings.'
                      : 'নোটিশ বা খালি সিট প্রিভিউ দেখতে বাম দিকের যেকোনো মডিউল চালু করুন।'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
