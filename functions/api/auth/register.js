// POST /api/auth/register  { username, password, avatar? }
// Creates a user, opens a session, returns the public user object.

import { json, bad, readJson, sessionCookie, SESSION_TTL_MS } from "../../../lib/http.js";
import { hashPassword, randomToken, sha256Hex, uuid } from "../../../lib/crypto.js";
import { publicUser } from "../../../lib/auth.js";

const DEFAULT_INVENTORY = {
  boosts: { double: 0, freeze: 0, hint: 0 },
  avatars: [], themes: ["paper"], theme: "paper", flairGold: false, pet: false,
};

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return bad("Invalid JSON");

  const display = String(body.username || "").trim();
  const password = String(body.password || "");
  const avatar = String(body.avatar || "🙂").slice(0, 8);
  const username = display.toLowerCase();

  if (username.length < 2 || username.length > 24) return bad("Username must be 2–24 characters.");
  if (!/^[a-z0-9_.-]+$/.test(username)) return bad("Username can use letters, numbers, and . _ - only.");
  if (password.length < 6) return bad("Password must be at least 6 characters.");

  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?1").bind(username).first();
  if (existing) return bad("That username is taken.", 409);

  const { saltHex, hashHex } = await hashPassword(password);
  const id = uuid();
  const now = Date.now();
  const inventory = { ...DEFAULT_INVENTORY, avatars: [avatar], avatar };

  await env.DB
    .prepare(
      `INSERT INTO users (id, username, display, pass_salt, pass_hash, xp, bulbs, avatar, inventory, read_ids, streak_count, streak_last, comment_day, comment_n, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 0, 20, ?6, ?7, '[]', 0, NULL, NULL, 0, ?8)`
    )
    .bind(id, username, display, saltHex, hashHex, avatar, JSON.stringify(inventory), now)
    .run();

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  await env.DB
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(tokenHash, id, now + SESSION_TTL_MS, now)
    .run();

  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?1").bind(id).first();
  return json({ user: publicUser(row) }, 200, { "set-cookie": sessionCookie(token) });
}
