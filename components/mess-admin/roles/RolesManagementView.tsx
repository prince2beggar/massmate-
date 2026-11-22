'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldPlus,
  Lock,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { CreateRoleModal } from './CreateRoleModal';
import { EditRoleModal } from './EditRoleModal';
import type { RoleDto } from '@/server/settings/mess-settings-service';

interface RolesManagementViewProps {
  tenantSlug: string;
}

export function RolesManagementView({ tenantSlug }: RolesManagementViewProps) {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadRoles() {
      try {
        const res = await fetch(`/api/v1/mess/${tenantSlug}/roles`);
        if (!res.ok) throw new Error('Failed to load mess roles');
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setRoles(data.data);
        }
      } catch (err: any) {
        if (isMounted) setMessage({ type: 'error', text: err.message || 'Error loading roles' });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRoles();
    return () => {
      isMounted = false;
    };
  }, [tenantSlug, reloadTrigger]);

  const fetchRoles = () => {
    setLoading(true);
    setReloadTrigger((v) => v + 1);
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      setDeleteLoading(true);
      setMessage(null);

      const res = await fetch(`/api/v1/mess/${tenantSlug}/roles/${deletingRole.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to delete role');
      }

      setMessage({ type: 'success', text: `Role "${deletingRole.name}" deleted successfully.` });
      setDeletingRole(null);
      fetchRoles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete role' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Roles & Granular Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system and custom roles with granular capabilities across all 10 mess modules.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm transition-all"
        >
          <ShieldPlus className="h-4 w-4" />
          Create Custom Role
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Security Governance Invariants Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            Sole Owner Protection
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The sole active Owner cannot be demoted, suspended, or removed without first appointing another active Owner.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <KeyRound className="h-3.5 w-3.5" />
            Anti-Privilege Escalation
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Administrators and staff can never delegate or grant permissions that they do not personally hold in this mess.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            Anti-Self-Promotion
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Users cannot modify or escalate their own roles. Role appointments must be executed by another authorized manager.
          </p>
        </div>
      </div>

      {/* Roles Directory */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading role definitions and permission matrices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                    {r.name}
                  </h3>
                  {r.isSystem ? (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0">
                      <Lock className="h-2.5 w-2.5" /> System
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1 shrink-0">
                      Custom
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {r.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <strong>{r.memberCount}</strong> {r.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <strong>{r.permissionKeys.length}</strong> / 44 capabilities
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => setEditingRole(r)}
                  className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  {r.isSystem ? 'View / Edit Permissions' : 'Edit'}
                </button>
                {!r.isSystem && (
                  <button
                    onClick={() => setDeletingRole(r)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchRoles}
        tenantSlug={tenantSlug}
      />

      <EditRoleModal
        key={editingRole?.id || 'none'}
        isOpen={Boolean(editingRole)}
        onClose={() => setEditingRole(null)}
        onUpdated={fetchRoles}
        tenantSlug={tenantSlug}
        role={editingRole}
      />

      {/* Delete Confirmation Modal */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Custom Role</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to delete this role?</p>
              </div>
            </div>

            <p className="text-sm text-foreground/80">
              Role: <strong>{deletingRole.name}</strong> ({deletingRole.slug})
            </p>
            {deletingRole.memberCount > 0 && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                Warning: {deletingRole.memberCount} active member(s) are currently assigned to this role. You must reassign them to another role before deleting.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || deletingRole.memberCount > 0}
                className="bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {deleteLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
