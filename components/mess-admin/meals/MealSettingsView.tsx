'use client';

import React, { useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, RefreshCw, Clock, Utensils } from 'lucide-react';

interface MealSettingsViewProps {
  tenantSlug: string;
  initialSettings: any;
  onSaved: () => void;
}

export function MealSettingsView({
  tenantSlug,
  initialSettings,
  onSaved,
}: MealSettingsViewProps) {
  const [mealSystem, setMealSystem] = useState(initialSettings?.mealSystem || 'FLEXIBLE');
  const [breakfastEnabled, setBreakfastEnabled] = useState(
    initialSettings?.breakfastEnabled ?? true
  );
  const [lunchEnabled, setLunchEnabled] = useState(initialSettings?.lunchEnabled ?? true);
  const [dinnerEnabled, setDinnerEnabled] = useState(initialSettings?.dinnerEnabled ?? true);

  const [breakfastWeight, setBreakfastWeight] = useState(
    String(initialSettings?.breakfastWeight ?? 0.5)
  );
  const [lunchWeight, setLunchWeight] = useState(String(initialSettings?.lunchWeight ?? 1.0));
  const [dinnerWeight, setDinnerWeight] = useState(
    String(initialSettings?.dinnerWeight ?? 1.0)
  );

  const [defaultCutoffTime, setDefaultCutoffTime] = useState(
    initialSettings?.defaultCutoffTime || '20:00'
  );
  const [breakfastCutoff, setBreakfastCutoff] = useState(
    initialSettings?.breakfastCutoff || '06:00'
  );
  const [lunchCutoff, setLunchCutoff] = useState(
    initialSettings?.lunchCutoff || '09:00'
  );
  const [dinnerCutoff, setDinnerCutoff] = useState(
    initialSettings?.dinnerCutoff || '16:00'
  );

  const [autoApproveMealOff, setAutoApproveMealOff] = useState(
    initialSettings?.autoApproveMealOff ?? true
  );
  const [guestMealFixedRateTaka, setGuestMealFixedRateTaka] = useState(
    String(initialSettings?.guestMealFixedRateTaka ?? 80.0)
  );
  const [guestMealChargeType, setGuestMealChargeType] = useState(
    initialSettings?.guestMealChargeType || 'FIXED_RATE'
  );

  const [categories, setCategories] = useState<string[]>(
    initialSettings?.eligibleExpenseCategories || ['BAZAR', 'GROCERY', 'COOK_SALARY']
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      if (categories.length === 1) return;
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const bw = parseFloat(breakfastWeight);
    const lw = parseFloat(lunchWeight);
    const dw = parseFloat(dinnerWeight);
    const gRatePoisha = Math.round(parseFloat(guestMealFixedRateTaka || '0') * 100);

    if (isNaN(bw) || bw < 0 || isNaN(lw) || lw < 0 || isNaN(dw) || dw < 0) {
      setFeedback({ type: 'error', message: 'Meal weights must be valid non-negative numbers.' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/meals/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSystem,
          breakfastEnabled,
          lunchEnabled,
          dinnerEnabled,
          breakfastWeight: bw,
          lunchWeight: lw,
          dinnerWeight: dw,
          defaultCutoffTime,
          breakfastCutoff,
          lunchCutoff,
          dinnerCutoff,
          autoApproveMealOff,
          guestMealChargeType,
          guestMealFixedRatePoisha: gRatePoisha,
          eligibleExpenseCategories: categories,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update settings');
      }

      setFeedback({ type: 'success', message: 'Meal settings successfully updated.' });
      onSaved();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Meal System Configurations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure flexible vs fixed dining, Asia/Dhaka cutoffs, and meal rate parameters
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: SYSTEM TYPE */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Dining Model & Meal Entitlements
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'FLEXIBLE',
                title: 'Flexible System',
                desc: 'Residents order customized meal counts per meal (e.g. 1 breakfast, 2 lunches, 0 dinner).',
              },
              {
                id: 'FIXED',
                title: 'Fixed System',
                desc: 'Residents have a standard daily full entitlement unless a meal-off is submitted.',
              },
              {
                id: 'BOTH',
                title: 'Hybrid / Both',
                desc: 'Allows fixed regular meals with flexible guest or custom add-ons.',
              },
            ].map((sys) => (
              <div
                key={sys.id}
                onClick={() => setMealSystem(sys.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  mealSystem === sys.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{sys.title}</span>
                  <input
                    type="radio"
                    name="mealSystem"
                    checked={mealSystem === sys.id}
                    onChange={() => setMealSystem(sys.id)}
                    className="text-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{sys.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={breakfastEnabled}
                onChange={(e) => setBreakfastEnabled(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Breakfast Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={lunchEnabled}
                onChange={(e) => setLunchEnabled(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Lunch Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={dinnerEnabled}
                onChange={(e) => setDinnerEnabled(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Dinner Enabled</span>
            </label>
          </div>
        </div>

        {/* SECTION 2: MEAL WEIGHTS */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Flexible Meal Weights (Chargeable Units)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Defines how many units each meal counts towards the final meal rate bill (e.g. 0.5 units for breakfast, 1.0 unit for lunch).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Breakfast Weight
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={breakfastWeight}
                onChange={(e) => setBreakfastWeight(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Lunch Weight
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={lunchWeight}
                onChange={(e) => setLunchWeight(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Dinner Weight
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={dinnerWeight}
                onChange={(e) => setDinnerWeight(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ASIA/DHAKA CUTOFF TIMES */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Asia/Dhaka Cutoff Deadlines
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Changes submitted past these local Dhaka times will require admin override approval.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Evening Cutoff (Day-1)
              </label>
              <input
                type="time"
                value={defaultCutoffTime}
                onChange={(e) => setDefaultCutoffTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Breakfast Cutoff
              </label>
              <input
                type="time"
                value={breakfastCutoff}
                onChange={(e) => setBreakfastCutoff(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Lunch Cutoff
              </label>
              <input
                type="time"
                value={lunchCutoff}
                onChange={(e) => setLunchCutoff(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Dinner Cutoff
              </label>
              <input
                type="time"
                value={dinnerCutoff}
                onChange={(e) => setDinnerCutoff(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={autoApproveMealOff}
                onChange={(e) => setAutoApproveMealOff(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>
                Auto-approve meal-off requests submitted before the Dhaka evening cutoff
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 4: GUEST MEAL & EXPENSE POLICIES */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Guest Meals & Eligible Expense Categories
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Guest Meal Fixed Rate (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={guestMealFixedRateTaka}
                onChange={(e) => setGuestMealFixedRateTaka(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Standard charge per guest meal when fixed rate policy applies
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Eligible Expense Categories for Meal Rate
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['BAZAR', 'GROCERY', 'COOK_SALARY', 'GAS', 'WATER', 'ELECTRICITY', 'WIFI'].map(
                  (cat) => {
                    const active = categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
