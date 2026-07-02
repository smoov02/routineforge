// render.js — turn matched rows into the printable guide DOM.

import { figureFor } from "./figures.js";
import { RIGS } from "./figures-engine.js";
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function repsLabel(row) {
  const sets = row.sets ? row.sets.replace(/\s*sets?\s*/i, "").trim() : "";
  const reps = row.reps ? row.reps.replace(/\s*reps?\s*/i, "").trim() : "";
  if (sets && reps) return `${sets} \u00d7 ${reps}`;
  return sets || reps || "";
}

function badge(match) {
  switch (match.confidence) {
    case "exact": return "";
    case "fuzzy": return `<span class="tag tag-warn">matched as ${match.entry.name}</span>`;
    case "pattern": return `<span class="tag tag-warn">no exact match \u2014 showing the ${match.pattern} pattern</span>`;
    default: return `<span class="tag tag-warn">unknown \u2014 add it to the library</span>`;
  }
}

// rows: [{ row, match }]; patterns: from patterns.json. Renders into container.
export async function renderGuide(container, title, rows, patterns) {
  container.innerHTML = "";

  const head = el("div", "guide-head");
  head.appendChild(el("h2", null, title || "Routine guide"));
  head.appendChild(el("p", "guide-sub",
    "Thumbnail, key form cues, and the main thing to avoid for each movement."));
  container.appendChild(head);

  for (const { row, match } of rows) {
    const card = el("div", "ex-card");

    const thumb = el("div", "ex-thumb");
thumb.innerHTML = `<span class="fig-static">${await figureFor(match, patterns)}</span>`;

const exId = match.entry.id;
const patId = match.entry.pattern;
const rigId = exId && RIGS[exId] ? exId
            : patId && RIGS[patId] ? patId
            : null;
if (rigId) {
  const fig = document.createElement("stick-figure");
  fig.setAttribute("ex", rigId);
  thumb.appendChild(fig);
  thumb.classList.add("has-anim");
}
card.appendChild(thumb);

    const body = el("div", "ex-body");

    const displayName = match.entry ? match.entry.name : row.name;
    const reps = repsLabel(row);
    const head2 = el("div", "ex-head");
    head2.innerHTML =
      `<span class="ex-name">${displayName}</span>` +
      (reps ? `<span class="ex-reps">${reps}</span>` : "") +
      badge(match);
    body.appendChild(head2);

    const form = match.entry ? match.entry.form
      : "Add this exercise to data/exercises.json to show its form cues here.";
    const pitfalls = match.entry ? match.entry.pitfalls
      : "Once it's in the library, its pitfalls will appear here.";

    body.appendChild(el("div", "ex-line",
      `<span class="lab">Form</span>${form}`));
    body.appendChild(el("div", "ex-line",
      `<span class="lab lab-warn">Avoid</span>${pitfalls}`));

    if (row.notes) {
      body.appendChild(el("div", "ex-line ex-note",
        `<span class="lab lab-you">Your note</span>${row.notes}`));
    }

    card.appendChild(body);
    container.appendChild(card);
  }
}
