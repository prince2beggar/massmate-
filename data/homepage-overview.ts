export type TrustBenefitIconName =
  | 'Layers'
  | 'ReceiptText'
  | 'Bell'
  | 'ShieldCheck';

export interface TrustBenefitItem {
  id: string;
  iconName: TrustBenefitIconName;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
}

export type OverviewFeatureIconName =
  | 'Users'
  | 'Utensils'
  | 'ShoppingBag'
  | 'Wallet'
  | 'BedDouble'
  | 'Bell'
  | 'Building2'
  | 'ShieldAlert';

export interface OverviewFeatureItem {
  id: string;
  iconName: OverviewFeatureIconName;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  expandedDetail: { en: string; bn: string };
  sectionHref: string;
  linkLabel: { en: string; bn: string };
}

export const TRUST_BENEFITS: readonly TrustBenefitItem[] = [
  {
    id: 'all-in-one',
    iconName: 'Layers',
    title: {
      en: 'All-in-One Management',
      bn: 'এক প্ল্যাটফর্মে সব ব্যবস্থাপনা',
    },
    description: {
      en: 'Manage members, meals, expenses and rooms from one platform.',
      bn: 'সদস্য, মিল, খরচ এবং রুম—সবকিছু পরিচালনা করুন একটি প্ল্যাটফর্ম থেকে।',
    },
  },
  {
    id: 'transparent-finance',
    iconName: 'ReceiptText',
    title: {
      en: 'Transparent Finance',
      bn: 'স্বচ্ছ আর্থিক হিসাব',
    },
    description: {
      en: 'Track bills, payments, previous dues and monthly expenses.',
      bn: 'বিল, পেমেন্ট, পূর্বের বকেয়া এবং মাসিক খরচের নিখুঁত হিসাব রাখুন।',
    },
  },
  {
    id: 'organized-community',
    iconName: 'Bell',
    title: {
      en: 'Organized Community',
      bn: 'সুশৃঙ্খল মেস কমিউনিটি',
    },
    description: {
      en: 'Keep members connected through notices, events and updates.',
      bn: 'নোটিশ, ইভেন্ট ও জরুরি আপডেটের মাধ্যমে সকল সদস্যকে যুক্ত রাখুন।',
    },
  },
  {
    id: 'privacy-security',
    iconName: 'ShieldCheck',
    title: {
      en: 'Privacy & Security',
      bn: 'গোপনীয়তা ও নিরাপত্তা',
    },
    description: {
      en: 'Keep mess information organized with role-based access and privacy controls.',
      bn: 'রোল-ভিত্তিক অ্যাক্সেস ও প্রাইভেসি কন্ট্রোলের মাধ্যমে মেসের তথ্য নিরাপদ রাখুন।',
    },
  },
] as const;

export const HOMEPAGE_OVERVIEW_FEATURES: readonly OverviewFeatureItem[] = [
  {
    id: 'member-management',
    iconName: 'Users',
    title: {
      en: 'Member Management',
      bn: 'সদস্য ব্যবস্থাপনা',
    },
    description: {
      en: 'Manage member profiles, roles, room assignments and member information.',
      bn: 'সদস্যদের প্রোফাইল, রোল, রুম বরাদ্দ এবং প্রয়োজনীয় তথ্য গুছিয়ে রাখুন।',
    },
    expandedDetail: {
      en: 'Designed to keep move-in dates, assigned seats, manager/member roles, and private contact fields organized per mess.',
      bn: 'সদস্যের যোগদানের তারিখ, সিট বরাদ্দ, ম্যানেজার ও সদস্য রোল এবং ব্যক্তিগত তথ্য প্রতিটি মেস অনুযায়ী সাজিয়ে রাখার জন্য ডিজাইন করা।',
    },
    sectionHref: '#how-it-works',
    linkLabel: { en: 'See workflow', bn: 'প্রক্রিয়া দেখুন' },
  },
  {
    id: 'meal-management',
    iconName: 'Utensils',
    title: {
      en: 'Meal Management',
      bn: 'মিল ব্যবস্থাপনা',
    },
    description: {
      en: 'Track daily meals, meal schedules, meal off requests and monthly meal summaries.',
      bn: 'দৈনিক মিল, মিল সময়সূচি, মিল অফ রিকোয়েস্ট এবং মাসিক মিল সারাংশ ট্র্যাক করুন।',
    },
    expandedDetail: {
      en: 'Structured around daily meal entries, guest meal notes, off-day pauses, and clear end-of-month meal counts.',
      bn: 'দৈনিক মিল এন্ট্রি, গেস্ট মিল, মিল বন্ধের অনুরোধ এবং মাস শেষের স্পষ্ট মিল সারসংক্ষেপের জন্য সাজানো।',
    },
    sectionHref: '#how-it-works',
    linkLabel: { en: 'See workflow', bn: 'প্রক্রিয়া দেখুন' },
  },
  {
    id: 'bazar-management',
    iconName: 'ShoppingBag',
    title: {
      en: 'Bazar Management',
      bn: 'বাজার ব্যবস্থাপনা',
    },
    description: {
      en: 'Record bazar expenses, itemized purchases, receipts and monthly spending.',
      bn: 'বাজার খরচ, পণ্যের তালিকা, রসিদ এবং মাসিক ব্যয়ের সুস্পষ্ট রেকর্ড রাখুন।',
    },
    expandedDetail: {
      en: 'Helps log daily shopping entries, shopper notes, and total monthly grocery spending to support fair meal-rate calculation.',
      bn: 'প্রতিদিনের বাজারের হিসাব, বাজারকারীর নোট এবং মাসিক মোট খরচ লিপিবদ্ধ করে ন্যায্য মিল রেট নির্ধারণে সহায়তা করে।',
    },
    sectionHref: '#how-it-works',
    linkLabel: { en: 'See workflow', bn: 'প্রক্রিয়া দেখুন' },
  },
  {
    id: 'finance-bills',
    iconName: 'Wallet',
    title: {
      en: 'Finance & Bills',
      bn: 'আর্থিক হিসাব ও বিল',
    },
    description: {
      en: 'Manage rent, utilities, payments, previous dues and monthly statements.',
      bn: 'ভাড়া, ইউটিলিটি বিল, পেমেন্ট, পূর্বের বকেয়া এবং মাসিক স্টেটমেন্ট পরিচালনা করুন।',
    },
    expandedDetail: {
      en: 'Brings room rent, shared utility bills, deposits, carry-forward dues, and monthly financial summaries into one structured ledger.',
      bn: 'রুম ভাড়া, শেয়ার্ড ইউটিলিটি বিল, জমা টাকা, পূর্বের বকেয়া এবং মাসিক স্টেটমেন্ট এক লেজারে গুছিয়ে রাখে।',
    },
    sectionHref: '#pricing',
    linkLabel: { en: 'View plans', bn: 'প্ল্যান দেখুন' },
  },
  {
    id: 'room-management',
    iconName: 'BedDouble',
    title: {
      en: 'Room Management',
      bn: 'রুম ব্যবস্থাপনা',
    },
    description: {
      en: 'Organize rooms, occupancy, rental information and room availability.',
      bn: 'রুম, সিট অবস্থান, ভাড়ার তথ্য এবং খালি রুমের অবস্থা সাজিয়ে রাখুন।',
    },
    expandedDetail: {
      en: 'Tracks room numbers, seat capacity, occupied vs. open beds, and room-level rent details clearly.',
      bn: 'রুম নম্বর, সিট সংখ্যা, দখলকৃত ও খালি সিট এবং রুমভিত্তিক ভাড়ার তথ্য স্পষ্টভাবে সংগঠিত রাখে।',
    },
    sectionHref: '#room-rentals',
    linkLabel: { en: 'Explore rooms', bn: 'রুম দেখুন' },
  },
  {
    id: 'community-notices',
    iconName: 'Bell',
    title: {
      en: 'Community & Notices',
      bn: 'কমিউনিটি ও নোটিশ',
    },
    description: {
      en: 'Share notices, announcements, events and important updates.',
      bn: 'নোটিশ, ঘোষণা, ইভেন্ট এবং গুরুত্বপূর্ণ আপডেট সহজেই সবার সাথে শেয়ার করুন।',
    },
    expandedDetail: {
      en: 'Keeps bazar deadlines, house rules, maintenance updates, and shared announcements organized without scattered chat threads.',
      bn: 'বাজারের সময়সীমা, বাসার নিয়মাবলি, রক্ষণাবেক্ষণ আপডেট ও গুরুত্বপূর্ণ ঘোষণা এক জায়গায় সাজিয়ে রাখে।',
    },
    sectionHref: '#emergency-safety',
    linkLabel: { en: 'See notices', bn: 'নোটিশ দেখুন' },
  },
  {
    id: 'rental-management',
    iconName: 'Building2',
    title: {
      en: 'Rental Management',
      bn: 'রেন্টাল ব্যবস্থাপনা',
    },
    description: {
      en: 'Show available rooms and beds with rental information and booking requests.',
      bn: 'খালি রুম ও সিটের ভাড়ার তথ্য এবং বুকিং অনুরোধ পরিষ্কারভাবে প্রদর্শন করুন।',
    },
    expandedDetail: {
      en: 'Designed to publish vacant rooms, rent ranges, facilities, and structured inquiry requests when vacancies open.',
      bn: 'সিট খালি হলে ভাড়ার তথ্য, সুবিধাসমূহ এবং ইনকোয়ারি অনুরোধ পরিষ্কারভাবে প্রদর্শনের জন্য ডিজাইন করা।',
    },
    sectionHref: '#room-rentals',
    linkLabel: { en: 'Browse rentals', bn: 'রেন্টাল দেখুন' },
  },
  {
    id: 'emergency-safety',
    iconName: 'ShieldAlert',
    title: {
      en: 'Emergency & Safety',
      bn: 'জরুরি ও নিরাপত্তা',
    },
    description: {
      en: 'Provide important emergency contacts and mess-specific safety information.',
      bn: 'জরুরি যোগাযোগের নম্বর এবং মেস-নির্দিষ্ট নিরাপত্তা তথ্য হাতের নাগালে রাখুন।',
    },
    expandedDetail: {
      en: 'Combines verified national hotlines with member-only mess directories while keeping personal family ICE details private.',
      bn: 'যাচাইকৃত জাতীয় হটলাইনের সাথে মেস-নির্দিষ্ট জরুরি ডিরেক্টরি যুক্ত রাখে এবং ব্যক্তিগত পারিবারিক তথ্য গোপন রাখে।',
    },
    sectionHref: '#emergency-safety',
    linkLabel: { en: 'Safety directory', bn: 'নিরাপত্তা দেখুন' },
  },
] as const;
