'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategory } from '@/data/faq';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Accordion } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

export function FaqPageClient() {
  const { locale, t } = useLanguage();
  const [category, setCategory] = useState<FaqCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const tabOptions = FAQ_CATEGORIES.map((cat) => ({
    value: cat.id,
    label: cat.label[locale],
  }));

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.en.toLowerCase().includes(q) ||
        item.question.bn.toLowerCase().includes(q) ||
        item.answer.en.toLowerCase().includes(q) ||
        item.answer.bn.toLowerCase().includes(q)
      );
    }).map((item) => ({
      id: item.id,
      badge: item.number,
      question: item.question[locale],
      answer: item.answer[locale],
    }));
  }, [category, query, locale]);

  return (
    <div>
      <PageHero
        kicker={t.faq.kicker}
        title={t.pages.faq.title}
        subtitle={t.pages.faq.subtitle}
      />

      <section className="bg-[#F8F9FE] py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Box */}
            <div className="relative">
              <label htmlFor="faq-search" className="sr-only">
                {t.pages.faq.searchPlaceholder}
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8898AA]"
                aria-hidden="true"
              />
              <input
                id="faq-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.pages.faq.searchPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3.5 text-sm text-[#172B4D] placeholder:text-[#8898AA] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
              />
            </div>

            {/* Category Tabs */}
            <SegmentedTabs
              options={tabOptions}
              value={category}
              onChange={setCategory}
              ariaLabel="FAQ Categories"
            />

            {/* Results */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              {filteredItems.length > 0 ? (
                <Accordion items={filteredItems} />
              ) : (
                <div className="py-10 text-center space-y-4">
                  <p className="text-base font-semibold text-[#172B4D]">
                    {t.pages.faq.noResults}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setCategory('all');
                    }}
                  >
                    {t.pages.faq.clearSearch}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </div>
  );
}
