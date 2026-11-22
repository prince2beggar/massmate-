'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { HeroProductPreview } from '@/components/home/HeroProductPreview';
import { openAuthModal } from '@/components/auth/AuthModal';

export function HeroSection() {
  const { locale, t } = useLanguage();
  const prefersReduced = useReducedMotion();

  const highlights =
    locale === 'en'
      ? ['Transparent meal math', 'Automated rent ledger', 'English & বাংলা']
      : ['স্বচ্ছ মিল রেট হিসাব', 'স্বয়ংক্রিয় ভাড়া লেজার', 'বাংলা ও English'];

  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-gradient-to-b from-white via-[#F8F9FE]/75 to-white pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-18 lg:pb-22 xl:pt-20 xl:pb-24 border-b border-slate-200/70 scroll-mt-16"
    >
      {/* Subtle architectural soft radial tint behind product visual */}
      <motion.div
        aria-hidden="true"
        animate={
          prefersReduced
            ? undefined
            : {
                scale: [1, 1.05, 1],
                opacity: [0.65, 0.95, 0.65],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -top-24 right-0 h-[360px] w-[360px] sm:h-[480px] sm:w-[560px] rounded-full bg-[#324CDD]/[0.055] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <Container className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 xl:gap-12 items-center">
          {/* Left Narrative Column */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 min-w-0 space-y-5 sm:space-y-6"
          >
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-tight text-[#324CDD]">
              <span>{t.hero.kicker}</span>
            </p>

            <h1 className="text-[clamp(1.875rem,3.6vw+0.85rem,3.25rem)] font-bold tracking-tight text-[#172B4D] leading-[1.12] text-balance">
              {t.hero.headline}
            </h1>

            <p className="text-[0.975rem] sm:text-lg leading-relaxed text-[#525F7F] max-w-xl">
              {t.hero.subheadline}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <Button
                type="button"
                onClick={() => openAuthModal('trial')}
                variant="primary"
                size="lg"
                className="group w-full sm:w-auto hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Button>
              <Button
                href="#features"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto hover:-translate-y-0.5"
              >
                <span>{t.hero.secondaryCta}</span>
              </Button>
            </div>

            {/* Trust Message & Compact Value Highlights */}
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <p className="flex items-start gap-2 text-sm font-medium text-[#525F7F]">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-[#324CDD] mt-0.5"
                  aria-hidden="true"
                />
                <span>{t.hero.trustMessage}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-[#64748B]">
                {highlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-[#059669] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Product Preview Composition */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.42,
              delay: prefersReduced ? 0 : 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:col-span-7 min-w-0"
          >
            <HeroProductPreview />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
