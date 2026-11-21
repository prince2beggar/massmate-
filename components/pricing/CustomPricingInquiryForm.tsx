'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Info,
  Loader2,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  CUSTOM_BUSINESS_CAPABILITIES,
  CUSTOM_BUSINESS_CATEGORIES,
} from '@/lib/pricing-config';
import {
  validateCustomPricingInquiry,
  type CustomInquiryFieldErrors,
  type CustomPricingInquiryValues,
} from '@/lib/custom-inquiry-validation';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomPricingInquiryFormProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

const INITIAL_VALUES: CustomPricingInquiryValues = {
  businessName: '',
  businessCategory: 'multiple-mess',
  propertyCount: '',
  estimatedMembers: '',
  requiredFeatures: [],
  preferredCustomization: '',
  contactName: '',
  contactChannel: '',
  additionalRequirements: '',
};

export function CustomPricingInquiryForm({
  selectedCategoryId,
  onCategoryChange,
}: CustomPricingInquiryFormProps) {
  const { locale } = useLanguage();
  const [values, setValues] = useState<CustomPricingInquiryValues>({
    ...INITIAL_VALUES,
    businessCategory: selectedCategoryId || INITIAL_VALUES.businessCategory,
  });
  const [errors, setErrors] = useState<CustomInquiryFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedPreview, setValidatedPreview] =
    useState<CustomPricingInquiryValues | null>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // Keep synced when parent discovery card pre-selects a category
  const activeCategory = selectedCategoryId || values.businessCategory;

  const categoryItems = CUSTOM_BUSINESS_CATEGORIES.map((category) => ({
    value: category.id,
    label: category.label[locale],
  }));

  const selectedCategoryLabel =
    categoryItems.find((item) => item.value === activeCategory)?.label ??
    (locale === 'en' ? 'Select business category' : 'ব্যবসার ধরন নির্বাচন করুন');

  const updateField = <K extends keyof CustomPricingInquiryValues>(
    field: K,
    value: CustomPricingInquiryValues[K]
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

  const toggleFeature = (featureKey: string) => {
    setValues((prev) => {
      const exists = prev.requiredFeatures.includes(featureKey);
      const nextFeatures = exists
        ? prev.requiredFeatures.filter((item) => item !== featureKey)
        : [...prev.requiredFeatures, featureKey];
      return { ...prev, requiredFeatures: nextFeatures };
    });
    if (errors.requiredFeatures) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.requiredFeatures;
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

    const payload: CustomPricingInquiryValues = {
      ...values,
      businessCategory: activeCategory,
    };
    const result = validateCustomPricingInquiry(payload, locale);
    if (!result.valid) {
      setErrors(result.errors);
      setValidatedPreview(null);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    // Brief frontend-only preview loading feedback — no network call or storage
    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setValidatedPreview(payload);
    }, 220);
  };

  const handleReset = () => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    setIsSubmitting(false);
    setValues({
      ...INITIAL_VALUES,
      businessCategory: 'multiple-mess',
    });
    onCategoryChange('multiple-mess');
    setErrors({});
    setValidatedPreview(null);
  };

  return (
    <div id="custom-pricing-inquiry" className="mt-14 scroll-mt-24">
      <Card className="gap-0 py-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(23,43,77,0.05)]">
        {/* Form Header */}
        <div className="border-b border-slate-200/80 bg-[#F8F9FE] px-5 py-4 sm:px-8 sm:py-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D]">
                {locale === 'en'
                  ? 'Request Custom Pricing'
                  : 'কাস্টম প্রাইসিং ইনকোয়ারি'}
              </h3>
              <Badge variant="outline" className="bg-white text-[11px]">
                {locale === 'en'
                  ? 'Frontend Preview Form'
                  : 'ফ্রন্টএন্ড প্রিভিউ ফর্ম'}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[#525F7F]">
              {locale === 'en'
                ? 'Share your property scale, required modules, and customization needs so we can scope a tailored business package.'
                : 'আপনার প্রপার্টির সংখ্যা, প্রয়োজনীয় মডিউল ও কাস্টমাইজেশন চাহিদা জানান—আপনার ব্যবসার উপযোগী প্যাকেজ সাজাতে এটি সাহায্য করবে।'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-8 space-y-6">
          {/* Row 1: Business Name & Business Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-business-name"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en' ? 'Business Name *' : 'প্রতিষ্ঠান বা ব্যবসার নাম *'}
              </Label>
              <Input
                id="inquiry-business-name"
                type="text"
                value={values.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                aria-invalid={Boolean(errors.businessName)}
                placeholder={
                  locale === 'en'
                    ? 'e.g. Dhaka Academic Hostels'
                    : 'যেমন: ঢাকা অ্যাকাডেমিক হোস্টেলস'
                }
              />
              {errors.businessName && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.businessName}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-business-category"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en' ? 'Business Category *' : 'ব্যবসার ধরন *'}
              </Label>
              <div>
                <Select
                  value={activeCategory}
                  onValueChange={(value) => {
                    const nextVal = value ?? 'multiple-mess';
                    onCategoryChange(nextVal);
                    updateField('businessCategory', nextVal);
                  }}
                  items={categoryItems}
                >
                  <SelectTrigger
                    id="inquiry-business-category"
                    aria-invalid={Boolean(errors.businessCategory)}
                  >
                    <SelectValue>{selectedCategoryLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.businessCategory && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.businessCategory}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Number of Messes/Properties & Estimated Members/Residents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-property-count"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en'
                  ? 'Number of Messes or Properties *'
                  : 'মেস বা প্রপার্টির সংখ্যা *'}
              </Label>
              <Input
                id="inquiry-property-count"
                type="number"
                min={1}
                step={1}
                value={values.propertyCount}
                onChange={(e) => updateField('propertyCount', e.target.value)}
                aria-invalid={Boolean(errors.propertyCount)}
                placeholder={locale === 'en' ? 'e.g. 3' : 'যেমন: ৩'}
              />
              {errors.propertyCount && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.propertyCount}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-estimated-members"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en'
                  ? 'Estimated Total Members or Residents *'
                  : 'আনুমানিক মোট সদস্য বা বাসিন্দা *'}
              </Label>
              <Input
                id="inquiry-estimated-members"
                type="number"
                min={1}
                step={1}
                value={values.estimatedMembers}
                onChange={(e) => updateField('estimatedMembers', e.target.value)}
                aria-invalid={Boolean(errors.estimatedMembers)}
                placeholder={locale === 'en' ? 'e.g. 85' : 'যেমন: ৮৫'}
              />
              {errors.estimatedMembers && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.estimatedMembers}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Required Features (Multi-select Capability Checkboxes) */}
          <fieldset className="space-y-2.5">
            <legend className="text-xs font-semibold text-[#172B4D]">
              {locale === 'en'
                ? 'Required Features * (select all that apply)'
                : 'প্রয়োজনীয় ফিচারসমূহ * (প্রয়োজন অনুযায়ী নির্বাচন করুন)'}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CUSTOM_BUSINESS_CAPABILITIES.map((capability) => {
                const checked = values.requiredFeatures.includes(capability.en);
                return (
                  <label
                    key={capability.en}
                    className={cn(
                      'flex min-h-[44px] items-center sm:items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer select-none',
                      checked
                        ? 'border-[#324CDD] bg-[#EEF2FF]/70 text-[#172B4D] font-medium'
                        : 'border-slate-200 bg-white text-[#525F7F] hover:border-slate-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeature(capability.en)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-[#324CDD] bg-[#324CDD] text-white'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="leading-snug">{capability[locale]}</span>
                  </label>
                );
              })}
            </div>
            {errors.requiredFeatures && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.requiredFeatures}</span>
              </p>
            )}
          </fieldset>

          {/* Row 4: Preferred Customization */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="inquiry-preferred-customization"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en'
                ? 'Preferred Customization (optional)'
                : 'পছন্দের কাস্টমাইজেশন (ঐচ্ছিক)'}
            </Label>
            <Input
              id="inquiry-preferred-customization"
              type="text"
              value={values.preferredCustomization}
              onChange={(e) =>
                updateField('preferredCustomization', e.target.value)
              }
              placeholder={
                locale === 'en'
                  ? 'e.g. Custom domain, branded hostel portal, role-based branch permissions'
                  : 'যেমন: কাস্টম ডোমেইন, ব্র্যান্ডেড পোর্টাল, শাখাভিত্তিক রোল পারমিশন'
              }
            />
          </div>

          {/* Row 5: Contact Name & Email or Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-contact-name"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en' ? 'Contact Name *' : 'যোগাযোগকারীর নাম *'}
              </Label>
              <Input
                id="inquiry-contact-name"
                type="text"
                value={values.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                aria-invalid={Boolean(errors.contactName)}
                placeholder={
                  locale === 'en' ? 'Your full name' : 'আপনার পূর্ণ নাম'
                }
              />
              {errors.contactName && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.contactName}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inquiry-contact-channel"
                className="text-xs font-semibold text-[#172B4D]"
              >
                {locale === 'en'
                  ? 'Email or Phone Number *'
                  : 'ইমেইল অথবা ফোন নম্বর *'}
              </Label>
              <Input
                id="inquiry-contact-channel"
                type="text"
                value={values.contactChannel}
                onChange={(e) => updateField('contactChannel', e.target.value)}
                aria-invalid={Boolean(errors.contactChannel)}
                placeholder={
                  locale === 'en'
                    ? 'name@company.com or +880 1XXX-XXXXXX'
                    : 'name@company.com অথবা +880 1XXX-XXXXXX'
                }
              />
              {errors.contactChannel && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.contactChannel}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 6: Additional Requirements (Customer's Own Words) */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="inquiry-additional-requirements"
              className="text-xs font-semibold text-[#172B4D]"
            >
              {locale === 'en'
                ? 'Additional Requirements (describe your needs in your own words)'
                : 'অতিরিক্ত প্রয়োজনীয়তা (নিজের ভাষায় বিস্তারিত লিখুন)'}
            </Label>
            <textarea
              id="inquiry-additional-requirements"
              rows={4}
              value={values.additionalRequirements}
              onChange={(e) =>
                updateField('additionalRequirements', e.target.value)
              }
              placeholder={
                locale === 'en'
                  ? 'Tell us about your current operational workflow, billing structure, branch setup, or any special reporting needs...'
                  : 'আপনার বর্তমান পরিচালনা পদ্ধতি, বিলিং নিয়ম, শাখা কাঠামো বা বিশেষ কোনো রিপোর্টিং প্রয়োজনীয়তা সম্পর্কে লিখুন...'
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-sm text-[#172B4D] shadow-xs transition-colors outline-none placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-[#324CDD] focus-visible:ring-2 focus-visible:ring-[#324CDD]/20"
            />
          </div>

          {/* Honest Submission Placeholder Notice (Appears Only After Valid Frontend Validation) */}
          {validatedPreview && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-amber-300/90 bg-amber-50/75 p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <Info
                  className="h-4 w-4 text-[#B45309] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#92400E]">
                    {locale === 'en'
                      ? 'Inquiry Validated — Submission Placeholder Only (Not Sent)'
                      : 'ফর্ম যাচাই সম্পন্ন — এটি কেবল প্রিভিউ (সার্ভারে পাঠানো হয়নি)'}
                  </p>
                  <p className="text-xs leading-relaxed text-[#92400E]/90">
                    {locale === 'en'
                      ? 'Your details passed frontend validation, but backend inquiry delivery is not connected yet. No data has been transmitted or stored.'
                      : 'আপনার তথ্যগুলো ফ্রন্টএন্ড যাচাইয়ে সঠিক পাওয়া গেছে, তবে ব্যাকএন্ড সাবমিশন এখনো যুক্ত করা হয়নি। কোনো তথ্য সার্ভারে পাঠানো বা সংরক্ষণ করা হয়নি।'}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg border border-amber-200/80 bg-white/90 p-3 text-xs">
                <div>
                  <dt className="text-[#64748B]">
                    {locale === 'en' ? 'Business' : 'প্রতিষ্ঠান'}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#172B4D] truncate">
                    {validatedPreview.businessName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">
                    {locale === 'en' ? 'Category' : 'ক্যাটাগরি'}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[#172B4D] truncate">
                    {selectedCategoryLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">
                    {locale === 'en' ? 'Scale' : 'পরিধি'}
                  </dt>
                  <dd className="mt-0.5 font-mono font-semibold text-[#172B4D]">
                    {validatedPreview.propertyCount}{' '}
                    {locale === 'en' ? 'properties' : 'প্রপার্টি'} ·{' '}
                    {validatedPreview.estimatedMembers}{' '}
                    {locale === 'en' ? 'members' : 'সদস্য'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">
                    {locale === 'en' ? 'Selected Modules' : 'নির্বাচিত মডিউল'}
                  </dt>
                  <dd className="mt-0.5 font-mono font-semibold text-[#172B4D]">
                    {validatedPreview.requiredFeatures.length}{' '}
                    {locale === 'en' ? 'selected' : 'নির্বাচিত'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <p className="text-xs text-[#64748B] max-w-md">
              {locale === 'en'
                ? 'Frontend validation preview: live backend submission will be connected in a later phase.'
                : 'ফ্রন্টএন্ড ভ্যালিডেশন প্রিভিউ: পরবর্তী ধাপে ব্যাকএন্ড সাবমিশন যুক্ত করা হবে।'}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              {validatedPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{locale === 'en' ? 'Reset Form' : 'রিসেট করুন'}</span>
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>
                      {locale === 'en' ? 'Validating...' : 'যাচাই হচ্ছে...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {locale === 'en'
                        ? 'Request Custom Pricing'
                        : 'কাস্টম প্রাইসিং অনুরোধ করুন'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
