// RoutineForge creator-style Worker.
// POST { creator, token } -> JSON style params for the deterministic builder.
// The API key lives only here (never in the browser). Includes cache,
// per-IP + global rate limits, an optional Turnstile check, and a daily
// spend kill-switch so a runaway loop can't drain your account.

const MODEL_DEFAULT = "claude-haiku-4-5-20251001";

const SPLITS = ["full-body-ab", "full-body", "upper-lower"];
const GOALS = ["strength", "hypertrophy", "endurance", "general"];
const LENGTHS = ["short", "medium", "long"];
const EQUIP = ["dumbbell", "barbell", "kettlebell", "bodyweight", "band or cable", "machine"];

const SYSTEM = `You output ONLY a JSON object describing GENERAL training-style parameters used to build an ORIGINAL workout.

Hard rules:
- Never reproduce, quote, or paraphrase any specific person's videos, programs, exact wording, or other copyrighted material.
- Never claim the routine is theirs, created by them, or endorsed by them.
- Use only broad, widely-known, factual characteristics of a creator's public training style (e.g. how often they train, session length, equipment they favor, whether they lean strength vs hypertrophy vs conditioning).
- If you do not recognize the name, set "known": false and return balanced general defaults.

Return ONLY this JSON, no markdown, no commentary:
{
  "known": boolean,
  "daysPerWeek": integer 2-6,
  "split": one of ["full-body-ab","full-body","upper-lower"],
  "sessionLength": one of ["short","medium","long"],
  "goal": one of ["strength","hypertrophy","endurance","general"],
  "equipment": array from ["dumbbell","barbell","kettlebell","bodyweight","band or cable","machine"],
  "emphasis": array of up to 3 short lowercase tags (e.g. "lower-body","posterior-chain","conditioning"),
  "styleSummary": string <=200 chars, ORIGINAL and generic, describing the style in your own words with no names, no attribution, no endorsement claims
}`;

const pick = (v, allowed, dflt) => (allowed.includes(v) ? v : dflt);

function validate(p) {
  const out = {
    known: p.known !== false,
    daysPerWeek: Math.min(6, Math.max(2, parseInt(p.daysPerWeek, 10) || 3)),
    split: pick(p.split, SPLITS, "full-body-ab"),
    sessionLength: pick(p.sessionLength, LENGTHS, "short"),
    goal: pick(p.goal, GOALS, "general"),
    equipment: Array.isArray(p.equipment) ? p.equipment.filter((e) => EQUIP.includes(e)).slice(0, 6) : [],
    emphasis: Array.isArray(p.emphasis) ? p.emphasis.map(String).slice(0, 3) : [],
    styleSummary: typeof p.styleSummary === "string" ? p.styleSummary.slice(0, 200) : null,
  };
  if (!out.equipment.length) out.equipment = ["dumbbell"];
  return out;
}

function cors(origin, allowed) {
  const ok = !allowed || allowed === "*" || origin === allowed;
  return {
    "Access-Control-Allow-Origin": ok ? (origin || "*") : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

async function bump(kv, key, ttl) {
  const n = (parseInt(await kv.get(key), 10) || 0) + 1;
  await kv.put(key, String(n), { expirationTtl: ttl });
  return n;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const ch = cors(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: ch });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, ch);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad json" }, 400, ch); }
    const creator = String(body.creator || "").trim().slice(0, 80);
    if (!creator) return json({ error: "creator required" }, 400, ch);

    const kv = env.RF_KV;
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const now = new Date();
    const day = now.toISOString().slice(0, 10).replace(/-/g, "");
    const hour = now.toISOString().slice(0, 13).replace(/[-T]/g, "");

    // global daily kill-switch
    const maxDay = parseInt(env.MAX_PER_DAY || "500", 10);
    const dayCount = parseInt((kv && await kv.get(`day:${day}`)) || "0", 10);
    if (kv && dayCount >= maxDay) return json({ error: "daily limit reached, try tomorrow" }, 503, ch);

    // per-IP hourly limit
    const maxIp = parseInt(env.MAX_PER_IP_HOUR || "20", 10);
    if (kv) {
      const ipCount = await bump(kv, `rl:${ip}:${hour}`, 3600);
      if (ipCount > maxIp) return json({ error: "slow down a moment" }, 429, ch);
    }

    // optional Turnstile
    if (env.TURNSTILE_SECRET) {
      const form = new FormData();
      form.append("secret", env.TURNSTILE_SECRET);
      form.append("response", String(body.token || ""));
      form.append("remoteip", ip);
      const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })
        .then((r) => r.json()).catch(() => ({ success: false }));
      if (!v.success) return json({ error: "verification failed" }, 403, ch);
    }

    // cache by normalized creator
    const cacheKey = `style:${creator.toLowerCase().replace(/\s+/g, " ")}`;
    if (kv) {
      const cached = await kv.get(cacheKey);
      if (cached) return json(JSON.parse(cached), 200, { ...ch, "X-RF-Cache": "hit" });
    }

    // call Anthropic (Haiku, ungrounded)
    let params;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: env.MODEL || MODEL_DEFAULT,
          max_tokens: 400,
          system: SYSTEM,
          messages: [{ role: "user", content: `Creator: ${creator}` }],
        }),
      });
      if (!r.ok) return json({ error: `upstream ${r.status}` }, 502, ch);
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      params = validate(JSON.parse(text.replace(/^```json|```$/g, "").trim()));
    } catch (e) {
      return json({ error: "lookup error" }, 502, ch);
    }

    if (kv) {
      await bump(kv, `day:${day}`, 90000);
      await kv.put(cacheKey, JSON.stringify(params), { expirationTtl: parseInt(env.CACHE_TTL || "2592000", 10) });
    }
    return json(params, 200, { ...ch, "X-RF-Cache": "miss" });
  },
};
