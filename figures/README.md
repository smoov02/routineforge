# Figures (CC0)

Plain SVG stick figures, `viewBox 0 0 120 120`, no external references. Public domain (CC0).

- `patterns/<pattern>.svg` — one per movement pattern; the fallback figure.
- `exercises/<id>.svg` — optional bespoke figure overriding the pattern for a specific lift.

Resolution order at runtime: bespoke exercise figure → pattern archetype → `patterns/placeholder.svg`.

Style: stroke `#2c2c2a`, accent `#0f6e56`, ground `#cfcdc4`, ~3.4px round-cap strokes.
Regenerate the seed set with `python3 scripts/build_figures.py`, or hand-draw and drop one in.
