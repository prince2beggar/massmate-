import type { Metadata } from 'next';
import { PlaceholderRouteView } from '@/components/layout/PlaceholderRouteView';

export const metadata: Metadata = {
  title: 'Emergency & Safety Guide',
  description:
    'Placeholder route for the upcoming dedicated MessMate Emergency & Safety guide page.',
};

export default function EmergencySafetyGuidePage() {
  return (
    <PlaceholderRouteView
      icon="shield"
      kicker={{ en: 'Safety Resource', bn: 'নিরাপত্তা নির্দেশিকা' }}
      title={{
        en: 'Emergency & Safety Guide — Coming Soon',
        bn: 'জরুরি ও নিরাপত্তা নির্দেশিকা — শীঘ্রই আসছে',
      }}
      description={{
        en: 'The dedicated Emergency & Safety documentation page is planned for an upcoming phase. You can view Bangladesh national emergency contacts and mess directory previews directly on the homepage.',
        bn: 'পূর্ণাঙ্গ জরুরি ও নিরাপত্তা নির্দেশিকা পেজটি পরবর্তী ধাপে যুক্ত করা হবে। আপনি এখনই হোমপেজে বাংলাদেশের জাতীয় জরুরি হটলাইন এবং মেস ডিরেক্টরি প্রিভিউ দেখতে পারবেন।',
      }}
      highlights={[
        {
          en: 'Bangladesh National Emergency Service: 999 · Fire Service & Civil Defence: 102 · Health Batayon: 16263.',
          bn: 'জাতীয় জরুরি সেবা: ৯৯৯ · ফায়ার সার্ভিস ও সিভিল ডিফেন্স: ১০২ · স্বাস্থ্য বাতায়ন: ১৬২৬৩।',
        },
        {
          en: 'Mess-specific contacts and private family ICE details are designed to stay protected inside authorized mess workspaces.',
          bn: 'মেস-ভিত্তিক যোগাযোগ এবং ব্যক্তিগত পারিবারিক জরুরি তথ্য অনুমোদিত ওয়ার্কস্পেসের ভেতর সুরক্ষিত রাখার জন্য ডিজাইন করা হয়েছে।',
        },
        {
          en: 'No personal member phone numbers are exposed on the public website.',
          bn: 'পাবলিক ওয়েবসাইটে কোনো সদস্যের ব্যক্তিগত ফোন নম্বর প্রকাশ করা হয় না।',
        },
      ]}
      primaryCta={{
        label: {
          en: 'View Emergency & Safety Section',
          bn: 'জরুরি ও নিরাপত্তা সেকশন দেখুন',
        },
        href: '/#safety',
      }}
      secondaryCta={{
        label: { en: 'Back to Homepage', bn: 'হোমপেজে ফিরুন' },
        href: '/',
      }}
    />
  );
}
