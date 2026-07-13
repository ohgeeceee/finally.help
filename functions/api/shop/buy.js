// POST /api/shop/buy    { id }          -> purchase an item
// POST /api/shop/buy    { id, equip:1 } -> equip an already-owned avatar/theme

import { json, bad, readJson } from "../../../lib/http.js";
import { currentUser, publicUser } from "../../../lib/auth.js";
import { buyItem, equipItem } from "../../../lib/economy.js";
import { shopItem, levelInfo } from "../../../lib/catalog.js";

export async function onRequestPost({ request, env }) {
  const row = await currentUser(request, env);
  if (!row) return bad("Not logged in.", 401);
  const body = await readJson(request);
  const item = shopItem(String(body?.id || ""));
  if (!item) return bad("No such item.");

  const result = body?.equip
    ? await equipItem(env, row, item)
    : await buyItem(env, row, item, levelInfo(row.xp).level);

  if (!result.ok) return bad(result.error, 400);
  return json({ user: publicUser(result.row) });
}
