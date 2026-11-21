'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Filter,
  Home,
  Info,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  BRAND_COLOR_TOKENS,
  SURFACE_COLOR_TOKENS,
  TEXT_COLOR_TOKENS,
  SEMANTIC_COLOR_TOKENS,
  TYPOGRAPHY_SCALE,
  SPACING_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  CONTAINER_TOKENS,
  BREAKPOINT_TOKENS,
  type ColorToken,
} from '@/lib/design-tokens';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { NavLink } from '@/components/ui/nav-link';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import {
  CardSkeleton,
  InlineLoader,
  TableRowsSkeleton,
} from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const JUMP_SECTIONS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'tokens', label: 'Scale & Layout' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'cards', label: 'Cards' },
  { id: 'forms', label: 'Forms' },
  { id: 'badges', label: 'Badges' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'overlays', label: 'Modals & States' },
];

const MESS_TYPE_OPTIONS = [
  { value: 'student', label: 'Student Mess' },
  { value: 'bachelor', label: 'Bachelor Mess' },
  { value: 'jobholder', label: 'Job Holder Mess' },
  { value: 'apartment', label: 'Shared Apartment' },
];

const ZONE_OPTIONS = [
  { value: 'dhanmondi', label: 'Dhanmondi, Dhaka' },
  { value: 'uttara', label: 'Uttara Sector 7' },
  { value: 'bashundhara', label: 'Bashundhara R/A' },
  { value: 'mirpur', label: 'Mirpur DOHS' },
];

function ColorSwatchGrid({
  title,
  description,
  tokens,
  copiedHex,
  onCopy,
}: {
  title: string;
  description: string;
  tokens: ColorToken[];
  copiedHex: string | null;
  onCopy: (hex: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-[#172B4D]">
          {title}
        </h3>
        <p className="text-sm text-[#525F7F] mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tokens.map((item) => {
          const isCopied = copiedHex === item.hex;
          const isLightSurface =
            item.hex === '#FFFFFF' ||
            item.hex === '#F8F9FE' ||
            item.hex === '#F1F5F9' ||
            item.hex === '#E2E8F0';
          return (
            <button
              key={item.token}
              type="button"
              onClick={() => onCopy(item.hex)}
              className="group flex flex-col items-stretch justify-start text-left rounded-xl border border-slate-200/90 bg-white overflow-hidden transition-all duration-150 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#324CDD] cursor-pointer"
            >
              <div
                className="h-20 w-full flex items-end justify-between p-3 border-b border-slate-100"
                style={{ backgroundColor: item.hex }}
              >
                <span
                  className={`font-mono text-xs font-medium px-2 py-0.5 rounded-md ${
                    isLightSurface
                      ? 'bg-slate-900/5 text-[#172B4D] border border-slate-300/70'
                      : 'bg-black/20 text-white'
                  }`}
                >
                  {item.hex}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-opacity ${
                    isLightSurface
                      ? 'bg-white/90 text-[#172B4D] border border-slate-200'
                      : 'bg-white/15 text-white'
                  } ${isCopied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#172B4D]">
                    {item.name}
                  </span>
                  <code className="font-mono text-[11px] text-[#64748B]">
                    {item.token}
                  </code>
                </div>
                <p className="text-xs leading-relaxed text-[#525F7F]">
                  {item.usage}
                </p>
                {item.contrastNote && (
                  <p className="text-[11px] font-medium text-[#059669] pt-0.5">
                    {item.contrastNote}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DesignSystemPreview() {
  const { locale } = useLanguage();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [activeJump, setActiveJump] = useState<string>('colors');
  const [simulatingLoad, setSimulatingLoad] = useState(false);

  // Interactive Form Preview state
  const [messName, setMessName] = useState('Dhanmondi Lakeview Mess');
  const [managerEmail, setManagerEmail] = useState('manager@lakeviewmess.org');
  const [messType, setMessType] = useState('student');
  const [zone, setZone] = useState('dhanmondi');
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [formStatus, setFormStatus] = useState<string | null>(null);

  // Interactive Navigation Preview state
  const [demoHorizontalNav, setDemoHorizontalNav] = useState('overview');
  const [demoVerticalNav, setDemoVerticalNav] = useState('ledger');
  const [demoBillingCycle, setDemoBillingCycle] = useState<
    'monthly' | 'quarterly' | 'annual'
  >('monthly');

  // Interactive State Switcher & Dialog state
  const [moduleViewState, setModuleViewState] = useState<
    'loaded' | 'loading' | 'empty'
  >('loaded');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfirmed, setDialogConfirmed] = useState(false);

  const handleCopyColor = (hex: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hex).catch(() => {});
    }
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((prev) => (prev === hex ? null : prev));
    }, 1500);
  };

  const handleSimulateButtonLoad = () => {
    setSimulatingLoad(true);
    window.setTimeout(() => {
      setSimulatingLoad(false);
    }, 1200);
  };

  const handleValidatePreviewForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (messName.trim().length < 3) {
      setFormError('Mess name must be at least 3 characters.');
      setFormStatus(null);
      return;
    }
    if (!managerEmail.includes('@') || !managerEmail.includes('.')) {
      setFormError('Enter a valid email address for the mess manager.');
      setFormStatus(null);
      return;
    }
    setFormError(undefined);
    const typeLabel =
      MESS_TYPE_OPTIONS.find((opt) => opt.value === messType)?.label ??
      messType;
    const zoneLabel =
      ZONE_OPTIONS.find((opt) => opt.value === zone)?.label ?? zone;
    setFormStatus(
      `Validated: ${messName.trim()} (${typeLabel} · ${zoneLabel})`
    );
  };

  const handleClearPreviewForm = () => {
    setMessName('');
    setManagerEmail('invalid-email');
    setFormError('Enter a valid email address for the mess manager.');
    setFormStatus(null);
  };

  return (
    <div className="bg-white">
      {/* Masthead */}
      <Section
        surface="subtle"
        spacing="sm"
        className="border-b border-slate-200/80"
      >
        <Container>
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Design System v1.0</Badge>
              <Badge variant="outline">Tailwind CSS v4 + shadcn/ui</Badge>
              <Badge variant="info">EN · বাংলা Ready</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#172B4D] leading-[1.12]">
              MessMate Visual Design System
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#525F7F] max-w-2xl">
              Foundational tokens, typography hierarchy, and reusable UI
              primitives engineered for trust, financial clarity, and calm
              shared-living operations.
            </p>
          </div>

          {/* Horizontal Jump Navigation */}
          <nav
            aria-label="Design system sections"
            className="mt-8 flex items-center gap-5 overflow-x-auto pb-1 border-t border-slate-200/80 pt-5"
          >
            {JUMP_SECTIONS.map((sec) => (
              <NavLink
                key={sec.id}
                href={`#${sec.id}`}
                active={activeJump === sec.id}
                onClick={() => setActiveJump(sec.id)}
              >
                {sec.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </Section>

      {/* 1. Colors */}
      <Section id="colors" surface="white" spacing="md" className="scroll-mt-20">
        <Container className="space-y-10">
          <SectionHeader
            kicker="01 · Color System"
            title="High-trust cobalt, ink navy, and semantic clarity"
            subtitle="Every token is calibrated for WCAG AA contrast on crisp white and subtle cool-tint surfaces. Click any swatch to copy its hex value."
          />

          <div className="space-y-10">
            <ColorSwatchGrid
              title="Brand Palette"
              description="Primary interactive cobalt paired with authoritative navy headings and restrained sky accents."
              tokens={BRAND_COLOR_TOKENS}
              copiedHex={copiedHex}
              onCopy={handleCopyColor}
            />
            <ColorSwatchGrid
              title="Surfaces & Borders"
              description="Alternating canvas tones and 1px hairline borders that separate hierarchy without heavy shadows."
              tokens={SURFACE_COLOR_TOKENS}
              copiedHex={copiedHex}
              onCopy={handleCopyColor}
            />
            <ColorSwatchGrid
              title="Typography Ink"
              description="Three calibrated neutral tiers separating headings, body copy, and secondary metadata."
              tokens={TEXT_COLOR_TOKENS}
              copiedHex={copiedHex}
              onCopy={handleCopyColor}
            />
            <ColorSwatchGrid
              title="Semantic Status"
              description="Consistent financial and operational status tones for settled rent, reminders, overdue balances, and notices."
              tokens={SEMANTIC_COLOR_TOKENS}
              copiedHex={copiedHex}
              onCopy={handleCopyColor}
            />
          </div>
        </Container>
      </Section>

      {/* 2. Typography */}
      <Section id="typography" surface="subtle" spacing="md" bordered className="scroll-mt-20">
        <Container className="space-y-10">
          <SectionHeader
            kicker="02 · Typography"
            title="Bilingual scale built for editorial prose and tabular numbers"
            subtitle="Plus Jakarta Sans anchors headings, DM Sans renders crisp UI prose, Hind Siliguri handles Bangla cleanly, and JetBrains Mono keeps financial columns aligned."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardDescription>Display & Headings</CardDescription>
                <CardTitle className="text-xl">Plus Jakarta Sans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#525F7F]">
                  Geometric clarity with tight tracking (-0.025em) for confident
                  SaaS headings and section titles.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>UI & Bilingual Body</CardDescription>
                <CardTitle className="text-xl">
                  DM Sans + Hind Siliguri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#525F7F]">
                  High legibility at 14px–16px across English and বাংলা forms,
                  tables, and marketing copy.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Financial & Code</CardDescription>
                <CardTitle className="font-mono text-xl">
                  JetBrains Mono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#525F7F]">
                  Enforces <code className="font-mono text-xs">tabular-nums</code>{' '}
                  so meal rates, bazar totals, and balances never jitter.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200/80 overflow-hidden">
            {TYPOGRAPHY_SCALE.map((row) => (
              <div
                key={row.id}
                className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-baseline"
              >
                <div className="lg:col-span-3 space-y-1">
                  <div className="text-sm font-semibold text-[#172B4D]">
                    {row.label}
                  </div>
                  <div className="font-mono text-xs text-[#64748B] tabular-nums">
                    {row.size} · LH {row.lineHeight}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    {row.weight} · Track {row.tracking}
                  </div>
                </div>
                <div className="lg:col-span-9 space-y-2">
                  <p className={`${row.className} text-[#172B4D]`}>
                    {locale === 'bn' ? row.sampleBn : row.sampleEn}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {locale === 'bn' ? row.sampleEn : row.sampleBn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3. Spacing, Radius, Shadows, Containers & Breakpoints */}
      <Section id="tokens" surface="white" spacing="md" className="scroll-mt-20">
        <Container className="space-y-10">
          <SectionHeader
            kicker="03 · Foundations"
            title="Spacing rhythm, radius, shadows, and responsive grid"
            subtitle="Consistent geometric rules keep mobile phones, tablets, laptops, and wide desktop screens balanced without crowding."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spacing Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Spacing System (4px Base)</CardTitle>
                <CardDescription>
                  Used across paddings, grid gutters, and section breathing room.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SPACING_TOKENS.map((item) => (
                  <div
                    key={item.token}
                    className="grid grid-cols-12 items-center gap-3 text-xs"
                  >
                    <span className="col-span-3 font-mono font-medium text-[#172B4D]">
                      {item.token}
                    </span>
                    <span className="col-span-2 font-mono tabular-nums text-[#64748B]">
                      {item.px}px
                    </span>
                    <div className="col-span-3 flex items-center">
                      <div
                        className="h-2.5 rounded-xs bg-[#324CDD]"
                        style={{ width: `${Math.min(item.px, 96)}px` }}
                      />
                    </div>
                    <span className="col-span-4 text-[#525F7F] truncate">
                      {item.usage}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Border Radius & Shadows */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Border Radius</CardTitle>
                  <CardDescription>
                    Four restrained steps from compact badges to spacious dialogs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {RADIUS_TOKENS.map((r) => (
                      <div key={r.token} className="space-y-2">
                        <div
                          className={`h-14 w-full border border-[#324CDD]/35 bg-[#EEF2FF]/70 flex items-center justify-center font-mono text-xs font-semibold text-[#324CDD] ${r.className}`}
                        >
                          {r.value}
                        </div>
                        <div>
                          <div className="font-mono text-[11px] font-medium text-[#172B4D]">
                            {r.className}
                          </div>
                          <div className="text-[11px] text-[#64748B] leading-snug">
                            {r.usage}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Elevation & Shadows</CardTitle>
                  <CardDescription>
                    Subtle depth reserved for surfaces that need visual separation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SHADOW_TOKENS.map((s) => (
                      <div
                        key={s.token}
                        className={`rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5 ${s.className}`}
                      >
                        <div className="font-mono text-xs font-semibold text-[#172B4D]">
                          {s.token}
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {s.usage}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Container Widths & Breakpoints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Container Widths</CardTitle>
                <CardDescription>
                  Standardized via{' '}
                  <code className="font-mono text-xs">&lt;Container size=&quot;...&quot; /&gt;</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {CONTAINER_TOKENS.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-[#F8F9FE] px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#172B4D] capitalize">
                          {c.id}
                        </span>
                        <code className="font-mono text-xs text-[#324CDD]">
                          {c.className}
                        </code>
                      </div>
                      <p className="text-xs text-[#525F7F] mt-0.5">{c.usage}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#172B4D] tabular-nums shrink-0">
                      {c.maxWidth}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsive Breakpoints</CardTitle>
                <CardDescription>
                  Mobile-first Tailwind v4 breakpoints targeting phones through wide monitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {BREAKPOINT_TOKENS.map((bp) => (
                    <div
                      key={bp.prefix}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <code className="inline-flex w-12 justify-center rounded-md bg-[#EEF2FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#324CDD]">
                          {bp.prefix}
                        </code>
                        <span className="text-[#525F7F] text-xs sm:text-sm">
                          {bp.device}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#172B4D] tabular-nums shrink-0">
                        ≥ {bp.minWidth}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* 4. Buttons */}
      <Section id="buttons" surface="subtle" spacing="md" bordered className="scroll-mt-20">
        <Container className="space-y-8">
          <SectionHeader
            kicker="04 · Actions"
            title="Buttons"
            subtitle="Clear visual hierarchy across primary, secondary, subtle, outline, ghost, and destructive actions with touch-friendly 40px default targets."
          />

          <Card>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Variants
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Primary Action</Button>
                  <Button variant="secondary">Secondary Navy</Button>
                  <Button variant="subtle">Subtle Cobalt</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Text Link</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Sizes & Icon Composition
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (36px)</Button>
                  <Button size="default">Default (40px)</Button>
                  <Button size="lg">
                    Large CTA (44px)
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Add item">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Interactive States
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="default"
                    onClick={handleSimulateButtonLoad}
                    disabled={simulatingLoad}
                  >
                    {simulatingLoad ? (
                      <>
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Test Loading State
                      </>
                    )}
                  </Button>
                  <Button variant="outline" disabled>
                    Disabled Outline
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove Member
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* 5. Cards */}
      <Section id="cards" surface="white" spacing="md" className="scroll-mt-20">
        <Container className="space-y-8">
          <SectionHeader
            kicker="05 · Surfaces"
            title="Cards"
            subtitle="Single-elevation containers with crisp 1px borders, predictable internal spacing, and tabular financial readability."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Standard Info Card */}
            <Card>
              <CardHeader>
                <CardAction>
                  <Badge variant="success">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Verified
                  </Badge>
                </CardAction>
                <CardTitle>Transparent Bazar Ledger</CardTitle>
                <CardDescription>
                  Daily grocery logs attach receipts and split costs fairly
                  across active meal members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#64748B]">Current Meal Rate</span>
                  <span className="font-mono font-semibold text-[#172B4D] tabular-nums">
                    ৳64.50
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#64748B]">Active Diners</span>
                  <span className="font-mono font-semibold text-[#172B4D] tabular-nums">
                    18 Members
                  </span>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-[#64748B]">Updated 10m ago</span>
                <Button variant="subtle" size="sm">
                  View Formula
                </Button>
              </CardFooter>
            </Card>

            {/* Metric KPI Card */}
            <Card className="shadow-surface">
              <CardHeader>
                <CardDescription>Monthly Rent Collection</CardDescription>
                <CardTitle className="font-mono text-3xl font-bold tabular-nums text-[#172B4D]">
                  ৳1,42,500
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">94.8% Settled</Badge>
                  <span className="text-xs text-[#64748B]">
                    17 of 18 seats paid
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[94.8%] rounded-full bg-[#324CDD]" />
                </div>
                <p className="text-xs text-[#525F7F]">
                  Automated payment receipts issue instantly once the manager
                  marks rent received.
                </p>
              </CardContent>
              <CardFooter className="justify-between text-xs text-[#525F7F]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#324CDD]" aria-hidden="true" />
                  Due by 5th of month
                </span>
                <span className="font-mono font-semibold text-[#172B4D] tabular-nums">
                  ৳7,500 left
                </span>
              </CardFooter>
            </Card>

            {/* Elevated Listing Preview Card */}
            <Card className="argon-card-shadow">
              <CardHeader>
                <CardAction>
                  <Badge variant="info">2 Seats Open</Badge>
                </CardAction>
                <CardTitle>Uttara Sector 7 Suite</CardTitle>
                <CardDescription className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#324CDD]" aria-hidden="true" />
                  Road 14 · Job Holder Mess
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-[#172B4D] tabular-nums">
                    ৳6,500
                  </span>
                  <span className="text-xs text-[#64748B]">/ seat / month</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Attached Bath</Badge>
                  <Badge variant="secondary">High-Speed Wi-Fi</Badge>
                  <Badge variant="secondary">24/7 Guard</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="default" size="sm" className="w-full">
                  Inspect Room Details
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Container>
      </Section>

      {/* 6. Form Elements */}
      <Section id="forms" surface="subtle" spacing="md" bordered className="scroll-mt-20">
        <Container className="space-y-8">
          <SectionHeader
            kicker="06 · Inputs & Controls"
            title="Form Elements"
            subtitle="Accessible inputs, shadcn select menus, helper copy, and inline validation feedback with consistent 40px vertical alignment."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle>Interactive Mess Profile Form</CardTitle>
                <CardDescription>
                  Test focus rings, Select dropdowns, and live inline error
                  validation below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleValidatePreviewForm}
                  className="space-y-5"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="ds-mess-name"
                      label="Mess Name"
                      required
                      helperText="Shown on member statements and public vacancy page."
                      error={
                        formError && messName.trim().length < 3
                          ? formError
                          : undefined
                      }
                    >
                      <Input
                        id="ds-mess-name"
                        value={messName}
                        onChange={(e) => {
                          setMessName(e.target.value);
                          setFormError(undefined);
                        }}
                        placeholder="e.g., Dhanmondi Lakeview Mess"
                        aria-invalid={
                          Boolean(formError && messName.trim().length < 3) ||
                          undefined
                        }
                      />
                    </FormField>

                    <FormField
                      id="ds-manager-email"
                      label="Manager Email"
                      required
                      error={
                        formError &&
                        (!managerEmail.includes('@') ||
                          !managerEmail.includes('.'))
                          ? formError
                          : undefined
                      }
                    >
                      <Input
                        id="ds-manager-email"
                        type="email"
                        value={managerEmail}
                        onChange={(e) => {
                          setManagerEmail(e.target.value);
                          setFormError(undefined);
                        }}
                        placeholder="manager@example.com"
                        aria-invalid={
                          Boolean(
                            formError &&
                              (!managerEmail.includes('@') ||
                                !managerEmail.includes('.'))
                          ) || undefined
                        }
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="ds-mess-type"
                      label="Mess Category"
                      helperText="Select the primary resident profile."
                    >
                      <Select
                        value={messType}
                        items={MESS_TYPE_OPTIONS}
                        onValueChange={(value) => {
                          if (value) setMessType(value);
                        }}
                      >
                        <SelectTrigger id="ds-mess-type">
                          <SelectValue placeholder="Choose category">
                            {MESS_TYPE_OPTIONS.find((opt) => opt.value === messType)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MESS_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      id="ds-zone"
                      label="City / Neighborhood"
                      helperText="Used for verified rental directory filters."
                    >
                      <Select
                        value={zone}
                        items={ZONE_OPTIONS}
                        onValueChange={(value) => {
                          if (value) setZone(value);
                        }}
                      >
                        <SelectTrigger id="ds-zone">
                          <SelectValue placeholder="Choose area">
                            {ZONE_OPTIONS.find((opt) => opt.value === zone)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ZONE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  {formStatus && (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-[#047857]"
                    >
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{formStatus}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button type="submit" variant="default">
                      Validate Inputs
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearPreviewForm}
                    >
                      Trigger Error State
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Input State Reference */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle>Field State Reference</CardTitle>
                <CardDescription>
                  Icon-prefixed search, disabled read-only state, and static
                  error preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField id="ds-search" label="Search Input">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="ds-search"
                      className="pl-9"
                      placeholder="Search by area or room rent..."
                    />
                  </div>
                </FormField>

                <FormField
                  id="ds-disabled"
                  label="Read-Only / Disabled"
                  helperText="Locked after monthly statement finalization."
                >
                  <Input
                    id="ds-disabled"
                    value="MM-2025-DHAKA-042"
                    disabled
                    readOnly
                  />
                </FormField>

                <FormField
                  id="ds-error-static"
                  label="Validation Error Example"
                  error="Base seat rent must be greater than ৳1,000."
                >
                  <Input
                    id="ds-error-static"
                    defaultValue="500"
                    aria-invalid
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* 7. Badges */}
      <Section id="badges" surface="white" spacing="md" className="scroll-mt-20">
        <Container className="space-y-8">
          <SectionHeader
            kicker="07 · Status Indicators"
            title="Badges"
            subtitle="Compact, non-distracting semantic labels used sparingly for verified status, payment state, and categorization."
          />

          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="default">Primary Cobalt</Badge>
                <Badge variant="secondary">Secondary Neutral</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Rent Settled
                </Badge>
                <Badge variant="warning">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Cutoff in 2h
                </Badge>
                <Badge variant="destructive">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Balance Overdue
                </Badge>
                <Badge variant="info">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  Notice Posted
                </Badge>
              </div>
              <p className="text-xs text-[#64748B]">
                Guideline: Never use animated pulsing dots next to badges or
                stack more than three tags on a single card.
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* 8. Navigation Elements */}
      <Section id="navigation" surface="subtle" spacing="md" bordered className="scroll-mt-20">
        <Container className="space-y-8">
          <SectionHeader
            kicker="08 · Wayfinding"
            title="Navigation Elements"
            subtitle="Horizontal underline navigation links, vertical sidebar links, and segmented tab controls with explicit active states."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Horizontal Nav & Segmented Tabs */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle>Horizontal Links & Segmented Control</CardTitle>
                <CardDescription>
                  Click items to preview active underline and segmented panel
                  transitions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-[#F8F9FE] px-5 py-3 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-sm font-bold tracking-tight text-[#172B4D]">
                    Mess<span className="text-[#324CDD]">Mate</span>
                  </span>
                  <div className="flex items-center gap-5 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'meals', label: 'Meal Sheet' },
                      { id: 'bazar', label: 'Bazar Log' },
                      { id: 'rooms', label: 'Rooms' },
                    ].map((item) => (
                      <NavLink
                        key={item.id}
                        href="#navigation"
                        active={demoHorizontalNav === item.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setDemoHorizontalNav(item.id);
                        }}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Segmented Tabs
                  </p>
                  <SegmentedTabs
                    ariaLabel="Billing cycle preview"
                    value={demoBillingCycle}
                    onChange={setDemoBillingCycle}
                    options={[
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly (-10%)' },
                      { value: 'annual', label: 'Annual (-20%)' },
                    ]}
                  />
                  <p className="text-xs text-[#64748B]">
                    Active selection:{' '}
                    <span className="font-semibold text-[#172B4D] capitalize">
                      {demoBillingCycle}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vertical Sidebar Nav */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle>Vertical Navigation List</CardTitle>
                <CardDescription>
                  Mobile drawer and settings sidebar link rhythm (40px minimum
                  tap target).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {[
                    { id: 'home', label: 'Mess Overview', icon: Home },
                    { id: 'members', label: 'Residents & Rooms', icon: Users },
                    { id: 'ledger', label: 'Monthly Ledger', icon: CreditCard },
                    {
                      id: 'building',
                      label: 'Public Listing',
                      icon: Building2,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        href="#navigation"
                        variant="vertical"
                        active={demoVerticalNav === item.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setDemoVerticalNav(item.id);
                        }}
                        className="gap-2.5"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      {/* 9. Modal/Dialog, Loading States & Empty States */}
      <Section id="overlays" surface="white" spacing="md" className="scroll-mt-20">
        <Container className="space-y-10">
          <SectionHeader
            kicker="09 · Feedback & Overlays"
            title="Modal Dialogs, Loading Skeletons & Empty States"
            subtitle="Complete interaction patterns for confirmations, asynchronous loading transitions, and clear zero-data guidance."
          />

          {/* Dialog Showcase */}
          <Card>
            <CardHeader>
              <CardAction>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button variant="default">
                        <Layers className="h-4 w-4" aria-hidden="true" />
                        Open Confirmation Dialog
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finalize October Meal Statement?</DialogTitle>
                      <DialogDescription>
                        This locks meal counts and bazar entries for 18 active
                        members and publishes individual settlement breakdowns.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-xl border border-slate-200 bg-[#F8F9FE] p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Total Bazar Cost</span>
                        <span className="font-mono font-semibold text-[#172B4D] tabular-nums">
                          ৳38,700
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Total Meals Logged</span>
                        <span className="font-mono font-semibold text-[#172B4D] tabular-nums">
                          600 meals
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#172B4D]">
                          Calculated Meal Rate
                        </span>
                        <span className="font-mono font-bold text-[#324CDD] tabular-nums">
                          ৳64.50 / meal
                        </span>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose
                        render={<Button variant="outline">Cancel</Button>}
                      />
                      <Button
                        variant="default"
                        onClick={() => {
                          setDialogConfirmed(true);
                          setDialogOpen(false);
                        }}
                      >
                        Confirm Preview
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardAction>
              <CardTitle>Modal / Dialog Pattern</CardTitle>
              <CardDescription>
                Accessible keyboard-trapped modal built on shadcn/Base UI with a
                navy scrim, spacious 24px padding, and clear footer action
                hierarchy.
              </CardDescription>
            </CardHeader>
            {dialogConfirmed && (
              <CardContent>
                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-[#047857]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Dialog confirmation triggered cleanly (preview only).
                </div>
              </CardContent>
            )}
          </Card>

          {/* Interactive Loaded / Loading / Empty Switcher */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#172B4D]">
                  Async & Zero-Data States
                </h3>
                <p className="text-sm text-[#525F7F]">
                  Switch between Loaded, Loading, and Empty views to inspect
                  skeleton geometry and empty-state recovery actions.
                </p>
              </div>
              <SegmentedTabs
                ariaLabel="Preview module view state"
                value={moduleViewState}
                onChange={setModuleViewState}
                options={[
                  { value: 'loaded', label: 'Loaded' },
                  { value: 'loading', label: 'Loading' },
                  { value: 'empty', label: 'Empty State' },
                ]}
              />
            </div>

            {moduleViewState === 'loaded' && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-200 bg-[#F8F9FE] px-5 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  <span>Resident</span>
                  <span>Meals</span>
                  <span className="hidden sm:inline">Deposit</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {[
                    {
                      name: 'Tanvir Rahman',
                      room: 'Room 301 · Seat A',
                      meals: '42',
                      deposit: '৳3,000',
                      status: 'Refundable',
                      variant: 'success' as const,
                    },
                    {
                      name: 'Nafis Chowdhury',
                      room: 'Room 302 · Seat B',
                      meals: '48',
                      deposit: '৳2,800',
                      status: 'Due ৳296',
                      variant: 'warning' as const,
                    },
                    {
                      name: 'Sajidul Islam',
                      room: 'Room 304 · Single',
                      meals: '39',
                      deposit: '৳2,520',
                      status: 'Settled',
                      variant: 'info' as const,
                    },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="px-5 py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-medium text-[#172B4D]">
                          {row.name}
                        </div>
                        <div className="text-xs text-[#64748B]">{row.room}</div>
                      </div>
                      <span className="font-mono tabular-nums text-[#172B4D]">
                        {row.meals}
                      </span>
                      <span className="hidden sm:inline font-mono tabular-nums text-[#525F7F]">
                        {row.deposit}
                      </span>
                      <Badge variant={row.variant}>{row.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {moduleViewState === 'loading' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8F9FE] px-5 py-3.5">
                  <InlineLoader label="Synchronizing monthly meal sheet..." />
                  <span className="font-mono text-xs text-[#64748B]">
                    Skeleton Preview
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
                <TableRowsSkeleton rows={3} />
              </div>
            )}

            {moduleViewState === 'empty' && (
              <EmptyState
                icon={Filter}
                title="No matching rooms for this filter"
                description="Try clearing your price ceiling or switching neighborhoods to inspect verified student and bachelor mess openings."
                action={
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setModuleViewState('loaded')}
                  >
                    Restore Sample Rows
                  </Button>
                }
                secondaryAction={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModuleViewState('loading')}
                  >
                    Preview Skeletons
                  </Button>
                }
              />
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}
