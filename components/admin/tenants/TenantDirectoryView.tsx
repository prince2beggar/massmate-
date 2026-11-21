'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { TenantFilterToolbar, type TenantFilterState } from './TenantFilterToolbar';
import { TenantDirectoryTable } from './TenantDirectoryTable';
import { CreateTenantModal } from './CreateTenantModal';
import { EditTenantModal } from './EditTenantModal';
import { TenantStatusModal } from './TenantStatusModal';
import { TenantVerificationModal } from './TenantVerificationModal';
import type { TenantListItem } from '@/server/platform/platform-tenant-service';

interface TenantDirectoryViewProps {
  initialTenants?: TenantListItem[];
  initialPagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function TenantDirectoryView({
  initialTenants = [],
  initialPagination = { page: 1, limit: 10, totalCount: 0, totalPages: 0 },
}: TenantDirectoryViewProps) {
  const [tenants, setTenants] = useState<TenantListItem[]>(initialTenants);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<TenantFilterState>({
    search: '',
    status: 'ALL',
    verificationStatus: 'ALL',
    tenantType: 'ALL',
    city: '',
  });

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<TenantListItem | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<TenantListItem | null>(null);

  const fetchTenants = useCallback(
    async (currentPage = pagination.page) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters.search.trim()) queryParams.set('search', filters.search.trim());
        if (filters.status !== 'ALL') queryParams.set('status', filters.status);
        if (filters.verificationStatus !== 'ALL')
          queryParams.set('verificationStatus', filters.verificationStatus);
        if (filters.tenantType !== 'ALL') queryParams.set('tenantType', filters.tenantType);
        if (filters.city.trim()) queryParams.set('city', filters.city.trim());
        queryParams.set('page', String(currentPage));
        queryParams.set('limit', String(pagination.limit));

        const res = await fetch(`/api/v1/super-admin/tenants?${queryParams.toString()}`, {
          headers: {
            'x-dev-platform-user': 'dev_super_admin_owner',
          },
        });

        const json = await res.json();
        if (json.success && json.data) {
          setTenants(json.data);
          if (json.meta) {
            setPagination({
              page: json.meta.page,
              limit: json.meta.limit,
              totalCount: json.meta.total ?? json.meta.totalCount ?? 0,
              totalPages: json.meta.totalPages,
            });
          }
        } else {
          setError(json.error?.message || 'Failed to fetch tenants.');
        }
      } catch (err: any) {
        setError(err?.message || 'Network error fetching tenants.');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.page]
  );

  const isFirstRender = React.useRef(true);

  // Re-fetch on filter changes after initial server render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchTenants(1);
  }, [filters, fetchTenants]);

  const handlePageChange = (newPage: number) => {
    fetchTenants(newPage);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      verificationStatus: 'ALL',
      tenantType: 'ALL',
      city: '',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Mess & Tenant Management
            </h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Directory
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitor, approve, verify, and govern all registered student messes, bachelor flats, and hostels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTenants(pagination.page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <TenantFilterToolbar
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onReset={handleResetFilters}
        onCreateOpen={() => setIsCreateOpen(true)}
        totalCount={pagination.totalCount}
        isLoading={isLoading}
      />

      {/* Directory Table */}
      <TenantDirectoryTable
        tenants={tenants}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={(t) => setEditTarget(t)}
        onChangeStatus={(t) => setStatusTarget(t)}
        onVerify={(t) => setVerifyTarget(t)}
      />

      {/* Modals */}
      <CreateTenantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchTenants(1)}
      />

      {editTarget && (
        <EditTenantModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          tenant={{
            id: editTarget.id,
            name: editTarget.name,
            description: null,
            email: editTarget.email,
            phone: editTarget.phone,
            address: null,
            city: editTarget.city,
            tenantType: editTarget.tenantType,
          }}
          onUpdated={() => fetchTenants(pagination.page)}
        />
      )}

      {statusTarget && (
        <TenantStatusModal
          isOpen={true}
          onClose={() => setStatusTarget(null)}
          tenantId={statusTarget.id}
          tenantName={statusTarget.name}
          currentStatus={statusTarget.status}
          onStatusChanged={() => fetchTenants(pagination.page)}
        />
      )}

      {verifyTarget && (
        <TenantVerificationModal
          isOpen={true}
          onClose={() => setVerifyTarget(null)}
          tenantId={verifyTarget.id}
          tenantName={verifyTarget.name}
          currentStatus={verifyTarget.verificationStatus}
          onReviewed={() => fetchTenants(pagination.page)}
        />
      )}
    </div>
  );
}
