import type {
  BankAccount,
  Deposit,
  DepositAdjustment,
  AccountSummary,
  History,
  ChartPoint,
} from "../../../types/banking.types";

export const calculateAccountSummaries = (
  accounts: BankAccount[],
  deposits: Deposit[],
  adjustments: DepositAdjustment[]
): AccountSummary[] => {
  return accounts.map((account) => {
    const accountDeposits = deposits.filter((d) => d.accountId === account.id);
    const accountAdjustments = adjustments.filter(
      (a) => a.accountId === account.id
    );

    const totalDeposits = accountDeposits.reduce((sum, d) => sum + d.amount, 0);
    const totalAdjustments = accountAdjustments.reduce(
      (sum, a) => sum + a.adjustmentAmount,
      0
    );

    return {
      accountId: account.id,
      acctCode: account.acctCode,
      savings: account.savingsAmount,
      deposits: totalDeposits,
      adjustments: totalAdjustments,
      netBalance: account.savingsAmount + totalDeposits + totalAdjustments,
    };
  });
};

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