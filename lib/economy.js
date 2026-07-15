// Server-authoritative economy mutations. Every function takes a DB user `row`,
// writes the change, and returns a row-shaped object so publicUser() can format it.

function today() { return new Date().toISOString().slice(0, 10); }
function yesterday() { return new Date(Date.now() - 86400000).toISOString().slice(0, 10); }

function parseInv(row) {
  try { return JSON.parse(row.inventory || "{}"); } catch { return {}; }
}
function parseReads(row) {
  try { return JSON.parse(row.read_ids || "[]"); } catch { return []; }
}

// Give XP + Bulbs. Returns the updated row.
export async function grant(env, row, xp, bulbs) {
  const newXp = row.xp + xp, newBulbs = row.bulbs + bulbs;
  await env.DB.prepare("UPDATE users SET xp = ?1, bulbs = ?2 WHERE id = ?3")
    .bind(newXp, newBulbs, row.id).run();
  return { ...row, xp: newXp, bulbs: newBulbs };
}

// Claim the "I get it" read reward for one explainer, once. Honors the Double
// Bulbs boost. Returns { row, awarded } — awarded is false if already read.
export async function claimRead(env, row, explainerId, reward) {
  const reads = parseReads(row);
  if (reads.includes(explainerId)) return { row, awarded: false };
  reads.push(explainerId);
  const inv = parseInv(row);
  let bulbs = reward.bulbs;
  if (inv.boosts && inv.boosts.double > 0) { bulbs *= 2; inv.boosts.double -= 1; }
  const newXp = row.xp + reward.xp, newBulbs = row.bulbs + bulbs;
  await env.DB.prepare("UPDATE users SET xp = ?1, bulbs = ?2, read_ids = ?3, inventory = ?4 WHERE id = ?5")
    .bind(newXp, newBulbs, JSON.stringify(reads), JSON.stringify(inv), row.id).run();
  return { row: { ...row, xp: newXp, bulbs: newBulbs, read_ids: JSON.stringify(reads), inventory: JSON.stringify(inv) }, awarded: true };
}

// Post-a-comment reward, capped per day. Returns updated row (may be unchanged if capped).
export async function commentReward(env, row, reward, cap) {
  const t = today();
  let day = row.comment_day, n = row.comment_n;
  if (day !== t) { day = t; n = 0; }
  if (n >= cap) {
    await env.DB.prepare("UPDATE users SET comment_day = ?1, comment_n = ?2 WHERE id = ?3").bind(day, n, row.id).run();
    return { ...row, comment_day: day, comment_n: n };
  }
  n += 1;
  const newXp = row.xp + reward.xp, newBulbs = row.bulbs + reward.bulbs;
  await env.DB.prepare("UPDATE users SET xp = ?1, bulbs = ?2, comment_day = ?3, comment_n = ?4 WHERE id = ?5")
    .bind(newXp, newBulbs, day, n, row.id).run();
  return { ...row, xp: newXp, bulbs: newBulbs, comment_day: day, comment_n: n };
}

// Attempt a shop purchase. Returns { ok, row, error }.
export async function buyItem(env, row, item, currentLevel) {
  const need = item.level || 1;
  if (currentLevel < need) return { ok: false, error: `Reach Level ${need} first.` };
  if (row.bulbs < item.price) return { ok: false, error: "Not enough Bulbs." };
  const inv = parseInv(row);
  inv.boosts = inv.boosts || { double: 0, freeze: 0, hint: 0 };
  inv.avatars = inv.avatars || [];
  inv.themes = inv.themes || ["paper"];

  if (item.type === "avatar") {
    if (!inv.avatars.includes(item.value)) inv.avatars.push(item.value);
    inv.avatar = item.value;
  } else if (item.type === "theme") {
    if (!inv.themes.includes(item.value)) inv.themes.push(item.value);
    inv.theme = item.value;
  } else if (item.type === "flair") {
    inv.flairGold = true;
  } else if (item.type === "pet") {
    inv.pet = true;
  } else if (item.type === "boost") {
    inv.boosts[item.value] = (inv.boosts[item.value] || 0) + (item.amount || 1);
  }

  const avatar = item.type === "avatar" ? item.value : row.avatar;
  const newBulbs = row.bulbs - item.price;
  await env.DB.prepare("UPDATE users SET bulbs = ?1, inventory = ?2, avatar = ?3 WHERE id = ?4")
    .bind(newBulbs, JSON.stringify(inv), avatar, row.id).run();
  return { ok: true, row: { ...row, bulbs: newBulbs, inventory: JSON.stringify(inv), avatar } };
}

// Equip an already-owned avatar or theme. Returns { ok, row, error }.
export async function equipItem(env, row, item) {
  const inv = parseInv(row);
  if (item.type === "avatar") {
    if (!(inv.avatars || []).includes(item.value)) return { ok: false, error: "Not owned." };
    inv.avatar = item.value;
  } else if (item.type === "theme") {
    if (!(inv.themes || []).includes(item.value)) return { ok: false, error: "Not owned." };
    inv.theme = item.value;
  } else {
    return { ok: false, error: "Not equippable." };
  }
  const avatar = item.type === "avatar" ? item.value : row.avatar;
  await env.DB.prepare("UPDATE users SET inventory = ?1, avatar = ?2 WHERE id = ?3")
    .bind(JSON.stringify(inv), avatar, row.id).run();
  return { ok: true, row: { ...row, inventory: JSON.stringify(inv), avatar } };
}

// Daily streak: bump on consecutive day, reset (or spend a Freeze) on a gap,
// award a small Bulbs bonus once per day. Returns the updated row.
export async function applyDailyStreak(env, row) {
  const t = today();
  if (row.streak_last === t) return row;
  const inv = parseInv(row);
  let count;
  if (row.streak_last === yesterday()) {
    count = row.streak_count + 1;
  } else if (row.streak_last) {
    const freeze = (inv.boosts && inv.boosts.freeze) || 0;
    if (freeze > 0) { inv.boosts.freeze = freeze - 1; count = row.streak_count + 1; }
    else count = 1;
  } else {
    count = 1;
  }
  const bonus = 5 * Math.min(count, 5);
  const newBulbs = row.bulbs + bonus;
  await env.DB.prepare("UPDATE users SET streak_count = ?1, streak_last = ?2, bulbs = ?3, inventory = ?4 WHERE id = ?5")
    .bind(count, t, newBulbs, JSON.stringify(inv), row.id).run();
  return { ...row, streak_count: count, streak_last: t, bulbs: newBulbs, inventory: JSON.stringify(inv) };
}
