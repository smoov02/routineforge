# RoutineForge

**Bring your own program. Get a printable guide.**

Most fitness apps sell you a *methodology* and bundle the tools. RoutineForge is the opposite: methodology-agnostic tooling for the person who already decided what to do and just wants a clean, ownable artifact. Import a spreadsheet of your workout and it produces a printable routine guide — each movement with a copyright-free figure, key form cues, and the main pitfall to avoid.

- **Static, no backend.** Everything runs in the browser: parse → match → render → print. Host it on any static host (GitHub Pages, Cloudflare Pages) essentially for free.
- **Free and open.** Code is MIT; the exercise data and figures are **CC0** so anyone — including other apps — can reuse them.
- **No account, no upload to anyone.** Your spreadsheet is read locally in your browser.

> Not medical advice. Clear new programs with a qualified professional.

## Quick start

This is a static site, but browsers block local `fetch()` from `file://`, so run it through any static server:

```bash
# any one of these, from the repo root:
npm run dev                 # -> http://localhost:5173  (uses npx serve)
python3 -m http.server 5173 # -> http://localhost:5173
```

Then open the URL, click **Try the sample routine**, or drop in your own CSV/XLSX.

## How it works

```
spreadsheet ──▶ parse ──▶ match ──▶ render ──▶ Save as PDF
 (CSV/XLSX)    SheetJS/   normalize  HTML +     browser print
               PapaParse  + fuzzy    figures
                              │
                              ▼
                    Exercise library (CC0)
              names · aliases · pattern · form · pitfalls · figure
```

A spreadsheet row like `DB RDL` is normalized (`db` → `dumbbell`, etc.), matched against the library by alias or fuzzy similarity, and if nothing matches it falls back to inferring a **movement pattern** from keywords. Either way you get a figure and guidance — never a blank.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the details.

## The figure system

The trick that keeps this maintainable: you don't draw 800 figures. Every exercise maps to one of ~11 **movement-pattern archetypes** (squat, hinge, vertical push, carry, …). The pattern's figure is the fallback. Specific lifts can also get a **bespoke** figure that overrides the archetype.

```
figures/patterns/<pattern>.svg     fallback, one per movement pattern
figures/exercises/<id>.svg         optional bespoke override for a lift
```

All figures are plain CC0 SVG (`viewBox 0 0 120 120`). `scripts/build_figures.py` regenerates the seed set, but you can also just hand-draw an SVG and drop it in.

## Project layout

```
index.html              app shell (loads parsers + the app module)
src/                    parse · match · figures · render · app  (vanilla ES modules)
styles/                 app.css (screen) + print.css (PDF)
data/                   exercises.json · patterns.json · schema.json   (CC0)
figures/                patterns/ + exercises/ SVGs                    (CC0)
samples/                a ready-to-load example workout
scripts/                validate-data.mjs · build_figures.py
docs/                   ARCHITECTURE.md
```

## Validate after editing data

```bash
npm run validate     # node scripts/validate-data.mjs
```

Checks required fields, kebab-case ids, that every `pattern` exists, that figure references resolve, and flags alias collisions and orphan figures.

## Deploy

It's static files — push to a repo and enable **GitHub Pages** (or connect **Cloudflare Pages**). No build step required. For a fully offline build, vendor the two parser scripts into a `vendor/` folder and update the `<script>` tags in `index.html`.

## Contributing

The most useful contributions are **exercise entries** and **figures**. See [`CONTRIBUTING.md`](CONTRIBUTING.md). Both are CC0 — by contributing them you agree to release them into the public domain.

## Credits

Exercise naming/structure conventions were informed by public-domain datasets like
[`yuhonas/free-exercise-db`](https://github.com/yuhonas/free-exercise-db) and
[`wrkout/exercises.json`](https://github.com/wrkout/exercises.json). RoutineForge's
own figures and copy are original and CC0.
