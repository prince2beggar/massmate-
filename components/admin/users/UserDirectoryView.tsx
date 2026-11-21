'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  ShieldAlert,
  UserCheck,
  Building2,
  Lock,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';
import type { UserSummaryDto, UserDetailsDto } from '@/server/platform/platform-user-service';
import type { PlatformRole, UserStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface UserDirectoryViewProps {
  initialUsers: UserSummaryDto[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  currentUserRole?: PlatformRole | null;
}

export function UserDirectoryView({
  initialUsers,
  initialPagination,
  currentUserRole,
}: UserDirectoryViewProps) {
  const [users, setUsers] = useState<UserSummaryDto[]>(initialUsers);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [platformRole, setPlatformRole] = useState<PlatformRole | 'NONE' | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'staff'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [detailsUser, setDetailsUser] = useState<UserDetailsDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [statusTarget, setStatusTarget] = useState<UserSummaryDto | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [roleTarget, setRoleTarget] = useState<UserSummaryDto | null>(null);
  const [selectedRole, setSelectedRole] = useState<PlatformRole | 'NONE'>('NONE');
  const [roleReason, setRoleReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (pageToLoad: number = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageToLoad));
        params.set('limit', String(pagination.limit));
        if (search.trim()) params.set('search', search.trim());
        if (status !== 'ALL') params.set('status', status);

        if (activeTab === 'staff') {
          // fetch staff only
          const res = await fetch('/api/v1/super-admin/staff');
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to fetch staff');
          setUsers(data.data || []);
          setPagination({ page: 1, limit: 100, totalCount: (data.data || []).length, totalPages: 1 });
          setIsLoading(false);
          return;
        }

        if (platformRole !== 'ALL') params.set('platformRole', platformRole);

        const res = await fetch(`/api/v1/super-admin/users?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch users');
        }

        setUsers(data.data || []);
        if (data.meta?.pagination) {
          setPagination(data.meta.pagination);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading users.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, status, platformRole, activeTab, pagination.limit]
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchUsers(1);
  }, [fetchUsers]);

  // Load User Details
  const handleOpenDetails = async (userId: string) => {
    setIsLoadingDetails(true);
    setDetailsUser(null);
    try {
      const res = await fetch(`/api/v1/super-admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user details');
      setDetailsUser(data.data);
    } catch (err: any) {
      setError(err.message || 'Could not load user profile');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Submit Status Change (Suspend / Reactivate)
  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    if (statusReason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const newStatus = statusTarget.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    try {
      const res = await fetch(`/api/v1/super-admin/users/${statusTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update account status');

      setSuccessMessage(`Account for ${statusTarget.name} has been ${newStatus.toLowerCase()}.`);
      setStatusTarget(null);
      setStatusReason('');
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to update account status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Platform Role Assignment
  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget) return;
    if (roleReason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const targetRole = selectedRole === 'NONE' ? null : selectedRole;

    try {
      const res = await fetch(`/api/v1/super-admin/users/${roleTarget.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          reason: roleReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update platform role');

      setSuccessMessage(
        targetRole
          ? `Assigned role ${targetRole} to ${roleTarget.name}.`
          : `Removed platform role from ${roleTarget.name}.`
      );
      setRoleTarget(null);
      setRoleReason('');
      fetchUsers(pagination.page);
    } catch (err: any) {
      setError(err.message || 'Failed to assign platform role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = currentUserRole === 'PLATFORM_OWNER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Users & Staff</h1>
          <p className="text-sm text-slate-500">
            Global identity directory, cross-tenant memberships, and platform governance roles.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-md px-3 py-1.5 transition-all',
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            All Users ({pagination.totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={cn(
              'rounded-md px-3 py-1.5 transition-all flex items-center gap-1.5',
              activeTab === 'staff'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Shield className="h-3 w-3 text-indigo-600" />
            Platform Team
          </button>
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
            placeholder="Search by name, email, phone, or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="Filter users by account status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Role Filter (when on All tab) */}
          {activeTab === 'all' && (
            <select
              aria-label="Filter users by platform role"
              value={platformRole}
              onChange={(e) => setPlatformRole(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Roles</option>
              <option value="PLATFORM_OWNER">Platform Owner</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="SUPPORT_STAFF">Support Staff</option>
              <option value="FINANCE_STAFF">Finance Staff</option>
              <option value="NONE">Standard Users Only</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => fetchUsers(pagination.page)}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tenant Memberships</th>
                <th className="px-4 py-3">Platform Role</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-500" />
                    Loading platform identities...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* User Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{u.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || '—'}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        {u.status === 'ACTIVE' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : u.status === 'SUSPENDED' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {u.status}
                      </span>
                    </td>

                    {/* Memberships */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{u.membershipsCount}</span>
                        <span className="text-slate-400">messes</span>
                      </div>
                      {u.memberships && u.memberships.length > 0 && (
                        <div className="mt-0.5 max-w-xs truncate text-[10px] text-slate-500">
                          {u.memberships.map((m) => `${m.tenantName} (${m.roleName})`).join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Platform Role */}
                    <td className="px-4 py-3">
                      {u.platformRole ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          <Shield className="h-3 w-3 text-indigo-600" />
                          {u.platformRole}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standard User</span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(u.id)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          title="View user profile & memberships"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStatusTarget(u);
                            setStatusReason('');
                          }}
                          className={cn(
                            'rounded-lg border p-1.5 text-xs transition-colors',
                            u.status === 'SUSPENDED'
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          )}
                          title={u.status === 'SUSPENDED' ? 'Reactivate Account' : 'Suspend Account'}
                        >
                          {u.status === 'SUSPENDED' ? (
                            <UserCheck className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleTarget(u);
                              setSelectedRole(u.platformRole || 'NONE');
                              setRoleReason('');
                            }}
                            className="rounded-lg border border-indigo-200 p-1.5 text-indigo-700 hover:bg-indigo-50"
                            title="Assign Platform Role (Platform Owner exclusive)"
                          >
                            <Shield className="h-3.5 w-3.5" />
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

        {/* Pagination */}
        {activeTab === 'all' && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total users)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: User Details Drawer / Modal */}
      {(detailsUser || isLoadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">User Identity Profile</h2>
              <button
                type="button"
                onClick={() => setDetailsUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetails || !detailsUser ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-500" />
                Loading detailed profile...
              </div>
            ) : (
              <div className="mt-4 space-y-6 text-xs">
                {/* Profile Section */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                      {detailsUser.name ? detailsUser.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{detailsUser.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">ID: {detailsUser.id}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {detailsUser.status}
                        </span>
                        {detailsUser.platformRole && (
                          <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            {detailsUser.platformRole}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-3">
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <p className="font-medium text-slate-800">{detailsUser.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <p className="font-medium text-slate-800">{detailsUser.phone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Registered:</span>
                      <p className="font-medium text-slate-800">
                        {new Date(detailsUser.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Last Activity:</span>
                      <p className="font-medium text-slate-800">
                        {detailsUser.lastActivityAt
                          ? new Date(detailsUser.lastActivityAt).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tenant Memberships Section */}
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    Tenant Memberships ({detailsUser.memberships.length})
                  </h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {detailsUser.memberships.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        No active tenant memberships registered.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Tenant</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Tenant Role</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailsUser.memberships.map((m) => (
                            <tr key={m.tenantId}>
                              <td className="px-3 py-2 font-medium text-slate-800">{m.tenantName}</td>
                              <td className="px-3 py-2 text-slate-500">{m.tenantType}</td>
                              <td className="px-3 py-2">
                                <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  {m.roleName}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {m.membershipStatus}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {new Date(m.joinedDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    * Multi-tenant security guarantee: Tenant roles are completely isolated per mess.
                  </p>
                </div>

                {/* Audit & Activity Logs */}
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Recent Account Activity
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    {detailsUser.recentAuditLogs.length === 0 ? (
                      <p className="text-center text-slate-400 py-2">No recent audit records.</p>
                    ) : (
                      detailsUser.recentAuditLogs.map((log) => (
                        <div key={log.id} className="flex items-start justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <span className="font-mono text-indigo-700 font-semibold">{log.action}</span>
                            <p className="text-slate-600 text-[11px]">{log.description || log.entityType}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Suspend / Reactivate Confirmation Modal */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">
              {statusTarget.status === 'SUSPENDED' ? 'Reactivate Platform Account' : 'Suspend Platform Account'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Target: <span className="font-semibold text-slate-800">{statusTarget.name}</span> ({statusTarget.email || statusTarget.id})
            </p>

            <form onSubmit={handleSubmitStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Action (Required, minimum 5 characters):
                </label>
                <textarea
                  rows={3}
                  required
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Terms violation review, security freeze, customer identity verification resolved..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors',
                    statusTarget.status === 'SUSPENDED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700',
                    isSubmitting && 'opacity-50'
                  )}
                >
                  {isSubmitting ? 'Updating...' : statusTarget.status === 'SUSPENDED' ? 'Reactivate User' : 'Suspend User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Assign Platform Role Modal (PLATFORM_OWNER only) */}
      {roleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">Manage Platform Role</h2>
            <p className="mt-1 text-xs text-slate-500">
              Assign staff privileges for: <span className="font-semibold text-slate-800">{roleTarget.name}</span>
            </p>

            <form onSubmit={handleSubmitRole} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Platform Role:
                </label>
                <select
                  aria-label="Select platform role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="NONE">None (Revoke Platform Role)</option>
                  <option value="PLATFORM_OWNER">Platform Owner (Full Platform Access)</option>
                  <option value="PLATFORM_ADMIN">Platform Admin (Operations & Tenants)</option>
                  <option value="SUPPORT_STAFF">Support Staff (Helpdesk & Verification)</option>
                  <option value="FINANCE_STAFF">Finance Staff (Billing & Invoices)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Role Change (Required, minimum 5 characters):
                </label>
                <textarea
                  rows={2}
                  required
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  placeholder="e.g. Onboarded to support operations team, promotional elevation..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleTarget(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Role Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
