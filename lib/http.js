// Small HTTP helpers shared by all API functions.

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

export function bad(message, status = 400, extraHeaders = {}) {
  return json({ error: message }, status, extraHeaders);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Parse the Cookie header into a plain object.
export function readCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function sessionCookie(token, maxAge = SESSION_MAX_AGE) {
  return `sid=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export const SESSION_TTL_MS = SESSION_MAX_AGE * 1000;
