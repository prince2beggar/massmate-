export type WorkflowStepIconName =
  | 'Building2'
  | 'UserPlus'
  | 'ClipboardList'
  | 'BarChart3';

export interface WorkflowStepItem {
  id: string;
  number: string;
  iconName: WorkflowStepIconName;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
}

export interface DemoRentalShowcaseItem {
  id: string;
  title: { en: string; bn: string };
  location: { en: string; bn: string };
  rentBdt: number;
  rentDisplay: { en: string; bn: string };
  roomType: { en: string; bn: string };
  facilities: { en: string[]; bn: string[] };
  imageSrc: string;
  imageAlt: { en: string; bn: string };
  demoNote: { en: string; bn: string };
  isDemoData: true;
}

export const HOW_IT_WORKS_STEPS: readonly WorkflowStepItem[] = [
  {
    id: 'create-mess',
    number: '01',
    iconName: 'Building2',
    title: {
      en: 'Create Your Mess',
      bn: 'আপনার মেস তৈরি করুন',
    },
    description: {
      en: 'Register your mess and set up its basic information, address and preferences.',
      bn: 'আপনার মেস নিবন্ধন করুন এবং মৌলিক তথ্য, ঠিকানা ও প্রয়োজনীয় নিয়মাবলি সেটআপ করুন।',
    },
  },
  {
    id: 'invite-members',
    number: '02',
    iconName: 'UserPlus',
    title: {
      en: 'Invite Your Members',
      bn: 'সদস্যদের আমন্ত্রণ জানান',
    },
    description: {
      en: 'Add members, assign roles and organize room information.',
      bn: 'সদস্য যুক্ত করুন, ভূমিকা নির্ধারণ করুন এবং রুমের তথ্য সুশৃঙ্খলভাবে সাজান।',
    },
  },
  {
    id: 'manage-daily',
    number: '03',
    iconName: 'ClipboardList',
    title: {
      en: 'Manage Daily Activities',
      bn: 'দৈনন্দিন কার্যক্রম পরিচালনা করুন',
    },
    description: {
      en: 'Track meals, bazar expenses, rent, bills and everyday activities.',
      bn: 'মিল, বাজার খরচ, বাসা ভাড়া, ইউটিলিটি বিল এবং প্রতিদিনের কার্যক্রম সহজেই ট্র্যাক করুন।',
    },
  },
  {
    id: 'stay-organized',
    number: '04',
    iconName: 'BarChart3',
    title: {
      en: 'Stay Organized',
      bn: 'সবসময় গুছিয়ে থাকুন',
    },
    description: {
      en: 'View monthly statements, track payments, receive notices and understand your mess finances.',
      bn: 'মাসিক স্টেটমেন্ট দেখুন, পেমেন্ট ট্র্যাক করুন, নোটিশ পান এবং মেসের হিসাব স্পষ্টভাবে বুঝুন।',
    },
  },
] as const;

export const DEMO_RENTAL_SHOWCASE_ITEMS: readonly DemoRentalShowcaseItem[] = [
  {
    id: 'demo-student-shared-uttara',
    title: {
      en: 'Student Shared Room',
      bn: 'স্টুডেন্ট শেয়ার্ড রুম',
    },
    location: {
      en: 'Uttara, Dhaka',
      bn: 'উত্তরা, ঢাকা',
    },
    rentBdt: 3500,
    rentDisplay: {
      en: '৳3,500',
      bn: '৳৩,৫০০',
    },
    roomType: {
      en: 'Shared room',
      bn: 'শেয়ার্ড রুম',
    },
    facilities: {
      en: ['WiFi', 'Bed', 'Study Table'],
      bn: ['ওয়াই-ফাই', 'বিছানা', 'পড়ার টেবিল'],
    },
    imageSrc: '/images/rental-uttara.jpg',
    imageAlt: {
      en: 'Illustrative demo image of a student shared room in Uttara, Dhaka',
      bn: 'উত্তরা, ঢাকায় স্টুডেন্ট শেয়ার্ড রুমের ডেমো ছবি',
    },
    demoNote: {
      en: 'Sample listing illustrating how MessMate displays student shared rooms, rent breakdown, and basic facilities.',
      bn: 'MessMate-এ স্টুডেন্ট শেয়ার্ড রুম, ভাড়া এবং সুবিধাসমূহ কীভাবে দেখানো হয় তার একটি নমুনা।',
    },
    isDemoData: true,
  },
  {
    id: 'demo-private-room-mirpur',
    title: {
      en: 'Private Room',
      bn: 'প্রাইভেট রুম',
    },
    location: {
      en: 'Mirpur, Dhaka',
      bn: 'মিরপুর, ঢাকা',
    },
    rentBdt: 6000,
    rentDisplay: {
      en: '৳6,000',
      bn: '৳৬,০০০',
    },
    roomType: {
      en: 'Private room',
      bn: 'প্রাইভেট রুম',
    },
    facilities: {
      en: ['WiFi', 'Attached Bathroom', 'Bed'],
      bn: ['ওয়াই-ফাই', 'অ্যাটাচড বাথরুম', 'বিছানা'],
    },
    imageSrc: '/images/rental-mirpur.jpg',
    imageAlt: {
      en: 'Illustrative demo image of a private room in Mirpur, Dhaka',
      bn: 'মিরপুর, ঢাকায় প্রাইভেট রুমের ডেমো ছবি',
    },
    demoNote: {
      en: 'Sample listing illustrating how private single rooms with attached bathrooms can be presented for prospective residents.',
      bn: 'অ্যাটাচড বাথরুমসহ প্রাইভেট সিঙ্গেল রুম কীভাবে প্রদর্শিত হয় তার একটি নমুনা।',
    },
    isDemoData: true,
  },
  {
    id: 'demo-bachelor-apartment-badda',
    title: {
      en: 'Bachelor Shared Apartment',
      bn: 'ব্যাচেলর শেয়ার্ড অ্যাপার্টমেন্ট',
    },
    location: {
      en: 'Badda, Dhaka',
      bn: 'বাড্ডা, ঢাকা',
    },
    rentBdt: 4500,
    rentDisplay: {
      en: '৳4,500',
      bn: '৳৪,৫০০',
    },
    roomType: {
      en: 'Shared apartment',
      bn: 'শেয়ার্ড অ্যাপার্টমেন্ট',
    },
    facilities: {
      en: ['WiFi', 'Kitchen', 'Furniture'],
      bn: ['ওয়াই-ফাই', 'রান্নাঘর', 'ফার্নিচার'],
    },
    imageSrc: '/images/rental-bashundhara.jpg',
    imageAlt: {
      en: 'Illustrative demo image of a bachelor shared apartment in Badda, Dhaka',
      bn: 'বাড্ডা, ঢাকায় ব্যাচেলর শেয়ার্ড অ্যাপার্টমেন্টের ডেমো ছবি',
    },
    demoNote: {
      en: 'Sample listing illustrating shared apartment spaces with kitchen and common furniture details.',
      bn: 'রান্নাঘর ও প্রয়োজনীয় ফার্নিচারসহ শেয়ার্ড অ্যাপার্টমেন্ট লিস্টিংয়ের একটি নমুনা।',
    },
    isDemoData: true,
  },
] as const;
