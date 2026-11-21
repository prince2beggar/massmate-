'use client';

import React, { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { RENTAL_LISTINGS } from '@/data/rentals';
import {
  DEFAULT_RENTAL_FILTERS,
  filterAndSortRentals,
  type GenderPolicy,
  type MessCategory,
  type RentalFilterState,
  type RentalListing,
  type RentalSortOption,
  type RoomType,
} from '@/lib/rental-filter';
import { useLanguage } from '@/context/LanguageContext';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Button } from '@/components/ui/Button';
import { RentalCard } from '@/components/rental/RentalCard';
import { RentalDetailModal } from '@/components/rental/RentalDetailModal';

export function RentalExplorer() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<RentalFilterState>(DEFAULT_RENTAL_FILTERS);
  const [selectedListing, setSelectedListing] = useState<RentalListing | null>(null);

  const results = useMemo(
    () => filterAndSortRentals(RENTAL_LISTINGS, filters),
    [filters]
  );

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.category !== 'all' ||
    filters.roomType !== 'all' ||
    filters.genderPolicy !== 'all' ||
    filters.maxRentBdt !== null ||
    filters.sortBy !== 'featured';

  const categoryTabs: Array<{ value: MessCategory | 'all'; label: string }> = [
    { value: 'all', label: t.rentalShowcase.categories.all },
    { value: 'student', label: t.rentalShowcase.categories.student },
    { value: 'bachelor', label: t.rentalShowcase.categories.bachelor },
    { value: 'job-holder', label: t.rentalShowcase.categories['job-holder'] },
    { value: 'shared-apartment', label: t.rentalShowcase.categories['shared-apartment'] },
  ];

  const resetFilters = () => setFilters(DEFAULT_RENTAL_FILTERS);

  return (
    <div>
      <PageHero
        kicker={t.rentalShowcase.kicker}
        title={t.pages.roomRental.title}
        subtitle={t.pages.roomRental.subtitle}
      />

      <section className="bg-[#F8F9FE] py-12 lg:py-16">
        <Container>
          {/* Filter Controls Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <SegmentedTabs
              options={categoryTabs}
              value={filters.category}
              onChange={(next) => setFilters((prev) => ({ ...prev, category: next }))}
              ariaLabel="Mess category filter"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
              {/* Search */}
              <div className="lg:col-span-4 relative">
                <label htmlFor="rental-search" className="sr-only">
                  {t.pages.roomRental.searchPlaceholder}
                </label>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8898AA]"
                  aria-hidden="true"
                />
                <input
                  id="rental-search"
                  type="text"
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder={t.pages.roomRental.searchPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#172B4D] placeholder:text-[#8898AA] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
                />
              </div>

              {/* Room Type */}
              <div className="lg:col-span-2">
                <label htmlFor="rental-room-type" className="sr-only">
                  Room Type
                </label>
                <select
                  id="rental-room-type"
                  value={filters.roomType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      roomType: e.target.value as RoomType | 'all',
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#172B4D] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
                >
                  <option value="all">{t.pages.roomRental.roomTypeAll}</option>
                  <option value="single-room">{t.pages.roomRental.roomTypeSingle}</option>
                  <option value="shared-room">{t.pages.roomRental.roomTypeShared}</option>
                  <option value="single-seat">{t.pages.roomRental.roomTypeSeat}</option>
                </select>
              </div>

              {/* Gender Policy */}
              <div className="lg:col-span-2">
                <label htmlFor="rental-gender" className="sr-only">
                  Resident Policy
                </label>
                <select
                  id="rental-gender"
                  value={filters.genderPolicy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      genderPolicy: e.target.value as GenderPolicy | 'all',
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#172B4D] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
                >
                  <option value="all">{t.pages.roomRental.genderAll}</option>
                  <option value="male">{t.pages.roomRental.genderMale}</option>
                  <option value="female">{t.pages.roomRental.genderFemale}</option>
                  <option value="any">{t.pages.roomRental.genderAny}</option>
                </select>
              </div>

              {/* Max Rent */}
              <div className="lg:col-span-2">
                <label htmlFor="rental-max-rent" className="sr-only">
                  Max Monthly Rent
                </label>
                <select
                  id="rental-max-rent"
                  value={filters.maxRentBdt === null ? 'any' : String(filters.maxRentBdt)}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxRentBdt: e.target.value === 'any' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#172B4D] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
                >
                  <option value="any">{t.pages.roomRental.maxRentAny}</option>
                  <option value="6000">≤ ৳6,000 / mo</option>
                  <option value="8000">≤ ৳8,000 / mo</option>
                  <option value="10000">≤ ৳10,000 / mo</option>
                  <option value="15000">≤ ৳15,000 / mo</option>
                </select>
              </div>

              {/* Sort */}
              <div className="lg:col-span-2">
                <label htmlFor="rental-sort" className="sr-only">
                  Sort Listings
                </label>
                <select
                  id="rental-sort"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as RentalSortOption,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#172B4D] focus:border-[#324CDD] focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/25"
                >
                  <option value="featured">{t.pages.roomRental.sortFeatured}</option>
                  <option value="rent-asc">{t.pages.roomRental.sortLowHigh}</option>
                  <option value="rent-desc">{t.pages.roomRental.sortHighLow}</option>
                  <option value="seats-desc">{t.pages.roomRental.sortSeats}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <p className="text-sm font-medium text-[#525F7F]" data-testid="rental-result-count">
                <span className="font-mono tabular-nums font-bold text-[#172B4D]">
                  {results.length}
                </span>{' '}
                {t.pages.roomRental.showingCount}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#324CDD] hover:text-[#172B4D] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.pages.roomRental.resetFilters}</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Grid or Empty State */}
          {results.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((listing) => (
                <RentalCard
                  key={listing.id}
                  listing={listing}
                  onSelect={setSelectedListing}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <h2 className="text-lg font-bold text-[#172B4D]">
                {t.pages.roomRental.emptyTitle}
              </h2>
              <p className="mt-2 text-sm text-[#525F7F] max-w-md mx-auto">
                {t.pages.roomRental.emptyBody}
              </p>
              <div className="mt-6">
                <Button variant="primary" size="md" onClick={resetFilters}>
                  {t.pages.roomRental.resetFilters}
                </Button>
              </div>
            </div>
          )}

          {/* Publish Vacant Seat Callout */}
          <div className="mt-14 rounded-2xl bg-[#172B4D] p-8 sm:p-10 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {t.pages.roomRental.listBannerTitle}
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed">
                {t.pages.roomRental.listBannerBody}
              </p>
            </div>
            <Button href="/contact" variant="white" size="lg">
              {t.pages.roomRental.listBannerCta}
            </Button>
          </div>
        </Container>
      </section>

      <RentalDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
}
