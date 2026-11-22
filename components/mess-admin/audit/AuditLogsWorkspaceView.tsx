'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  FileDiff,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { AuditDiffModal } from './AuditDiffModal';
import type { AuditLogDto } from '@/server/settings/mess-settings-service';

interface AuditLogsWorkspaceViewProps {
  tenantSlug: string;
}

export function AuditLogsWorkspaceView({ tenantSlug }: AuditLogsWorkspaceViewProps) {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (search.trim()) params.set('search', search.trim());
        if (moduleFilter) params.set('module', moduleFilter);
        if (actionFilter) params.set('action', actionFilter);

        const res = await fetch(`/api/v1/mess/${tenantSlug}/audit-logs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load audit logs');
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setLogs(data.data);
          if (data.pagination) {
            setTotal(data.pagination.total);
          }
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLogs();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, page, pageSize, moduleFilter, reloadTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setReloadTrigger((v) => v + 1);
  };

  const handleRefresh = () => {
    setLoading(true);
    setReloadTrigger((v) => v + 1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getModuleColor = (mod: string) => {
    switch (mod.toLowerCase()) {
      case 'membership':
      case 'member':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'room':
      case 'rooms':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'meal':
      case 'meals':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'bazar':
      case 'expense':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'finance':
      case 'billing':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'payment':
      case 'payments':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'role':
      case 'roles':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'mess_settings':
      case 'settings':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            Audit Logs & Security Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable, append-only chronological timeline of administrative mutations and operational events.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Append-Only Tamper Notice Banner */}
      <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3 shadow-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            Append-Only Audit Trail Policy:
          </p>
          <p>
            All records in this ledger are strictly append-only. No ordinary mess administrator or moderator can modify, edit, or delete historical audit entries. Sensitive credentials, passwords, and authorization tokens are automatically sanitized before persistence.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search narrative description, action, or entity..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Modules</option>
              <option value="membership">Members</option>
              <option value="room">Rooms</option>
              <option value="meal">Meals</option>
              <option value="expense">Bazar & Expenses</option>
              <option value="monthly_billing">Finance</option>
              <option value="payment">Payments</option>
              <option value="role">Roles</option>
              <option value="mess_settings">Settings</option>
            </select>

            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Retrieving audit timeline...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ScrollText className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No Audit Records Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No audit records matched your search filters. As administrative mutations occur in this mess, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp (Dhaka)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {log.createdAtFormatted}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-foreground block">{log.actorName}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {log.actorRole}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getModuleColor(
                          log.entityType
                        )}`}
                      >
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-foreground">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 max-w-md text-foreground/80 line-clamp-2">
                      {log.description || 'No description recorded'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded border border-border text-foreground hover:bg-muted font-medium inline-flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <FileDiff className="h-3 w-3" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-foreground px-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Diff Modal */}
      <AuditDiffModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
