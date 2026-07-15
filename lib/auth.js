// Session lookup + the "public" shape of a user (never leak password fields).

import { sha256Hex } from "./crypto.js";
import { readCookies } from "./http.js";

// Resolve the logged-in user from the session cookie, or null.
export async function currentUser(request, env) {
  const sid = readCookies(request).sid;
  if (!sid) return null;
  const tokenHash = await sha256Hex(sid);
  const row = await env.DB
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?1 AND s.expires_at > ?2`
    )
    .bind(tokenHash, Date.now())
    .first();
  return row || null;
}

// Convert a DB user row into the object we send to the browser.
export function publicUser(row) {
  if (!row) return null;
  let inventory = {};
  let readIds = [];
  try { inventory = JSON.parse(row.inventory || "{}"); } catch { inventory = {}; }
  try { readIds = JSON.parse(row.read_ids || "[]"); } catch { readIds = []; }
  return {
    username: row.username,
    display: row.display,
    xp: row.xp,
    bulbs: row.bulbs,
    avatar: row.avatar,
    inventory,
    readIds,
    streak: { count: row.streak_count, last: row.streak_last },
  };
}
