import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact the MessMate onboarding and support team for free setup guidance, multi-mess migration, or product demos.',
};

export default function ContactPage() {
  return <ContactForm />;
}
