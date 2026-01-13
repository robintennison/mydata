import type { CSSProperties } from "react";
import { colors, spacing, borderRadius } from "../theme";

export const cardStyles: { [key: string]: CSSProperties } = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: colors.light,
    padding: "20px",
    borderRadius: borderRadius.md,
    border: `1px solid #dee2e6`,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: colors.gray,
    fontSize: "0.9rem",
  },
  statValue: {
    fontWeight: "bold",
    color: colors.dark,
  },
  adjustmentForm: {
    backgroundColor: colors.white,
    padding: "15px",
    borderRadius: borderRadius.sm,
    marginBottom: "15px",
    border: `1px solid #dee2e6`,
  },
  adjustmentsList: {
    marginTop: "15px",
  },
  adjustmentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  settingsCard: {
    backgroundColor: colors.light,
    padding: "25px",
    borderRadius: borderRadius.md,
    border: `1px solid #dee2e6`,
  },
  infoBox: {
    backgroundColor: "#e7f3ff",
    padding: "15px",
    borderRadius: borderRadius.sm,
    marginTop: "20px",
    borderLeft: "4px solid #007bff",
  },
};