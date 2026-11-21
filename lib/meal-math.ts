export interface MemberLedgerInput {
  id: string;
  name: string;
  roomLabel: string;
  meals: number;
  depositBdt: number;
  rentShareBdt: number;
  utilityShareBdt: number;
}

export interface MemberSettlementRow extends MemberLedgerInput {
  mealCostBdt: number;
  totalChargeBdt: number;
  netBalanceBdt: number; // positive = refundable, negative = payable due
}

export interface MessFinancialSummary {
  totalBazarBdt: number;
  totalMeals: number;
  mealRateBdt: number;
  totalDepositsBdt: number;
  rows: MemberSettlementRow[];
}

export function calculateMessSettlement(
  totalBazarBdt: number,
  members: MemberLedgerInput[]
): MessFinancialSummary {
  const safeBazar = Math.max(0, totalBazarBdt);
  const totalMeals = members.reduce((sum, m) => sum + Math.max(0, m.meals), 0);
  const rawMealRate = totalMeals > 0 ? safeBazar / totalMeals : 0;
  const mealRateBdt = Math.round(rawMealRate * 100) / 100;

  let totalDepositsBdt = 0;

  const rows: MemberSettlementRow[] = members.map((member) => {
    const safeMeals = Math.max(0, member.meals);
    const mealCostBdt = Math.round(safeMeals * rawMealRate);
    const totalChargeBdt =
      mealCostBdt + Math.max(0, member.rentShareBdt) + Math.max(0, member.utilityShareBdt);
    const netBalanceBdt = member.depositBdt - totalChargeBdt;
    totalDepositsBdt += member.depositBdt;

    return {
      ...member,
      meals: safeMeals,
      mealCostBdt,
      totalChargeBdt,
      netBalanceBdt,
    };
  });

  return {
    totalBazarBdt: safeBazar,
    totalMeals,
    mealRateBdt,
    totalDepositsBdt,
    rows,
  };
}
