'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Receipt, AlertCircle, Loader2 } from 'lucide-react';

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  code: string;
  isMealEligible: boolean;
  isActive: boolean;
}

interface RecordExpenseModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: MemberOption[];
  categories: CategoryOption[];
  defaultDate?: string;
  defaultPurchaserMembershipId?: string;
  bazarScheduleId?: string;
}

interface ItemRow {
  itemName: string;
  quantity: number | '';
  unit: string;
  unitPriceTaka: number | '';
}

export function RecordExpenseModal({
  tenantSlug,
  isOpen,
  onClose,
  onSuccess,
  members,
  categories,
  defaultDate,
  defaultPurchaserMembershipId,
  bazarScheduleId,
}: RecordExpenseModalProps) {
  const activeCategories = categories.filter((c) => c.isActive);

  const [purchaseDate, setPurchaseDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState<string>(
    activeCategories.find((c) => c.code === 'BAZAR')?.id || activeCategories[0]?.id || ''
  );
  const [purchaserMembershipId, setPurchaserMembershipId] = useState<string>(
    defaultPurchaserMembershipId || members[0]?.id || ''
  );
  const [vendorName, setVendorName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  const [items, setItems] = useState<ItemRow[]>([
    { itemName: '', quantity: 1, unit: 'kg', unitPriceTaka: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { itemName: '', quantity: 1, unit: 'kg', unitPriceTaka: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculate live preview total
  const calculatedTotal = items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0;
    const price = typeof item.unitPriceTaka === 'number' ? item.unitPriceTaka : 0;
    return sum + qty * price;
  }, 0);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!categoryId) {
      setError('Please select an expense category.');
      return;
    }
    if (!purchaserMembershipId) {
      setError('Please select the member who made this purchase.');
      return;
    }
    if (!purchaseDate) {
      setError('Please provide a valid purchase date.');
      return;
    }

    const cleanedItems = items.map((it) => ({
      itemName: it.itemName.trim(),
      quantity: Number(it.quantity) || 0,
      unit: it.unit.trim() || 'piece',
      unitPriceTaka: Number(it.unitPriceTaka) || 0,
    }));

    for (let i = 0; i < cleanedItems.length; i++) {
      const it = cleanedItems[i];
      if (!it.itemName) {
        setError(`Item #${i + 1} is missing a name.`);
        return;
      }
      if (it.quantity <= 0) {
        setError(`Item "${it.itemName}" has an invalid quantity (${it.quantity}).`);
        return;
      }
      if (it.unitPriceTaka <= 0) {
        setError(`Item "${it.itemName}" has an invalid unit price (৳${it.unitPriceTaka}).`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        categoryId,
        purchaserMembershipId,
        purchaseDate,
        vendorName: vendorName.trim() || undefined,
        paymentMethod,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        bazarScheduleId: bazarScheduleId || undefined,
        items: cleanedItems,
      };

      const res = await fetch(`/api/v1/mess/${tenantSlug}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to record expense');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Record Bazar & Expense</h2>
              <p className="text-xs text-slate-500">
                Itemized expense entry with exact server-side calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Top Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isMealEligible ? '🍳 (Meal Eligible)' : '🏢 (Utility/Op)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchaser (Member) *
              </label>
              <select
                value={purchaserMembershipId}
                onChange={(e) => setPurchaserMembershipId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Shop (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kawran Bazar Vegetable Mart"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="BANK">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt / Voucher Ref (Optional)
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Voucher # or image link"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Itemized Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Itemized Purchases</h3>
                <span className="text-xs text-slate-500">
                  (Line totals calculated server-side)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const lineTotal =
                  (typeof item.quantity === 'number' ? item.quantity : 0) *
                  (typeof item.unitPriceTaka === 'number' ? item.unitPriceTaka : 0);

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        required
                        placeholder="Item name (e.g. Rice, Chicken, Oil)"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'quantity',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-24">
                      <input
                        type="text"
                        placeholder="Unit (kg/l)"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="Price ৳"
                        value={item.unitPriceTaka}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'unitPriceTaka',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-24 text-right pr-2">
                      <span className="text-xs font-semibold text-slate-700">
                        ৳{lineTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-auto">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Strip */}
            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
              <div>
                <span className="text-xs text-slate-500">Category Effect: </span>
                <span
                  className={`text-xs font-bold ${
                    selectedCategory?.isMealEligible ? 'text-amber-700' : 'text-slate-700'
                  }`}
                >
                  {selectedCategory?.isMealEligible
                    ? '🍳 Feeds Monthly Meal Rate'
                    : '🏢 General Operating Overhead'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Grand Total:</span>
                <span className="text-lg font-bold text-emerald-700">
                  ৳{calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Notes & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly vegetable & chicken bazar for 15 members"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in cash by Rahim"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
