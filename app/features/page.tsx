import type { Metadata } from 'next';
import { FeaturesPageClient } from '@/components/features/FeaturesPageClient';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore MessMate modules for member management, room allocation, daily meal tracking, bazar accounting, rent ledgers, room rentals, notices, and emergency safety.',
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
