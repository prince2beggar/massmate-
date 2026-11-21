import type { Metadata } from 'next';
import { PrivacyPageClient } from '@/components/legal/PrivacyPageClient';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How MessMate protects member profiles, financial ledgers, emergency guardian contacts, and public room rental data.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPageClient />;
}
