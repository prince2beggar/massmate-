'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { BedDouble, CheckCircle2, ShoppingBag, Utensils } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function HeroParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { locale } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Smooth differential parallax speeds for each depth layer
  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const skylineY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const residenceY = useTransform(scrollYProgress, [0, 1], ['0%', '65%']);
  const foregroundY = useTransform(scrollYProgress, [0, 1], ['0%', '85%']);
  const badge1Y = useTransform(scrollYProgress, [0, 1], ['0px', '-90px']);
  const badge2Y = useTransform(scrollYProgress, [0, 1], ['0px', '-130px']);
  const badge3Y = useTransform(scrollYProgress, [0, 1], ['0px', '-70px']);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none css-parallax-wrapper"
    >
      {/* ------------------------------------------------------------------ */}
      {/* LAYER 0: Deep Celestial Sky, Radiant Horizon Glow & Star Motes     */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        style={prefersReduced ? undefined : { y: skyY }}
        className="absolute inset-0 bg-gradient-to-b from-[#070D1E] via-[#0D183A] to-[#121F4C] css-parallax-sky"
      >
        {/* Ambient atmospheric radial light beams */}
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#324CDD]/15 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[600px] w-[600px] rounded-full bg-[#11CDEF]/10 blur-[140px]" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 h-[350px] w-[1000px] rounded-full bg-amber-500/10 blur-[130px]" />

        {/* Ambient starry speckles */}
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="8%" cy="14%" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="16%" cy="28%" r="1" fill="#93C5FD" opacity="0.6" />
          <circle cx="28%" cy="12%" r="2" fill="url(#star-glow)" opacity="0.9" />
          <circle cx="36%" cy="22%" r="1.2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="48%" cy="16%" r="1.8" fill="url(#star-glow)" opacity="0.85" />
          <circle cx="58%" cy="28%" r="1" fill="#BAE6FD" opacity="0.5" />
          <circle cx="68%" cy="10%" r="2" fill="url(#star-glow)" opacity="0.95" />
          <circle cx="79%" cy="24%" r="1.2" fill="#FFFFFF" opacity="0.75" />
          <circle cx="88%" cy="15%" r="1.5" fill="#93C5FD" opacity="0.65" />
          <circle cx="94%" cy="29%" r="1" fill="#FFFFFF" opacity="0.6" />
        </svg>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 1: Distant City Skyline & Shared Housing Silhouettes          */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        style={prefersReduced ? undefined : { y: skylineY }}
        className="absolute inset-x-0 bottom-24 sm:bottom-28 lg:bottom-32 h-[360px] opacity-45 css-parallax-skyline"
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Distant building silhouettes */}
          <path
            d="M0,320 L0,180 L40,180 L40,150 L75,150 L75,190 L120,190 L120,130 L165,130 L165,210 L210,210 L210,160 L260,160 L260,120 L300,120 L300,170 L350,170 L350,140 L410,140 L410,200 L460,200 L460,110 L520,110 L520,165 L570,165 L570,145 L620,145 L620,190 L680,190 L680,125 L730,125 L730,175 L790,175 L790,135 L840,135 L840,210 L890,210 L890,155 L940,155 L940,115 L1000,115 L1000,180 L1060,180 L1060,140 L1120,140 L1120,195 L1170,195 L1170,130 L1220,130 L1220,160 L1280,160 L1280,120 L1340,120 L1340,170 L1390,170 L1390,145 L1440,145 L1440,320 Z"
            fill="#091432"
          />

          {/* Distant glowing windows representing active residential life */}
          <g fill="#FDE047" opacity="0.6">
            <rect x="50" y="160" width="4" height="6" rx="1" />
            <rect x="62" y="160" width="4" height="6" rx="1" />
            <rect x="135" y="145" width="5" height="7" rx="1" />
            <rect x="145" y="145" width="5" height="7" rx="1" />
            <rect x="135" y="160" width="5" height="7" rx="1" />
            <rect x="275" y="135" width="6" height="8" rx="1" />
            <rect x="285" y="135" width="6" height="8" rx="1" />
            <rect x="475" y="125" width="6" height="8" rx="1" />
            <rect x="490" y="125" width="6" height="8" rx="1" />
            <rect x="475" y="140" width="6" height="8" rx="1" />
            <rect x="490" y="140" width="6" height="8" rx="1" />
            <rect x="695" y="140" width="5" height="7" rx="1" />
            <rect x="710" y="140" width="5" height="7" rx="1" />
            <rect x="955" y="130" width="6" height="8" rx="1" />
            <rect x="970" y="130" width="6" height="8" rx="1" />
            <rect x="1185" y="145" width="5" height="7" rx="1" />
            <rect x="1200" y="145" width="5" height="7" rx="1" />
            <rect x="1295" y="135" width="6" height="8" rx="1" />
          </g>
        </svg>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 2: Midground Modern Shared Living Residence Architecture    */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        style={prefersReduced ? undefined : { y: residenceY }}
        className="absolute inset-x-0 bottom-12 sm:bottom-16 lg:bottom-20 h-[380px] sm:h-[440px] css-parallax-residence"
      >
        <svg
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="building-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1A42" />
              <stop offset="100%" stopColor="#07112B" />
            </linearGradient>
            <linearGradient id="warm-window" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="cyan-window" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Prominent Architectural Outline of Shared Living Complex */}
          <path
            d="M0,420 L0,250 L110,250 L110,200 L240,200 L240,160 L380,160 L380,220 L490,220 L490,170 L620,170 L620,240 L760,240 L760,150 L910,150 L910,210 L1040,210 L1040,165 L1190,165 L1190,230 L1320,230 L1320,185 L1440,185 L1440,420 Z"
            fill="url(#building-grad)"
          />

          {/* Balcony Railings & Architectural Grid Accents */}
          <line x1="240" y1="210" x2="380" y2="210" stroke="#1E293B" strokeWidth="2" />
          <line x1="240" y1="220" x2="380" y2="220" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="760" y1="200" x2="910" y2="200" stroke="#1E293B" strokeWidth="2" />
          <line x1="760" y1="210" x2="910" y2="210" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="1040" y1="215" x2="1190" y2="215" stroke="#1E293B" strokeWidth="2" />

          {/* Lit Living Room / Dining Hall Windows */}
          <g>
            {/* Dining / Common Room Area (warm amber glow) */}
            <rect x="260" y="175" width="28" height="22" rx="2" fill="url(#warm-window)" />
            <rect x="296" y="175" width="28" height="22" rx="2" fill="url(#warm-window)" />
            <rect x="332" y="175" width="28" height="22" rx="2" fill="url(#warm-window)" />

            {/* Study & Resident Rooms (cyan & soft amber) */}
            <rect x="510" y="185" width="24" height="22" rx="2" fill="url(#cyan-window)" />
            <rect x="542" y="185" width="24" height="22" rx="2" fill="url(#warm-window)" />
            <rect x="574" y="185" width="24" height="22" rx="2" fill="url(#cyan-window)" />

            {/* Main Residence Tower Core Windows */}
            <rect x="780" y="170" width="30" height="20" rx="2" fill="url(#warm-window)" />
            <rect x="820" y="170" width="30" height="20" rx="2" fill="url(#warm-window)" />
            <rect x="860" y="170" width="30" height="20" rx="2" fill="url(#cyan-window)" />

            <rect x="780" y="215" width="30" height="20" rx="2" fill="url(#warm-window)" />
            <rect x="820" y="215" width="30" height="20" rx="2" fill="url(#cyan-window)" />
            <rect x="860" y="215" width="30" height="20" rx="2" fill="url(#warm-window)" />

            <rect x="1065" y="180" width="28" height="22" rx="2" fill="url(#warm-window)" />
            <rect x="1105" y="180" width="28" height="22" rx="2" fill="url(#warm-window)" />
            <rect x="1145" y="180" width="28" height="22" rx="2" fill="url(#cyan-window)" />
          </g>

          {/* Warm Bistro String Lights Across Rooftop Balcony */}
          <path
            d="M240,160 Q310,180 380,160"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <g fill="#FDE047">
            <circle cx="265" cy="168" r="3" />
            <circle cx="295" cy="173" r="3" />
            <circle cx="325" cy="173" r="3" />
            <circle cx="355" cy="168" r="3" />
          </g>
        </svg>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 3: Foreground Terrace Silhouette & Ambient Base Shading      */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        style={prefersReduced ? undefined : { y: foregroundY }}
        className="absolute inset-x-0 bottom-0 h-44 sm:h-52 lg:h-60"
      >
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ground-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#050C1F" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#0B132B" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Foreground Terrace Floor & Planter Silhouettes */}
          <path
            d="M0,240 L0,140 Q180,120 360,135 T720,130 T1080,140 T1440,125 L1440,240 Z"
            fill="url(#ground-gradient)"
          />

          {/* Stylized potted terrace plants on left and right */}
          <g fill="#081432">
            {/* Left plant */}
            <path d="M40,140 C35,115 15,100 0,95 C15,110 30,125 40,140 Z" />
            <path d="M40,140 C45,105 70,85 85,80 C70,100 55,120 40,140 Z" />
            <path d="M40,140 C50,110 90,105 110,110 C85,120 60,130 40,140 Z" />
            {/* Right plant */}
            <path d="M1400,125 C1390,95 1365,80 1345,75 C1365,95 1385,110 1400,125 Z" />
            <path d="M1400,125 C1415,95 1440,85 1455,80 C1440,100 1420,115 1400,125 Z" />
          </g>
        </svg>

        {/* Seamless smooth gradient fade into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* LAYER 4: Floating Micro-Operational Status Badges                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge 1: Meal Pulse (Top Right Floating) */}
        <motion.div
          style={prefersReduced ? undefined : { y: badge1Y }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:flex absolute top-28 right-8 xl:right-16 items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/70 p-3.5 text-white backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 shadow-inner">
            <Utensils className="h-5 w-5" />
          </span>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold text-slate-200">
                {locale === 'en' ? 'Daily Meals Active' : 'দৈনিক মিল লাইভ'}
              </p>
            </div>
            <p className="font-mono text-sm font-bold text-white">
              {locale === 'en' ? '14 Logged · ৳64.50' : '১৪টি মিল · ৳৬৪.৫০'}
            </p>
          </div>
        </motion.div>

        {/* Badge 2: Verified Bazar (Bottom Left Floating) */}
        <motion.div
          style={prefersReduced ? undefined : { y: badge2Y }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="hidden lg:flex absolute bottom-44 left-6 xl:left-12 items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/70 p-3.5 text-white backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 shadow-inner">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs font-semibold text-slate-200">
                {locale === 'en' ? 'Bazar Ledger Settled' : 'বাজার খরচ সমন্বিত'}
              </p>
            </div>
            <p className="font-mono text-sm font-bold text-white">
              {locale === 'en' ? '৳1,450 Verified' : '৳১,৪৫০ ভেরিফাইড'}
            </p>
          </div>
        </motion.div>

        {/* Badge 3: Vacant Seats (Center Right Floating) */}
        <motion.div
          style={prefersReduced ? undefined : { y: badge3Y }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hidden xl:flex absolute top-1/2 -translate-y-8 right-6 items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/70 p-3.5 text-white backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#324CDD]/30 text-[#93C5FD] shadow-inner">
            <BedDouble className="h-5 w-5" />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-200">
              {locale === 'en' ? 'Room Availability' : 'রুম ও সিট আপডেট'}
            </p>
            <p className="font-mono text-sm font-bold text-white">
              {locale === 'en' ? '14/16 Beds · 2 Open' : '১৪/১৬ সিট · ২টি খালি'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
