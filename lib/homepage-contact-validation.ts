import {
  HOMEPAGE_INQUIRY_TYPES,
  type HomepageInquiryTypeId,
} from '@/data/about-contact';

export interface HomepageContactFormValues {
  fullName: string;
  email: string;
  phone: string;
  inquiryType: HomepageInquiryTypeId | '';
  subject: string;
  message: string;
}

export type HomepageContactFormErrors = Partial<
  Record<keyof HomepageContactFormValues, string>
>;

export interface HomepageContactValidationResult {
  valid: boolean;
  errors: HomepageContactFormErrors;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+]?[\d\s\-()]{7,20}$/;

const VALID_INQUIRY_TYPE_SET = new Set<string>(
  HOMEPAGE_INQUIRY_TYPES.map((item) => item.id)
);

export function validateHomepageContactForm(
  values: HomepageContactFormValues,
  locale: 'en' | 'bn' = 'en'
): HomepageContactValidationResult {
  const errors: HomepageContactFormErrors = {};
  const isBn = locale === 'bn';

  if (values.fullName.trim().length < 2) {
    errors.fullName = isBn
      ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
      : 'Please enter your full name (at least 2 characters).';
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = isBn
      ? 'অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা লিখুন।'
      : 'Please enter a valid email address.';
  }

  // Phone is optional; validate format only when provided
  const trimmedPhone = values.phone.trim();
  if (trimmedPhone.length > 0 && !PHONE_PATTERN.test(trimmedPhone)) {
    errors.phone = isBn
      ? 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন অথবা ঘরটি খালি রাখুন।'
      : 'Please enter a valid phone number or leave this optional field blank.';
  }

  if (!values.inquiryType || !VALID_INQUIRY_TYPE_SET.has(values.inquiryType)) {
    errors.inquiryType = isBn
      ? 'অনুগ্রহ করে একটি ইনকোয়ারির ধরন নির্বাচন করুন।'
      : 'Please select an inquiry type.';
  }

  if (values.subject.trim().length < 3) {
    errors.subject = isBn
      ? 'অনুগ্রহ করে সংক্ষিপ্ত বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)।'
      : 'Please enter a subject (at least 3 characters).';
  }

  if (values.message.trim().length < 10) {
    errors.message = isBn
      ? 'অনুগ্রহ করে আপনার বার্তা অন্তত ১০ অক্ষরে লিখুন।'
      : 'Please enter your message (at least 10 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
