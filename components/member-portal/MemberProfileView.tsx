'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  IdCard,
  Building,
  AlertTriangle,
  Save,
} from 'lucide-react';
import type { MemberProfileDto } from '@/server/member-portal/member-portal-service';

interface MemberProfileViewProps {
  tenantSlug: string;
  initialData?: MemberProfileDto | null;
}

export function MemberProfileView({ tenantSlug, initialData }: MemberProfileViewProps) {
  const [profile, setProfile] = useState<MemberProfileDto | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [emergencyContactName, setEmergencyContactName] = useState(initialData?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initialData?.emergencyContactPhone || '');
  const [avatar, setAvatar] = useState(initialData?.avatar || '');

  const initForm = useCallback((data: MemberProfileDto) => {
    setName(data.name || '');
    setPhone(data.phone || '');
    setEmergencyContactName(data.emergencyContactName || '');
    setEmergencyContactPhone(data.emergencyContactPhone || '');
    setAvatar(data.avatar || '');
  }, []);

  useEffect(() => {
    if (initialData) {
      return;
    }

    let isMounted = true;
    fetch(`/api/v1/portal/${tenantSlug}/profile`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load profile details.');
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setProfile(json.data);
          initForm(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Error fetching profile.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, initialData, initForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() !== profile?.name ? name.trim() : undefined,
          phone: phone.trim() || null,
          emergencyContactName: emergencyContactName.trim() || null,
          emergencyContactPhone: emergencyContactPhone.trim() || null,
          avatar: avatar.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error?.message || 'Failed to update profile.');
      }

      setProfile(json.data);
      initForm(json.data);
      setSuccessMessage(json.message || 'Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading your profile details...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-semibold text-rose-800">Failed to load profile</h3>
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isNameChanged = name.trim() !== '' && name.trim() !== (profile?.name || '');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner / Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          {avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatar}
              alt={profile?.name || 'Member'}
              className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-emerald-500/10">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'M'}
            </div>
          )}
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
            {profile?.status || 'ACTIVE'}
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile?.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 w-fit mx-auto sm:mx-0">
              {profile?.roleName || 'Resident Member'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <IdCard className="h-4 w-4 text-slate-400" />
              Member ID: <strong className="text-slate-700">{profile?.memberCode || 'Unassigned'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="h-4 w-4 text-slate-400" />
              Mess: <strong className="text-slate-700">{profile?.tenantName}</strong>
            </span>
            {profile?.joinedAt && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                Joined: <strong className="text-slate-700">{profile.joinedAt}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-rose-800">{error}</p>
        </div>
      )}

      {/* Security & Policy Guidance Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900 space-y-1">
          <p className="font-semibold">Self-Service Profile Security Policy</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            You can directly update your phone number, emergency contacts, and profile photo. For security and audit records, legal name updates require Mess Admin approval before taking effect. Financial ledger entries and membership role tiers are managed strictly by management.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Personal Details */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Personal Information
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Prince Hasan"
                  required
                />
                {isNameChanged && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Modifying your name will submit a Name Change Request to the Mess Admin.
                  </p>
                )}
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address <span className="text-xs text-slate-400 font-normal">(Authoritative Login)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile?.email || 'No email registered'}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <Mail className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Phone Number (Directly Editable) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    placeholder="01XXXXXXXXX"
                  />
                  <Phone className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  11-digit Bangladeshi mobile number (e.g. 01712345678).
                </p>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Avatar / Profile Photo URL
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Emergency Contact Information
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Emergency Contact Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Parent, Guardian or Sibling"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emergency Contact Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    placeholder="01XXXXXXXXX"
                  />
                  <Phone className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Used by mess management in case of medical or urgent notices.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Read-Only System Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              System Membership Records
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Member ID Code
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-800">
                  {profile?.memberCode || 'Pending Assignment'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Role
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-800">
                  {profile?.roleName || 'Resident Member'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Membership Status
                </span>
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => profile && initForm(profile)}
            disabled={saving}
            className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
