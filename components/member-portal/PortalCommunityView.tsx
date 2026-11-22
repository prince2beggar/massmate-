'use client';

import React, { useState, useEffect } from 'react';
import {
  Vote,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  ShieldCheck,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import type {
  PollDto,
  MemberSuggestionDto,
} from '@/server/polls/poll-service';

interface PortalCommunityViewProps {
  tenantSlug: string;
}

export function PortalCommunityView({ tenantSlug }: PortalCommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'POLLS' | 'SUGGESTIONS'>('POLLS');
  const [polls, setPolls] = useState<PollDto[]>([]);
  const [suggestions, setSuggestions] = useState<MemberSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Voting state: map of pollId -> selected optionId(s)
  const [selectedSelections, setSelectedSelections] = useState<Record<string, string[]>>({});
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<Record<string, string>>({});
  const [voteSuccess, setVoteSuccess] = useState<Record<string, string>>({});

  // Suggestion Modal State
  const [showSugModal, setShowSugModal] = useState(false);
  const [sugTitle, setSugTitle] = useState('');
  const [sugDescription, setSugDescription] = useState('');
  const [sugCategory, setSugCategory] = useState('GENERAL');
  const [sugAnonymous, setSugAnonymous] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState<string | null>(null);
  const [sugSuccess, setSugSuccess] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/polls`);
      const data = await res.json();
      if (data.success) {
        setPolls(data.data);
      }
    } catch (err) {
      console.error('Error fetching member polls:', err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/suggestions`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (err) {
      console.error('Error fetching member suggestions:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch(`/api/v1/portal/${tenantSlug}/polls`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/v1/portal/${tenantSlug}/suggestions`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([pollsJson, sugsJson]) => {
        if (!isMounted) return;
        if (pollsJson?.success) setPolls(pollsJson.data);
        if (sugsJson?.success) setSuggestions(sugsJson.data);
      })
      .catch((err) => console.error('[PortalCommunityView] Fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPolls(), fetchSuggestions()]);
    setRefreshing(false);
  };

  // Option select handler
  const handleSelectOption = (poll: PollDto, optionId: string) => {
    if (poll.selectionType === 'SINGLE_CHOICE') {
      setSelectedSelections((prev) => ({
        ...prev,
        [poll.id]: [optionId],
      }));
    } else {
      // MULTIPLE_CHOICE
      const current = selectedSelections[poll.id] || [];
      if (current.includes(optionId)) {
        setSelectedSelections((prev) => ({
          ...prev,
          [poll.id]: current.filter((id) => id !== optionId),
        }));
      } else {
        if (current.length >= poll.maxSelections) {
          alert(`You can select at most ${poll.maxSelections} options.`);
          return;
        }
        setSelectedSelections((prev) => ({
          ...prev,
          [poll.id]: [...current, optionId],
        }));
      }
    }
  };

  // Vote Submission
  const handleCastVote = async (pollId: string) => {
    const selected = selectedSelections[pollId] || [];
    if (selected.length === 0) {
      setVoteError((prev) => ({ ...prev, [pollId]: 'Please select an option before submitting.' }));
      return;
    }

    setSubmittingPollId(pollId);
    setVoteError((prev) => ({ ...prev, [pollId]: '' }));

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOptionIds: selected }),
      });

      const data = await res.json();
      if (data.success) {
        setVoteSuccess((prev) => ({ ...prev, [pollId]: 'Your vote was securely recorded!' }));
        await fetchPolls();
      } else {
        setVoteError((prev) => ({
          ...prev,
          [pollId]: data.error?.message || 'Failed to submit vote.',
        }));
      }
    } catch (err: any) {
      setVoteError((prev) => ({
        ...prev,
        [pollId]: err.message || 'An error occurred during submission.',
      }));
    } finally {
      setSubmittingPollId(null);
    }
  };

  // Submit Suggestion
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSugLoading(true);
    setSugError(null);

    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sugTitle.trim(),
          description: sugDescription.trim(),
          category: sugCategory,
          isAnonymous: sugAnonymous,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSugModal(false);
        setSugSuccess('Your community proposal has been submitted to mess management.');
        setTimeout(() => setSugSuccess(null), 5000);
        setSugTitle('');
        setSugDescription('');
        await fetchSuggestions();
      } else {
        setSugError(data.error?.message || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      setSugError(err.message || 'Error occurred.');
    } finally {
      setSugLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30">
                Community Center
              </span>
              <span className="text-xs text-teal-300">Phase 6 — Task 45</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Polls & Community Voice
            </h1>
            <p className="text-teal-100/80 text-sm mt-1 max-w-xl">
              Vote on meal menus, shared facility decisions, and submit ideas to improve our living community.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowSugModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Submit Suggestion
            </button>
          </div>
        </div>
      </div>

      {/* Informal Disclaimer Alert */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Community Notice:</strong> These polls and voting forms are informal surveys intended to gather resident consensus and guide mess management decisions. They do not constitute a formal political election.
        </span>
      </div>

      {/* Global Success Notification */}
      {sugSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{sugSuccess}</span>
          </div>
          <button onClick={() => setSugSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('POLLS')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'POLLS'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Community Polls ({polls.filter((p) => p.status === 'PUBLISHED').length})
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

      {/* TAB 1: POLLS */}
      {activeTab === 'POLLS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
              Loading active polls...
            </div>
          ) : polls.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <Vote className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Open Polls Right Now</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Management has not published any open polls at this time. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {polls.map((poll) => {
                const isClosed = poll.status === 'CLOSED';
                const hasVoted = !!poll.hasVoted;
                const canVote = !isClosed && !hasVoted;
                const currentSelected = selectedSelections[poll.id] || [];

                return (
                  <div
                    key={poll.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {poll.referenceNumber}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isClosed
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isClosed ? 'Closed' : 'Active'}
                          </span>
                        </div>

                        <span className="text-xs px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                          {poll.pollType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {poll.title}
                      </h3>
                      {poll.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {poll.description}
                        </p>
                      )}

                      {/* Voting Controls or Results Display */}
                      <div className="mt-4 space-y-2">
                        {canVote ? (
                          // Interactive Voting Options
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-700 block mb-1">
                              Select your choice{' '}
                              {poll.selectionType === 'MULTIPLE_CHOICE'
                                ? `(Up to ${poll.maxSelections})`
                                : '(Single Choice)'}
                              :
                            </span>

                            {poll.options.map((opt) => {
                              const isChecked = currentSelected.includes(opt.id);

                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => handleSelectOption(poll, opt.id)}
                                  className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${
                                    isChecked
                                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                                  }`}
                                >
                                  <span>{opt.text}</span>
                                  <div
                                    className={`w-4 h-4 rounded-${
                                      poll.selectionType === 'SINGLE_CHOICE' ? 'full' : 'md'
                                    } border flex items-center justify-center ${
                                      isChecked
                                        ? 'border-teal-600 bg-teal-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isChecked && (
                                      <div
                                        className={`w-1.5 h-1.5 rounded-${
                                          poll.selectionType === 'SINGLE_CHOICE' ? 'full' : 'sm'
                                        } bg-white`}
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })}

                            {voteError[poll.id] && (
                              <p className="text-xs text-rose-600 mt-1">{voteError[poll.id]}</p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCastVote(poll.id)}
                              disabled={submittingPollId === poll.id}
                              className="mt-3 w-full py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {submittingPollId === poll.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Vote className="w-4 h-4" />
                              )}
                              Submit My Vote
                            </button>
                          </div>
                        ) : (
                          // Results View (Voted or Closed)
                          <div className="space-y-2.5">
                            {hasVoted && (
                              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>You have already cast your vote on this poll.</span>
                              </div>
                            )}

                            {poll.resultsLocked ? (
                              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                                Results will be revealed after voting closes according to privacy settings.
                              </div>
                            ) : (
                              poll.options.map((opt) => {
                                const userChose = poll.userVoteOptionIds?.includes(opt.id);

                                return (
                                  <div key={opt.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium text-slate-800 truncate pr-2 flex items-center gap-1.5">
                                        {opt.text}
                                        {userChose && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                                            Your Vote
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-slate-500 font-semibold flex-shrink-0">
                                        {opt.voteCount} ({opt.percentage}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          userChose ? 'bg-teal-600' : 'bg-slate-400'
                                        }`}
                                        style={{ width: `${opt.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {poll.totalVoters} voter{poll.totalVoters !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          {poll.votingMode === 'ANONYMOUS' ? 'Secret Ballot' : 'Identified'}
                        </span>
                      </div>

                      {poll.formattedEndDate && (
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Deadline: {poll.formattedEndDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUGGESTIONS */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Community Ideas & Proposals
            </h3>
            <button
              onClick={() => setShowSugModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Proposal
            </button>
          </div>

          {suggestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <MessageSquarePlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-semibold text-slate-800">No Proposals Yet</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Have an idea for menu changes, cleaning schedules, or room rules? Submit your proposal to management.
              </p>
              <button
                onClick={() => setShowSugModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500"
              >
                <Plus className="w-4 h-4" />
                Submit First Proposal
              </button>
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
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span>By: {sug.userName}</span>
                      <span className="mx-1">•</span>
                      <span>{sug.formattedCreatedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT SUGGESTION MODAL */}
      {showSugModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-teal-600" />
                Submit Community Suggestion
              </h3>
              <button
                onClick={() => setShowSugModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sugError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {sugError}
              </div>
            )}

            <form onSubmit={handleSubmitSuggestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Install RO Water Filter on 2nd Floor"
                  value={sugTitle}
                  onChange={(e) => setSugTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={sugCategory}
                  onChange={(e) => setSugCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="GENERAL">General Living</option>
                  <option value="MEAL">Meal & Dining</option>
                  <option value="FACILITY">Facility & Maintenance</option>
                  <option value="CLEANLINESS">Cleanliness & Hygiene</option>
                  <option value="EVENT">Events & Feasts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Explanation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain your idea, benefits for residents, and suggested implementation..."
                  value={sugDescription}
                  onChange={(e) => setSugDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={sugAnonymous}
                  onChange={(e) => setSugAnonymous(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="anonCheck" className="text-xs text-slate-700 font-medium">
                  Submit anonymously (Hide my name in public list)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSugModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sugLoading}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {sugLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
