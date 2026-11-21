import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMessAdminSession } from '@/server/mess-admin/mess-session';
import { MessAdminLayoutShell } from '@/components/mess-admin/MessAdminLayoutShell';

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
    title: `${cleanName} — Mess Admin Dashboard | MessMate`,
    description: `Central mess operations workspace and financial ledger for ${cleanName}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function MessAdminLayout({
  children,
  params,
}: LayoutProps) {
  const { tenantSlug } = await params;

  if (!tenantSlug) {
    notFound();
  }

  const session = await getMessAdminSession(tenantSlug);

  // If no session or user lacks access, redirect to login
  if (!session) {
    redirect(`/mess-admin-login?error=unauthorized&tenant=${encodeURIComponent(tenantSlug)}`);
  }

  return (
    <MessAdminLayoutShell
      tenantSlug={tenantSlug}
      tenantName={session.tenantContext.tenantName}
      tenantContext={session.tenantContext}
      accessibleMesses={session.accessibleMesses}
      userName={session.userName}
      userEmail={session.userEmail}
    >
      {children}
    </MessAdminLayoutShell>
  );
}
