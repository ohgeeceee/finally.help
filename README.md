# finally.help

The stuff everyone assumes you already know, explained like you're 10 — for adults who feel behind.

Browse a library of plain-language explainers, generate your own for any topic, earn points and unlock games, and comment. One static front-end plus Cloudflare Pages Functions and a D1 database.

## Stack

- **Frontend:** vanilla HTML/CSS/JS, no framework, no build step (`index.html`, `styles.css`, `app.js`).
- **API:** Cloudflare Pages Functions in `functions/api/*` (auth, economy, explainers, comments, games, and the LLM `explain` proxy).
- **Database:** Cloudflare D1 (SQLite). Schema in `schema.sql`.
- **Auth:** username/password with salted PBKDF2 hashing (`lib/crypto.js`) and HttpOnly cookie sessions.
- **Hosting:** Cloudflare Pages. Free tier, free TLS, CDN.

## One-time setup

```bash
npm install
npx wrangler login

# 1. Create the database, then paste the printed database_id into wrangler.toml
npx wrangler d1 create finally-help-db

# 2. Create the tables (local + production)
npx wrangler d1 execute finally-help-db --local  --file=schema.sql
npx wrangler d1 execute finally-help-db --remote --file=schema.sql

# 3. Secrets for local dev
cp .dev.vars.example .dev.vars   # then edit in your real LLM_API_KEY
```

## Run locally

```bash
npx wrangler pages dev .
```

Open the printed localhost URL, register an account, and everything (points, streak, comments) persists in your local D1.

## Environment variables

Set these in the Cloudflare dashboard (Settings -> Variables) for production, and in `.dev.vars` for local:

- `LLM_API_KEY` — your Anthropic API key (read only by `functions/api/explain.js`).
- `LLM_MODEL` — model id, e.g. `claude-sonnet-4-5`.
- `GAME_SECRET` — long random string used to seal quiz answer tokens (optional locally, set it in prod).

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## License

MIT.
