'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Phone,
  FileText,
} from 'lucide-react';
import type { VisitorDto, VisitPurpose } from '@/server/visitors/visitor-service';

interface PortalVisitorCenterViewProps {
  tenantSlug: string;
}

export function PortalVisitorCenterView({ tenantSlug }: PortalVisitorCenterViewProps) {
  const [visitors, setVisitors] = useState<VisitorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showPreRegModal, setShowPreRegModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPurpose, setFormPurpose] = useState<VisitPurpose>('FRIEND');
  const [formExpectedArrival, setFormExpectedArrival] = useState('');
  const [formNumVisitors, setFormNumVisitors] = useState('1');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/portal/${tenantSlug}/visitors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setVisitors(json.data);
        }
      })
      .catch((err) => console.error('[PortalVisitorView] Fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/visitors`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setVisitors(json.data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: formName,
          visitorPhone: formPhone.trim() || undefined,
          visitPurpose: formPurpose,
          expectedArrival: new Date(formExpectedArrival).toISOString(),
          numberOfVisitors: parseInt(formNumVisitors, 10) || 1,
          notes: formNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to submit visitor request.');
      }

      setShowPreRegModal(false);
      setFormName('');
      setFormPhone('');
      setFormExpectedArrival('');
      setFormNotes('');
      setFormNumVisitors('1');
      setActionSuccess('Expected visitor request registered and sent to management for approval.');
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to register visitor.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancel = async (visitorId: string) => {
    if (!confirm('Are you sure you want to cancel this visitor request?')) return;
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/visitors/${visitorId}/cancel`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to cancel request.');
      }
      handleRefresh();
    } catch (err: any) {
      alert(err?.message || 'Cancel failed.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Checked In (Inside)</span>;
      case 'CHECKED_OUT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">Checked Out</span>;
      case 'PENDING_APPROVAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pending Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Rejected</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Expected Visitors</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pre-register expected family, friends, or study partners so the gate security can facilitate smooth entry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setShowPreRegModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Pre-Register Visitor</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <UserCheck className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-medium">No visitor requests registered yet.</p>
            <p className="text-xs text-zinc-400">Pre-register your guests before they arrive at the mess gate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Visitor Name</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Expected Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gate Notes / Response</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{v.visitorName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{v.referenceNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {v.visitPurpose.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {v.formattedExpectedArrival}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(v.status)}</td>
                    <td className="py-3 px-4 text-zinc-500 max-w-xs">
                      {v.rejectionReason ? (
                        <span className="text-rose-600">{v.rejectionReason}</span>
                      ) : (
                        v.notes || '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleCancel(v.id)}
                          className="text-xs text-rose-600 hover:underline font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pre-register Modal */}
      {showPreRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold">Pre-Register Expected Visitor</h3>
              <button
                onClick={() => setShowPreRegModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePreRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Iqbal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Expected Arrival Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formExpectedArrival}
                    onChange={(e) => setFormExpectedArrival(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Visit Purpose</label>
                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value as VisitPurpose)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="FRIEND">Friend</option>
                    <option value="FAMILY_VISIT">Family Member</option>
                    <option value="STUDY_ACADEMIC">Study / Project</option>
                    <option value="DELIVERY_SERVICE">Delivery</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Number of People</label>
                  <input
                    type="number"
                    min="1"
                    value={formNumVisitors}
                    onChange={(e) => setFormNumVisitors(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional details for security staff..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPreRegModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
