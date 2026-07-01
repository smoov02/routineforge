// util.js — string normalization + fuzzy similarity, used by the matcher.

// Whole-word abbreviation expansions applied before matching, so a spreadsheet
// that says "DB RDL" lines up with "Romanian deadlift". Add freely.
const ABBREV = {
  db: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  ohp: "overhead press",
  rdl: "romanian deadlift",
  sldl: "stiff leg deadlift",
  bw: "bodyweight",
  sa: "single arm",
  ez: "ez bar",
  bp: "bench press",
  cgbp: "close grip bench press",
  rfe: "rear foot elevated",
  bss: "bulgarian split squat",
};

// Lowercase, drop parentheticals, expand abbreviations, strip punctuation,
// collapse whitespace. Returns a clean token string.
export function normalize(raw) {
  if (!raw) return "";
  let s = String(raw).toLowerCase();
  s = s.replace(/\([^)]*\)/g, " ");          // remove (parenthetical) notes
  s = s.replace(/[^a-z0-9\s-]/g, " ");        // punctuation -> space
  s = s.replace(/-/g, " ");                   // hyphen -> space
  const tokens = s.split(/\s+/).filter(Boolean).map((t) => ABBREV[t] || t);
  return tokens.join(" ").replace(/\s+/g, " ").trim();
}

// Sorensen-Dice coefficient over character bigrams. 0..1, higher = closer.
// Robust for short labels and tolerant of typos/word-order-ish differences.
export function dice(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) || 0) + 1);
    }
    return m;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  let overlap = 0;
  for (const [g, n] of A) {
    if (B.has(g)) overlap += Math.min(n, B.get(g));
  }
  const total = a.length - 1 + (b.length - 1);
  return (2 * overlap) / total;
}
