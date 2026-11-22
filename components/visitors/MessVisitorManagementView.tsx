'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Clock,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  Phone,
  ShieldCheck,
  FileText,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import type {
  VisitorDashboardDto,
  VisitorDto,
  VisitPurpose,
  VisitorStatus,
} from '@/server/visitors/visitor-service';

interface MessVisitorManagementViewProps {
  tenantSlug: string;
  tenantName: string;
}

const VISIT_PURPOSES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Purposes' },
  { key: 'FAMILY_VISIT', label: 'Family Visit' },
  { key: 'STUDY_ACADEMIC', label: 'Study & Academic' },
  { key: 'DELIVERY_SERVICE', label: 'Delivery Service' },
  { key: 'FRIEND', label: 'Friend & Relative' },
  { key: 'OFFICIAL_WORK', label: 'Official / Technician' },
  { key: 'OTHER', label: 'Other Visit' },
];

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Statuses' },
  { key: 'CHECKED_IN', label: 'Currently Checked In' },
  { key: 'EXPECTED', label: 'Expected' },
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'CHECKED_OUT', label: 'Checked Out' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function MessVisitorManagementView({
  tenantSlug,
  tenantName,
}: MessVisitorManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'VISITOR_LOG' | 'PENDING'>('DASHBOARD');

  // Dashboard state
  const [dashboard, setDashboard] = useState<VisitorDashboardDto | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // Visitor Log state
  const [visitors, setVisitors] = useState<VisitorDto[]>([]);
  const [visitorsTotal, setVisitorsTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [checkedInOnly, setCheckedInOnly] = useState(false);

  // Modals state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVisitorForReview, setSelectedVisitorForReview] = useState<VisitorDto | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewReason, setReviewReason] = useState('');

  // Form states
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Walk-in form fields
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPurpose, setWalkInPurpose] = useState<VisitPurpose>('FRIEND');
  const [walkInNum, setWalkInNum] = useState('1');
  const [walkInNotes, setWalkInNotes] = useState('');

  // Load Dashboard
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/mess/${tenantSlug}/visitors/dashboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setDashboard(json.data);
        }
      })
      .catch((err) => console.error('[VisitorView] Dashboard error:', err))
      .finally(() => {
        if (isMounted) setDashLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Load Visitor Log when VISITOR_LOG or PENDING active
  useEffect(() => {
    if (activeTab === 'DASHBOARD') return;

    let isMounted = true;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (purposeFilter !== 'ALL') params.set('visitPurpose', purposeFilter);
    if (activeTab === 'PENDING') {
      params.set('status', 'PENDING_APPROVAL');
    } else if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }
    if (checkedInOnly && activeTab !== 'PENDING') params.set('checkedInOnly', 'true');
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/visitors?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setVisitors(json.data);
          setVisitorsTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => console.error('[VisitorView] Log fetch error:', err))
      .finally(() => {
        if (isMounted) setLogLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab, searchQuery, purposeFilter, statusFilter, checkedInOnly]);

  const handleRefresh = async () => {
    if (activeTab === 'DASHBOARD') {
      setDashLoading(true);
      try {
        const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors/dashboard`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setDashboard(json.data);
        }
      } finally {
        setDashLoading(false);
      }
    } else {
      setLogLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (purposeFilter !== 'ALL') params.set('visitPurpose', purposeFilter);
        if (activeTab === 'PENDING') {
          params.set('status', 'PENDING_APPROVAL');
        } else if (statusFilter !== 'ALL') {
          params.set('status', statusFilter);
        }
        if (checkedInOnly && activeTab !== 'PENDING') params.set('checkedInOnly', 'true');
        const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setVisitors(json.data);
            setVisitorsTotal(json.meta?.total || 0);
          }
        }
      } finally {
        setLogLoading(false);
      }
    }
  };

  const handleCheckIn = async (visitorId: string) => {
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors/${visitorId}/check-in`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Check-in failed.');
      }
      setActionSuccess('Visitor checked in successfully.');
      handleRefresh();
    } catch (err: any) {
      alert(err?.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors/${visitorId}/check-out`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Check-out failed.');
      }
      setActionSuccess('Visitor checked out successfully.');
      handleRefresh();
    } catch (err: any) {
      alert(err?.message || 'Check-out failed.');
    }
  };

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: walkInName,
          visitorPhone: walkInPhone.trim() || undefined,
          visitPurpose: walkInPurpose,
          numberOfVisitors: parseInt(walkInNum, 10) || 1,
          notes: walkInNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Registration failed.');
      }

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInNotes('');
      setWalkInNum('1');
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Registration failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorForReview) return;
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/visitors/${selectedVisitorForReview.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          reason: reviewReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Review failed.');
      }

      setShowReviewModal(false);
      setSelectedVisitorForReview(null);
      setReviewReason('');
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Review failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Inside
          </span>
        );
      case 'CHECKED_OUT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">Checked Out</span>;
      case 'PENDING_APPROVAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Pending Review</span>;
      case 'APPROVED':
      case 'EXPECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Expected</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Rejected</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Visitor & Guest Entry Register</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tenantName} · Check-in, check-out, front-desk logging, and member pre-registration approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${dashLoading || logLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setShowWalkInModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-in Check-in</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'DASHBOARD'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Gate Overview
        </button>
        <button
          onClick={() => setActiveTab('VISITOR_LOG')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'VISITOR_LOG'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Full Visitor Log
          {dashboard?.currentlyCheckedInCount ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
              {dashboard.currentlyCheckedInCount} inside
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'PENDING'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Pending Approvals
          {dashboard?.pendingApprovalCount ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {dashboard.pendingApprovalCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* TAB 1: GATE OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="py-16 flex justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : dashboard ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-xs font-medium">Currently Inside</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {dashboard.currentlyCheckedInCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-xs font-medium">Expected Today</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-blue-600">
                    {dashboard.expectedTodayCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-xs font-medium">Checked Out Today</span>
                    <LogOut className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-3xl font-extrabold">{dashboard.checkedOutTodayCount}</div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-xs font-medium">Pending Approvals</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-600">
                    {dashboard.pendingApprovalCount}
                  </div>
                </div>
              </div>

              {/* Active Inside Roster */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Active Visitors Currently Checked In</span>
                  </h3>
                  <button
                    onClick={() => {
                      setCheckedInOnly(true);
                      setActiveTab('VISITOR_LOG');
                    }}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    View All Filtered →
                  </button>
                </div>

                {dashboard.recentVisitors.filter((v) => v.status === 'CHECKED_IN').length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">
                    No visitors are currently checked in at the mess premises.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.recentVisitors
                      .filter((v) => v.status === 'CHECKED_IN')
                      .map((v) => (
                        <div
                          key={v.id}
                          className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{v.visitorName}</span>
                              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                                {v.numberOfVisitors} person(s)
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
                              <span>Purpose: {v.visitPurpose.replace('_', ' ')}</span>
                              {v.hostUserName && <span>Host: {v.hostUserName}</span>}
                              <span>Entry: {v.formattedActualCheckIn}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCheckOut(v.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 text-xs font-semibold transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check Out</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2 & 3: VISITOR LOG & PENDING APPROVALS */}
      {(activeTab === 'VISITOR_LOG' || activeTab === 'PENDING') && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search visitor or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              >
                {VISIT_PURPOSES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>

              {activeTab === 'VISITOR_LOG' && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    {STATUS_FILTERS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap pl-2">
                    <input
                      type="checkbox"
                      checked={checkedInOnly}
                      onChange={(e) => setCheckedInOnly(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Checked-in Only</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {logLoading ? (
              <div className="py-16 flex justify-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-2">
                <UserCheck className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-medium">No visitor records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                    <tr>
                      <th className="py-3 px-4">Visitor Ref</th>
                      <th className="py-3 px-4">Visitor Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Visit Purpose</th>
                      <th className="py-3 px-4">Host Resident</th>
                      <th className="py-3 px-4">Expected Arrival</th>
                      <th className="py-3 px-4">Actual Check-In</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-zinc-500">{v.referenceNumber}</td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {v.visitorName}
                          {v.numberOfVisitors > 1 && (
                            <span className="ml-1 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">
                              +{v.numberOfVisitors - 1}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                          {v.visitorPhone || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                          {v.visitPurpose.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-medium text-indigo-600 dark:text-indigo-400">
                          {v.hostUserName || <span className="text-zinc-400 italic">General</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-500">
                          {v.formattedExpectedArrival || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                          {v.formattedActualCheckIn || '—'}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(v.status)}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          {v.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedVisitorForReview(v);
                                  setReviewAction('APPROVE');
                                  setShowReviewModal(true);
                                }}
                                className="px-2 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded hover:bg-emerald-100 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVisitorForReview(v);
                                  setReviewAction('REJECT');
                                  setShowReviewModal(true);
                                }}
                                className="px-2 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 rounded hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {(v.status === 'APPROVED' || v.status === 'EXPECTED') && (
                            <button
                              onClick={() => handleCheckIn(v.id)}
                              className="px-2 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded hover:bg-indigo-100 transition"
                            >
                              Check In
                            </button>
                          )}

                          {v.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              className="px-2 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 rounded hover:bg-rose-100 transition"
                            >
                              Check Out
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
        </div>
      )}

      {/* WALK-IN VISITOR MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold">Front-Desk Walk-In Check-In</h3>
              <button
                onClick={() => setShowWalkInModal(false)}
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

            <form onSubmit={handleRegisterWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohammad Rafiq"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Number of Visitors</label>
                  <input
                    type="number"
                    min="1"
                    value={walkInNum}
                    onChange={(e) => setWalkInNum(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Visit Purpose</label>
                <select
                  value={walkInPurpose}
                  onChange={(e) => setWalkInPurpose(e.target.value as VisitPurpose)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                >
                  <option value="FRIEND">Friend & Relative</option>
                  <option value="FAMILY_VISIT">Family Member</option>
                  <option value="STUDY_ACADEMIC">Study / Academic</option>
                  <option value="DELIVERY_SERVICE">Delivery / Courier</option>
                  <option value="OFFICIAL_WORK">Official / Technician</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional visit notes..."
                  value={walkInNotes}
                  onChange={(e) => setWalkInNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
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
                  <span>Check In Immediately</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW APPROVAL MODAL */}
      {showReviewModal && selectedVisitorForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold">
                {reviewAction === 'APPROVE' ? 'Approve Visitor Request' : 'Reject Visitor Request'}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>Visitor:</strong> {selectedVisitorForReview.visitorName}
              </p>
              <p>
                <strong>Expected Arrival:</strong> {selectedVisitorForReview.formattedExpectedArrival}
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              {reviewAction === 'REJECT' && (
                <div>
                  <label className="block font-medium mb-1">Reason for Rejection *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quiet hours policy / Mess visitor quota exceeded"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{reviewAction === 'APPROVE' ? 'Approve Request' : 'Reject Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
