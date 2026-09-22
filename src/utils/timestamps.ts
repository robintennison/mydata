/** Accept legacy dates and Firestore timestamps; invalid input never becomes NaN. */
export function parseTimestamp(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  let milliseconds: number;
  try {
    if (typeof value === "number") milliseconds = value;
    else if (typeof value === "string") milliseconds = Date.parse(value);
    else if (value instanceof Date) milliseconds = value.getTime();
    else if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
      const date: unknown = value.toDate();
      if (!(date instanceof Date)) return null;
      milliseconds = date.getTime();
    } else return null;
    return Number.isFinite(milliseconds) && !Number.isNaN(new Date(milliseconds).getTime()) ? milliseconds : null;
  } catch {
    return null;
  }
}
