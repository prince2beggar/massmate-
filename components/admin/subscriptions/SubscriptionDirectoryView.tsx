'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Building,
  RotateCcw,
  Check,
  Send,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import type {
  SubscriptionDto,
  SubscriptionInvoiceDto,
  CustomInquiryDto,
  SubscriptionAnalyticsSummary,
} from '@/server/subscription/types';
import type { SubscriptionStatus, PlanType, PaymentMethod, PaymentStatus } from '@/types/database';
import { PLAN_FEATURE_CATALOG } from '@/server/subscription/constants';

interface SubscriptionDirectoryViewProps {
  initialSubscriptions: SubscriptionDto[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  initialInvoices?: SubscriptionInvoiceDto[];
  initialInquiries?: CustomInquiryDto[];
  initialAnalytics?: SubscriptionAnalyticsSummary;
}

export function SubscriptionDirectoryView({
  initialSubscriptions,
  initialPagination,
  initialInquiries = [],
  initialAnalytics,
}: SubscriptionDirectoryViewProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'invoices' | 'proposals' | 'analytics'>('directory');

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>(initialSubscriptions);
  const [pagination, setPagination] = useState(initialPagination);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PlanType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inquiries & Proposals State
  const [inquiries, setInquiries] = useState<CustomInquiryDto[]>(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<CustomInquiryDto | null>(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<SubscriptionAnalyticsSummary | undefined>(initialAnalytics);

  // Action Modals State
  const [extendTarget, setExtendTarget] = useState<SubscriptionDto | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendReason, setExtendReason] = useState('');

  const [paymentTarget, setPaymentTarget] = useState<SubscriptionDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(99);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('CONFIRMED');

  const [cancelTarget, setCancelTarget] = useState<SubscriptionDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quotation Form State
  const [quotationData, setQuotationData] = useState({
    monthlyPrice: 1500,
    propertyCount: 2,
    estimatedMembers: 80,
    includedFeatures: ['member_management', 'meal_management', 'bazar_management', 'finance_management', 'multiple_properties'] as string[],
    internalNotes: '',
    customerNotes: '',
  });

  const isFirstRender = useRef(true);

  const fetchSubscriptions = useCallback(
    async (pageToFetch = pagination.page) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (typeFilter !== 'ALL') params.set('subscriptionType', typeFilter);
        params.set('page', String(pageToFetch));
        params.set('limit', String(pagination.limit));

        const res = await fetch(`/api/v1/super-admin/subscriptions?${params.toString()}`, {
          headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
        });

        const json = await res.json();
        if (json.success && json.data) {
          setSubscriptions(json.data);
          if (json.meta) {
            setPagination({
              page: json.meta.page,
              limit: json.meta.limit,
              totalCount: json.meta.total ?? json.meta.totalCount ?? 0,
              totalPages: json.meta.totalPages,
            });
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch subscriptions.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter, typeFilter, pagination.limit, pagination.page]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchSubscriptions(1);
  }, [statusFilter, typeFilter, fetchSubscriptions]);

  // Load analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) {
      fetch('/api/v1/super-admin/subscription-analytics', {
        headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setAnalytics(d.data);
        })
        .catch(() => {});
    }
  }, [activeTab, analytics]);

  // Load inquiries when switching to proposals tab
  useEffect(() => {
    if (activeTab === 'proposals' && inquiries.length === 0) {
      fetch('/api/v1/super-admin/custom-inquiries', {
        headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setInquiries(d.data);
        })
        .catch(() => {});
    }
  }, [activeTab, inquiries.length]);

  // Handle Trial Extension
  const handleExtendTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/subscriptions/${extendTarget.tenantId}/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          action: 'extend',
          additionalDays: Number(extendDays),
          reason: extendReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to extend trial.');

      setSubscriptions((prev) => prev.map((s) => (s.id === extendTarget.id ? json.data : s)));
      setExtendTarget(null);
      setExtendReason('');
    } catch (err: any) {
      setError(err?.message || 'Error extending trial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Payment Recording
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/subscriptions/${paymentTarget.tenantId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          currency: 'BDT',
          paymentStatus,
          paymentMethod,
          transactionReference: transactionRef || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to record payment.');

      await fetchSubscriptions(pagination.page);
      setPaymentTarget(null);
      setTransactionRef('');
    } catch (err: any) {
      setError(err?.message || 'Error recording payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Subscription
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/subscriptions/${cancelTarget.tenantId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          reason: cancelReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to cancel subscription.');

      setSubscriptions((prev) => prev.map((s) => (s.id === cancelTarget.id ? json.data : s)));
      setCancelTarget(null);
      setCancelReason('');
    } catch (err: any) {
      setError(err?.message || 'Error cancelling subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quotation Proposal Submission
  const handleQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/super-admin/custom-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          businessName: selectedInquiry.businessName,
          propertyCount: Number(quotationData.propertyCount),
          estimatedMembers: Number(quotationData.estimatedMembers),
          monthlyPrice: Number(quotationData.monthlyPrice),
          currency: 'BDT',
          includedFeatures: quotationData.includedFeatures,
          internalNotes: quotationData.internalNotes,
          customerNotes: quotationData.customerNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to create quotation.');

      // Refresh inquiries
      const inqRes = await fetch('/api/v1/super-admin/custom-inquiries', {
        headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
      });
      const inqJson = await inqRes.json();
      if (inqJson.success) setInquiries(inqJson.data);

      setIsQuotationModalOpen(false);
      setSelectedInquiry(null);
    } catch (err: any) {
      setError(err?.message || 'Error creating quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <CreditCard className="w-4 h-4" />
            <span>SaaS Financial & Subscription Management</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Subscriptions & Billings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage live mess subscriptions, 7-day trials, manual payment reconciliations, and custom business quotes.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Subscriptions ({pagination.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'proposals'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Custom Quotes ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Analytics & MRR
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: Subscriptions Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search mess name, slug, or plan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions(1)}
                  className="w-full text-sm pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="TRIALING">Trialing</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ALL">All Plans</option>
                <option value="STARTER">Starter</option>
                <option value="CUSTOM_BUSINESS">Custom Business</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>

            <button
              onClick={() => fetchSubscriptions(1)}
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Mess / Organization</th>
                    <th className="py-3 px-4">Plan & Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Trial Remaining</th>
                    <th className="py-3 px-4">Price Locked</th>
                    <th className="py-3 px-4">Current Period End</th>
                    <th className="py-3 px-4">Auto-Renew Consent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        Loading subscriptions...
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        No subscriptions match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-900">{sub.tenantName}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{sub.tenantSlug}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-800">{sub.planName}</div>
                          <span className="text-[10px] font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                            {sub.subscriptionType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'TRIALING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : sub.status === 'EXPIRED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {sub.status === 'TRIALING' ? (
                            <span className="text-blue-700 font-semibold">
                              {sub.trialRemainingDays !== null ? `${sub.trialRemainingDays} days left` : 'Active Trial'}
                            </span>
                          ) : sub.trialStatus === 'CONVERTED' ? (
                            <span className="text-emerald-700 font-medium">Converted to Paid</span>
                          ) : (
                            <span className="text-neutral-400">N/A</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-neutral-900">
                          ৳{sub.priceLocked} <span className="text-[10px] font-normal text-neutral-500">/mo</span>
                        </td>

                        <td className="py-3.5 px-4 text-neutral-600">
                          {sub.currentPeriodEndsAt
                            ? new Date(sub.currentPeriodEndsAt).toLocaleDateString()
                            : sub.trialEndsAt
                              ? `Trial: ${new Date(sub.trialEndsAt).toLocaleDateString()}`
                              : 'None'}
                        </td>

                        <td className="py-3.5 px-4">
                          {sub.autoRenewConsent ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Consented
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">No consent</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sub.status === 'TRIALING' && (
                              <button
                                onClick={() => {
                                  setExtendTarget(sub);
                                  setExtendDays(7);
                                  setExtendReason('');
                                }}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Extend Trial
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPaymentTarget(sub);
                                setPaymentAmount(sub.priceLocked || 99);
                                setTransactionRef('');
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Record Payment
                            </button>

                            {sub.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  setCancelTarget(sub);
                                  setCancelReason('');
                                }}
                                className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
              <div>
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchSubscriptions(pagination.page - 1)}
                  className="px-3 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchSubscriptions(pagination.page + 1)}
                  className="px-3 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Custom Quotes & Business Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-1">
              Custom Business Plan Inquiries & Quotations
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Requests received from multi-mess operators, hostels, and boarding houses requiring custom monthly pricing, property quotas, and tailored feature sets.
            </p>

            <div className="divide-y divide-neutral-200">
              {inquiries.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-500">
                  No custom business inquiries submitted yet.
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-neutral-900">{inq.businessName}</span>
                        <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                          {inq.businessCategory}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            inq.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inq.status === 'PROPOSAL_SENT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-600 flex flex-wrap gap-4 mt-1">
                        <span>Contact: <strong>{inq.contactName}</strong> ({inq.contactEmail || inq.contactPhone || 'N/A'})</span>
                        <span>Properties: <strong>{inq.propertyCount}</strong></span>
                        <span>Estimated Residents: <strong>{inq.estimatedMembers}</strong></span>
                      </div>

                      {inq.additionalRequirements && (
                        <p className="text-xs text-neutral-500 italic mt-1">
                          &ldquo;{inq.additionalRequirements}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setQuotationData({
                            monthlyPrice: 1500,
                            propertyCount: inq.propertyCount || 2,
                            estimatedMembers: inq.estimatedMembers || 80,
                            includedFeatures: inq.requiredFeatures?.length ? inq.requiredFeatures : ['member_management', 'meal_management', 'multiple_properties'],
                            internalNotes: '',
                            customerNotes: '',
                          });
                          setIsQuotationModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Prepare Quote
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Analytics & MRR Reports */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Monthly Recurring Revenue (MRR)</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">৳{analytics.mrrBdt}</div>
              <span className="text-[10px] text-neutral-400 mt-1 block">From confirmed active recurring subs</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Verified Collected Revenue</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">৳{analytics.collectedRevenueBdt}</div>
              <span className="text-[10px] text-emerald-600 mt-1 block">Strictly confirmed payments</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Pending Unpaid Invoices</span>
              <div className="text-2xl font-black text-amber-700 mt-1">৳{analytics.pendingRevenueBdt}</div>
              <span className="text-[10px] text-amber-600 mt-1 block">Excluded from collected revenue</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Trial Conversion Rate</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{analytics.trialToPaidConversionRate}%</div>
              <span className="text-[10px] text-blue-600 mt-1 block">Trial-to-paid conversions</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Active Subscriptions</span>
              <div className="text-xl font-bold text-neutral-900 mt-1">{analytics.totalActiveSubscriptions}</div>
              <div className="text-xs text-neutral-500 mt-2 space-y-1">
                <div>Starter Subscribers: <strong>{analytics.starterSubscribers}</strong></div>
                <div>Custom Business Subscribers: <strong>{analytics.customBusinessSubscribers}</strong></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Trial Accounts</span>
              <div className="text-xl font-bold text-neutral-900 mt-1">{analytics.trialAccounts}</div>
              <div className="text-xs text-neutral-500 mt-2 space-y-1">
                <div>Active 7-Day Trials: <strong>{analytics.trialAccounts}</strong></div>
                <div>Expired Trials: <strong>{analytics.expiredTrials}</strong></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <span className="text-xs text-neutral-500 font-medium">Cancelled Subscriptions</span>
              <div className="text-xl font-bold text-red-700 mt-1">{analytics.cancelledSubscriptions}</div>
              <div className="text-xs text-neutral-500 mt-2">
                Preserved historical billing and data governance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Extend Trial Modal */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Extend 7-Day Free Trial
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Mess: <strong>{extendTarget.tenantName}</strong>. Authorized trial extension requires a mandatory audit reason.
            </p>

            <form onSubmit={handleExtendTrialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Additional Days *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mandatory Reason for Extension *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="e.g. Operator requested 5 extra days to onboard students before payment confirmation"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || extendReason.trim().length < 5}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Extending...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Payment Modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Record Subscription Payment
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Tenant: <strong>{paymentTarget.tenantName}</strong> ({paymentTarget.planName})
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Amount (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Transaction Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9B87X21QA"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Payment Status *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                >
                  <option value="CONFIRMED">CONFIRMED (Activates Paid Access)</option>
                  <option value="PENDING">PENDING (Unpaid Invoice Only)</option>
                </select>
                <span className="text-[11px] text-neutral-500 block mt-1">
                  {paymentStatus === 'CONFIRMED'
                    ? '✔ Will instantly activate paid subscription and extend billing period.'
                    : '⚠ Pending payments do NOT grant paid feature access.'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cancel Subscription Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-red-700 mb-1">
              Cancel Subscription
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Cancel subscription for <strong>{cancelTarget.tenantName}</strong>. Historical data and invoices will be retained.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="e.g. Mess closed down for semester break"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cancelReason.trim().length < 5}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Prepare Quotation Modal */}
      {isQuotationModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Prepare Custom Quotation for {selectedInquiry.businessName}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Design custom monthly pricing and feature bundle for {selectedInquiry.contactName}.
            </p>

            <form onSubmit={handleQuotationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Monthly Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quotationData.monthlyPrice}
                    onChange={(e) => setQuotationData({ ...quotationData, monthlyPrice: Number(e.target.value) })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Property Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quotationData.propertyCount}
                    onChange={(e) => setQuotationData({ ...quotationData, propertyCount: Number(e.target.value) })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Included Features
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-50 border rounded-lg">
                  {PLAN_FEATURE_CATALOG.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quotationData.includedFeatures.includes(f.key)}
                        onChange={() => {
                          const exists = quotationData.includedFeatures.includes(f.key);
                          setQuotationData({
                            ...quotationData,
                            includedFeatures: exists
                              ? quotationData.includedFeatures.filter((k) => k !== f.key)
                              : [...quotationData.includedFeatures, f.key],
                          });
                        }}
                        className="text-emerald-600 rounded"
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Customer-Facing Proposal Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes dedicated phone support and multi-hostel onboarding."
                  value={quotationData.customerNotes}
                  onChange={(e) => setQuotationData({ ...quotationData, customerNotes: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Send Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
