import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMemberPortalSession } from '@/server/member-portal/member-session';
import { MemberPortalLayoutShell } from '@/components/member-portal/MemberPortalLayoutShell';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const cleanName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: `${cleanName} — Member Portal | MessMate`,
    description: `Resident member workspace, dining schedules, and financial ledger for ${cleanName}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function MemberPortalLayout({
  children,
  params,
}: LayoutProps) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMemberPortalSession(tenantSlug);

  // If no session or user lacks resident access to this mess, redirect
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized_member&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  return (
    <MemberPortalLayoutShell
      tenantSlug={tenantSlug}
      tenantName={session.tenantName}
      tenantLogo={session.tenantLogo}
      memberName={session.userName}
      memberRole={session.roleName}
      memberStatus={session.membershipStatus}
    >
      {children}
    </MemberPortalLayoutShell>
  );
}
