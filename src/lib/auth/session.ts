/**
 * Secure Server-Side Session Engine for Parijat Society ERP
 * 
 * Cryptographically signed sessions using HMAC-SHA256 via the Web Crypto API
 * (Compatible with Next.js Middleware, Edge Runtime, Node.js, and Vercel Serverless).
 * 
 * Policies:
 * - Idle Inactivity Timeout: 30 minutes
 * - Absolute Session Lifetime: 8 hours maximum
 * - HttpOnly, Secure, SameSite=Lax Cookie
 */

export interface SessionPayload {
  userId: string;
  email: string;
  roleName: string;
  roleId?: string;
  createdAt: number;    // Timestamp when session was first issued (ms)
  lastActivity: number; // Timestamp of last authenticated user interaction (ms)
}

export type SessionVerifyResult =
  | { valid: true; session: SessionPayload }
  | { valid: false; reason: "NO_TOKEN" | "INVALID_FORMAT" | "INVALID_SIGNATURE" | "INVALID_PAYLOAD" | "EXPIRED_IDLE" | "EXPIRED_ABSOLUTE"; session?: SessionPayload };

export const AUTH_COOKIE_NAME = "society_auth_session";
export const LEGACY_COOKIE_NAME = "society_admin_session";

// Session Expiration Constants
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;       // 30 minutes of inactivity
export const SESSION_ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours absolute lifetime

const SECRET_KEY_STR =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  "parijat_society_secure_hmac_secret_key_2026_super_protected_auth_98220";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY_STR),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates and cryptographically signs a session token
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const key = await getHmacKey();
  const jsonStr = JSON.stringify(payload);
  const payloadBytes = encoder.encode(jsonStr);
  const b64Payload = base64UrlEncode(payloadBytes);

  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(b64Payload)
  );
  const b64Signature = base64UrlEncode(new Uint8Array(sigBytes));

  return `${b64Payload}.${b64Signature}`;
}

/**
 * Validates cryptographic signature and enforces idle + absolute timeouts
 */
export async function verifySessionToken(token?: string | null): Promise<SessionVerifyResult> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "NO_TOKEN" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const [b64Payload, b64Signature] = parts;

  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(b64Signature);
  } catch {
    return { valid: false, reason: "INVALID_SIGNATURE" };
  }

  const key = await getHmacKey();
  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as unknown as BufferSource,
    encoder.encode(b64Payload)
  );

  if (!isValidSignature) {
    return { valid: false, reason: "INVALID_SIGNATURE" };
  }

  let payload: SessionPayload;
  try {
    const payloadBytes = base64UrlDecode(b64Payload);
    payload = JSON.parse(decoder.decode(payloadBytes));
  } catch {
    return { valid: false, reason: "INVALID_PAYLOAD" };
  }

  const now = Date.now();

  // 1. Enforce Absolute Session Expiration (8 hours maximum)
  if (now - payload.createdAt > SESSION_ABSOLUTE_LIFETIME_MS) {
    return { valid: false, reason: "EXPIRED_ABSOLUTE", session: payload };
  }

  // 2. Enforce Idle Timeout (30 minutes of inactivity)
  if (now - payload.lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    return { valid: false, reason: "EXPIRED_IDLE", session: payload };
  }

  return { valid: true, session: payload };
}
