'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUp,
  Building2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  FOOTER_CONTACT_INFO,
  FOOTER_LEGAL_LINKS,
  FOOTER_PLATFORM_LINKS,
  FOOTER_QUICK_LINKS,
  FOOTER_SOCIAL_LINKS,
  resolveFooterHref,
  type FooterSocialItem,
} from '@/data/footer';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';

const SOCIAL_ICONS: Record<
  FooterSocialItem['id'],
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
};

export function SiteFooter() {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const isHomePage = pathname === '/';

  const handleSocialPlaceholderClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    label: string
  ) => {
    event.preventDefault();
    setSocialNotice(
      locale === 'en'
        ? `${label} — Official MessMate social channels will be announced soon.`
        : `${label} — MessMate-এর অফিসিয়াল সোশ্যাল মিডিয়া চ্যানেল শীঘ্রই ঘোষণা করা হবে।`
    );
  };

  return (
    <footer className="bg-[#0F1E3A] text-slate-300 border-t border-white/10">
      <Container className="pt-12 sm:pt-16 pb-8 sm:pb-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* 1. Brand Section */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link
              href={isHomePage ? '#hero' : '/'}
              className="group inline-flex min-h-[44px] items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-lg"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#324CDD] text-white shadow-xs transition-transform duration-150 group-hover:scale-[1.03]">
                <Building2 className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Mess<span className="text-[#93C5FD]">Mate</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-300 max-w-sm">
              {locale === 'en'
                ? 'A structured mess management SaaS platform designed to organize members, meals, bazar expenses, rent, bills, room rentals, and safety notices in one place.'
                : 'সদস্য, মিল, বাজার খরচ, বাসা ভাড়া, ইউটিলিটি বিল, রুম ভাড়া এবং জরুরি নোটিশ এক জায়গায় সাজিয়ে রাখার জন্য নির্মিত আধুনিক মেস ব্যবস্থাপনা প্ল্যাটফর্ম।'}
            </p>

            <p className="text-xs sm:text-sm font-medium text-[#BFDBFE] max-w-sm">
              {locale === 'en'
                ? 'Making everyday mess and hostel management simpler, clearer, and more organized.'
                : 'প্রতিদিনের মেস ও হোস্টেল ব্যবস্থাপনাকে আরও সহজ, স্বচ্ছ ও সুশৃঙ্খল করে তোলার লক্ষ্য নিয়ে তৈরি।'}
            </p>

            {/* Social Media Placeholders */}
            <div className="pt-2 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {locale === 'en' ? 'Connect (Coming Soon)' : 'সোশ্যাল মিডিয়া (শীঘ্রই আসছে)'}
              </p>
              <div className="flex items-center gap-2">
                {FOOTER_SOCIAL_LINKS.map((social) => {
                  const Icon = SOCIAL_ICONS[social.id];
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      onClick={(e) =>
                        handleSocialPlaceholderClick(e, social.label)
                      }
                      aria-label={
                        locale === 'en'
                          ? `${social.label} (placeholder link — coming soon)`
                          : `${social.label} (শীঘ্রই আসছে)`
                      }
                      title={
                        locale === 'en'
                          ? `${social.label} — Official page coming soon`
                          : `${social.label} — শীঘ্রই আসছে`
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-slate-300 transition-all duration-150 hover:border-[#93C5FD]/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]"
                    >
                      <Icon className="h-4 w-4" aria-hidden={true} />
                    </a>
                  );
                })}
              </div>
              {socialNotice && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs text-[#BFDBFE]"
                >
                  {socialNotice}
                </p>
              )}
            </div>
          </div>

          {/* 2. Quick Links */}
          <nav
            aria-label={locale === 'en' ? 'Quick Links' : 'দ্রুত লিংক'}
            className="lg:col-span-2 space-y-3.5"
          >
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              {locale === 'en' ? 'Quick Links' : 'দ্রুত লিংক'}
            </h3>
            <ul className="space-y-0.5 text-sm">
              {FOOTER_QUICK_LINKS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={resolveFooterHref(item, pathname)}
                    className="inline-flex min-h-[36px] items-center py-1 text-slate-300 transition-all duration-150 hover:text-white hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs"
                  >
                    {item.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. Platform Links */}
          <nav
            aria-label={locale === 'en' ? 'Platform Links' : 'প্ল্যাটফর্ম লিংক'}
            className="lg:col-span-2 space-y-3.5"
          >
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              {locale === 'en' ? 'Platform' : 'প্ল্যাটফর্ম'}
            </h3>
            <ul className="space-y-0.5 text-sm">
              {FOOTER_PLATFORM_LINKS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={resolveFooterHref(item, pathname)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 py-1 text-slate-300 transition-all duration-150 hover:text-white hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs"
                  >
                    <span>{item.label[locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 4. Contact Information (Placeholders Only) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              {locale === 'en' ? 'Contact Info' : 'যোগাযোগ তথ্য'}
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Mail
                  className="h-4 w-4 text-[#93C5FD] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="leading-snug">
                  {FOOTER_CONTACT_INFO.emailPlaceholder[locale]}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone
                  className="h-4 w-4 text-[#93C5FD] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="leading-snug">
                  {FOOTER_CONTACT_INFO.phonePlaceholder[locale]}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="h-4 w-4 text-[#93C5FD] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="leading-snug">
                  {FOOTER_CONTACT_INFO.locationReference[locale]}
                </span>
              </li>
            </ul>
          </div>

          {/* 5. Legal Links & Language Switcher */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              {locale === 'en' ? 'Legal' : 'আইনি তথ্য'}
            </h3>
            <ul className="space-y-0.5 text-sm">
              {FOOTER_LEGAL_LINKS.map((item) => (
                <li key={item.id}>
                  <Link
                    href={resolveFooterHref(item, pathname)}
                    className="inline-flex min-h-[36px] items-center py-1 text-slate-300 transition-all duration-150 hover:text-white hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs"
                  >
                    {item.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-3">
              <div
                role="group"
                aria-label="Footer language switcher"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.05] p-1"
              >
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  aria-pressed={locale === 'en'}
                  className={cn(
                    'min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
                    locale === 'en'
                      ? 'bg-white text-[#172B4D]'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('bn')}
                  aria-pressed={locale === 'bn'}
                  className={cn(
                    'min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
                    locale === 'bn'
                      ? 'bg-white text-[#172B4D]'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  বাংলা
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Utility Bar */}
        <div className="mt-12 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            {locale === 'en'
              ? `© ${currentYear} MessMate. All rights reserved.`
              : `© ${currentYear} MessMate। সর্বস্বত্ব সংরক্ষিত।`}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {locale === 'en'
                  ? 'English · বাংলা Ready'
                  : 'বাংলা · English সমর্থিত'}
              </span>
            </span>

            <Link
              href={isHomePage ? '#hero' : '#main-content'}
              className="inline-flex min-h-[36px] items-center gap-1 px-1 font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs"
            >
              <span>{locale === 'en' ? 'Back to top' : 'উপরে যান'}</span>
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
