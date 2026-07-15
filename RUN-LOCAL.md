# Run finally.help locally (Windows)

Everything runs on your machine — `node_modules` is already installed here.
Open **PowerShell** or **Command Prompt** in this folder and run the steps below.

## 1. Add your local secrets (one time)

```powershell
copy .dev.vars.example .dev.vars
```

Then open `.dev.vars` and paste your **real** Anthropic key into `LLM_API_KEY`.
(This file is gitignored, so it never gets committed.)

> If you don't add a key, the site still runs — but the "Explain something to me"
> generator (which calls the LLM) will error. Browse, accounts, and games work without it.

## 2. Create the local database tables (one time)

```powershell
npx wrangler d1 execute finally-help-db --local --file=schema.sql
```

This builds a local SQLite copy — your real Cloudflare data is untouched.

## 3. Start the server

```powershell
npm run dev
```

Wrangler prints a URL like `http://localhost:8788`. Open it in your browser.
Register an account and points, streaks, comments, and games all persist locally.

Press `Ctrl + C` in the terminal to stop.

## Troubleshooting

- **Blank/unstyled page when double-clicking `index.html`** — that's expected; open the
  `localhost:8788` URL from `npm run dev` instead. Opening the file directly can't reach the API.
- **`workerd` platform error** — your `node_modules` was built on a different OS. Fix with:
  `rmdir /s /q node_modules` then `npm install`.
- **Port already in use** — run `npx wrangler pages dev . --port 8790` and use that port.
- **D1 binding warnings about `database_id`** — safe to ignore for local dev; the real id is
  only needed for `--remote` / production.
