'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  HOMEPAGE_INQUIRY_TYPES,
  type HomepageInquiryTypeId,
} from '@/data/about-contact';
import {
  validateHomepageContactForm,
  type HomepageContactFormErrors,
  type HomepageContactFormValues,
} from '@/lib/homepage-contact-validation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const INITIAL_VALUES: HomepageContactFormValues = {
  fullName: '',
  email: '',
  phone: '',
  inquiryType: '',
  subject: '',
  message: '',
};

export function HomepageContactForm() {
  const { locale } = useLanguage();
  const [values, setValues] =
    useState<HomepageContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<HomepageContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedPreview, setValidatedPreview] =
    useState<HomepageContactFormValues | null>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  const inquiryItems = HOMEPAGE_INQUIRY_TYPES.map((item) => ({
    value: item.id,
    label: item.label[locale],
  }));

  const selectedInquiryLabel =
    inquiryItems.find((item) => item.value === values.inquiryType)?.label ??
    (locale === 'en' ? 'Select inquiry type' : 'ইনকোয়ারির ধরন নির্বাচন করুন');

  const updateField = <K extends keyof HomepageContactFormValues>(
    field: K,
    value: HomepageContactFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (validatedPreview) {
      setValidatedPreview(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const result = validateHomepageContactForm(values, locale);
    if (!result.valid) {
      setErrors(result.errors);
      setValidatedPreview(null);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const snapshot = { ...values };

    // Brief frontend-only preview loading feedback — no network call or storage
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setValidatedPreview(snapshot);
    }, 220);
  };

  const handleReset = () => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    setIsSubmitting(false);
    setValues(INITIAL_VALUES);
    setErrors({});
    setValidatedPreview(null);
  };

  const previewInquiryLabel =
    inquiryItems.find((item) => item.value === validatedPreview?.inquiryType)
      ?.label ?? '';

  return (
    <Card className="gap-0 py-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(23,43,77,0.05)]">
      {/* Form Header */}
      <div className="border-b border-slate-200/80 bg-[#F8F9FE] px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D]">
            {locale === 'en' ? 'Send Us a Message' : 'আমাদের বার্তা পাঠান'}
          </h3>
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#525F7F]">
            {locale === 'en'
              ? 'Frontend Validation Preview'
              : 'ফ্রন্টএন্ড প্রিভিউ ফর্ম'}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-[#525F7F]">
          {locale === 'en'
            ? 'Fill in your details below to preview your inquiry. Live submission will be enabled once backend services are connected.'
            : 'আপনার ইনকোয়ারি প্রিভিউ করতে নিচের ঘরগুলো পূরণ করুন। ব্যাকএন্ড যুক্ত হলে সরাসরি বার্তা পাঠানো চালু হবে।'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-7 space-y-5">
        {/* Row 1: Full Name & Email Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="home-contact-full-name"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en' ? 'Full Name *' : 'পূর্ণ নাম *'}
            </Label>
            <Input
              id="home-contact-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              placeholder={
                locale === 'en' ? 'Enter your full name' : 'আপনার পূর্ণ নাম লিখুন'
              }
            />
            {errors.fullName && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="home-contact-email"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en' ? 'Email Address *' : 'ইমেইল ঠিকানা *'}
            </Label>
            <Input
              id="home-contact-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => updateField('email', e.target.value)}
              aria-invalid={Boolean(errors.email)}
              placeholder={
                locale === 'en' ? 'you@example.com' : 'you@example.com'
              }
            />
            {errors.email && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Phone Number (optional) & Inquiry Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="home-contact-phone"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en'
                ? 'Phone Number (optional)'
                : 'ফোন নম্বর (ঐচ্ছিক)'}
            </Label>
            <Input
              id="home-contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              placeholder={
                locale === 'en'
                  ? 'Optional contact number'
                  : 'ঐচ্ছিক যোগাযোগের নম্বর'
              }
            />
            {errors.phone && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="home-contact-inquiry-type"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en' ? 'Inquiry Type *' : 'ইনকোয়ারির ধরন *'}
            </Label>
            <div>
              <Select
                value={values.inquiryType}
                onValueChange={(value) => {
                  updateField(
                    'inquiryType',
                    (value ?? '') as HomepageInquiryTypeId | ''
                  );
                }}
                items={inquiryItems}
              >
                <SelectTrigger
                  id="home-contact-inquiry-type"
                  aria-invalid={Boolean(errors.inquiryType)}
                >
                  <SelectValue>{selectedInquiryLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {inquiryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.inquiryType && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.inquiryType}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Subject */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="home-contact-subject"
            className="text-xs font-semibold text-[#172B4D]"
          >
            {locale === 'en' ? 'Subject *' : 'বিষয় *'}
          </Label>
          <Input
            id="home-contact-subject"
            name="subject"
            type="text"
            value={values.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            placeholder={
              locale === 'en'
                ? 'Briefly summarize your question or requirement'
                : 'আপনার প্রশ্ন বা চাহিদার সংক্ষিপ্ত শিরোনাম লিখুন'
            }
          />
          {errors.subject && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.subject}</span>
            </p>
          )}
        </div>

        {/* Row 4: Message */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="home-contact-message"
            className="text-xs font-semibold text-[#172B4D]"
          >
            {locale === 'en' ? 'Message *' : 'বার্তা *'}
          </Label>
          <textarea
            id="home-contact-message"
            name="message"
            rows={4}
            value={values.message}
            onChange={(e) => updateField('message', e.target.value)}
            aria-invalid={Boolean(errors.message)}
            placeholder={
              locale === 'en'
                ? 'Tell us about your mess, hostel, or shared living requirements...'
                : 'আপনার মেস, হোস্টেল বা শেয়ার্ড লিভিং চাহিদা সম্পর্কে বিস্তারিত লিখুন...'
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-[#172B4D] shadow-xs transition-colors outline-none placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-[#324CDD] focus-visible:ring-2 focus-visible:ring-[#324CDD]/20 aria-invalid:border-[#DC2626] aria-invalid:ring-2 aria-invalid:ring-[#DC2626]/20"
          />
          {errors.message && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.message}</span>
            </p>
          )}
        </div>

        {/* Honest Preview-Only Status Notice (Never claims message was sent) */}
        {validatedPreview && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-amber-300/90 bg-amber-50/80 p-4 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <Info
                className="h-4 w-4 text-[#B45309] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1.5">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#065F46]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {locale === 'en'
                      ? 'Validation passed — Frontend preview only'
                      : 'যাচাই সম্পন্ন — শুধুমাত্র ফ্রন্টএন্ড প্রিভিউ'}
                  </span>
                </p>
                <p className="text-sm font-semibold text-[#92400E]">
                  {locale === 'en'
                    ? 'Contact form preview only. Message submission will be available after backend integration.'
                    : 'এটি শুধুমাত্র যোগাযোগ ফর্মের প্রিভিউ। ব্যাকএন্ড ইন্টিগ্রেশন যুক্ত হওয়ার পর বার্তা পাঠানো চালু হবে।'}
                </p>
                <p className="text-xs leading-relaxed text-[#92400E]/90">
                  {locale === 'en'
                    ? 'Your entries passed client-side validation. No message was sent and no personal data was stored or transmitted.'
                    : 'আপনার তথ্যগুলো ফ্রন্টএন্ড যাচাইয়ে সঠিক পাওয়া গেছে। কোনো বার্তা পাঠানো হয়নি এবং কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয়নি।'}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-lg border border-amber-200/80 bg-white/90 p-3 text-xs">
              <div>
                <dt className="text-[#64748B]">
                  {locale === 'en' ? 'Sender' : 'প্রেরক'}
                </dt>
                <dd className="mt-0.5 font-semibold text-[#172B4D] truncate">
                  {validatedPreview.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">
                  {locale === 'en' ? 'Inquiry Type' : 'ইনকোয়ারির ধরন'}
                </dt>
                <dd className="mt-0.5 font-semibold text-[#172B4D] truncate">
                  {previewInquiryLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">
                  {locale === 'en' ? 'Subject' : 'বিষয়'}
                </dt>
                <dd className="mt-0.5 font-semibold text-[#172B4D] truncate">
                  {validatedPreview.subject}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Submit & Reset Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-[#64748B]">
            {locale === 'en'
              ? 'Preview mode — no information is stored or transmitted.'
              : 'প্রিভিউ মোড — কোনো তথ্য সংরক্ষণ বা প্রেরণ করা হয় না।'}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {validatedPreview && (
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{locale === 'en' ? 'Reset' : 'রিসেট'}</span>
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>
                    {locale === 'en' ? 'Validating...' : 'যাচাই হচ্ছে...'}
                  </span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {locale === 'en' ? 'Send Message' : 'বার্তা পাঠান'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
