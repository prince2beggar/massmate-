import type { Locale } from '@/lib/i18n/types';

export interface CustomPricingInquiryValues {
  businessName: string;
  businessCategory: string;
  propertyCount: string;
  estimatedMembers: string;
  requiredFeatures: string[];
  preferredCustomization: string;
  contactName: string;
  contactChannel: string;
  additionalRequirements: string;
}

export type CustomInquiryFieldErrors = Partial<
  Record<keyof CustomPricingInquiryValues, string>
>;

export interface CustomInquiryValidationResult {
  valid: boolean;
  errors: CustomInquiryFieldErrors;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{7,17}$/;

export function isValidContactChannel(value: string): boolean {
  const trimmed = value.trim();
  return EMAIL_PATTERN.test(trimmed) || PHONE_PATTERN.test(trimmed);
}

export function validateCustomPricingInquiry(
  values: CustomPricingInquiryValues,
  locale: Locale = 'en'
): CustomInquiryValidationResult {
  const errors: CustomInquiryFieldErrors = {};
  const isBn = locale === 'bn';

  if (values.businessName.trim().length < 2) {
    errors.businessName = isBn
      ? 'অনুগ্রহ করে আপনার ব্যবসা বা প্রতিষ্ঠানের নাম লিখুন।'
      : 'Please enter your business or organization name.';
  }

  if (!values.businessCategory.trim()) {
    errors.businessCategory = isBn
      ? 'অনুগ্রহ করে একটি ব্যবসার ধরন নির্বাচন করুন।'
      : 'Please select a business category.';
  }

  const parsedProperties = Number(values.propertyCount);
  if (
    !values.propertyCount.trim() ||
    !Number.isInteger(parsedProperties) ||
    parsedProperties < 1
  ) {
    errors.propertyCount = isBn
      ? 'অনুগ্রহ করে মেস বা প্রপার্টির সঠিক সংখ্যা লিখুন (কমপক্ষে ১)।'
      : 'Enter a valid number of messes or properties (at least 1).';
  }

  const parsedMembers = Number(values.estimatedMembers);
  if (
    !values.estimatedMembers.trim() ||
    !Number.isInteger(parsedMembers) ||
    parsedMembers < 1
  ) {
    errors.estimatedMembers = isBn
      ? 'অনুগ্রহ করে আনুমানিক মোট সদস্য সংখ্যা লিখুন (কমপক্ষে ১)।'
      : 'Enter an estimated total number of members or residents (at least 1).';
  }

  if (values.requiredFeatures.length === 0) {
    errors.requiredFeatures = isBn
      ? 'কমপক্ষে একটি প্রয়োজনীয় ফিচার নির্বাচন করুন।'
      : 'Please select at least one required feature.';
  }

  if (values.contactName.trim().length < 2) {
    errors.contactName = isBn
      ? 'অনুগ্রহ করে যোগাযোগকারীর নাম লিখুন।'
      : 'Please enter your contact name.';
  }

  if (!isValidContactChannel(values.contactChannel)) {
    errors.contactChannel = isBn
      ? 'সঠিক ইমেইল অথবা ফোন নম্বর লিখুন।'
      : 'Please enter a valid email address or phone number.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
