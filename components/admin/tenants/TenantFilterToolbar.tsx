'use client';

import React from 'react';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';
import type { TenantStatus, TenantType, VerificationStatus } from '@/types/database';

export interface TenantFilterState {
  search: string;
  status: TenantStatus | 'ALL';
  verificationStatus: VerificationStatus | 'ALL';
  tenantType: TenantType | 'ALL';
  city: string;
}

interface TenantFilterToolbarProps {
  filters: TenantFilterState;
  onFilterChange: (newFilters: Partial<TenantFilterState>) => void;
  onReset: () => void;
  onCreateOpen: () => void;
  totalCount: number;
  isLoading?: boolean;
}

export function TenantFilterToolbar({
  filters,
  onFilterChange,
  onReset,
  onCreateOpen,
  totalCount,
  isLoading,
}: TenantFilterToolbarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.verificationStatus !== 'ALL' ||
    filters.tenantType !== 'ALL' ||
    filters.city !== '';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search by name, slug, ID, or owner email..."
            aria-label="Search tenants"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action Button: Create New Tenant */}
        <button
          type="button"
          onClick={onCreateOpen}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Mess / Tenant</span>
        </button>
      </div>

      {/* Filter Selectors Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-medium mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        {/* Account Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value as any })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          aria-label="Filter by operational status"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="PENDING">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Verification Status Filter */}
        <select
          value={filters.verificationStatus}
          onChange={(e) => onFilterChange({ verificationStatus: e.target.value as any })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          aria-label="Filter by verification status"
        >
          <option value="ALL">All Verification</option>
          <option value="APPROVED">Verified Only</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="ADDITIONAL_INFO_REQUIRED">Info Required</option>
          <option value="NOT_SUBMITTED">Not Submitted</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* Tenant Type Filter */}
        <select
          value={filters.tenantType}
          onChange={(e) => onFilterChange({ tenantType: e.target.value as any })}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          aria-label="Filter by tenant type"
        >
          <option value="ALL">All Types</option>
          <option value="STUDENT_MESS">Student Mess</option>
          <option value="BACHELOR_MESS">Bachelor Mess</option>
          <option value="HOSTEL">Hostel</option>
          <option value="SHARED_APARTMENT">Shared Apartment</option>
          <option value="OTHER">Other</option>
        </select>

        {/* City Filter */}
        <input
          type="text"
          value={filters.city}
          onChange={(e) => onFilterChange({ city: e.target.value })}
          placeholder="Filter city (e.g. Dhaka)"
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden max-w-[130px]"
        />

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}

        <span className="text-[11px] text-slate-400 ml-auto font-medium">
          {isLoading ? 'Loading...' : `Showing ${totalCount} records`}
        </span>
      </div>
    </div>
  );
}
