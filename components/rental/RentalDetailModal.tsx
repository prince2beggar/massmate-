'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Calendar, Check, MapPin, Phone, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { RentalListing } from '@/lib/rental-filter';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';

interface RentalDetailModalProps {
  listing: RentalListing | null;
  onClose: () => void;
}

export function RentalDetailModal({ listing, onClose }: RentalDetailModalProps) {
  const { locale, t } = useLanguage();

  useEffect(() => {
    if (!listing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing, onClose]);

  return (
    <AnimatePresence>
      {listing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rental-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#172B4D]/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Header Image */}
            <div className="relative h-56 sm:h-64 w-full bg-slate-100">
              <Image
                src={listing.image}
                alt={listing.title[locale]}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#172B4D]/80 via-[#172B4D]/20 to-transparent"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label={t.pages.roomRental.modal.close}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#172B4D] shadow-sm hover:bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E72E4]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <p className="text-xs font-semibold text-[#7DD3FC]">
                  {listing.messName[locale]} · {t.rentalShowcase.categories[listing.category]}
                </p>
                <h2
                  id="rental-modal-title"
                  className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {listing.title[locale]}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#525F7F]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
                  {listing.area[locale]}, {listing.city[locale]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
                  {t.pages.roomRental.modal.availableFrom}: {listing.availableFrom[locale]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {t.rentalShowcase.verifiedLabel}
                </span>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-[#525F7F]">
                {listing.description[locale]}
              </p>

              {/* Cost Breakdown Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-[#F8F9FE] p-4 border border-slate-200/80">
                <div>
                  <p className="text-xs text-[#525F7F]">
                    {t.pages.roomRental.modal.monthlyRent}
                  </p>
                  <p className="mt-1 font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                    ৳{listing.monthlyRentBdt.toLocaleString('en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#525F7F]">
                    {t.pages.roomRental.modal.serviceCharge}
                  </p>
                  <p className="mt-1 font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                    ৳{listing.serviceChargeBdt.toLocaleString('en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#525F7F]">
                    {t.pages.roomRental.modal.mealDeposit}
                  </p>
                  <p className="mt-1 font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                    ৳{listing.mealDepositEstimateBdt.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              {/* Amenities & Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D] mb-3">
                    {t.pages.roomRental.modal.amenities}
                  </h3>
                  <ul className="space-y-2 text-sm text-[#525F7F]">
                    {listing.amenities[locale].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check
                          className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172B4D] mb-3">
                    {t.pages.roomRental.modal.houseRules}
                  </h3>
                  <ul className="space-y-2 text-sm text-[#525F7F] list-disc pl-4">
                    {listing.houseRules[locale].map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm text-[#172B4D]">
                  <Phone className="h-4 w-4 text-[#324CDD]" aria-hidden="true" />
                  <span className="text-[#525F7F]">
                    {t.pages.roomRental.modal.contactManager}:
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {listing.managerPhone}
                  </span>
                </div>
                <Button href="/contact" variant="primary" size="md" onClick={onClose}>
                  {t.pages.roomRental.modal.inquireNow}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
