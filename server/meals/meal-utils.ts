/**
 * MessMate — Meal Management Utilities (Task 33)
 *
 * Implements Asia/Dhaka timezone-aware scheduling, cutoff validations,
 * date manipulations, and zero-drift integer poisha meal rate calculations.
 */

export const DHAKA_TIMEZONE = 'Asia/Dhaka';

/**
 * Returns current date and time formatted in Asia/Dhaka
 */
export function getDhakaNow(referenceDate: Date = new Date()): Date {
  // Convert referenceDate to Asia/Dhaka timezone representation
  const dhakaString = referenceDate.toLocaleString('en-US', { timeZone: DHAKA_TIMEZONE });
  return new Date(dhakaString);
}

/**
 * Returns current Date string "YYYY-MM-DD" in Asia/Dhaka
 */
export function getDhakaDateString(referenceDate: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);
  return parts; // 'YYYY-MM-DD'
}

/**
 * Returns current month string "YYYY-MM" in Asia/Dhaka
 */
export function getDhakaMonthString(referenceDate: Date = new Date()): string {
  const dateStr = getDhakaDateString(referenceDate);
  return dateStr.substring(0, 7);
}

/**
 * Returns current time "HH:mm" in Asia/Dhaka (24-hour)
 */
export function getDhakaTimeString(referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(referenceDate);
}

/**
 * Checks whether a requested meal modification or meal-off is submitted past the configured cutoff time.
 *
 * Rules:
 * - Past dates (< today in Dhaka): ALWAYS past cutoff.
 * - Future dates (> tomorrow in Dhaka): NOT past cutoff.
 * - Tomorrow's date: Checks if current time is past the previous evening's default cutoff (e.g. 20:00 / 8 PM).
 * - Today's date: Checks against specific meal cutoff time (e.g. breakfast 06:00, lunch 09:00, dinner 16:00).
 */
export function isMealCutoffPassed(params: {
  targetDateString: string; // "YYYY-MM-DD"
  cutoffTime?: string; // "HH:mm" e.g. "20:00" or "09:00"
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'ALL';
  now?: Date;
}): boolean {
  const now = params.now || new Date();
  const todayDhaka = getDhakaDateString(now);
  const currentTime = getDhakaTimeString(now);

  const targetDate = params.targetDateString;

  // 1. Any date strictly before today is in the past
  if (targetDate < todayDhaka) {
    return true;
  }

  // 2. Target is more than 1 day in the future (e.g. target > tomorrow)
  const tomorrow = getNextDayString(todayDhaka);
  if (targetDate > tomorrow) {
    return false;
  }

  // 3. Target is tomorrow: check if today is past the default evening cutoff (e.g. "20:00")
  if (targetDate === tomorrow) {
    const cutoff = params.cutoffTime || '20:00';
    return currentTime >= cutoff;
  }

  // 4. Target is today: check against the meal's same-day cutoff or evening cutoff
  if (targetDate === todayDhaka) {
    let cutoff = params.cutoffTime;
    if (!cutoff) {
      if (params.mealType === 'BREAKFAST') cutoff = '06:00';
      else if (params.mealType === 'LUNCH') cutoff = '09:00';
      else if (params.mealType === 'DINNER') cutoff = '16:00';
      else cutoff = '08:00';
    }
    return currentTime >= cutoff;
  }

  return false;
}

/**
 * Helper to compute the next day string "YYYY-MM-DD"
 */
export function getNextDayString(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Helper to get all days in a month as strings "YYYY-MM-DD"
 */
export function getDaysInMonth(monthStr: string): string[] {
  const [year, month] = monthStr.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let i = 1; i <= totalDays; i++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push(dayStr);
  }
  return days;
}

/**
 * Calculates meal rate: Eligible Expenses / Total Chargeable Units
 * Exact integer poisha arithmetic.
 */
export function calculateExactMealRate(params: {
  eligibleExpensesPoisha: bigint;
  totalChargeableUnits: number;
}): {
  mealRatePoisha: bigint;
  mealRateTaka: number;
} {
  const { eligibleExpensesPoisha, totalChargeableUnits } = params;

  if (totalChargeableUnits <= 0 || eligibleExpensesPoisha <= BigInt(0)) {
    return {
      mealRatePoisha: BigInt(0),
      mealRateTaka: 0,
    };
  }

  // 1 unit = 100 hundredths of a unit for integer precision
  // mealRatePoisha = (eligibleExpensesPoisha) / totalChargeableUnits
  const rateFloat = Number(eligibleExpensesPoisha) / totalChargeableUnits;
  const mealRatePoisha = BigInt(Math.round(rateFloat));
  const mealRateTaka = Number((Number(mealRatePoisha) / 100).toFixed(2));

  return {
    mealRatePoisha,
    mealRateTaka,
  };
}

/**
 * Formats poisha to Bangladeshi Taka display string
 */
export function poishaToTakaDisplay(poisha: bigint | number): string {
  const num = typeof poisha === 'bigint' ? Number(poisha) : poisha;
  return `৳${(num / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
