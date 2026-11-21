export interface ContactFormValues {
  fullName: string;
  email: string;
  phone: string;
  messType: 'student' | 'bachelor' | 'job-holder' | 'shared-apartment' | 'multi-mess';
  memberCount: string;
  subject: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{8,18}$/;

export function validateContactForm(
  values: ContactFormValues,
  locale: 'en' | 'bn' = 'en'
): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const isBn = locale === 'bn';

  if (values.fullName.trim().length < 2) {
    errors.fullName = isBn
      ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
      : 'Please enter your full name (at least 2 characters).';
  }

  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = isBn
      ? 'অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা লিখুন।'
      : 'Please enter a valid email address.';
  }

  if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = isBn
      ? 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন (যেমন +880 17XX-XXXXXX)।'
      : 'Please enter a valid phone number (e.g. +880 17XX-XXXXXX).';
  }

  const parsedCount = Number(values.memberCount);
  if (
    values.memberCount.trim() === '' ||
    !Number.isFinite(parsedCount) ||
    parsedCount < 1 ||
    parsedCount > 500
  ) {
    errors.memberCount = isBn
      ? 'সদস্য সংখ্যা ১ থেকে ৫০০-এর মধ্যে হতে হবে।'
      : 'Member count must be between 1 and 500.';
  }

  if (values.subject.trim().length < 4) {
    errors.subject = isBn
      ? 'অনুগ্রহ করে সংক্ষিপ্ত বিষয় লিখুন (কমপক্ষে ৪ অক্ষর)।'
      : 'Please provide a brief subject (at least 4 characters).';
  }

  if (values.message.trim().length < 15) {
    errors.message = isBn
      ? 'অনুগ্রহ করে আপনার প্রয়োজন সম্পর্কে অন্তত ১৫ অক্ষর লিখুন।'
      : 'Please describe your inquiry in at least 15 characters.';
  }

  return errors;
}

export function isContactFormValid(errors: ContactFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
