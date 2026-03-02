// utils/emwCalculations.ts

/**
 * Calculate EMW (Equivalent Monthly Withdrawal) amount
 * @param currentBalance - Current total balance
 * @param targetDate - Target date for withdrawals
 * @param annualInterestRate - Annual interest rate as percentage (default: 0%)
 * @returns EMW amount rounded to 2 decimal places
 */
export const calculateEMW = (
  currentBalance: number,
  targetDate: Date,
  annualInterestRate: number = 0,
): number => {
  if (currentBalance <= 0) return 0;

  const today = new Date();
  if (targetDate <= today) return 0;

  // Calculate number of months until target date
  const monthsDiff =
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
    (targetDate.getMonth() - today.getMonth());

  if (monthsDiff <= 0) return currentBalance;

  // Convert annual interest rate to monthly rate
  const monthlyInterestRate = annualInterestRate / 12 / 100;

  // Calculate EMW using the formula: PMT = PV × r / [1 - (1 + r)^-n]
  const numerator = currentBalance * monthlyInterestRate;
  const denominator = 1 - Math.pow(1 + monthlyInterestRate, -monthsDiff);

  if (denominator <= 0) {
    return currentBalance / monthsDiff; // Simple division without interest
  }

  const emw = numerator / denominator;

  // Round to 2 decimal places
  return Math.round(emw * 100) / 100;
};

/**
 * Parse EMW settings from app settings
 * @param appSettings - Application settings object
 * @returns Object containing interest rate, target date, and target date string
 */
export const getEmwSettings = (appSettings: any) => {
  // Default values
  let interestRate = 0; // 0% default
  let targetDateStr = "2039-10"; // November 2039 default

  if (appSettings) {
    // Use EMW_Interest from settings or default
    interestRate =
      appSettings.EMW_interest !== undefined ? appSettings.EMW_interest : 0;

    // Use EMW_Date from settings or default
    targetDateStr = appSettings.EMW_Date || "2039-10";
  }

  // Parse target date string (format: YYYY-MM)
  let targetDate: Date;
  try {
    const [year, month] = targetDateStr.split("-").map(Number);
    targetDate = new Date(year, month - 1, 1); // month is 0-indexed
  } catch (error) {
    // Fallback to default date if parsing fails
    console.error("Error parsing EMW date:", error);
    targetDate = new Date(2039, 10, 1); // November 2039
    targetDateStr = "2039-10";
  }

  return {
    interestRate,
    targetDate,
    targetDateStr,
  };
};