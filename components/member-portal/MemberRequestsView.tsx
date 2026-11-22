'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileQuestion,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  Building,
  User,
  Wrench,
  HelpCircle,
  Filter,
} from 'lucide-react';
import type { MemberRequestDto } from '@/server/member-portal/member-portal-service';

interface MemberRequestsViewProps {
  tenantSlug: string;
  initialData?: MemberRequestDto[] | null;
}

const TYPE_CONFIG = {
  ROOM_CHANGE: {
    label: 'Room Change',
    icon: Building,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  PROFILE_UPDATE: {
    label: 'Profile Update',
    icon: User,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    icon: Wrench,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  GENERAL_QUERY: {
    label: 'General Query',
    icon: HelpCircle,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: XCircle,
  },
};

export function MemberRequestsView({ tenantSlug, initialData }: MemberRequestsViewProps) {
  const [requests, setRequests] = useState<MemberRequestDto[] | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'ROOM_CHANGE' | 'PROFILE_UPDATE' | 'MAINTENANCE' | 'GENERAL_QUERY'>('MAINTENANCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    let url = `/api/v1/portal/${tenantSlug}/requests`;
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (typeFilter !== 'ALL') params.append('requestType', typeFilter);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load requests.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setRequests(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching personal requests.');
        setLoading(false);
      });
  }, [tenantSlug, statusFilter, typeFilter]);

  useEffect(() => {
    if (initialData && statusFilter === 'ALL' && typeFilter === 'ALL') {
      return;
    }
    fetchRequests();
  }, [initialData, statusFilter, typeFilter, fetchRequests]);

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this pending request?')) return;

    setCancellingId(requestId);
    setError(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/requests/${requestId}/cancel`, {
        method: 'PATCH',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error?.message || 'Failed to cancel request.');
      }

      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Error cancelling request.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.trim().length < 5) {
      setModalError('Please provide a description with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          title: title.trim() || undefined,
          description: description.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error?.message || 'Failed to submit request.');
      }

      setModalSuccess('Your request has been submitted to Mess Management.');
      setTimeout(() => {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        fetchRequests();
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'Error creating request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !requests) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Requests Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track status, administrator decisions, and submit service or transfer tickets.
          </p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setModalSuccess(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          Submit New Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-300 py-1.5 px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Request Types</option>
            <option value="ROOM_CHANGE">Room Transfers</option>
            <option value="PROFILE_UPDATE">Profile Updates</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="GENERAL_QUERY">General Queries</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => {
            const typeConf = TYPE_CONFIG[req.requestType] || TYPE_CONFIG.GENERAL_QUERY;
            const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const TypeIcon = typeConf.icon;
            const StatusIcon = statusConf.icon;
            const isPending = req.status === 'PENDING';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors p-6 space-y-4"
              >
                {/* Top Row: Ref & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {req.referenceNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConf.badgeColor}`}
                    >
                      <TypeIcon className="h-3 w-3" />
                      {typeConf.label}
                    </span>
                    {req.requestedRoomNumber && (
                      <span className="text-xs text-slate-500">
                        Target: <strong className="text-slate-800">Room {req.requestedRoomNumber}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConf.color}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {req.description}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted: {req.createdAt}
                  </span>
                  {req.preferredDate && (
                    <span>Preferred Date: <strong className="text-slate-600">{req.preferredDate}</strong></span>
                  )}
                </div>

                {/* Admin Feedback Box */}
                {(req.adminResponse || req.reviewedBy) && (
                  <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        Admin Review by {req.reviewedBy || 'Mess Admin'}
                      </span>
                      {req.reviewedAt && (
                        <span className="text-slate-400 font-normal">{req.reviewedAt}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {req.adminResponse || 'No specific review notes attached.'}
                    </p>
                  </div>
                )}

                {/* Action Bar (Cancel if Pending) */}
                {isPending && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancelRequest(req.id)}
                      disabled={cancellingId === req.id}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === req.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Requests Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'No requests match the selected filters.'
                : 'You have not submitted any service or profile change requests yet.'}
            </p>
          </div>
          <button
            onClick={() => {
              setModalError(null);
              setModalSuccess(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Request
          </button>
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Submit Personal Request</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">{modalSuccess}</p>
              </div>
            )}

            {modalError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-xs font-semibold text-rose-800">{modalError}</p>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Request Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={requestType}
                  onChange={(e: any) => setRequestType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="MAINTENANCE">Maintenance / Repair Issue</option>
                  <option value="ROOM_CHANGE">Room Transfer / Allocation</option>
                  <option value="PROFILE_UPDATE">Profile / Information Update</option>
                  <option value="GENERAL_QUERY">General Query / Other</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject / Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary e.g. Leaking bathroom faucet"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide clear and specific details for the mess management team..."
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum 5 characters.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
