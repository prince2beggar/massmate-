'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Lock, Loader2 } from 'lucide-react';

interface MemberStatementModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  membershipId: string;
  monthString: string;
}

export function MemberStatementModal({
  tenantSlug,
  isOpen,
  onClose,
  membershipId,
  monthString,
}: MemberStatementModalProps) {
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !membershipId) return;

    let isMounted = true;

    async function loadStatement() {
      try {
        const res = await fetch(
          `/api/v1/mess/${tenantSlug}/finance/statements/${membershipId}?month=${monthString}`
        );
        const json = await res.json();
        if (!isMounted) return;
        if (json.success && json.data) {
          setStatement(json.data);
        } else {
          setError(json.error?.message || 'Failed to load member statement');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error fetching statement');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadStatement();

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, membershipId, monthString, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {statement?.memberName || 'Member'} — Financial Statement
              </h2>
              <p className="text-xs text-slate-500">
                Billing Period: {monthString} {statement?.billNumber ? `• Bill #${statement.billNumber}` : ''}
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

        <div className="p-6 space-y-5">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs">Loading audited statement...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statement && !loading && (
            <>
              {/* Formula & Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/70 to-white p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Opening Due:</span>
                    <span className="font-bold text-slate-800">
                      ৳{statement.openingDueTaka.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">New Charges:</span>
                    <span className="font-bold text-slate-800">
                      ৳{statement.totalChargesTaka.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payments Credited:</span>
                    <span className="font-bold text-emerald-700">
                      ৳{statement.paidAmountTaka.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Adjustments / Credits:</span>
                    <span className="font-bold text-blue-700">
                      ৳{statement.creditAdjustmentTaka.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs font-bold text-slate-700">Closing Balance:</span>
                  <span
                    className={`text-lg font-black ${
                      statement.closingBalanceTaka > 0
                        ? 'text-rose-700'
                        : statement.closingBalanceTaka < 0
                        ? 'text-emerald-700'
                        : 'text-slate-900'
                    }`}
                  >
                    ৳{statement.closingBalanceTaka.toFixed(2)}
                  </span>
                </div>

                {statement.isPeriodLocked && (
                  <div className="rounded-xl bg-amber-50 p-2 text-[11px] text-amber-800 flex items-center gap-1.5 border border-amber-200">
                    <Lock className="h-3 w-3 text-amber-600" />
                    <span>This month has been closed and locked. Statement totals are frozen.</span>
                  </div>
                )}
              </div>

              {/* Itemized Charges Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Itemized Charges</span>
                  <span className="text-slate-500">{statement.items?.length || 0} items</span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Allocation Rule</th>
                        <th className="px-4 py-2 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statement.items?.map((it: any) => (
                        <tr key={it.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2 font-medium text-slate-900">{it.categoryName}</td>
                          <td className="px-4 py-2 text-slate-500">
                            {it.allocationRule?.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">
                            ৳{it.amountTaka.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confirmed Payments */}
              {statement.payments?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Payments Credited</span>
                    <span className="text-slate-500">
                      {statement.payments.length} transactions
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Method</th>
                          <th className="px-4 py-2">TrxID</th>
                          <th className="px-4 py-2 text-right">Amount (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statement.payments.map((pm: any) => (
                          <tr key={pm.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2 text-slate-800">{pm.paymentDate}</td>
                            <td className="px-4 py-2 font-medium text-emerald-800">{pm.paymentMethod}</td>
                            <td className="px-4 py-2 font-mono text-slate-600">
                              {pm.transactionId || 'Cash'}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                              ৳{pm.amountTaka.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
