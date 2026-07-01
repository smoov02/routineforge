// parse.js — turn an uploaded CSV/XLSX (or raw CSV text) into routine rows.
// Depends on window.Papa (PapaParse) and window.XLSX (SheetJS), loaded in index.html.

// Map fuzzy header names to our canonical fields.
const COLUMN_HINTS = {
  name:  /^(exercise|movement|lift|name|workout)/i,
  sets:  /set/i,
  reps:  /rep/i,
  notes: /(note|cue|tempo|comment|tip)/i,
};

function detectColumns(headerKeys) {
  const map = {};
  for (const [field, rx] of Object.entries(COLUMN_HINTS)) {
    map[field] = headerKeys.find((k) => rx.test(k)) || null;
  }
  // If we couldn't find a name column, assume the first column is the exercise.
  if (!map.name && headerKeys.length) map.name = headerKeys[0];
  return map;
}

function rowsFromObjects(objects) {
  if (!objects.length) return [];
  const keys = Object.keys(objects[0]);
  const col = detectColumns(keys);
  return objects
    .map((o) => ({
      name:  col.name  ? String(o[col.name]  ?? "").trim() : "",
      sets:  col.sets  ? String(o[col.sets]  ?? "").trim() : "",
      reps:  col.reps  ? String(o[col.reps]  ?? "").trim() : "",
      notes: col.notes ? String(o[col.notes] ?? "").trim() : "",
    }))
    .filter((r) => r.name);
}

export function parseCsvText(text) {
  const res = window.Papa.parse(text, { header: true, skipEmptyLines: true });
  return rowsFromObjects(res.data);
}

export async function parseFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || file.type === "text/csv") {
    return parseCsvText(await file.text());
  }
  // XLSX / XLS
  const buf = await file.arrayBuffer();
  const wb = window.XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const objects = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rowsFromObjects(objects);
}
