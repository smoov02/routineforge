# RoutineForge creator Worker

A tiny Cloudflare Worker that turns a creator name into style parameters via
Claude Haiku. The API key stays here, server-side. The frontend never sees it.

## Cost shape
Ungrounded Haiku 4.5 call, roughly **$0.003 per new creator**; repeats are served
from cache and cost nothing. The guards below cap total exposure regardless.

## Deploy

```bash
cd worker
npm install -g wrangler        # or: npx wrangler ...

# 1) create the KV namespace, paste the printed id into wrangler.toml
npx wrangler kv namespace create RF_KV

# 2) set your secrets (never committed)
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TURNSTILE_SECRET      # optional; omit to skip Turnstile

# 3) set ALLOWED_ORIGIN in wrangler.toml to your site's origin, then:
npx wrangler deploy
```

Deploy prints a URL like `https://routineforge-creator.<you>.workers.dev`.

## Wire the frontend
In `../src/app.js` set `CREATOR_API` to that URL (or route the Worker under your
Pages domain at `/api/creator-style` and leave the default). If you enabled
Turnstile, add your **site key** to `TURNSTILE_SITEKEY` in app.js and uncomment
the Turnstile `<script>` in `index.html`.

## Guards (all in wrangler.toml / secrets)
- **Cache** — identical creators never re-bill (`CACHE_TTL`, default 30 days).
- **Per-IP hourly cap** — `MAX_PER_IP_HOUR` (default 20).
- **Daily kill-switch** — `MAX_PER_DAY` (default 500); past it the endpoint returns 503.
- **Turnstile** — set `TURNSTILE_SECRET` to require it.
- **Backstop** — also set a monthly spend limit + alerts in the Anthropic Console.
