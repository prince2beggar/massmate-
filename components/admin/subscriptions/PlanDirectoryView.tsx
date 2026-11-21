'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { PLAN_FEATURE_CATALOG, type PlanFeatureKey } from '@/server/subscription/constants';
import type { PlanDto } from '@/server/subscription/types';
import type { PlanType, PlanStatus, BillingInterval } from '@/types/database';

interface PlanDirectoryViewProps {
  initialPlans: PlanDto[];
}

export function PlanDirectoryView({ initialPlans }: PlanDirectoryViewProps) {
  const [plans, setPlans] = useState<PlanDto[]>(initialPlans);
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    planType: 'STANDARD' as PlanType,
    priceMonthly: 99,
    currency: 'BDT',
    billingInterval: 'MONTHLY' as BillingInterval,
    trialEligible: true,
    trialDays: 7,
    entitlements: ['member_management', 'meal_management'] as string[],
    maxMembers: 50,
    maxProperties: 1,
    status: 'ACTIVE' as PlanStatus,
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      planType: 'STANDARD',
      priceMonthly: 149,
      currency: 'BDT',
      billingInterval: 'MONTHLY',
      trialEligible: true,
      trialDays: 7,
      entitlements: ['mess_website', 'member_management', 'meal_management', 'bazar_management', 'finance_management'],
      maxMembers: 60,
      maxProperties: 1,
      status: 'ACTIVE',
    });
    setError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (plan: PlanDto) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      planType: plan.planType,
      priceMonthly: plan.priceMonthly,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      trialEligible: plan.trialEligible,
      trialDays: plan.trialDays,
      entitlements: plan.entitlements,
      maxMembers: plan.limits?.maxMembers || 50,
      maxProperties: plan.limits?.maxProperties || 1,
      status: plan.status,
    });
    setError(null);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/super-admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: formData.description,
          planType: formData.planType,
          priceMonthly: Number(formData.priceMonthly),
          currency: formData.currency,
          billingInterval: formData.billingInterval,
          trialEligible: formData.trialEligible,
          trialDays: Number(formData.trialDays),
          entitlements: formData.entitlements,
          limits: {
            maxMembers: Number(formData.maxMembers),
            maxProperties: Number(formData.maxProperties),
          },
          status: formData.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create plan.');
      }

      setPlans((prev) => [...prev, json.data]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while creating plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!selectedPlan) return;
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/super-admin/plans/${selectedPlan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-platform-user': 'dev_super_admin_owner',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceMonthly: Number(formData.priceMonthly),
          billingInterval: formData.billingInterval,
          trialEligible: formData.trialEligible,
          trialDays: Number(formData.trialDays),
          entitlements: formData.entitlements,
          limits: {
            maxMembers: Number(formData.maxMembers),
            maxProperties: Number(formData.maxProperties),
          },
          status: formData.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update plan.');
      }

      setPlans((prev) => prev.map((p) => (p.id === selectedPlan.id ? json.data : p)));
      setIsEditOpen(false);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while updating plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEntitlement = (key: string) => {
    setFormData((prev) => {
      const exists = prev.entitlements.includes(key);
      return {
        ...prev,
        entitlements: exists
          ? prev.entitlements.filter((k) => k !== key)
          : [...prev.entitlements, key],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Layers className="w-4 h-4" />
            <span>SaaS Package Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Plans & Feature Entitlements</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure subscription tiers, price lock policies, trial parameters, and backend feature gates.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Historical Pricing Invariant:</span> When a plan&apos;s price or entitlements are edited, existing subscribers retain their agreed locked price. Changes apply strictly to new subscriptions.
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
          >
            <div>
              {/* Plan Card Header */}
              <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {plan.status}
                  </span>
                  <span className="text-xs font-mono bg-neutral-200/70 text-neutral-700 px-2 py-0.5 rounded">
                    {plan.planType}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {plan.description || 'Standard multi-tenant SaaS package.'}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  {plan.planType === 'CUSTOM_BUSINESS' ? (
                    <span className="text-2xl font-extrabold text-neutral-900">Customized</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-neutral-900">৳{plan.priceMonthly}</span>
                      <span className="text-xs font-medium text-neutral-500">/{plan.billingInterval.toLowerCase()}</span>
                    </>
                  )}
                </div>

                {plan.trialEligible && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{plan.trialDays}-Day Free Trial Included</span>
                  </div>
                )}
              </div>

              {/* Plan Limits & Features */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Usage Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="text-neutral-500 block">Max Members</span>
                      <span className="font-semibold text-neutral-800">
                        {plan.limits?.maxMembers ?? 'Unlimited'}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="text-neutral-500 block">Properties</span>
                      <span className="font-semibold text-neutral-800">
                        {plan.limits?.maxProperties ?? 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Feature Entitlements ({plan.entitlements.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {PLAN_FEATURE_CATALOG.map((f) => {
                      const isIncluded = plan.entitlements.includes(f.key);
                      return (
                        <li key={f.key} className="flex items-center gap-2 text-xs">
                          {isIncluded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                          )}
                          <span className={isIncluded ? 'text-neutral-800 font-medium' : 'text-neutral-400'}>
                            {f.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* Plan Card Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span>{plan.tenantCount} messes subscribed</span>
              <button
                onClick={() => openEditModal(plan)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium rounded shadow-sm transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Plan Modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">
                {isCreateOpen ? 'Create New SaaS Plan' : `Configure Plan: ${selectedPlan?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-neutral-400 hover:text-neutral-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Slug Identifier *
                  </label>
                  <input
                    type="text"
                    disabled={isEditOpen}
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Monthly Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Billing Interval
                  </label>
                  <select
                    value={formData.billingInterval}
                    onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value as BillingInterval })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="trialEligible"
                    checked={formData.trialEligible}
                    onChange={(e) => setFormData({ ...formData, trialEligible: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="trialEligible" className="text-xs font-semibold text-neutral-800">
                    Include Free Trial
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    disabled={!formData.trialEligible}
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 disabled:bg-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Max Members Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: Number(e.target.value) })}
                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Feature Checklist */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Feature Entitlements (Check to enable on backend)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  {PLAN_FEATURE_CATALOG.map((f) => (
                    <label key={f.key} className="flex items-start gap-2 text-xs text-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.entitlements.includes(f.key)}
                        onChange={() => toggleEntitlement(f.key)}
                        className="mt-0.5 text-emerald-600 rounded"
                      />
                      <div>
                        <span className="font-medium">{f.name}</span>
                        <span className="text-neutral-400 block text-[10px]">{f.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : isCreateOpen ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
