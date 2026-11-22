'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  User,
  Tag,
  CreditCard,
  Store,
  ShieldCheck,
  AlertCircle,
  Receipt,
  Eye,
} from 'lucide-react';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any | null;
}

export function ExpenseDetailsModal({ isOpen, onClose, expense }: ExpenseDetailsModalProps) {
  const [isReceiptZoomOpen, setIsReceiptZoomOpen] = useState(false);

  if (!isOpen || !expense) return null;

  const totalTaka = Number(expense.totalAmountPoisha || 0) / 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case 'REVERSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
            Reversed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Expense Voucher Details</h2>
            {getStatusBadge(expense.status)}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Top Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Purchase Date</span>
              </div>
              <span className="font-semibold text-slate-900">{expense.purchaseDate}</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <User className="h-3.5 w-3.5" />
                <span>Purchaser</span>
              </div>
              <span className="font-semibold text-slate-900">
                {expense.purchaser?.user?.name || expense.purchaserMembershipId}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Category</span>
              </div>
              <span className="font-semibold text-emerald-800">
                {expense.category?.name || 'General'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Payment Method</span>
              </div>
              <span className="font-semibold text-slate-900">{expense.paymentMethod}</span>
            </div>
          </div>

          {/* Vendor, Receipt, Notes */}
          {(expense.vendorName || expense.receiptUrl || expense.description || expense.notes) && (
            <div className="space-y-2 text-xs rounded-xl border border-slate-100 p-3 bg-white">
              {expense.vendorName && (
                <div className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-500">Vendor:</span>
                  <span className="font-medium text-slate-800">{expense.vendorName}</span>
                </div>
              )}
              {expense.description && (
                <div>
                  <span className="text-slate-500">Description: </span>
                  <span className="text-slate-800">{expense.description}</span>
                </div>
              )}
              {expense.notes && (
                <div>
                  <span className="text-slate-500">Notes: </span>
                  <span className="text-slate-800">{expense.notes}</span>
                </div>
              )}
              {expense.receiptUrl && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">বাজারের ভাউচার / স্লিপ:</span>
                    <span className="text-slate-500 truncate max-w-xs">{expense.receiptFileName || 'রসিদ ফাইল'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReceiptZoomOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> স্লিপ প্রিভিউ দেখুন
                    </button>
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ExternalLink className="h-3 w-3" /> ব্রাউজারে খুলুন
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit / Review Status Banner */}
          {expense.status === 'APPROVED' && expense.reviewedAt && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Verified & approved on {new Date(expense.reviewedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {expense.status === 'REJECTED' && expense.rejectionReason && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong>Rejection Reason:</strong> {expense.rejectionReason}
              </div>
            </div>
          )}

          {expense.status === 'REVERSED' && expense.reversalReason && (
            <div className="rounded-xl bg-slate-100 border border-slate-300 p-3 text-xs text-slate-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
              <div>
                <strong>Reversal Audit Reason:</strong> {expense.reversalReason}
              </div>
            </div>
          )}

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Line Items Breakdown</span>
              <span className="text-xs text-slate-500">
                {expense.items?.length || 0} line items
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Item Name</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expense.items?.map((it: any) => {
                    const lineTaka = Number(it.lineTotalPoisha || 0) / 100;
                    const unitTaka = Number(it.unitPricePoisha || 0) / 100;
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2 font-medium text-slate-800">{it.itemName}</td>
                        <td className="px-4 py-2 text-right text-slate-600">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600">
                          ৳{unitTaka.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">
                          ৳{lineTaka.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">Total Purchase Value:</span>
              <span className="text-base font-bold text-emerald-700">
                ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Slip Zoom Modal */}
      {isReceiptZoomOpen && expense.receiptUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    বাজারের ক্যাশ মেমো / স্লিপ (Receipt Voucher)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ক্রেতা: {expense.purchaser?.user?.name || expense.purchaserName || 'সদস্য'} • তারিখ: {expense.purchaseDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReceiptZoomOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/10 max-h-[80vh]">
              {expense.receiptUrl.startsWith('data:image') || expense.receiptUrl.startsWith('http') ? (
                <img
                  src={expense.receiptUrl}
                  alt="Receipt Document"
                  className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg border border-slate-200"
                />
              ) : (
                <iframe
                  src={expense.receiptUrl}
                  title="PDF Receipt"
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
