/**
 * VR Street Karama - Asia/Kolkata Timezone Utilities
 * Standardizes business dates and display formatting strictly in Asia/Kolkata (IST).
 */

export const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Get current business date in YYYY-MM-DD string in Asia/Kolkata timezone
 */
export function getBusinessDateKolkata(dateInput: Date | string = new Date()): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  
  // Format to Asia/Kolkata YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  return formatter.format(date); // outputs "YYYY-MM-DD"
}

/**
 * Format timestamp into standard readable 12-hour IST time: "08:42 PM"
 */
export function formatTimeIST(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "--:--";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format timestamp into standard readable 12-hour IST time with seconds: "08:42:15 PM"
 */
export function formatTimeWithSecondsIST(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "--:--:--";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format date into standard readable Indian format: "15 Nov 2026"
 */
export function formatDateIST(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "--";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format full datetime: "15 Nov 2026, 08:42 PM"
 */
export function formatDateTimeIST(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "--";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

