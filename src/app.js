// app.js — three ways in (spreadsheet, sample, creator) -> overview + guide.

import { parseFile, parseCsvText } from "./parse.js";
import { buildIndex, matchRow } from "./match.js";
import { buildRoutine } from "./builder.js";
import { renderOverview, renderGuide } from "./render.js";

// --- config you may want to edit ---------------------------------------------
// Where your deployed Cloudflare Worker lives. Same-origin path if you route it
// under your Pages domain, or a full https URL to the worker.
const CREATOR_API = "https://routineforge-creator.markfmerchant.workers.dev";
// Public Turnstile site key (safe to expose). Leave "" to skip the widget locally.
const TURNSTILE_SITEKEY = "";
// The mode registry. The active mode is chosen from here at startup.
const MODES_INDEX = "modes/index.json";
// -----------------------------------------------------------------------------

const CREATOR_DISCLAIMER =
  "This is an original routine generated in a similar training style. It is independent and " +
  "not affiliated with, endorsed by, or created by any named person. Not medical advice — " +
  "clear new programs with a qualified professional.";

const $ = (s) => document.querySelector(s);
const prettyLabel = (id) => id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

let INDEX = null, PATTERNS = [], EXERCISES = [];
let REGISTRY = null, MODE = null, MODE_BASE = "", FIGURES_BASE = "";

// Read the registry, build the pills, activate the first enabled mode.
async function loadMode() {
  REGISTRY = await fetch(MODES_INDEX).then((r) => r.json());
  renderPills();
  const first = REGISTRY.modes.find((m) => m.enabled);
  if (!first) throw new Error("No enabled mode in modes/index.json");
  await setMode(first.id);
}

// Switch to a mode: load its manifest, apply theme + hero, then its data.
async function setMode(id) {
  const entry = REGISTRY.modes.find((m) => m.id === id);
  if (!entry || !entry.enabled) return;
  MODE_BASE = `modes/${id}`;
  MODE = await fetch(`${MODE_BASE}/mode.json`).then((r) => r.json());
  FIGURES_BASE = `${MODE_BASE}/${MODE.figures || "figures"}`;
  applyTheme(MODE.theme);
  swapHero(MODE);
  markActivePill(id);
  $("#output").hidden = true;
  $("#status").textContent = "";
  await loadData();
  setHeroName(MODE);
}

async function loadData() {
  const [ex, pat] = await Promise.all([
    fetch(`${MODE_BASE}/${MODE.library}`).then((r) => r.json()),
    fetch(`${MODE_BASE}/${MODE.taxonomy}`).then((r) => r.json()),
  ]);
  EXERCISES = ex.exercises;
  INDEX = buildIndex(EXERCISES);
  PATTERNS = pat.patterns;
}

function renderPills() {
  const wrap = $("#mode-pills");
  if (!wrap || !REGISTRY) return;
  wrap.innerHTML = "";
  for (const m of REGISTRY.modes) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "mode-pill" + (m.enabled ? "" : " soon");
    pill.dataset.mode = m.id;
    pill.textContent = prettyLabel(m.id);
    if (m.enabled) pill.addEventListener("click", () => setMode(m.id));
    else pill.disabled = true;
    wrap.appendChild(pill);
  }
}

function markActivePill(id) {
  document.querySelectorAll("#mode-pills .mode-pill").forEach((p) => {
    const on = p.dataset.mode === id;
    p.classList.toggle("active", on);
    p.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement.style;
  if (theme.accent) root.setProperty("--accent", theme.accent);
  if (theme.soft) root.setProperty("--accent-bg", theme.soft);
}

// Replace the hero's animated figure with the active mode's hero exercise.
function swapHero(mode) {
  const card = document.querySelector(".hero-art-card");
  if (!card || !mode.hero) return;
  const fig = document.createElement("stick-figure");
  fig.setAttribute("ex", mode.hero);
  const old = card.querySelector("stick-figure");
  old ? card.replaceChild(fig, old) : card.appendChild(fig);
}

// Set the hero label from the loaded library (falls back to a prettified id).
function setHeroName(mode) {
  const tag = document.querySelector(".hero-art-tag");
  if (!tag || !mode.hero) return;
  const entry = EXERCISES.find((e) => e.id === mode.hero);
  tag.textContent = entry ? entry.name : prettyLabel(mode.hero);
}

async function showRoutine(routine) {
renderOverview($("#overview"), routine, MODE ? MODE.dose : null);
  await renderGuide($("#guide"), routine, INDEX, PATTERNS, FIGURES_BASE, MODE);
  $("#output").hidden = false;
  $("#status").textContent = "";
  $("#overview").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleFile(file) {
  $("#status").textContent = `Reading ${file.name}\u2026`;
  try {
    await showRoutine(await parseFile(file));
  } catch (err) {
    console.error(err);
    $("#status").textContent = `Couldn't read that file: ${err.message}`;
  }
}

async function loadSample() {
  $("#status").textContent = "Loading sample\u2026";
  const text = await fetch("samples/full-body-ab.csv").then((r) => r.text());
  await showRoutine(parseCsvText(text, "Full-body A/B \u2014 sample"));
}

// pull a plausible creator string out of a raw input or channel URL
function cleanCreator(raw) {
  const s = raw.trim();
  const at = s.match(/@([A-Za-z0-9._-]+)/);
  if (at) return at[1].replace(/[._-]+/g, " ").trim();
  try {
    const u = new URL(s);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) return decodeURIComponent(seg).replace(/[._-]+/g, " ").trim();
  } catch { /* not a URL */ }
  return s;
}

async function handleCreator() {
  const raw = $("#creator-input").value;
  if (!raw.trim()) return;
  const creator = cleanCreator(raw);
  $("#status").textContent = `Building a routine in ${creator}'s style\u2026`;

  const token = window.turnstile && TURNSTILE_SITEKEY
    ? window.turnstile.getResponse() : "";

  try {
    const res = await fetch(CREATOR_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator, token }),
    });
    if (!res.ok) throw new Error(`lookup failed (${res.status})`);
    const params = await res.json();

    const routine = buildRoutine({
      ...params,
      title: `A routine inspired by ${creator}'s style`,
      source: "creator",
      disclaimer: CREATOR_DISCLAIMER,
    }, EXERCISES);

    if (params.known === false) {
      $("#status").textContent =
        `Didn't recognize "${creator}" — here's a solid, balanced routine instead.`;
    }
    await showRoutine(routine);
  } catch (err) {
    console.error(err);
    $("#status").textContent =
      "Couldn't reach the creator lookup. Is the Worker deployed and CREATOR_API set? " +
      "(You can still use a spreadsheet or the sample.)";
  }
}

function init() {
  loadMode().catch((e) => {
    $("#status").textContent =
      "Couldn't load the exercise data. Run this through a local server (see README).";
    console.error(e);
  });

  $("#file").addEventListener("change", (e) => e.target.files[0] && handleFile(e.target.files[0]));
  $("#sample").addEventListener("click", loadSample);
  $("#creator-go").addEventListener("click", handleCreator);
  $("#creator-input").addEventListener("keydown", (e) => { if (e.key === "Enter") handleCreator(); });
  $("#print").addEventListener("click", () => window.print());

  const drop = $("#drop");
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]));
}

document.addEventListener("DOMContentLoaded", init);
