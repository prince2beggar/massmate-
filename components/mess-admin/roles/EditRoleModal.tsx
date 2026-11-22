'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  PERMISSION_CATALOG,
  type PermissionModule,
} from '@/server/rbac/permissions';
import type { RoleDto } from '@/server/settings/mess-settings-service';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  tenantSlug: string;
  role: RoleDto | null;
}

const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: '1. Dashboard & Live Analytics',
  members: '2. Member Directory & Onboarding',
  rooms: '3. Rooms & Accommodation',
  meals: '4. Dining & Meal Management',
  bazar: '5. Bazar & Grocery Expenses',
  finance: '6. Mess Finance & Utility Ledgers',
  payments: '7. Payment Deposits & Verifications',
  notices: '8. Notices, Events & Grievances',
  reports: '9. Monthly Statements & Reports',
  settings: '10. Settings & Security Audit',
};

export function EditRoleModal({
  isOpen,
  onClose,
  onUpdated,
  tenantSlug,
  role,
}: EditRoleModalProps) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    () => new Set(role?.permissionKeys || [])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !role) return null;

  const togglePermission = (key: string) => {
    // If editing system Owner role, keep all permissions locked
    if (role.slug === 'owner') return;

    const updated = new Set(selectedPermissions);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setSelectedPermissions(updated);
  };

  const toggleModuleAll = (moduleKey: PermissionModule) => {
    if (role.slug === 'owner') return;

    const modulePerms = PERMISSION_CATALOG.filter((p) => p.module === moduleKey);
    const allSelected = modulePerms.every((p) => selectedPermissions.has(p.key));

    const updated = new Set(selectedPermissions);
    if (allSelected) {
      modulePerms.forEach((p) => updated.delete(p.key));
    } else {
      modulePerms.forEach((p) => updated.add(p.key));
    }
    setSelectedPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/mess/${tenantSlug}/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: role.isSystem ? undefined : name.trim(),
          description: description.trim() || undefined,
          permissionKeys: Array.from(selectedPermissions),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update role');
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating role');
    } finally {
      setLoading(false);
    }
  };

  const modules = Object.keys(MODULE_LABELS) as PermissionModule[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Edit Role: {role.name}
                {role.isSystem && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> System Role
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">Modify description and granted capabilities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Role Name {role.isSystem && '(Protected)'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role.isSystem}
                className={`w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  role.isSystem
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-background text-foreground'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Role Slug
              </label>
              <input
                type="text"
                value={role.slug}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Role Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Granular Permission Matrix */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Granular Permission Matrix</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedPermissions.size} of {PERMISSION_CATALOG.length} permissions granted
                </p>
              </div>
              {!role.isSystem && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions(new Set(PERMISSION_CATALOG.map((p) => p.key)))}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Grant All
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {modules.map((modKey) => {
                const perms = PERMISSION_CATALOG.filter((p) => p.module === modKey);
                const allChecked = perms.every((p) => selectedPermissions.has(p.key));

                return (
                  <div key={modKey} className="border border-border rounded-lg p-3.5 bg-muted/20 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {MODULE_LABELS[modKey]}
                      </span>
                      {!role.isSystem && (
                        <button
                          type="button"
                          onClick={() => toggleModuleAll(modKey)}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          {allChecked ? 'Deselect Module' : 'Select All'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((p) => {
                        const checked = selectedPermissions.has(p.key);
                        const isOwnerRole = role.slug === 'owner';

                        return (
                          <label
                            key={p.key}
                            onClick={() => togglePermission(p.key)}
                            className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                              isOwnerRole ? 'cursor-not-allowed opacity-90' : ''
                            } ${
                              checked
                                ? 'bg-primary/5 border-primary/30 text-foreground'
                                : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0 text-primary">
                              {checked ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground/60" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">{p.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
