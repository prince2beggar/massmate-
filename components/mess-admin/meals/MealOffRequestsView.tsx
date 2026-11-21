'use client';

import React, { useState } from 'react';
import { Plus, CalendarOff, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { CreateMealOffModal } from './CreateMealOffModal';
import { ReviewMealOffModal } from './ReviewMealOffModal';

interface MealOffRequestsViewProps {
  tenantSlug: string;
  initialRequests: any[];
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
  onRefresh: () => void;
}

export function MealOffRequestsView({
  tenantSlug,
  initialRequests = [],
  members,
  onRefresh,
}: MealOffRequestsViewProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'ALL'
  );
  const [loading, setLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);



  const fetchRequests = async (statusOverride?: string) => {
    setLoading(true);
    try {
      const st = statusOverride !== undefined ? statusOverride : statusFilter;
      const url = `/api/v1/mess/${tenantSlug}/meals/off-requests${
        st !== 'ALL' ? `?status=${st}` : ''
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (st: any) => {
    setStatusFilter(st);
    void fetchRequests(st);
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Meal-Off Requests & Absences
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Residents requesting meal cancellations before the Dhaka cutoff deadline
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Meal-Off Request</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Total Requests</span>
          <div className="text-xl font-bold text-foreground mt-1">{requests.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Pending Review</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Approved</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Rejected</span>
          <div className="text-xl font-bold text-destructive mt-1">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => handleFilterClick(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              statusFilter === st
                ? 'border-primary bg-primary text-primary-foreground font-semibold'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <CalendarOff className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No Meal-Off Requests Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            When residents submit meal absence requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Resident</th>
                  <th className="px-4 py-3 font-medium">Date Range</th>
                  <th className="px-4 py-3 font-medium">Meals</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {r.memberName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.startDate} &rarr; {r.endDate}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.mealTypes?.join(', ') || 'All Meals'}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {r.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {r.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => setReviewTarget(r)}
                          className="px-3 py-1 text-[11px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateMealOffModal
        tenantSlug={tenantSlug}
        members={members}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void fetchRequests();
          onRefresh();
        }}
      />

      {reviewTarget && (
        <ReviewMealOffModal
          tenantSlug={tenantSlug}
          request={reviewTarget}
          isOpen={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          onReviewed={() => {
            void fetchRequests();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
