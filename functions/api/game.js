// GET  /api/game?type=nutshell|analogy  -> a question + sealed token
// POST /api/game  { token, choice }      -> validate answer, award reward
//
// The correct answer is sealed (AES-GCM) inside the token, so the browser
// can't read or forge it. Rewards are granted only on a verified correct answer.

import { json, bad, readJson } from "../../lib/http.js";
import { currentUser, publicUser } from "../../lib/auth.js";
import { grant } from "../../lib/economy.js";
import { REWARDS } from "../../lib/catalog.js";
import { LIBRARY } from "../../lib/library.js";
import { seal, unseal } from "../../lib/crypto.js";

function secretOf(env) { return env.GAME_SECRET || "finally-help-insecure-dev-secret"; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickN(arr, n, exclude) { const pool = arr.filter((x) => x !== exclude); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }

export async function onRequestGet({ request, env }) {
  const type = new URL(request.url).searchParams.get("type") === "analogy" ? "analogy" : "nutshell";
  const item = LIBRARY[Math.floor(Math.random() * LIBRARY.length)];
  const others = pickN(LIBRARY, 3, item);
  const pool = shuffle([item, ...others]);

  let prompt, options;
  if (type === "nutshell") {
    const nut = item.body.split(/\n/).map((l) => l.trim()).find((l) => l.startsWith(">")).replace(/^>\s?/, "");
    prompt = nut;
    options = pool.map((o) => ({ id: o.id, label: o.title }));
  } else {
    prompt = item.title.replace(/^(How |What |What's )/i, "");
    options = pool.map((o) => ({ id: o.id, label: o.analogy }));
  }

  const token = await seal(secretOf(env), { a: item.id, t: type, exp: Date.now() + 120000 });
  return json({ type, prompt, options, token });
}

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const payload = await unseal(secretOf(env), body?.token);
  if (!payload || !payload.a) return bad("Invalid question token.");
  if (Date.now() > payload.exp) return bad("Question expired — grab a new one.", 410);

  const correct = String(body?.choice || "") === payload.a;
  let user = publicUser(row);
  if (correct) {
    const updated = await grant(env, row, REWARDS.GAME.xp, REWARDS.GAME.bulbs);
    user = publicUser(updated);
  }
  return json({ correct, correctId: payload.a, user });
}
