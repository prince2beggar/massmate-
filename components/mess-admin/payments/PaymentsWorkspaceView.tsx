'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import { RecordPaymentModal } from './RecordPaymentModal';
import { VerifyPaymentModal } from './VerifyPaymentModal';
import { RefundPaymentModal } from './RefundPaymentModal';

interface PaymentRecord {
  id: string;
  membershipId: string;
  memberName: string;
  memberCode?: string | null;
  billId?: string | null;
  paymentDate: string;
  amountTaka: number;
  paymentMethod: string;
  transactionId?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';
  rejectionReason?: string | null;
  refundReason?: string | null;
  createdAt: string;
}

interface MemberOption {
  id: string;
  name: string;
  memberCode?: string | null;
}

interface PaymentsWorkspaceViewProps {
  tenantSlug: string;
  initialPayments: PaymentRecord[];
  members: MemberOption[];
  currentMonth: string;
}

export function PaymentsWorkspaceView({
  tenantSlug,
  initialPayments,
  members,
  currentMonth,
}: PaymentsWorkspaceViewProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<PaymentRecord | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/payments?month=${selectedMonth}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPayments(json.data);
      }
    } catch {}
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedMonth && !p.paymentDate.startsWith(selectedMonth)) return false;
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
      if (selectedMethod !== 'ALL' && p.paymentMethod !== selectedMethod) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = p.memberName?.toLowerCase() || '';
        const trx = p.transactionId?.toLowerCase() || '';
        const note = p.notes?.toLowerCase() || '';
        if (!name.includes(query) && !trx.includes(query) && !note.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [payments, selectedMonth, selectedStatus, selectedMethod, searchTerm]);

  // Aggregate KPIs
  const { confirmedTotal, pendingTotal, confirmedCount, pendingCount } = useMemo(() => {
    let conf = 0;
    let pend = 0;
    let cCount = 0;
    let pCount = 0;
    for (const p of filteredPayments) {
      if (p.status === 'CONFIRMED') {
        conf += p.amountTaka;
        cCount++;
      } else if (p.status === 'PENDING') {
        pend += p.amountTaka;
        pCount++;
      }
    }
    return {
      confirmedTotal: conf,
      pendingTotal: pend,
      confirmedCount: cCount,
      pendingCount: pCount,
    };
  }, [filteredPayments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pending Verification
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-300">
            <RotateCcw className="h-3 w-3" /> Refunded
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Member Payments & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review manual cash and mobile money deposits, audit TrxIDs, and verify deposits
          </p>
        </div>
        <button
          onClick={() => setIsRecordOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Record Deposit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Confirmed Collections</span>
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            ৳{confirmedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">{confirmedCount} verified deposits</div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Pending Verification</span>
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900">
            ৳{pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">
            {pendingCount} vouchers awaiting review
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800">Online Gateways</span>
            <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">Manual / Semi-Automated</div>
          <div className="mt-1 text-[11px] text-slate-500">bKash, Nagad, Rocket, Bank, Cash</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total Vouchers</span>
            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{filteredPayments.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">In filtered period</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by member name, TrxID, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-700">No Payments Recorded</h4>
            <p className="mt-1 text-xs text-slate-500">
              No payments match your current month and filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Resident</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">TrxID / Reference</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {p.paymentDate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{p.memberName}</div>
                      {p.memberCode && (
                        <div className="text-[11px] text-slate-400">{p.memberCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                      {p.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.transactionId ? (
                        <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800">
                          {p.transactionId}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic">None (Cash)</span>
                      )}
                      {p.receiptUrl && (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center text-emerald-600 hover:text-emerald-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">
                        ৳{p.amountTaka?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => setVerifyTarget(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Verify
                        </button>
                      )}
                      {p.status === 'CONFIRMED' && (
                        <button
                          onClick={() => setRefundTarget(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Refund Payment"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isRecordOpen && (
        <RecordPaymentModal
          tenantSlug={tenantSlug}
          isOpen={isRecordOpen}
          onClose={() => setIsRecordOpen(false)}
          onSuccess={() => void fetchPayments()}
          members={members}
        />
      )}

      {verifyTarget && (
        <VerifyPaymentModal
          tenantSlug={tenantSlug}
          isOpen={Boolean(verifyTarget)}
          onClose={() => setVerifyTarget(null)}
          onSuccess={() => void fetchPayments()}
          payment={verifyTarget}
        />
      )}

      {refundTarget && (
        <RefundPaymentModal
          tenantSlug={tenantSlug}
          isOpen={Boolean(refundTarget)}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => void fetchPayments()}
          payment={refundTarget}
        />
      )}
    </div>
  );
}
