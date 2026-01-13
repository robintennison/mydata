import type { CSSProperties } from "react";
import { colors, spacing, borderRadius, shadows } from "../theme";

export const cardStyles: { [key: string]: CSSProperties } = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.sm,
    transition: "all 0.3s",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: shadows.md,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  cardTitle: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: "1.1rem",
    fontWeight: 600,
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.md,
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.sm} 0`,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  statItemLast: {
    borderBottom: "none",
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  statValuePositive: {
    color: colors.success,
  },
  statValueNegative: {
    color: colors.danger,
  },
  statValueLarge: {
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  adjustmentForm: {
    backgroundColor: colors.lighter,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    border: `1px solid ${colors.border}`,
  },
  adjustmentsList: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.borderLight}`,
  },
  adjustmentsTitle: {
    margin: `0 0 ${spacing.sm} 0`,
    color: colors.textSecondary,
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  adjustmentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${spacing.xs} 0`,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  adjustmentItemLast: {
    borderBottom: "none",
  },
  adjustmentAmount: {
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  adjustmentDetails: {
    fontSize: "0.8rem",
    color: colors.textTertiary,
    textAlign: "right",
    maxWidth: "200px",
  },
  settingsCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.sm,
  },
  infoBox: {
    backgroundColor: `${colors.info}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    borderLeft: `4px solid ${colors.info}`,
  },
  infoTitle: {
    color: colors.textPrimary,
    margin: `0 0 ${spacing.sm} 0`,
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: "0.9rem",
    lineHeight: 1.5,
    margin: 0,
  },
};