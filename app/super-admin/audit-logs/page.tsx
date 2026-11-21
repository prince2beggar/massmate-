import React from 'react';
import Link from 'next/link';
import { History, Shield, ArrowLeft, Database, Clock, User, Building } from 'lucide-react';
import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';

export default async function SuperAdminAuditLogsPage() {
  const dbConfig = inspectDatabaseConfig();
  let auditLogs: any[] = [];

  if (dbConfig.configured && dbConfig.runtimeUrl) {
    try {
      auditLogs = await prisma.auditLog.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: { id: true, name: true, email: true },
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    } catch {
      auditLogs = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Audit Logs</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Immutable Ledger
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cryptographically sequenced append-only compliance logs of all administrative actions.
          </p>
        </div>

        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Showing {auditLogs.length} Recent Log Entries
          </span>
          <span className="text-[11px] text-slate-400">
            {dbConfig.configured ? 'Neon PostgreSQL Active' : 'Dev DB Mode'}
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-lg bg-slate-50 p-6 text-center border border-dashed border-slate-200">
            <History className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No platform audit logs recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              All mutations initiated by platform admins, tenant administrators, or automated governance jobs will be automatically appended here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Tenant Scope</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-indigo-600">
                      {log.action}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 uppercase text-[10px] font-bold text-slate-700">
                      {log.entityType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {log.actorUser ? (
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <User className="h-3 w-3 text-slate-400" />
                          {log.actorUser.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {log.tenant ? (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Building className="h-3 w-3 text-slate-400" />
                          {log.tenant.name}
                        </span>
                      ) : (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Platform
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-xs">
                      {log.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
