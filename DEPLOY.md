# DEPLOY.md — finally.help to Cloudflare Pages

## 1. Push to GitHub
Repo: `ohgeeceee/finally.help` (public).

## 2. Create the Pages project
- Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> connect the GitHub repo.
- Build command: none. Output directory: `/` (root). It's a static site with Functions.

## 3. Create and bind the D1 database
```bash
npx wrangler d1 create finally-help-db          # copy database_id into wrangler.toml
npx wrangler d1 execute finally-help-db --remote --file=schema.sql
```
In the Pages project: Settings -> Functions -> D1 database bindings -> add binding
`DB` -> `finally-help-db`.

## 4. Environment variables (Settings -> Variables -> Production)
- `LLM_API_KEY` — your Anthropic key. Put a spend cap on it.
- `LLM_MODEL` — e.g. `claude-sonnet-4-5`
- `GAME_SECRET` — a long random string.

## 5. DNS
Add `finally.help` (and `www`) inside the Pages project's Custom Domains — Cloudflare
sets the records automatically. Repeat for `finallymakesense.com` if you want it as a
second domain (or 301 one to the other).

## 6. Smoke test
```bash
curl -s https://finally.help/ | head -5
curl -s https://finally.help/api/library | head -c 200
curl -sX POST https://finally.help/api/explain -H 'content-type: application/json' -d '{"subject":"blockchain"}'
```

## Limits
- Pages Functions: 100k requests/day on the free tier.
- D1 free tier: generous for launch.
- LLM spend is on your provider key — keep the cap on.
