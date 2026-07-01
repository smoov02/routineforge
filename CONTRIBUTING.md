# Contributing

Two kinds of contribution carry the project: **exercise entries** and **figures**. Both are released as CC0 (public domain) — only contribute work you can dedicate to the public domain.

## Add an exercise

Append an object to `data/exercises.json` following `data/schema.json`:

```json
{
  "id": "front-squat",
  "name": "Front squat",
  "aliases": ["barbell front squat", "bb front squat"],
  "pattern": "squat",
  "equipment": "barbell",
  "form": "Bar across the front of your shoulders, elbows high. Sit down between your hips with a tall chest; drive up through mid-foot.",
  "pitfalls": "Don't let the elbows drop (the bar rolls forward). Don't cave the knees in."
}
```

Notes:
- `id` is kebab-case and stable — it's also the bespoke figure filename.
- You don't need to list abbreviation variants like `db`/`bb`/`ohp`/`rdl`; the matcher expands those automatically (see `src/util.js`).
- `pattern` must be one of the ids in `data/patterns.json`. If none fit, propose a new pattern (add it to `patterns.json` **and** add a `figures/patterns/<id>.svg`).
- Keep `form` to 2–3 sentences and `pitfalls` to 1–2. Plain, practical, no fluff.

Then:

```bash
npm run validate
```

## Add or improve a figure

Figures are plain SVG, `viewBox 0 0 120 120`, no external references, CC0.

- **Bespoke** (one exercise): `figures/exercises/<id>.svg` — overrides the archetype.
- **Archetype** (a whole movement pattern): `figures/patterns/<pattern>.svg`.

Style conventions (so the set stays cohesive):
- Figure stroke `#2c2c2a`, weight/accent `#0f6e56`, ground/equipment `#cfcdc4`.
- ~3.4px stroke, round caps. Ground line near `y=112`.
- Recognizable silhouette beats anatomical accuracy at thumbnail size.

`scripts/build_figures.py` shows how the seed figures are drawn if you'd rather generate than hand-draw, but hand-drawn SVGs dropped into the right folder are equally welcome.

## Style + scope

- Keep it dependency-light and build-step-free. The app must keep running from a plain static server.
- No tracking, no accounts, no calls home. Reading the user's file stays local to their browser.
- Guidance text is general best-form coaching, not personalized prescription.
