'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Mail,
  Shield,
  Tag,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  HeartHandshake,
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
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
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

      const targetRoleId = roleId || roles[0]?.id;
      if (!targetRoleId) {
        throw new Error('Please select a valid role.');
      }

      const res = await fetch(`/api/v1/mess/${tenantSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          roleId: targetRoleId,
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
        throw new Error(json.error?.message || 'Failed to create member');
      }

      onMemberAdded(json.data);

      if (status === 'PENDING') {
        setInvitedMember(json.data);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
                <label className="text-xs font-semibold text-slate-700">
                  Assigned Role <span className="text-rose-500">*</span>
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
