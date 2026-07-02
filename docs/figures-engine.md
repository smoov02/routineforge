# Animated figures engine

`figures-engine.js` defines the `<stick-figure>` web component: lightweight animated
stick-figure thumbnails that loop the critical portion of each lift. Vanilla ES module,
no dependencies, no build step.

**Scope:** on-screen enhancement only. The static SVGs in `figures/` remain the source
of truth and the print path — the engine animates via `requestAnimationFrame`, so a
printed page would capture an arbitrary mid-rep pose. Render the static `<img>` for
print and the component for screen:

```css
@media print  { stick-figure { display: none } .fig-static { display: block } }
@media screen { .fig-static  { display: none } }
```

## Usage

```js
import "./figures-engine.js"; // registers <stick-figure>
```

```html
<stick-figure ex="goblet-squat"></stick-figure>

<!-- themeable (e.g. for dark backgrounds) -->
<stick-figure ex="vertical-pull" stroke="#ece9dd" accent="#35c48d" ground="#4a473d"></stick-figure>
```

The SVG fills its container — size it with CSS (`width`, `aspect-ratio: 1`).

### Attributes

| Attribute | Default   | Notes |
|-----------|-----------|-------|
| `ex`      | `isolation` | Rig id (see below). Unknown ids fall back to `isolation`. |
| `stroke`  | `#2c2c2a` | Figure/limb color. |
| `accent`  | `#0f6e56` | Loaded implement (dumbbell / plate / arrow). |
| `ground`  | `#cfcdc4` | Floor, bench, box, bar. |
| `speed`   | `1`       | Playback multiplier. |

## Rigs

`goblet-squat` · `romanian-deadlift` · `overhead-press` · `db-floor-press` ·
`chest-supported-row` · `single-arm-row` · `reverse-lunge` · `db-step-up` ·
`calf-raise` · `suitcase-carry` · `dead-bug` · `vertical-pull` (pull-up) ·
`isolation` (biceps curl)

Together these cover every movement pattern in the seed set. `RIGS` is a named
export if you need to enumerate them (e.g. to decide whether an exercise gets an
animated figure or the static fallback).

## How it works

Each rig is a set of named joints, bones (joint pairs drawn as line segments), a
head, and props. Two-to-four keyframe poses capture the extremes of the rep; the
engine interpolates with an ease-in-out curve and loops (ping-pong for most lifts,
a walking cycle for carries).

Performance and accessibility:

- One shared `requestAnimationFrame` loop drives all instances at ~30 fps.
- An `IntersectionObserver` pauses figures that scroll off-screen.
- `prefers-reduced-motion` freezes each figure at a representative pose.

## Adding a new movement

Add an entry to `RIGS` in `figures-engine.js`:

```js
"my-move": {
  pattern: "squat",
  ground: [40, 112, 80, 112],           // floor line, or null
  bones: [["neck","hip"], ["hip","knee"], ["knee","foot"]],
  head: "head",
  props: [{ type: "dumbbell", at: "hand", len: 15 }],
  frames: [ { /* start pose */ }, { /* end pose */ } ],
  mode: "pp",                            // "pp" (ping-pong) or "loop"
  period: 2400                           // ms per cycle
}
```

Coordinates use `viewBox 0 0 120 120`, matching the static SVGs. Props: `dumbbell`,
`plate`, `arrow` (attach to a joint via `at`, or place with `x`/`y`).

## License

Engine code: MIT (repo license). Rig coordinate data and all static figures: CC0
(see `figures/LICENSE`).
