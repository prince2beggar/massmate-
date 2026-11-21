'use client';

import React, { useRef } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { HeroProductPreview } from '@/components/home/HeroProductPreview';
import { HeroParallaxBackground } from '@/components/home/HeroParallaxBackground';

export function HeroSection() {
  const { locale, t } = useLanguage();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Subtle foreground narrative fade & drift as user scrolls down
  const contentY = useTransform(scrollYProgress, [0, 0.7], ['0px', '-40px']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  const highlights =
    locale === 'en'
      ? ['Transparent meal math', 'Automated rent ledger', 'English & বাংলা']
      : ['স্বচ্ছ মিল রেট হিসাব', 'স্বয়ংক্রিয় ভাড়া লেজার', 'বাংলা ও English'];

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[100dvh] overflow-hidden flex flex-col justify-between pt-20 pb-8 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-16 scroll-mt-16"
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. Immersive Multi-Layer Parallax Background                       */}
      {/* ------------------------------------------------------------------ */}
      <HeroParallaxBackground />

      {/* ------------------------------------------------------------------ */}
      {/* 2. Central Editorial Content & 3D Workspace Stage                  */}
      {/* ------------------------------------------------------------------ */}
      <Container className="relative z-10 my-auto py-6 sm:py-8 lg:py-10">
        <motion.div
          style={prefersReduced ? undefined : { y: contentY, opacity: contentOpacity }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 xl:gap-14 items-center"
        >
          {/* Left Narrative Column */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 min-w-0 space-y-6 sm:space-y-7"
          >
            {/* Editorial Kicker Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-amber-300 backdrop-blur-md shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              <span>{t.hero.kicker}</span>
            </div>

            {/* Large Cinematic Editorial Headline */}
            <h1 className="text-[clamp(2.1rem,4.2vw+0.9rem,3.85rem)] font-extrabold tracking-tight text-white leading-[1.08] text-balance drop-shadow-md">
              {t.hero.headline}
            </h1>

            {/* Editorial Subheadline */}
            <p className="text-[1.025rem] sm:text-lg leading-relaxed text-slate-200/90 max-w-xl font-normal drop-shadow-xs">
              {t.hero.subheadline}
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5 pt-1">
              <Button
                href="#get-started"
                variant="primary"
                size="lg"
                className="group w-full sm:w-auto bg-gradient-to-r from-[#324CDD] to-[#4F46E5] text-white hover:from-[#263DC2] hover:to-[#4338CA] shadow-[0_0_28px_rgba(50,76,221,0.55)] border border-white/20 font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
              <Button
                href="#features"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-md font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-xs"
              >
                <span>{t.hero.secondaryCta}</span>
              </Button>
            </div>

            {/* Trust Message & Compact Verified Highlights */}
            <div className="pt-5 border-t border-white/15 space-y-3">
              <p className="flex items-start gap-2.5 text-sm font-medium text-slate-300 drop-shadow-xs">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-[#38BDF8] mt-0.5"
                  aria-hidden="true"
                />
                <span>{t.hero.trustMessage}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-300/90">
                {highlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
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
            initial={prefersReduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: prefersReduced ? 0 : 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:col-span-7 min-w-0"
          >
            {/* Elevated 3D Glass Stage Container with Ambient Glow */}
            <div className="relative group">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#324CDD]/30 via-[#38BDF8]/20 to-amber-400/20 opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="relative rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_35px_rgba(50,76,221,0.2)]">
                <HeroProductPreview />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Cinematic "Scroll to Explore" Affordance & Story Bridge        */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-2">
        <a
          href="#trust"
          aria-label={locale === 'bn' ? 'পরবর্তী সেকশনে স্ক্রল করুন' : 'Scroll down to explore story'}
          className="group inline-flex flex-col items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-lg p-1"
        >
          <span className="text-[11px] font-semibold tracking-widest uppercase opacity-80 group-hover:opacity-100">
            {locale === 'bn' ? 'স্ক্রল করে জানুন' : 'Scroll to Explore'}
          </span>
          <motion.div
            animate={
              prefersReduced
                ? undefined
                : {
                    y: [0, 5, 0],
                  }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex h-7 w-4 items-start justify-center rounded-full border border-white/30 p-1"
          >
            <motion.div
              animate={
                prefersReduced
                  ? undefined
                  : {
                      y: [0, 8, 0],
                      opacity: [1, 0.2, 1],
                    }
              }
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="h-1.5 w-1 rounded-full bg-amber-400"
            />
          </motion.div>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 -mt-0.5" />
        </a>
      </div>
    </section>
  );
}
