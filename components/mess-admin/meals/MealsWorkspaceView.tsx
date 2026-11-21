'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  CalendarDays,
  CalendarOff,
  Users,
  Calculator,
  Settings,
} from 'lucide-react';
import { DailyMealSheetView } from './DailyMealSheetView';
import { MealOffRequestsView } from './MealOffRequestsView';
import { GuestMealsView } from './GuestMealsView';
import { MonthlyMealSummaryView } from './MonthlyMealSummaryView';
import { MealSettingsView } from './MealSettingsView';

interface MealsWorkspaceViewProps {
  tenantSlug: string;
  initialSheet: any;
  initialSettings: any;
  initialSummary: any;
  initialMealOffRequests?: any[];
  initialGuestMeals?: any[];
  members: Array<{ id: string; name: string; memberCode?: string | null }>;
}

export function MealsWorkspaceView({
  tenantSlug,
  initialSheet,
  initialSettings,
  initialSummary,
  initialMealOffRequests = [],
  initialGuestMeals = [],
  members,
}: MealsWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<
    'daily' | 'meal-off' | 'guest' | 'summary' | 'settings'
  >('daily');

  // Shared / Prefetched States
  const [sheetData, setSheetData] = useState(initialSheet);
  const [settingsData, setSettingsData] = useState(initialSettings);
  const [summaryData, setSummaryData] = useState(initialSummary);
  const [mealOffRequests, setMealOffRequests] = useState<any[]>(initialMealOffRequests);
  const [guestMeals, setGuestMeals] = useState<any[]>(initialGuestMeals);

  // Tab Data Fetchers
  const fetchSheet = async (dateStr?: string) => {
    try {
      const d = dateStr || sheetData?.dateString || new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/daily?date=${d}`);
      const json = await res.json();
      if (json.success && json.data) setSheetData(json.data);
    } catch {}
  };

  const fetchMealOffs = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/off-requests`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setMealOffRequests(json.data);
    } catch {}
  };

  const fetchGuestMeals = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/guest`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setGuestMeals(json.data);
    } catch {}
  };

  const fetchSummary = async (monthStr?: string) => {
    try {
      const m = monthStr || summaryData?.monthString;
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/summary?month=${m}`);
      const json = await res.json();
      if (json.success && json.data) setSummaryData(json.data);
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/settings`);
      const json = await res.json();
      if (json.success && json.data) setSettingsData(json.data);
    } catch {}
  };

  const handleTabChange = (
    tab: 'daily' | 'meal-off' | 'guest' | 'summary' | 'settings'
  ) => {
    setActiveTab(tab);
    if (tab === 'daily') void fetchSheet();
    if (tab === 'meal-off') void fetchMealOffs();
    if (tab === 'guest') void fetchGuestMeals();
    if (tab === 'summary') void fetchSummary();
    if (tab === 'settings') void fetchSettings();
  };

  const pendingMealOffCount = mealOffRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <span>Meal Management System</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage daily dining schedules, Dhaka cutoff meal-offs, guest plates, and live meal rate calculations
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex items-center gap-6 overflow-x-auto pb-px">
          <button
            onClick={() => handleTabChange('daily')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'daily'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Daily Sheet & Menus</span>
          </button>

          <button
            onClick={() => handleTabChange('meal-off')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'meal-off'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarOff className="w-4 h-4" />
            <span>Meal-Off Requests</span>
            {pendingMealOffCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingMealOffCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('guest')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guest'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guest Meals</span>
          </button>

          <button
            onClick={() => handleTabChange('summary')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Monthly Summary & Rate</span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Rules</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY SHEET */}
      {activeTab === 'daily' && (
        <DailyMealSheetView
          tenantSlug={tenantSlug}
          initialSheet={sheetData}
          onRefresh={(date) => {
            void fetchSheet(date);
            void fetchSummary();
          }}
        />
      )}

      {/* TAB 2: MEAL-OFF REQUESTS */}
      {activeTab === 'meal-off' && (
        <MealOffRequestsView
          tenantSlug={tenantSlug}
          initialRequests={mealOffRequests}
          members={members}
          onRefresh={() => {
            void fetchMealOffs();
            void fetchSheet();
            void fetchSummary();
          }}
        />
      )}

      {/* TAB 3: GUEST MEALS */}
      {activeTab === 'guest' && (
        <GuestMealsView
          tenantSlug={tenantSlug}
          initialGuestMeals={guestMeals}
          members={members}
          defaultGuestRatePoisha={settingsData?.guestMealFixedRatePoisha || '8000'}
          onRefresh={() => {
            void fetchGuestMeals();
            void fetchSheet();
            void fetchSummary();
          }}
        />
      )}

      {/* TAB 4: MONTHLY SUMMARY & MEAL RATE */}
      {activeTab === 'summary' && (
        <MonthlyMealSummaryView
          tenantSlug={tenantSlug}
          initialSummary={summaryData}
          onRefresh={(m) => {
            void fetchSummary(m);
            void fetchSheet();
          }}
        />
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <MealSettingsView
          tenantSlug={tenantSlug}
          initialSettings={settingsData}
          onSaved={() => {
            void fetchSettings();
            void fetchSheet();
            void fetchSummary();
          }}
        />
      )}
    </div>
  );
}
