'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  ShieldAlert,
  Server,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import type { DomainDto } from '@/server/domain/types';
import type { DomainType, DomainVerificationStatus, DomainStatus } from '@/types/database';
import {
  DNS_CONFIGURATION_GUIDANCE,
  VERIFICATION_TXT_PREFIX,
  VERIFICATION_CHALLENGE_SUBDOMAIN,
} from '@/server/domain/constants';

interface DomainDirectoryViewProps {
  initialDomains: DomainDto[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function DomainDirectoryView({
  initialDomains,
  initialPagination,
}: DomainDirectoryViewProps) {
  const [domains, setDomains] = useState<DomainDto[]>(initialDomains);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [domainType, setDomainType] = useState<DomainType | 'ALL'>('ALL');
  const [verificationStatus, setVerificationStatus] = useState<DomainVerificationStatus | 'ALL'>('ALL');
  const [status, setStatus] = useState<DomainStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [detailsDomain, setDetailsDomain] = useState<DomainDto | null>(null);
  const [statusTarget, setStatusTarget] = useState<DomainDto | null>(null);
  const [newStatus, setNewStatus] = useState<DomainStatus>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Request Custom Domain Form
  const [newTenantId, setNewTenantId] = useState('');
  const [newDomainName, setNewDomainName] = useState('');

  const isFirstRender = useRef(true);

  const fetchDomains = useCallback(
    async (pageToFetch = pagination.page) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (domainType !== 'ALL') params.set('domainType', domainType);
        if (verificationStatus !== 'ALL') params.set('verificationStatus', verificationStatus);
        if (status !== 'ALL') params.set('status', status);
        params.set('page', String(pageToFetch));
        params.set('limit', String(pagination.limit));

        const res = await fetch(`/api/v1/super-admin/domains?${params.toString()}`, {
          headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
        });

        const json = await res.json();
        if (json.success && json.data) {
          setDomains(json.data);
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
        setError(err?.message || 'Failed to fetch domains.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, domainType, verificationStatus, status, pagination.limit, pagination.page]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchDomains(1);
  }, [domainType, verificationStatus, status, fetchDomains]);

  // Request custom domain
  const handleRequestDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          tenantId: newTenantId.trim(),
          domainName: newDomainName.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to register domain.');

      setSuccessMessage('Custom domain request submitted. Follow DNS instructions below to verify.');
      setIsRequestModalOpen(false);
      setNewTenantId('');
      setNewDomainName('');
      setDetailsDomain(json.data);
      await fetchDomains(1);
    } catch (err: any) {
      setError(err?.message || 'Error registering custom domain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-verify domain
  const handleTriggerVerify = async (domain: DomainDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/super-admin/domains/${domain.id}/verify`, {
        method: 'POST',
        headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Verification failed.');

      if (json.data.verified) {
        setSuccessMessage(`✔ Domain ${domain.domainName} verified successfully!`);
      } else {
        setError(`Verification check incomplete: ${json.data.reason || 'DNS record not detected'}`);
      }

      await fetchDomains(pagination.page);
      if (detailsDomain?.id === domain.id) {
        const fresh = await fetch(`/api/v1/super-admin/domains/${domain.id}`, {
          headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
        }).then((r) => r.json());
        if (fresh.success) setDetailsDomain(fresh.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Error triggering domain verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set primary domain
  const handleSetPrimary = async (domain: DomainDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/super-admin/domains/${domain.id}/primary`, {
        method: 'POST',
        headers: { 'x-dev-platform-user': 'dev_super_admin_owner' },
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to set primary domain.');

      setSuccessMessage(`✔ ${domain.domainName} is now the primary domain for ${domain.tenantName}.`);
      await fetchDomains(pagination.page);
    } catch (err: any) {
      setError(err?.message || 'Error setting primary domain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update status (suspend / reactivate / remove)
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/domains/${statusTarget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to update domain status.');

      setSuccessMessage(`Domain status updated to ${newStatus}.`);
      setStatusTarget(null);
      setStatusReason('');
      await fetchDomains(pagination.page);
    } catch (err: any) {
      setError(err?.message || 'Error updating domain status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Globe className="w-4 h-4" />
            <span>Multi-Tenant Network Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Domain & Subdomain Management</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Oversee canonical platform subdomains, custom domain DNS TXT ownership challenges, and primary routing.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRequestModalOpen(true);
            setError(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Custom Domain</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search domain name, mess name, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDomains(1)}
              className="w-full text-sm pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <select
            value={domainType}
            onChange={(e) => setDomainType(e.target.value as any)}
            className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="PLATFORM_SUBDOMAIN">Platform Subdomains</option>
            <option value="CUSTOM_DOMAIN">Custom Domains</option>
          </select>

          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as any)}
            className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="ALL">All Verification States</option>
            <option value="NOT_REQUIRED">Not Required (Subdomains)</option>
            <option value="PENDING">Pending Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Verification Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>

        <button
          onClick={() => fetchDomains(1)}
          className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Linked Organization</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Primary</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">DNS Status</th>
                <th className="py-3 px-4">SSL Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    Loading domains...
                  </td>
                </tr>
              ) : domains.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    No domain records match your filter criteria.
                  </td>
                </tr>
              ) : (
                domains.map((dom) => (
                  <tr key={dom.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span>{dom.domainName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-800">{dom.tenantName}</div>
                      <span className="text-[10px] font-mono text-neutral-400">{dom.tenantSlug}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          dom.domainType === 'CUSTOM_DOMAIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {dom.domainType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {dom.isPrimary ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          PRIMARY
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[10px]">Secondary</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          dom.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dom.verificationStatus === 'PENDING'
                              ? 'bg-blue-100 text-blue-800'
                              : dom.verificationStatus === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : dom.verificationStatus === 'EXPIRED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {dom.verificationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono ${
                          dom.dnsStatus === 'CONFIGURED' ? 'text-emerald-700 font-semibold' : 'text-neutral-500'
                        }`}
                      >
                        {dom.dnsStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono ${
                          dom.sslStatus === 'ACTIVE'
                            ? 'text-emerald-700 font-semibold'
                            : dom.sslStatus === 'PENDING'
                              ? 'text-blue-700'
                              : 'text-neutral-400'
                        }`}
                      >
                        {dom.sslStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          dom.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : dom.status === 'SUSPENDED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {dom.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsDomain(dom)}
                          className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>

                        {dom.domainType === 'CUSTOM_DOMAIN' && dom.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleTriggerVerify(dom)}
                            disabled={isSubmitting}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Check DNS
                          </button>
                        )}

                        {!dom.isPrimary && dom.status === 'ACTIVE' && (dom.domainType === 'PLATFORM_SUBDOMAIN' || dom.verificationStatus === 'VERIFIED') && (
                          <button
                            onClick={() => handleSetPrimary(dom)}
                            disabled={isSubmitting}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}

                        {dom.status !== 'SUSPENDED' && dom.domainType === 'CUSTOM_DOMAIN' && (
                          <button
                            onClick={() => {
                              setStatusTarget(dom);
                              setNewStatus('SUSPENDED');
                              setStatusReason('');
                            }}
                            className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {dom.status === 'SUSPENDED' && (
                          <button
                            onClick={() => {
                              setStatusTarget(dom);
                              setNewStatus('ACTIVE');
                              setStatusReason('');
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Reactivate
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
              onClick={() => fetchDomains(pagination.page - 1)}
              className="px-3 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchDomains(pagination.page + 1)}
              className="px-3 py-1 bg-white border border-neutral-300 rounded hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Request Custom Domain */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Request Custom Domain
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Mount a proprietary domain name (e.g. <code>hostel.example.com</code>). Requires Custom Domain subscription entitlement.
            </p>

            <form onSubmit={handleRequestDomainSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tenant ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tnt_..."
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Custom Domain FQDN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. studentmess.org"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600">
                <span className="font-semibold block text-neutral-800 mb-0.5">Verification Process:</span>
                Submitting creates a pending challenge with a unique DNS TXT record. Domain ownership must be proven via DNS query before routing activates.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Request Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Inspect Domain & DNS Guidance */}
      {detailsDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-base font-bold text-neutral-900 font-mono">
                  {detailsDomain.domainName}
                </h3>
                <span className="text-xs text-neutral-500">
                  {detailsDomain.tenantName} ({detailsDomain.tenantSlug})
                </span>
              </div>
              <button
                onClick={() => setDetailsDomain(null)}
                className="text-neutral-400 hover:text-neutral-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div>
                  <span className="text-neutral-400 block">Domain Type</span>
                  <span className="font-semibold text-neutral-800">{detailsDomain.domainType}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Routing Priority</span>
                  <span className="font-semibold text-neutral-800">
                    {detailsDomain.isPrimary ? 'Primary Domain' : 'Secondary'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Verification Status</span>
                  <span className="font-semibold text-neutral-800">{detailsDomain.verificationStatus}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Operational Status</span>
                  <span className="font-semibold text-neutral-800">{detailsDomain.status}</span>
                </div>
              </div>

              {/* DNS Verification Guidance (For Custom Domains) */}
              {detailsDomain.domainType === 'CUSTOM_DOMAIN' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    DNS TXT Verification Challenge
                  </h4>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Host / Record Name:</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 font-mono">
                        {VERIFICATION_CHALLENGE_SUBDOMAIN}.{detailsDomain.domainName}
                      </code>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Record Type:</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 font-mono">
                        TXT
                      </code>
                    </div>

                    <div>
                      <span className="font-semibold text-blue-900 block mb-1">Challenge Value:</span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white p-2 rounded border border-blue-200 text-blue-900 font-mono break-all text-[11px]">
                          {VERIFICATION_TXT_PREFIX}{detailsDomain.verificationToken || 'N/A'}
                        </code>
                        {detailsDomain.verificationToken && (
                          <button
                            onClick={() => copyToClipboard(`${VERIFICATION_TXT_PREFIX}${detailsDomain.verificationToken}`)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors cursor-pointer"
                          >
                            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {detailsDomain.verificationExpiresAt && (
                      <span className="text-[11px] text-blue-700 block">
                        Expires: {new Date(detailsDomain.verificationExpiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider pt-2">
                    CNAME Ingress Routing Target
                  </h4>

                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Record Type:</span>
                      <span className="font-mono font-semibold">CNAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Target Ingress:</span>
                      <span className="font-mono font-semibold">{DNS_CONFIGURATION_GUIDANCE.cname.value}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {DNS_CONFIGURATION_GUIDANCE.cname.statusNotice}
                    </p>
                  </div>
                </div>
              )}

              {detailsDomain.verificationFailedReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="font-semibold block mb-0.5">Last Verification Failure:</span>
                  <span>{detailsDomain.verificationFailedReason}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-neutral-200">
              {detailsDomain.domainType === 'CUSTOM_DOMAIN' && detailsDomain.verificationStatus !== 'VERIFIED' && (
                <button
                  onClick={() => handleTriggerVerify(detailsDomain)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Run DNS Check
                </button>
              )}
              <button
                onClick={() => setDetailsDomain(null)}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Domain Status */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              {newStatus === 'SUSPENDED' ? 'Suspend Domain' : 'Reactivate Domain'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Domain: <code className="font-mono">{statusTarget.domainName}</code>
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="REMOVED">REMOVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reason for Status Modification *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="e.g. Domain reported for compliance review or tenant requested temporary suspension"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || statusReason.trim().length < 5}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer ${
                    newStatus === 'SUSPENDED' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Updating...' : `Confirm ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
