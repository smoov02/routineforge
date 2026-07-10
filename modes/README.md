# RoutineForge — modes (v0 scaffold)

A **mode** is a domain (strength, yoga, running…) that rides the *same* engine.
Parse -> match -> build -> render -> print never changes. A mode only swaps data:
a taxonomy, a library, figures, and a manifest that tells the engine how to label things.

## Layout

    modes/
      index.json              registry the app loads first (order + enabled)
      _schema/
        mode.schema.json      contract for every mode.json
      strength/               the OG mode (retrofit of your current data/)
        mode.json
        patterns.json         <- move data/patterns.json here
        exercises.json        <- move data/exercises.json here
        figures/              <- move figures/ here
      yoga/
        mode.json
        patterns.json         worked example (pose families)
        exercises.json        worked example (2 poses, reshaped fields)
        figures/
      stretching/ mobility/ pilates/ calisthenics/ running/
      breathwork/ mindfulness/   (manifests only for now)

## The four dose-shapes

Every mode is one of four shapes. This is the only thing the engine branches on:

| shape       | figure + hero? | dose example              | modes                              |
|-------------|----------------|---------------------------|------------------------------------|
| `reps`      | yes            | 3 sets x 8-12 reps        | strength, calisthenics, pilates    |
| `hold`      | yes            | 2 rounds x 30s / 5 breaths| yoga, stretching, mobility         |
| `timed`     | yes (runner)   | 25 min / 5 km             | running                            |
| `technique` | no             | 10 min                    | breathwork, mindfulness            |

Nail these four and every future mode (cycling, rowing, sleep, PT…) is pure data.

## How the engine reads a mode (no code fork)

1. Load `index.json`, show enabled modes on the landing.
2. On pick, load `modes/<id>/mode.json`.
3. Set the shell accent from `theme.accent` (a single `--accent` CSS var recolors the UI).
4. Load `taxonomy` + `library` from the mode dir; resolve figures from `figures/`.
5. Render each card using `fields.primary/secondary` (which key -> which label) and
   `dose.primary/secondary`. The card component is identical; only labels + keys differ.

Because `fields` maps *keys*, each mode's items can keep natural key names
(strength: form/pitfalls, yoga: cue/easeoff, meditation: instruction/notice) and
strength data doesn't have to change at all.

## Theming

`theme.accent` is the mode's identity colour; `theme.soft` is its translucent
badge/fill. Current draft palette: strength green, yoga violet, stretching teal,
mobility amber, pilates rose, calisthenics blue, running coral, breathwork cyan,
mindfulness indigo. All chosen to sit on your existing dark shell.

## Label overrides

Fixed-key meta fields (equipment, dose) keep one key everywhere and let the manifest
rename them per mode via `labels` — key stays stable for validation and the engine,
display text varies. Yoga/Pilates: `"labels": { "equipment": "Props" }`. Modes that
accept the default omit the block. Use `null` to hide a tag entirely in a mode that
has no such concept, e.g. breathwork: `"labels": { "equipment": null }`.

Rule of thumb: short meta fields use fixed keys + label overrides; the two long prose
blocks still use variable keys (form vs cue) where self-documenting JSON earns its keep.

## Hero icon

`hero` is the library item whose figure becomes the mode's emblem on the landing
(strength -> goblet-squat, yoga -> warrior-2, running -> easy-run). `technique`
modes have no movement, so `hero: null` — use an abstract emblem (e.g. a breathing
ring) instead.

## Retrofit checklist for strength (do this first, it's the only migration)

- [ ] git mv data/patterns.json   modes/strength/patterns.json
- [ ] git mv data/exercises.json  modes/strength/exercises.json
- [ ] git mv figures              modes/strength/figures
- [ ] point the loader at modes/strength/ (or read modes/index.json)
- [ ] npm run validate — update its paths to walk modes/*/ instead of data/

Once strength loads from modes/strength/, adding yoga is data entry, not code.

## Status

Everything except strength is `enabled: false` in index.json — they won't show
until their libraries are filled. Ship strength alone; light up the rest one at a time.
