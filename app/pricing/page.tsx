import type { Metadata } from 'next';
import { PricingPageClient } from '@/components/pricing/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent monthly and yearly SaaS pricing for student messes, bachelor messes, shared apartments, and multi-building hostels.',
};

export default function PricingPage() {
  return <PricingPageClient />;
}
