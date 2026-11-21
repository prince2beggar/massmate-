'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  LegalDocumentLayout,
  type LegalSection,
} from '@/components/ui/LegalDocumentLayout';

const PRIVACY_SECTIONS_EN: LegalSection[] = [
  {
    id: 'information-we-collect',
    heading: 'Information We Collect',
    paragraphs: [
      'When a mess manager, resident member, or residence owner interacts with MessMate, we collect only the information required to provide accurate mess accounting, communication, and public rental discovery.',
    ],
    bullets: [
      'Account and contact information such as name, email address, phone number, and preferred interface language (English or Bangla).',
      'Operational residence records entered by authorized managers, including room assignments, daily meal counts, bazar receipts, rent schedules, and payment confirmations.',
      'Optional public listing information submitted for the Room Rental portal, such as area, monthly rent, amenities, and manager contact numbers.',
    ],
  },
  {
    id: 'financial-records',
    heading: 'Financial & Meal Ledger Privacy',
    paragraphs: [
      'Internal financial records—including member deposits, bazar expenditures, rent payment status, and net balances—are visible strictly to verified members and managers of that specific mess workspace.',
      'MessMate never publishes internal member ledgers or private payment histories on public mess websites or search indexes.',
    ],
  },
  {
    id: 'emergency-contacts',
    heading: 'Emergency & Guardian Contact Protection',
    paragraphs: [
      'Safety features require clear boundaries. General residence safety contacts (building owner, local hospital, fire, and police numbers) are accessible to active mess members.',
      'Personal In-Case-of-Emergency (ICE) guardian numbers, blood groups, and identity notes are restricted to designated mess managers and are never sold or shared with third-party marketers.',
    ],
  },
  {
    id: 'room-rental-visibility',
    heading: 'Public Room Rental Listings',
    paragraphs: [
      'When a manager explicitly publishes a vacant room or seat to the MessMate Room Rental portal or custom mess microsite, only the approved public listing attributes (title, neighborhood, rent, amenities, house rules, and designated inquiry contact) are shown publicly.',
    ],
  },
  {
    id: 'data-security',
    heading: 'Security & Storage Practices',
    paragraphs: [
      'We apply industry-standard encryption in transit (HTTPS/TLS), role-based access controls, and periodic security reviews to guard against unauthorized access, alteration, or disclosure of shared-living records.',
    ],
  },
  {
    id: 'user-rights',
    heading: 'Your Rights & Data Removal',
    paragraphs: [
      'Residents and managers may request correction or deletion of personal contact records upon leaving a mess. Historical financial totals may be anonymized to preserve accurate accounting continuity for remaining flatmates.',
    ],
  },
  {
    id: 'cookies-preferences',
    heading: 'Cookies & Language Preferences',
    paragraphs: [
      'MessMate uses essential browser storage solely to remember your chosen interface language (English or Bangla) and core session preferences. We do not deploy invasive third-party advertising trackers.',
    ],
  },
  {
    id: 'contact-privacy',
    heading: 'Privacy Inquiries',
    paragraphs: [
      'If you have questions about how your residence data is protected or wish to submit a data access request, contact our privacy desk at privacy@messmate.app.',
    ],
  },
];

const PRIVACY_SECTIONS_BN: LegalSection[] = [
  {
    id: 'information-we-collect',
    heading: 'আমরা যে তথ্য সংগ্রহ করি',
    paragraphs: [
      'মেস ম্যানেজার, সদস্য বা বাড়িওয়ালা যখন MessMate ব্যবহার করেন, তখন নির্ভুল মেস হিসাব ও যোগাযোগের জন্য প্রয়োজনীয় ন্যূনতম তথ্যই সংগ্রহ করা হয়।',
    ],
    bullets: [
      'নাম, ইমেইল, ফোন নম্বর এবং পছন্দের ভাষা (ইংরেজি বা বাংলা)।',
      'অনুমোদিত ম্যানেজারের যুক্ত করা রুম বরাদ্দ, দৈনিক মিল, বাজার খরচ, ভাড়া এবং পেমেন্ট রেকর্ড।',
      'রুম রেন্টাল পোর্টালের জন্য স্বেচ্ছায় প্রকাশিত এলাকা, ভাড়া ও সুবিধার বিবরণ।',
    ],
  },
  {
    id: 'financial-records',
    heading: 'আর্থিক ও মিল লেজারের গোপনীয়তা',
    paragraphs: [
      'সদস্যদের জমা, বাজার খরচ, ভাড়ার অবস্থা এবং নিট ব্যালেন্স শুধুমাত্র ওই নির্দিষ্ট মেসের অনুমোদিত সদস্য ও ম্যানেজারদের জন্যই দৃশ্যমান থাকে।',
      'অভ্যন্তরীণ আর্থিক তথ্য কখনোই পাবলিক মেস ওয়েবসাইটে প্রকাশ করা হয় না।',
    ],
  },
  {
    id: 'emergency-contacts',
    heading: 'জরুরি ও অভিভাবক তথ্যের সুরক্ষা',
    paragraphs: [
      'বাড়িওয়ালা, নিকটস্থ হাসপাতাল ও জাতীয় জরুরি সেবা নম্বর সব সক্রিয় সদস্যের জন্য উন্মুক্ত থাকে। তবে সদস্যদের ব্যক্তিগত অভিভাবকের (ICE) নম্বর ও রক্তের গ্রুপ শুধুমাত্র দায়িত্বপ্রাপ্ত মেস ম্যানেজারের জন্য সীমাবদ্ধ।',
    ],
  },
  {
    id: 'room-rental-visibility',
    heading: 'পাবলিক রুম রেন্টাল লিস্টিং',
    paragraphs: [
      'ম্যানেজার যখন কোনো খালি সিট পাবলিক পোর্টালে প্রকাশ করেন, তখন শুধুমাত্র অনুমোদিত পাবলিক তথ্য (এলাকা, ভাড়া, সুবিধাসমূহ, নিয়ম ও যোগাযোগের নম্বর) প্রদর্শিত হয়।',
    ],
  },
  {
    id: 'data-security',
    heading: 'তথ্য নিরাপত্তা ও সংরক্ষণ',
    paragraphs: [
      'অননুমোদিত প্রবেশাধিকার রোধে আমরা আধুনিক এনক্রিপশন (HTTPS/TLS) এবং রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল ব্যবহার করি।',
    ],
  },
  {
    id: 'user-rights',
    heading: 'আপনার অধিকার ও তথ্য মুছে ফেলা',
    paragraphs: [
      'কোনো সদস্য মেস ত্যাগ করলে ব্যক্তিগত যোগাযোগ তথ্য সংশোধন বা অপসারণের অনুরোধ করতে পারেন। মেসের হিসাবের ধারাবাহিকতা রক্ষায় পূর্ববর্তী আর্থিক সারসংক্ষেপ নামবিহীনভাবে সংরক্ষিত থাকতে পারে।',
    ],
  },
  {
    id: 'cookies-preferences',
    heading: 'কুকিজ ও ভাষা পছন্দ',
    paragraphs: [
      'আপনার নির্বাচিত ভাষা (বাংলা বা ইংরেজি) মনে রাখার জন্য শুধুমাত্র প্রয়োজনীয় ব্রাউজার স্টোরেজ ব্যবহার করা হয়। আমরা কোনো বিজ্ঞাপনমূলক ট্র্যাকার ব্যবহার করি না।',
    ],
  },
  {
    id: 'contact-privacy',
    heading: 'গোপনীয়তা সংক্রান্ত যোগাযোগ',
    paragraphs: [
      'ডেটা সুরক্ষা সম্পর্কিত যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন: privacy@messmate.app।',
    ],
  },
];

export function PrivacyPageClient() {
  const { locale, t } = useLanguage();

  return (
    <LegalDocumentLayout
      title={t.pages.privacy.title}
      subtitle={t.pages.privacy.subtitle}
      lastUpdated={t.pages.privacy.lastUpdated}
      tocLabel={locale === 'en' ? 'On This Page' : 'এই পৃষ্ঠার সূচিপত্র'}
      sections={locale === 'bn' ? PRIVACY_SECTIONS_BN : PRIVACY_SECTIONS_EN}
    />
  );
}
