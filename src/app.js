// app.js — wire the UI to the parse -> match -> render pipeline.

import { parseFile, parseCsvText } from "./parse.js";
import { buildIndex, matchRow } from "./match.js";
import { renderGuide } from "./render.js";

const $ = (sel) => document.querySelector(sel);

let INDEX = null;
let PATTERNS = [];

async function loadData() {
  const [exRes, patRes] = await Promise.all([
    fetch("data/exercises.json").then((r) => r.json()),
    fetch("data/patterns.json").then((r) => r.json()),
  ]);
  INDEX = buildIndex(exRes.exercises);
  PATTERNS = patRes.patterns;
}

function matchAll(rows) {
  return rows.map((row) => ({ row, match: matchRow(row.name, INDEX) }));
}

async function show(rows, title) {
  if (!rows.length) {
    $("#status").textContent = "No exercise rows found. Check that a column is named something like \u201cExercise\u201d.";
    return;
  }
  const matched = matchAll(rows);
  const miss = matched.filter((m) => m.match.confidence === "none").length;
  await renderGuide($("#guide"), title, matched, PATTERNS);
  $("#output").hidden = false;
  $("#status").textContent =
    `${rows.length} exercises${miss ? ` \u00b7 ${miss} not yet in the library` : ""}.`;
}

async function handleFile(file) {
  $("#status").textContent = `Reading ${file.name}\u2026`;
  try {
    const rows = await parseFile(file);
    const title = file.name.replace(/\.[^.]+$/, "");
    await show(rows, title);
  } catch (err) {
    console.error(err);
    $("#status").textContent = `Couldn't read that file: ${err.message}`;
  }
}

async function loadSample() {
  $("#status").textContent = "Loading sample\u2026";
  const text = await fetch("samples/full-body-ab.csv").then((r) => r.text());
  await show(parseCsvText(text), "Full-body A/B \u2014 sample");
}

function init() {
  loadData().catch((e) => {
    $("#status").textContent =
      "Couldn't load the exercise data. Are you running this through a local server? (see README)";
    console.error(e);
  });

  $("#file").addEventListener("change", (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
  $("#sample").addEventListener("click", loadSample);
  $("#print").addEventListener("click", () => window.print());

  // drag and drop
  const drop = $("#drop");
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
}

document.addEventListener("DOMContentLoaded", init);
