'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Check, MapPin } from 'lucide-react';
import type { DemoRentalShowcaseItem } from '@/data/homepage-workflow-rentals';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

interface DemoRentalCardProps {
  item: DemoRentalShowcaseItem;
  onViewDetails: (item: DemoRentalShowcaseItem) => void;
}

export function DemoRentalCard({ item, onViewDetails }: DemoRentalCardProps) {
  const { locale } = useLanguage();

  return (
    <Card className="group h-full gap-0 py-0 overflow-hidden rounded-xl border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(23,43,77,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#324CDD]/35 hover:shadow-[0_12px_30px_rgba(23,43,77,0.08)]">
      {/* Room Image + Explicit DEMO DATA & Room Type Labels */}
      <button
        type="button"
        onClick={() => onViewDetails(item)}
        aria-label={
          locale === 'en'
            ? `View details for ${item.title.en}`
            : `${item.title.bn} এর বিস্তারিত দেখুন`
        }
        className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#324CDD]"
      >
        <Image
          src={item.imageSrc}
          alt={item.imageAlt[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          referrerPolicy="no-referrer"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <Badge
            variant="warning"
            className="bg-amber-50/95 text-[#92400E] border-amber-300/90 shadow-xs backdrop-blur-xs text-[11px] tracking-wide uppercase"
          >
            DEMO DATA
          </Badge>
          <Badge
            variant="secondary"
            className="bg-white/95 text-[#172B4D] border-slate-200/90 shadow-xs backdrop-blur-xs"
          >
            {item.roomType[locale]}
          </Badge>
        </div>
      </button>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#525F7F]">
          <MapPin className="h-3.5 w-3.5 text-[#324CDD] shrink-0" aria-hidden="true" />
          <span>{item.location[locale]}</span>
        </div>

        <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#172B4D]">
          {item.title[locale]}
        </h3>

        {/* Facilities */}
        <ul
          aria-label={locale === 'en' ? 'Facilities' : 'সুবিধাসমূহ'}
          className="mt-3.5 flex flex-wrap gap-2"
        >
          {item.facilities[locale].map((facility) => (
            <li
              key={facility}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-[#F8F9FE] px-2.5 py-1 text-xs font-medium text-[#525F7F]"
            >
              <Check className="h-3 w-3 text-[#059669] shrink-0" aria-hidden="true" />
              <span>{facility}</span>
            </li>
          ))}
        </ul>

        {/* Rent & Action Footer */}
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                {item.rentDisplay[locale]}
                <span className="font-sans text-xs font-medium text-[#64748B]">
                  {locale === 'en' ? ' / month' : ' / মাস'}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              onClick={() => onViewDetails(item)}
            >
              <span>{locale === 'en' ? 'View Details' : 'বিস্তারিত দেখুন'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
