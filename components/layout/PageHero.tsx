import React from 'react';
import { Container } from '@/components/ui/Container';

interface PageHeroProps {
  kicker?: string;
  title: string;
  subtitle: string;
  meta?: string;
}

export function PageHero({ kicker, title, subtitle, meta }: PageHeroProps) {
  return (
    <section className="argon-hero-gradient relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <Container className="relative">
        <div className="max-w-3xl">
          {kicker && (
            <p className="text-sm font-semibold text-[#7DD3FC] mb-3">{kicker}</p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15] text-balance">
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-200 max-w-2xl">
            {subtitle}
          </p>
          {meta && (
            <p className="mt-5 text-xs sm:text-sm text-slate-300">{meta}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
