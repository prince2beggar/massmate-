'use client';

import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Globe,
  Handshake,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  CENTRALIZED_CONTACT_PLACEHOLDERS,
  CONTACT_INFO_CHANNELS,
  type ContactChannelPlaceholder,
} from '@/data/about-contact';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { HomepageContactForm } from '@/components/contact/HomepageContactForm';

const CHANNEL_ICONS: Record<
  ContactChannelPlaceholder['iconName'],
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  MessageSquare,
  Briefcase,
  LifeBuoy,
  Handshake,
};

export function ContactSection() {
  const { locale } = useLanguage();

  const handleRequestCustomSolution = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById('custom-pricing-inquiry');
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = target.querySelector<HTMLInputElement>(
        '#inquiry-business-name'
      );
      if (firstInput) {
        window.setTimeout(() => firstInput.focus({ preventScroll: true }), 450);
      }
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-messmate-heading"
      className="bg-[#F8F9FE] py-14 sm:py-18 lg:py-24 scroll-mt-16 border-b border-slate-200/70"
    >
      <Container>
        {/* 1. Section Introduction */}
        <div id="contact-messmate-heading">
          <SectionHeader
            kicker={locale === 'en' ? 'Contact MessMate' : 'যোগাযোগ'}
            title={
              locale === 'en'
                ? "Let's Talk About Your Mess Management Needs"
                : 'আপনার মেস ব্যবস্থাপনার চাহিদা নিয়ে আমাদের সাথে কথা বলুন'
            }
            subtitle={
              locale === 'en'
                ? "Have questions, need a customized solution or want to manage multiple properties? We'd love to hear about your requirements."
                : 'আপনার কোনো প্রশ্ন থাকলে, কাস্টমাইজড সমাধান প্রয়োজন হলে বা একাধিক প্রপার্টি পরিচালনা করতে চাইলে আপনার চাহিদা আমাদের জানান।'
            }
          />
        </div>

        {/* 2. Contact Information Placeholders + Validated Contact Form */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 4 Contact Channels + Office / Social Placeholder Notice */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {CONTACT_INFO_CHANNELS.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.iconName];
                return (
                  <div
                    key={channel.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors duration-150 hover:border-[#324CDD]/30"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#324CDD] shrink-0">
                        <Icon className="h-5 w-5" aria-hidden={true} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-[#172B4D]">
                          {channel.title[locale]}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#525F7F]">
                          {channel.description[locale]}
                        </p>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-[#64748B]">
                          <div className="flex items-center gap-2">
                            <Mail
                              className="h-3.5 w-3.5 text-[#324CDD] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium">
                              {channel.emailPlaceholder[locale]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone
                              className="h-3.5 w-3.5 text-[#324CDD] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium">
                              {channel.phonePlaceholder[locale]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Centralized Office & Official Channels Placeholder Block */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 space-y-2.5 text-xs text-[#525F7F]">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#172B4D]">
                {locale === 'en'
                  ? 'Official Channels Status'
                  : 'অফিসিয়াল যোগাযোগ মাধ্যম'}
              </p>
              <div className="flex items-start gap-2">
                <MapPin
                  className="h-3.5 w-3.5 text-[#64748B] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {CENTRALIZED_CONTACT_PLACEHOLDERS.officeAddress[locale]}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Globe
                  className="h-3.5 w-3.5 text-[#64748B] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {CENTRALIZED_CONTACT_PLACEHOLDERS.socialChannels[locale]}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Validated Frontend-Only Contact Form */}
          <div className="lg:col-span-7">
            <HomepageContactForm />
          </div>
        </div>

        {/* 3. Custom Business Inquiry CTA (Reuses Task 08's #custom-pricing-inquiry) */}
        <div className="mt-10 rounded-2xl border border-[#172B4D] bg-[#172B4D] p-5 sm:p-9 text-white shadow-[0_14px_34px_rgba(23,43,77,0.16)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#93C5FD]">
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {locale === 'en'
                    ? 'Multi-Property & Hostel Solutions'
                    : 'মাল্টি-প্রপার্টি ও হোস্টেল সমাধান'}
                </span>
              </div>
              <h3 className="mt-2.5 text-[clamp(1.375rem,2.4vw+0.6rem,1.875rem)] font-bold tracking-tight text-white">
                {locale === 'en'
                  ? 'Managing Multiple Messes or a Hostel?'
                  : 'একাধিক মেস বা হোস্টেল পরিচালনা করছেন?'}
              </h3>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-300">
                {locale === 'en'
                  ? 'Tell us about your business requirements and explore a customized management solution.'
                  : 'আপনার ব্যবসার প্রয়োজনীয়তা আমাদের জানান এবং আপনার প্রতিষ্ঠানের জন্য কাস্টমাইজড ব্যবস্থাপনা সমাধান যাচাই করুন।'}
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <Button
                href="#custom-pricing-inquiry"
                variant="white"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleRequestCustomSolution}
              >
                <span>
                  {locale === 'en'
                    ? 'Request Custom Solution'
                    : 'কাস্টম সমাধানের অনুরোধ করুন'}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
