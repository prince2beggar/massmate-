'use client';

import React, { useState, useEffect } from 'react';
import {
  Vote,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Eye,
  BarChart3,
  MessageSquarePlus,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  X,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type {
  PollDto,
  PollDashboardDto,
  PollType,
  VotingMode,
  SelectionType,
  ResultsVisibility,
  MemberSuggestionDto,
} from '@/server/polls/poll-service';

interface MessPollManagementViewProps {
  tenantSlug: string;
  tenantName: string;
}

const POLL_TYPES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'GENERAL_FEEDBACK', label: 'General Feedback' },
  { key: 'MEAL_PREFERENCE', label: 'Meal Preference' },
  { key: 'EVENT_PREFERENCE', label: 'Event Preference' },
  { key: 'FACILITY_DECISION', label: 'Facility Decision' },
  { key: 'COMMUNITY_SUGGESTION', label: 'Community Idea' },
  { key: 'OTHER', label: 'Other' },
];

export function MessPollManagementView({
  tenantSlug,
  tenantName,
}: MessPollManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL' | 'SUGGESTIONS'>('ACTIVE');
  const [dashboard, setDashboard] = useState<PollDashboardDto | null>(null);
  const [polls, setPolls] = useState<PollDto[]>([]);
  const [suggestions, setSuggestions] = useState<MemberSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Create Poll Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<PollType>('GENERAL_FEEDBACK');
  const [formVotingMode, setFormVotingMode] = useState<VotingMode>('IDENTIFIED');
  const [formSelectionType, setFormSelectionType] = useState<SelectionType>('SINGLE_CHOICE');
  const [formMaxSelections, setFormMaxSelections] = useState('1');
  const [formVisibility, setFormVisibility] = useState<ResultsVisibility>('ALWAYS');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '']);

  // Suggestion Review Modal State
  const [selectedSuggestion, setSelectedSuggestion] = useState<MemberSuggestionDto | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewAdminNotes, setReviewAdminNotes] = useState('');
  const [reviewIsPublished, setReviewIsPublished] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Feedback State
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls/dashboard`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const fetchPolls = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('pollType', typeFilter);

      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPolls(data.data);
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls/suggestions`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (typeFilter !== 'ALL') params.set('pollType', typeFilter);

    Promise.all([
      fetch(`/api/v1/mess/${tenantSlug}/polls/dashboard`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/v1/mess/${tenantSlug}/polls?${params.toString()}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/v1/mess/${tenantSlug}/polls/suggestions`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dashJson, pollsJson, sugsJson]) => {
        if (!isMounted) return;
        if (dashJson?.success) setDashboard(dashJson.data);
        if (pollsJson?.success) setPolls(pollsJson.data);
        if (sugsJson?.success) setSuggestions(sugsJson.data);
      })
      .catch((err) => console.error('[PollView] Fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, statusFilter, typeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchPolls(), fetchSuggestions()]);
    setRefreshing(false);
  };

  // Poll Action (Publish, Close, Cancel)
  const handlePollAction = async (pollId: string, action: 'PUBLISH' | 'CLOSE' | 'CANCEL') => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message || `Poll ${action.toLowerCase()}ed successfully.`);
        setTimeout(() => setActionSuccess(null), 4000);
        await Promise.all([fetchDashboard(), fetchPolls()]);
      } else {
        alert(data.error?.message || 'Operation failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    }
  };

  // Create Poll Submit
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const validOpts = formOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOpts.length < 2) {
      setCreateError('Please provide at least 2 distinct voting options.');
      setCreateLoading(false);
      return;
    }

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        pollType: formType,
        votingMode: formVotingMode,
        selectionType: formSelectionType,
        maxSelections: parseInt(formMaxSelections, 10) || 1,
        resultsVisibility: formVisibility,
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        options: validOpts,
      };

      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setActionSuccess('New community poll draft created successfully.');
        setTimeout(() => setActionSuccess(null), 4000);
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormOptions(['', '']);
        setFormStartDate('');
        setFormEndDate('');
        await Promise.all([fetchDashboard(), fetchPolls()]);
      } else {
        setCreateError(data.error?.message || 'Failed to create poll.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'An unexpected error occurred.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Review Suggestion Submit
  const handleSaveSuggestionReview = async () => {
    if (!selectedSuggestion) return;
    setReviewLoading(true);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/polls/suggestions/${selectedSuggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          adminNotes: reviewAdminNotes,
          isPublished: reviewIsPublished,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSuggestion(null);
        setActionSuccess('Suggestion review updated successfully.');
        setTimeout(() => setActionSuccess(null), 4000);
        await Promise.all([fetchDashboard(), fetchSuggestions()]);
      } else {
        alert(data.error?.message || 'Failed to update suggestion.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30">
                Community Governance
              </span>
              <span className="text-xs text-teal-300">Phase 6 — Task 45</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Community Polls & Feedback
            </h1>
            <p className="text-teal-100/80 text-sm mt-1 max-w-2xl">
              Create opinion polls, meal preference votes, and review member community suggestions for{' '}
              <strong className="text-white">{tenantName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Poll
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Polls
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : dashboard?.activePollsCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Live open community votes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Votes Cast
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : dashboard?.totalVotesCastAllTime ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all historical polls</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Closed Polls
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : dashboard?.closedPollsCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Archived community records</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Suggestions
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : dashboard?.pendingSuggestionsCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending admin review</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ACTIVE'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active & Live Polls ({dashboard?.activePollsCount ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ALL'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Polls & History
          </button>
          <button
            onClick={() => setActiveTab('SUGGESTIONS')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'SUGGESTIONS'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Community Suggestions ({suggestions.length})
          </button>
        </nav>
      </div>

      {/* TAB 1 & 2: POLLS LIST */}
      {(activeTab === 'ACTIVE' || activeTab === 'ALL') && (
        <div className="space-y-4">
          {/* Filter Bar (Only in ALL tab) */}
          {activeTab === 'ALL' && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search polls by title or ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPolls()}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
                >
                  {POLL_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Polls Cards */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
              Loading community polls...
            </div>
          ) : (
            (() => {
              const displayList =
                activeTab === 'ACTIVE'
                  ? polls.filter((p) => p.status === 'PUBLISHED')
                  : polls;

              if (displayList.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <Vote className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">No Polls Found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      {activeTab === 'ACTIVE'
                        ? 'There are currently no active polls open for voting.'
                        : 'No community polls match the selected criteria.'}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Poll
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        {/* Header badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {p.referenceNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                p.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.status === 'DRAFT'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : p.status === 'CLOSED'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>

                          <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {p.pollType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Title and Description */}
                        <h3 className="text-base font-semibold text-slate-900 leading-snug">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {p.description}
                          </p>
                        )}

                        {/* Options & Progress Bars */}
                        <div className="mt-4 space-y-2.5">
                          {p.options.map((opt) => (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 truncate pr-2">
                                  {opt.text}
                                </span>
                                <span className="text-slate-500 font-semibold flex-shrink-0">
                                  {opt.voteCount} ({opt.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${opt.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {p.totalVoters} voter{p.totalVoters !== 1 ? 's' : ''} ({p.totalVotes} votes)
                            </span>
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              {p.votingMode === 'ANONYMOUS' ? 'Secret Vote' : 'Identified'}
                            </span>
                          </div>
                          {p.formattedEndDate && (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Ends: {p.formattedEndDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Admin Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePollAction(p.id, 'PUBLISH')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                          >
                            Publish Poll
                          </button>
                        )}
                        {p.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handlePollAction(p.id, 'CLOSE')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                          >
                            Close Voting
                          </button>
                        )}
                        {(p.status === 'DRAFT' || p.status === 'PUBLISHED') && (
                          <button
                            onClick={() => handlePollAction(p.id, 'CANCEL')}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB 3: MEMBER SUGGESTIONS */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Member suggestions are community proposals submitted by residents. Review them, add internal staff notes, and decide if an idea should be published or turned into a formal community poll.
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <MessageSquarePlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Suggestions Submitted</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Members have not submitted any ideas or proposals yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sug.referenceNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sug.status === 'APPROVED_FOR_POLL'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : sug.status === 'UNDER_REVIEW'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : sug.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sug.status === 'DECLINED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sug.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span className="text-xs px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                        {sug.category}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-slate-900">{sug.title}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{sug.description}</p>

                    {sug.adminNotes && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900 block mb-0.5">Admin Note:</strong>
                        {sug.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span>By: {sug.userName}</span>
                      <span className="mx-1">•</span>
                      <span>{sug.formattedCreatedAt}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSuggestion(sug);
                        setReviewStatus(sug.status);
                        setReviewAdminNotes(sug.adminNotes || '');
                        setReviewIsPublished(sug.isPublished);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Vote className="w-5 h-5 text-teal-600" />
                Create New Community Poll
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Poll Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Choose our Friday Feast Menu"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this poll is being held and any instructions for residents..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Poll Category
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PollType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="GENERAL_FEEDBACK">General Feedback</option>
                    <option value="MEAL_PREFERENCE">Meal Preference</option>
                    <option value="EVENT_PREFERENCE">Event Preference</option>
                    <option value="FACILITY_DECISION">Facility Decision</option>
                    <option value="COMMUNITY_SUGGESTION">Community Idea</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Voting Privacy
                  </label>
                  <select
                    value={formVotingMode}
                    onChange={(e) => setFormVotingMode(e.target.value as VotingMode)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="IDENTIFIED">Identified (Visible to Admin)</option>
                    <option value="ANONYMOUS">Secret Ballot (Anonymous)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selection Type
                  </label>
                  <select
                    value={formSelectionType}
                    onChange={(e) => setFormSelectionType(e.target.value as SelectionType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="SINGLE_CHOICE">Single Choice (1 option)</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Results Visibility
                  </label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as ResultsVisibility)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ALWAYS">Always Visible</option>
                    <option value="AFTER_VOTE">Visible After Voting</option>
                    <option value="AFTER_CLOSE">Visible Only After Close</option>
                    <option value="STAFF_ONLY">Staff Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Voting Closes (Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {formSelectionType === 'MULTIPLE_CHOICE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Selections Allowed
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={formOptions.length}
                      value={formMaxSelections}
                      onChange={(e) => setFormMaxSelections(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Options List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Poll Options <span className="text-rose-500">*</span> (Min 2)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormOptions([...formOptions, ''])}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx] = e.target.value;
                          setFormOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {formOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formOptions.filter((_, i) => i !== idx);
                            setFormOptions(updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUGGESTION REVIEW MODAL */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Review Suggestion: {selectedSuggestion.referenceNumber}
              </h3>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{selectedSuggestion.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{selectedSuggestion.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED_FOR_POLL">Approved for Poll</option>
                  <option value="RESOLVED">Resolved / Implemented</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Notes (Internal Staff Discussion)
                </label>
                <textarea
                  rows={3}
                  value={reviewAdminNotes}
                  onChange={(e) => setReviewAdminNotes(e.target.value)}
                  placeholder="Notes on cost, feasibility, quotes, or why this was accepted/declined..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPub"
                  checked={reviewIsPublished}
                  onChange={(e) => setReviewIsPublished(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="isPub" className="text-xs text-slate-700 font-medium">
                  Make visible to all residents in community feed
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSuggestion(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reviewLoading}
                  onClick={handleSaveSuggestionReview}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {reviewLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
