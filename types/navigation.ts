export type HomeSectionId =
  | 'hero'
  | 'trust'
  | 'features'
  | 'how-it-works'
  | 'room-rentals'
  | 'pricing'
  | 'safety'
  | 'about'
  | 'contact'
  | 'faq'
  | 'get-started';

export type NavLabelKey =
  | 'home'
  | 'features'
  | 'howItWorks'
  | 'roomRentals'
  | 'pricing'
  | 'about'
  | 'contact';

export interface NavItem {
  id: string;
  labelKey: NavLabelKey;
  href: string;
  sectionId?: HomeSectionId;
  dedicatedPath?: string;
}

export interface HomepageSectionMeta {
  id: HomeSectionId;
  order: number;
  label: string;
}
