import type { CSSProperties } from "react";
import { colors, spacing } from "../theme";


export const tableStyles: { [key: string]: CSSProperties } = {
  container: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    backgroundColor: colors.light,
    padding: spacing.md,
    textAlign: "left",
    borderBottom: `2px solid #dee2e6`,
    color: colors.dark,
    fontWeight: "bold",
  },
  tr: {
    borderBottom: `1px solid #dee2e6`,
  },
  td: {
    padding: spacing.md,
    verticalAlign: "middle",
  },
};