'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/layout/PageHero';

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LegalDocumentLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  tocLabel: string;
  sections: LegalSection[];
}

export function LegalDocumentLayout({
  title,
  subtitle,
  lastUpdated,
  tocLabel,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <div>
      <PageHero title={title} subtitle={subtitle} meta={lastUpdated} />
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 rounded-xl border border-slate-200 bg-[#F8F9FE] p-6">
                <p className="text-sm font-semibold text-[#172B4D] mb-4">{tocLabel}</p>
                <nav aria-label={tocLabel} className="space-y-2.5">
                  {sections.map((section, idx) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm text-[#525F7F] hover:text-[#324CDD] transition-colors leading-snug"
                    >
                      {String(idx + 1).padStart(2, '0')}. {section.heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <article className="lg:col-span-8 space-y-10 max-w-3xl">
              {sections.map((section, idx) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] tracking-tight">
                    {String(idx + 1).padStart(2, '0')}. {section.heading}
                  </h2>
                  <div className="mt-4 space-y-3.5 text-[0.98rem] leading-relaxed text-[#525F7F]">
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2 pl-5 list-disc text-[0.95rem] leading-relaxed text-[#525F7F]">
                      {section.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </article>
          </div>
        </Container>
      </section>
    </div>
  );
}
