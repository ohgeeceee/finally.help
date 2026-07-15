// Runtime-agnostic crypto helpers.
// Works on Cloudflare Workers (Pages Functions) and Node 18+ — both expose
// a global `crypto` with SubtleCrypto. No external dependencies.

const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 100000;

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// Constant-time-ish comparison of two hex strings.
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Hash a password with PBKDF2-SHA256. Pass an existing saltHex to verify,
// or omit it to generate a fresh salt on registration.
export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return { saltHex: bytesToHex(salt), hashHex: bytesToHex(new Uint8Array(bits)) };
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const { hashHex } = await hashPassword(password, saltHex);
  return safeEqual(hashHex, expectedHashHex);
}

// A random opaque token (for session cookies).
export function randomToken(nBytes = 32) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(nBytes)));
}

// SHA-256 hex of a string. We store the *hash* of the session token in the DB,
// so a database leak never reveals live session tokens.
export async function sha256Hex(str) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return bytesToHex(new Uint8Array(digest));
}

export function uuid() {
  return crypto.randomUUID();
}

// --- Sealed tokens (AES-GCM) --------------------------------------------
// Hand the browser an opaque token whose contents it cannot read or forge
// (e.g. the correct answer to a quiz question). Key = SHA-256(secret).

function b64urlEncode(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function aesKey(secret) {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function seal(secret, obj) {
  const key = await aesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
  return b64urlEncode(iv) + "." + b64urlEncode(new Uint8Array(ct));
}

export async function unseal(secret, token) {
  try {
    const [ivb, ctb] = String(token).split(".");
    if (!ivb || !ctb) return null;
    const key = await aesKey(secret);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64urlDecode(ivb) }, key, b64urlDecode(ctb));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}
