'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Crown,
  Utensils,
  Coins,
  User,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { MemberDto } from '@/server/members/member-service';
import { STANDARD_MESS_ROLES } from '@/server/rbac/role-templates';

interface QuickRoleModalProps {
  tenantSlug: string;
  member: MemberDto | null;
  roles?: Array<{ id: string; name: string; slug: string; description?: string }>;
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated: (member: MemberDto) => void;
}

export function QuickRoleModal({
  tenantSlug,
  member,
  roles = [],
  isOpen,
  onClose,
  onRoleUpdated,
}: QuickRoleModalProps) {
  const effectiveRoles = roles && roles.length > 0 ? roles : STANDARD_MESS_ROLES;

  const [roleId, setRoleId] = useState('');
  const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      const currentRole = effectiveRoles.find(
        (r) => r.id === member.roleId || r.slug === member.roleSlug
      );
      setRoleId(currentRole?.id || member.roleId || effectiveRoles[0]?.id || '');

      const primarySlug = currentRole?.slug || member.roleSlug || 'member';
      const assigned = member.assignedRoles || [primarySlug];
      const extra = assigned.filter((slug) => slug !== primarySlug);
      setAdditionalRoles(extra);
      setError(null);
    }
  }, [member, effectiveRoles]);

  if (!isOpen || !member) return null;

  const toggleAdditionalRole = (roleSlug: string) => {
    setAdditionalRoles((prev) =>
      prev.includes(roleSlug)
        ? prev.filter((r) => r !== roleSlug)
        : [...prev, roleSlug]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) {
      setError('Please select a primary role.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedRole = effectiveRoles.find((r) => r.id === roleId || r.slug === roleId);
      const primarySlug = selectedRole?.slug || member.roleSlug || 'member';
      const combinedRoles = Array.from(
        new Set([primarySlug, ...additionalRoles])
      );

      const res = await fetch(`/api/v1/mess/${tenantSlug}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          assignedRoles: combinedRoles,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || json.error?.message || 'Failed to update member role'
        );
      }

      onRoleUpdated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                দায়িত্ব ও ভূমিকা পরিবর্তন (Change Role)
              </h3>
              <p className="text-xs text-slate-500">
                {member.name} ({member.phone || member.memberCode || 'Member'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Primary Role Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>মূল ভূমিকা (Primary Role) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400">ডিফল্ট: সাধারণ সদস্য বা ওনার</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 bg-white font-medium"
              >
                {effectiveRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Responsibilities (1+ Roles) */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>অতিরিক্ত দায়িত্ব / Multi-Role (১+ সিলেক্ট করুন)</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                ১+ ভূমিকা প্রযোজ্য
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              যেকোনো সদস্যকে মূল ভূমিকার পাশাপাশি নির্দিষ্ট দায়িত্ব (যেমন: মিল ম্যানেজার, হিসাবের দায়িত্ব) দেওয়া যাবে।
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              {/* Meal Manager */}
              <label
                onClick={() => toggleAdditionalRole('meal-manager')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  additionalRoles.includes('meal-manager')
                    ? 'border-amber-400 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={additionalRoles.includes('meal-manager')}
                  onChange={() => {}}
                  className="mt-0.5 h-3.5 w-3.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900">
                    <Utensils className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>মিলের দায়িত্ব (Meal)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    দৈনিক মিল কাউন্ট, মিল অন/অফ ও বাজার তদারকি
                  </p>
                </div>
              </label>

              {/* Finance / Accountant */}
              <label
                onClick={() => toggleAdditionalRole('accountant')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  additionalRoles.includes('accountant')
                    ? 'border-emerald-400 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={additionalRoles.includes('accountant')}
                  onChange={() => {}}
                  className="mt-0.5 h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-900">
                    <Coins className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>হিসাবের দায়িত্ব (Finance)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    মেসের জমা-খরচ, ক্যাশ হিসাব ও পেমেন্ট রেকর্ড
                  </p>
                </div>
              </label>

              {/* Co-Admin */}
              <label
                onClick={() => toggleAdditionalRole('admin')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  additionalRoles.includes('admin')
                    ? 'border-indigo-400 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={additionalRoles.includes('admin')}
                  onChange={() => {}}
                  className="mt-0.5 h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-900">
                    <Shield className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>সহ-এডমিন (Co-Admin)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    মেসের সামগ্রিক ব্যবস্থাপনা ও সহকারী এডমিন
                  </p>
                </div>
              </label>

              {/* Moderator */}
              <label
                onClick={() => toggleAdditionalRole('moderator')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  additionalRoles.includes('moderator')
                    ? 'border-purple-400 bg-purple-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={additionalRoles.includes('moderator')}
                  onChange={() => {}}
                  className="mt-0.5 h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-xs font-bold text-purple-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span>সমন্বয়ক (Moderator)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    মেসের শৃঙ্খলা, নোটিশ ও অভিযোগ তদারকি
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                'সংরক্ষণ হচ্ছে...'
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>রোল সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
