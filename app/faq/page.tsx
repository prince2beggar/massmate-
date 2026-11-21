import type { Metadata } from 'next';
import { FaqPageClient } from '@/components/faq/FaqPageClient';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about MessMate meal-rate math, rent splitting, Bangla support, privacy, and room rental listings.',
};

export default function FaqPage() {
  return <FaqPageClient />;
}
