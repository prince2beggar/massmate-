export type FaqCategory =
  | 'general'
  | 'subscription-pricing'
  | 'features-management'
  | 'security-support';

export interface FaqCategoryMeta {
  id: FaqCategory;
  label: { en: string; bn: string };
  description: { en: string; bn: string };
}

export interface FaqItem {
  id: string;
  number: string;
  category: FaqCategory;
  featuredOnHome?: boolean;
  question: { en: string; bn: string };
  answer: { en: string; bn: string };
}

export const FAQ_CATEGORY_GROUPS: FaqCategoryMeta[] = [
  {
    id: 'general',
    label: { en: 'General Questions', bn: 'সাধারণ প্রশ্নাবলি' },
    description: {
      en: 'Overview of what MessMate is and who it is built for.',
      bn: 'MessMate কী এবং কারা এটি ব্যবহার করতে পারবেন তার সংক্ষিপ্ত ধারণা।',
    },
  },
  {
    id: 'subscription-pricing',
    label: { en: 'Subscription & Pricing', bn: 'সাবস্ক্রিপশন ও মূল্য' },
    description: {
      en: 'Details on the 7-day trial, Starter pricing, custom plans, and third-party charges.',
      bn: '৭ দিনের ফ্রি ট্রায়াল, স্টার্টার প্ল্যান, কাস্টম প্ল্যান ও ডোমেইন চার্জ সংক্রান্ত তথ্য।',
    },
  },
  {
    id: 'features-management',
    label: { en: 'Features & Management', bn: 'ফিচার ও ব্যবস্থাপনা' },
    description: {
      en: 'How meal tracking, bazar records, member views, and mess websites are structured.',
      bn: 'মিল ট্র্যাকিং, বাজার হিসাব, সদস্য পোর্টাল এবং মেস ওয়েবসাইট কাস্টমাইজেশন।',
    },
  },
  {
    id: 'security-support',
    label: { en: 'Security & Support', bn: 'নিরাপত্তা ও সহায়তা' },
    description: {
      en: 'Privacy boundaries, tenant isolation, and how to reach the MessMate team.',
      bn: 'তথ্যের গোপনীয়তা, রোলভিত্তিক অ্যাক্সেস এবং যোগাযোগের মাধ্যম।',
    },
  },
];

export const FAQ_CATEGORIES: Array<{
  id: FaqCategory | 'all';
  label: { en: string; bn: string };
}> = [
  { id: 'all', label: { en: 'All Questions', bn: 'সব প্রশ্ন' } },
  ...FAQ_CATEGORY_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
  })),
];

export const FAQ_ITEMS: FaqItem[] = [
  // General Questions
  {
    id: 'faq-q1',
    number: 'Q1',
    category: 'general',
    featuredOnHome: true,
    question: {
      en: 'What is MessMate?',
      bn: 'MessMate কী?',
    },
    answer: {
      en: 'MessMate is a platform designed to organize mess management, including members, meals, bazar expenses, rent, bills and everyday activities.',
      bn: 'MessMate হলো একটি প্ল্যাটফর্ম যা সদস্য, মিল, বাজার খরচ, বাসা ভাড়া, বিল এবং দৈনন্দিন মেস কার্যক্রম সুশৃঙ্খলভাবে পরিচালনার জন্য ডিজাইন করা হয়েছে।',
    },
  },
  {
    id: 'faq-q2',
    number: 'Q2',
    category: 'general',
    featuredOnHome: true,
    question: {
      en: 'Who can use MessMate?',
      bn: 'কারা MessMate ব্যবহার করতে পারবেন?',
    },
    answer: {
      en: 'Students, bachelors, job holders, shared apartments, hostels and accommodation businesses can use MessMate.',
      bn: 'শিক্ষার্থী, ব্যাচেলর, চাকরিজীবী, শেয়ার্ড অ্যাপার্টমেন্ট, হোস্টেল এবং আবাসন ব্যবসাগুলো MessMate ব্যবহার করতে পারবেন।',
    },
  },
  {
    id: 'faq-q3',
    number: 'Q3',
    category: 'general',
    featuredOnHome: true,
    question: {
      en: 'Do I need technical knowledge to use MessMate?',
      bn: 'MessMate ব্যবহার করার জন্য কি কারিগরি (টেকনিক্যাল) জ্ঞান প্রয়োজন?',
    },
    answer: {
      en: 'No. MessMate is designed to provide a simple and user-friendly management experience.',
      bn: 'না। MessMate সহজ ও ব্যবহারবান্ধব মেস ব্যবস্থাপনার অভিজ্ঞতা দেওয়ার জন্য ডিজাইন করা হয়েছে।',
    },
  },

  // Subscription & Pricing
  {
    id: 'faq-q4',
    number: 'Q4',
    category: 'subscription-pricing',
    featuredOnHome: true,
    question: {
      en: 'Does MessMate offer a free trial?',
      bn: 'MessMate কি ফ্রি ট্রায়াল অফার করে?',
    },
    answer: {
      en: 'Yes. The Starter plan includes a 7-day free trial. After the trial, the subscription price is ৳99 per month.',
      bn: 'হ্যাঁ। স্টার্টার প্ল্যানে ৭ দিনের ফ্রি ট্রায়াল রয়েছে। ট্রায়াল শেষে মাসিক সাবস্ক্রিপশন মূল্য ৳৯৯।',
    },
  },
  {
    id: 'faq-q5',
    number: 'Q5',
    category: 'subscription-pricing',
    featuredOnHome: true,
    question: {
      en: 'Can I manage multiple messes?',
      bn: 'আমি কি একাধিক মেস পরিচালনা করতে পারব?',
    },
    answer: {
      en: 'Multiple mess management is intended for the Customized Business Plan. Contact the team to discuss your requirements.',
      bn: 'একাধিক মেস পরিচালনার সুবিধা কাস্টমাইজড বিজনেস প্ল্যানের জন্য নির্ধারিত। আপনার চাহিদা নিয়ে আলোচনা করতে আমাদের টিমের সাথে যোগাযোগ করুন।',
    },
  },
  {
    id: 'faq-q6',
    number: 'Q6',
    category: 'subscription-pricing',
    featuredOnHome: true,
    question: {
      en: 'Can I get a customized subscription plan?',
      bn: 'আমি কি কাস্টমাইজড সাবস্ক্রিপশন প্ল্যান নিতে পারব?',
    },
    answer: {
      en: 'Yes. Businesses managing multiple messes, hostels or accommodation properties can request customized pricing.',
      bn: 'হ্যাঁ। একাধিক মেস, হোস্টেল বা আবাসন প্রপার্টি পরিচালনাকারী প্রতিষ্ঠানগুলো কাস্টমাইজড প্রাইসিংয়ের জন্য অনুরোধ করতে পারবেন।',
    },
  },
  {
    id: 'faq-q7',
    number: 'Q7',
    category: 'subscription-pricing',
    featuredOnHome: true,
    question: {
      en: 'Are domain registration and renewal included in the subscription?',
      bn: 'ডোমেইন রেজিস্ট্রেশন ও রিনিউয়াল কি সাবস্ক্রিপশনের অন্তর্ভুক্ত?',
    },
    answer: {
      en: 'Domain registration, renewal and third-party service charges may be billed separately.',
      bn: 'ডোমেইন রেজিস্ট্রেশন, রিনিউয়াল এবং থার্ড-পার্টি সেবার চার্জ আলাদাভাবে বিল হতে পারে।',
    },
  },

  // Features & Management
  {
    id: 'faq-q8',
    number: 'Q8',
    category: 'features-management',
    featuredOnHome: true,
    question: {
      en: 'Can I manage meals and bazar expenses?',
      bn: 'আমি কি মিল এবং বাজার খরচ পরিচালনা করতে পারব?',
    },
    answer: {
      en: 'Yes. MessMate is designed to organize meal tracking, bazar records and related expenses.',
      bn: 'হ্যাঁ। MessMate মিল ট্র্যাকিং, বাজারের রেকর্ড এবং সংশ্লিষ্ট খরচগুলো গুছিয়ে রাখার জন্য ডিজাইন করা হয়েছে।',
    },
  },
  {
    id: 'faq-q9',
    number: 'Q9',
    category: 'features-management',
    featuredOnHome: true,
    question: {
      en: 'Can members see their own financial statements?',
      bn: 'সদস্যরা কি নিজেদের আর্থিক হিসাব (স্টেটমেন্ট) দেখতে পারবেন?',
    },
    answer: {
      en: 'The planned member portal will allow members to view their own financial information, subject to appropriate access permissions.',
      bn: 'পরিকল্পিত মেম্বার পোর্টালে উপযুক্ত অ্যাক্সেস পারমিশন সাপেক্ষে সদস্যরা নিজেদের আর্থিক তথ্য দেখতে পারবেন।',
    },
  },
  {
    id: 'faq-q10',
    number: 'Q10',
    category: 'features-management',
    featuredOnHome: true,
    question: {
      en: 'Can I customize my mess website?',
      bn: 'আমি কি আমার মেসের ওয়েবসাইট কাস্টমাইজ করতে পারব?',
    },
    answer: {
      en: 'MessMate is designed to support mess-specific branding and website customization, depending on the available plan features.',
      bn: 'প্ল্যানের ফিচার অনুযায়ী মেস-ভিত্তিক ব্র্যান্ডিং এবং ওয়েবসাইট কাস্টমাইজেশন সাপোর্ট করার জন্য MessMate ডিজাইন করা হয়েছে।',
    },
  },

  // Security & Support
  {
    id: 'faq-q11',
    number: 'Q11',
    category: 'security-support',
    featuredOnHome: true,
    question: {
      en: 'Is member information private?',
      bn: 'সদস্যদের তথ্য কি ব্যক্তিগত ও নিরাপদ থাকবে?',
    },
    answer: {
      en: 'MessMate is designed with role-based access and tenant data isolation. Access to private information should be limited to authorized users.',
      bn: 'MessMate রোল-ভিত্তিক অ্যাক্সেস এবং টেন্যান্ট ডেটা আইসোলেশন কাঠামোতে ডিজাইন করা হয়েছে। ব্যক্তিগত তথ্যে অ্যাক্সেস শুধুমাত্র অনুমোদিত ব্যবহারকারীদের মধ্যে সীমাবদ্ধ থাকবে।',
    },
  },
  {
    id: 'faq-q12',
    number: 'Q12',
    category: 'security-support',
    featuredOnHome: true,
    question: {
      en: 'How can I contact MessMate?',
      bn: 'আমি কীভাবে MessMate-এর সাথে যোগাযোগ করতে পারি?',
    },
    answer: {
      en: 'Visitors can use the Contact section to submit an inquiry once backend contact submission is available.',
      bn: 'ব্যাকএন্ড কন্টাক্ট সাবমিশন চালু হলে ভিজিটররা যোগাযোগ (Contact) সেকশনের মাধ্যমে সরাসরি ইনকোয়ারি পাঠাতে পারবেন।',
    },
  },
];
