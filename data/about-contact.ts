export interface BilingualText {
  en: string;
  bn: string;
}

export interface AboutHighlightItem {
  id: string;
  title: BilingualText;
  description: BilingualText;
  iconName: 'Sparkles' | 'Eye' | 'Layers' | 'Users';
}

export interface ContactChannelPlaceholder {
  id: string;
  title: BilingualText;
  description: BilingualText;
  emailPlaceholder: BilingualText;
  phonePlaceholder: BilingualText;
  iconName: 'MessageSquare' | 'Briefcase' | 'LifeBuoy' | 'Handshake';
}

export type HomepageInquiryTypeId =
  | 'general'
  | 'subscription-pricing'
  | 'custom-business'
  | 'technical-support'
  | 'partnership'
  | 'other';

export interface HomepageInquiryTypeOption {
  id: HomepageInquiryTypeId;
  label: BilingualText;
}

export const ABOUT_TARGET_AUDIENCES: BilingualText[] = [
  { en: 'Students', bn: 'শিক্ষার্থী' },
  { en: 'Bachelors', bn: 'ব্যাচেলর' },
  { en: 'Job holders', bn: 'চাকরিজীবী' },
  { en: 'Shared apartments', bn: 'শেয়ার্ড অ্যাপার্টমেন্ট' },
  { en: 'Student hostels', bn: 'স্টুডেন্ট হোস্টেল' },
  { en: 'Accommodation businesses', bn: 'আবাসন ব্যবসা' },
  { en: 'Multi-property operators', bn: 'একাধিক প্রপার্টি অপারেটর' },
];

export const ABOUT_PROBLEMS_SOLVED: BilingualText[] = [
  {
    en: 'Disorganized meal management',
    bn: 'অগোছালো দৈনিক মিল ব্যবস্থাপনা',
  },
  {
    en: 'Confusing shared expenses',
    bn: 'বিভ্রান্তিকর শেয়ার্ড বাজার ও খরচ হিসাব',
  },
  {
    en: 'Difficult member coordination',
    bn: 'সদস্যদের মধ্যে সমন্বয়ের জটিলতা',
  },
  {
    en: 'Manual rent and bill tracking',
    bn: 'কাগজে-কলমে বাসা ভাড়া ও বিল হিসাব রাখা',
  },
  {
    en: 'Poor financial transparency',
    bn: 'আর্থিক স্বচ্ছতার অভাব ও মাস শেষের বিভ্রান্তি',
  },
  {
    en: 'Room and accommodation management challenges',
    bn: 'রুম, সিট ও আবাসন ব্যবস্থাপনার ঝামেলা',
  },
];

export const ABOUT_HOW_MESSMATE_HELPS: BilingualText[] = [
  {
    en: 'Organize everyday operations.',
    bn: 'প্রতিদিনের মেস কার্যক্রম সুশৃঙ্খলভাবে পরিচালনা করুন।',
  },
  {
    en: 'Track meals and bazar expenses.',
    bn: 'দৈনিক মিল ও বাজার খরচ নির্ভুলভাবে ট্র্যাক করুন।',
  },
  {
    en: 'Manage rent, bills and payments.',
    bn: 'বাসা ভাড়া, ইউটিলিটি বিল ও পেমেন্ট সহজভাবে পরিচালনা করুন।',
  },
  {
    en: 'Maintain member information.',
    bn: 'সদস্যদের তথ্য, রুম বরাদ্দ ও ভূমিকা গুছিয়ে রাখুন।',
  },
  {
    en: 'Improve financial transparency.',
    bn: 'প্রতিটি খরচে স্পষ্ট আর্থিক স্বচ্ছতা নিশ্চিত করুন।',
  },
  {
    en: 'Connect members through notices and updates.',
    bn: 'নোটিশ ও গুরুত্বপূর্ণ আপডেটের মাধ্যমে সদস্যদের যুক্ত রাখুন।',
  },
];

export const ABOUT_MISSION_VISION = {
  mission: {
    heading: { en: 'Our Mission', bn: 'আমাদের লক্ষ্য (Mission)' },
    statement: {
      en: 'To make shared living management simpler, more transparent and more organized through accessible technology.',
      bn: 'সহজলভ্য প্রযুক্তির মাধ্যমে শেয়ার্ড লিভিং ব্যবস্থাপনাকে আরও সহজ, স্বচ্ছ এবং সুশৃঙ্খল করে তোলা।',
    },
  },
  vision: {
    heading: { en: 'Our Vision', bn: 'আমাদের দৃষ্টিভঙ্গি (Vision)' },
    statement: {
      en: 'To become a trusted management platform for messes, hostels and shared accommodation businesses.',
      bn: 'মেস, হোস্টেল এবং শেয়ার্ড আবাসন ব্যবসার জন্য একটি নির্ভরযোগ্য ডিজিটাল ব্যবস্থাপনা প্ল্যাটফর্ম হয়ে ওঠা।',
    },
  },
} as const;

export const ABOUT_WHY_CHOOSE_ITEMS: AboutHighlightItem[] = [
  {
    id: 'easy-to-use',
    title: { en: 'Easy to Use', bn: 'ব্যবহার করা সহজ' },
    description: {
      en: 'Clear everyday workflows designed so managers and residents can log meals, bills, and updates without steep learning curves.',
      bn: 'সহজ ও পরিচ্ছন্ন ইন্টারফেস যাতে ম্যানেজার ও সদস্যরা কোনো জটিলতা ছাড়াই প্রতিদিনের হিসাব রাখতে পারেন।',
    },
    iconName: 'Sparkles',
  },
  {
    id: 'transparent-management',
    title: { en: 'Transparent Management', bn: 'স্বচ্ছ ব্যবস্থাপনা' },
    description: {
      en: 'Keep meal counts, bazar expenses, rent dues, and monthly summaries visible so every member understands the numbers.',
      bn: 'মিল, বাজার খরচ, বাসা ভাড়া ও মাসিক স্টেটমেন্ট স্পষ্ট রাখুন যাতে প্রতিটি সদস্য হিসাব সহজে বুঝতে পারেন।',
    },
    iconName: 'Eye',
  },
  {
    id: 'flexible-businesses',
    title: {
      en: 'Flexible for Different Businesses',
      bn: 'বিভিন্ন আবাসনের জন্য উপযোগী',
    },
    description: {
      en: 'Adapts cleanly from a single student or bachelor mess to hostels, boarding houses, co-living spaces, and multi-property operators.',
      bn: 'একটি ছোট মেস থেকে শুরু করে হোস্টেল, বোর্ডিং হাউস ও একাধিক প্রপার্টি অপারেটরের চাহিদা অনুযায়ী নমনীয়।',
    },
    iconName: 'Layers',
  },
  {
    id: 'organized-community',
    title: { en: 'Organized Community', bn: 'সুশৃঙ্খল কমিউনিটি' },
    description: {
      en: 'Centralizes member records, house notices, room availability, and safety information in one dependable workspace.',
      bn: 'সদস্যদের তথ্য, নোটিশ, রুম তথ্য ও জরুরি নিরাপত্তা নির্দেশিকা সবকিছু এক প্ল্যাটফর্মে সাজানো থাকে।',
    },
    iconName: 'Users',
  },
];

/**
 * Centralized placeholder contact information.
 * Update these values in one place once official MessMate contact channels are finalized.
 * Never invent email addresses, phone numbers, office addresses, or social links.
 */
export const CENTRALIZED_CONTACT_PLACEHOLDERS = {
  email: {
    en: 'Email address coming soon',
    bn: 'ইমেইল ঠিকানা শীঘ্রই যুক্ত করা হবে',
  },
  phone: {
    en: 'Contact number coming soon',
    bn: 'যোগাযোগের নম্বর শীঘ্রই যুক্ত করা হবে',
  },
  officeAddress: {
    en: 'Office address to be announced',
    bn: 'অফিসের ঠিকানা পরবর্তীতে জানানো হবে',
  },
  socialChannels: {
    en: 'Official social channels to be announced',
    bn: 'অফিসিয়াল সোশ্যাল মিডিয়া চ্যানেল শীঘ্রই ঘোষণা করা হবে',
  },
} as const;

export const CONTACT_INFO_CHANNELS: ContactChannelPlaceholder[] = [
  {
    id: 'general-inquiries',
    title: { en: 'General Inquiries', bn: 'সাধারণ জিজ্ঞাসা' },
    description: {
      en: 'Questions about MessMate features, Starter Plan trial, or setting up your first mess.',
      bn: 'MessMate ফিচার, স্টার্টার প্ল্যান ট্রায়াল বা নতুন মেস সেটআপ সংক্রান্ত সাধারণ প্রশ্ন।',
    },
    emailPlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.email,
    phonePlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.phone,
    iconName: 'MessageSquare',
  },
  {
    id: 'sales-custom-solutions',
    title: {
      en: 'Sales & Custom Solutions',
      bn: 'সেলস ও কাস্টম সমাধান',
    },
    description: {
      en: 'Discuss Customized Business Plans for multiple messes, hostels, or multi-property rentals.',
      bn: 'একাধিক মেস, হোস্টেল বা মাল্টি-প্রপার্টি ব্যবসার জন্য কাস্টমাইজড বিজনেস প্ল্যান বিষয়ে আলোচনা।',
    },
    emailPlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.email,
    phonePlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.phone,
    iconName: 'Briefcase',
  },
  {
    id: 'technical-support',
    title: { en: 'Technical Support', bn: 'টেকনিক্যাল সাপোর্ট' },
    description: {
      en: 'Help with workspace setup, member roles, monthly reports, or platform troubleshooting.',
      bn: 'ওয়ার্কস্পেস সেটআপ, সদস্য রোল, মাসিক রিপোর্ট বা প্রযুক্তিগত সহায়তার জন্য।',
    },
    emailPlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.email,
    phonePlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.phone,
    iconName: 'LifeBuoy',
  },
  {
    id: 'business-partnerships',
    title: { en: 'Business Partnerships', bn: 'বিজনেস পার্টনারশিপ' },
    description: {
      en: 'Collaborate on accommodation operations, campus housing networks, or regional partnerships.',
      bn: 'আবাসন নেটওয়ার্ক, প্রতিষ্ঠানভিত্তিক সহযোগিতা বা ব্যবসায়িক পার্টনারশিপের জন্য।',
    },
    emailPlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.email,
    phonePlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.phone,
    iconName: 'Handshake',
  },
];

export const HOMEPAGE_INQUIRY_TYPES: HomepageInquiryTypeOption[] = [
  { id: 'general', label: { en: 'General Inquiry', bn: 'সাধারণ জিজ্ঞাসা' } },
  {
    id: 'subscription-pricing',
    label: { en: 'Subscription & Pricing', bn: 'সাবস্ক্রিপশন ও মূল্য' },
  },
  {
    id: 'custom-business',
    label: { en: 'Custom Business Solution', bn: 'কাস্টম বিজনেস সমাধান' },
  },
  {
    id: 'technical-support',
    label: { en: 'Technical Support', bn: 'টেকনিক্যাল সাপোর্ট' },
  },
  { id: 'partnership', label: { en: 'Partnership', bn: 'পার্টনারশিপ' } },
  { id: 'other', label: { en: 'Other', bn: 'অন্যান্য' } },
];
