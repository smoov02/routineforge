/* Animated stick-figure engine — <stick-figure> web component.
   Usage:  import "./figures-engine.js";           // registers the element
           <stick-figure ex="goblet-squat"></stick-figure>
   Attributes: ex, stroke, accent, ground, speed. viewBox 0 0 120 120.
   On-screen enhancement only — static SVGs in figures/ remain the print path.
   Engine code: MIT (repo license). Rig coordinate data: CC0. */

const SVGNS = "http://www.w3.org/2000/svg";
const easeInOut = (t) => { return 0.5 - 0.5 * Math.cos(Math.PI * t); };

// ---- prop drawers (return array of svg child specs) --------------------
function dumbbell(p, len, accent) {
  len = len || 16;
  var x = p[0], y = p[1], h = len / 2, r = 2.25;
  return [
    { t: "line", a: { x1: x - h, y1: y, x2: x + h, y2: y, stroke: accent, "stroke-width": 4, "stroke-linecap": "round" } },
    { t: "rect", a: { x: x - h - r, y: y - 5, width: 4.5, height: 10, rx: 1.5, fill: accent } },
    { t: "rect", a: { x: x + h - r, y: y - 5, width: 4.5, height: 10, rx: 1.5, fill: accent } }
  ];
}
function plate(p, w, h, accent) {
  w = w || 15; h = h || 18;
  return [{ t: "rect", a: { x: p[0] - w / 2, y: p[1] - h / 2, width: w, height: h, rx: 3, fill: accent } }];
}
function arrow(x, y, accent) {
  return [
    { t: "path", a: { d: "M" + x + " " + (y + 18) + " L" + x + " " + y, stroke: accent, "stroke-width": 2.4, fill: "none", "stroke-linecap": "round" } },
    { t: "path", a: { d: "M" + (x - 4) + " " + (y + 6) + " L" + x + " " + y + " L" + (x + 4) + " " + (y + 6), stroke: accent, "stroke-width": 2.4, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" } }
  ];
}

// ---- rig library -------------------------------------------------------
// Each rig: ground, statics, bones (joint pairs), head joint, props, frames, mode, period
export const RIGS = {
  "goblet-squat": {
    pattern: "squat", label: "Goblet Squat",
    ground: [40, 112, 80, 112],
    bones: [["neck", "hip"], ["hip", "kneeL"], ["kneeL", "footL"], ["hip", "kneeR"], ["kneeR", "footR"], ["neck", "hand"], ["neck", "handB"]],
    head: "head",
    props: [{ type: "plate", at: "hand", w: 15, h: 18 }],
    frames: [
      { footL: [50, 112], footR: [70, 112], kneeL: [50, 98], kneeR: [70, 98], hip: [60, 84], neck: [60, 54], head: [60, 44], hand: [60, 62], handB: [60, 62] },
      { footL: [50, 112], footR: [70, 112], kneeL: [44, 97], kneeR: [76, 97], hip: [60, 95], neck: [60, 67], head: [60, 57], hand: [60, 75], handB: [60, 75] }
    ], mode: "pp", period: 2400
  },

  "romanian-deadlift": {
    pattern: "hinge", label: "Romanian Deadlift",
    ground: [44, 112, 68, 112],
    bones: [["foot", "knee"], ["knee", "hip"], ["hip", "neck"], ["neck", "hand"]],
    head: "head",
    props: [{ type: "dumbbell", at: "hand", len: 15 }],
    frames: [
      { foot: [54, 112], knee: [54, 90], hip: [54, 74], neck: [56, 48], head: [57, 38], hand: [56, 74] },
      { foot: [54, 112], knee: [53, 88], hip: [59, 74], neck: [84, 63], head: [92, 58], hand: [84, 92] }
    ], mode: "pp", period: 2600
  },

  "overhead-press": {
    pattern: "vertical-push", label: "Overhead Press",
    ground: [44, 112, 64, 112],
    bones: [["hip", "footL"], ["hip", "footR"], ["hip", "neck"], ["neck", "elbowL"], ["elbowL", "handL"], ["neck", "elbowR"], ["elbowR", "handR"]],
    head: "head",
    props: [{ type: "dumbbell", at: "handL", len: 15 }, { type: "dumbbell", at: "handR", len: 15 }],
    frames: [
      { footL: [49, 112], footR: [61, 112], hip: [54, 74], neck: [54, 48], head: [54, 38], elbowL: [45, 58], handL: [45, 50], elbowR: [63, 58], handR: [65, 50] },
      { footL: [49, 112], footR: [61, 112], hip: [54, 74], neck: [54, 48], head: [54, 38], elbowL: [47, 40], handL: [44, 24], elbowR: [61, 40], handR: [66, 24] }
    ], mode: "pp", period: 2200
  },

  "db-floor-press": {
    pattern: "horizontal-push", label: "DB Floor Press",
    ground: [18, 100, 100, 100],
    bones: [["hip", "shoulder"], ["hip", "knee"], ["knee", "footD"], ["shoulderA", "elbowA"], ["elbowA", "handA"], ["shoulderB", "elbowB"], ["elbowB", "handB"]],
    head: "head",
    props: [{ type: "dumbbell", at: "handA", len: 14 }, { type: "dumbbell", at: "handB", len: 14 }],
    frames: [
      { hip: [44, 96], shoulder: [80, 96], head: [89, 96], knee: [32, 80], footD: [24, 96], shoulderA: [74, 96], elbowA: [66, 86], handA: [72, 82], shoulderB: [80, 96], elbowB: [86, 86], handB: [78, 82] },
      { hip: [44, 96], shoulder: [80, 96], head: [89, 96], knee: [32, 80], footD: [24, 96], shoulderA: [74, 96], elbowA: [72, 78], handA: [71, 64], shoulderB: [80, 96], elbowB: [80, 78], handB: [79, 64] }
    ], mode: "pp", period: 2200
  },

  "chest-supported-row": {
    pattern: "horizontal-pull", label: "Chest-Supported Row",
    ground: [20, 112, 96, 112],
    statics: [{ type: "thick", a: [40, 100], b: [78, 60], w: 9 }],
    bones: [["hipB", "footA"], ["hipB", "footB"], ["hipB", "shoulder"], ["shoulderL", "elbowL"], ["elbowL", "handL"], ["shoulderR", "elbowR"], ["elbowR", "handR"]],
    head: "head",
    props: [{ type: "dumbbell", at: "handL", len: 13 }, { type: "dumbbell", at: "handR", len: 13 }],
    frames: [
      { hipB: [40, 100], footA: [40, 112], footB: [34, 112], shoulder: [74, 64], head: [80, 58], shoulderL: [74, 64], elbowL: [78, 78], handL: [72, 90], shoulderR: [74, 64], elbowR: [72, 80], handR: [64, 90] },
      { hipB: [40, 100], footA: [40, 112], footB: [34, 112], shoulder: [74, 64], head: [80, 58], shoulderL: [74, 64], elbowL: [80, 72], handL: [74, 76], shoulderR: [74, 64], elbowR: [74, 74], handR: [66, 78] }
    ], mode: "pp", period: 2000
  },

  "single-arm-row": {
    pattern: "horizontal-pull", label: "Single-Arm Row",
    ground: [16, 110, 44, 110],
    statics: [{ type: "thick", a: [20, 86], b: [66, 86], w: 7 }],
    bones: [["hipB", "shoulder"], ["hipB", "supE"], ["supE", "supH"], ["hipB", "backFoot"], ["shoulder", "elbow"], ["elbow", "hand"]],
    head: "head",
    props: [{ type: "dumbbell", at: "hand", len: 14 }],
    frames: [
      { hipB: [30, 66], shoulder: [64, 64], head: [72, 61], supE: [30, 86], supH: [20, 86], backFoot: [26, 108], elbow: [60, 74], hand: [62, 90] },
      { hipB: [30, 66], shoulder: [64, 64], head: [72, 61], supE: [30, 86], supH: [20, 86], backFoot: [26, 108], elbow: [68, 58], hand: [66, 74] }
    ], mode: "pp", period: 1900
  },

  "reverse-lunge": {
    pattern: "lunge", label: "Reverse Lunge",
    ground: [16, 112, 104, 112],
    bones: [["hip", "fKnee"], ["fKnee", "fFoot"], ["hip", "bKnee"], ["bKnee", "bFoot"], ["hip", "neck"], ["neck", "handL"], ["neck", "handR"]],
    head: "head",
    props: [{ type: "dumbbell", at: "handL", len: 15 }, { type: "dumbbell", at: "handR", len: 15 }],
    frames: [
      { hip: [54, 74], fKnee: [50, 93], fFoot: [50, 112], bKnee: [58, 93], bFoot: [58, 112], neck: [54, 52], head: [54, 42], handL: [45, 74], handR: [63, 74] },
      { hip: [54, 68], fKnee: [50, 88], fFoot: [46, 112], bKnee: [78, 96], bFoot: [92, 112], neck: [54, 46], head: [54, 36], handL: [45, 68], handR: [63, 68] }
    ], mode: "pp", period: 2600
  },

  "db-step-up": {
    pattern: "lunge", label: "DB Step-Up",
    ground: [18, 112, 104, 112],
    statics: [{ type: "rect", x: 60, y: 82, w: 40, h: 30, fill: false }],
    bones: [["hip", "neck"], ["hip", "lKnee"], ["lKnee", "lFoot"], ["hip", "tKnee"], ["tKnee", "tFoot"], ["neck", "handL"], ["neck", "handR"]],
    head: "head",
    props: [{ type: "dumbbell", at: "handL", len: 15 }, { type: "dumbbell", at: "handR", len: 15 }],
    frames: [
      { hip: [46, 74], neck: [46, 48], head: [46, 38], lKnee: [58, 74], lFoot: [72, 82], tKnee: [42, 92], tFoot: [40, 112], handL: [37, 74], handR: [55, 74] },
      { hip: [64, 58], neck: [64, 32], head: [64, 22], lKnee: [68, 72], lFoot: [72, 82], tKnee: [58, 80], tFoot: [56, 96], handL: [55, 58], handR: [73, 58] }
    ], mode: "pp", period: 2600
  },

  "calf-raise": {
    pattern: "calf", label: "Calf Raise",
    ground: [44, 112, 68, 112],
    bones: [["toeL", "ankleL"], ["ankleL", "heelL"], ["toeR", "ankleR"], ["ankleR", "heelR"], ["ankleL", "hip"], ["ankleR", "hip"], ["hip", "neck"], ["neck", "armL"], ["neck", "armR"]],
    head: "head",
    props: [{ type: "arrow", x: 86, y: 78 }],
    frames: [
      { toeL: [47, 112], ankleL: [51, 107], heelL: [45, 111], toeR: [59, 112], ankleR: [55, 107], heelR: [61, 111], hip: [53, 76], neck: [53, 48], head: [53, 38], armL: [45, 70], armR: [61, 70] },
      { toeL: [47, 112], ankleL: [50, 100], heelL: [47, 104], toeR: [59, 112], ankleR: [56, 100], heelR: [59, 104], hip: [53, 69], neck: [53, 41], head: [53, 31], armL: [45, 63], armR: [61, 63] }
    ], mode: "pp", period: 1700
  },

  "suitcase-carry": {
    pattern: "carry", label: "Suitcase Carry",
    ground: [30, 112, 90, 112],
    bones: [["hip", "neck"], ["neck", "freeH"], ["neck", "loadH"], ["hip", "kneeL"], ["kneeL", "footL"], ["hip", "kneeR"], ["kneeR", "footR"]],
    head: "head",
    props: [{ type: "dumbbell", at: "loadH", len: 15 }],
    frames: [
      { hip: [54, 74], neck: [56, 46], head: [57, 36], freeH: [46, 70], loadH: [66, 74], kneeL: [50, 92], footL: [44, 112], kneeR: [58, 92], footR: [64, 112] },
      { hip: [54, 72], neck: [56, 44], head: [57, 34], freeH: [46, 68], loadH: [66, 72], kneeL: [46, 90], footL: [40, 108], kneeR: [60, 94], footR: [70, 112] },
      { hip: [54, 74], neck: [56, 46], head: [57, 36], freeH: [46, 70], loadH: [66, 74], kneeL: [50, 92], footL: [44, 112], kneeR: [58, 92], footR: [64, 112] },
      { hip: [54, 72], neck: [56, 44], head: [57, 34], freeH: [46, 68], loadH: [66, 72], kneeL: [62, 94], footL: [68, 112], kneeR: [58, 90], footR: [50, 108] }
    ], mode: "loop", period: 1500
  },

  "dead-bug": {
    pattern: "core", label: "Dead Bug",
    ground: [16, 100, 100, 100],
    bones: [["hip", "shoulder"], ["shoulder", "hRElb"], ["hRElb", "hRHand"], ["hip", "lLKnee"], ["lLKnee", "lLFoot"], ["shoulder", "mElb"], ["mElb", "mHand"], ["hip", "mKnee"], ["mKnee", "mFoot"]],
    head: "head",
    frames: [
      { hip: [46, 92], shoulder: [70, 92], head: [80, 92], hRElb: [78, 84], hRHand: [80, 76], lLKnee: [40, 78], lLFoot: [48, 76], mElb: [62, 84], mHand: [56, 76], mKnee: [52, 78], mFoot: [60, 76] },
      { hip: [46, 92], shoulder: [70, 92], head: [80, 92], hRElb: [78, 84], hRHand: [80, 76], lLKnee: [40, 78], lLFoot: [48, 76], mElb: [58, 90], mHand: [40, 92], mKnee: [56, 88], mFoot: [74, 92] }
    ], mode: "pp", period: 2400
  },

  "vertical-pull": {
    pattern: "vertical-pull", label: "Pull-Up",
    ground: null,
    statics: [{ type: "bar", a: [20, 30], b: [100, 30], w: 4 }],
    bones: [["handL", "elbowL"], ["elbowL", "shoulderL"], ["handR", "elbowR"], ["elbowR", "shoulderR"], ["neck", "hip"], ["hip", "kneeL"], ["kneeL", "footL"], ["hip", "kneeR"], ["kneeR", "footR"]],
    head: "head",
    frames: [
      { handL: [50, 30], elbowL: [51, 44], shoulderL: [52, 56], handR: [62, 30], elbowR: [61, 44], shoulderR: [60, 56], neck: [56, 56], hip: [56, 86], head: [56, 46], kneeL: [52, 104], footL: [50, 116], kneeR: [60, 104], footR: [62, 116] },
      { handL: [50, 30], elbowL: [46, 42], shoulderL: [52, 42], handR: [62, 30], elbowR: [66, 42], shoulderR: [60, 42], neck: [56, 42], hip: [56, 70], head: [56, 32], kneeL: [50, 90], footL: [54, 104], kneeR: [62, 90], footR: [58, 104] }
    ], mode: "pp", period: 2400
  },

  "isolation": {
    pattern: "isolation", label: "Biceps Curl",
    ground: [44, 112, 64, 112],
    bones: [["hip", "footL"], ["hip", "footR"], ["hip", "neck"], ["neck", "elbow"], ["elbow", "hand"]],
    head: "head",
    props: [{ type: "dumbbell", at: "hand", len: 14 }],
    frames: [
      { footL: [50, 112], footR: [58, 112], hip: [54, 74], neck: [54, 46], head: [54, 36], elbow: [52, 64], hand: [52, 82] },
      { footL: [50, 112], footR: [58, 112], hip: [54, 74], neck: [54, 46], head: [54, 36], elbow: [52, 64], hand: [61, 53] }
    ], mode: "pp", period: 1700
  }
};

// ---- interpolation -----------------------------------------------------
function poseAt(rig, phase) {
  var f = rig.frames, n = f.length, seq, seglen;
  if (rig.mode === "loop") { seq = n; }
  else { seq = n === 2 ? 2 : (2 * (n - 1)); } // pingpong
  var g = phase * seq;
  var i = Math.floor(g) % seq;
  var u = easeInOut(g - Math.floor(g));
  var a, b;
  if (rig.mode === "loop") { a = f[i]; b = f[(i + 1) % n]; }
  else {
    if (n === 2) { a = i === 0 ? f[0] : f[1]; b = i === 0 ? f[1] : f[0]; }
    else {
      var fwd = i < (n - 1);
      var ia = fwd ? i : (seq - i);
      var ib = fwd ? i + 1 : (seq - i - 1);
      a = f[ia]; b = f[ib];
    }
  }
  var out = {};
  for (var k in a) { if (b[k]) { out[k] = [a[k][0] + (b[k][0] - a[k][0]) * u, a[k][1] + (b[k][1] - a[k][1]) * u]; } else { out[k] = a[k].slice(); } }
  return out;
}

// ---- draw --------------------------------------------------------------
function el(spec) {
  var e = document.createElementNS(SVGNS, spec.t);
  for (var k in spec.a) e.setAttribute(k, spec.a[k]);
  return e;
}
function render(svg, rig, pose, theme) {
  var kids = [];
  // ground / statics
  if (rig.ground) kids.push({ t: "line", a: { x1: rig.ground[0], y1: rig.ground[1], x2: rig.ground[2], y2: rig.ground[3], stroke: theme.ground, "stroke-width": 2.6, "stroke-linecap": "round" } });
  (rig.statics || []).forEach(function (s) {
    if (s.type === "thick") kids.push({ t: "line", a: { x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1], stroke: theme.ground, "stroke-width": s.w, "stroke-linecap": "round" } });
    else if (s.type === "bar") kids.push({ t: "line", a: { x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1], stroke: theme.ground, "stroke-width": s.w, "stroke-linecap": "round" } });
    else if (s.type === "rect") kids.push({ t: "rect", a: { x: s.x, y: s.y, width: s.w, height: s.h, fill: s.fill ? theme.ground : "none", stroke: theme.ground, "stroke-width": 2.6 } });
  });
  // bones
  rig.bones.forEach(function (bp) {
    var A = pose[bp[0]], B = pose[bp[1]];
    if (!A || !B) return;
    kids.push({ t: "line", a: { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: theme.stroke, "stroke-width": 3.4, "stroke-linecap": "round" } });
  });
  // props
  (rig.props || []).forEach(function (pr) {
    var p = pr.at ? pose[pr.at] : [pr.x, pr.y];
    if (pr.type === "dumbbell") dumbbell(p, pr.len, theme.accent).forEach(function (s) { kids.push(s); });
    else if (pr.type === "plate") plate(p, pr.w, pr.h, theme.accent).forEach(function (s) { kids.push(s); });
    else if (pr.type === "arrow") arrow(pr.x, pr.y, theme.accent).forEach(function (s) { kids.push(s); });
  });
  // head
  if (rig.head && pose[rig.head]) kids.push({ t: "circle", a: { cx: pose[rig.head][0], cy: pose[rig.head][1], r: 7.5, fill: "none", stroke: theme.stroke, "stroke-width": 3.4 } });

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  kids.forEach(function (s) { svg.appendChild(el(s)); });
}

// ---- shared animation loop --------------------------------------------
const active = [];
let running = false;
let last = 0;
function tick(now) {
  if (!active.length) { running = false; return; }
  running = true;
  if (now - last > 33) { // ~30fps
    last = now;
    for (var i = 0; i < active.length; i++) active[i]._frame(now);
  }
  requestAnimationFrame(tick);
}
function ensure() { if (!running) requestAnimationFrame(tick); }

// ---- custom element ------------------------------------------------------
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class StickFigure extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.display = "block";
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";
    svg.style.overflow = "visible";
    this.appendChild(svg);
    this._svg = svg;
    this._start = performance.now() - Math.random() * 2000; // desync
    this._visible = true;
    this._draw(this._start);

    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          this._visible = e.isIntersecting;
          if (e.isIntersecting) this._enable(); else this._disable();
        });
      }, { rootMargin: "80px" });
      this._io.observe(this);
    } else { this._enable(); }
  }
  disconnectedCallback() { this._disable(); if (this._io) this._io.disconnect(); }

  _theme() {
    return {
      stroke: this.getAttribute("stroke") || "#2c2c2a",
      accent: this.getAttribute("accent") || "#0f6e56",
      ground: this.getAttribute("ground") || "#cfcdc4"
    };
  }
  _rig() { return RIGS[this.getAttribute("ex")] || RIGS["isolation"]; }

  _draw(now) {
    const rig = this._rig(); if (!rig) return;
    const speed = parseFloat(this.getAttribute("speed") || "1") || 1;
    const phase = reduce ? 0.42 : (((now - this._start) * speed) % rig.period) / rig.period;
    render(this._svg, rig, poseAt(rig, phase), this._theme());
  }
  _frame(now) { if (this._visible) this._draw(now); }
  _enable() {
    if (reduce) return;
    if (active.indexOf(this) === -1) active.push(this);
    ensure();
  }
  _disable() {
    const i = active.indexOf(this); if (i !== -1) active.splice(i, 1);
  }
}

if (!customElements.get("stick-figure")) customElements.define("stick-figure", StickFigure);

export { StickFigure };
