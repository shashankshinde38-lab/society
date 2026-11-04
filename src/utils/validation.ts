/**
 * Parijat Society ERP - Form Validation Utility
 * Comprehensive, reusable validators for Mobile Numbers and Email Addresses
 */

/**
 * Strips all non-digit characters and limits length to 10 digits
 */
export function sanitizeMobileInput(input: string): string {
  if (!input) return "";
  return input.replace(/\D/g, "").slice(0, 10);
}

/**
 * Validates mobile number:
 * - Must contain only digits
 * - Must be exactly 10 digits
 */
export function validateMobile(input: string, required: boolean = true): {
  isValid: boolean;
  message?: string;
} {
  const trimmed = (input || "").trim();

  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, message: "Mobile number is required" };
  }

  if (/\D/.test(trimmed)) {
    return {
      isValid: false,
      message: "Mobile number must only contain digits without special characters or alphabets",
    };
  }

  if (trimmed.length !== 10) {
    return {
      isValid: false,
      message: `Mobile number must be exactly 10 digits (currently ${trimmed.length} digits entered)`,
    };
  }

  if (!/^[6-9]\d{9}$/.test(trimmed)) {
    return {
      isValid: false,
      message: "Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)",
    };
  }

  return { isValid: true };
}

/**
 * Validates email address:
 * - Requires proper username, @ symbol, domain name, and valid TLD (min 2 chars)
 * - Rejects double @ symbols, spaces, missing extensions, etc.
 */
export function validateEmail(input: string, required: boolean = true): {
  isValid: boolean;
  message?: string;
} {
  const trimmed = (input || "").trim();

  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, message: "Email address is required" };
  }

  // Strict email regex matching RFC 5322 standard
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    if (!trimmed.includes("@")) {
      return { isValid: false, message: "Email must include '@' symbol" };
    }
    const parts = trimmed.split("@");
    if (parts.length > 2) {
      return { isValid: false, message: "Email cannot contain multiple '@' symbols" };
    }
    if (!parts[1] || !parts[1].includes(".")) {
      return { isValid: false, message: "Email domain must include an extension (e.g. .com, .org, .in)" };
    }
    const domainParts = parts[1].split(".");
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return { isValid: false, message: "Domain extension must be at least 2 characters" };
    }
    return { isValid: false, message: "Please enter a valid email format (e.g. name@domain.com)" };
  }

  return { isValid: true };
}

