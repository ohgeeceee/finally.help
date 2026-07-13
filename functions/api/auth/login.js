// POST /api/auth/login  { username, password }
// Verifies the password, opens a session, returns the public user object.

import { json, bad, readJson, sessionCookie, SESSION_TTL_MS } from "../../../lib/http.js";
import { verifyPassword, randomToken, sha256Hex } from "../../../lib/crypto.js";
import { publicUser } from "../../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return bad("Invalid JSON");

  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) return bad("Enter a username and password.");

  const row = await env.DB.prepare("SELECT * FROM users WHERE username = ?1").bind(username).first();
  // Always run the hash to avoid leaking whether the username exists via timing.
  const ok = row
    ? await verifyPassword(password, row.pass_salt, row.pass_hash)
    : await verifyPassword(password, "00000000000000000000000000000000", "x");
  if (!row || !ok) return bad("Wrong username or password.", 401);

  const now = Date.now();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  await env.DB
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(tokenHash, row.id, now + SESSION_TTL_MS, now)
    .run();

  return json({ user: publicUser(row) }, 200, { "set-cookie": sessionCookie(token) });
}
