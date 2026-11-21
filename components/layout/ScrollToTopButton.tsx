'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';

export function ScrollToTopButton() {
  const { locale } = useLanguage();
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;

    const handleScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const shouldShow = window.scrollY > 420;
        setVisible((prev) => (prev === shouldShow ? prev : shouldShow));
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleScrollTop}
          aria-label={locale === 'en' ? 'Scroll to top' : 'উপরে যান'}
          title={locale === 'en' ? 'Back to top' : 'উপরে যান'}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/90 bg-[#172B4D] text-white shadow-[0_8px_24px_rgba(23,43,77,0.22)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#324CDD] hover:border-[#324CDD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] focus-visible:ring-offset-2 cursor-pointer"
        >
          <ArrowUp className="h-4.5 w-4.5" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
