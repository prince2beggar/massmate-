'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Calendar,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  FileText,
} from 'lucide-react';

interface RecentExpense {
  id: string;
  purchaseDate: string;
  description: string;
  totalAmount: number;
  status: string;
  receiptUrl?: string | null;
  itemsCount: number;
  periodType?: string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

export interface MemberBazarSummaryItem {
  membershipId: string;
  userId: string;
  memberName: string;
  phone: string | null;
  memberCode: string | null;
  roleName: string;
  roleSlug?: string;
  totalSpentTaka: number;
  totalSpentPoisha: string;
  approvedSpentTaka: number;
  pendingSpentTaka: number;
  bazarCount: number;
  lastBazarDate: string | null;
  slipCount: number;
  recentExpenses: RecentExpense[];
}

export interface MessBazarOverviewData {
  monthString: string;
  totalMessBazarTaka: number;
  totalBazarTrips: number;
  totalActiveShoppers: number;
  totalMembers: number;
  averageSpentPerMember: number;
  membersSummary: MemberBazarSummaryItem[];
}

interface MemberBazarSummaryViewProps {
  tenantSlug: string;
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  onRecordForMember: (memberId: string) => void;
  onViewExpenseDetails?: (expenseId: string) => void;
}

export function MemberBazarSummaryView({
  tenantSlug,
  selectedMonth,
  onMonthChange,
  onRecordForMember,
}: MemberBazarSummaryViewProps) {
  const [data, setData] = useState<MessBazarOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [previewSlipTitle, setPreviewSlipTitle] = useState<string>('');

  const fetchSummary = async (monthToFetch = selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/mess/${tenantSlug}/expenses/member-summary?month=${monthToFetch}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'বাজারের সারাংশ লোড করা সম্ভব হয়নি');
      }
    } catch (err: any) {
      setError(err.message || 'বাজারের তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary(selectedMonth);
  }, [selectedMonth, tenantSlug]);

  const filteredMembers = useMemo(() => {
    if (!data?.membersSummary) return [];
    if (!search.trim()) return data.membersSummary;
    const q = search.toLowerCase();
    return data.membersSummary.filter(
      (m) =>
        m.memberName.toLowerCase().includes(q) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(q))
    );
  }, [data, search]);

  const toggleExpand = (id: string) => {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mess Bazar */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              সর্বমোট মেস বাজার খরচ
            </span>
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">
            ৳{(data?.totalMessBazarTaka || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1">
            <span>মাসের মোট অনুমোদিত ও চলমান বাজার খরচ</span>
          </div>
        </div>

        {/* Total Bazar Trips */}
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
            {data?.totalBazarTrips || 0} <span className="text-sm font-semibold">বার</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-700">
            {selectedMonth} মাসে সদস্যদের মোট বাজার ট্রিপ
          </div>
        </div>

        {/* Active Shoppers */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">
              বাজার করেছে এমন সদস্য
            </span>
            <span className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-950">
            {data?.totalActiveShoppers || 0} / {data?.totalMembers || 0}
          </div>
          <div className="mt-1 text-[11px] text-purple-700">
            {data?.totalMembers
              ? `${Math.round(((data?.totalActiveShoppers || 0) / data.totalMembers) * 100)}% সদস্য চলতি মাসে বাজার করেছে`
              : 'সদস্য তালিকা অনুযায়ী'}
          </div>
        </div>

        {/* Average per Member */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">
              মাথাপিছু গড় বাজার
            </span>
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">
            ৳{(data?.averageSpentPerMember || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">
            প্রতি সক্রিয় সদস্যের গড় বাজার খরচ
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="মেম্বার নাম, কোড বা ফোন নম্বর দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">মাস:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => void fetchSummary(selectedMonth)}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
        <Users className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">সদস্যভিত্তিক বাজারের হিসাব (Rotating Member Bazar): </span>
          এখানে দেখতে পারবেন মেসের কে কত টাকার বাজার করেছে, কয়টি রসিদ স্লিপ দিয়েছে এবং সর্বশেষ কবে বাজার করেছে। সদস্যরা তাদের পোর্টাল থেকেও বাজার এন্ট্রি দিতে পারবেন অথবা এডমিন যে কোনো সদস্যের পক্ষে এখান থেকে সরাসরি এন্ট্রি দিতে পারবেন।
        </div>
      </div>

      {/* Members Bazar List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">বাজারের হিসাব লোড হচ্ছে...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">কোনো মেম্বার বা বাজারের তথ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            নির্বাচিত মাসে এখনও কোনো বাজারের হিসাব পাওয়া যায়নি। নিচে থেকে বাজার এন্ট্রি করতে পারেন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member, index) => {
            const isTopShopper = index === 0 && member.totalSpentTaka > 0;
            const isExpanded = expandedMemberId === member.membershipId;
            const progress =
              data?.totalMessBazarTaka && data.totalMessBazarTaka > 0
                ? Math.min(100, Math.round((member.totalSpentTaka / data.totalMessBazarTaka) * 100))
                : 0;

            return (
              <div
                key={member.membershipId}
                className={`rounded-2xl border transition bg-white shadow-sm overflow-hidden ${
                  isTopShopper
                    ? 'border-emerald-300 ring-1 ring-emerald-300/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Member Row */}
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Avatar & Basic Info */}
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
                        <h4 className="text-sm font-bold text-slate-900">{member.memberName}</h4>
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
                        {member.phone && <span>• {member.phone}</span>}
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

                  {/* Middle: Total Bazar & Trip Statistics */}
                  <div className="flex flex-wrap items-center gap-6 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-500 font-medium">মোট বাজার খরচ</div>
                      <div className="text-lg font-black text-slate-900">
                        ৳{member.totalSpentTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        মেসের মোট খরচের {progress}%
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-500 font-medium">বাজার সম্পন্ন</div>
                      <div className="text-sm font-bold text-slate-800">
                        {member.bazarCount} বার
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5 md:justify-end">
                        <Receipt className="h-3 w-3" />
                        <span>{member.slipCount}টি স্লিপ সংযুক্ত</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRecordForMember(member.membershipId)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        বাজার এন্ট্রি
                      </button>

                      {member.recentExpenses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(member.membershipId)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                          title="বাজারের বিস্তারিত দেখুন"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contribution Progress Bar */}
                {member.totalSpentTaka > 0 && (
                  <div className="w-full bg-slate-100 h-1">
                    <div
                      className={`h-1 transition-all ${
                        isTopShopper ? 'bg-emerald-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Expanded Details: Recent Shopping Trips and Slips */}
                {isExpanded && member.recentExpenses.length > 0 && (
                  <div className="bg-slate-50/80 border-t border-slate-200 p-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{member.memberName}-এর বাজারের ভাউচার ও স্লিপসমূহ</span>
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        মোট {member.recentExpenses.length}টি এন্ট্রি
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {member.recentExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{exp.purchaseDate}</span>
                              {(exp.periodType === 'weekly' || exp.notes?.includes('যৌথ')) && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                                  ৭ দিনের স্লিপ
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  exp.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {exp.status === 'APPROVED' ? 'অনুমোদিত' : 'অপেক্ষমান'}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] truncate max-w-xs">
                              {exp.description || 'বাজার খরচ'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900">
                              ৳{exp.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>

                            {exp.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewSlipUrl(exp.receiptUrl!);
                                  setPreviewSlipTitle(`${member.memberName} — ${exp.purchaseDate}`);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800 transition"
                              >
                                <Eye className="h-3 w-3" /> স্লিপ
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                স্লিপ নেই
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slip Fullscreen Modal */}
      {previewSlipUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  বাজারের রসিদ / ক্যাশ মেমো: {previewSlipTitle}
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
