'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Bed,
  ShoppingCart,
  CreditCard,
  Utensils,
  Megaphone,
  BarChart3,
  Settings,
  Lock,
  Clock,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { MessDashboardOverviewDto } from '@/server/mess-admin/mess-dashboard-service';
import { cn } from '@/lib/utils';

interface MessQuickActionsBarProps {
  quickActions: MessDashboardOverviewDto['quickActions'];
}

const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  Bed,
  ShoppingCart,
  CreditCard,
  Utensils,
  Megaphone,
  BarChart3,
  Settings,
};

export function MessQuickActionsBar({ quickActions }: MessQuickActionsBarProps) {
  const [activeModalAction, setActiveModalAction] = useState<
    MessDashboardOverviewDto['quickActions'][0] | null
  >(null);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Administrative Quick Actions
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Role-gated operational shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((action) => {
            const Icon = ICON_MAP[action.icon] || Zap;

            if (!action.isAllowed) {
              // Permission Denied / Locked State
              return (
                <div
                  key={action.id}
                  className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center opacity-60 cursor-not-allowed"
                  title={`Permission required: ${action.permission}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-400 mb-2">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 line-clamp-1">
                    {action.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">Locked</span>
                </div>
              );
            }

            if (!action.isImplemented) {
              // Allowed by Role, but Module is Roadmap / Coming Soon
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActiveModalAction(action)}
                  className="group flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 text-center hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2 transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {action.label}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    <span>Upcoming</span>
                  </span>
                </button>
              );
            }

            // Fully Implemented Direct Link
            return (
              <Link
                key={action.id}
                href={action.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-white p-3 text-center hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white mb-2 shadow-xs transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 line-clamp-1">
                  {action.label}
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 mt-0.5">
                  Action
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Modal for Unimplemented Actions */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveModalAction(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Clock className="h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-900">
                  Feature In Development
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalAction(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-sm font-bold text-slate-800">
                {activeModalAction.label}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeModalAction.moduleNote ||
                  'This operational module is scheduled on the development roadmap.'}
              </p>
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">
                  Role Authorization Verified:
                </p>
                <p>
                  Your current role holds the required capability (
                  <code className="text-emerald-700 font-mono text-[11px]">
                    {activeModalAction.permission}
                  </code>
                  ). The backend and user interface will be enabled when its respective
                  task commences.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModalAction(null)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
