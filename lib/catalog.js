// Source-of-truth catalog + reward rules. The SERVER validates against these so
// levels, prices, and payouts can't be forged from the browser. The client keeps
// its own copy for display only.

export const REWARDS = {
  READ:    { xp: 10, bulbs: 5 },
  GAME:    { xp: 8,  bulbs: 5 },
  CREATE:  { xp: 25, bulbs: 20 },
  COMMENT: { xp: 3,  bulbs: 2 },
};

export const COMMENT_DAILY_CAP = 5;

export const LEVELS = [
  { min: 0, name: "Curious" },
  { min: 50, name: "Question-Asker" },
  { min: 150, name: "Connector" },
  { min: 300, name: "Sense-Maker" },
  { min: 500, name: "Explainer" },
  { min: 800, name: "Big Brain" },
  { min: 1200, name: "Finally Fluent" },
];

export function levelInfo(xp) {
  let i = 0;
  for (let j = 0; j < LEVELS.length; j++) if (xp >= LEVELS[j].min) i = j;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  return { level: i + 1, name: cur.name, into: xp - cur.min, span: next ? next.min - cur.min : 1, next };
}

export const SHOP = [
  { id: "av_owl",    cat: "Avatars", name: "Owl",              price: 40,  type: "avatar", value: "🦉" },
  { id: "av_fox",    cat: "Avatars", name: "Fox",              price: 40,  type: "avatar", value: "🦊" },
  { id: "av_octo",   cat: "Avatars", name: "Octopus",          price: 60,  type: "avatar", value: "🐙" },
  { id: "av_robot",  cat: "Avatars", name: "Robot",            price: 90,  type: "avatar", value: "🤖", level: 2 },
  { id: "av_brain",  cat: "Avatars", name: "Big Brain",        price: 150, type: "avatar", value: "🧠", level: 3 },
  { id: "av_crown",  cat: "Avatars", name: "Crown",            price: 250, type: "avatar", value: "👑", level: 4 },
  { id: "th_dark",   cat: "Themes",  name: "Night Owl (dark)", price: 120, type: "theme",  value: "theme-dark" },
  { id: "th_blue",   cat: "Themes",  name: "Blueprint",        price: 140, type: "theme",  value: "theme-blueprint", level: 2 },
  { id: "fl_gold",   cat: "Flair",   name: "Gold name",        price: 180, type: "flair",  value: "gold", level: 2 },
  { id: "bo_double", cat: "Boosts",  name: "Double Bulbs ×5",  price: 60,  type: "boost",  value: "double", amount: 5 },
  { id: "bo_freeze", cat: "Boosts",  name: "Streak Freeze",    price: 50,  type: "boost",  value: "freeze", amount: 1 },
  { id: "bo_hint",   cat: "Boosts",  name: "Hint Tokens ×3",   price: 30,  type: "boost",  value: "hint",   amount: 3 },
  { id: "fun_sparky",cat: "Fun",     name: "Sparky the pet",   price: 300, type: "pet",    value: "sparky", level: 3 },
];

export function shopItem(id) {
  return SHOP.find((s) => s.id === id) || null;
}
