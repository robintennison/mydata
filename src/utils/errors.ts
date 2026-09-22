export interface AppError extends Error {
  code?: string;
}

/** Normalize caught values without losing Firebase error codes. */
export function toError(value: unknown): AppError {
  if (value instanceof Error) return value;
  const details = value !== null && typeof value === "object" ? value : {};
  const message = "message" in details && typeof details.message === "string"
    ? details.message : typeof value === "string" ? value : "An unexpected error occurred";
  const error: AppError = new Error(message);
  if ("code" in details && typeof details.code === "string") error.code = details.code;
  return error;
}
