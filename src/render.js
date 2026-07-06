// render.js — render a structured routine: an overview (weekly rhythm + workout
// cards + notes) and a guide (thumbnail + form + pitfalls per exercise).

import { figureFor } from "./figures.js";
import { matchRow } from "./match.js";

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function repsLabel(ex) {
  const sets = ex.sets ? ex.sets.replace(/\s*sets?\s*/i, "").trim() : "";
  const reps = ex.reps ? ex.reps.replace(/\s*reps?\s*/i, "").trim() : "";
  if (sets && reps) return `${sets} \u00d7 ${reps}`;
  return sets || reps || "";
}

// ---- overview (mirrors the one-page routine layout) -------------------------
export function renderOverview(container, routine) {
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
      const reps = repsLabel(ex);
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

export async function renderGuide(container, routine, index, patterns) {
  container.innerHTML = "";
  container.appendChild(el("h2", "guide-h", "Exercise guide"));
  container.appendChild(el("p", "guide-sub",
    "Thumbnail, key form cues, and the main thing to avoid for each movement."));

  const multi = routine.workouts.length > 1;
  for (const w of routine.workouts) {
    if (multi) container.appendChild(el("div", "guide-sec", w.label));
    for (const ex of w.exercises) {
      const match = matchRow(ex.name, index);
      const card = el("div", "ex-card");

      const thumb = el("div", "ex-thumb");
      thumb.innerHTML = await figureFor(match, patterns);
      card.appendChild(thumb);

      const body = el("div", "ex-body");
      const displayName = match.entry ? match.entry.name : ex.name;
      const reps = repsLabel(ex);
      body.appendChild(el("div", "ex-head",
        `<span class="ex-name">${displayName}</span>` +
        (reps ? `<span class="ex-reps">${reps}</span>` : "") + badge(match)));

      const form = match.entry ? match.entry.form
        : "Add this exercise to data/exercises.json to show its form cues here.";
      const pit = match.entry ? match.entry.pitfalls
        : "Once it's in the library, its pitfalls will appear here.";
      body.appendChild(el("div", "ex-line", `<span class="lab">Form</span>${form}`));
      body.appendChild(el("div", "ex-line", `<span class="lab lab-warn">Avoid</span>${pit}`));
      if (ex.notes) body.appendChild(el("div", "ex-line ex-note", `<span class="lab lab-you">Your note</span>${ex.notes}`));

      card.appendChild(body);
      container.appendChild(card);
    }
  }
}
