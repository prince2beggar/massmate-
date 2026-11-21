'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Building2, Lock, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import { useActiveSection } from '@/hooks/use-active-section';
import {
  PRIMARY_NAV_ITEMS,
  isNavItemActive,
  resolveNavHref,
} from '@/lib/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { locale, setLocale, t } = useLanguage();
  const activeSection = useActiveSection(isHomePage);

  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [loginInfoOpen, setLoginInfoOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileOpen = openForPath === pathname;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const scrolled = window.scrollY > 12;
        setIsScrolled((prev) => (prev === scrolled ? prev : scrolled));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenForPath(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const getStartedHref = isHomePage ? '#get-started' : '/#get-started';
  const closeMobileMenu = () => setOpenForPath(null);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 h-16 w-full transition-all duration-200',
        isScrolled || mobileOpen
          ? 'border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_2px_14px_rgba(23,43,77,0.06)]'
          : 'border-b border-slate-200/60 bg-white/90 backdrop-blur-sm'
      )}
    >
      <Container className="flex h-full items-center justify-between gap-2 sm:gap-4 xl:gap-6">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <Link
          href={isHomePage ? '#hero' : '/'}
          onClick={closeMobileMenu}
          className="group inline-flex min-h-[44px] items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-lg"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#324CDD] text-white shadow-xs transition-transform duration-150 group-hover:scale-[1.03]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base sm:text-lg font-bold tracking-tight text-[#172B4D]">
            Mess<span className="text-[#324CDD]">Mate</span>
          </span>
        </Link>

        {/* Zone 2: Desktop Primary Navigation (xl+ to keep 768px-1024px tablet spotless in EN & BN) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-4 2xl:gap-5"
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
            const href = resolveNavHref(item, pathname);
            const active = isNavItemActive(item, pathname, activeSection);
            return (
              <Link
                key={item.id}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded-xs',
                  active
                    ? 'text-[#172B4D] font-semibold'
                    : 'text-[#525F7F] hover:text-[#172B4D]'
                )}
              >
                <span>{t.nav[item.labelKey]}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 -bottom-[2px] h-0.5 rounded-full transition-all duration-200',
                    active
                      ? 'bg-[#324CDD] opacity-100'
                      : 'bg-slate-300 opacity-0 group-hover:opacity-100'
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher (বাংলা / EN), Login, Get Started & Mobile/Tablet Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center rounded-lg border border-slate-200/90 bg-[#F8F9FE] p-0.5"
          >
            <button
              type="button"
              onClick={() => setLocale('bn')}
              aria-pressed={locale === 'bn'}
              className={cn(
                'inline-flex min-h-[36px] sm:min-h-[34px] items-center justify-center rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
                locale === 'bn'
                  ? 'bg-white text-[#172B4D] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172B4D]'
              )}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
              className={cn(
                'inline-flex min-h-[36px] sm:min-h-[34px] items-center justify-center rounded-md px-2 sm:px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]',
                locale === 'en'
                  ? 'bg-white text-[#172B4D] font-semibold shadow-xs'
                  : 'text-[#64748B] hover:text-[#172B4D]'
              )}
            >
              English
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLoginInfoOpen(true)}
            >
              {t.nav.login}
            </Button>
            <Button href={getStartedHref} variant="primary" size="sm">
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpenForPath(mobileOpen ? null : pathname)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileOpen ? t.nav.menuClose : t.nav.menuOpen}
            className="xl:hidden inline-flex items-center justify-center rounded-lg p-2 text-[#172B4D] hover:bg-slate-100 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] cursor-pointer"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>
      </header>

      {/* Accessible Mobile Navigation Drawer + Full-Viewport Click-Away Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-x-0 top-16 bottom-0 z-30 xl:hidden"
          >
            <button
              type="button"
              aria-label={
                locale === 'bn'
                  ? 'মেনু ব্যাকড্রপ বন্ধ করুন'
                  : 'Dismiss navigation menu'
              }
              onClick={closeMobileMenu}
              className="absolute inset-0 h-full w-full bg-[#172B4D]/30 backdrop-blur-[2px] cursor-default"
            />
            <motion.div
              id="mobile-navigation-drawer"
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 max-h-full overflow-y-auto border-b border-slate-200 bg-white shadow-xl"
            >
              <Container className="py-4 space-y-2">
                <nav
                  aria-label="Mobile Navigation"
                  className="flex flex-col space-y-1"
                >
                  {PRIMARY_NAV_ITEMS.map((item) => {
                    const href = resolveNavHref(item, pathname);
                    const active = isNavItemActive(item, pathname, activeSection);
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        onClick={closeMobileMenu}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'rounded-lg px-3.5 py-3 text-base font-medium transition-colors min-h-[44px] flex items-center justify-between',
                          active
                            ? 'bg-[#EEF2FF] text-[#324CDD] font-semibold'
                            : 'text-[#172B4D] hover:bg-slate-50'
                        )}
                      >
                        <span>{t.nav[item.labelKey]}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      closeMobileMenu();
                      setLoginInfoOpen(true);
                    }}
                  >
                    {t.nav.login}
                  </Button>
                  <Button
                    href={getStartedHref}
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={closeMobileMenu}
                  >
                    {t.nav.getStarted}
                  </Button>
                </div>
              </Container>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-auth Login Preview Dialog */}
      <Dialog open={loginInfoOpen} onOpenChange={setLoginInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#324CDD]">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>
              {locale === 'bn'
                ? 'মেম্বার ও ম্যানেজার লগইন শীঘ্রই আসছে'
                : 'Member & Manager Workspace Login'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'bn'
                ? 'এই পাবলিক ওয়েবসাইটে এখনো অথেনটিকেশন যুক্ত করা হয়নি। প্রারম্ভিক অ্যাক্সেস বা ডেমো বুকিংয়ের জন্য আমাদের টিমের সাথে যোগাযোগ করুন।'
                : 'Workspace authentication and resident portals are planned for an upcoming release. Request early onboarding access or explore our public features below.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline">
                  {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </Button>
              }
            />
            <Button
              href="/contact"
              variant="primary"
              onClick={() => setLoginInfoOpen(false)}
            >
              <span>
                {locale === 'bn' ? 'আর্লি অ্যাক্সেস নিন' : 'Request Early Access'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
