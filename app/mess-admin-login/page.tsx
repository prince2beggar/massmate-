import type { Metadata } from 'next';
import { PlaceholderRouteView } from '@/components/layout/PlaceholderRouteView';

export const metadata: Metadata = {
  title: 'Mess Admin Login',
  description:
    'Placeholder route for the upcoming MessMate Mess Admin workspace sign-in.',
};

export default function MessAdminLoginPage() {
  return (
    <PlaceholderRouteView
      icon="lock"
      kicker={{ en: 'Platform Access', bn: 'প্ল্যাটফর্ম অ্যাক্সেস' }}
      title={{
        en: 'Mess Admin Login — Coming Soon',
        bn: 'মেস অ্যাডমিন লগইন — শীঘ্রই আসছে',
      }}
      description={{
        en: 'This public website does not include authentication yet. The Mess Admin workspace is planned to help managers organize members, meals, bazar expenses, rent, notices, and rooms from one place.',
        bn: 'এই পাবলিক ওয়েবসাইটে এখনো অথেনটিকেশন যুক্ত করা হয়নি। পরিকল্পিত মেস অ্যাডমিন ওয়ার্কস্পেস ম্যানেজারদের সদস্য, মিল, বাজার খরচ, বাসা ভাড়া ও নোটিশ এক জায়গায় পরিচালনায় সহায়তা করবে।',
      }}
      highlights={[
        {
          en: 'Role-based workspace access designed for mess managers and property operators.',
          bn: 'মেস ম্যানেজার ও প্রপার্টি অপারেটরদের জন্য রোল-ভিত্তিক ওয়ার্কস্পেস অ্যাক্সেস।',
        },
        {
          en: 'Starter Plan includes a 7-day free trial followed by ৳99/month (no automatic renewal without consent).',
          bn: 'স্টার্টার প্ল্যানে ৭ দিনের ফ্রি ট্রায়াল এবং পরবর্তীতে মাসিক ৳৯৯ সাবস্ক্রিপশন।',
        },
        {
          en: 'Need multi-mess or hostel onboarding? Explore our Customized Business Plan inquiry preview.',
          bn: 'একাধিক মেস বা হোস্টেলের জন্য কাস্টমাইজড বিজনেস প্ল্যান ইনকোয়ারি প্রিভিউ দেখুন।',
        },
      ]}
      primaryCta={{
        label: { en: 'Go to Contact Section', bn: 'যোগাযোগ সেকশনে যান' },
        href: '/#contact',
      }}
      secondaryCta={{
        label: { en: 'Back to Homepage', bn: 'হোমপেজে ফিরুন' },
        href: '/',
      }}
    />
  );
}
