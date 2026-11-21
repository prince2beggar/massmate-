'use client';

import React from 'react';
import { TESTIMONIALS } from '@/data/testimonials';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MotionReveal } from '@/components/ui/MotionReveal';

export function TestimonialsSection() {
  const { locale, t } = useLanguage();

  return (
    <section id="testimonials" className="bg-white py-20 lg:py-24">
      <Container>
        <SectionHeader
          kicker={t.testimonials.kicker}
          title={t.testimonials.title}
          subtitle={t.testimonials.subtitle}
        />

        <MotionReveal className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {TESTIMONIALS.map((item) => (
              <figure
                key={item.id}
                className="flex flex-col rounded-xl border border-slate-200/90 bg-[#F8F9FE] p-7"
              >
                <p className="text-xs font-semibold text-[#324CDD]">
                  {item.segment[locale]} · {item.outcomeMetric[locale]}
                </p>

                <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-[#172B4D] flex-1">
                  &ldquo;{item.quote[locale]}&rdquo;
                </blockquote>

                <figcaption className="mt-6 pt-5 border-t border-slate-200/80">
                  <p className="text-sm font-bold text-[#172B4D]">
                    {item.name[locale]}
                  </p>
                  <p className="text-xs text-[#525F7F] mt-0.5">
                    {item.role[locale]} · {item.organization[locale]}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
