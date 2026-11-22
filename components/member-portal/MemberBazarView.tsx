'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Users,
  Receipt,
  Plus,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  Upload,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { MessBazarOverviewData } from '@/components/mess-admin/bazar/MemberBazarSummaryView';

interface MemberBazarViewProps {
  tenantSlug: string;
  membershipId: string;
  initialSummary?: MessBazarOverviewData | null;
  initialMyExpenses?: any[];
  initialCategories?: any[];
}

interface ItemRow {
  itemName: string;
  quantity: number | '';
  unit: string;
  unitPriceTaka: number | '';
}

export function MemberBazarView({
  tenantSlug,
  membershipId,
  initialSummary = null,
  initialMyExpenses = [],
  initialCategories = [],
}: MemberBazarViewProps) {
  const [activeTab, setActiveTab] = useState<'mess-summary' | 'my-bazar'>('mess-summary');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialSummary?.monthString && initialSummary.monthString !== 'ALL'
      ? initialSummary.monthString
      : new Date().toISOString().substring(0, 7)
  );

  const [summaryData, setSummaryData] = useState<MessBazarOverviewData | null>(initialSummary);
  const [myExpenses, setMyExpenses] = useState<any[]>(initialMyExpenses);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search in member list
  const [searchMember, setSearchMember] = useState('');

  // Slip preview modal
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [previewSlipTitle, setPreviewSlipTitle] = useState<string>('');

  // Submit Bazar Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState<'single' | 'weekly'>('single');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });
  const [categoryId, setCategoryId] = useState<string>(
    categories[0]?.id || ''
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchBazarData = async (monthToFetch = selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/portal/${tenantSlug}/bazar?month=${monthToFetch}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummaryData(json.data.summary);
        setMyExpenses(json.data.myExpenses || []);
        if (json.data.categories?.length > 0) {
          setCategories(json.data.categories);
          if (!categoryId) setCategoryId(json.data.categories[0].id);
        }
      }
    } catch {
      setError('বাজারের হিসাব লোড করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSummary) {
      void fetchBazarData(selectedMonth);
    }
  }, [selectedMonth, tenantSlug]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { itemName: '', quantity: 1, unit: 'kg', unitPriceTaka: '' }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ItemRow, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const calculatedTotal = items.reduce((sum, it) => {
    const q = typeof it.quantity === 'number' ? it.quantity : 0;
    const p = typeof it.unitPriceTaka === 'number' ? it.unitPriceTaka : 0;
    return sum + q * p;
  }, 0);

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setSubmitError('রসিদের আকার সর্বোচ্চ 8MB হতে পারবে');
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const validCatId = categoryId || categories[0]?.id;
    if (!validCatId) {
      setSubmitError('ক্যাটাগরি পাওয়া যায়নি');
      return;
    }

    const cleanedItems = items.map((it) => ({
      itemName: it.itemName.trim(),
      quantity: Number(it.quantity) || 0,
      unit: it.unit.trim() || 'kg',
      unitPriceTaka: Number(it.unitPriceTaka) || 0,
    }));

    for (let i = 0; i < cleanedItems.length; i++) {
      const it = cleanedItems[i];
      if (!it.itemName) {
        setSubmitError(`আইটেম #${i + 1}-এর নাম পূরণ করুন`);
        return;
      }
      if (it.quantity <= 0 || it.unitPriceTaka <= 0) {
        setSubmitError(`"${it.itemName}"-এর পরিমাণ ও একক দর সঠিক হতে হবে`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const pDate = periodType === 'weekly' ? startDate : purchaseDate;
      const payload = {
        categoryId: validCatId,
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
        items: cleanedItems,
        periodType,
        startDate: periodType === 'weekly' ? startDate : pDate,
        endDate: periodType === 'weekly' ? endDate : pDate,
      };

      const res = await fetch(`/api/v1/portal/${tenantSlug}/bazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'বাজার এন্ট্রি সংরক্ষণ করতে ব্যর্থ হয়েছে');
      }

      setSubmitSuccess('আপনার বাজার খরচ সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccess(null);
        void fetchBazarData(selectedMonth);
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = (summaryData?.membersSummary || []).filter((m) => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    return (
      m.memberName.toLowerCase().includes(q) ||
      (m.memberCode && m.memberCode.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Entry Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            মেসের বাজার ও খরচের হিসাব (Mess Bazar)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            কে কত বাজার করেছে তার স্বচ্ছ হিসাব, ব্যক্তিগত ভাউচার ও রসিদ ব্যবস্থাপনা
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitError(null);
            setSubmitSuccess(null);
            setIsSubmitModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Plus className="h-4 w-4" />
          + নতুন বাজার এন্ট্রি দিন
        </button>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              মেসের মোট বাজার খরচ
            </span>
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">
            ৳{(summaryData?.totalMessBazarTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">
            চলতি মাসের মেসব্যাপী সর্বমোট খরচ
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">
              মোট বাজার সম্পন্ন
            </span>
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-950">
            {summaryData?.totalBazarTrips || 0} বার
          </div>
          <div className="mt-1 text-[11px] text-blue-700">
            চলতি মাসে সদস্যদের বাজার ট্রিপ
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">
              মাথাপিছু গড় বাজার
            </span>
            <span className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-950">
            ৳{(summaryData?.averageSpentPerMember || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-purple-700">
            সদস্যপ্রতি প্রত্যাশিত গড় অবদান
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">
              আমার মোট বাজার অবদান
            </span>
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Users className="h-4 w-4" />
            </span>
          </div>
          {(() => {
            const me = summaryData?.membersSummary?.find((m) => m.membershipId === membershipId);
            const myTotal = me?.totalSpentTaka || 0;
            return (
              <>
                <div className="mt-2 text-2xl font-black text-amber-950">
                  ৳{myTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-[11px] text-amber-700">
                  আপনি এই মাসে {me?.bazarCount || 0} বার বাজার করেছেন
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('mess-summary')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'mess-summary'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>মেসের সবার বাজার (কে কত বাজার করেছে)</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">
            {summaryData?.membersSummary?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-bazar')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeTab === 'my-bazar'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>আমার বাজারের হিসাব ও স্লিপ</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
            {myExpenses.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Mess-Wide Member Bazar Summary (কে কত বাজার করেছে) */}
      {activeTab === 'mess-summary' && (
        <div className="space-y-4">
          {/* Search & Month Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="সদস্যের নাম বা কোড দিয়ে খুঁজুন..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">মাস:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => void fetchBazarData(selectedMonth)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Members List */}
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">কোনো সদস্যের তথ্য পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member, index) => {
                const isTopShopper = index === 0 && member.totalSpentTaka > 0;
                const isMe = member.membershipId === membershipId;
                const progress =
                  summaryData?.totalMessBazarTaka && summaryData.totalMessBazarTaka > 0
                    ? Math.min(
                        100,
                        Math.round((member.totalSpentTaka / summaryData.totalMessBazarTaka) * 100)
                      )
                    : 0;

                return (
                  <div
                    key={member.membershipId}
                    className={`rounded-2xl border transition bg-white shadow-sm overflow-hidden p-4 ${
                      isMe
                        ? 'border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-300/60'
                        : isTopShopper
                        ? 'border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-sm ${
                            isTopShopper
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                              : member.totalSpentTaka > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.memberName.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {member.memberName}
                            </h4>
                            {isMe && (
                              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                                আপনি
                              </span>
                            )}
                            {isTopShopper && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                                🏆 শীর্ষ বাজারকারী
                              </span>
                            )}
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {member.roleName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            {member.memberCode && (
                              <span className="font-mono text-slate-600 font-medium">
                                {member.memberCode}
                              </span>
                            )}
                            {member.lastBazarDate ? (
                              <span className="text-emerald-700 font-medium">
                                • সর্বশেষ বাজার: {member.lastBazarDate}
                              </span>
                            ) : (
                              <span className="text-slate-400">• এই মাসে বাজার করেনি</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amounts & Slips */}
                      <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-left md:text-right">
                          <div className="text-xs text-slate-500 font-medium">মোট বাজার খরচ</div>
                          <div className="text-lg font-black text-slate-900">
                            ৳{member.totalSpentTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            মেসের খরচের {progress}%
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <div className="text-xs text-slate-500 font-medium">বাজার ট্রিপ</div>
                          <div className="text-sm font-bold text-slate-800">
                            {member.bazarCount} বার
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5 md:justify-end">
                            <Receipt className="h-3 w-3" />
                            <span>{member.slipCount}টি স্লিপ</span>
                          </div>
                        </div>

                        {/* Recent slips viewer */}
                        {member.recentExpenses.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {member.recentExpenses.filter((e) => e.receiptUrl).slice(0, 2).map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => {
                                  setPreviewSlipUrl(e.receiptUrl!);
                                  setPreviewSlipTitle(`${member.memberName} (${e.purchaseDate})`);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800 transition"
                              >
                                <Eye className="h-3 w-3" /> স্লিপ
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {member.totalSpentTaka > 0 && (
                      <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                        <div
                          className={`h-1 transition-all ${
                            isTopShopper ? 'bg-emerald-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Personal Bazar History */}
      {activeTab === 'my-bazar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              আমার জমা দেওয়া বাজারের ভাউচার ও মেমো
            </h3>
            <button
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(null);
                setIsSubmitModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="h-3.5 w-3.5" />
              + আরও বাজার যোগ করুন
            </button>
          </div>

          {myExpenses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">আপনার কোনো বাজার খরচ নেই</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                আপনি যখন মেসের বাজার করবেন, উপরে ডানদিকের বাটন থেকে বাজার খরচ ও স্লিপ আপলোড করতে পারেন।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myExpenses.map((exp: any) => {
                const totalTaka = Number(exp.totalAmountPoisha || 0) / 100;
                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{exp.purchaseDate}</span>
                        {(exp.notes?.includes('যৌথ') || exp.notes?.includes('সাপ্তাহিক') || exp.periodType === 'weekly') && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                            🗓️ ৭ দিনের যৌথ স্লিপ
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            exp.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {exp.status === 'APPROVED' ? 'অনুমোদিত' : 'অপেক্ষমান'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        {exp.description || 'বাজার খরচ'}
                      </p>
                      {exp.vendor && (
                        <p className="text-[11px] text-slate-400">দোকান: {exp.vendor}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-700">
                          ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {exp.paymentMethod}
                        </div>
                      </div>

                      {exp.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewSlipUrl(exp.receiptUrl);
                            setPreviewSlipTitle(exp.purchaseDate);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> স্লিপ দেখুন
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">স্লিপ নেই</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Bazar Expense Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">বাজার এন্ট্রি দিন</h2>
                  <p className="text-xs text-slate-500">
                    একদিনের বাজার বা ৭ দিনের সাপ্তাহিক রসিদ স্লিপ জমা দিন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBazar} className="p-6 space-y-5">
              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Period Switcher */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="block text-xs font-bold text-slate-700 mb-2">
                  বাজারের ধরন ও মেয়াদ
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPeriodType('single')}
                    className={`py-2 px-3 rounded-lg font-bold border transition ${
                      periodType === 'single'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    একদিনের বাজার স্লিপ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodType('weekly')}
                    className={`py-2 px-3 rounded-lg font-bold border transition ${
                      periodType === 'weekly'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ৭ দিনের যৌথ / সাপ্তাহিক স্লিপ
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              {periodType === 'single' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বাজারের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      শুরুর তারিখ *
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
                      শেষের তারিখ *
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

              {/* Itemized Grocery Lines */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    বাজারের মালামালের তালিকা (Itemized Lines)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> + আইটেম যোগ করুন
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <input
                        type="text"
                        required
                        placeholder="আইটেম (চাল, আলু, তেল)"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="পরিমাণ"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'quantity',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="একক (কেজি)"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="দর ৳"
                        value={item.unitPriceTaka}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'unitPriceTaka',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                  <span className="text-xs font-semibold text-slate-700">মোট হিসাব:</span>
                  <span className="text-base font-black text-emerald-700">
                    ৳{calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Slip / Memo Upload Box */}
              <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3.5 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>বাজারের মেমো বা রসিদ স্লিপ আপলোড (Bazar Slip Upload)</span>
                </label>

                {receiptUrl ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={receiptUrl}
                        alt="Receipt"
                        className="h-10 w-10 object-cover rounded-lg border cursor-pointer"
                        onClick={() => setIsSlipPreviewOpen(true)}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {receiptFileName || 'রসিদ স্লিপ'}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          ✓ স্লিপ সংযুক্ত হয়েছে
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsSlipPreviewOpen(true)}
                        className="px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Eye className="h-3.5 w-3.5 inline mr-1" /> প্রিভিউ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptUrl('');
                          setReceiptFileName('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white cursor-pointer transition text-center">
                    <Upload className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800">
                      ক্যাশ মেমো বা রসিদের ছবি সিলেক্ট করুন
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      মোবাইলে ছবি তুলুন বা গ্যালারি থেকে দিন (সর্বোচ্চ 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleSlipUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Vendor & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    দোকানের নাম / বাজার (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: কারওয়ান বাজার"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিবরণ / শিরোনাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ৭ দিনের মুরগি ও সবজি"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  বাজার জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Preview Modal */}
      {previewSlipUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  বাজারের রসিদ / স্লিপ: {previewSlipTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSlipUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/10 max-h-[80vh]">
              {previewSlipUrl.startsWith('data:image') || previewSlipUrl.startsWith('http') ? (
                <img
                  src={previewSlipUrl}
                  alt="Receipt Full Preview"
                  className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md border border-slate-200"
                />
              ) : (
                <iframe
                  src={previewSlipUrl}
                  title="PDF Slip Preview"
                  className="w-[80vw] max-w-3xl h-[70vh] rounded-lg border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
