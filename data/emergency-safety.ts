export interface BilingualText {
  en: string;
  bn: string;
}

export interface NationalEmergencyContact {
  id: 'national-999' | 'fire-102' | 'health-16263';
  serviceName: BilingualText;
  number: string;
  availability: BilingualText;
  description: BilingualText;
  verified: boolean;
  isDemo: false;
  officialSourceLabel: BilingualText;
  officialSourceDomain: string;
  iconName: 'ShieldAlert' | 'Flame' | 'HeartPulse';
}

export type SafetyVisibilityScope = 'public' | 'member-only' | 'private';

export interface MessEmergencyCategory {
  id: string;
  category: BilingualText;
  roleSummary: BilingualText;
  visibility: SafetyVisibilityScope;
  demoPlaceholderNote: BilingualText;
  isDemo: true;
  iconName:
    | 'Home'
    | 'UserCog'
    | 'Stethoscope'
    | 'Hospital'
    | 'Pill'
    | 'Zap'
    | 'Wrench'
    | 'ShieldCheck'
    | 'HeartHandshake';
}

export interface SafetyInfoPlaceholder {
  id: string;
  title: BilingualText;
  shortSummary: BilingualText;
  ownerGuidance: BilingualText;
  isPlaceholder: true;
  iconName:
    | 'DoorOpen'
    | 'Flame'
    | 'Cross'
    | 'MapPin'
    | 'Building2'
    | 'BellRing';
}

export interface SafetyPrivacyScope {
  id: string;
  scope: SafetyVisibilityScope | 'mess-specific';
  title: BilingualText;
  description: BilingualText;
  badgeLabel: BilingualText;
  iconName: 'Globe' | 'Users' | 'Lock' | 'FileText';
}

/**
 * Bangladesh National Emergency Contacts
 * Verified against official Government of Bangladesh sources:
 * - 999: Bangladesh Police National Emergency Service (999.gov.bd, police.gov.bd, bangladesh.gov.bd)
 * - 102: Fire Service & Civil Defence Bangladesh (fireservice.gov.bd, bangladesh.gov.bd)
 * - 16263: Shastho Batayon / Health Batayon — MIS, DGHS (16263.dghs.gov.bd, dghs.gov.bd)
 */
export const NATIONAL_EMERGENCY_CONTACTS: NationalEmergencyContact[] = [
  {
    id: 'national-999',
    serviceName: {
      en: 'National Emergency Service',
      bn: 'জাতীয় জরুরি সেবা',
    },
    number: '999',
    availability: {
      en: '24/7 Toll-Free · Police, Fire & Ambulance',
      bn: '২৪/৭ টোল-ফ্রি · পুলিশ, ফায়ার ও অ্যাম্বুলেন্স',
    },
    description: {
      en: 'Operated by Bangladesh Police (Ministry of Home Affairs) for immediate nationwide emergency police, fire service, and ambulance dispatch.',
      bn: 'স্বরাষ্ট্র মন্ত্রণালয়ের অধীনে বাংলাদেশ পুলিশ পরিচালিত ২৪ ঘণ্টা টোল-ফ্রি জাতীয় জরুরি কল সেন্টার (পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স সহায়তা)।',
    },
    verified: true,
    isDemo: false,
    officialSourceLabel: {
      en: 'Verified · 999.gov.bd / police.gov.bd',
      bn: 'যাচাইকৃত · 999.gov.bd / police.gov.bd',
    },
    officialSourceDomain: '999.gov.bd',
    iconName: 'ShieldAlert',
  },
  {
    id: 'fire-102',
    serviceName: {
      en: 'Fire Service & Civil Defence',
      bn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    },
    number: '102',
    availability: {
      en: '24/7 Emergency Hotline · Fire & Rescue',
      bn: '২৪/৭ জরুরি হটলাইন · অগ্নি ও উদ্ধার সেবা',
    },
    description: {
      en: 'Official Fire Service & Civil Defence Bangladesh emergency hotline for fire response, rescue incidents, and civil defence emergencies.',
      bn: 'অগ্নিকাণ্ড, উদ্ধার অভিযান ও জরুরি দুর্যোগ মোকাবিলায় ফায়ার সার্ভিস ও সিভিল ডিফেন্স বাংলাদেশের অফিসিয়াল হটলাইন।',
    },
    verified: true,
    isDemo: false,
    officialSourceLabel: {
      en: 'Verified · fireservice.gov.bd',
      bn: 'যাচাইকৃত · fireservice.gov.bd',
    },
    officialSourceDomain: 'fireservice.gov.bd',
    iconName: 'Flame',
  },
  {
    id: 'health-16263',
    serviceName: {
      en: 'Health Batayon',
      bn: 'স্বাস্থ্য বাতায়ন',
    },
    number: '16263',
    availability: {
      en: '24/7 Health Helpline · DGHS Bangladesh',
      bn: '২৪/৭ সরকারি স্বাস্থ্য সেবা · স্বাস্থ্য অধিদপ্তর',
    },
    description: {
      en: 'Government health helpline managed by MIS, Directorate General of Health Services (DGHS) for 24/7 doctor consultation, hospital info, and ambulance guidance.',
      bn: 'স্বাস্থ্য অধিদপ্তরের (DGHS) এমআইএস পরিচালিত ২৪/৭ সরকারি হেল্পলাইন—ডাক্তারের পরামর্শ, হাসপাতাল তথ্য ও অ্যাম্বুলেন্স সহায়তার জন্য।',
    },
    verified: true,
    isDemo: false,
    officialSourceLabel: {
      en: 'Verified · 16263.dghs.gov.bd',
      bn: 'যাচাইকৃত · 16263.dghs.gov.bd',
    },
    officialSourceDomain: '16263.dghs.gov.bd',
    iconName: 'HeartPulse',
  },
];

/**
 * Only returns a standard `tel:` link for verified, non-demo emergency contacts.
 * Demo or unverified entries return `null` so no phone action is enabled for them.
 */
export function getSafeTelHref(contact: {
  number?: string;
  verified?: boolean;
  isDemo?: boolean;
}): string | null {
  if (!contact.verified || contact.isDemo || !contact.number) {
    return null;
  }
  const normalized = contact.number.replace(/[^0-9+]/g, '');
  if (!normalized) {
    return null;
  }
  return `tel:${normalized}`;
}

/**
 * Illustrative DEMO DATA categories showing how each mess organizes its own
 * directory inside MessMate. Contains zero real or fabricated personal phone numbers.
 */
export const MESS_DIRECTORY_CATEGORIES: MessEmergencyCategory[] = [
  {
    id: 'mess-owner',
    category: { en: 'Mess Owner', bn: 'মেস মালিক / বাড়িওয়ালা' },
    roleSummary: {
      en: 'Property owner or primary residence caretaker for urgent building decisions.',
      bn: 'জরুরি বাড়ি-সংক্রান্ত সিদ্ধান্তের জন্য মেস মালিক বা বাড়িওয়ালার যোগাযোগ।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Added by mess owner',
      bn: 'ডেমো ডেটা · মেস মালিক কর্তৃক যুক্ত',
    },
    isDemo: true,
    iconName: 'Home',
  },
  {
    id: 'mess-manager',
    category: { en: 'Mess Manager', bn: 'মেস ম্যানেজার' },
    roleSummary: {
      en: 'Active on-site manager coordinating daily operations and resident support.',
      bn: 'দৈনন্দিন মেস পরিচালনা ও সদস্যদের তাৎক্ষণিক সহায়তার দায়িত্বে থাকা ম্যানেজার।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Updated per term',
      bn: 'ডেমো ডেটা · প্রতি মাসে হালনাগাদযোগ্য',
    },
    isDemo: true,
    iconName: 'UserCog',
  },
  {
    id: 'local-doctor',
    category: { en: 'Local Doctor', bn: 'স্থানীয় চিকিৎসক' },
    roleSummary: {
      en: 'Trusted neighborhood physician or on-call clinic near the residence.',
      bn: 'মেসের আশপাশের পরিচিত চিকিৎসক বা নিকটস্থ ক্লিনিকের যোগাযোগ।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Configured per mess',
      bn: 'ডেমো ডেটা · মেস অনুযায়ী যুক্ত',
    },
    isDemo: true,
    iconName: 'Stethoscope',
  },
  {
    id: 'nearby-hospital',
    category: { en: 'Nearby Hospital', bn: 'নিকটস্থ হাসপাতাল' },
    roleSummary: {
      en: 'Closest emergency room, ambulance desk, and route guidance for the area.',
      bn: 'এলাকার নিকটতম জরুরি বিভাগ ও হাসপাতালের ঠিকানা এবং যোগাযোগ তথ্য।',
    },
    visibility: 'public',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Area-specific entry',
      bn: 'ডেমো ডেটা · এলাকাভিত্তিক তথ্য',
    },
    isDemo: true,
    iconName: 'Hospital',
  },
  {
    id: 'pharmacy',
    category: { en: 'Pharmacy', bn: 'ফার্মেসি / ওষুধের দোকান' },
    roleSummary: {
      en: 'Late-night or 24-hour neighborhood pharmacy for urgent medication needs.',
      bn: 'জরুরি ওষুধের প্রয়োজনে এলাকার নিকটস্থ বা ২৪ ঘণ্টা খোলা ফার্মেসি।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Configured per mess',
      bn: 'ডেমো ডেটা · মেস অনুযায়ী যুক্ত',
    },
    isDemo: true,
    iconName: 'Pill',
  },
  {
    id: 'electrician',
    category: { en: 'Electrician', bn: 'ইলেকট্রিশিয়ান' },
    roleSummary: {
      en: 'Verified local electrician for circuit faults, power hazards, or panel checks.',
      bn: 'বিদ্যুৎ বিভ্রাট বা শর্ট সার্কিট ঝুঁকি নিরসনে পরিচিত ইলেকট্রিশিয়ান।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Building maintenance',
      bn: 'ডেমো ডেটা · ভবন রক্ষণাবেক্ষণ',
    },
    isDemo: true,
    iconName: 'Zap',
  },
  {
    id: 'plumber',
    category: { en: 'Plumber', bn: 'প্লাম্বার / পানির মিস্ত্রি' },
    roleSummary: {
      en: 'Maintenance contact for urgent water line leaks, pump issues, or drainage.',
      bn: 'পানির লাইন লিকেজ, মোটর সমস্যা বা জরুরি প্লাম্বিং সহায়তা।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Building maintenance',
      bn: 'ডেমো ডেটা · ভবন রক্ষণাবেক্ষণ',
    },
    isDemo: true,
    iconName: 'Wrench',
  },
  {
    id: 'building-security',
    category: { en: 'Building Security', bn: 'ভবনের নিরাপত্তা প্রহরী' },
    roleSummary: {
      en: 'Main gate caretaker, night guard desk, and after-hours building entry help.',
      bn: 'মেইন গেট গার্ড, কেয়ারটেকার ও রাতের জরুরি প্রবেশ সহায়তা।',
    },
    visibility: 'member-only',
    demoPlaceholderNote: {
      en: 'DEMO DATA · Gate & caretaker',
      bn: 'ডেমো ডেটা · গেট ও কেয়ারটেকার',
    },
    isDemo: true,
    iconName: 'ShieldCheck',
  },
  {
    id: 'family-emergency',
    category: { en: 'Family Emergency Contact', bn: 'পারিবারিক জরুরি যোগাযোগ' },
    roleSummary: {
      en: 'Private guardian or next-of-kin record kept strictly off public pages.',
      bn: 'সদস্যের অভিভাবক বা পরিবারের জরুরি নম্বর—পাবলিক পেজে কখনো প্রদর্শিত হয় না।',
    },
    visibility: 'private',
    demoPlaceholderNote: {
      en: 'PRIVATE · Never shown publicly',
      bn: 'ব্যক্তিগত · পাবলিকে প্রদর্শিত নয়',
    },
    isDemo: true,
    iconName: 'HeartHandshake',
  },
];

/**
 * Six informational safety placeholders.
 * Explicitly avoids fabricating building exit locations or specific safety setups.
 */
export const SAFETY_INFORMATION_BLOCKS: SafetyInfoPlaceholder[] = [
  {
    id: 'emergency-exit',
    title: {
      en: 'Emergency Exit Information',
      bn: 'জরুরি বহির্গমন পথের তথ্য',
    },
    shortSummary: {
      en: 'Placeholder for primary staircase routes, secondary exits, and roof/gate access notes.',
      bn: 'মূল সিঁড়ি, বিকল্প বহির্গমন পথ ও ছাদ/গেট ব্যবহারের নির্দেশনার জন্য নির্ধারিত অংশ।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Each mess owner should enter the exact, verified stairwells, exit doors, and key locations for their specific building—never rely on generic templates.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: প্রতিটি মেস মালিককে নিজের ভবনের প্রকৃত সিঁড়ি, বহির্গমন দরজা ও চাবির অবস্থান সঠিকভাবে যুক্ত করতে হবে।',
    },
    isPlaceholder: true,
    iconName: 'DoorOpen',
  },
  {
    id: 'fire-safety',
    title: {
      en: 'Fire Safety',
      bn: 'অগ্নি নিরাপত্তা নির্দেশিকা',
    },
    shortSummary: {
      en: 'Placeholder for fire extinguisher placement, gas shut-off valve guidance, and alarm steps.',
      bn: 'অগ্নিনির্বাপক যন্ত্রের অবস্থান, গ্যাস লাইন বন্ধের নিয়ম ও জরুরি সতর্কতা ধাপ।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Mess owners should document actual fire extinguisher locations, kitchen gas valve shut-off instructions, and electrical main breaker access for their residence.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: মেস মালিককে নিজস্ব রান্নাঘরের গ্যাস ভালভ, মেইন সুইচ ও ফায়ার এক্সটিংগুইশারের সঠিক অবস্থান এখানে যুক্ত করতে হবে।',
    },
    isPlaceholder: true,
    iconName: 'Flame',
  },
  {
    id: 'first-aid',
    title: {
      en: 'First Aid Information',
      bn: 'প্রাথমিক চিকিৎসা (ফার্স্ট এইড)',
    },
    shortSummary: {
      en: 'Placeholder for shared first-aid kit storage location and basic emergency response notes.',
      bn: 'মেসের ফার্স্ট এইড বক্সের অবস্থান এবং প্রাথমিক চিকিৎসা সামগ্রীর তালিকা।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Specify where the shared first-aid kit is stored inside the mess, who checks replenishment, and which nearby clinic handles urgent care.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: মেসের কোথায় ফার্স্ট এইড বক্স রাখা আছে এবং প্রাথমিক সহায়তার জন্য কাকে জানাতে হবে তা মেস মালিক যুক্ত করবেন।',
    },
    isPlaceholder: true,
    iconName: 'Cross',
  },
  {
    id: 'assembly-point',
    title: {
      en: 'Assembly Point',
      bn: 'নিরাপদ একত্রিত হওয়ার স্থান',
    },
    shortSummary: {
      en: 'Placeholder for the designated safe open space outside the building after evacuation.',
      bn: 'জরুরি অবস্থায় ভবন থেকে বের হওয়ার পর নিরাপদ খোলা স্থানে একত্রিত হওয়ার নির্দেশনা।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Mess owners should specify an accurate, safe open gathering area outside their building so residents can confirm everyone is accounted for.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: ভবনের বাইরে নিরাপদ কোন খোলা জায়গায় সবাই একত্রিত হবেন তা ভবন অনুযায়ী মেস মালিক নির্ধারণ করবেন।',
    },
    isPlaceholder: true,
    iconName: 'MapPin',
  },
  {
    id: 'building-safety',
    title: {
      en: 'Building Safety Instructions',
      bn: 'ভবন নিরাপত্তা নির্দেশাবলি',
    },
    shortSummary: {
      en: 'Placeholder for main gate hours, visitor sign-in rules, generator safety, and utility protocols.',
      bn: 'মেইন গেটের সময়সূচি, অতিথি প্রবেশ নিয়ম এবং বিদ্যুৎ-গ্যাস নিরাপত্তা বিধি।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Add house-specific gate locking schedules, lift/generator precautions, and water or gas shut-off contacts verified with the building caretaker.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: বাড়িওয়ালা ও কেয়ারটেকারের সাথে মিলিয়ে ভবনের গেট, লিফট, জেনারেটর ও ইউটিলিটি নিরাপত্তা বিধি যুক্ত করুন।',
    },
    isPlaceholder: true,
    iconName: 'Building2',
  },
  {
    id: 'safety-notices',
    title: {
      en: 'Important Safety Notices',
      bn: 'গুরুত্বপূর্ণ নিরাপত্তা নোটিশ',
    },
    shortSummary: {
      en: 'Placeholder for pinned maintenance alerts, electrical inspections, and seasonal advisories.',
      bn: 'রক্ষণাবেক্ষণ সতর্কতা, বৈদ্যুতিক পরীক্ষা ও জরুরি নিরাপত্তা ঘোষণার স্থান।',
    },
    ownerGuidance: {
      en: 'Informational placeholder: Use pinned safety notices in your mess workspace for timely updates such as gas line maintenance, water tank cleaning, or severe weather preparedness.',
      bn: 'তথ্যমূলক প্লেসহোল্ডার: গ্যাস লাইন মেরামত, পানির ট্যাংক পরিষ্কার বা আবহাওয়া সতর্কতার মতো জরুরি নোটিশ এখানে পিন করে রাখা যাবে।',
    },
    isPlaceholder: true,
    iconName: 'BellRing',
  },
];

/**
 * Planned Public vs. Private Safety Information Boundaries
 */
export const SAFETY_PRIVACY_SCOPES: SafetyPrivacyScope[] = [
  {
    id: 'public-emergency',
    scope: 'public',
    title: {
      en: 'Public Emergency Contacts',
      bn: 'পাবলিক জরুরি যোগাযোগ',
    },
    description: {
      en: 'Verified national emergency hotlines and approved public residence safety summaries.',
      bn: 'যাচাইকৃত জাতীয় জরুরি হটলাইন এবং অনুমোদিত সাধারণ নিরাপত্তা তথ্য।',
    },
    badgeLabel: { en: 'Public Access', bn: 'সবার জন্য উন্মুক্ত' },
    iconName: 'Globe',
  },
  {
    id: 'member-only-contacts',
    scope: 'member-only',
    title: {
      en: 'Member-Only Emergency Contacts',
      bn: 'শুধুমাত্র সদস্যদের জরুরি ডিরেক্টরি',
    },
    description: {
      en: 'Mess manager, local doctor, electrician, plumber, and building security visible only to active members.',
      bn: 'মেস ম্যানেজার, ডাক্তার, ইলেকট্রিশিয়ান, প্লাম্বার ও প্রহরীর নম্বর কেবল সক্রিয় সদস্যদের জন্য।',
    },
    badgeLabel: { en: 'Member-Only', bn: 'কেবল সদস্য' },
    iconName: 'Users',
  },
  {
    id: 'private-family-info',
    scope: 'private',
    title: {
      en: 'Private Family Contact Information',
      bn: 'ব্যক্তিগত পারিবারিক জরুরি তথ্য',
    },
    description: {
      en: 'Guardian and family ICE contacts kept strictly private—never exposed on the public website.',
      bn: 'অভিভাবক ও পরিবারের জরুরি নম্বর সম্পূর্ণ গোপন থাকে—পাবলিক ওয়েবসাইটে কখনো প্রদর্শিত হয় না।',
    },
    badgeLabel: { en: 'Private & Restricted', bn: 'ব্যক্তিগত ও সংরক্ষিত' },
    iconName: 'Lock',
  },
  {
    id: 'mess-safety-instructions',
    scope: 'mess-specific',
    title: {
      en: 'Mess-Specific Safety Instructions',
      bn: 'মেস-ভিত্তিক নিরাপত্তা নির্দেশনা',
    },
    description: {
      en: 'Building-accurate exits, fire equipment placement, assembly points, and pinned notices managed by each mess.',
      bn: 'প্রতিটি মেস মালিকের যুক্ত করা ভবন-নির্দিষ্ট বহির্গমন পথ, অগ্নি নিরাপত্তা ও জরুরি নোটিশ।',
    },
    badgeLabel: { en: 'Mess Configured', bn: 'মেস নির্ধারিত' },
    iconName: 'FileText',
  },
];
