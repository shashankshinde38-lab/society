/**
 * Standardized Date Formatting Utility for Parijat Society ERP
 * Mandatory format across the entire admin panel: DD-MM-YYYY (e.g. 03-11-2026)
 */

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";

  try {
    if (typeof date === "string") {
      // Direct regex match for YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss to avoid timezone shifting
      const isoDateOnly = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoDateOnly) {
        const [, y, m, d] = isoDateOnly;
        return `${d}-${m}-${y}`;
      }
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  } catch {
    return "—";
  }
}

/**
 * Formats a Date object or string for HTML <input type="date"> (YYYY-MM-DD)
 */
export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Returns true if a given year is a leap year (Feb has 29 days)
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the exact number of days in any month of a specific year,
 * correctly handling February with 29 days in leap years and 28 in non-leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Generates a valid due date string (YYYY-MM-DD), clamping the day to the
 * valid number of days in that month (e.g. Feb 28 on normal years, Feb 29 on leap years).
 */
export function getValidDueDate(year: number, month: number, preferredDay: number = 10): string {
  const maxDay = getDaysInMonth(year, month);
  const clampedDay = Math.min(Math.max(1, preferredDay), maxDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

/**
 * Validates whether a date string (YYYY-MM-DD) is mathematically and calendar-wise valid,
 * strictly verifying leap year rules (e.g. rejecting Feb 29 on non-leap years).
 */
export function validateDateInput(dateStr: string): { isValid: boolean; message?: string } {
  if (!dateStr) return { isValid: false, message: "Date is required" };
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { isValid: false, message: "Invalid date format. Expected YYYY-MM-DD" };
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (m < 1 || m > 12) return { isValid: false, message: `Invalid month: ${m}` };
  const maxDays = getDaysInMonth(y, m);
  if (d < 1 || d > maxDays) {
    if (m === 2) {
      return {
        isValid: false,
        message: isLeapYear(y)
          ? `February ${y} has only 29 days (Leap Year)`
          : `February ${y} has only 28 days (${y} is not a Leap Year)`,
      };
    }
    return { isValid: false, message: `Month ${m} in ${y} has only ${maxDays} days` };
  }
  return { isValid: true };
}
