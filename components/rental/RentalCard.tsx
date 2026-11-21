'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Building2, CheckCircle2, MapPin } from 'lucide-react';
import type { RentalListing } from '@/lib/rental-filter';
import { useLanguage } from '@/context/LanguageContext';

interface RentalCardProps {
  listing: RentalListing;
  onSelect: (listing: RentalListing) => void;
}

export function RentalCard({ listing, onSelect }: RentalCardProps) {
  const { locale, t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const categoryLabel = t.rentalShowcase.categories[listing.category];
  const roomTypeLabel =
    listing.roomType === 'single-room'
      ? t.pages.roomRental.roomTypeSingle
      : listing.roomType === 'shared-room'
      ? t.pages.roomRental.roomTypeShared
      : t.pages.roomRental.roomTypeSeat;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white argon-card-shadow-hover">
      {/* Photo Container with resilient fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {!imgError ? (
          <Image
            src={listing.image}
            alt={listing.title[locale]}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#172B4D] to-[#324CDD] p-6 text-center text-white">
            <Building2 className="h-8 w-8 mb-2 opacity-80" aria-hidden="true" />
            <p className="text-sm font-medium">{listing.messName[locale]}</p>
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#172B4D]/75 via-[#172B4D]/25 to-transparent"
        />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#7DD3FC]" aria-hidden="true" />
            <span>
              {listing.area[locale]}, {listing.city[locale]}
            </span>
          </div>
          <span className="font-mono tabular-nums text-xs font-semibold text-white/95">
            {listing.availableSeats} {t.rentalShowcase.seatsLeft}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Zero-pill clean metadata line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#525F7F]">
          <span className="text-[#324CDD] font-semibold">{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{roomTypeLabel}</span>
          {listing.verified && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t.rentalShowcase.verifiedLabel}
              </span>
            </>
          )}
        </div>

        <h3 className="mt-2.5 text-lg font-bold tracking-tight text-[#172B4D] leading-snug">
          {listing.title[locale]}
        </h3>

        <p className="mt-1 text-sm text-[#525F7F]">{listing.messName[locale]}</p>

        {/* Clean highlights separated typographically */}
        <p className="mt-3 text-xs leading-relaxed text-[#64748B]">
          {listing.highlights[locale].join(' · ')}
        </p>

        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono tabular-nums text-xl font-bold text-[#172B4D]">
              ৳{listing.monthlyRentBdt.toLocaleString('en-US')}
              <span className="font-sans text-xs font-normal text-[#525F7F] ml-1">
                {t.rentalShowcase.perMonth}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(listing)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#324CDD] hover:text-[#172B4D] transition-colors whitespace-nowrap shrink-0 py-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4] rounded"
          >
            <span>{t.rentalShowcase.viewDetails}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
