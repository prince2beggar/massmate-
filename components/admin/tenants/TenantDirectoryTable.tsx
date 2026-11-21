'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Clock,
  MoreVertical,
  Edit,
  Eye,
  CheckCircle,
  Ban,
  User,
} from 'lucide-react';
import type { TenantListItem } from '@/server/platform/platform-tenant-service';
import type { TenantStatus, VerificationStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface TenantDirectoryTableProps {
  tenants: TenantListItem[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
  onEdit: (tenant: TenantListItem) => void;
  onChangeStatus: (tenant: TenantListItem) => void;
  onVerify: (tenant: TenantListItem) => void;
}

export function TenantDirectoryTable({
  tenants,
  isLoading,
  pagination,
  onPageChange,
  onEdit,
  onChangeStatus,
  onVerify,
}: TenantDirectoryTableProps) {
  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'INACTIVE':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getVerificationBadge = (vStatus: VerificationStatus) => {
    switch (vStatus) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADDITIONAL_INFO_REQUIRED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NOT_SUBMITTED':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const formatTenantType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Organization / Mess</th>
              <th className="px-4 py-3.5">Type & City</th>
              <th className="px-4 py-3.5">Owner Identity</th>
              <th className="px-4 py-3.5 text-center">Members</th>
              <th className="px-4 py-3.5">Subscription</th>
              <th className="px-4 py-3.5">Verification</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                  <p>Loading platform tenant directory...</p>
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                  <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">No matching tenants found</p>
                  <p className="mt-1 text-[11px]">Try adjusting your search criteria or register a new mess above.</p>
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Column 1: Mess Name & ID */}
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/super-admin/tenants/${t.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                      >
                        {t.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono text-[10px] text-slate-500">{t.slug}</span>
                        <span>•</span>
                        <span className="font-mono text-[9px] text-slate-400 truncate max-w-[80px]" title={t.id}>
                          {t.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Type & City */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-slate-700">{formatTenantType(t.tenantType)}</div>
                    <div className="text-[11px] text-slate-400">{t.city || 'Not specified'}</div>
                  </td>

                  {/* Column 3: Owner */}
                  <td className="px-4 py-3">
                    {t.owner ? (
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{t.owner.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{t.owner.email || t.owner.phone}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Column 4: Total Members */}
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                      {t.totalMembers}
                    </span>
                  </td>

                  {/* Column 5: Subscription */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-slate-800">{t.subscription.planName}</div>
                    <span className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wide">
                      {t.subscription.status}
                    </span>
                  </td>

                  {/* Column 6: Verification */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onVerify(t)}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all hover:opacity-80 cursor-pointer',
                        getVerificationBadge(t.verificationStatus)
                      )}
                      title="Click to review verification"
                    >
                      {t.verificationStatus.replace(/_/g, ' ')}
                    </button>
                  </td>

                  {/* Column 7: Operational Status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onChangeStatus(t)}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all hover:opacity-80 cursor-pointer',
                        getStatusBadge(t.status)
                      )}
                      title="Click to alter account status"
                    >
                      {t.status}
                    </button>
                  </td>

                  {/* Column 8: Actions */}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/super-admin/tenants/${t.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Edit Mess Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <div>
          Page <span className="font-bold text-slate-900 font-mono">{pagination.page}</span> of{' '}
          <span className="font-bold text-slate-900 font-mono">{pagination.totalPages}</span> (
          {pagination.totalCount} total messes)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => onPageChange(pagination.page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() => onPageChange(pagination.page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
