/**
 * VR Street Karama - Indian Rupee (INR) Formatting & Precision Utilities
 * Adheres strictly to Indian numbering system (Lakhs & Crores):
 * e.g., ₹1,25,000.00
 */

export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";

/**
 * Format a number or numeric string to Indian Rupee format (e.g. ₹1,25,000.00)
 */
export function formatINR(
  amount: number | string | null | undefined,
  showDecimals: boolean = true
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showDecimals ? "₹0.00" : "₹0";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  // Format using standard Indian numbering system
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);

  return formatted;
}

/**
 * Format raw number with Indian grouping without currency symbol
 */
export function formatIndianNumber(
  amount: number | string | null | undefined,
  showDecimals: boolean = true
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showDecimals ? "0.00" : "0";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Decimal-safe addition (converts to integer paise to avoid float errors)
 */
export function safeAdd(a: number, b: number): number {
  const paiseA = Math.round((a || 0) * 100);
  const paiseB = Math.round((b || 0) * 100);
  return (paiseA + paiseB) / 100;
}

/**
 * Decimal-safe summation of array of numbers
 */
export function safeSum(numbers: (number | null | undefined)[]): number {
  const totalPaise = numbers.reduce<number>((acc, curr) => {
    return acc + Math.round((curr || 0) * 100);
  }, 0);
  return totalPaise / 100;
}

/**
 * Validate that an amount string is a positive monetary value with at most 2 decimal places
 */
export function isValidMonetaryAmount(value: string | number): boolean {
  if (value === "" || value === null || value === undefined) return false;
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  if (isNaN(num) || num <= 0) return false;

  // Regex check for max 2 decimal places
  const str = value.toString().trim();
  const regex = /^\d+(\.\d{1,2})?$/;
  return regex.test(str) && num > 0;
}

