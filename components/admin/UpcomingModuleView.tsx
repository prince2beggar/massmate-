import React from 'react';
import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface UpcomingModuleViewProps {
  title: string;
  modulePhase: string;
  icon: LucideIcon;
  description: string;
  plannedFeatures: string[];
}

export function UpcomingModuleView({
  title,
  modulePhase,
  icon: Icon,
  description,
  plannedFeatures,
}: UpcomingModuleViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {modulePhase}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Main Status Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4">
          <Icon className="h-7 w-7" />
        </div>

        <h2 className="text-base font-bold text-slate-900">
          {title} Module Scheduled for Implementation
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
          This section is part of the MessMate multi-phase SaaS roadmap. The platform authorization
          boundary and navigation routing are active, and backend business logic will connect in upcoming tasks.
        </p>

        {/* Planned Capabilities */}
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Planned Module Capabilities
          </span>
          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
            {plannedFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
