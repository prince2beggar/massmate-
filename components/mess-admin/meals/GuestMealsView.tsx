'use client';

import React, { useState } from 'react';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { RecordGuestMealModal } from './RecordGuestMealModal';

interface GuestMealsViewProps {
  tenantSlug: string;
  initialGuestMeals: any[];
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
  defaultGuestRatePoisha: string;
  onRefresh: () => void;
}

export function GuestMealsView({
  tenantSlug,
  initialGuestMeals = [],
  members,
  defaultGuestRatePoisha,
  onRefresh,
}: GuestMealsViewProps) {
  const [guestMeals, setGuestMeals] = useState<any[]>(initialGuestMeals);
  const [loading, setLoading] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);



  const fetchGuestMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/guest`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGuestMeals(json.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const totalCount = guestMeals.reduce((acc, g) => acc + (Number(g.count) || 0), 0);
  const totalRevenue = guestMeals
    .reduce((acc, g) => acc + (Number(g.totalAmountTaka) || 0), 0)
    .toFixed(2);
  const paidCount = guestMeals.filter((g) => g.isPaid).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Guest Meals & Visitors
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track visitors dining as guests of residents with exact poisha billing
          </p>
        </div>
        <button
          onClick={() => setIsRecordOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Guest Meal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Guest Meals Logged</span>
          <div className="text-xl font-bold text-foreground mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Total Revenue</span>
          <div className="text-xl font-bold text-primary mt-1">৳{totalRevenue}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Paid Immediately</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{paidCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Added to Resident Bill</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {guestMeals.length - paidCount}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Loading guest meals...</p>
        </div>
      ) : guestMeals.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No Guest Meals Recorded</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Record guest meals when residents invite visitors or friends to dine.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest Name</th>
                  <th className="px-4 py-3 font-medium">Host Resident</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Meal Type</th>
                  <th className="px-4 py-3 font-medium text-center">Count</th>
                  <th className="px-4 py-3 font-medium text-right">Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guestMeals.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/20 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {g.guestName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.hostMemberName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.dateString}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{g.mealType}</td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">
                      {g.count}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      ৳{g.unitRateTaka.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      ৳{g.totalAmountTaka.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {g.isPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Paid Cash
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Billed to Host
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Modal */}
      <RecordGuestMealModal
        tenantSlug={tenantSlug}
        members={members}
        defaultRatePoisha={defaultGuestRatePoisha}
        defaultDate={new Date().toISOString().split('T')[0]}
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onRecorded={() => {
          void fetchGuestMeals();
          onRefresh();
        }}
      />
    </div>
  );
}
