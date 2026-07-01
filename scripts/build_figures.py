#!/usr/bin/env python3
"""
build_figures.py — emits the CC0 stick-figure SVG set.

Two kinds of figure:
  figures/patterns/<pattern>.svg    one per movement pattern (the fallback)
  figures/exercises/<id>.svg        bespoke overrides for specific lifts

Figures are plain SVG (viewBox 0 0 120 120), no external deps, CC0.
Re-run this whenever you add or tweak a figure. Contributors can also just
hand-draw an SVG and drop it in the right folder — this script is a convenience,
not a requirement.
"""
import os

FIG = "#2c2c2a"   # figure stroke
WT  = "#0f6e56"   # weight / accent
GR  = "#cfcdc4"   # ground / equipment

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PAT  = os.path.join(ROOT, "figures", "patterns")
EXR  = os.path.join(ROOT, "figures", "exercises")


def L(x1, y1, x2, y2, w=3.4, c=FIG):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'

def HEAD(cx, cy, r=7.5):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{FIG}" stroke-width="3.4"/>'

def GROUND(x1, x2, y=112):
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{GR}" stroke-width="2.6" stroke-linecap="round"/>'

def DBH(cx, cy, half=8):
    bar = L(cx-half, cy, cx+half, cy, 4, WT)
    e1 = f'<rect x="{cx-half-3}" y="{cy-5}" width="4.5" height="10" rx="1.5" fill="{WT}"/>'
    e2 = f'<rect x="{cx+half-1.5}" y="{cy-5}" width="4.5" height="10" rx="1.5" fill="{WT}"/>'
    return bar + e1 + e2

def BLOCK(x, y, w, h):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{WT}"/>'

def BENCH(x1, y1, x2, y2, t=8):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{GR}" stroke-width="{t}" stroke-linecap="round"/>'

def TEXT(x, y, s, size=18):
    return f'<text x="{x}" y="{y}" font-family="Helvetica,Arial,sans-serif" font-size="{size}" fill="{FIG}" text-anchor="middle">{s}</text>'

def write(folder, name, parts):
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" '
           'width="120" height="120">' + "".join(parts) + '</svg>\n')
    path = os.path.join(folder, name + ".svg")
    with open(path, "w") as f:
        f.write(svg)
    return path


# ---------------------------------------------------------------- patterns ---
patterns = {
    "squat": [
        GROUND(38, 70), L(53,112,49,84), L(49,84,71,84), L(71,84,64,50),
        HEAD(66,40), L(64,52,82,56), L(64,52,82,62),
    ],
    "hinge": [
        GROUND(44,68), L(54,112,55,86), L(55,86,52,82), L(52,82,86,62),
        HEAD(93,57), L(86,62,86,90),
    ],
    "horizontal-push": [
        GROUND(16,104), L(36,112,44,84), L(44,84,74,98), L(74,98,98,112),
        HEAD(38,80),
    ],
    "horizontal-pull": [
        GROUND(46,90), L(64,112,62,82), L(62,82,34,72), HEAD(27,68),
        L(34,72,40,82), L(40,82,34,92),
    ],
    "vertical-push": [
        GROUND(44,64), L(50,112,54,74), L(57,112,55,74), L(54,74,54,46),
        HEAD(54,36), L(54,48,44,40), L(44,40,42,26), L(54,48,64,40), L(64,40,66,26),
    ],
    "vertical-pull": [
        f'<line x1="20" y1="30" x2="100" y2="30" stroke="{GR}" stroke-width="4" stroke-linecap="round"/>',
        L(50,30,50,54), L(62,30,62,54), L(56,54,56,86), HEAD(56,44),
        L(56,86,52,110), L(56,86,60,110),
    ],
    "lunge": [
        GROUND(16,104), L(54,66,50,88), L(50,88,46,112), L(54,66,78,96),
        L(78,96,92,112), L(54,66,54,44), HEAD(54,34), L(54,46,46,66), L(54,46,62,66),
    ],
    "carry": [
        GROUND(44,64), L(50,112,53,72), L(57,112,55,72), L(54,72,54,44),
        HEAD(54,34), L(54,48,44,70), DBH(44,72), L(54,48,64,70), DBH(64,72),
    ],
    "calf": [
        GROUND(44,68), L(52,112,47,105), L(57,112,52,105), L(50,106,53,74),
        L(55,106,55,74), L(54,74,54,46), HEAD(54,36), L(54,48,46,70), L(54,48,62,70),
        f'<path d="M86 96 L86 78" stroke="{WT}" stroke-width="2.4" fill="none"/>'
        f'<path d="M82 84 L86 78 L90 84" stroke="{WT}" stroke-width="2.4" fill="none" '
        f'stroke-linecap="round" stroke-linejoin="round"/>',
    ],
    "core": [
        GROUND(16,104, 110), L(30,108,30,92), L(30,108,46,108), L(30,92,64,100),
        L(64,100,96,108), HEAD(24,90),
    ],
    "isolation": [
        GROUND(44,64), L(50,112,53,72), L(57,112,55,72), L(54,72,54,46),
        HEAD(54,36), L(54,48,52,64), L(52,64,57,54), DBH(58,52,6), L(54,48,48,68),
    ],
    "placeholder": [
        GROUND(44,64), L(50,112,53,74), L(57,112,55,74), L(54,74,54,48),
        HEAD(54,38), L(54,50,46,66), L(54,50,62,66), TEXT(54,24, "?", 20),
    ],
}

# ----------------------------------------------------- bespoke per-exercise ---
exercises = {
    "goblet-squat": [
        GROUND(40,66), L(53,112,49,84), L(49,84,71,84), L(71,84,65,50),
        HEAD(67,40), L(65,52,56,60), L(56,60,51,60), BLOCK(42,49,15,20),
    ],
    "db-floor-press": [
        GROUND(18,100,100), L(44,96,80,96), HEAD(89,96), L(44,96,32,80),
        L(32,80,24,96), L(78,96,78,66), L(72,96,68,66), DBH(78,63,7), DBH(67,63,7),
    ],
    "romanian-deadlift": [
        GROUND(44,68), L(54,112,55,86), L(55,86,52,82), L(52,82,86,62),
        HEAD(93,57), L(86,62,86,92), DBH(86,94),
    ],
    "single-arm-row": [
        GROUND(16,44,110), BENCH(20,86,66,86,7), L(30,66,64,64), HEAD(72,61),
        L(64,64,64,86), L(30,66,30,86), L(30,86,20,86), L(30,66,26,108),
        L(64,64,60,72), L(60,72,64,86), DBH(64,88),
    ],
    "suitcase-carry": [
        GROUND(44,64), L(50,112,53,72), L(57,112,55,72), L(54,72,54,44),
        HEAD(54,34), L(54,48,66,72), DBH(66,74), L(54,48,44,70),
    ],
    "db-step-up": [
        GROUND(18,104),
        f'<rect x="60" y="82" width="40" height="30" fill="none" stroke="{GR}" stroke-width="2.6"/>',
        L(50,64,64,74), L(64,74,72,82), L(50,64,44,86), L(44,86,40,112),
        L(50,64,50,40), HEAD(50,30), L(50,44,40,64), DBH(40,66), L(50,44,60,64), DBH(60,66),
    ],
    "overhead-press": [
        GROUND(44,64), L(50,112,54,74), L(57,112,55,74), L(54,74,54,46),
        HEAD(54,36), L(54,48,44,40), L(44,40,42,24), L(54,48,64,40), L(64,40,66,24),
        DBH(42,22), DBH(66,22),
    ],
    "reverse-lunge": [
        GROUND(16,104), L(54,66,50,88), L(50,88,46,112), L(54,66,78,96),
        L(78,96,92,112), L(54,66,54,44), HEAD(54,34), L(54,46,44,66), DBH(44,68),
        L(54,46,64,66), DBH(64,68),
    ],
    "chest-supported-row": [
        GROUND(20,96), BENCH(40,100,78,60,9), L(40,100,40,112), L(40,100,74,64),
        HEAD(80,58), L(40,100,34,112), L(74,64,80,74), L(80,74,74,86), DBH(74,88),
        L(70,66,76,76), L(76,76,70,88), DBH(70,90),
    ],
    "calf-raise": [
        GROUND(44,68), L(52,112,47,105), L(57,112,52,105), L(50,106,53,74),
        L(55,106,55,74), L(54,74,54,46), HEAD(54,36), L(54,48,46,70), L(54,48,62,70),
        f'<path d="M86 96 L86 78" stroke="{WT}" stroke-width="2.4" fill="none"/>'
        f'<path d="M82 84 L86 78 L90 84" stroke="{WT}" stroke-width="2.4" fill="none" '
        f'stroke-linecap="round" stroke-linejoin="round"/>',
    ],
    "dead-bug": [
        GROUND(16,100,96), L(44,92,72,92), HEAD(80,92), L(72,92,92,84),
        L(72,92,72,70), L(44,92,28,88), L(28,88,16,90), L(44,92,44,72), L(44,72,53,74),
    ],
}

count = 0
for name, parts in patterns.items():
    write(PAT, name, parts); count += 1
for name, parts in exercises.items():
    write(EXR, name, parts); count += 1
print(f"wrote {count} figures ({len(patterns)} patterns, {len(exercises)} exercises)")
