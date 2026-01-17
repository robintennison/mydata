import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import { bankingStyles } from "./modules/Banking/styles/BankingStyles";
import {
  myDataHomepageStyles,
  getSectionStyle,
  getSectionHeaderStyle,
  injectMyDataHomepageStyles,
} from "./styles/MyDataHomepageStyles";

const MyDataHomepage: React.FC = () => {
  // Inject global styles
  React.useEffect(() => {
    injectMyDataHomepageStyles();
  }, []);

  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();

  const [upcomingMaturities, setUpcomingMaturities] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);

  // Calculate total balance (savings + adjusted deposits) AND total deposits
  useEffect(() => {
    if (accounts.length > 0 && deposits.length > 0) {
      // Calculate total savings from all accounts
      const totalSavings = accounts.reduce(
        (sum, account) => sum + account.savingsAmount,
        0
      );

      // Apply same filtering as BankingHomePage
      const filteredDeposits = settings?.showInactive
        ? deposits
        : deposits.filter((deposit) => deposit.active !== false);

      // Calculate total deposits (matching BankingHomePage logic)
      const calculatedTotalDeposits = accounts.reduce((total, account) => {
        const accountId = account.id;

        // 1. Base deposits for this account
        const baseDeposits = filteredDeposits
          .filter((deposit) => deposit.accountId === accountId)
          .reduce((sum, deposit) => sum + deposit.amount, 0);

        // 2. Adjustments for this account
        const adjustmentsTotal = adjustments
          .filter((adj) => adj.accountId === accountId)
          .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

        // 3. Add them together (Android/BankingHomePage logic)
        return total + baseDeposits + adjustmentsTotal;
      }, 0);

      setTotalDeposits(calculatedTotalDeposits);

      // Total balance = savings + adjusted deposits
      const calculatedTotalBalance = totalSavings + calculatedTotalDeposits;
      setTotalBalance(calculatedTotalBalance);

      // Calculate upcoming maturities (next 30 days)
      const today = Date.now();
      const thirtyDaysFromNow = today + 30 * 24 * 60 * 60 * 1000;

      const upcoming = deposits
        .filter(
          (deposit) =>
            deposit.endDate > today && deposit.endDate <= thirtyDaysFromNow
        )
        .sort((a, b) => a.endDate - b.endDate)
        .slice(0, 5);

      setUpcomingMaturities(upcoming);
    }
  }, [accounts, deposits, adjustments, settings?.showInactive]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2) + " L";
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.acctCode : "Unknown";
  };

  // Calculate active deposits count
  const activeDepositsCount = deposits.filter((d) => d.active !== false).length;

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading MyData...</p>
        </div>
      </div>
    );
  }

  const hasMaturities = upcomingMaturities.length > 0;

  return (
    <div style={myDataHomepageStyles.container}>
      {/* Header with Settings Button */}
      <div style={myDataHomepageStyles.header}>
        <div style={myDataHomepageStyles.headerTopRow}>
          <div style={myDataHomepageStyles.headerLeft}>
            <h1 style={myDataHomepageStyles.title}>MyData Dashboard</h1>
            <p style={myDataHomepageStyles.subtitle}>
              Personal Finance & Assets Overview
            </p>
          </div>
          <button
            style={myDataHomepageStyles.settingsButton}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            ⚙️
            {settings?.showDelete && (
              <span style={myDataHomepageStyles.editBadge}>✏️</span>
            )}
          </button>
        </div>
      </div>

      {/* Compact Top Stats Cards */}
      <div style={myDataHomepageStyles.statsRow}>
        {/* Card 1: Total Balance */}
        <div
          style={myDataHomepageStyles.statCard}
          onClick={() => navigate("/banking")}
        >
          <div style={myDataHomepageStyles.cardTitle}>Total Balance</div>
          <div style={myDataHomepageStyles.cardValue}>
            {formatLakhs(totalBalance)}
          </div>
          <div style={myDataHomepageStyles.cardSubtitle}>
            {formatCurrency(totalBalance)}
          </div>
        </div>

        {/* Card 2: Total Deposits */}
        <div
          style={myDataHomepageStyles.statCard}
          onClick={() => navigate("/banking")}
        >
          <div style={myDataHomepageStyles.cardTitle}>Total Deposits</div>
          <div style={myDataHomepageStyles.cardValue}>
            {formatLakhs(totalDeposits)}
          </div>
          <div style={myDataHomepageStyles.cardSubtitle}>
            {formatCurrency(totalDeposits)}
          </div>
        </div>

        {/* Card 3: Total Accounts */}
        <div
          style={myDataHomepageStyles.statCard}
          onClick={() => navigate("/banking/accounts")}
        >
          <div style={myDataHomepageStyles.cardTitle}>Accounts</div>
          <div style={myDataHomepageStyles.cardValue}>{accounts.length}</div>
          <div style={myDataHomepageStyles.cardSubtitle}>
            {activeDepositsCount} deposits
          </div>
        </div>
      </div>

      {/* Upcoming Maturities Section - Compact */}
      <div style={getSectionStyle(hasMaturities)}>
        <div style={getSectionHeaderStyle(hasMaturities)}>
          <div style={myDataHomepageStyles.sectionTitle}>
            Upcoming Maturities
          </div>
          {hasMaturities && (
            <button
              style={myDataHomepageStyles.viewAllButton}
              onClick={() => navigate("/banking/deposits")}
            >
              View All
            </button>
          )}
        </div>

        {!hasMaturities ? (
          <div style={myDataHomepageStyles.emptyState}>
            <div style={myDataHomepageStyles.emptyText}>
              No upcoming maturities
            </div>
            <div style={myDataHomepageStyles.emptySubtext}>
              Next 30 days are clear
            </div>
          </div>
        ) : (
          <div style={myDataHomepageStyles.maturitiesList}>
            {upcomingMaturities.map((deposit) => (
              <div
                key={deposit.id}
                style={myDataHomepageStyles.maturityCard}
                onClick={() => navigate(`/banking/deposits/edit/${deposit.id}`)}
              >
                <div style={myDataHomepageStyles.maturityLeft}>
                  <div style={myDataHomepageStyles.maturityDate}>
                    {formatDate(deposit.endDate)}
                  </div>
                  <div style={myDataHomepageStyles.maturityAccount}>
                    {getAccountName(deposit.accountId)}
                  </div>
                </div>
                <div style={myDataHomepageStyles.maturityRight}>
                  <div style={myDataHomepageStyles.maturityAmount}>
                    {formatCurrency(deposit.amount)}
                  </div>
                  <div
                    style={
                      {
                        ...myDataHomepageStyles.maturityStatus,
                        color: deposit.active ? "#34a853" : "#ea4335",
                      } as React.CSSProperties
                    }
                  >
                    {deposit.active ? "●" : "●"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder Section for Future Features - Compact */}
      <div style={getSectionStyle(true)}>
        <div style={getSectionHeaderStyle(true)}>
          <div style={myDataHomepageStyles.sectionTitle}>Coming Soon</div>
        </div>
        <div style={myDataHomepageStyles.placeholderCard}>
          <div style={myDataHomepageStyles.placeholderTitle}>
            Advanced Analytics
          </div>
          <div style={myDataHomepageStyles.placeholderText}>
            Investment insights, growth projections, and performance reports
            coming soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDataHomepage;
