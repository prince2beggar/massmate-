'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
} from 'lucide-react';
import {
  DEMO_RENTAL_SHOWCASE_ITEMS,
  type DemoRentalShowcaseItem,
} from '@/data/homepage-workflow-rentals';
import {
  filterDemoShowcaseRooms,
  validateRoomInfoRequest,
  type RoomInfoRequestErrors,
  type RoomInfoRequestValues,
} from '@/lib/showcase-rental-filter';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MotionReveal } from '@/components/ui/MotionReveal';
import { DemoRentalCard } from '@/components/home/DemoRentalCard';

const INITIAL_REQUEST_VALUES: RoomInfoRequestValues = {
  name: '',
  contact: '',
  note: '',
};

export function RoomRentalShowcase() {
  const { locale, t } = useLanguage();
  const [locationInput, setLocationInput] = useState('');
  const [roomType, setRoomType] = useState('all');
  const [budget, setBudget] = useState('any');
  const [previewNoticeVisible, setPreviewNoticeVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<DemoRentalShowcaseItem | null>(
    null
  );

  // Request Information preview state inside the View Details dialog
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestValues, setRequestValues] = useState<RoomInfoRequestValues>(
    INITIAL_REQUEST_VALUES
  );
  const [requestErrors, setRequestErrors] = useState<RoomInfoRequestErrors>({});
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestSubmittedPreview, setRequestSubmittedPreview] = useState(false);
  const requestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
      }
    };
  }, []);

  const resetRequestState = () => {
    if (requestTimerRef.current) {
      clearTimeout(requestTimerRef.current);
      requestTimerRef.current = null;
    }
    setShowRequestForm(false);
    setRequestValues(INITIAL_REQUEST_VALUES);
    setRequestErrors({});
    setIsRequestSubmitting(false);
    setRequestSubmittedPreview(false);
  };

  const handleOpenRoomDetails = (item: DemoRentalShowcaseItem) => {
    resetRequestState();
    setSelectedRoom(item);
  };

  const handleCloseRoomDetails = () => {
    resetRequestState();
    setSelectedRoom(null);
  };

  const roomTypeOptions = [
    { value: 'all', label: locale === 'en' ? 'All room types' : 'সব ধরনের রুম' },
    { value: 'shared-room', label: locale === 'en' ? 'Shared room' : 'শেয়ার্ড রুম' },
    { value: 'private-room', label: locale === 'en' ? 'Private room' : 'প্রাইভেট রুম' },
    {
      value: 'shared-apartment',
      label: locale === 'en' ? 'Shared apartment' : 'শেয়ার্ড অ্যাপার্টমেন্ট',
    },
  ];

  const budgetOptions = [
    { value: 'any', label: locale === 'en' ? 'Any monthly budget' : 'যেকোনো বাজেট' },
    { value: '4000', label: locale === 'en' ? 'Up to ৳4,000 / mo' : '৳৪,০০০ পর্যন্ত' },
    { value: '5000', label: locale === 'en' ? 'Up to ৳5,000 / mo' : '৳৫,০০০ পর্যন্ত' },
    { value: '7000', label: locale === 'en' ? 'Up to ৳7,000 / mo' : '৳৭,০০০ পর্যন্ত' },
  ];

  const selectedRoomTypeLabel =
    roomTypeOptions.find((opt) => opt.value === roomType)?.label ??
    roomTypeOptions[0].label;

  const selectedBudgetLabel =
    budgetOptions.find((opt) => opt.value === budget)?.label ??
    budgetOptions[0].label;

  const filteredRooms = useMemo(
    () =>
      filterDemoShowcaseRooms(DEMO_RENTAL_SHOWCASE_ITEMS, {
        locationQuery: locationInput,
        roomType,
        maxBudget: budget,
      }),
    [locationInput, roomType, budget]
  );

  const hasActiveFilter =
    locationInput.trim().length > 0 || roomType !== 'all' || budget !== 'any';

  const handleResetFilters = () => {
    setLocationInput('');
    setRoomType('all');
    setBudget('any');
    setPreviewNoticeVisible(false);
  };

  const handlePreviewSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewNoticeVisible(true);
  };

  const updateRequestField = <K extends keyof RoomInfoRequestValues>(
    field: K,
    value: RoomInfoRequestValues[K]
  ) => {
    setRequestValues((prev) => ({ ...prev, [field]: value }));
    if (requestErrors[field]) {
      setRequestErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (requestSubmittedPreview) {
      setRequestSubmittedPreview(false);
    }
  };

  const handleRequestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRequestSubmitting) return;

    const result = validateRoomInfoRequest(requestValues, locale);
    if (!result.valid) {
      setRequestErrors(result.errors);
      setRequestSubmittedPreview(false);
      return;
    }

    setRequestErrors({});
    setIsRequestSubmitting(true);

    // Brief frontend-only preview loading state — no backend request is made
    requestTimerRef.current = setTimeout(() => {
      setIsRequestSubmitting(false);
      setRequestSubmittedPreview(true);
    }, 200);
  };

  return (
    <section
      id="room-rentals"
      className="bg-[#F8F9FE] py-14 sm:py-18 lg:py-24 border-b border-slate-200/70 scroll-mt-16"
    >
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <SectionHeader
            kicker={t.rentalShowcase.kicker}
            title={t.rentalShowcase.title}
            subtitle={t.rentalShowcase.subtitle}
          />
          <Button
            href="/room-rental"
            variant="primary"
            size="md"
            className="self-start lg:self-auto"
          >
            <span>{t.rentalShowcase.browseAllCta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Interactive Frontend Filter Preview Bar */}
        <MotionReveal className="mt-10">
          <form
            onSubmit={handlePreviewSearch}
            aria-label={
              locale === 'en'
                ? 'Room search and filter preview'
                : 'রুম সার্চ ও ফিল্টার প্রিভিউ'
            }
            className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(23,43,77,0.04)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              {/* Location */}
              <div className="lg:col-span-4 flex flex-col gap-1.5">
                <Label
                  htmlFor="showcase-location"
                  className="text-xs font-semibold text-[#172B4D]"
                >
                  {locale === 'en' ? 'Location' : 'এলাকা'}
                </Label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="showcase-location"
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder={
                      locale === 'en'
                        ? 'e.g. Uttara, Mirpur, Badda'
                        : 'যেমন: উত্তরা, মিরপুর, বাড্ডা'
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Room Type */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <Label
                  htmlFor="showcase-room-type"
                  className="text-xs font-semibold text-[#172B4D]"
                >
                  {locale === 'en' ? 'Room Type' : 'রুমের ধরন'}
                </Label>
                <div>
                  <Select
                    value={roomType}
                    onValueChange={(value) => setRoomType(value ?? 'all')}
                    items={roomTypeOptions}
                  >
                    <SelectTrigger id="showcase-room-type">
                      <SelectValue>{selectedRoomTypeLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <Label
                  htmlFor="showcase-budget"
                  className="text-xs font-semibold text-[#172B4D]"
                >
                  {locale === 'en' ? 'Monthly Budget' : 'মাসিক বাজেট'}
                </Label>
                <div>
                  <Select
                    value={budget}
                    onValueChange={(value) => setBudget(value ?? 'any')}
                    items={budgetOptions}
                  >
                    <SelectTrigger id="showcase-budget">
                      <SelectValue>{selectedBudgetLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {budgetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search Button */}
              <div className="lg:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full min-h-11 sm:min-h-10 sm:h-10"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>{locale === 'en' ? 'Search' : 'খুঁজুন'}</span>
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-[#324CDD] shrink-0" aria-hidden="true" />
                <span>
                  {locale === 'en'
                    ? 'Search preview only — filters the illustrative DEMO DATA cards below; live property search launches with backend integration.'
                    : 'সার্চ প্রিভিউ — নিচের নমুনা DEMO DATA কার্ডগুলো ফিল্টার করে; লাইভ প্রপার্টি সার্চ ব্যাকএন্ডের সাথে যুক্ত হবে।'}
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  role="status"
                  aria-live="polite"
                  className="font-medium text-[#172B4D]"
                >
                  {locale === 'en'
                    ? `Showing ${filteredRooms.length} of ${DEMO_RENTAL_SHOWCASE_ITEMS.length} illustrative demo listings`
                    : `${DEMO_RENTAL_SHOWCASE_ITEMS.length}টি নমুনা ডেমো লিস্টিংয়ের মধ্যে ${filteredRooms.length}টি দেখানো হচ্ছে`}
                </span>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold text-[#324CDD] hover:bg-[#EEF2FF] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD]"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>{locale === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট'}</span>
                  </button>
                )}
              </div>
            </div>

            {previewNoticeVisible && (
              <p
                role="status"
                aria-live="polite"
                className="mt-2 text-xs font-medium text-[#324CDD]"
              >
                {locale === 'en'
                  ? 'Preview filters applied to sample DEMO DATA below. Live database search and booking are not yet connected.'
                  : 'নিচের নমুনা DEMO DATA-তে প্রিভিউ ফিল্টার প্রয়োগ করা হয়েছে। লাইভ ডেটাবেস সার্চ ও বুকিং এখনো যুক্ত হয়নি।'}
              </p>
            )}
          </form>
        </MotionReveal>

        {/* Clearly Labeled DEMO DATA Rental Cards or Empty Filter State */}
        <MotionReveal className="mt-8">
          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((item) => (
                <DemoRentalCard
                  key={item.id}
                  item={item}
                  onViewDetails={handleOpenRoomDetails}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-12 text-center shadow-[0_1px_3px_rgba(23,43,77,0.04)]">
              <p className="text-base font-semibold text-[#172B4D]">
                {locale === 'en'
                  ? 'No sample demo listings match your current filter preview.'
                  : 'আপনার নির্বাচিত ফিল্টারে কোনো নমুনা ডেমো লিস্টিং পাওয়া যায়নি।'}
              </p>
              <p className="mt-1.5 text-sm text-[#525F7F]">
                {locale === 'en'
                  ? 'Try clearing a filter or resetting to view all 3 illustrative DEMO DATA room cards.'
                  : 'সব ৩টি নমুনা ডেমো রুম কার্ড দেখতে ফিল্টার রিসেট করুন।'}
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{locale === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট করুন'}</span>
                </Button>
              </div>
            </div>
          )}
        </MotionReveal>
      </Container>

      {/* Honest Demo Room Detail & Request Information Preview Dialog */}
      <Dialog
        open={selectedRoom !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseRoomDetails();
        }}
      >
        <DialogContent className="flex flex-col max-h-[88vh] p-0 gap-0 overflow-hidden sm:max-w-lg">
          {selectedRoom && (
            <>
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
                <DialogHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#525F7F]">
                    <Badge
                      variant="warning"
                      className="bg-amber-50 text-[#92400E] border-amber-300/90 text-[10px] uppercase tracking-wide"
                    >
                      DEMO DATA
                    </Badge>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-[#324CDD]" aria-hidden="true" />
                      {selectedRoom.location[locale]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedRoom.roomType[locale]}</span>
                  </div>
                  <DialogTitle>{selectedRoom.title[locale]}</DialogTitle>
                  <DialogDescription>
                    {selectedRoom.demoNote[locale]}
                  </DialogDescription>
                </DialogHeader>

                <div className="relative h-44 sm:h-48 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={selectedRoom.imageSrc}
                    alt={selectedRoom.imageAlt[locale]}
                    fill
                    sizes="(max-width: 640px) 100vw, 512px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#F8F9FE] px-4 py-3">
                  <span className="text-xs font-medium text-[#525F7F]">
                    {locale === 'en' ? 'Sample Monthly Rent' : 'নমুনা মাসিক ভাড়া'}
                  </span>
                  <span className="font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                    {selectedRoom.rentDisplay[locale]}
                    <span className="font-sans text-xs font-medium text-[#64748B]">
                      {locale === 'en' ? ' / month' : ' / মাস'}
                    </span>
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2">
                    {locale === 'en' ? 'Included Facilities' : 'সুবিধাসমূহ'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.facilities[locale].map((facility) => (
                      <span
                        key={facility}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#172B4D]"
                      >
                        <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="rounded-lg border border-amber-200/90 bg-amber-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-[#92400E]">
                  {locale === 'en'
                    ? 'Illustrative Demo Data: This sample room card demonstrates layout and rent presentation only and is not a verified or live rental listing.'
                    : 'নমুনা ডেমো ডেটা: এই রুম কার্ডটি শুধুমাত্র ডিজাইন প্রিভিউয়ের জন্য তৈরি, এটি কোনো যাচাইকৃত বা বাস্তব রুম লিস্টিং নয়।'}
                </p>

                {/* Interactive Request Information Placeholder Flow */}
                {showRequestForm && (
                  <form
                    onSubmit={handleRequestSubmit}
                    noValidate
                    className="rounded-xl border border-slate-200/90 bg-[#F8F9FE] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#172B4D]">
                        {locale === 'en'
                          ? 'Request Information (Preview Only)'
                          : 'তথ্য অনুরোধ (কেবল প্রিভিউ)'}
                      </p>
                      <Badge variant="outline" className="bg-white text-[10px]">
                        {locale === 'en' ? 'No Backend' : 'ব্যাকএন্ড নেই'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="room-request-name"
                          className="text-xs font-semibold text-[#172B4D]"
                        >
                          {locale === 'en' ? 'Your Name *' : 'আপনার নাম *'}
                        </Label>
                        <Input
                          id="room-request-name"
                          type="text"
                          value={requestValues.name}
                          onChange={(e) =>
                            updateRequestField('name', e.target.value)
                          }
                          aria-invalid={Boolean(requestErrors.name)}
                          placeholder={
                            locale === 'en' ? 'Full name' : 'আপনার পূর্ণ নাম'
                          }
                          className="bg-white"
                        />
                        {requestErrors.name && (
                          <p className="flex items-center gap-1 text-[11px] font-medium text-[#DC2626]">
                            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{requestErrors.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="room-request-contact"
                          className="text-xs font-semibold text-[#172B4D]"
                        >
                          {locale === 'en'
                            ? 'Email or Phone *'
                            : 'ইমেইল বা ফোন *'}
                        </Label>
                        <Input
                          id="room-request-contact"
                          type="text"
                          value={requestValues.contact}
                          onChange={(e) =>
                            updateRequestField('contact', e.target.value)
                          }
                          aria-invalid={Boolean(requestErrors.contact)}
                          placeholder={
                            locale === 'en'
                              ? 'you@example.com or +880...'
                              : 'you@example.com অথবা +880...'
                          }
                          className="bg-white"
                        />
                        {requestErrors.contact && (
                          <p className="flex items-center gap-1 text-[11px] font-medium text-[#DC2626]">
                            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{requestErrors.contact}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label
                        htmlFor="room-request-note"
                        className="text-xs font-semibold text-[#172B4D]"
                      >
                        {locale === 'en'
                          ? 'Optional Note'
                          : 'অতিরিক্ত বার্তা (ঐচ্ছিক)'}
                      </Label>
                      <Input
                        id="room-request-note"
                        type="text"
                        value={requestValues.note}
                        onChange={(e) =>
                          updateRequestField('note', e.target.value)
                        }
                        placeholder={
                          locale === 'en'
                            ? 'Preferred move-in month or question'
                            : 'সম্ভাব্য ওঠার মাস বা প্রশ্ন'
                        }
                        className="bg-white"
                      />
                    </div>

                    {requestSubmittedPreview && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="rounded-lg border border-amber-300/90 bg-amber-50/90 p-3 text-xs text-[#92400E] space-y-1"
                      >
                        <p className="flex items-center gap-1.5 font-semibold text-[#065F46]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {locale === 'en'
                              ? 'Form validated — Request Information preview only'
                              : 'ফর্ম যাচাই সম্পন্ন — এটি শুধুমাত্র প্রিভিউ'}
                          </span>
                        </p>
                        <p className="leading-relaxed">
                          {locale === 'en'
                            ? 'Booking and rental inquiries are not yet connected to a backend. No request was sent or stored.'
                            : 'বুকিং ও রুম ইনকোয়ারি এখনো ব্যাকএন্ডের সাথে যুক্ত নয়। কোনো অনুরোধ পাঠানো বা সংরক্ষণ করা হয়নি।'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetRequestState}
                      >
                        {locale === 'en' ? 'Cancel' : 'বাতিল'}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isRequestSubmitting}
                      >
                        {isRequestSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            <span>
                              {locale === 'en' ? 'Checking...' : 'যাচাই হচ্ছে...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {locale === 'en'
                                ? 'Submit Preview Request'
                                : 'প্রিভিউ অনুরোধ জমা দিন'}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <DialogFooter className="mx-0 mb-0 shrink-0 flex-wrap gap-2">
                <DialogClose
                  render={
                    <Button variant="outline" size="sm">
                      {locale === 'en' ? 'Close' : 'বন্ধ করুন'}
                    </Button>
                  }
                />
                {!showRequestForm && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRequestForm(true)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {locale === 'en'
                        ? 'Request Information'
                        : 'তথ্য অনুরোধ করুন'}
                    </span>
                  </Button>
                )}
                <Button
                  href="/room-rental"
                  variant="primary"
                  size="sm"
                  onClick={handleCloseRoomDetails}
                >
                  <span>{t.rentalShowcase.browseAllCta}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
