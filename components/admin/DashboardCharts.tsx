'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrowthPoint } from '@/server/platform/platform-overview-service';

// -----------------------------------------------------------------------------
// 1. TENANT GROWTH OVER TIME (Responsive SVG Area Chart)
// -----------------------------------------------------------------------------
interface TenantGrowthChartProps {
  points: GrowthPoint[];
  hasData: boolean;
  rangeLabel: string;
}

export function TenantGrowthChart({
  points,
  hasData,
  rangeLabel,
}: TenantGrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...points.map((p) => p.count), 5);
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Generate SVG coordinate points
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * usableWidth;
    const y = chartHeight - paddingY - (p.count / maxVal) * usableHeight;
    return { x, y, ...p };
  });

  const lineD = coords.reduce(
    (acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`,
    ''
  );

  const areaD = coords.length
    ? `${lineD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            Tenant Growth Over Time
          </h3>
          <p className="text-xs text-slate-500">
            Messes and accommodation businesses registered in {rangeLabel}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
          Live DB Stream
        </span>
      </div>

      <div className="pt-4">
        {!hasData ? (
          <div className="flex h-52 flex-col items-center justify-center rounded-lg bg-slate-50 text-center p-6 border border-dashed border-slate-200">
            <TrendingUp className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              No tenant registrations in {rangeLabel.toLowerCase()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              When messes onboard through registration or invitation, real-time growth curves will visualize here.
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-52 overflow-visible"
              aria-label="Tenant growth chart"
            >
              {/* Background horizontal grid lines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * usableHeight;
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94A3B8"
                    >
                      {Math.round(ratio * maxVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill gradient */}
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={areaD} fill="url(#growthGradient)" />
              <path
                d={lineD}
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredIndex === i ? 5 : 3.5}
                  className="fill-white stroke-indigo-600 stroke-2 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}

              {/* X Axis Labels */}
              {coords.map((c, i) => {
                // Show every 2nd or 3rd label if many points
                if (coords.length > 8 && i % 2 !== 0 && i !== coords.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={c.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748B"
                  >
                    {c.label}
                  </text>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredIndex !== null && coords[hoveredIndex] && (
              <div
                className="absolute -top-3 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg pointer-events-none transform -translate-x-1/2"
                style={{
                  left: `${(coords[hoveredIndex].x / chartWidth) * 100}%`,
                }}
              >
                <span className="font-bold text-indigo-300">
                  {coords[hoveredIndex].count} messes
                </span>{' '}
                on {coords[hoveredIndex].label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. ACTIVE VS SUSPENDED TENANTS (Donut / Status Breakdown)
// -----------------------------------------------------------------------------
interface TenantStatusBreakdownProps {
  active: number;
  pending: number;
  suspended: number;
  inactive: number;
  hasData: boolean;
}

export function TenantStatusBreakdown({
  active,
  pending,
  suspended,
  inactive,
  hasData,
}: TenantStatusBreakdownProps) {
  const total = active + pending + suspended + inactive;

  const items = [
    { label: 'Active', count: active, color: 'bg-emerald-500', text: 'text-emerald-700' },
    { label: 'Pending Approval', count: pending, color: 'bg-amber-500', text: 'text-amber-700' },
    { label: 'Suspended', count: suspended, color: 'bg-rose-500', text: 'text-rose-700' },
    { label: 'Inactive / Archived', count: inactive, color: 'bg-slate-400', text: 'text-slate-600' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-indigo-600" />
            Tenant Status Distribution
          </h3>
          <p className="text-xs text-slate-500">Lifecycle operational state across all registered messes</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
          Total: {total}
        </span>
      </div>

      <div className="pt-4">
        {!hasData ? (
          <div className="flex h-52 flex-col items-center justify-center rounded-lg bg-slate-50 text-center p-6 border border-dashed border-slate-200">
            <PieIcon className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No tenants registered</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Tenant status segments will render here once messes are created in the database.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Horizontal Segmented Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {total > 0 &&
                items.map((item, idx) => {
                  const pct = (item.count / total) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${pct}%` }}
                      className={cn('h-full transition-all', item.color)}
                      title={`${item.label}: ${item.count} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
            </div>

            {/* Legend & Count Rows */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {items.map((item, idx) => {
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. MONTHLY REVENUE & BILLING (Honest Empty State / Phase 3 Integration)
// -----------------------------------------------------------------------------
export function MonthlyRevenuePlaceholderCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Monthly Subscription Revenue
          </h3>
          <p className="text-xs text-slate-500">Recurring MRR, bKash, Nagad & Card receipts</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
          Phase 3 Pending
        </span>
      </div>

      <div className="pt-4">
        <div className="flex h-52 flex-col items-center justify-center rounded-lg bg-slate-50 text-center p-6 border border-dashed border-slate-200">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            No Subscription Billing Records
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Subscription billing, payment gateways, and invoice ledgers are planned for Phase 3. Revenue charts will automatically connect to real payment events once deployed.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5">
            <Info className="h-3 w-3" /> Zero fabricated data policy enforced
          </span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. SUBSCRIPTION PLAN DISTRIBUTION (Honest Empty State)
// -----------------------------------------------------------------------------
export function PlanDistributionPlaceholderCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Subscription Plan Distribution
          </h3>
          <p className="text-xs text-slate-500">Free Trial, Starter, Standard & Enterprise messes</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
          Phase 3 Pending
        </span>
      </div>

      <div className="pt-4">
        <div className="flex h-52 flex-col items-center justify-center rounded-lg bg-slate-50 text-center p-6 border border-dashed border-slate-200">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <Layers className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            No Active SaaS Plans Assigned
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Plan models and tenant subscription tiers are scheduled for the Phase 3 Subscriptions module. Tier distributions will render here once live.
          </p>
        </div>
      </div>
    </div>
  );
}
