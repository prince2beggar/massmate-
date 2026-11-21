'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  LegalDocumentLayout,
  type LegalSection,
} from '@/components/ui/LegalDocumentLayout';

const TERMS_SECTIONS_EN: LegalSection[] = [
  {
    id: 'acceptance',
    heading: 'Acceptance of Terms',
    paragraphs: [
      'By accessing the MessMate website or utilizing MessMate shared-living software services, you agree to comply with these Terms & Conditions and all applicable local housing and electronic communication laws.',
    ],
  },
  {
    id: 'scope-of-service',
    heading: 'Scope of Software Platform',
    paragraphs: [
      'MessMate provides digital management software for tracking rooms, members, daily meals, bazar expenses, rent calculations, notices, and public room listings.',
      'MessMate is strictly a technology provider—not a landlord, real-estate broker, payment processor, or financial custodian. All monetary transfers (rent, deposits, bazar funds) occur directly between residents, managers, and property owners.',
    ],
  },
  {
    id: 'manager-responsibilities',
    heading: 'Manager & Resident Responsibilities',
    paragraphs: [
      'Mess managers are responsible for accurately recording bazar receipts, verifying member meal counts, and confirming payment receipts inside their workspace.',
    ],
    bullets: [
      'Maintain honest, verifiable bazar and utility entries.',
      'Obtain resident consent before storing personal guardian (ICE) contact records.',
      'Transfer manager access cleanly when rotating monthly responsibilities.',
    ],
  },
  {
    id: 'rental-listings',
    heading: 'Acceptable Use for Room Rental Listings',
    paragraphs: [
      'Managers and house owners publishing rooms on the MessMate Room Rental portal agree that all stated rents, service charges, locations, photos, and occupancy rules are accurate and non-misleading. Fraudulent or spam listings will be removed immediately.',
    ],
  },
  {
    id: 'subscriptions',
    heading: 'Subscription Plans & Billing',
    paragraphs: [
      'The Starter plan is free for residences with up to 8 active members. Paid plans (Mess Pro and Multi-Mess) are billed monthly or annually at published rates and may be upgraded, downgraded, or canceled before the next billing cycle without lock-in penalties.',
    ],
  },
  {
    id: 'intellectual-property',
    heading: 'Intellectual Property',
    paragraphs: [
      'All MessMate branding, interface designs, software architecture, and documentation belong to MessMate Technologies. Residences retain full ownership of all operational records, photos, and notices they enter into the platform.',
    ],
  },
  {
    id: 'liability',
    heading: 'Limitation of Liability',
    paragraphs: [
      'While MessMate calculates meal rates and rent splits with mathematical precision based on entered figures, MessMate is not liable for interpersonal tenancy disputes, inaccurate manual data entry, or offline property incidents.',
    ],
  },
  {
    id: 'governing-law',
    heading: 'Governing Law & Contact',
    paragraphs: [
      'These terms are governed by the laws of Bangladesh. For legal notices or compliance inquiries, email legal@messmate.app.',
    ],
  },
];

const TERMS_SECTIONS_BN: LegalSection[] = [
  {
    id: 'acceptance',
    heading: 'শর্তাবলী গ্রহণ',
    paragraphs: [
      'MessMate ওয়েবসাইট বা সফটওয়্যার সেবা ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী এবং প্রযোজ্য স্থানীয় আইন মেনে চলতে সম্মত হচ্ছেন।',
    ],
  },
  {
    id: 'scope-of-service',
    heading: 'সফটওয়্যার প্ল্যাটফর্মের পরিধি',
    paragraphs: [
      'MessMate হলো রুম, সদস্য, দৈনিক মিল, বাজার খরচ, ভাড়া হিসাব, নোটিশ এবং পাবলিক রুম লিস্টিং ব্যবস্থাপনার একটি ডিজিটাল সফটওয়্যার।',
      'MessMate কোনো বাড়িওয়ালা, প্রপার্টি ব্রোকার বা আর্থিক মধ্যস্থতাকারী নয়। ভাড়া, জামানত ও বাজারের সকল লেনদেন সরাসরি সদস্য, ম্যানেজার ও বাড়িওয়ালার মধ্যে সম্পন্ন হয়।',
    ],
  },
  {
    id: 'manager-responsibilities',
    heading: 'ম্যানেজার ও সদস্যদের দায়িত্ব',
    paragraphs: [
      'সঠিকভাবে বাজারের রশিদ লিপিবদ্ধ করা, মিল যাচাই করা এবং পেমেন্ট নিশ্চিত করার দায়িত্ব সংশ্লিষ্ট মেস ম্যানেজারের।',
    ],
    bullets: [
      'সত্য ও যাচাইযোগ্য বাজার এবং ইউটিলিটি হিসাব সংরক্ষণ করা।',
      'অভিভাবকের (ICE) নম্বর যুক্ত করার আগে সদস্যের সম্মতি গ্রহণ করা।',
      'দায়িত্ব পরিবর্তনের সময় নতুন ম্যানেজারকে সঠিকভাবে অ্যাক্সেস হস্তান্তর করা।',
    ],
  },
  {
    id: 'rental-listings',
    heading: 'রুম রেন্টাল লিস্টিং নীতিমালা',
    paragraphs: [
      'পাবলিক রুম রেন্টাল পোর্টালে প্রকাশিত সকল ভাড়া, সার্ভিস চার্জ, অবস্থান, ছবি ও নিয়মাবলী অবশ্যই নির্ভুল ও সত্য হতে হবে। ভুয়া বা বিভ্রান্তিকর বিজ্ঞাপন তাৎক্ষণিকভাবে সরিয়ে ফেলা হবে।',
    ],
  },
  {
    id: 'subscriptions',
    heading: 'সাবস্ক্রিপশন ও বিলিং',
    paragraphs: [
      'সর্বোচ্চ ৮ জন সদস্যের জন্য স্টার্টার প্ল্যান সম্পূর্ণ ফ্রি। পেইড প্ল্যানগুলো মাসিক বা বার্ষিক হারে প্রযোজ্য এবং পরবর্তী বিলিং চক্রের আগে যেকোনো সময় পরিবর্তন বা বাতিল করা যাবে।',
    ],
  },
  {
    id: 'intellectual-property',
    heading: 'মেধাস্বত্ব (Intellectual Property)',
    paragraphs: [
      'MessMate-এর ব্র্যান্ড, ডিজাইন ও সফটওয়্যার MessMate Technologies-এর মালিকানাধীন। তবে মেসের যুক্ত করা নিজস্ব হিসাব, ছবি ও নোটিশের সম্পূর্ণ মালিকানা সংশ্লিষ্ট মেসের।',
    ],
  },
  {
    id: 'liability',
    heading: 'দায়বদ্ধতার সীমাবদ্ধতা',
    paragraphs: [
      'ইনপুট করা তথ্যের ভিত্তিতে MessMate নির্ভুল হিসাব প্রদান করে; তবে ভুল ম্যানুয়াল এন্ট্রি বা অফলাইন ভাড়াটিয়া-মালিক বিবাদের জন্য MessMate দায়ী নয়।',
    ],
  },
  {
    id: 'governing-law',
    heading: 'প্রযোজ্য আইন ও যোগাযোগ',
    paragraphs: [
      'এই শর্তাবলী বাংলাদেশের প্রচলিত আইন অনুযায়ী পরিচালিত হবে। আইনি যোগাযোগের জন্য ইমেইল করুন: legal@messmate.app।',
    ],
  },
];

export function TermsPageClient() {
  const { locale, t } = useLanguage();

  return (
    <LegalDocumentLayout
      title={t.pages.terms.title}
      subtitle={t.pages.terms.subtitle}
      lastUpdated={t.pages.terms.lastUpdated}
      tocLabel={locale === 'en' ? 'On This Page' : 'এই পৃষ্ঠার সূচিপত্র'}
      sections={locale === 'bn' ? TERMS_SECTIONS_BN : TERMS_SECTIONS_EN}
    />
  );
}
