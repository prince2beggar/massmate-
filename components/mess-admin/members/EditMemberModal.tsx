'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Phone,
  Mail,
  Tag,
  HeartHandshake,
  AlertCircle,
  Shield,
  ShieldCheck,
  Utensils,
  Coins,
  Check,
} from 'lucide-react';
import type { MemberDto } from '@/server/members/member-service';

interface EditMemberModalProps {
  tenantSlug: string;
  member: MemberDto | null;
  isOpen: boolean;
  onClose: () => void;
  onMemberUpdated: (member: MemberDto) => void;
  roles?: Array<{ id: string; name: string; slug: string; description?: string }>;
}

export function EditMemberModal({
  tenantSlug,
  member,
  isOpen,
  onClose,
  onMemberUpdated,
  roles = [],
}: EditMemberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [roleId, setRoleId] = useState('');
  const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize internal state whenever selected member or roles change
  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setMemberCode(member.memberCode || '');
      setEmergencyName(member.emergencyContactName || '');
      setEmergencyPhone(member.emergencyContactPhone || '');
      setNotes(member.notes || '');

      const currentRole = roles.find(
        (r) => r.id === member.roleId || r.slug === member.roleSlug
      );
      setRoleId(currentRole?.id || member.roleId || roles[0]?.id || '');

      const primarySlug = currentRole?.slug || member.roleSlug || 'member';
      const assigned = member.assignedRoles || [primarySlug];
      const extra = assigned.filter((s) => s !== primarySlug);
      setAdditionalRoles(extra);
      setError(null);
    }
  }, [member, roles]);

  if (!isOpen || !member) return null;

  const toggleAdditionalRole = (roleSlug: string) => {
    setAdditionalRoles((prev) =>
      prev.includes(roleSlug)
        ? prev.filter((r) => r !== roleSlug)
        : [...prev, roleSlug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Member name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedRole = roles.find((r) => r.id === roleId);
      const primarySlug = selectedRole?.slug || member.roleSlug || 'member';
      const combinedAssignedRoles = Array.from(
        new Set([primarySlug, ...additionalRoles])
      );

      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/members/${member.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || null,
            roleId: roleId || undefined,
            assignedRoles: combinedAssignedRoles,
            memberCode: memberCode.trim() || null,
            emergencyContactName: emergencyName.trim() || null,
            emergencyContactPhone: emergencyPhone.trim() || null,
            notes: notes.trim() || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.message || 'Failed to update member'
        );
      }

      onMemberUpdated(json.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Member Information
              </h3>
              <p className="text-xs text-slate-500">{member.name}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Email & Member Code */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Member Code
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Role & Multi-Role Responsibilities */}
          {roles.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Assigned Role / মূল ভূমিকা <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">মেসের প্রধান পদবী</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Role Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>অতিরিক্ত দায়িত্ব / Multi-Role (১+ সিলেক্ট করতে পারেন)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    ১+ ভূমিকা
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label
                    onClick={() => toggleAdditionalRole('meal-manager')}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      additionalRoles.includes('meal-manager')
                        ? 'border-amber-400 bg-amber-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={additionalRoles.includes('meal-manager')}
                      onChange={() => {}}
                      className="mt-0.5 h-3 w-3 rounded text-amber-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                        <Utensils className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>মিলের দায়িত্ব (Meal)</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        হিসাব ও বাজার তদারকি
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => toggleAdditionalRole('accountant')}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      additionalRoles.includes('accountant')
                        ? 'border-emerald-400 bg-emerald-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={additionalRoles.includes('accountant')}
                      onChange={() => {}}
                      className="mt-0.5 h-3 w-3 rounded text-emerald-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                        <Coins className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>হিসাবের দায়িত্ব (Finance)</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        জমা-খরচ ও পেমেন্ট রেকর্ড
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => toggleAdditionalRole('admin')}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      additionalRoles.includes('admin')
                        ? 'border-indigo-400 bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={additionalRoles.includes('admin')}
                      onChange={() => {}}
                      className="mt-0.5 h-3 w-3 rounded text-indigo-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900">
                        <Shield className="h-3 w-3 text-indigo-600 shrink-0" />
                        <span>সহ-এডমিন (Co-Admin)</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        মেসের সামগ্রিক পরিচালনা
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => toggleAdditionalRole('moderator')}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      additionalRoles.includes('moderator')
                        ? 'border-purple-400 bg-purple-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={additionalRoles.includes('moderator')}
                      onChange={() => {}}
                      className="mt-0.5 h-3 w-3 rounded text-purple-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-purple-900">
                        <ShieldCheck className="h-3 w-3 text-purple-600 shrink-0" />
                        <span>সমন্বয়ক (Moderator)</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        শৃঙ্খলা ও নোটিশ তদারকি
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <HeartHandshake className="h-4 w-4 text-emerald-600" />
              <span>Emergency Contact</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Emergency Contact Name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
              <input
                type="text"
                placeholder="Emergency Phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
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
                'Saving...'
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
