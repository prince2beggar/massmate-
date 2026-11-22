'use client';

import React from 'react';
import { X, FileDiff, ArrowRight, ShieldCheck } from 'lucide-react';
import type { AuditLogDto } from '@/server/settings/mess-settings-service';

interface AuditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogDto | null;
}

export function AuditDiffModal({ isOpen, onClose, log }: AuditDiffModalProps) {
  if (!isOpen || !log) return null;

  const hasDiff = Boolean(log.beforeData || log.afterData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileDiff className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Audit Record Inspection</h2>
              <p className="text-xs text-muted-foreground">
                Action: <span className="font-mono text-primary font-semibold">{log.action}</span> • {log.createdAtFormatted}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Actor</span>
              <span className="font-medium text-foreground">{log.actorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Role</span>
              <span className="font-medium text-foreground">{log.actorRole}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Module</span>
              <span className="font-medium text-foreground capitalize">{log.entityType}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Entity ID</span>
              <span className="font-mono text-[11px] text-foreground truncate block">{log.entityId || 'N/A'}</span>
            </div>
          </div>

          {log.description && (
            <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground/90">
              <span className="font-bold text-muted-foreground block mb-0.5">Narrative:</span>
              {log.description}
            </div>
          )}

          {/* Before vs After Diff View */}
          {hasDiff ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  State Before Mutation
                </span>
                <div className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11px] overflow-x-auto max-h-60 text-foreground/80">
                  {log.beforeData ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.beforeData, null, 2)}</pre>
                  ) : (
                    <span className="text-muted-foreground italic">None (Initial Record Creation)</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  State After Mutation
                </span>
                <div className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11px] overflow-x-auto max-h-60 text-foreground/80">
                  {log.afterData ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.afterData, null, 2)}</pre>
                  ) : (
                    <span className="text-muted-foreground italic">None (Record Deleted or Archived)</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No state modification payload was recorded for this administrative event.
            </div>
          )}

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Sensitive tokens, password hashes, and authorization credentials have been automatically sanitized.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border bg-muted/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
