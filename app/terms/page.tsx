import type { Metadata } from 'next';
import { TermsPageClient } from '@/components/legal/TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms governing the use of the MessMate SaaS platform, public room rental listings, and subscription billing.',
};

export default function TermsPage() {
  return <TermsPageClient />;
}
