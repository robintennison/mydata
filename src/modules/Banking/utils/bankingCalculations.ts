import { BankAccount, Deposit, DepositAdjustment } from "../../../types/banking.types";

/**
 * Calculates the total balance across all accounts, including savings and adjusted deposits.
 */
export const calculateTotalBalance = (
    accounts: BankAccount[],
    deposits: Deposit[],
    adjustments: DepositAdjustment[],
    showInactive: boolean = false
): number => {
    const totalSavings = accounts.reduce((sum, account) => sum + account.savingsAmount, 0);
    const totalDeposits = calculateTotalDeposits(accounts, deposits, adjustments, showInactive);
    return totalSavings + totalDeposits;
};

/**
 * Calculates the total deposits across all accounts, matching the Android/BankingHomePage logic.
 */
export const calculateTotalDeposits = (
    accounts: BankAccount[],
    deposits: Deposit[],
    adjustments: DepositAdjustment[],
    showInactive: boolean = false
): number => {
    const filteredDeposits = showInactive
        ? deposits
        : deposits.filter((deposit) => deposit.active !== false);

    return accounts.reduce((total, account) => {
        const accountId = account.id;

        // 1. Base deposits for this account
        const baseDeposits = filteredDeposits
            .filter((deposit) => deposit.accountId === accountId)
            .reduce((sum, deposit) => sum + deposit.amount, 0);

        // 2. Adjustments for this account
        const adjustmentsTotal = adjustments
            .filter((adj) => adj.accountId === accountId)
            .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

        // 3. Add them together
        return total + baseDeposits + adjustmentsTotal;
    }, 0);
};

/**
 * Filters deposits that will mature within the specified number of days.
 */
export const getUpcomingMaturities = (
    deposits: Deposit[],
    days: number = 30,
    limit: number = 5
): Deposit[] => {
    const today = Date.now();
    const futureThreshold = today + days * 24 * 60 * 60 * 1000;

    return deposits
        .filter(
            (deposit) =>
                deposit.active !== false &&
                deposit.endDate > today &&
                deposit.endDate <= futureThreshold
        )
        .sort((a, b) => a.endDate - b.endDate)
        .slice(0, limit);
};

/**
 * Gets the next N upcoming maturities regardless of timeframe.
 * Returns deposits in ascending order (closest first).
 */
export const getNextMaturities = (
    deposits: Deposit[],
    limit: number = 5
): Deposit[] => {
    const today = Date.now();

    return deposits
        .filter(
            (deposit) =>
                deposit.active !== false &&
                deposit.endDate > today
        )
        .sort((a, b) => a.endDate - b.endDate)
        .slice(0, limit);
};

/**
 * Gets the next N upcoming maturities in descending order (farthest first).
 */
export const getNextMaturitiesDescending = (
    deposits: Deposit[],
    limit: number = 5
): Deposit[] => {
    const today = Date.now();

    return deposits
        .filter(
            (deposit) =>
                deposit.active !== false &&
                deposit.endDate > today
        )
        .sort((a, b) => b.endDate - a.endDate)
        .slice(0, limit);
};