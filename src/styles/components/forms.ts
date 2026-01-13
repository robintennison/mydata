import type { CSSProperties } from "react";
import { colors, spacing, borderRadius } from "../theme";

export const formStyles: { [key: string]: CSSProperties } = {
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addButton: {
    backgroundColor: colors.success,
    color: colors.white,
    border: "none",
    padding: "10px 20px",
    borderRadius: borderRadius.md,
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
  },
  form: {
    backgroundColor: colors.light,
    padding: "20px",
    borderRadius: borderRadius.md,
    marginBottom: "25px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: borderRadius.sm,
    fontSize: "0.9rem",
    marginTop: "5px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: borderRadius.sm,
    fontSize: "0.9rem",
    marginTop: "5px",
    resize: "vertical",
  },
  formActions: {
    display: "flex",
    gap: "10px",
  },
  saveButton: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: "none",
    padding: "10px 20px",
    borderRadius: borderRadius.sm,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  cancelButton: {
    backgroundColor: colors.gray,
    color: colors.white,
    border: "none",
    padding: "10px 20px",
    borderRadius: borderRadius.sm,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  smallButton: {
    padding: "6px 12px",
    backgroundColor: colors.gray,
    color: colors.white,
    border: "none",
    borderRadius: borderRadius.sm,
    cursor: "pointer",
    fontSize: "0.8rem",
    marginRight: "5px",
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
};