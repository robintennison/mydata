import type { CSSProperties } from "react";
import { colors, spacing } from "../theme";

export const chartStyles: { [key: string]: CSSProperties } = {
  section: {
    backgroundColor: colors.light,
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "25px",
  },
  container: {
    height: "200px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: "20px",
  },
  bars: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: "30px",
    height: "100%",
  },
  barContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  },
  barLabel: {
    fontSize: "0.8rem",
    color: colors.gray,
    marginBottom: "5px",
  },
  barWrapper: {
    height: "calc(100% - 40px)",
    width: "30px",
    display: "flex",
    alignItems: "flex-end",
  },
  bar: {
    width: "100%",
    transition: "height 0.3s ease",
    borderRadius: "4px 4px 0 0",
  },
  barValue: {
    fontSize: "0.75rem",
    color: colors.gray,
    marginTop: "5px",
  },
};