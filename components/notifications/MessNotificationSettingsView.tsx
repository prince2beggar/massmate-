'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  Moon,
  Plus,
  Radio,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  NotificationPreferenceDto,
  ScheduledReminderDto,
} from '@/server/notifications/tenant-notification-service';

interface MessNotificationSettingsViewProps {
  tenantSlug: string;
  tenantName: string;
}

export function MessNotificationSettingsView({
  tenantSlug,
  tenantName,
}: MessNotificationSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'PREFERENCES' | 'REMINDERS'>('PREFERENCES');

  // Preferences state
  const [preferences, setPreferences] = useState<NotificationPreferenceDto | null>(null);
  const [prefLoading, setPrefLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [mealsEnabled, setMealsEnabled] = useState(true);
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [complaintsEnabled, setComplaintsEnabled] = useState(true);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [noticesEnabled, setNoticesEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Reminders state
  const [reminders, setReminders] = useState<ScheduledReminderDto[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminderType, setNewReminderType] = useState('MEAL_CUTOFF');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [newReminderAudience, setNewReminderAudience] = useState('ACTIVE_MEMBERS');
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/v1/mess/${tenantSlug}/notifications/preferences`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          const d: NotificationPreferenceDto = json.data;
          setPreferences(d);
          setQuietHoursEnabled(d.quietHoursEnabled);
          setQuietHoursStart(d.quietHoursStart || '22:00');
          setQuietHoursEnd(d.quietHoursEnd || '07:00');
          setMealsEnabled(d.mealsEnabled);
          setBillingEnabled(d.billingEnabled);
          setComplaintsEnabled(d.complaintsEnabled);
          setEventsEnabled(d.eventsEnabled);
          setNoticesEnabled(d.noticesEnabled);
          setRemindersEnabled(d.remindersEnabled);
        }
      })
      .catch((err) => {
        console.error('[NotificationSettings] Fetch preferences error:', err);
      })
      .finally(() => {
        if (isMounted) setPrefLoading(false);
      });

    fetch(`/api/v1/mess/${tenantSlug}/notifications/reminders`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setReminders(json.data);
        }
      })
      .catch((err) => {
        console.error('[NotificationSettings] Fetch reminders error:', err);
      })
      .finally(() => {
        if (isMounted) setRemindersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPref(true);
    setPrefFeedback(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inAppEnabled: true,
          emailEnabled: false,
          smsEnabled: false,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          mealsEnabled,
          billingEnabled,
          complaintsEnabled,
          eventsEnabled,
          noticesEnabled,
          remindersEnabled,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPreferences(json.data);
        setPrefFeedback({ type: 'success', message: 'Notification preferences saved successfully.' });
      } else {
        setPrefFeedback({ type: 'error', message: json.error?.message || 'Failed to save preferences.' });
      }
    } catch (err: any) {
      setPrefFeedback({ type: 'error', message: err.message || 'Network error saving preferences.' });
    } finally {
      setSavingPref(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingReminder(true);
    setReminderError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderType: newReminderType,
          title: newReminderTitle,
          message: newReminderMessage,
          targetAudience: newReminderAudience,
          scheduleTime: newReminderTime,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setReminders((prev) => [json.data, ...prev]);
        setShowAddReminderModal(false);
        setNewReminderTitle('');
        setNewReminderMessage('');
      } else {
        setReminderError(json.error?.message || 'Failed to create reminder.');
      }
    } catch (err: any) {
      setReminderError(err.message || 'Network error creating reminder.');
    } finally {
      setCreatingReminder(false);
    }
  };

  const handleToggleReminder = async (reminderId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        const json = await res.json();
        setReminders((prev) =>
          prev.map((r) => (r.id === reminderId ? { ...r, isActive: json.data.isActive } : r))
        );
      }
    } catch (err) {
      console.error('[NotificationSettings] Toggle reminder error:', err);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled reminder?')) return;

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/notifications/reminders/${reminderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      }
    } catch (err) {
      console.error('[NotificationSettings] Delete reminder error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href={`/mess/${tenantSlug}/notifications`} className="hover:text-slate-800">
            Notification Center
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Settings & Reminders</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Delivery Preferences & Reminders
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage delivery channels, quiet hours, category subscriptions, and automated staff reminders for {tenantName}.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start sm:self-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('PREFERENCES')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'PREFERENCES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivery Channels & Quiet Hours
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REMINDERS')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'REMINDERS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled Reminders ({reminders.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'PREFERENCES' && (
        <div className="space-y-6">
          {/* Section 1: Real Delivery Channels Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Supported Delivery Channels</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* In-App */}
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">In-App Notifications</h3>
                      <p className="text-[10px] text-slate-500">Mess Admin & Member Portal</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Instant bell badges, popover drawers, and full-page notification feeds for resident dining, billing, and operational requests.
                </p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 opacity-80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Email (SMTP)</h3>
                      <p className="text-[10px] text-slate-500">Transactional Email</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    NOT CONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  External SMTP delivery provider is unconfigured in system settings. In-app alerts remain the primary active delivery mechanism.
                </p>
              </div>

              {/* SMS */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 opacity-80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">SMS Gateway</h3>
                      <p className="text-[10px] text-slate-500">BD Masking SMS</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    NOT CONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Bangladeshi SMS gateway (e.g. SSL Wireless / Greenweb) is unconfigured. Simulated SMS is strictly disabled per production policy.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Preferences Form */}
          <form onSubmit={handleSavePreferences} className="space-y-6">
            {prefFeedback && (
              <div
                className={`rounded-xl p-4 text-xs font-semibold border ${
                  prefFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {prefFeedback.message}
              </div>
            )}

            {/* Quiet Hours */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Quiet Hours (Asia/Dhaka)</h2>
                    <p className="text-xs text-slate-500">
                      Mute non-urgent routine notifications during designated resting hours. Mandatory billing notices remain active.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {quietHoursEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quiet Hours Start (Asia/Dhaka)
                    </label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quiet Hours End (Asia/Dhaka)
                    </label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category Preferences */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Category Delivery Toggles</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Dining */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Meal & Dining Updates</p>
                    <p className="text-[11px] text-slate-500">Cutoff warnings, menu changes, and meal-off request approvals.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={mealsEnabled}
                    onChange={(e) => setMealsEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {/* Billing */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Billing & Payment Confirmations</p>
                    <p className="text-[11px] text-slate-500">Monthly statement publications and bKash/Nagad verification alerts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={billingEnabled}
                    onChange={(e) => setBillingEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {/* Complaints */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Complaints & Grievances</p>
                    <p className="text-[11px] text-slate-500">Status resolutions and admin responses to maintenance requests.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={complaintsEnabled}
                    onChange={(e) => setComplaintsEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {/* Events */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Community Events & Feasts</p>
                    <p className="text-[11px] text-slate-500">Mess meetings, cleaning drives, and special feasts announcements.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventsEnabled}
                    onChange={(e) => setEventsEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {/* Notices */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Official Notices & Room Requests</p>
                    <p className="text-[11px] text-slate-500">Broad announcements and room transfer workflow updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={noticesEnabled}
                    onChange={(e) => setNoticesEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>

                {/* Reminders */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Scheduled Operational Reminders</p>
                    <p className="text-[11px] text-slate-500">Payment due reminders and automated mess operational alerts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPref || prefLoading}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {savingPref ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'REMINDERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Automated Staff Reminders</h2>
              <p className="text-xs text-slate-500">
                Configure operational schedules for lunch/dinner cutoffs, pending dues, and upcoming events.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddReminderModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Configure New Reminder
            </button>
          </div>

          {/* Reminders List */}
          {remindersLoading ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">Loading reminder configurations...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 text-center px-4">
              <Clock className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-800">No scheduled reminders configured</p>
              <p className="text-xs text-slate-400 mt-0.5">Click &quot;Configure New Reminder&quot; above to set up daily cutoffs or payment alerts.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {rem.reminderType.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{rem.title}</h4>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-semibold border ${
                          rem.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {rem.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rem.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Clock className="h-3 w-3 text-slate-400" /> Daily at {rem.scheduleTime} (Asia/Dhaka)
                      </span>
                      <span>Target: {rem.targetAudience.replace('_', ' ')}</span>
                      {rem.creatorName && <span>By {rem.creatorName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(rem.id, rem.isActive)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                        rem.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {rem.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Reminder Modal */}
          {showAddReminderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Configure Scheduled Reminder</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddReminderModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {reminderError && (
                  <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    {reminderError}
                  </div>
                )}

                <form onSubmit={handleCreateReminder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Type</label>
                    <select
                      value={newReminderType}
                      onChange={(e) => setNewReminderType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    >
                      <option value="MEAL_CUTOFF">Meal Cutoff Reminder</option>
                      <option value="UPCOMING_PAYMENT">Upcoming Payment Due Date</option>
                      <option value="OUTSTANDING_BALANCE">Outstanding Balance Alert</option>
                      <option value="EVENT_REMINDER">Event & Feast Notice</option>
                      <option value="MAINTENANCE_DUE">Maintenance Routine Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                    <select
                      value={newReminderAudience}
                      onChange={(e) => setNewReminderAudience(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    >
                      <option value="ACTIVE_MEMBERS">Active Resident Members</option>
                      <option value="ALL_MEMBERS">All Members (Active & Invited)</option>
                      <option value="UNPAID_MEMBERS">Members with Outstanding Dues</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Trigger Time (Asia/Dhaka)
                    </label>
                    <input
                      type="time"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Title</label>
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="e.g. Lunch Cutoff in 30 Minutes"
                      required
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Message</label>
                    <textarea
                      value={newReminderMessage}
                      onChange={(e) => setNewReminderMessage(e.target.value)}
                      placeholder="e.g. Lunch dining bookings close promptly at 09:30 AM Asia/Dhaka. Please check your dining status in the portal."
                      required
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddReminderModal(false)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingReminder}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {creatingReminder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Reminder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
