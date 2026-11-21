import { CENTRALIZED_CONTACT_PLACEHOLDERS } from '@/data/about-contact';

export interface FooterLinkItem {
  id: string;
  label: { en: string; bn: string };
  homeHref: string;
  subpageHref: string;
  isPlaceholder?: boolean;
}

export interface FooterSocialItem {
  id: 'facebook' | 'linkedin' | 'youtube' | 'instagram';
  label: string;
  href: string;
}

export const FOOTER_QUICK_LINKS: FooterLinkItem[] = [
  {
    id: 'home',
    label: { en: 'Home', bn: 'হোম' },
    homeHref: '#hero',
    subpageHref: '/',
  },
  {
    id: 'about',
    label: { en: 'About Us', bn: 'আমাদের সম্পর্কে' },
    homeHref: '#about',
    subpageHref: '/#about',
  },
  {
    id: 'features',
    label: { en: 'Features', bn: 'ফিচারসমূহ' },
    homeHref: '#features',
    subpageHref: '/#features',
  },
  {
    id: 'how-it-works',
    label: { en: 'How It Works', bn: 'কীভাবে কাজ করে' },
    homeHref: '#how-it-works',
    subpageHref: '/#how-it-works',
  },
  {
    id: 'pricing',
    label: { en: 'Pricing', bn: 'মূল্য তালিকা' },
    homeHref: '#pricing',
    subpageHref: '/#pricing',
  },
  {
    id: 'faq',
    label: { en: 'FAQ', bn: 'প্রশ্নোত্তর' },
    homeHref: '#faq',
    subpageHref: '/#faq',
  },
  {
    id: 'contact',
    label: { en: 'Contact', bn: 'যোগাযোগ' },
    homeHref: '#contact',
    subpageHref: '/#contact',
  },
];

export const FOOTER_PLATFORM_LINKS: FooterLinkItem[] = [
  {
    id: 'mess-admin-login',
    label: { en: 'Mess Admin Login', bn: 'মেস অ্যাডমিন লগইন' },
    homeHref: '/mess-admin-login',
    subpageHref: '/mess-admin-login',
    isPlaceholder: true,
  },
  {
    id: 'member-portal',
    label: { en: 'Member Portal', bn: 'মেম্বার পোর্টাল' },
    homeHref: '/member-portal',
    subpageHref: '/member-portal',
    isPlaceholder: true,
  },
  {
    id: 'room-rental',
    label: { en: 'Room Rental', bn: 'রুম ভাড়া' },
    homeHref: '#room-rentals',
    subpageHref: '/room-rental',
  },
  {
    id: 'start-free-trial',
    label: { en: 'Start Free Trial', bn: 'ফ্রি ট্রায়াল শুরু করুন' },
    homeHref: '#get-started',
    subpageHref: '/#get-started',
  },
];

export const FOOTER_LEGAL_LINKS: FooterLinkItem[] = [
  {
    id: 'privacy-policy',
    label: { en: 'Privacy Policy', bn: 'গোপনীয়তা নীতি' },
    homeHref: '/privacy-policy',
    subpageHref: '/privacy-policy',
  },
  {
    id: 'terms',
    label: { en: 'Terms & Conditions', bn: 'শর্তাবলী' },
    homeHref: '/terms',
    subpageHref: '/terms',
  },
  {
    id: 'refund-policy',
    label: { en: 'Refund Policy', bn: 'রিফান্ড নীতি' },
    homeHref: '/refund-policy',
    subpageHref: '/refund-policy',
    isPlaceholder: true,
  },
];

export const FOOTER_SOCIAL_LINKS: FooterSocialItem[] = [
  { id: 'facebook', label: 'Facebook', href: '#social-coming-soon' },
  { id: 'linkedin', label: 'LinkedIn', href: '#social-coming-soon' },
  { id: 'youtube', label: 'YouTube', href: '#social-coming-soon' },
  { id: 'instagram', label: 'Instagram', href: '#social-coming-soon' },
];

export const FOOTER_CONTACT_INFO = {
  emailPlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.email,
  phonePlaceholder: CENTRALIZED_CONTACT_PLACEHOLDERS.phone,
  locationReference: {
    en: 'Bangladesh · Office address to be announced',
    bn: 'বাংলাদেশ · অফিসের ঠিকানা শীঘ্রই জানানো হবে',
  },
} as const;

export function resolveFooterHref(
  item: FooterLinkItem,
  pathname: string
): string {
  return pathname === '/' ? item.homeHref : item.subpageHref;
}
