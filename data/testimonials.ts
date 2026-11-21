export interface TestimonialItem {
  id: string;
  name: { en: string; bn: string };
  role: { en: string; bn: string };
  organization: { en: string; bn: string };
  segment: { en: string; bn: string };
  outcomeMetric: { en: string; bn: string };
  quote: { en: string; bn: string };
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: { en: 'Mahmudul Hasan', bn: 'মাহমুদুল হাসান' },
    role: { en: 'Mess Manager · 22 Members', bn: 'মেস ম্যানেজার · ২২ সদস্য' },
    organization: { en: 'Nilkhet Scholars Mess, Dhaka', bn: 'নীলক্ষেত স্কলার্স মেস, ঢাকা' },
    segment: { en: 'Student Mess', bn: 'স্টুডেন্ট মেস' },
    outcomeMetric: {
      en: 'Cut monthly closing from 6 hours to 12 minutes',
      bn: 'মাসিক হিসাবের সময় ৬ ঘণ্টা থেকে ১২ মিনিটে নেমেছে',
    },
    quote: {
      en: 'Before MessMate, month-end meal calculations meant a full evening with notebooks and endless questions in our group chat. Now every member sees the live meal rate and exact due or refund before the 1st.',
      bn: 'MessMate ব্যবহারের আগে মাসের শেষে খাতা-কলম নিয়ে পুরো সন্ধ্যা পার হয়ে যেত আর গ্রুপে নানা প্রশ্ন আসত। এখন প্রতিটি সদস্য ১ তারিখের আগেই লাইভ মিল রেট ও নিখুঁত ব্যালেন্স দেখতে পান।',
    },
  },
  {
    id: 't2',
    name: { en: 'Nusrat Jahan Chowdhury', bn: 'নুসরাত জাহান চৌধুরী' },
    role: { en: 'Flat Coordinator · 8 Members', bn: 'ফ্ল্যাট কো-অর্ডিনেটর · ৮ সদস্য' },
    organization: { en: 'Lakeview Shared Apartment, Dhanmondi', bn: 'লেকভিউ শেয়ার্ড অ্যাপার্টমেন্ট, ধানমন্ডি' },
    segment: { en: 'Shared Apartment', bn: 'শেয়ার্ড অ্যাপার্টমেন্ট' },
    outcomeMetric: {
      en: 'Zero utility or meal billing misunderstandings in 9 months',
      bn: 'গত ৯ মাসে বিল বা মিল নিয়ে কোনো ভুল বোঝাবুঝি হয়নি',
    },
    quote: {
      en: 'Our flat has three room sizes with different rents plus shared maid, Wi-Fi, and dinner costs. MessMate splits everything cleanly, and having our landlord and nearest hospital contacts pinned gives everyone peace of mind.',
      bn: 'আমাদের ফ্ল্যাটে তিন ধরনের রুম ভাড়া এবং শেয়ার্ড ইউটিলিটি ও খাবারের খরচ আলাদা। MessMate সব নিখুঁতভাবে ভাগ করে দেয়, আর জরুরি নম্বরগুলো পিন থাকায় সবাই নিশ্চিন্ত থাকি।',
    },
  },
  {
    id: 't3',
    name: { en: 'Tariqul Islam', bn: 'তারিকুল ইসলাম' },
    role: { en: 'Residence Owner · 3 Floors (48 Seats)', bn: 'আবাসন মালিক · ৩ ফ্লোর (৪৮ সিট)' },
    organization: { en: 'Northgate Professionals Residence, Uttara', bn: 'নর্থগেট প্রফেশনালস রেসিডেন্স, উত্তরা' },
    segment: { en: 'Job Holder Mess', bn: 'চাকরিজীবী মেস' },
    outcomeMetric: {
      en: 'Filled 5 vacant seats in 9 days without broker fees',
      bn: 'দালাল ছাড়াই ৯ দিনে ৫টি খালি সিট ভাড়া হয়েছে',
    },
    quote: {
      en: 'Publishing our vacant rooms through our branded MessMate page brought qualified job-holder inquiries directly to our manager. Both our tenants and floor managers love switching effortlessly between Bangla and English.',
      bn: 'MessMate-এর ব্র্যান্ডেড পেজে খালি রুমের বিজ্ঞাপন দেওয়ায় সরাসরি ভালো চাকরিজীবী ভাড়াটিয়া পেয়েছি। বাংলা ও ইংরেজি দুটো ভাষাই থাকায় সবাই স্বাচ্ছন্দ্যে ব্যবহার করে।',
    },
  },
];
