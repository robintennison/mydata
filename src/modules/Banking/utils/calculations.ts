import type {
  History,
  ChartPoint,
} from "../../../types/banking.types";

export const calculateChartData = (
  history: History[],
  formatCurrency: (amount: number) => string
): ChartPoint[] => {
  return history
    .map((h) => ({
      month: h.month,
      value: h.totalDeposits,
      displayValue: formatCurrency(h.totalDeposits),
      normalizedValue: h.totalDeposits,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};