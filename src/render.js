// render.js — render a structured routine: an overview (weekly rhythm + workout
// cards + notes) and a guide (thumbnail + form + pitfalls per exercise).
//
// Figures: prefer the animated <stick-figure> web component (figures-engine.js)
// when a rig exists for the exercise or its movement pattern; otherwise fall
// back to the static SVG. The static SVG is also the print path.

import { figureFor } from "./figures.js";
import { matchRow } from "./match.js";
import { RIGS } from "./figures-engine.js";   // registers <stick-figure> as a side effect

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function doseLabel(ex, dose) {
  const D = dose || { primary: { key: "sets" }, secondary: { key: "reps" } };
  const a = ex[D.primary.key] ? String(ex[D.primary.key]).trim() : "";
  const b = D.secondary && ex[D.secondary.key] ? String(ex[D.secondary.key]).trim() : "";
  if (a && b) return `${a} \u00d7 ${b}`;
  return a || b || "";
}

// Exercise id that has a rig, or a rig sharing the movement pattern, else null.
function rigExFor(match) {
  if (match.entry && RIGS[match.entry.id]) return match.entry.id;
  const pattern = match.pattern || (match.entry && match.entry.pattern);
  if (pattern) {
    const hit = Object.keys(RIGS).find((k) => RIGS[k].pattern === pattern);
    if (hit) return hit;
  }
  return null;
}

// ---- overview (mirrors the one-page routine layout) RENDER OVERVIEW -------------------------
export function renderOverview(container, routine, dose = null) {
  container.innerHTML = "";

  const head = el("div", "ov-head");
  head.appendChild(el("h2", null, routine.title || "Routine"));
  if (routine.styleSummary) head.appendChild(el("p", "ov-summary", routine.styleSummary));
  container.appendChild(head);

  if (routine.disclaimer) {
    container.appendChild(el("div", "disclaimer", routine.disclaimer));
  }

  if (routine.schedule && routine.schedule.length) {
    const strip = el("div", "week");
    for (const d of routine.schedule) {
      strip.appendChild(el("div", `week-cell ${d.kind}`,
        `<span class="week-day">${d.day}</span>${d.label}`));
    }
    container.appendChild(el("p", "ov-label", "Weekly rhythm"));
    container.appendChild(strip);
  }

  const cards = el("div", "ov-cards");
  for (const w of routine.workouts) {
    const card = el("div", "ov-card");
    card.appendChild(el("div", "ov-card-title", w.label + (w.focus ? ` <span>${w.focus}</span>` : "")));
    const list = el("div", "ov-ex-list");
    for (const ex of w.exercises) {
      const reps = doseLabel(ex, dose);
      list.appendChild(el("div", "ov-ex",
        `<span>${ex.name}</span><span class="ov-reps">${reps}</span>`));
    }
    card.appendChild(list);
    cards.appendChild(card);
  }
  container.appendChild(cards);

  if (routine.notes) {
    const notes = el("div", "ov-notes");
    for (const [k, v] of Object.entries({ "Warm-up": routine.notes.warmup, "Progress": routine.notes.progress, "Tempo & rest": routine.notes.tempo })) {
      if (v) notes.appendChild(el("div", "ov-note", `<b>${k}</b><br>${v}`));
    }
    container.appendChild(notes);
  }
}

// ---- guide (per-exercise thumbnail + form + pitfalls) -----------------------
function badge(match) {
  switch (match.confidence) {
    case "exact": return "";
    case "fuzzy": return `<span class="tag tag-warn">matched as ${match.entry.name}</span>`;
    case "pattern": return `<span class="tag tag-warn">no exact match \u2014 showing the ${match.pattern} pattern</span>`;
    default: return `<span class="tag tag-warn">unknown \u2014 add it to the library</span>`;
  }
}
//----------------RENDER GUIDE----------------
export async function renderGuide(container, routine, index, patterns, figuresBase = "figures", mode = null) {
  container.innerHTML = "";
  // Field labels + keys come from the active mode's manifest (fields.primary / .secondary).
  // Falls back to strength's form/pitfalls when no mode is passed.
  const D = (mode && mode.dose) || null;
  const F = (mode && mode.fields) || { primary: { key: "form", label: "Form" }, secondary: { key: "pitfalls", label: "Avoid" } };
  container.appendChild(el("h2", "guide-h", "Exercise guide"));
  container.appendChild(el("p", "guide-sub",
    "Thumbnail, key form cues, and the main thing to avoid for each movement."));

  const multi = routine.workouts.length > 1;
  for (const w of routine.workouts) {
    if (multi) container.appendChild(el("div", "guide-sec", w.label));
    for (const ex of w.exercises) {
      const match = matchRow(ex.name, index);
      const card = el("div", "ex-card");

      // thumbnail: animated <stick-figure> when a rig exists, static SVG otherwise
      const thumb = el("div", "ex-thumb");
      const rigEx = rigExFor(match);
      const staticSvg = await figureFor(match, patterns, figuresBase);   // print + fallback path
      if (rigEx) {
        thumb.classList.add("has-anim");
        const anim = document.createElement("stick-figure");
        anim.setAttribute("ex", rigEx);
        thumb.appendChild(anim);
        const fallback = el("span", "fig-static");
        fallback.innerHTML = staticSvg;
        thumb.appendChild(fallback);
      } else {
        thumb.innerHTML = staticSvg;
      }
      card.appendChild(thumb);

      const body = el("div", "ex-body");
      const displayName = match.entry ? match.entry.name : ex.name;
      const reps = doseLabel(ex, D);
      body.appendChild(el("div", "ex-head",
        `<span class="ex-name">${displayName}</span>` +
        (reps ? `<span class="ex-reps">${reps}</span>` : "") + badge(match)));

const primary = match.entry ? match.entry[F.primary.key]
        : `Add this exercise to the library to show its ${F.primary.label.toLowerCase()} here.`;
      const secondary = match.entry ? match.entry[F.secondary.key]
        : `Once it's in the library, its ${F.secondary.label.toLowerCase()} will appear here.`;
      body.appendChild(el("div", "ex-line", `<span class="lab">${F.primary.label}</span>${primary}`));
      body.appendChild(el("div", "ex-line", `<span class="lab lab-warn">${F.secondary.label}</span>${secondary}`));
      if (ex.notes) body.appendChild(el("div", "ex-line ex-note", `<span class="lab lab-you">Your note</span>${ex.notes}`));

      card.appendChild(body);
      container.appendChild(card);
    }
  }
}