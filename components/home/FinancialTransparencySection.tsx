'use client';

import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { calculateMessSettlement, type MemberLedgerInput } from '@/lib/meal-math';
import { useLanguage } from '@/context/LanguageContext';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';

const DEMO_MEMBERS: MemberLedgerInput[] = [
  {
    id: 'm1',
    name: 'Tanvir Hasan',
    roomLabel: 'Room 201',
    meals: 46,
    depositBdt: 8500,
    rentShareBdt: 4500,
    utilityShareBdt: 850,
  },
  {
    id: 'm2',
    name: 'Rafiul Islam',
    roomLabel: 'Room 202',
    meals: 38,
    depositBdt: 8200,
    rentShareBdt: 4500,
    utilityShareBdt: 850,
  },
  {
    id: 'm3',
    name: 'Mehedi Karim',
    roomLabel: 'Room 301',
    meals: 52,
    depositBdt: 9000,
    rentShareBdt: 5200,
    utilityShareBdt: 850,
  },
  {
    id: 'm4',
    name: 'Sajid Rahman',
    roomLabel: 'Room 302',
    meals: 44,
    depositBdt: 8800,
    rentShareBdt: 4500,
    utilityShareBdt: 850,
  },
];

export function FinancialTransparencySection() {
  const { t } = useLanguage();
  const [totalBazar, setTotalBazar] = useState<number>(11700);

  const summary = useMemo(
    () => calculateMessSettlement(totalBazar, DEMO_MEMBERS),
    [totalBazar]
  );

  return (
    <section id="financial-transparency" className="bg-white py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Narrative Left */}
          <div className="lg:col-span-5">
            <SectionHeader
              kicker={t.financial.kicker}
              title={t.financial.title}
              subtitle={t.financial.subtitle}
            />

            <div className="mt-8 rounded-xl border border-slate-200 bg-[#F8F9FE] p-5">
              <p className="text-xs font-semibold text-[#324CDD]">
                {t.financial.formulaTitle}
              </p>
              <p className="mt-1.5 font-mono text-xs sm:text-sm text-[#172B4D] leading-relaxed">
                {t.financial.formulaText}
              </p>
            </div>

            <ul className="mt-7 space-y-3.5 text-sm text-[#525F7F]">
              {t.financial.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <Check
                    className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Ledger Preview Right */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 argon-card-shadow">
              {/* Interactive Slider Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex-1">
                  <label
                    htmlFor="bazar-simulator-range"
                    className="block text-sm font-semibold text-[#172B4D]"
                  >
                    {t.financial.adjustBazarLabel}
                  </label>
                  <input
                    id="bazar-simulator-range"
                    type="range"
                    min={8000}
                    max={18000}
                    step={300}
                    value={totalBazar}
                    onChange={(e) => setTotalBazar(Number(e.target.value))}
                    className="mt-3 w-full accent-[#324CDD] cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div>
                    <p className="text-xs text-[#525F7F]">{t.hero.totalBazarLabel}</p>
                    <p className="font-mono tabular-nums text-lg font-bold text-[#172B4D]">
                      ৳{summary.totalBazarBdt.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="pl-5 border-l border-slate-200">
                    <p className="text-xs text-[#525F7F]">{t.hero.mealRateLabel}</p>
                    <p className="font-mono tabular-nums text-lg font-bold text-[#324CDD]">
                      ৳{summary.mealRateBdt.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settlement Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-[#525F7F]">
                      <th className="py-2.5 pr-3">{t.financial.tableHeaders.member}</th>
                      <th className="py-2.5 px-2 text-right">{t.financial.tableHeaders.meals}</th>
                      <th className="py-2.5 px-2 text-right">{t.financial.tableHeaders.mealCost}</th>
                      <th className="py-2.5 px-2 text-right">{t.financial.tableHeaders.rentUtilities}</th>
                      <th className="py-2.5 px-2 text-right">{t.financial.tableHeaders.deposit}</th>
                      <th className="py-2.5 pl-3 text-right">{t.financial.tableHeaders.balance}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {summary.rows.map((row) => {
                      const isRefund = row.netBalanceBdt > 0;
                      const isZero = row.netBalanceBdt === 0;
                      const statusLabel = isZero
                        ? t.financial.settled
                        : isRefund
                        ? t.financial.refundable
                        : t.financial.payable;
                      const statusClass = isZero
                        ? 'text-slate-600'
                        : isRefund
                        ? 'text-emerald-700'
                        : 'text-rose-700';

                      return (
                        <tr key={row.id}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold text-[#172B4D]">{row.name}</p>
                            <p className="text-xs text-[#64748B]">{row.roomLabel}</p>
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums text-[#172B4D]">
                            {row.meals}
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums text-[#525F7F]">
                            ৳{row.mealCostBdt.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums text-[#525F7F]">
                            ৳{(row.rentShareBdt + row.utilityShareBdt).toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-2 text-right font-mono tabular-nums text-[#172B4D]">
                            ৳{row.depositBdt.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <p className={`font-mono tabular-nums font-bold ${statusClass}`}>
                              {row.netBalanceBdt > 0 ? '+' : ''}
                              {row.netBalanceBdt < 0 ? '-' : ''}৳
                              {Math.abs(row.netBalanceBdt).toLocaleString('en-US')}
                            </p>
                            <p className={`text-[11px] font-medium ${statusClass}`}>
                              {statusLabel}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
