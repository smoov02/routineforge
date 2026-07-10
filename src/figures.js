// figures.js — resolve a match to an inline SVG string.
// Order: bespoke figures/exercises/<id>.svg  ->  figures/patterns/<pattern>.svg  ->  placeholder.
// Results are cached so each figure is fetched at most once.

const cache = new Map();

async function load(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path)
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
  cache.set(path, p);
  return p;
}

// match: from matchRow(); patterns: array from patterns.json; base: the mode's figures dir.
export async function figureFor(match, patterns, base = "figures") {
  const patternFigure = (id) => {
    const p = patterns.find((x) => x.id === id);
    return p ? p.figure : null;
  };

  // 1. bespoke figure for a known exercise (explicit field, else its id)
  if (match.entry) {
    const figId = match.entry.figure || match.entry.id;
    const bespoke = await load(`${base}/exercises/${figId}.svg`);
    if (bespoke) return bespoke;
    const pf = patternFigure(match.entry.pattern);
    if (pf) {
      const svg = await load(`${base}/patterns/${pf}.svg`);
      if (svg) return svg;
    }
  }

  // 2. pattern-only match (inferred from keywords)
  if (match.pattern) {
    const pf = patternFigure(match.pattern) || match.pattern;
    const svg = await load(`${base}/patterns/${pf}.svg`);
    if (svg) return svg;
  }

  // 3. placeholder
  return (await load(`${base}/patterns/placeholder.svg`)) || "";
}