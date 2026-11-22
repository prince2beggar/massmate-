'use client';

import React, { useState } from 'react';
import { Calendar, User, CheckCircle2, Clock, XCircle, Plus, ShoppingBag, Loader2 } from 'lucide-react';

interface BazarScheduleItem {
  id: string;
  assignedDate: string;
  assignedMembershipId: string;
  assignedMembership?: {
    user?: { name: string; email?: string };
    memberCode?: string | null;
  };
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'SWAPPED';
  notes?: string | null;
  expenseId?: string | null;
}

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface BazarScheduleViewProps {
  tenantSlug: string;
  schedules: BazarScheduleItem[];
  members: MemberOption[];
  onRefresh: () => void;
  onOpenAssignModal: () => void;
  onRecordForSchedule: (schedule: BazarScheduleItem) => void;
}

export function BazarScheduleView({
  tenantSlug,
  schedules,
  onRefresh,
  onOpenAssignModal,
  onRecordForSchedule,
}: BazarScheduleViewProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    id: string,
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'SWAPPED'
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update schedule');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating schedule');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
      case 'SWAPPED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            Swapped
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Sort upcoming schedules first, then completed/cancelled
  const sortedSchedules = [...schedules].sort((a, b) =>
    b.assignedDate.localeCompare(a.assignedDate)
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Bazar Duty Rota & Assignments</h3>
          <p className="text-xs text-slate-500">
            Organize upcoming shopping duties among mess residents and track completion
          </p>
        </div>
        <button
          onClick={onOpenAssignModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Assign Duty
        </button>
      </div>

      {/* Schedules Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {sortedSchedules.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-700">No Bazar Duty Scheduled</h4>
            <p className="mt-1 text-xs text-slate-500">
              Assign residents to upcoming dates to establish a shopping rota.
            </p>
            <button
              onClick={onOpenAssignModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Schedule First Duty
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Duty Date</th>
                <th className="px-4 py-3.5">Assigned Resident</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5">Duty Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSchedules.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>{sc.assignedDate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {sc.assignedMembership?.user?.name || sc.assignedMembershipId}
                        </span>
                        {sc.assignedMembership?.memberCode && (
                          <span className="text-[11px] text-slate-400">
                            {sc.assignedMembership.memberCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {sc.notes || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(sc.status)}</td>
                  <td className="px-5 py-3.5 text-right space-x-1.5">
                    {sc.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => onRecordForSchedule(sc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Record Purchase
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(sc.id, 'COMPLETED')}
                          disabled={updatingId === sc.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          {updatingId === sc.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Done
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(sc.id, 'CANCELLED')}
                          disabled={updatingId === sc.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {sc.status === 'COMPLETED' && (
                      <span className="text-[11px] text-emerald-700 font-medium">Duty Fulfilled</span>
                    )}
                    {sc.status === 'CANCELLED' && (
                      <span className="text-[11px] text-slate-400">Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
