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
