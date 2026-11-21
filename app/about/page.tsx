import type { Metadata } from 'next';
import { AboutPageClient } from '@/components/about/AboutPageClient';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn why MessMate is building modern, transparent digital infrastructure for student, bachelor, job-holder, and shared apartment communities.',
};

export default function AboutPage() {
  return <AboutPageClient />;
}
