// builder.js — turn a small set of style parameters into a structured routine,
// assembled entirely from the local CC0 exercise library. No AI, no network.
//
// params shape (all optional; sensible defaults applied):
//   { daysPerWeek, split, sessionLength, goal, equipment: [], emphasis: [], styleSummary }
//
// Output is the shared "routine" shape consumed by render.js:
//   { title, source, disclaimer, schedule[], notes{}, workouts[{id,label,focus,exercises[]}] }

// Ordered pattern slots per split. Repeated patterns are fine — the builder
// picks distinct exercises for each slot when it can.
const SPLITS = {
  "full-body-ab": {
    days: 3,
    workouts: [
      { id: "A", label: "Workout A", focus: "squat + push focus",
        slots: ["squat", "horizontal-push", "hinge", "horizontal-pull", "carry"] },
      { id: "B", label: "Workout B", focus: "single-leg + pull focus",
        slots: ["lunge", "vertical-push", "lunge", "horizontal-pull", "core"] },
    ],
  },
  "full-body": {
    days: 3,
    workouts: [
      { id: "FB", label: "Full body", focus: "balanced, whole-body",
        slots: ["squat", "hinge", "horizontal-push", "horizontal-pull", "core"] },
    ],
  },
  "upper-lower": {
    days: 4,
    workouts: [
      { id: "U", label: "Upper", focus: "push + pull",
        slots: ["horizontal-push", "horizontal-pull", "vertical-push", "vertical-pull", "core"] },
      { id: "L", label: "Lower", focus: "legs + hinge",
        slots: ["squat", "hinge", "lunge", "calf", "core"] },
    ],
  },
};

const REP_SCHEME = {
  strength:    { sets: "3", reps: "5-8" },
  hypertrophy: { sets: "3", reps: "8-12" },
  endurance:   { sets: "2-3", reps: "12-15" },
  general:     { sets: "3", reps: "8-10" },
};

// If a pattern has no exercise available, fall back to a related one.
const ADJACENT = {
  "vertical-pull": ["horizontal-pull"],
  "vertical-push": ["horizontal-push"],
  "isolation": ["core", "calf"],
  "calf": ["isolation", "core"],
  "carry": ["core"],
};

const ACCESSORY_POOL = ["core", "calf", "isolation"];
const LENGTH_SLOTS = { short: 5, medium: 6, long: 7 };
const UNILATERAL = new Set(["lunge"]); // annotate reps as "/ leg"

function repsFor(pattern, goal) {
  const base = REP_SCHEME[goal] || REP_SCHEME.general;
  if (pattern === "carry") return { sets: base.sets, reps: "30s / side" };
  if (UNILATERAL.has(pattern)) return { sets: base.sets, reps: `${base.reps} / leg` };
  return { sets: base.sets, reps: base.reps };
}

function equipmentMatch(entry, wanted) {
  if (!wanted || !wanted.length) return true;
  const e = (entry.equipment || "").toLowerCase();
  return wanted.some((w) => e.includes(String(w).toLowerCase()));
}

// Deterministically choose an exercise for a pattern, avoiding repeats.
function pickExercise(pattern, exercises, used, wantedEquip) {
  const ofPattern = exercises.filter((e) => e.pattern === pattern);
  const rank = (list) =>
    [...list].sort((a, b) => (equipmentMatch(b, wantedEquip) - equipmentMatch(a, wantedEquip)));

  let pool = rank(ofPattern.filter((e) => !used.has(e.id)));
  if (!pool.length) {
    for (const alt of ADJACENT[pattern] || []) {
      const altPool = rank(exercises.filter((e) => e.pattern === alt && !used.has(e.id)));
      if (altPool.length) { pool = altPool; break; }
    }
  }
  if (!pool.length) pool = rank(ofPattern); // last resort: allow a repeat
  if (!pool.length) return null;            // truly nothing — drop the slot
  const chosen = pool[0];
  used.add(chosen.id);
  return chosen;
}

export function scheduleFor(workoutIds, daysPerWeek) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // pick the lifting days spread across the week
  const liftDays =
    daysPerWeek >= 5 ? [0, 1, 2, 4, 5]
    : daysPerWeek === 4 ? [0, 1, 3, 4]
    : daysPerWeek === 2 ? [0, 3]
    : [0, 2, 4]; // default 3
  let w = 0;
  return DAYS.map((day, i) => {
    if (liftDays.includes(i)) {
      const id = workoutIds[w % workoutIds.length];
      w++;
      return { day, label: `Lift ${id}`, kind: "lift" };
    }
    return { day, label: i === 6 ? "Rest / mobility" : "Walk / hike", kind: "easy" };
  });
}

export const DEFAULT_NOTES = {
  warmup: "Easy incline walk or bike for 5 minutes, then leg swings and a few bodyweight squats and hinges.",
  progress: "Start light and own the form. Add a rep each session; once you hit the top of the range on all sets, bump the weight and reset.",
  tempo: "Pair the first two and middle two moves as supersets — alternate back to back, rest about 90 seconds after each round.",
};

export function buildRoutine(params = {}, exercises) {
  const split = SPLITS[params.split] || SPLITS["full-body-ab"];
  const goal = params.goal || "general";
  const daysPerWeek = params.daysPerWeek || split.days;
  const targetSlots = LENGTH_SLOTS[params.sessionLength] || 5;
  const used = new Set();

  const workouts = split.workouts.map((w) => {
    // pad or trim slots to the requested session length
    let slots = [...w.slots];
    while (slots.length < targetSlots) {
      slots.push(ACCESSORY_POOL[(slots.length) % ACCESSORY_POOL.length]);
    }
    slots = slots.slice(0, targetSlots);

    const exercisesOut = [];
    for (const pattern of slots) {
      const ex = pickExercise(pattern, exercises, used, params.equipment);
      if (!ex) continue;
      const { sets, reps } = repsFor(ex.pattern, goal);
      exercisesOut.push({ name: ex.name, sets, reps, notes: "" });
    }
    return { id: w.id, label: w.label, focus: w.focus, exercises: exercisesOut };
  });

  return {
    title: params.title || "Your routine",
    source: params.source || "creator",
    disclaimer: params.disclaimer || null,
    schedule: scheduleFor(workouts.map((w) => w.id), daysPerWeek),
    notes: DEFAULT_NOTES,
    workouts,
    styleSummary: params.styleSummary || null,
  };
}
