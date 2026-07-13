-- finally.help — Cloudflare D1 schema
-- Apply locally:  wrangler d1 execute finally-help-db --local  --file=schema.sql
-- Apply to prod:  wrangler d1 execute finally-help-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,          -- lowercased, used for login + uniqueness
  display       TEXT NOT NULL,                 -- what the user typed (original case)
  pass_salt     TEXT NOT NULL,
  pass_hash     TEXT NOT NULL,
  xp            INTEGER NOT NULL DEFAULT 0,
  bulbs         INTEGER NOT NULL DEFAULT 20,
  avatar        TEXT NOT NULL DEFAULT '🙂',
  inventory     TEXT NOT NULL DEFAULT '{"boosts":{"double":0,"freeze":0,"hint":0},"avatars":["🙂"],"themes":["paper"],"theme":"paper","flairGold":false,"pet":false}',
  read_ids      TEXT NOT NULL DEFAULT '[]',    -- JSON array of explainer ids the user has claimed
  streak_count  INTEGER NOT NULL DEFAULT 0,
  streak_last   TEXT,                          -- YYYY-MM-DD
  comment_day   TEXT,                          -- YYYY-MM-DD for daily comment-reward cap
  comment_n     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,               -- sha256(cookie token)
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,               -- epoch ms
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS explainers (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  teaser      TEXT,
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_explainers_user ON explainers(user_id);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,                  -- explainer id / topic key the comment belongs to
  user_id     TEXT NOT NULL,
  display     TEXT NOT NULL,
  avatar      TEXT,
  flair       TEXT,
  text        TEXT NOT NULL,
  reacts      TEXT NOT NULL DEFAULT '{}',     -- JSON: { "👍": ["username", ...], ... }
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_subject ON comments(subject);
