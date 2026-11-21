'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function FinalCtaSection() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const isHomePage = pathname === '/';

  const primaryHref = isHomePage ? '#contact' : '/contact';
  const secondaryHref =
    isHomePage || pathname === '/pricing'
      ? '#custom-pricing-inquiry'
      : '/pricing#custom-pricing-inquiry';

  const handleSmoothAnchor = (
    event: React.MouseEvent<HTMLElement>,
    targetId: string,
    focusInputId?: string
  ) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(targetId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (focusInputId) {
        const input = target.querySelector<HTMLElement>(`#${focusInputId}`);
        if (input) {
          window.setTimeout(() => input.focus({ preventScroll: true }), 450);
        }
      }
    }
  };

  return (
    <section
      id="get-started"
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden bg-[#172B4D] py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-white/15"
    >
      {/* Subtle Architectural Top Accent & Crisp Dot Matrix */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#324CDD]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/15 bg-white/[0.04] px-5 py-9 sm:px-12 sm:py-14 text-center shadow-[0_20px_50px_rgba(10,19,38,0.28)]">
          {/* Subtle Eyebrow */}
          <div className="inline-flex max-w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-center text-xs font-semibold leading-snug tracking-wide text-[#BFDBFE]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {locale === 'en'
                ? '7-Day Free Trial · Starter Plan ৳99/month After Trial'
                : '৭ দিনের ফ্রি ট্রায়াল · ট্রায়াল শেষে স্টার্টার প্ল্যান ৳৯৯/মাস'}
            </span>
          </div>

          {/* Heading */}
          <h2
            id="final-cta-heading"
            className="mt-6 text-[clamp(1.625rem,3.4vw+0.75rem,2.65rem)] font-bold tracking-tight text-white leading-[1.15] text-balance"
          >
            {t.finalCta.title}
          </h2>

          {/* Supporting Text */}
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-200 max-w-2xl mx-auto">
            {t.finalCta.subtitle}
          </p>

          {/* Primary & Secondary Actions */}
          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4">
            <Button
              href={primaryHref}
              variant="white"
              size="lg"
              className="w-full sm:w-auto"
              onClick={(e) =>
                handleSmoothAnchor(e, 'contact', 'home-contact-full-name')
              }
            >
              <span>{t.finalCta.primaryCta}</span>
              <ArrowRight
                className="h-4 w-4 text-[#324CDD]"
                aria-hidden="true"
              />
            </Button>

            <Button
              href={secondaryHref}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/15 hover:border-white/45"
              onClick={(e) =>
                handleSmoothAnchor(
                  e,
                  'custom-pricing-inquiry',
                  'inquiry-business-name'
                )
              }
            >
              <Building2 className="h-4 w-4 text-[#BFDBFE]" aria-hidden="true" />
              <span>{t.finalCta.secondaryCta}</span>
            </Button>
          </div>

          {/* Trust Message */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-300">
            <ShieldCheck
              className="h-4 w-4 text-[#93C5FD] shrink-0"
              aria-hidden="true"
            />
            <span>
              {locale === 'en'
                ? 'Simple management for shared living and growing accommodation businesses.'
                : 'শেয়ার্ড লিভিং এবং ক্রমবর্ধমান আবাসন ব্যবসার জন্য সহজ ও সুশৃঙ্খল ব্যবস্থাপনা।'}
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
