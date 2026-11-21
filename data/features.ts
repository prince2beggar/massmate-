export type FeatureCategory = 'operations' | 'finance' | 'rentals' | 'safety';

export interface PlatformFeature {
  id: string;
  category: FeatureCategory;
  iconName:
    | 'Users'
    | 'BedDouble'
    | 'Utensils'
    | 'ShoppingBag'
    | 'Receipt'
    | 'CreditCard'
    | 'Building2'
    | 'Bell'
    | 'ShieldAlert';
  featuredSpan?: boolean;
  title: { en: string; bn: string };
  summary: { en: string; bn: string };
  bullets: { en: string[]; bn: string[] };
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: 'meal-tracking',
    category: 'finance',
    iconName: 'Utensils',
    featuredSpan: true,
    title: {
      en: 'Daily Meal & Guest Meal Engine',
      bn: 'দৈনিক মিল ও গেস্ট মিল ইঞ্জিন',
    },
    summary: {
      en: 'Track breakfast, lunch, dinner, and guest meals with automated cutoff windows and live meal-rate recalculation.',
      bn: 'সকাল, দুপুর, রাত এবং গেস্ট মিল হিসাব করুন নির্ধারিত কাট-অফ সময় ও লাইভ মিল রেট আপডেটসহ।',
    },
    bullets: {
      en: [
        'Configurable half-meal and full-meal weighting',
        'Daily member turn-off cutoff before kitchen prep',
        'Instant guest meal tagging tied to the host member',
      ],
      bn: [
        'হাফ মিল ও ফুল মিল ওয়েট নির্ধারণের সুবিধা',
        'রান্নার আগে দৈনিক মিল অফ করার সময়সীমা',
        'সদস্যের সাথে যুক্ত তাৎক্ষণিক গেস্ট মিল এন্ট্রি',
      ],
    },
  },
  {
    id: 'bazar-ledger',
    category: 'finance',
    iconName: 'ShoppingBag',
    featuredSpan: true,
    title: {
      en: 'Bazar Expense & Market Duty Log',
      bn: 'বাজার খরচ ও ডিউটি রুটিন লগ',
    },
    summary: {
      en: 'Record every grocery receipt, assign rotating bazar shoppers, and feed totals straight into the transparent monthly meal rate.',
      bn: 'প্রতিটি বাজারের হিসাব ও রশিদ লিখুন, সাপ্তাহিক বাজারের পালা নির্ধারণ করুন এবং স্বয়ংক্রিয় মিল রেটে যুক্ত করুন।',
    },
    bullets: {
      en: [
        'Itemized grocery entries with date and shopper attribution',
        'Rotating market duty schedule visible to all residents',
        'Automatic running bazar balance against member deposits',
      ],
      bn: [
        'তারিখ ও ক্রেতার নামসহ বিস্তারিত বাজারের এন্ট্রি',
        'সবার জন্য দৃশ্যমান সাপ্তাহিক বাজার রুটিন',
        'মোট জমার বিপরীতে চলমান বাজার ব্যালেন্স হিসাব',
      ],
    },
  },
  {
    id: 'member-management',
    category: 'operations',
    iconName: 'Users',
    title: {
      en: 'Member Profiles & Role Access',
      bn: 'সদস্য প্রোফাইল ও রোল অ্যাক্সেস',
    },
    summary: {
      en: 'Keep verified member records, join dates, NID/student ID notes, and clean permissions for Managers, Members, and House Owners.',
      bn: 'সদস্যদের তথ্য, যোগদানের তারিখ এবং ম্যানেজার, সদস্য ও বাড়িওয়ালার আলাদা অনুমতি ব্যবস্থাপনা করুন।',
    },
    bullets: {
      en: [
        'Seamless monthly manager handoff without losing history',
        'Active, notice-period, and alumni member archives',
        'Role-scoped visibility for privacy and audit integrity',
      ],
      bn: [
        'ইতিহাস না হারিয়ে সহজেই মাসিক ম্যানেজার পরিবর্তন',
        'সক্রিয়, নোটিশ-পিরিয়ড ও প্রাক্তন সদস্যদের আর্কাইভ',
        'নিরাপত্তা ও গোপনীয়তার জন্য ভূমিকাভিত্তিক অ্যাক্সেস',
      ],
    },
  },
  {
    id: 'room-allocation',
    category: 'operations',
    iconName: 'BedDouble',
    title: {
      en: 'Room & Seat Allocation Map',
      bn: 'রুম ও সিট বরাদ্দ ম্যাপ',
    },
    summary: {
      en: 'Map every room, seat rent tier, and occupancy status across floors so you always know which seats are opening next month.',
      bn: 'প্রতিটি রুমের সিট সংখ্যা, ভাড়া ও খালি অবস্থার নিখুঁত চিত্র রাখুন যাতে পরের মাসের খালি সিট আগেই জানা যায়।',
    },
    bullets: {
      en: [
        'Support for single rooms, twin-sharing, and multi-seat halls',
        'Per-room rent differences handled cleanly in monthly bills',
        'Upcoming move-out tracking for zero vacancy gaps',
      ],
      bn: [
        'সিঙ্গেল রুম, টুইন শেয়ারিং ও মাল্টি-সিট সমর্থন',
        'রুমভেদে ভিন্ন ভাড়ার স্বয়ংক্রিয় হিসাব',
        'বাসা ছাড়ার আগাম নোটিশ ট্র্যাকিং',
      ],
    },
  },
  {
    id: 'rent-utilities',
    category: 'finance',
    iconName: 'Receipt',
    title: {
      en: 'Rent & Shared Utility Splitting',
      bn: 'বাসা ভাড়া ও ইউটিলিটি বিল বিভাজন',
    },
    summary: {
      en: 'Divide electricity, gas, water, Wi-Fi, maid, and service charges accurately alongside each member’s specific seat rent.',
      bn: 'বিদ্যুৎ, গ্যাস, পানি, ওয়াই-ফাই, বুয়া ও সার্ভিস চার্জ রুম ভাড়ার সাথে স্বয়ংক্রিয়ভাবে ভাগ করে নিন।',
    },
    bullets: {
      en: [
        'Fixed-split and usage-weighted utility categories',
        'Clear line-by-line invoice breakdown per resident',
        'Zero manual spreadsheet formulas at month end',
      ],
      bn: [
        'সমান ভাগ বা রুমভিত্তিক ইউটিলিটি বিলিং',
        'প্রতিটি সদস্যের জন্য আলাদা লাইন-বাই-লাইন বিল',
        'মাস শেষে স্প্রেডশিট ছাড়াই নিখুঁত হিসাব',
      ],
    },
  },
  {
    id: 'payment-ledger',
    category: 'finance',
    iconName: 'CreditCard',
    title: {
      en: 'Payment Ledger & Due Settlement',
      bn: 'পেমেন্ট লেজার ও বকেয়া নিষ্পত্তি',
    },
    summary: {
      en: 'Log cash, bKash, Nagad, or bank transfers with timestamps, track partial payments, and roll balances cleanly into next month.',
      bn: 'নগদ, বিকাশ, নগদ বা ব্যাংক পেমেন্ট তারিখসহ লিখুন, আংশিক পরিশোধ ট্র্যাক করুন এবং ব্যালেন্স পরের মাসে সমন্বয় করুন।',
    },
    bullets: {
      en: [
        'Real-time paid, partial, payable, and refundable indicators',
        'Automatic carry-forward of overpayments or dues',
        'Audit trail showing who confirmed each collection',
      ],
      bn: [
        'পরিশোধিত, আংশিক, বাকি এবং পাওনার তাৎক্ষণিক অবস্থা',
        'অতিরিক্ত জমা বা বকেয়া স্বয়ংক্রিয়ভাবে পরের মাসে যুক্ত',
        'কে কখন পেমেন্ট গ্রহণ করেছে তার পূর্ণ রেকর্ড',
      ],
    },
  },
  {
    id: 'room-rentals',
    category: 'rentals',
    iconName: 'Building2',
    title: {
      en: 'Public Room Rental & Branded Site',
      bn: 'পাবলিক রুম রেন্টাল ও মেস ওয়েবসাইট',
    },
    summary: {
      en: 'Turn vacant seats into clean, verified public rental listings hosted on your customizable MessMate microsite.',
      bn: 'খালি সিটগুলোকে আপনার কাস্টমাইজযোগ্য MessMate মাইক্রোসাইটে যাচাইকৃত রুম ভাড়া বিজ্ঞাপন হিসেবে প্রকাশ করুন।',
    },
    bullets: {
      en: [
        'One-click publishing with rent, amenities, and house rules',
        'Customizable color theme and visible public modules',
        'Direct manager inquiry without third-party broker fees',
      ],
      bn: [
        'ভাড়া, সুবিধা ও নিয়মসহ এক ক্লিকে বিজ্ঞাপন প্রকাশ',
        'নিজের মতো থিম রঙ ও পাবলিক মডিউল নির্বাচন',
        'দালাল ছাড়াই সরাসরি ম্যানেজারের সাথে যোগাযোগ',
      ],
    },
  },
  {
    id: 'digital-notices',
    category: 'safety',
    iconName: 'Bell',
    title: {
      en: 'Pinned Digital Notice Board',
      bn: 'পিন করা ডিজিটাল নোটিশ বোর্ড',
    },
    summary: {
      en: 'Publish rent deadlines, meal policy updates, and house maintenance announcements where every resident sees them clearly.',
      bn: 'ভাড়ার সময়সীমা, মিল নীতিমালা ও বাসার রক্ষণাবেক্ষণ নোটিশ প্রকাশ করুন যাতে সবার নজরে থাকে।',
    },
    bullets: {
      en: [
        'Priority pinning for time-sensitive house advisories',
        'Permanent archive of house rules for new joiners',
        'Optional public visibility on your mess website',
      ],
      bn: [
        'জরুরি ঘোষণার জন্য প্রায়োরিটি পিনিং সুবিধা',
        'নতুন সদস্যদের জন্য স্থায়ী হাউস রুলস আর্কাইভ',
        'মেস ওয়েবসাইটে ঐচ্ছিকভাবে প্রদর্শনের সুযোগ',
      ],
    },
  },
  {
    id: 'emergency-safety',
    category: 'safety',
    iconName: 'ShieldAlert',
    title: {
      en: 'Emergency & Guardian Contacts',
      bn: 'জরুরি ও অভিভাবক যোগাযোগ ডিরেক্টরি',
    },
    summary: {
      en: 'Centralize house owner, local police, nearest hospital ER, and member guardian (ICE) numbers for fast response during emergencies.',
      bn: 'বাড়িওয়ালা, স্থানীয় থানা, নিকটস্থ হাসপাতাল এবং সদস্যদের অভিভাবকের নম্বর নিরাপদে সংরক্ষণ করুন।',
    },
    bullets: {
      en: [
        'One-tap emergency card pinned for active residents',
        'Privacy-protected member guardian & blood group directory',
        'Verified caretaker and utility technician numbers',
      ],
      bn: [
        'সক্রিয় সদস্যদের জন্য এক-ট্যাপ ইমার্জেন্সি কার্ড',
        'গোপনীয়তা সুরক্ষিত অভিভাবক ও রক্তের গ্রুপ তালিকা',
        'কেয়ারটেকার ও জরুরি টেকনিশিয়ানের নম্বর সংরক্ষণ',
      ],
    },
  },
];
