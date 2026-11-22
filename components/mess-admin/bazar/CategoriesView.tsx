'use client';

import React, { useState } from 'react';
import { Plus, Tag, Check, X, Shield, Utensils, Building2, Loader2, AlertCircle } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  isMealEligible: boolean;
  isActive: boolean;
  isSystem: boolean;
  description?: string | null;
}

interface CategoriesViewProps {
  tenantSlug: string;
  categories: CategoryItem[];
  onRefresh: () => void;
}

export function CategoriesView({ tenantSlug, categories, onRefresh }: CategoriesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isMealEligible, setIsMealEligible] = useState(false);
  const [description, setDescription] = useState('');

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleActive = async (cat: CategoryItem) => {
    setTogglingId(cat.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update category');
      }
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error updating category');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          isMealEligible,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create category');
      }

      setName('');
      setCode('');
      setIsMealEligible(false);
      setDescription('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error creating category');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Expense Categories</h3>
          <p className="text-xs text-slate-500">
            Configure meal-eligible grocery vs operating overhead categories. Deactivating disables
            future selections without affecting historical records.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Category Name</th>
              <th className="px-4 py-3.5">Code</th>
              <th className="px-4 py-3.5">Meal Allocation Effect</th>
              <th className="px-4 py-3.5">Origin</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>{cat.name}</span>
                  </div>
                  {cat.description && (
                    <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                      {cat.description}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                    {cat.code}
                  </code>
                </td>
                <td className="px-4 py-3">
                  {cat.isMealEligible ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      <Utensils className="h-3 w-3 text-amber-600" />
                      Eligible (Feeds Meal Rate)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      Operating / Overhead
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {cat.isSystem ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      System Preset
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Custom Tenant</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {cat.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Deactivated
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    disabled={togglingId === cat.id}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      cat.isActive
                        ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {togglingId === cat.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : cat.isActive ? (
                      <>
                        <X className="h-3 w-3" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" /> Activate
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">New Expense Category</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friday Feast & Spices"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FEAST"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 uppercase font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="mealEligible"
                  checked={isMealEligible}
                  onChange={(e) => setIsMealEligible(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="mealEligible" className="text-xs font-semibold text-slate-800">
                  Meal Eligible (Include approved purchases in monthly meal rate calculation)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly spices and poultry purchase"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
