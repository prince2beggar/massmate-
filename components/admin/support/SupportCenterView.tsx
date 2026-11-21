'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Headphones,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Plus,
  Send,
  Lock,
  MessageSquare,
  User,
  Shield,
  Building2,
  X,
  RefreshCw,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import type {
  SupportTicketDto,
  SupportTicketDetailDto,
} from '@/server/support/support-ticket-service';
import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  PlatformRole,
} from '@/types/database';
import { cn } from '@/lib/utils';

interface SupportCenterViewProps {
  initialTickets: SupportTicketDto[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  initialStats: {
    total: number;
    new: number;
    open: number;
    inProgress: number;
    waitingCustomer: number;
    resolved: number;
    closed: number;
  };
  currentUserRole?: PlatformRole | null;
}

export function SupportCenterView({
  initialTickets,
  initialPagination,
  initialStats,
  currentUserRole,
}: SupportCenterViewProps) {
  const [tickets, setTickets] = useState<SupportTicketDto[]>(initialTickets);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState(initialStats);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory | 'ALL'>('ALL');
  const [priority, setPriority] = useState<SupportTicketPriority | 'ALL'>('ALL');
  const [status, setStatus] = useState<SupportTicketStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Ticket Drawer / Conversation
  const [activeTicket, setActiveTicket] = useState<SupportTicketDetailDto | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  // Message composer
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Create Ticket Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicketCategory>('TECHNICAL_ISSUE');
  const [newPriority, setNewPriority] = useState<SupportTicketPriority>('NORMAL');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const fetchTickets = useCallback(
    async (pageToLoad: number = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageToLoad));
        params.set('limit', String(pagination.limit));
        if (search.trim()) params.set('search', search.trim());
        if (category !== 'ALL') params.set('category', category);
        if (priority !== 'ALL') params.set('priority', priority);
        if (status !== 'ALL') params.set('status', status);

        const [ticketsRes, statsRes] = await Promise.all([
          fetch(`/api/v1/super-admin/support/tickets?${params.toString()}`),
          fetch('/api/v1/super-admin/support/tickets/stats'),
        ]);

        const ticketsData = await ticketsRes.json();
        const statsData = await statsRes.json();

        if (!ticketsRes.ok) throw new Error(ticketsData.message || 'Failed to fetch tickets');

        setTickets(ticketsData.data || []);
        if (ticketsData.meta?.pagination) {
          setPagination(ticketsData.meta.pagination);
        }
        if (statsRes.ok && statsData.data) {
          setStats(statsData.data);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading support tickets.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, category, priority, status, pagination.limit]
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchTickets(1);
  }, [fetchTickets]);

  // Load ticket details and messages
  const handleOpenTicket = async (ticketId: string) => {
    setIsLoadingActive(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/super-admin/support/tickets/${ticketId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load ticket details');
      setActiveTicket(data.data);
      setReplyMessage('');
      setIsInternalNote(false);
    } catch (err: any) {
      setError(err.message || 'Could not load ticket');
    } finally {
      setIsLoadingActive(false);
    }
  };

  // Post Reply or Internal Note
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    setIsSendingMessage(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternal: isInternalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post message');

      setReplyMessage('');
      setSuccessMessage(isInternalNote ? 'Internal note added.' : 'Reply sent to customer.');
      // Refresh active ticket conversation
      handleOpenTicket(activeTicket.id);
      fetchTickets(pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Update Ticket Status
  const handleUpdateStatus = async (newStatus: SupportTicketStatus) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/v1/super-admin/support/tickets/${activeTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update ticket status');
      setActiveTicket(data.data);
      fetchTickets(pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  // Update Ticket Priority
  const handleUpdatePriority = async (newPriority: SupportTicketPriority) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/v1/super-admin/support/tickets/${activeTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update priority');
      setActiveTicket(data.data);
      fetchTickets(pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to update priority.');
    }
  };

  // Create Ticket Submit
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setIsSubmittingCreate(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/super-admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          description: newDescription.trim() || undefined,
          category: newCategory,
          priority: newPriority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ticket');

      setSuccessMessage(`Support ticket ${data.data.ticketNumber} created.`);
      setIsCreateModalOpen(false);
      setNewSubject('');
      setNewDescription('');
      fetchTickets(1);
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Support Center</h1>
          <p className="text-sm text-slate-500">
            Tenant helpdesk, escalation tickets, internal notes, and dispute resolution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Total Tickets</span>
          <div className="text-lg font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-indigo-700">New</span>
          <div className="text-lg font-bold text-indigo-900">{stats.new}</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-blue-700">Open</span>
          <div className="text-lg font-bold text-blue-900">{stats.open}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-amber-700">In Progress</span>
          <div className="text-lg font-bold text-amber-900">{stats.inProgress}</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-purple-700">Waiting</span>
          <div className="text-lg font-bold text-purple-900">{stats.waitingCustomer}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-700">Resolved</span>
          <div className="text-lg font-bold text-emerald-900">{stats.resolved}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-600">Closed</span>
          <div className="text-lg font-bold text-slate-700">{stats.closed}</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, subject, requester, or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            aria-label="Filter tickets by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="ACCOUNT_LOGIN">Account & Login</option>
            <option value="SUBSCRIPTION_BILLING">Subscription & Billing</option>
            <option value="DOMAIN_WEBSITE">Domain & Website</option>
            <option value="TECHNICAL_ISSUE">Technical Issue</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            aria-label="Filter tickets by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent 🚨</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter tickets by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_CUSTOMER">Waiting for Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            type="button"
            onClick={() => fetchTickets(pagination.page)}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Subject & Category</th>
                <th className="px-4 py-3">Requester & Tenant</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Staff</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-500" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Headphones className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No support tickets found matching the criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Ticket Number */}
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {t.ticketNumber}
                    </td>

                    {/* Subject & Category */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 max-w-xs truncate">{t.subject}</div>
                      <div className="text-[10px] text-slate-400">{t.category.replace('_', ' ')}</div>
                    </td>

                    {/* Requester & Tenant */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{t.requesterName}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.tenantName ? `${t.tenantName}` : 'General Inquiry'}
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold',
                          t.priority === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.priority === 'NORMAL'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        )}
                      >
                        {t.priority === 'URGENT' && <AlertTriangle className="h-3 w-3" />}
                        {t.priority}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          t.status === 'NEW'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : t.status === 'OPEN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.status === 'WAITING_CUSTOMER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        )}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Assigned Staff */}
                    <td className="px-4 py-3 text-slate-600">
                      {t.assignedStaffName ? (
                        <span className="font-medium text-slate-800">{t.assignedStaffName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenTicket(t.id)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-100 flex items-center gap-1 ml-auto"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total tickets)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTickets(pagination.page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TICKET CONVERSATION DRAWER / MODAL */}
      {(activeTicket || isLoadingActive) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/75 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {activeTicket?.ticketNumber}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      activeTicket?.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    )}
                  >
                    {activeTicket?.priority}
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {activeTicket?.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="mt-1 text-base font-semibold text-slate-900">{activeTicket?.subject}</h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingActive || !activeTicket ? (
              <div className="flex flex-1 items-center justify-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* Left/Main: Messages Conversation Thread */}
                <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-200">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'rounded-xl p-4 text-xs transition-all',
                          m.isInternal
                            ? 'border-2 border-amber-300 bg-amber-50/80 text-amber-950 shadow-xs'
                            : m.isStaff
                            ? 'border border-indigo-100 bg-indigo-50/50 text-slate-900 ml-6'
                            : 'border border-slate-200 bg-white text-slate-900 mr-6'
                        )}
                      >
                        <div className="flex items-center justify-between border-b border-black/5 pb-1.5 mb-2">
                          <div className="flex items-center gap-1.5">
                            {m.isInternal ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                                <Lock className="h-3 w-3" />
                                INTERNAL NOTE (Platform Staff Only)
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-900">
                                {m.authorName} {m.isStaff && '(Staff)'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Message Composer */}
                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-slate-50/50 p-4">
                    {/* Tab: Customer Reply vs Internal Note */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(false)}
                          className={cn(
                            'rounded-md px-2.5 py-1 transition-all',
                            !isInternalNote
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          )}
                        >
                          Customer Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(true)}
                          className={cn(
                            'rounded-md px-2.5 py-1 transition-all flex items-center gap-1',
                            isInternalNote
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          )}
                        >
                          <Lock className="h-3 w-3" />
                          Internal Note
                        </button>
                      </div>

                      {isInternalNote && (
                        <span className="text-[11px] font-medium text-amber-700">
                          🔒 Hidden from customer. Visible only to platform staff.
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder={
                          isInternalNote
                            ? 'Add internal staff notes or investigation context...'
                            : 'Type your message to the customer...'
                        }
                        className={cn(
                          'flex-1 rounded-xl border p-2.5 text-xs focus:outline-hidden',
                          isInternalNote
                            ? 'border-amber-300 bg-amber-50/50 text-slate-900 focus:border-amber-500'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500'
                        )}
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !replyMessage.trim()}
                        className={cn(
                          'flex items-center gap-1 self-end rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50',
                          isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                        )}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isSendingMessage ? 'Sending...' : isInternalNote ? 'Add Note' : 'Reply'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Ticket Operations & Meta Sidebar */}
                <div className="w-72 overflow-y-auto bg-slate-50/75 p-5 text-xs space-y-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Lifecycle Status
                    </span>
                    <select
                      aria-label="Change ticket status"
                      value={activeTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as SupportTicketStatus)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-800"
                    >
                      <option value="NEW">New</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_CUSTOMER">Waiting for Customer</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Priority Level
                    </span>
                    <select
                      aria-label="Change ticket priority"
                      value={activeTicket.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as SupportTicketPriority)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-800"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent 🚨</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-200/80 pt-4 space-y-3">
                    <div>
                      <span className="text-slate-400">Requester:</span>
                      <p className="font-semibold text-slate-900">{activeTicket.requesterName}</p>
                      <p className="text-slate-500">{activeTicket.requesterEmail || '—'}</p>
                    </div>

                    <div>
                      <span className="text-slate-400">Tenant / Mess:</span>
                      <p className="font-semibold text-slate-900">
                        {activeTicket.tenantName ? activeTicket.tenantName : 'Platform-Level'}
                      </p>
                      {activeTicket.tenantSlug && (
                        <p className="font-mono text-[10px] text-slate-400">slug: {activeTicket.tenantSlug}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400">Category:</span>
                      <p className="font-medium text-slate-800">{activeTicket.category.replace('_', ' ')}</p>
                    </div>

                    <div>
                      <span className="text-slate-400">Created:</span>
                      <p className="text-slate-700">{new Date(activeTicket.createdAt).toLocaleString()}</p>
                    </div>

                    {activeTicket.resolvedAt && (
                      <div>
                        <span className="text-slate-400">Resolved:</span>
                        <p className="text-emerald-700 font-medium">
                          {new Date(activeTicket.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">Create New Support Ticket</h2>
            <p className="mt-1 text-xs text-slate-500">
              Submit an internal escalation or inquiry on behalf of a tenant or customer.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject:</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Brief summary of the issue or inquiry"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="TECHNICAL_ISSUE">Technical Issue</option>
                    <option value="ACCOUNT_LOGIN">Account & Login</option>
                    <option value="SUBSCRIPTION_BILLING">Subscription & Billing</option>
                    <option value="DOMAIN_WEBSITE">Domain & Website</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent 🚨</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Description:</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide context, error messages, or customer details..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || !newSubject.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
