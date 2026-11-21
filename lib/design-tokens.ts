export interface ColorToken {
  name: string;
  token: string;
  hex: string;
  usage: string;
  contrastNote?: string;
}

export interface TypeScaleToken {
  id: string;
  label: string;
  className: string;
  size: string;
  lineHeight: string;
  weight: string;
  tracking: string;
  sampleEn: string;
  sampleBn: string;
}

export interface SpacingToken {
  token: string;
  rem: string;
  px: number;
  usage: string;
}

export interface RadiusToken {
  token: string;
  value: string;
  className: string;
  usage: string;
}

export interface ShadowToken {
  token: string;
  cssVar: string;
  className: string;
  usage: string;
}

export interface ContainerToken {
  id: 'narrow' | 'default' | 'wide';
  maxWidth: string;
  className: string;
  usage: string;
}

export interface BreakpointToken {
  prefix: string;
  minWidth: string;
  device: string;
}

export const BRAND_COLOR_TOKENS: ColorToken[] = [
  {
    name: 'Primary Cobalt',
    token: '--primary',
    hex: '#324CDD',
    usage: 'Primary CTAs, active tabs, focused inputs, key brand highlights',
    contrastNote: 'AA 6.4:1 with white text',
  },
  {
    name: 'Primary Hover',
    token: '--primary-hover',
    hex: '#263DC2',
    usage: 'Interactive hover state for primary buttons and active links',
  },
  {
    name: 'Secondary Navy',
    token: '--secondary-navy',
    hex: '#172B4D',
    usage: 'Primary display headings, high-trust dark banners, footer canvas',
    contrastNote: 'AAA 14.3:1 on white',
  },
  {
    name: 'Accent Sky',
    token: '--accent-sky',
    hex: '#11CDEF',
    usage: 'Secondary accents on dark surfaces, subtle architectural highlights',
  },
];

export const SURFACE_COLOR_TOKENS: ColorToken[] = [
  {
    name: 'Canvas White',
    token: '--background',
    hex: '#FFFFFF',
    usage: 'Primary page background and elevated card surfaces',
  },
  {
    name: 'Subtle Surface',
    token: '--surface-subtle',
    hex: '#F8F9FE',
    usage: 'Alternating editorial bands, secondary panels, table headers',
  },
  {
    name: 'Muted Surface',
    token: '--muted',
    hex: '#F1F5F9',
    usage: 'Segmented control tracks, quiet icon wells, disabled inputs',
  },
  {
    name: 'Hairline Border',
    token: '--border',
    hex: '#E2E8F0',
    usage: '1px structural dividers, single-elevation card borders',
  },
];

export const TEXT_COLOR_TOKENS: ColorToken[] = [
  {
    name: 'Heading Ink',
    token: '--foreground',
    hex: '#172B4D',
    usage: 'H1–H6 headings, card titles, primary metric numerals',
  },
  {
    name: 'Body Slate',
    token: '--text-body',
    hex: '#525F7F',
    usage: 'Paragraph prose, table body text, form descriptions',
  },
  {
    name: 'Muted Caption',
    token: '--muted-foreground',
    hex: '#64748B',
    usage: 'Unboxed metadata, timestamps, secondary hints',
  },
];

export const SEMANTIC_COLOR_TOKENS: ColorToken[] = [
  {
    name: 'Success Emerald',
    token: '--success',
    hex: '#059669',
    usage: 'Settled rent, refundable balance, verified mess indicator',
  },
  {
    name: 'Warning Amber',
    token: '--warning',
    hex: '#D97706',
    usage: 'Upcoming cutoff notices, partial payment reminders',
  },
  {
    name: 'Error Rose',
    token: '--destructive',
    hex: '#DC2626',
    usage: 'Payable overdue alerts, inline form validation errors, emergency accents',
  },
  {
    name: 'Info Cerulean',
    token: '--info',
    hex: '#0284C7',
    usage: 'Informational callouts, onboarding tips, neutral notices',
  },
];

export const TYPOGRAPHY_SCALE: TypeScaleToken[] = [
  {
    id: 'display',
    label: 'Display / Hero',
    className: 'text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12]',
    size: '36px → 48px',
    lineHeight: '1.12',
    weight: '700 (Bold)',
    tracking: '-0.025em',
    sampleEn: 'Transparent shared living, engineered with clarity.',
    sampleBn: 'স্বচ্ছ মেস ব্যবস্থাপনা, আধুনিক প্রযুক্তির নিশ্চয়তায়।',
  },
  {
    id: 'h2',
    label: 'Section Heading (H2)',
    className: 'text-2xl sm:text-3xl font-bold tracking-tight leading-[1.2]',
    size: '24px → 32px',
    lineHeight: '1.20',
    weight: '700 (Bold)',
    tracking: '-0.02em',
    sampleEn: 'Every operational pillar in one clean ledger.',
    sampleBn: 'মেস পরিচালনার প্রতিটি মডিউল এক পরিচ্ছন্ন সিস্টেমে।',
  },
  {
    id: 'h3',
    label: 'Card Heading (H3)',
    className: 'text-lg sm:text-xl font-semibold tracking-tight leading-snug',
    size: '18px → 20px',
    lineHeight: '1.35',
    weight: '600 (SemiBold)',
    tracking: '-0.015em',
    sampleEn: 'Automated Monthly Meal Rate & Rent Settlement',
    sampleBn: 'স্বয়ংক্রিয় মাসিক মিল রেট ও ভাড়া হিসাব ক্লোজিং',
  },
  {
    id: 'body-lead',
    label: 'Body Lead',
    className: 'text-base sm:text-lg font-normal leading-relaxed',
    size: '16px → 18px',
    lineHeight: '1.65',
    weight: '400 (Regular)',
    tracking: '0em',
    sampleEn: 'Replace notebooks and group chat confusion with verifiable daily meal and bazar tracking.',
    sampleBn: 'কাগজের খাতা ও গ্রুপ চ্যাটের বিভ্রান্তি দূর করে প্রতিদিনের মিল ও বাজারের স্বচ্ছ হিসাব রাখুন।',
  },
  {
    id: 'body',
    label: 'Body Prose',
    className: 'text-sm sm:text-[15px] font-normal leading-relaxed',
    size: '14px → 15px',
    lineHeight: '1.60',
    weight: '400 (Regular)',
    tracking: '0em',
    sampleEn: 'Each room maintains its own base rent while shared utilities split fairly across active residents.',
    sampleBn: 'প্রতিটি রুমের নিজস্ব মূল ভাড়া থাকে এবং শেয়ার্ড ইউটিলিটি বিল সক্রিয় সদস্যদের মধ্যে ন্যায্যভাবে ভাগ হয়।',
  },
  {
    id: 'mono',
    label: 'Tabular Numerals (Mono)',
    className: 'font-mono tabular-nums text-base font-semibold',
    size: '14px → 16px',
    lineHeight: '1.40',
    weight: '600 (SemiBold)',
    tracking: '0em',
    sampleEn: '৳64.50 / meal · ৳38,700 bazar · +৳420 refundable',
    sampleBn: '৳৬৪.৫০ / মিল · ৳৩৮,৭০০ বাজার · +৳৪২০ পাওনা',
  },
];

export const SPACING_TOKENS: SpacingToken[] = [
  { token: 'space-1', rem: '0.25rem', px: 4, usage: 'Micro gaps, icon-to-label alignment' },
  { token: 'space-2', rem: '0.5rem', px: 8, usage: 'Compact control groups, inline badges' },
  { token: 'space-4', rem: '1rem', px: 16, usage: 'Minimum card padding, form field spacing' },
  { token: 'space-6', rem: '1.5rem', px: 24, usage: 'Standard card padding, grid gutters' },
  { token: 'space-8', rem: '2rem', px: 32, usage: 'Elevated panel padding, subsection spacing' },
  { token: 'space-16', rem: '4rem', px: 64, usage: 'Mobile section vertical padding' },
  { token: 'space-24', rem: '6rem', px: 96, usage: 'Desktop editorial section breathing room' },
];

export const RADIUS_TOKENS: RadiusToken[] = [
  { token: '--radius-sm', value: '6px', className: 'rounded-md', usage: 'Badges, compact segmented pills' },
  { token: '--radius-md', value: '8px', className: 'rounded-lg', usage: 'Buttons, inputs, selects, icon wells' },
  { token: '--radius-lg', value: '12px', className: 'rounded-xl', usage: 'Standard cards, callout panels' },
  { token: '--radius-xl', value: '16px', className: 'rounded-2xl', usage: 'Dialogs, browser mockups, featured tiers' },
];

export const SHADOW_TOKENS: ShadowToken[] = [
  {
    token: 'shadow-xs',
    cssVar: '--shadow-xs',
    className: 'shadow-xs',
    usage: 'Subtle lift on buttons and active segmented tabs',
  },
  {
    token: 'shadow-surface',
    cssVar: '--shadow-surface',
    className: 'shadow-surface',
    usage: 'Clean Linear/Stripe-grade single-elevation surface shadow',
  },
  {
    token: 'shadow-elevated',
    cssVar: '--shadow-elevated',
    className: 'argon-card-shadow',
    usage: 'Hero product preview, pricing focus card, and modal surfaces',
  },
];

export const CONTAINER_TOKENS: ContainerToken[] = [
  { id: 'narrow', maxWidth: '768px', className: 'max-w-3xl', usage: 'Editorial reading prose, legal terms, narrow forms' },
  { id: 'default', maxWidth: '1280px', className: 'max-w-7xl', usage: 'Primary website sections, navigation, grids' },
  { id: 'wide', maxWidth: '1440px', className: 'max-w-[1440px]', usage: 'Full-bleed visual showcases and spacious comparisons' },
];

export const BREAKPOINT_TOKENS: BreakpointToken[] = [
  { prefix: 'base', minWidth: '0px', device: 'Mobile phones (390px baseline)' },
  { prefix: 'sm', minWidth: '640px', device: 'Large mobile / compact landscape' },
  { prefix: 'md', minWidth: '768px', device: 'Tablets (2-column grids)' },
  { prefix: 'lg', minWidth: '1024px', device: 'Laptops (full desktop navigation & splits)' },
  { prefix: 'xl', minWidth: '1280px', device: 'Standard desktop displays' },
  { prefix: '2xl', minWidth: '1536px', device: 'Wide desktop monitors' },
];

export function getAllColorTokens(): ColorToken[] {
  return [
    ...BRAND_COLOR_TOKENS,
    ...SURFACE_COLOR_TOKENS,
    ...TEXT_COLOR_TOKENS,
    ...SEMANTIC_COLOR_TOKENS,
  ];
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(hex);
}
