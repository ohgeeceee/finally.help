// POST /api/state/claim-read  { id }
// Awards the one-time "I get it" reward for an explainer.

import { json, bad, readJson } from "../../../lib/http.js";
import { currentUser, publicUser } from "../../../lib/auth.js";
import { claimRead } from "../../../lib/economy.js";
import { REWARDS } from "../../../lib/catalog.js";

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const id = String(body?.id || "").trim();
  if (!id) return bad("Missing explainer id.");

  const { row: updated, awarded } = await claimRead(env, row, id, REWARDS.READ);
  return json({ user: publicUser(updated), awarded });
}
