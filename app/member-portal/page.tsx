import type { Metadata } from 'next';
import { PlaceholderRouteView } from '@/components/layout/PlaceholderRouteView';

export const metadata: Metadata = {
  title: 'Member Portal',
  description:
    'Placeholder route for the planned MessMate resident and member portal.',
};

export default function MemberPortalPage() {
  return (
    <PlaceholderRouteView
      icon="users"
      kicker={{ en: 'Resident Access', bn: 'সদস্য অ্যাক্সেস' }}
      title={{
        en: 'Member Portal — Planned Feature',
        bn: 'মেম্বার পোর্টাল — পরিকল্পিত ফিচার',
      }}
      description={{
        en: 'The planned Member Portal will allow authorized mess members to review their own meal counts, bazar share, rent statements, notices, and mess emergency contacts.',
        bn: 'পরিকল্পিত মেম্বার পোর্টালে অনুমোদিত মেস সদস্যরা নিজেদের মিল হিসাব, বাজার শেয়ার, বাসা ভাড়া স্টেটমেন্ট, নোটিশ এবং জরুরি যোগাযোগ তথ্য দেখতে পারবেন।',
      }}
      highlights={[
        {
          en: 'Scoped to individual member records with role-based privacy and tenant data isolation.',
          bn: 'রোল-ভিত্তিক গোপনীয়তা ও টেন্যান্ট ডেটা আইসোলেশনের মাধ্যমে সদস্যদের ব্যক্তিগত তথ্য সুরক্ষা।',
        },
        {
          en: 'Designed for transparent monthly meal and bill summaries without paper spreadsheets.',
          bn: 'কাগজের খাতা ছাড়াই স্বচ্ছ মাসিক মিল ও বিল সারসংক্ষেপ দেখার জন্য ডিজাইন করা হয়েছে।',
        },
        {
          en: 'Authentication and portal sign-in will be introduced in a later backend phase.',
          bn: 'পরবর্তী ব্যাকএন্ড ধাপে অথেনটিকেশন ও মেম্বার লগইন যুক্ত করা হবে।',
        },
      ]}
      primaryCta={{
        label: { en: 'Explore Planned Features', bn: 'ফিচারসমূহ দেখুন' },
        href: '/#features',
      }}
      secondaryCta={{
        label: { en: 'Back to Homepage', bn: 'হোমপেজে ফিরুন' },
        href: '/',
      }}
    />
  );
}
