'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  Upload,
  Eye,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

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

  const [periodType, setPeriodType] = useState<'single' | 'weekly'>('single');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(defaultDate || new Date());
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });

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
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isSlipPreviewOpen, setIsSlipPreviewOpen] = useState<boolean>(false);

  const [items, setItems] = useState<ItemRow[]>([
    { itemName: '', quantity: 1, unit: 'kg', unitPriceTaka: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('রসিদ/মেমো ফাইলের আকার সর্বোচ্চ 8MB হতে পারবে।');
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
      const pDate = periodType === 'weekly' ? startDate : purchaseDate;
      const payload = {
        categoryId,
        purchaserMembershipId,
        purchaseDate: pDate,
        vendorName: vendorName.trim() || undefined,
        paymentMethod,
        description:
          description.trim() ||
          (periodType === 'weekly'
            ? `সাপ্তাহিক যৌথ বাজার (${startDate} থেকে ${endDate})`
            : undefined),
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        receiptFileName: receiptFileName.trim() || undefined,
        bazarScheduleId: bazarScheduleId || undefined,
        items: cleanedItems,
        periodType,
        startDate: periodType === 'weekly' ? startDate : pDate,
        endDate: periodType === 'weekly' ? endDate : pDate,
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
    <>
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

          {/* Bazar Duration / Slip Period Selector */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                বাজারের ধরন ও মেয়াদ (Bazar Duration & Slip Type)
              </span>
              <span className="text-[11px] text-slate-500">
                {periodType === 'single' ? 'একদিনের বাজার স্লিপ' : 'একটানা ৭ দিন বা সপ্তাহের যৌথ স্লিপ'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType('single')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition border ${
                  periodType === 'single'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                একদিনের বাজার (Single Date)
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('weekly')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition border ${
                  periodType === 'weekly'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                ৭ দিনের যৌথ স্লিপ (Weekly / Multi-Day)
              </button>
            </div>
          </div>

          {/* Section 1: Dates & Responsible Member */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {periodType === 'single' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বাজারের তারিখ (Purchase Date) *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শুরুর তারিখ (From) *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শেষের তারিখ (To) *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বাজার করেছে কে? (Purchaser Member) *
              </label>
              <select
                value={purchaserMembershipId}
                onChange={(e) => setPurchaserMembershipId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.memberCode ? `(${m.memberCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                খরচের ক্যাটাগরি (Category) *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isMealEligible ? '🍳 (মিল হিসাবের অন্তর্ভুক্ত)' : '🏢 (অপারেটিং/অন্যান্য)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দোকান / ভেন্ডর (Vendor / Shop Name)
              </label>
              <input
                type="text"
                placeholder="যেমন: কাঁচাবাজার, ভাই ভাই স্টোর"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেমেন্ট মাধ্যম (Payment Method)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="CASH">নগদ (Cash)</option>
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad)</option>
                <option value="ROCKET">রকেট (Rocket)</option>
                <option value="BANK">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                <option value="OTHER">অন্যান্য (Other)</option>
              </select>
            </div>
          </div>

          {/* Bazar Receipt / Slip Upload Box */}
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>বাজারের রসিদ / ক্যাশ মেমো / স্লিপ আপলোড (Bazar Memo / Receipt Slip)</span>
              </label>
              {receiptUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> স্লিপ সংযুক্ত হয়েছে
                </span>
              )}
            </div>

            {receiptUrl ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  {receiptUrl.startsWith('data:image') || receiptUrl.startsWith('http') ? (
                    <img
                      src={receiptUrl}
                      alt="Receipt Preview"
                      className="h-12 w-12 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-sm hover:opacity-90"
                      onClick={() => setIsSlipPreviewOpen(true)}
                    />
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                      DOC
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                      {receiptFileName || 'বাজারের স্লিপ / ভাউচার'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {periodType === 'weekly'
                        ? `সাপ্তাহিক যৌথ স্লিপ (${startDate} - ${endDate})`
                        : `একদিনের স্লিপ (${purchaseDate})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlipPreviewOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition"
                  >
                    <Eye className="h-3.5 w-3.5" /> বড় করে দেখুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl('');
                      setReceiptFileName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <label className="flex flex-col items-center justify-center w-full cursor-pointer py-4 px-3 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/70 transition bg-white text-center">
                  <Upload className="h-6 w-6 text-emerald-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">
                    বাজারের মেমো বা স্লিপ ফাইল সিলেক্ট করুন (ছবি বা PDF)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    মোবাইল বা পিসি থেকে মেমোর পরিষ্কার ছবি দিন (সর্বোচ্চ 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleSlipUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
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

    {/* Slip Preview Modal */}
    {isSlipPreviewOpen && receiptUrl && (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                বাজারের রসিদ / স্লিপ প্রিভিউ
              </h3>
            </div>
            <button
              onClick={() => setIsSlipPreviewOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/10 max-h-[80vh]">
            {receiptUrl.startsWith('data:image') || receiptUrl.startsWith('http') ? (
              <img
                src={receiptUrl}
                alt="Receipt Full Preview"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md border border-slate-200"
              />
            ) : (
              <iframe
                src={receiptUrl}
                title="PDF Preview"
                className="w-[80vw] max-w-3xl h-[70vh] rounded-lg border border-slate-200"
              />
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
