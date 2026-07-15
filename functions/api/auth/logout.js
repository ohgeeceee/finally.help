// POST /api/auth/logout  — deletes the current session and clears the cookie.

import { json, readCookies, clearSessionCookie } from "../../../lib/http.js";
import { sha256Hex } from "../../../lib/crypto.js";

export async function onRequestPost({ request, env }) {
  const sid = readCookies(request).sid;
  if (sid) {
    const tokenHash = await sha256Hex(sid);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
  }
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
