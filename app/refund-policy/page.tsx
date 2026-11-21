import type { Metadata } from 'next';
import { PlaceholderRouteView } from '@/components/layout/PlaceholderRouteView';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Placeholder Refund Policy page outlining MessMate trial transparency and upcoming billing terms.',
};

export default function RefundPolicyPage() {
  return (
    <PlaceholderRouteView
      icon="receipt"
      kicker={{ en: 'Legal Placeholder', bn: 'আইনি তথ্য (প্লেসহোল্ডার)' }}
      title={{
        en: 'Refund Policy — To Be Published',
        bn: 'রিফান্ড নীতি — শীঘ্রই প্রকাশিত হবে',
      }}
      description={{
        en: 'MessMate does not currently process live payments on this public website. Full billing, cancellation, and refund terms will be published before paid subscriptions are enabled.',
        bn: 'এই পাবলিক ওয়েবসাইটে বর্তমানে কোনো লাইভ পেমেন্ট প্রক্রিয়া চালু নেই। পেইড সাবস্ক্রিপশন চালু হওয়ার আগে পূর্ণাঙ্গ বিলিং, বাতিলকরণ এবং রিফান্ড নীতি প্রকাশ করা হবে।',
      }}
      highlights={[
        {
          en: 'Starter Plan offers an exact 7-day free trial before any ৳99/month subscription decision.',
          bn: 'স্টার্টার প্ল্যানে ৳৯৯/মাস সাবস্ক্রিপশনের আগে ঠিক ৭ দিনের ফ্রি ট্রায়াল সুবিধা রয়েছে।',
        },
        {
          en: 'No automatic payment or automatic renewal is assumed without explicit customer consent.',
          bn: 'গ্রাহকের স্পষ্ট সম্মতি ছাড়া কোনো অটোমেটিক পেমেন্ট বা রিনিউয়াল করা হয় না।',
        },
        {
          en: 'Domain registration, renewal, and third-party service charges may be billed separately under their respective terms.',
          bn: 'ডোমেইন রেজিস্ট্রেশন, রিনিউয়াল এবং থার্ড-পার্টি সেবার চার্জ আলাদাভাবে প্রযোজ্য হতে পারে।',
        },
      ]}
      primaryCta={{
        label: { en: 'Review Pricing Details', bn: 'মূল্য তালিকা দেখুন' },
        href: '/#pricing',
      }}
      secondaryCta={{
        label: { en: 'Back to Homepage', bn: 'হোমপেজে ফিরুন' },
        href: '/',
      }}
    />
  );
}
