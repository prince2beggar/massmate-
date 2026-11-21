'use client';

import React from 'react';
import { Sparkles, Calendar, Clock, MapPin } from 'lucide-react';

interface MessWelcomeBannerProps {
  greeting: string;
  messName: string;
  currentDate: string;
  currentMonth: string;
  summary: string;
  timezone?: string;
  activeMembers?: number;
}

export function MessWelcomeBanner({
  greeting,
  messName,
  currentDate,
  currentMonth,
  summary,
  timezone = 'Asia/Dhaka',
  activeMembers = 0,
}: MessWelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 text-white shadow-sm sm:p-8">
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{greeting}, Admin</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
            {messName}
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Right Info Pill */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-800/80 p-3 text-xs border border-slate-700/60 backdrop-blur-xs md:flex-col md:items-end md:gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{timezone}</span>
            </span>
            <span>•</span>
            <span className="text-emerald-300 font-semibold">
              {activeMembers} Active Member{activeMembers === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
