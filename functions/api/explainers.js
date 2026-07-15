// GET  /api/explainers        -> list the current user's saved explainers
// POST /api/explainers  { title, teaser, body }  -> save one, award CREATE reward

import { json, bad, readJson } from "../../lib/http.js";
import { currentUser, publicUser } from "../../lib/auth.js";
import { grant } from "../../lib/economy.js";
import { REWARDS } from "../../lib/catalog.js";
import { uuid } from "../../lib/crypto.js";

export async function onRequestGet({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const { results } = await env.DB
    .prepare("SELECT id, title, teaser, body, created_at FROM explainers WHERE user_id = ?1 ORDER BY created_at DESC")
    .bind(row.id).all();
  return json({ explainers: results || [] });
}

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const title = String(body?.title || "").trim().slice(0, 120);
  const teaser = String(body?.teaser || "").trim().slice(0, 200);
  const text = String(body?.body || "").trim();
  if (!title || !text) return bad("Title and body are required.");
  if (text.length > 4000) return bad("Explanation is too long.");

  const id = uuid();
  const now = Date.now();
  await env.DB
    .prepare("INSERT INTO explainers (id, user_id, title, teaser, body, created_at) VALUES (?1,?2,?3,?4,?5,?6)")
    .bind(id, row.id, title, teaser, text, now).run();

  const updated = await grant(env, row, REWARDS.CREATE.xp, REWARDS.CREATE.bulbs);
  return json({ explainer: { id, title, teaser, body: text, created_at: now }, user: publicUser(updated) });
}
