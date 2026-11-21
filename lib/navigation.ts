import type {
  HomeSectionId,
  HomepageSectionMeta,
  NavItem,
} from '@/types/navigation';

export const HOMEPAGE_SECTIONS: HomepageSectionMeta[] = [
  { id: 'hero', order: 1, label: 'Hero' },
  { id: 'trust', order: 2, label: 'Trust Indicators' },
  { id: 'features', order: 3, label: 'Features Overview' },
  { id: 'how-it-works', order: 4, label: 'How It Works' },
  { id: 'room-rentals', order: 5, label: 'Room Rental Preview' },
  { id: 'pricing', order: 6, label: 'Pricing Preview' },
  { id: 'safety', order: 7, label: 'Emergency & Safety Preview' },
  { id: 'about', order: 8, label: 'About MessMate' },
  { id: 'contact', order: 9, label: 'Contact MessMate' },
  { id: 'faq', order: 10, label: 'Frequently Asked Questions' },
  { id: 'get-started', order: 11, label: 'Final Call to Action' },
];

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    labelKey: 'home',
    href: '/#hero',
    sectionId: 'hero',
    dedicatedPath: '/',
  },
  {
    id: 'features',
    labelKey: 'features',
    href: '/#features',
    sectionId: 'features',
    dedicatedPath: '/features',
  },
  {
    id: 'how-it-works',
    labelKey: 'howItWorks',
    href: '/#how-it-works',
    sectionId: 'how-it-works',
    dedicatedPath: '/how-it-works',
  },
  {
    id: 'room-rentals',
    labelKey: 'roomRentals',
    href: '/#room-rentals',
    sectionId: 'room-rentals',
    dedicatedPath: '/room-rental',
  },
  {
    id: 'pricing',
    labelKey: 'pricing',
    href: '/#pricing',
    sectionId: 'pricing',
    dedicatedPath: '/pricing',
  },
  {
    id: 'about',
    labelKey: 'about',
    href: '/#about',
    sectionId: 'about',
    dedicatedPath: '/about',
  },
  {
    id: 'contact',
    labelKey: 'contact',
    href: '/#contact',
    sectionId: 'contact',
    dedicatedPath: '/contact',
  },
];

export function resolveNavHref(item: NavItem, currentPathname: string): string {
  if (currentPathname === '/' && item.sectionId) {
    return `#${item.sectionId}`;
  }
  return item.href;
}

export function isNavItemActive(
  item: NavItem,
  currentPathname: string,
  activeSectionId: HomeSectionId | null
): boolean {
  if (currentPathname === '/') {
    if (!item.sectionId) return false;
    if (item.sectionId === 'hero') {
      return activeSectionId === null || activeSectionId === 'hero' || activeSectionId === 'trust';
    }
    return activeSectionId === item.sectionId;
  }

  return item.dedicatedPath === currentPathname;
}
