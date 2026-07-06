// parse.js — turn an uploaded CSV/XLSX (or raw CSV text) into a structured routine.
// Depends on window.Papa (PapaParse) and window.XLSX (SheetJS), loaded in index.html.

import { scheduleFor, DEFAULT_NOTES } from "./builder.js";

// Map fuzzy header names to our canonical fields.
const COLUMN_HINTS = {
  name:    /^(exercise|movement|lift|name)/i,
  sets:    /set/i,
  reps:    /rep/i,
  notes:   /(note|cue|tempo|comment|tip)/i,
  workout: /(workout|^day$|split|session|block)/i,
};

function detectColumns(headerKeys) {
  const map = {};
  for (const [field, rx] of Object.entries(COLUMN_HINTS)) {
    map[field] = headerKeys.find((k) => rx.test(k)) || null;
  }
  if (!map.name && headerKeys.length) map.name = headerKeys[0];
  return map;
}

// Flatten header objects into { name, sets, reps, notes, workout } rows.
function flatten(objects) {
  if (!objects.length) return [];
  const keys = Object.keys(objects[0]);
  const col = detectColumns(keys);
  return objects
    .map((o) => ({
      name:    col.name    ? String(o[col.name]    ?? "").trim() : "",
      sets:    col.sets    ? String(o[col.sets]    ?? "").trim() : "",
      reps:    col.reps    ? String(o[col.reps]    ?? "").trim() : "",
      notes:   col.notes   ? String(o[col.notes]   ?? "").trim() : "",
      workout: col.workout ? String(o[col.workout] ?? "").trim() : "",
    }))
    .filter((r) => r.name);
}

// Group flat rows into a structured routine. If a Workout/Day column is present
// and has more than one distinct value, we render the weekly overview; otherwise
// it's a single unstructured workout (guide only, no weekly strip).
export function toRoutine(rows, title) {
  const hasGroups = rows.some((r) => r.workout) &&
    new Set(rows.filter((r) => r.workout).map((r) => r.workout)).size > 1;

  let workouts;
  if (hasGroups) {
    const order = [];
    const byGroup = new Map();
    for (const r of rows) {
      const key = r.workout || "Other";
      if (!byGroup.has(key)) { byGroup.set(key, []); order.push(key); }
      byGroup.get(key).push({ name: r.name, sets: r.sets, reps: r.reps, notes: r.notes });
    }
    workouts = order.map((label) => ({
      id: label.replace(/workout\s*/i, "").trim() || label,
      label: /workout/i.test(label) ? label : `Workout ${label}`,
      focus: "",
      exercises: byGroup.get(label),
    }));
  } else {
    workouts = [{
      id: "main", label: "Workout", focus: "",
      exercises: rows.map((r) => ({ name: r.name, sets: r.sets, reps: r.reps, notes: r.notes })),
    }];
  }

  return {
    title,
    source: "spreadsheet",
    disclaimer: null,
    schedule: hasGroups ? scheduleFor(workouts.map((w) => w.id), workouts.length === 2 ? 3 : workouts.length) : [],
    notes: hasGroups ? DEFAULT_NOTES : null,
    workouts,
    styleSummary: null,
  };
}

export function parseCsvText(text, title = "Routine") {
  const res = window.Papa.parse(text, { header: true, skipEmptyLines: true });
  return toRoutine(flatten(res.data), title);
}

export async function parseFile(file) {
  const title = file.name.replace(/\.[^.]+$/, "");
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || file.type === "text/csv") {
    return parseCsvText(await file.text(), title);
  }
  const buf = await file.arrayBuffer();
  const wb = window.XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const objects = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return toRoutine(flatten(objects), title);
}
