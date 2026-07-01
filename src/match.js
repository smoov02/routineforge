// match.js — resolve a raw exercise name to the best library entry.
// Three confidence tiers: exact alias hit, fuzzy hit, pattern inference, else unknown.

import { normalize, dice } from "./util.js";

const FUZZY_THRESHOLD = 0.6;

// Keyword -> pattern, scanned in order when nothing in the library matches.
// Lets the app still show a sensible archetype figure for exercises we've
// never seen, instead of a blank.
const PATTERN_KEYWORDS = [
  [/overhead|shoulder press|push press|ohp/, "vertical-push"],
  [/pull ?up|chin ?up|pulldown|lat pull/, "vertical-pull"],
  [/bench|chest press|push ?up|dip|floor press/, "horizontal-push"],
  [/\brow\b|face pull|rear delt/, "horizontal-pull"],
  [/deadlift|rdl|hinge|good morning|hip thrust|swing/, "hinge"],
  [/lunge|split squat|step ?up|bulgarian/, "lunge"],
  [/squat|leg press|wall sit/, "squat"],
  [/carry|farmer|suitcase|waiter walk/, "carry"],
  [/plank|dead ?bug|pallof|hollow|anti.?rotation|bird ?dog|crunch|sit ?up|\babs?\b/, "core"],
  [/calf|heel raise|tibialis/, "calf"],
  [/curl|raise|extension|fly|pushdown|kickback|shrug/, "isolation"],
];

// Build a fast lookup index from the exercise library.
export function buildIndex(exercises) {
  const byNorm = new Map(); // normalized name/alias -> entry
  const entries = [];
  for (const ex of exercises) {
    const norms = new Set([ex.name, ...(ex.aliases || [])].map(normalize));
    ex._norms = [...norms];
    entries.push(ex);
    for (const n of norms) if (n && !byNorm.has(n)) byNorm.set(n, ex);
  }
  return { byNorm, entries };
}

function inferPattern(norm) {
  for (const [rx, pattern] of PATTERN_KEYWORDS) if (rx.test(norm)) return pattern;
  return null;
}

// Returns { entry|null, pattern|null, confidence: 'exact'|'fuzzy'|'pattern'|'none', via, score }
export function matchRow(rawName, index) {
  const norm = normalize(rawName);
  if (!norm) return { entry: null, pattern: null, confidence: "none", via: "empty", score: 0 };

  // 1. exact normalized alias/name hit
  if (index.byNorm.has(norm)) {
    return { entry: index.byNorm.get(norm), pattern: null, confidence: "exact", via: "alias", score: 1 };
  }

  // 2. fuzzy: best Dice score across all known names/aliases
  let best = null, bestScore = 0;
  for (const ex of index.entries) {
    for (const n of ex._norms) {
      const s = dice(norm, n);
      if (s > bestScore) { bestScore = s; best = ex; }
    }
  }
  if (best && bestScore >= FUZZY_THRESHOLD) {
    return { entry: best, pattern: null, confidence: "fuzzy", via: "similar", score: bestScore };
  }

  // 3. pattern inference from keywords
  const pattern = inferPattern(norm);
  if (pattern) {
    return { entry: null, pattern, confidence: "pattern", via: "keyword", score: 0 };
  }

  // 4. nothing
  return { entry: null, pattern: null, confidence: "none", via: "unknown", score: bestScore };
}
