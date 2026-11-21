export interface LocalizedText {
  en: string;
  bn: string;
}

export interface StarterPlanConfig {
  id: 'starter';
  trialDays: number;
  monthlyPriceBdt: number;
  currencySymbol: '৳';
  autoRenewal: false;
  name: LocalizedText;
  badge: LocalizedText;
  summary: LocalizedText;
  trialExplanation: LocalizedText;
  postTrialPolicy: LocalizedText;
  features: readonly LocalizedText[];
}

export interface BusinessCategoryOption {
  id: string;
  label: LocalizedText;
}

export interface CustomPackageDiscoveryItem {
  id: 'multiple-mess' | 'hostel-accommodation' | 'multi-property-business';
  iconName: 'Building2' | 'BedDouble' | 'Layers';
  defaultCategoryId: string;
  title: LocalizedText;
  description: LocalizedText;
  useCaseLabel: LocalizedText;
}

export interface CustomPlanConfig {
  id: 'custom-business';
  pricingModel: 'custom';
  fixedPrice: false;
  name: LocalizedText;
  badge: LocalizedText;
  priceHeadline: LocalizedText;
  priceNote: LocalizedText;
  summary: LocalizedText;
  capabilityDisclaimer: LocalizedText;
  targetCategories: readonly BusinessCategoryOption[];
  capabilities: readonly LocalizedText[];
}

export const STARTER_PLAN_CONFIG: StarterPlanConfig = {
  id: 'starter',
  trialDays: 7,
  monthlyPriceBdt: 99,
  currencySymbol: '৳',
  autoRenewal: false,
  name: {
    en: 'Starter Plan',
    bn: 'স্টার্টার প্ল্যান',
  },
  badge: {
    en: '7 Days Free Trial',
    bn: '৭ দিনের ফ্রি ট্রায়াল',
  },
  summary: {
    en: 'Everything you need to organize a single mess with clarity, transparent meal math, and simple monthly reporting.',
    bn: 'একটি মেস সুশৃঙ্খলভাবে পরিচালনার জন্য মিল, বাজার, ভাড়া ও মাসিক রিপোর্টের পূর্ণাঙ্গ সমাধান।',
  },
  trialExplanation: {
    en: 'Try Starter free for exactly 7 days with full access to standard features.',
    bn: 'স্ট্যান্ডার্ড সব সুবিধাসহ পুরো ৭ দিন বিনামূল্যে স্টার্টার প্ল্যান ব্যবহার করুন।',
  },
  postTrialPolicy: {
    en: 'After the 7-day trial ends, subscribe for ৳99/month to continue paid Starter features. No automatic payment or renewal without your explicit consent.',
    bn: '৭ দিনের ট্রায়াল শেষে পেইড স্টার্টার সুবিধা চালু রাখতে মাসিক ৳৯৯ সাবস্ক্রিপশন নিতে হবে। আপনার স্পষ্ট সম্মতি ছাড়া কোনো অটো-পেমেন্ট বা অটো-রিনিউয়াল হবে না।',
  },
  features: [
    { en: 'One Mess Management', bn: 'একটি মেস ব্যবস্থাপনা' },
    { en: 'Member Management', bn: 'সদস্য ব্যবস্থাপনা' },
    { en: 'Meal Management', bn: 'মিল ব্যবস্থাপনা' },
    { en: 'Bazar Management', bn: 'বাজার ব্যবস্থাপনা' },
    { en: 'Rent and Utility Management', bn: 'ভাড়া ও ইউটিলিটি ব্যবস্থাপনা' },
    { en: 'Monthly Financial Reports', bn: 'মাসিক আর্থিক রিপোর্ট' },
    { en: 'Basic Mess Website', bn: 'বেসিক মেস ওয়েবসাইট' },
    { en: 'Basic Website Customization', bn: 'বেসিক ওয়েবসাইট কাস্টমাইজেশন' },
    { en: 'Standard Features', bn: 'স্ট্যান্ডার্ড ফিচারসমূহ' },
  ],
};

export const CUSTOM_BUSINESS_CATEGORIES: readonly BusinessCategoryOption[] = [
  {
    id: 'multiple-mess',
    label: { en: 'Multiple Mess Management', bn: 'একাধিক মেস ব্যবস্থাপনা' },
  },
  {
    id: 'student-hostel',
    label: { en: 'Student Hostel Management', bn: 'স্টুডেন্ট হোস্টেল ব্যবস্থাপনা' },
  },
  {
    id: 'bachelor-hostel',
    label: { en: 'Bachelor Hostel Management', bn: 'ব্যাচেলর হোস্টেল ব্যবস্থাপনা' },
  },
  {
    id: 'shared-apartment',
    label: {
      en: 'Shared Apartment Management',
      bn: 'শেয়ার্ড অ্যাপার্টমেন্ট ব্যবস্থাপনা',
    },
  },
  {
    id: 'student-accommodation',
    label: {
      en: 'Student Accommodation Management',
      bn: 'স্টুডেন্ট আবাসন ব্যবস্থাপনা',
    },
  },
  {
    id: 'staff-accommodation',
    label: {
      en: 'Staff Accommodation Management',
      bn: 'স্টাফ আবাসন ব্যবস্থাপনা',
    },
  },
  {
    id: 'boarding-house',
    label: { en: 'Boarding House Management', bn: 'বোর্ডিং হাউস ব্যবস্থাপনা' },
  },
  {
    id: 'co-living-space',
    label: { en: 'Co-living Space Management', bn: 'কো-লিভিং স্পেস ব্যবস্থাপনা' },
  },
  {
    id: 'multi-property-rental',
    label: {
      en: 'Multi-property Rental Management',
      bn: 'মাল্টি-প্রপার্টি রেন্টাল ব্যবস্থাপনা',
    },
  },
] as const;

export const CUSTOM_BUSINESS_CAPABILITIES: readonly LocalizedText[] = [
  {
    en: 'Multiple mess or property management',
    bn: 'একাধিক মেস বা প্রপার্টি ব্যবস্থাপনা',
  },
  {
    en: 'Centralized management dashboard',
    bn: 'কেন্দ্রীয় ব্যবস্থাপনা ড্যাশবোর্ড',
  },
  { en: 'Multiple location management', bn: 'একাধিক লোকেশন ব্যবস্থাপনা' },
  { en: 'Advanced member management', bn: 'অ্যাডভান্সড সদস্য ব্যবস্থাপনা' },
  {
    en: 'Custom roles and permissions',
    bn: 'কাস্টম রোল ও পারমিশন কন্ট্রোল',
  },
  { en: 'Advanced financial reporting', bn: 'অ্যাডভান্সড ফিন্যান্সিয়াল রিপোর্টিং' },
  {
    en: 'Custom website and branding',
    bn: 'কাস্টম ওয়েবসাইট ও ব্র্যান্ডিং',
  },
  { en: 'Custom domain support', bn: 'কাস্টম ডোমেইন সাপোর্ট' },
  { en: 'Additional feature modules', bn: 'অতিরিক্ত ফিচার মডিউল' },
  { en: 'Business-specific workflows', bn: 'ব্যবসা-নির্দিষ্ট ওয়ার্কফ্লো' },
  { en: 'Dedicated support options', bn: 'ডেডিকেটেড সাপোর্ট সুবিধা' },
] as const;

export const CUSTOM_PLAN_CONFIG: CustomPlanConfig = {
  id: 'custom-business',
  pricingModel: 'custom',
  fixedPrice: false,
  name: {
    en: 'Customized Business Plan',
    bn: 'কাস্টমাইজড বিজনেস প্ল্যান',
  },
  badge: {
    en: 'Multi-Property & Enterprise',
    bn: 'মাল্টি-প্রপার্টি ও বিজনেস',
  },
  priceHeadline: {
    en: 'Custom Pricing',
    bn: 'কাস্টম প্রাইসিং',
  },
  priceNote: {
    en: 'Contact Us — Tailored to your properties, resident volume, and required modules',
    bn: 'যোগাযোগ করুন — আপনার প্রপার্টি সংখ্যা, সদস্য ও প্রয়োজনীয় মডিউল অনুযায়ী নির্ধারিত',
  },
  summary: {
    en: 'Designed for businesses managing multiple messes, hostels, boarding houses, co-living communities, or accommodation properties.',
    bn: 'একাধিক মেস, হোস্টেল, বোর্ডিং হাউস, কো-লিভিং বা আবাসন ব্যবসা পরিচালনাকারীদের জন্য বিশেষভাবে তৈরি।',
  },
  capabilityDisclaimer: {
    en: 'Available capabilities depend on your selected package and operational requirements—not every module is automatically included.',
    bn: 'প্রয়োজনীয়তা ও নির্বাচিত প্যাকেজ অনুযায়ী ফিচার যুক্ত করা হয়—সব মডিউল স্বয়ংক্রিয়ভাবে অন্তর্ভুক্ত নয়।',
  },
  targetCategories: CUSTOM_BUSINESS_CATEGORIES,
  capabilities: CUSTOM_BUSINESS_CAPABILITIES,
};

export const CUSTOM_PACKAGE_DISCOVERY_CARDS: readonly CustomPackageDiscoveryItem[] = [
  {
    id: 'multiple-mess',
    iconName: 'Building2',
    defaultCategoryId: 'multiple-mess',
    title: {
      en: 'Multiple Mess',
      bn: 'একাধিক মেস',
    },
    useCaseLabel: {
      en: 'For operators running 2+ mess units',
      bn: '২টি বা তার বেশি মেস পরিচালনাকারীদের জন্য',
    },
    description: {
      en: 'Coordinate separate messes across floors or neighborhoods with shared oversight, independent meal rates, and unified financial visibility.',
      bn: 'একাধিক ফ্লোর বা এলাকায় থাকা মেসগুলোকে আলাদা মিল রেট ও কেন্দ্রীয় আর্থিক তদারকিসহ পরিচালনা করুন।',
    },
  },
  {
    id: 'hostel-accommodation',
    iconName: 'BedDouble',
    defaultCategoryId: 'student-hostel',
    title: {
      en: 'Hostel & Accommodation',
      bn: 'হোস্টেল ও আবাসন',
    },
    useCaseLabel: {
      en: 'Student, bachelor & staff hostels',
      bn: 'স্টুডেন্ট, ব্যাচেলর ও স্টাফ হোস্টেল',
    },
    description: {
      en: 'Manage larger resident rosters, seat allocations, structured billing cycles, boarding house rules, and staff or student accommodation workflows.',
      bn: 'বড় সদস্য তালিকা, সিট বরাদ্দ, নিয়মিত বিলিং এবং স্টুডেন্ট বা স্টাফ আবাসন ব্যবস্থাপনা সহজ করুন।',
    },
  },
  {
    id: 'multi-property-business',
    iconName: 'Layers',
    defaultCategoryId: 'multi-property-rental',
    title: {
      en: 'Multi-Property Business',
      bn: 'মাল্টি-প্রপার্টি বিজনেস',
    },
    useCaseLabel: {
      en: 'Co-living & multi-location rentals',
      bn: 'কো-লিভিং ও মাল্টি-লোকেশন রেন্টাল',
    },
    description: {
      en: 'Centralize operations across shared apartments, co-living spaces, and multi-location properties with custom branding, roles, and reporting.',
      bn: 'শেয়ার্ড অ্যাপার্টমেন্ট ও কো-লিভিং প্রপার্টিগুলো কাস্টম ব্র্যান্ডিং, রোল ও রিপোর্টিংসহ এক জায়গায় পরিচালনা করুন।',
    },
  },
] as const;

export function formatBdtPrice(amount: number): string {
  return `৳${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
}
