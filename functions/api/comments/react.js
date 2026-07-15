// POST /api/comments/react  { id, emoji }
// Toggles the current user's reaction on a comment.

import { json, bad, readJson } from "../../../lib/http.js";
import { currentUser } from "../../../lib/auth.js";

const ALLOWED = ["👍", "💡", "🤯"];

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const id = String(body?.id || "").trim();
  const emoji = String(body?.emoji || "");
  if (!id || !ALLOWED.includes(emoji)) return bad("Bad reaction.");

  const c = await env.DB.prepare("SELECT reacts FROM comments WHERE id = ?1").bind(id).first();
  if (!c) return bad("No such comment.", 404);

  let reacts = {};
  try { reacts = JSON.parse(c.reacts || "{}"); } catch { reacts = {}; }
  const list = reacts[emoji] || [];
  const i = list.indexOf(row.username);
  if (i >= 0) list.splice(i, 1); else list.push(row.username);
  reacts[emoji] = list;

  await env.DB.prepare("UPDATE comments SET reacts = ?1 WHERE id = ?2").bind(JSON.stringify(reacts), id).run();
  return json({ reacts });
}
