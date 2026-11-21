'use client';

import React from 'react';
import Image from 'next/image';
import { Building2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

const SEGMENT_ICONS = [Users, Building2, ShieldCheck, Sparkles];

export function AboutPageClient() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHero
        kicker={t.nav.about}
        title={t.pages.about.title}
        subtitle={t.pages.about.subtitle}
      />

      {/* Mission & Editorial Photography Split */}
      <section className="bg-white py-16 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <SectionHeader
                kicker={t.pages.about.storyKicker}
                title={t.pages.about.storyTitle}
              />
              <div className="mt-6 space-y-4 text-base leading-relaxed text-[#525F7F]">
                <p>{t.pages.about.storyP1}</p>
                <p>{t.pages.about.storyP2}</p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <Image
                  src="/images/about-shared-living.jpg"
                  alt="Modern bright shared living dining and study space"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Core Principles */}
      <section className="bg-[#F8F9FE] py-16 lg:py-20">
        <Container>
          <SectionHeader title={t.pages.about.valuesTitle} />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.pages.about.values.map((val, idx) => (
              <article
                key={val.title}
                className="rounded-xl border border-slate-200/90 bg-white p-7"
              >
                <span className="font-mono text-xs font-bold text-[#324CDD]">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#172B4D]">{val.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#525F7F]">
                  {val.description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Four Segments */}
      <section className="bg-white py-16 lg:py-20">
        <Container>
          <SectionHeader title={t.pages.about.builtForTitle} />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.trust.segments.map((seg, idx) => {
              const Icon = SEGMENT_ICONS[idx % SEGMENT_ICONS.length];
              return (
                <div
                  key={seg}
                  className="rounded-xl border border-slate-200 bg-[#F8F9FE] p-6"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#324CDD]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#172B4D]">{seg}</h3>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </div>
  );
}
