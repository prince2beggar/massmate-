'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  DollarSign,
  Layers,
  Archive,
  Edit,
  History,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  X,
  Building2,
  TrendingUp,
} from 'lucide-react';
import type {
  InventoryDashboardDto,
  InventoryItemDto,
  StockMovementDto,
  InventoryCategory,
  InventoryItemType,
  StockMovementType,
  AssetCondition,
} from '@/server/inventory/inventory-service';

interface InventoryManagementViewProps {
  tenantSlug: string;
  tenantName: string;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'GROCERY', label: 'Grocery Supplies' },
  { key: 'KITCHEN', label: 'Kitchen & Cookware' },
  { key: 'CLEANING', label: 'Cleaning Materials' },
  { key: 'APPLIANCE', label: 'Appliances & Electronics' },
  { key: 'FURNITURE', label: 'Furniture & Fixtures' },
  { key: 'MAINTENANCE', label: 'Maintenance & Tools' },
  { key: 'OTHER', label: 'Other Items' },
];

export function InventoryManagementView({
  tenantSlug,
  tenantName,
}: InventoryManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ITEMS' | 'MOVEMENTS' | 'REPORTS'>('DASHBOARD');

  // Dashboard state
  const [dashboard, setDashboard] = useState<InventoryDashboardDto | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // Items list state
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [itemTypeFilter, setItemTypeFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Movements state
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');

  // Reports state
  const [reports, setReports] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItemDto | null>(null);

  // Form states
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Add Item Form
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryCategory>('KITCHEN');
  const [formItemType, setFormItemType] = useState<InventoryItemType>('CONSUMABLE');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formQuantity, setFormQuantity] = useState('0');
  const [formMinAlert, setFormMinAlert] = useState('5');
  const [formLocation, setFormLocation] = useState('Kitchen Store');
  const [formCostTaka, setFormCostTaka] = useState('0');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCondition, setFormCondition] = useState<AssetCondition>('GOOD');

  // Receive / Consume / Adjust Form
  const [movementQty, setMovementQty] = useState('');
  const [movementUnitCost, setMovementUnitCost] = useState('');
  const [movementRef, setMovementRef] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  const [movementDestination, setMovementDestination] = useState('');
  const [movementTypeSelect, setMovementTypeSelect] = useState<StockMovementType>('CONSUMPTION');

  // Initial load
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/mess/${tenantSlug}/inventory/dashboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setDashboard(json.data);
        }
      })
      .catch((err) => console.error('[InventoryView] Dashboard error:', err))
      .finally(() => {
        if (isMounted) setDashLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Load items when Items tab active or filters change
  useEffect(() => {
    if (activeTab !== 'ITEMS') return;

    let isMounted = true;

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (itemTypeFilter !== 'ALL') params.set('itemType', itemTypeFilter);
    if (lowStockOnly) params.set('lowStockOnly', 'true');
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/inventory?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setItems(json.data);
          setItemsTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => console.error('[InventoryView] Items error:', err))
      .finally(() => {
        if (isMounted) setItemsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab, searchQuery, categoryFilter, itemTypeFilter, lowStockOnly]);

  // Load movements when Movements tab active
  useEffect(() => {
    if (activeTab !== 'MOVEMENTS') return;

    let isMounted = true;

    const params = new URLSearchParams();
    if (movementTypeFilter !== 'ALL') params.set('movementType', movementTypeFilter);
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/inventory/movements?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setMovements(json.data);
          setMovementsTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => console.error('[InventoryView] Movements error:', err))
      .finally(() => {
        if (isMounted) setMovementsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab, movementTypeFilter]);

  // Load reports when Reports tab active
  useEffect(() => {
    if (activeTab !== 'REPORTS') return;

    let isMounted = true;

    fetch(`/api/v1/mess/${tenantSlug}/inventory/reports`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setReports(json.data);
        }
      })
      .catch((err) => console.error('[InventoryView] Reports error:', err))
      .finally(() => {
        if (isMounted) setReportsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab]);

  const refreshAll = () => {
    setDashLoading(true);
    fetch(`/api/v1/mess/${tenantSlug}/inventory/dashboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data) setDashboard(json.data);
      })
      .finally(() => setDashLoading(false));

    if (activeTab === 'ITEMS') {
      setItemsLoading(true);
      fetch(`/api/v1/mess/${tenantSlug}/inventory?limit=50`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && json.data) {
            setItems(json.data);
            setItemsTotal(json.meta?.total || 0);
          }
        })
        .finally(() => setItemsLoading(false));
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          itemCode: formCode || null,
          category: formCategory,
          itemType: formItemType,
          description: formDescription || null,
          unit: formUnit,
          quantity: parseFloat(formQuantity) || 0,
          minStockAlert: parseFloat(formMinAlert) || 0,
          location: formLocation || null,
          costPerUnitTaka: parseFloat(formCostTaka) || 0,
          supplierName: formSupplier || null,
          assetCondition: formItemType === 'REUSABLE_ASSET' ? formCondition : null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowAddModal(false);
        refreshAll();
        // Reset form
        setFormName('');
        setFormCode('');
        setFormDescription('');
        setFormQuantity('0');
        setFormCostTaka('0');
        setFormSupplier('');
      } else {
        setModalError(json.error?.message || json.message || 'Failed to create item.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error creating item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent, mType: StockMovementType) => {
    e.preventDefault();
    if (!selectedItemForAction) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/inventory/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemForAction.id,
          movementType: mType,
          quantity: parseFloat(movementQty) || 0,
          unitCostTaka: movementUnitCost ? parseFloat(movementUnitCost) : undefined,
          destinationLocation: movementDestination || null,
          referenceNumber: movementRef || null,
          notes: movementNotes || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowReceiveModal(false);
        setShowConsumeModal(false);
        setShowAdjustModal(false);
        setSelectedItemForAction(null);
        setMovementQty('');
        setMovementUnitCost('');
        setMovementRef('');
        setMovementNotes('');
        setMovementDestination('');
        refreshAll();
      } else {
        setModalError(json.error?.message || json.message || 'Failed to record movement.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error recording stock movement.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchiveItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to archive "${itemName}"? Historical movement records will be preserved.`)) return;

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/inventory/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error('[InventoryView] Archive error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Assets</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              Mess Supplies & Stock
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track grocery provisions, cookware, appliances, shared furniture, and stock consumption for {tenantName}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('DASHBOARD')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'DASHBOARD'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview & KPIs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ITEMS')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'ITEMS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Item & Asset Catalog
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'MOVEMENTS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Stock Movement Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REPORTS')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'REPORTS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Valuation & Reports
        </button>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">Calculating inventory balances...</p>
            </div>
          ) : !dashboard ? (
            <p className="text-xs text-slate-500">Failed to load inventory dashboard.</p>
          ) : (
            <>
              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Active Items</span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Boxes className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{dashboard.totalItems}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {dashboard.consumablesCount} consumables · {dashboard.reusableAssetsCount} assets
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Low-Stock Warnings</span>
                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 mt-2">{dashboard.lowStockCount}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Below configured reorder threshold</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Out of Stock</span>
                    <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                      <X className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 mt-2">{dashboard.outOfStockCount}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Depleted inventory requiring replenishment</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Asset Valuation</span>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{dashboard.formattedTotalAssetValue}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Exact integer poisha balance</p>
                </div>
              </div>

              {/* Low Stock Urgent Restock Card */}
              {dashboard.lowStockItems.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h3 className="text-xs font-bold text-amber-900">
                        Attention Required: {dashboard.lowStockItems.length} Item(s) Need Restocking
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ITEMS');
                        setLowStockOnly(true);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                    >
                      View all in catalog →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dashboard.lowStockItems.slice(0, 6).map((it) => (
                      <div
                        key={it.id}
                        className="rounded-lg bg-white p-3 border border-amber-200/80 flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{it.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Available: <span className="font-bold text-rose-600">{it.quantity} {it.unit}</span> (Min alert: {it.minStockAlert})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForAction(it);
                            setShowReceiveModal(true);
                          }}
                          className="rounded-md bg-amber-100 hover:bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800 transition-colors"
                        >
                          Receive
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Breakdown & Recent Movements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">Stock by Category</h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dashboard.categoryBreakdown.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between py-2.5 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{cat.category}</p>
                          <p className="text-[10px] text-slate-400">{cat.count} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{cat.formattedTotalValue}</p>
                          <p className="text-[10px] text-slate-500">{cat.totalQuantity} units</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Movements Feed */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-indigo-600" />
                      <h2 className="text-sm font-bold text-slate-900">Recent Stock Movements</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('MOVEMENTS')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      View full ledger →
                    </button>
                  </div>

                  {dashboard.recentMovements.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No stock movements recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dashboard.recentMovements.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              m.movementType === 'PURCHASE_RECEIPT' || m.movementType === 'OPENING_STOCK'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}>
                              {m.movementType === 'PURCHASE_RECEIPT' || m.movementType === 'OPENING_STOCK' ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{m.itemName}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>{m.movementType.replace('_', ' ')}</span>
                                <span>·</span>
                                <span>{m.formattedCreatedAt}</span>
                                {m.creatorName && (
                                  <>
                                    <span>·</span>
                                    <span>By {m.creatorName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-xs font-bold ${
                              m.movementType === 'PURCHASE_RECEIPT' || m.movementType === 'OPENING_STOCK'
                                ? 'text-emerald-600'
                                : 'text-slate-800'
                            }`}>
                              {m.movementType === 'PURCHASE_RECEIPT' || m.movementType === 'OPENING_STOCK' ? '+' : '-'}
                              {m.quantity} {m.unit}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Bal: {m.newQuantity} {m.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ITEMS CATALOG */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items by name, SKU code, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="CONSUMABLE">Consumable Supplies</option>
              <option value="REUSABLE_ASSET">Reusable Assets</option>
            </select>

            {/* Low stock toggle */}
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer self-center px-1">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 h-4 w-4"
              />
              Low Stock Only
            </label>
          </div>

          {/* Table / List */}
          {itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-center px-4">
              <Package className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-800">No inventory items found</p>
              <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Inventory Item&quot; to register kitchen supplies or appliances.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-3">Item Name & SKU</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Type & Location</th>
                      <th className="px-4 py-3 text-right">Available Stock</th>
                      <th className="px-4 py-3 text-right">Unit / Total Value</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{it.name}</p>
                          <p className="text-[10px] text-slate-400">{it.itemCode || 'No SKU'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                            {it.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800 font-medium">
                            {it.itemType === 'REUSABLE_ASSET' ? 'Asset' : 'Consumable'}
                          </p>
                          <p className="text-[10px] text-slate-400">{it.location || 'Unassigned'}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${
                            it.isOutOfStock
                              ? 'text-rose-600'
                              : it.isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}>
                            {it.quantity} {it.unit}
                          </span>
                          <p className="text-[10px] text-slate-400">Min: {it.minStockAlert}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-slate-900">{it.formattedTotalValue}</p>
                          <p className="text-[10px] text-slate-400">{it.formattedCostPerUnit} / {it.unit}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {it.isOutOfStock ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : it.isLowStock ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Adequate
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForAction(it);
                                setShowReceiveModal(true);
                              }}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                              title="Receive / Restock"
                            >
                              Receive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForAction(it);
                                setShowConsumeModal(true);
                              }}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                              title="Record Consumption / Issue"
                            >
                              Consume
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForAction(it);
                                setShowAdjustModal(true);
                              }}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                              title="Adjustment / Damage / Loss"
                            >
                              Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveItem(it.id, it.name)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Archive Item"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MOVEMENTS LEDGER */}
      {activeTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          {/* Movement Type Filter */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900">Stock Movement Ledger</h2>
            </div>

            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="ALL">All Movement Types</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipts</option>
              <option value="CONSUMPTION">Consumptions & Usage</option>
              <option value="OPENING_STOCK">Opening Stock</option>
              <option value="TRANSFER">Location Transfers</option>
              <option value="DAMAGE_LOSS">Damage & Loss</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
              <option value="WRITE_OFF">Write-offs</option>
            </select>
          </div>

          {movementsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">Loading stock movements ledger...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-center px-4">
              <History className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-800">No stock movements found</p>
              <p className="text-xs text-slate-400 mt-0.5">Stock receipts and consumption entries will be immutably recorded here.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-3">Date (Asia/Dhaka)</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Movement Type</th>
                      <th className="px-4 py-3 text-right">Qty Change</th>
                      <th className="px-4 py-3 text-right">Resulting Balance</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                      <th className="px-4 py-3">Notes & Ref</th>
                      <th className="px-4 py-3">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => {
                      const isPositive = m.movementType === 'PURCHASE_RECEIPT' || m.movementType === 'OPENING_STOCK' || m.movementType === 'RETURN';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {m.formattedCreatedAt}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {m.itemName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {m.movementType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isPositive ? '+' : '-'}{m.quantity} {m.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {m.newQuantity} {m.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {m.formattedTotalCost || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                            {m.notes || m.referenceNumber || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {m.creatorName || 'Staff'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {reportsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">Aggregating inventory reports...</p>
            </div>
          ) : !reports ? (
            <p className="text-xs text-slate-500">Failed to load reports.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Valuation Report */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">Category Valuation Summary</h2>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {reports.valuationReport?.map((vr: any) => (
                    <div key={vr.category} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-bold text-slate-800">{vr.category}</span>
                        <p className="text-[10px] text-slate-400">{vr.itemCount} items</p>
                      </div>
                      <span className="font-bold text-slate-900">{vr.formattedTotalValue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consumption Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Top Consumed Supplies</h2>
                </div>

                {reports.consumptionSummary?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No consumption logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {reports.consumptionSummary?.map((cs: any) => (
                      <div key={cs.itemId} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="font-bold text-slate-800">{cs.itemName}</p>
                          <p className="text-[10px] text-slate-400">Total used: {cs.totalConsumedQuantity} {cs.unit}</p>
                        </div>
                        <span className="font-bold text-slate-900">{cs.formattedEstimatedCost}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Damaged & Maintenance Assets */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900">Damaged & Maintenance Required Assets</h2>
                </div>

                {reports.damagedAssets?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    All reusable assets are in good or excellent operating condition.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {reports.damagedAssets?.map((da: any) => (
                      <div key={da.itemId} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="font-bold text-slate-900">{da.itemName}</p>
                          <p className="text-[10px] text-rose-600 font-semibold">Condition: {da.condition}</p>
                        </div>
                        <span className="font-bold text-slate-900">{da.formattedEstimatedLoss}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD INVENTORY ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Inventory Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miniket Rice or Dining Room Ceiling Fan"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code / SKU (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. GROC-RICE-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as InventoryCategory)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  >
                    <option value="GROCERY">Grocery</option>
                    <option value="KITCHEN">Kitchen & Cookware</option>
                    <option value="CLEANING">Cleaning Supplies</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Type</label>
                  <select
                    value={formItemType}
                    onChange={(e) => setFormItemType(e.target.value as InventoryItemType)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  >
                    <option value="CONSUMABLE">Consumable (Uses up stock)</option>
                    <option value="REUSABLE_ASSET">Reusable Asset (Track condition)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="litre">litre (Litre)</option>
                    <option value="piece">piece (Piece)</option>
                    <option value="packet">packet (Packet)</option>
                    <option value="box">box (Box)</option>
                    <option value="bag">bag (Bag/Sack)</option>
                    <option value="bundle">bundle (Bundle)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen Store or Dining Hall"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost per Unit (৳ BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 75.00"
                    value={formCostTaka}
                    onChange={(e) => setFormCostTaka(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tejgaon Wholesale Store"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>

                {formItemType === 'REUSABLE_ASSET' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Asset Condition</label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value as AssetCondition)}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="NEEDS_REPAIR">Needs Repair</option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIVE STOCK */}
      {showReceiveModal && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Receive Stock / Restock</h3>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedItemForAction.name}</p>
              <p className="text-[11px] text-slate-500">
                Current Stock: <span className="font-bold text-slate-800">{selectedItemForAction.quantity} {selectedItemForAction.unit}</span>
              </p>
            </div>

            {modalError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={(e) => handleRecordMovement(e, 'PURCHASE_RECEIPT')} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Received ({selectedItemForAction.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder={`e.g. 20 ${selectedItemForAction.unit}`}
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit Cost (৳ BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={selectedItemForAction.costPerUnitTaka.toString()}
                  value={movementUnitCost}
                  onChange={(e) => setMovementUnitCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-NOV-89"
                  value={movementRef}
                  onChange={(e) => setMovementRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received 4 cans from bazar purchase."
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Stock Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD CONSUMPTION */}
      {showConsumeModal && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Consumption / Issue</h3>
              <button
                type="button"
                onClick={() => setShowConsumeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedItemForAction.name}</p>
              <p className="text-[11px] text-slate-500">
                Available Stock: <span className="font-bold text-emerald-600">{selectedItemForAction.quantity} {selectedItemForAction.unit}</span>
              </p>
            </div>

            {modalError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={(e) => handleRecordMovement(e, 'CONSUMPTION')} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Used ({selectedItemForAction.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedItemForAction.quantity}
                  required
                  placeholder={`e.g. 5 ${selectedItemForAction.unit}`}
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Usage Destination / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Lunch Cooking or Washroom Cleaning"
                  value={movementDestination}
                  onChange={(e) => setMovementDestination(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Friday feast preparation."
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConsumeModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Record Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADJUST / DAMAGE / TRANSFER */}
      {showAdjustModal && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Stock Adjustment & Transfer</h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="font-bold text-slate-900">{selectedItemForAction.name}</p>
              <p className="text-[11px] text-slate-500">
                Current Stock: <span className="font-bold text-slate-800">{selectedItemForAction.quantity} {selectedItemForAction.unit}</span>
              </p>
            </div>

            {modalError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={(e) => handleRecordMovement(e, movementTypeSelect)} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Action</label>
                <select
                  value={movementTypeSelect}
                  onChange={(e) => setMovementTypeSelect(e.target.value as StockMovementType)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                >
                  <option value="DAMAGE_LOSS">Damage or Loss (Deduct from Stock)</option>
                  <option value="TRANSFER">Transfer to Another Location</option>
                  <option value="STOCK_ADJUSTMENT">Stock Audit Correction (Set Exact Count)</option>
                  <option value="WRITE_OFF">Write-Off Asset / Item</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity ({selectedItemForAction.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              {movementTypeSelect === 'TRANSFER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Destination Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 102 or Kitchen Store"
                    value={movementDestination}
                    onChange={(e) => setMovementDestination(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Explanation *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Cracked during cleaning or physical stock audit correction."
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
