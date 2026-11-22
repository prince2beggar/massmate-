'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  X,
  Send,
  Wrench,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Filter,
} from 'lucide-react';
import type { MemberComplaintDto } from '@/server/member-portal/member-portal-service';

interface MemberComplaintsViewProps {
  tenantSlug: string;
  initialData?: MemberComplaintDto[] | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  MAINTENANCE: Wrench,
  CLEANING: Sparkles,
  FOOD_QUALITY: AlertCircle,
  NOISE: HelpCircle,
  SECURITY: ShieldAlert,
  OTHER: HelpCircle,
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  IN_REVIEW: { label: 'In Review', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function MemberComplaintsView({ tenantSlug, initialData }: MemberComplaintsViewProps) {
  const [complaints, setComplaints] = useState<MemberComplaintDto[] | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<string>('MAINTENANCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchComplaints = useCallback(() => {
    let url = `/api/v1/portal/${tenantSlug}/complaints`;
    if (statusFilter !== 'ALL') url += `?status=${statusFilter}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch complaints.');
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setComplaints(json.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Error fetching complaints.');
        setLoading(false);
      });
  }, [tenantSlug, statusFilter]);

  useEffect(() => {
    if (initialData && statusFilter === 'ALL') return;
    fetchComplaints();
  }, [initialData, statusFilter, fetchComplaints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || title.trim().length < 3) {
      setModalError('Title must be at least 3 characters.');
      return;
    }
    if (!description || description.trim().length < 5) {
      setModalError('Description must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          attachmentUrl: attachmentUrl.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit complaint.');
      }

      setModalSuccess('Complaint ticket submitted to mess management.');
      setTimeout(() => {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setAttachmentUrl('');
        fetchComplaints();
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'Error submitting complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !complaints) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading complaints & feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaints & Maintenance Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit issues regarding facilities, cleaning, or meals and monitor resolution timelines.
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
          Submit Complaint
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          Filter by Status:
        </span>
        {['ALL', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-xs font-semibold text-rose-800">{error}</p>
        </div>
      )}

      {/* Complaints List */}
      {complaints && complaints.length > 0 ? (
        <div className="space-y-4">
          {complaints.map((cmp) => {
            const CategoryIcon = CATEGORY_ICONS[cmp.category] || HelpCircle;
            const statusInfo = STATUS_BADGES[cmp.status] || STATUS_BADGES.SUBMITTED;

            return (
              <div
                key={cmp.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 p-6 space-y-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {cmp.referenceNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <CategoryIcon className="h-3 w-3 text-emerald-600" />
                      {cmp.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">{cmp.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {cmp.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted: {cmp.createdAt}
                  </span>
                </div>

                {/* Admin Feedback Box */}
                {(cmp.adminResponse || cmp.reviewedBy) && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        Admin Response by {cmp.reviewedBy || 'Mess Admin'}
                      </span>
                      {cmp.reviewedAt && (
                        <span className="text-slate-400 font-normal">{cmp.reviewedAt}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cmp.adminResponse || 'Review in progress.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Complaints Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? 'No tickets match the selected status filter.'
              : 'You have not submitted any complaints or maintenance issues.'}
          </p>
        </div>
      )}

      {/* Modal: Submit Complaint */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Submit Complaint / Feedback</h3>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="MAINTENANCE">Maintenance / Repairs</option>
                  <option value="CLEANING">Cleaning & Hygiene</option>
                  <option value="FOOD_QUALITY">Dining / Meal Quality</option>
                  <option value="NOISE">Noise & Border Conduct</option>
                  <option value="SECURITY">Security & Access</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken hot water geyser in 2nd floor bath"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed description of the issue..."
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
