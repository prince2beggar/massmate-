import type { Metadata } from 'next';
import { HowItWorksPageClient } from '@/components/how-it-works/HowItWorksPageClient';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'See how Mess Managers, Resident Members, and House Owners automate meals, bazar, and rent cycles from Day 1 to Day 30 with MessMate.',
};

export default function HowItWorksPage() {
  return <HowItWorksPageClient />;
}
