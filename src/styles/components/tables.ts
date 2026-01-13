import type { CSSProperties } from "react";
import { colors, spacing, shadows } from "../theme";

export const tableStyles: { [key: string]: CSSProperties } = {
  container: {
    overflowX: "auto",
    borderRadius: "8px",
    boxShadow: shadows.sm,
    backgroundColor: colors.white,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "0.9rem",
  },
  th: {
    backgroundColor: colors.tableHeader,
    padding: `${spacing.md} ${spacing.lg}`,
    textAlign: "left",
    borderBottom: `2px solid ${colors.border}`,
    color: colors.textPrimary,
    fontWeight: 600,
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tr: {
    backgroundColor: colors.white,
    transition: "background-color 0.2s",
  },
  trEven: {
    backgroundColor: colors.tableRowEven,
  },
  trOdd: {
    backgroundColor: colors.tableRowOdd,
  },
  trHover: {
    backgroundColor: colors.lighter,
  },
  td: {
    padding: `${spacing.md} ${spacing.lg}`,
    verticalAlign: "middle",
    borderBottom: `1px solid ${colors.borderLight}`,
    color: colors.textPrimary,
  },
  tdSecondary: {
    color: colors.textSecondary,
    fontSize: "0.85rem",
  },
  tdActions: {
    textAlign: "right",
    whiteSpace: "nowrap",
  },
};