import React from 'react';
import type { Metadata } from 'next';
import { MessPollManagementView } from '@/components/polls/MessPollManagementView';

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
    title: `Community Polls & Feedback — ${cleanName} | MessMate`,
    description: `Manage community polls, voting rules, and member suggestions for ${cleanName}.`,
  };
}

export default async function MessPollsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const cleanName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <MessPollManagementView
      tenantSlug={tenantSlug}
      tenantName={cleanName}
    />
  );
}
