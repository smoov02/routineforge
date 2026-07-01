# Architecture

RoutineForge is a static, client-side app. There is no server and no build step. The whole pipeline executes in the browser, which is what makes hosting effectively free and keeps the user's data on their machine.

## Pipeline

1. **Parse** (`src/parse.js`)
   CSV is read with PapaParse, XLSX with SheetJS (both loaded as globals in `index.html`). Column detection is fuzzy: a header matching `/exercise|movement|lift|name/i` becomes the exercise column, with optional `Sets`, `Reps`, `Notes`. If no name-like header exists, the first column is used. Output is a list of `{ name, sets, reps, notes }`.

2. **Match** (`src/match.js`, `src/util.js`)
   Each row name is normalized (lowercased, parentheticals dropped, abbreviations like `db`/`rdl`/`ohp` expanded, punctuation stripped). Then, in order:
   - **exact** — normalized name/alias hit against the library index;
   - **fuzzy** — best Sørensen–Dice bigram similarity above a threshold;
   - **pattern** — keyword inference of a movement pattern when the library has nothing;
   - **none** — truly unknown.

   This tiering means the app degrades gracefully: an exercise it has never seen still resolves to a movement pattern, so it still gets a sensible figure.

3. **Render** (`src/render.js`, `src/figures.js`)
   For each match, a card is built: figure thumbnail + canonical name + sets×reps + Form + Avoid (+ the user's own note if present). Low-confidence matches show a small badge ("matched as …", "showing the … pattern", "add it to the library").

4. **Print** (`styles/print.css`)
   "Save as PDF" calls `window.print()`. The print stylesheet hides the UI chrome and tightens the cards to the same look as a hand-made guide. The browser's own PDF engine does the rest — no PDF library needed.

## Figure resolution

`figureFor(match)` resolves in this order, caching each fetch:

1. `figures/exercises/<id>.svg` — bespoke figure for a known exercise;
2. `figures/patterns/<pattern>.svg` — the movement-pattern archetype;
3. `figures/patterns/placeholder.svg`.

The archetype layer is the key design decision: ~11 pattern figures cover the long tail, and bespoke figures are an optional quality upgrade that never block a release.

## Data model

`data/exercises.json` is the contribution surface (CC0). Each entry conforms to `data/schema.json`. `data/patterns.json` lists the movement patterns and the figure each one points to. `scripts/validate-data.mjs` enforces integrity with zero dependencies.

## Why no framework

A framework would add a build step, a toolchain, and a dependency tree — all friction against "anyone can clone this, open it, and it just runs," and against hosting it as flat files forever. Vanilla ES modules keep the surface area small and the project legible.

## Possible next steps

- Vendor the parser scripts for a fully offline build.
- A "request this exercise" affordance that drafts a `data/exercises.json` entry from an unmatched name.
- Optional sets/reps progression columns rendered as a small table per exercise.
- A larger seed import pass from the public-domain datasets, mapped onto the pattern tags.
