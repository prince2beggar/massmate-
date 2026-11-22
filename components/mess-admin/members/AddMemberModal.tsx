'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  Tag,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  HeartHandshake,
  Utensils,
  Coins,
  Crown,
  User,
} from 'lucide-react';
import type { MemberDto } from '@/server/members/member-service';

interface AddMemberModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: (member: MemberDto) => void;
  roles?: Array<{ id: string; name: string; slug: string }>;
}

export function AddMemberModal({
  tenantSlug,
  isOpen,
  onClose,
  onMemberAdded,
  roles = [],
}: AddMemberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Default to General Member if present, else first available role
  const defaultRole = roles.find((r) => r.slug === 'member') || roles[0];
  const [roleId, setRoleId] = useState(defaultRole?.id || '');
  const [additionalRoles, setAdditionalRoles] = useState<string[]>([]);

  const [status, setStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [memberCode, setMemberCode] = useState('');
  const [joinedAt, setJoinedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedMember, setInvitedMember] = useState<MemberDto | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roleId && roles.length > 0) {
      const def = roles.find((r) => r.slug === 'member') || roles[0];
      if (def) setRoleId(def.id);
    }
  }, [roles, roleId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Member full name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Member phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetRoleId = roleId || roles.find((r) => r.slug === 'member')?.id || roles[0]?.id;
      if (!targetRoleId) {
        throw new Error('Please select a valid role.');
      }

      const selectedRole = roles.find((r) => r.id === targetRoleId);
      const combinedRoles = Array.from(new Set([
        selectedRole?.slug || 'member',
        ...additionalRoles,
      ]));

      const res = await fetch(`/api/v1/mess/${tenantSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          roleId: targetRoleId,
          assignedRoles: combinedRoles,
          status,
          memberCode: memberCode.trim() || null,
          joinedAt: status === 'ACTIVE' ? joinedAt : null,
          emergencyContactName: emergencyName.trim() || null,
          emergencyContactPhone: emergencyPhone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to create member');
      }

      onMemberAdded(json.data);

      if (status === 'PENDING') {
        setInvitedMember(json.data);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = invitedMember
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/member-portal?code=${invitedMember.memberCode || invitedMember.id}`
    : '';

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {invitedMember ? 'Member Invitation Ready' : 'Add New Resident / Member'}
              </h3>
              <p className="text-xs text-slate-500">
                Register or invite a member to this mess
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

        {invitedMember ? (
          // Invitation Link Display State
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-emerald-900">
                Invitation Created for {invitedMember.name}
              </p>
              <p>
                Status is marked as <span className="font-semibold text-amber-700">PENDING</span>. Share the registration link or member code below with the resident to complete their profile.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Invitation Link / Join Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Form State
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
                  placeholder="e.g. Asaduzzaman Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="+880 1700-000000"
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
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="resident@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Member Code (Optional)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. MM-005 (Auto if blank)"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Assigned Role / মূল ভূমিকা <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">ডিফল্ট: সাধারণ সদস্য</span>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'ACTIVE' | 'PENDING')
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="ACTIVE">Active (Direct Onboarding)</option>
                  <option value="PENDING">Pending (Invitation Link)</option>
                </select>
              </div>
            </div>

            {/* Multiple Roles / Additional Responsibilities Section (1+ roles) */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#324CDD]" />
                  <span>অতিরিক্ত দায়িত্ব / ভূমিকা (১+ রোল যুক্ত করতে টিক দিন)</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  Multi-Role Support
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                একজন মেম্বারকে সাধারণ সদস্যের পাশাপাশি মিল ম্যানেজার বা হিসাবরক্ষক হিসেবেও নিয়োগ দিতে পারেন। যাকে যে দায়িত্ব দেওয়া হবে, সে সিস্টেমের ঠিক ততটুকু এক্সেস পাবে:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${additionalRoles.includes('meal-manager') ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={additionalRoles.includes('meal-manager')}
                    onChange={(e) => {
                      if (e.target.checked) setAdditionalRoles([...additionalRoles, 'meal-manager']);
                      else setAdditionalRoles(additionalRoles.filter((r) => r !== 'meal-manager'));
                    }}
                    className="mt-0.5 rounded text-[#324CDD]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">🍲 মিল ম্যানেজার (Meal Manager)</span>
                    <span className="text-[10px] text-slate-500 font-normal block">মিলের হিসাব, দৈনিক মিল এন্ট্রি ও বন্ধের রিকোয়েস্ট</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${additionalRoles.includes('accountant') ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={additionalRoles.includes('accountant')}
                    onChange={(e) => {
                      if (e.target.checked) setAdditionalRoles([...additionalRoles, 'accountant']);
                      else setAdditionalRoles(additionalRoles.filter((r) => r !== 'accountant'));
                    }}
                    className="mt-0.5 rounded text-[#324CDD]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">💰 হিসাবরক্ষক (Finance Manager)</span>
                    <span className="text-[10px] text-slate-500 font-normal block">বাজার খরচ, মাসিক বিলিং, পেমেন্ট ও বাজেট হিসাব</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${additionalRoles.includes('admin') ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={additionalRoles.includes('admin')}
                    onChange={(e) => {
                      if (e.target.checked) setAdditionalRoles([...additionalRoles, 'admin']);
                      else setAdditionalRoles(additionalRoles.filter((r) => r !== 'admin'));
                    }}
                    className="mt-0.5 rounded text-[#324CDD]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">🛡️ সহ-এডমিন (Co-Admin)</span>
                    <span className="text-[10px] text-slate-500 font-normal block">পূর্ণ এডমিন সুবিধা (মেসে ১+ এডমিন নিয়োগ সম্ভব)</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${additionalRoles.includes('moderator') ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    checked={additionalRoles.includes('moderator')}
                    onChange={(e) => {
                      if (e.target.checked) setAdditionalRoles([...additionalRoles, 'moderator']);
                      else setAdditionalRoles(additionalRoles.filter((r) => r !== 'moderator'));
                    }}
                    className="mt-0.5 rounded text-[#324CDD]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">📢 সমন্বয়ক (Moderator)</span>
                    <span className="text-[10px] text-slate-500 font-normal block">নোটিশ প্রকাশ, মেস মিটিং ও কমপ্লেইন তদারকি</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Join Date if Active */}
            {status === 'ACTIVE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Move-In / Join Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={joinedAt}
                    onChange={(e) => setJoinedAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                <span>Emergency Contact (Private)</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Father/Guardian)"
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

            {/* Staff Internal Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Staff-Only Notes
              </label>
              <textarea
                rows={2}
                placeholder="Internal administrative comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Footer Buttons */}
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
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : status === 'ACTIVE' ? 'Add Member' : 'Create Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
