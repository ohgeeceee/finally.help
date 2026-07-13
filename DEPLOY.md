# DEPLOY.md — finally.help to Cloudflare Pages

Manual because I didn't want to commit anything to your Cloudflare account without you.

## One-time setup

1. Log into Cloudflare. Create a Pages project named `finally-help` connected to this GitHub repo (`ohgeeceee/finally.help`).
2. **Build settings:** leave blank. Cloudflare Pages detects a static site by default. There's no build command — `index.html` at the root is the entry.
3. **Environment variables** (Settings → Variables → Production):
   - `LLM_API_KEY` — your provider key (Anthropic / OpenAI / etc.)
   - `LLM_MODEL` — the model id you want it to use, e.g. `claude-sonnet-4-5`

## DNS

In your registrar (where you bought `finally.help` and `finallymakesense.com`):

- Point `finally.help` and `www.finally.help` at the Pages project. Easiest: add the domain inside the Pages project — Cloudflare will auto-set the CNAME/A records.
- Repeat for `finallymakesense.com` if you want the canonical to live there too (then `finally.help` just 301s).

## What gets deployed

- Everything in this repo at the root is served. `index.html`, `/styles.css`, `/app.js`, `/[subject].html` files, and `functions/api/explain.js`.
- `functions/` is treated as Pages Functions by Cloudflare. `/_headers` and `/_redirects` are honoured automatically.

## Smoke test

After the first deploy:

```bash
curl -s https://finally.help/ | head -5
curl -sX POST https://finally.help/api/explain -H 'content-type: application/json' -d '{"subject":"blockchain"}'
```

You should see the index HTML and a JSON response with the explanation.

## Limits

- Cloudflare Pages Functions: 100k requests/day on free tier. Fine for v0.
- LLM spend: out of Cloudflare's hands. Put a spend cap on your provider key.
