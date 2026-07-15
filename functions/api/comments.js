// GET  /api/comments?subject=ID   -> list comments for a subject (public)
// POST /api/comments  { subject, text }  -> add a comment (auth), award reward

import { json, bad, readJson } from "../../lib/http.js";
import { currentUser, publicUser } from "../../lib/auth.js";
import { commentReward } from "../../lib/economy.js";
import { REWARDS, COMMENT_DAILY_CAP } from "../../lib/catalog.js";
import { uuid } from "../../lib/crypto.js";

function shape(r) {
  let reacts = {};
  try { reacts = JSON.parse(r.reacts || "{}"); } catch { reacts = {}; }
  return { id: r.id, user: r.display, avatar: r.avatar, flair: r.flair, text: r.text, ts: r.created_at, reacts };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const subject = String(url.searchParams.get("subject") || "").trim();
  if (!subject) return bad("Missing subject.");
  const { results } = await env.DB
    .prepare("SELECT * FROM comments WHERE subject = ?1 ORDER BY created_at ASC")
    .bind(subject).all();
  return json({ comments: (results || []).map(shape) });
}

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const subject = String(body?.subject || "").trim();
  const text = String(body?.text || "").trim().slice(0, 240);
  if (!subject || !text) return bad("Missing subject or text.");

  const inv = (() => { try { return JSON.parse(row.inventory || "{}"); } catch { return {}; } })();
  const flair = inv.flairGold ? "gold" : "";
  const id = uuid();
  const now = Date.now();
  await env.DB
    .prepare("INSERT INTO comments (id, subject, user_id, display, avatar, flair, text, reacts, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,'{}',?8)")
    .bind(id, subject, row.id, row.display, row.avatar, flair, text, now).run();

  const updated = await commentReward(env, row, REWARDS.COMMENT, COMMENT_DAILY_CAP);
  const comment = { id, user: row.display, avatar: row.avatar, flair, text, ts: now, reacts: {} };
  return json({ comment, user: publicUser(updated) });
}
