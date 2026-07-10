#!/usr/bin/env node
// validate-data.mjs — sanity-check the exercise library with zero dependencies.
// Run: node scripts/validate-data.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));

// Strength's data now lives under its mode folder. When we add a multi-mode
// validator, MODE_DIR becomes a loop over modes/index.json.
const MODE_DIR = "modes/strength";
const FIG = `${MODE_DIR}/figures`;

const errors = [];
const warnings = [];

const patterns = read(`${MODE_DIR}/patterns.json`).patterns;
const exercises = read(`${MODE_DIR}/exercises.json`).exercises;
const patternIds = new Set(patterns.map((p) => p.id));

// patterns must have a figure file
for (const p of patterns) {
  const fig = resolve(root, `${FIG}/patterns/${p.figure}.svg`);
  if (!existsSync(fig)) {
    errors.push(`pattern "${p.id}": figure file missing — expected ${FIG}/patterns/${p.figure}.svg`);
  }
}

const REQUIRED = ["id", "name", "pattern", "form", "pitfalls"];
const seenIds = new Set();
const seenNorms = new Map();
const norm = (s) =>
  String(s).toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

for (const ex of exercises) {
  const where = ex.id || ex.name || "(unnamed entry)";
  for (const f of REQUIRED) if (!ex[f]) errors.push(`${where}: missing required field "${f}"`);

  if (ex.id) {
    if (!/^[a-z0-9-]+$/.test(ex.id)) errors.push(`${where}: id must be kebab-case [a-z0-9-]`);
    if (seenIds.has(ex.id)) errors.push(`duplicate id "${ex.id}"`);
    seenIds.add(ex.id);
  }
  if (ex.pattern && !patternIds.has(ex.pattern)) {
    errors.push(`${where}: unknown pattern "${ex.pattern}" (not in patterns.json)`);
  }
  // a bespoke figure is optional, but if id-named one is absent the pattern figure is used
  const figId = ex.figure || ex.id;
  if (ex.figure && !existsSync(resolve(root, `${FIG}/exercises/${ex.figure}.svg`))) {
    errors.push(`${where}: figure override "${ex.figure}" has no ${FIG}/exercises/${ex.figure}.svg`);
  } else if (!ex.figure && !existsSync(resolve(root, `${FIG}/exercises/${figId}.svg`))) {
    warnings.push(`${where}: no bespoke figure (${FIG}/exercises/${figId}.svg) — will use the "${ex.pattern}" archetype`);
  }
  // alias collisions across entries
  for (const a of [ex.name, ...(ex.aliases || [])]) {
    const n = norm(a);
    if (n && seenNorms.has(n) && seenNorms.get(n) !== ex.id) {
      warnings.push(`alias/name "${a}" (${ex.id}) collides with ${seenNorms.get(n)}`);
    }
    if (n) seenNorms.set(n, ex.id);
  }
}

// orphan figure files (exist but nothing points at them) — informational
const exFiles = existsSync(resolve(root, `${FIG}/exercises`))
  ? readdirSync(resolve(root, `${FIG}/exercises`)).filter((f) => f.endsWith(".svg"))
  : [];
const referenced = new Set(exercises.map((e) => `${e.figure || e.id}.svg`));
for (const f of exFiles) if (!referenced.has(f)) warnings.push(`orphan figure ${FIG}/exercises/${f} (no entry uses it)`);

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERR   ${e}`);
console.log(
  `\n${exercises.length} exercises, ${patterns.length} patterns · ` +
  `${errors.length} error(s), ${warnings.length} warning(s)`
);
process.exit(errors.length ? 1 : 0);