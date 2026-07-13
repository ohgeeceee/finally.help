# finally.help

Paste anything confusing. Get a kid-friendly explanation you can actually share.

> `finally.help/[subject]` → a single, 5th-grade, ~45-second explanation for any topic.

The site is one static page + a Cloudflare Pages Function that proxies an LLM call so the API key never reaches the browser.

## Stack

- **Frontend:** vanilla HTML/CSS/JS. No framework. ~5 KB total.
- **API:** Cloudflare Pages Function at `/api/explain` wrapping a single model call.
- **Share routes:** `/[subject].html` are pre-rendered statics so links work without a server. (Future: ISR-ish via the function when volume warrants.)
- **Hosting:** Cloudflare Pages. Free tier. Free TLS. CDN by default.

## Run locally

```bash
npm install
npx wrangler pages dev --port 8788
```

The Functions runtime needs one secret (the LLM provider key). For local dev, put it in `.dev.vars`:

```
LLM_API_KEY=sk-...
LLM_MODEL=claude-sonnet-4-5
```

`.dev.vars` is gitignored. For production, set both in the Cloudflare Pages dashboard under *Settings → Variables*.

## Deploy

See [DEPLOY.md](./DEPLOY.md).

## Repo conventions

- Branch off `main` for changes. Open a PR.
- Don't touch DNS until you've reviewed and merged. We wire `finally.help` (and `finallymakesense.com` if you want the canonical) to the Pages project as a final step, separately from code review.

## License

MIT.
