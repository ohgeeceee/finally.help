// GET /api/auth/me — returns the current user (or { user: null }).
// Also runs the daily-streak check so a returning user's streak stays current.

import { json } from "../../../lib/http.js";
import { currentUser, publicUser } from "../../../lib/auth.js";
import { applyDailyStreak } from "../../../lib/economy.js";

export async function onRequestGet({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return json({ user: null });
  const updated = await applyDailyStreak(env, row);
  return json({ user: publicUser(updated) });
}
