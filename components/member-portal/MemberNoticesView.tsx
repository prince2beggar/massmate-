'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  Clock,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type { MemberNoticeDto } from '@/server/member-portal/member-portal-service';

interface MemberNoticesViewProps {
  tenantSlug: string;
  initialData?: MemberNoticeDto[] | null;
}

const CATEGORY_MAP: Record<string, string> = {
  ALL: 'All Categories',
  GENERAL: 'General',
  DINING: 'Dining & Kitchen',
  MAINTENANCE: 'Maintenance',
  FINANCE: 'Finance & Bills',
  EMERGENCY: 'Emergency',
};

const PRIORITY_BADGES: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  HIGH: { label: 'High Priority', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  NORMAL: { label: 'Notice', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  LOW: { label: 'Info', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function MemberNoticesView({ tenantSlug, initialData }: MemberNoticesViewProps) {
  const [notices, setNotices] = useState<MemberNoticeDto[] | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialData && category === 'ALL') {
      return;
    }

    let isMounted = true;
    const url = `/api/v1/portal/${tenantSlug}/notices${
      category !== 'ALL' ? `?category=${category}` : ''
    }`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch notices.');
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setNotices(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Error fetching notices.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, category, initialData]);

  const filteredNotices = (notices || []).filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  if (loading && !notices) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading mess announcements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mess Notice Board</h1>
        <p className="text-sm text-slate-500 mt-1">
          Official notices, schedule updates, and important announcements from mess administration.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(CATEGORY_MAP).map((catKey) => (
            <button
              key={catKey}
              onClick={() => setCategory(catKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === catKey
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_MAP[catKey]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-xs font-semibold text-rose-800">{error}</p>
        </div>
      )}

      {/* Notices List */}
      {filteredNotices.length > 0 ? (
        <div className="space-y-4">
          {filteredNotices.map((n) => {
            const priorityInfo = PRIORITY_BADGES[n.priority] || PRIORITY_BADGES.NORMAL;

            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border shadow-xs p-6 space-y-3 transition-colors ${
                  n.isPinned
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Pin className="h-3 w-3 fill-amber-700" />
                        Pinned Notice
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityInfo.color}`}
                    >
                      {priorityInfo.label}
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {n.category}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {n.publishedAt}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{n.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Notices Published</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No notices match your search keywords.'
              : 'There are currently no active announcements for this category.'}
          </p>
        </div>
      )}
    </div>
  );
}
