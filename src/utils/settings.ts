export interface Settings {
  locations: string[];
  boughtFor: string[];
  goldRatePerGram: number;
  makingTaxPercent: number;
  resaleDiscountPercent: number;
  liabilities: number;
  showInactive: boolean;
  showDelete: boolean;
  EMW_interest: number;
  EMW_Date: string;
}

// Read-time compatibility values only. Never write these on subscription/error.
export const defaultSettings: Settings = {
  locations: [], boughtFor: [], goldRatePerGram: 15000,
  makingTaxPercent: 14, resaleDiscountPercent: 5, liabilities: 0,
  showInactive: false, showDelete: false, EMW_interest: 0, EMW_Date: "2039-10",
};

export function validateSettings(updates: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(updates)) {
    if (!Object.hasOwn(defaultSettings, key)) throw new Error(`Unknown setting: ${key}`);
    if (key === "locations" || key === "boughtFor") {
      if (!Array.isArray(value) || !value.every(v => typeof v === "string" && v.trim().length > 0)) {
        throw new Error(`${key} must contain non-empty text values.`);
      }
    } else if (key === "EMW_Date") {
      if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
        throw new Error("Target date must use YYYY-MM format.");
      }
    } else if (key === "showInactive" || key === "showDelete") {
      if (typeof value !== "boolean") throw new Error(`${key} must be true or false.`);
    } else if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${key} must be a finite, non-negative number.`);
    }
  }
}

export function readSettings(data: Record<string, unknown>): Settings {
  const known = Object.fromEntries(Object.keys(defaultSettings)
    .filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
  validateSettings(known);
  return { ...defaultSettings, ...known } as Settings;
}

export function renameSettingItem(values: string[], oldValue: string, newValue: string): string[] {
  if (!values.includes(oldValue)) throw new Error("This item has changed. Reload settings and try again.");
  return [...new Set(values.map(value => value === oldValue ? newValue : value))];
}
