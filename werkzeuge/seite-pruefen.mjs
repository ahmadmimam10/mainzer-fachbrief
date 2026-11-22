#!/usr/bin/env node
/**
 * Webseite prüfen – für die wöchentliche Qualitätssicherung (QUALITAET.md, Schritt 9).
 *
 * Prüft ohne Browser, was sich sicher prüfen lässt:
 *  1. Skripte in docs/blatt/ haben keinen Syntaxfehler
 *  2. Verweise in den Seiten (src/href auf eigene Dateien) zeigen nicht ins Leere
 *  3. Gewicht: Die Startseite und ihre Daten bleiben unter festen Grenzen (GRENZEN unten)
 *  4. Daten: Die Seitendaten sind lesbar, die jüngste Ausgabe ist nicht älter als fünf Tage
 *  5. mit --live: Die veröffentlichte Seite antwortet und entspricht dem Stand im Repository
 *
 *   node werkzeuge/seite-pruefen.mjs          lokale Prüfung
 *   node werkzeuge/seite-pruefen.mjs --live   zusätzlich die veröffentlichte Seite abrufen
 *
 * Ende immer mit Code 0; Befunde stehen unter „Befunde“. Keine Befunde = alles in Ordnung.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { ROOT, UA, berlinDay, dayOffset } from "./lib.mjs";

const LIVE = process.argv.includes("--live");
const BASIS = "https://boniblatt-mainz.de/";
const DOCS = path.join(ROOT, "docs");
const SEITEN = ["index.html", "ueber.html", "kalender.html", "verwaltung.html"];
// Grenzen in Kilobyte – etwa das Anderthalbfache des Stands vom 22.11.2026. Wird eine überschritten, die Ursache suchen
// (zu viele Tage in den Seitendaten? versehentlich eingebettete Bilder?), nicht einfach die Grenze anheben.
const GRENZEN = { "index.html": 520, "blatt/bb.js": 70, "blatt/bb.css": 100, "daten/ausgaben.json": 160, "daten/gremien.json": 220, "daten/archiv.json": 400 };
const START = ["index.html", "blatt/schrift.css", "blatt/bb.css", "blatt/gemeinsam.js", "blatt/bb.js", "blatt/zaehlung.js", "daten/wetter.js", "daten/wetter7.js", "daten/flieger.js", "daten/ausgaben.json", "daten/gremien.json", "daten/gremien-notizen.json", "daten/termine.json"];
const START_GRENZE = 950;

const befunde = [], gut = [];
const groesse = async rel => (await stat(path.join(DOCS, rel)).catch(() => null))?.size ?? null;
const kb = n => (n / 1024).toFixed(0) + " kB";

// 1. Skripte
const skripte = (await readdir(path.join(DOCS, "blatt"))).filter(d => d.endsWith(".js"));
for (const d of skripte) {
  try { execFileSync(process.execPath, ["--check", path.join(DOCS, "blatt", d)], { stdio: "pipe" }); }
  catch (e) { befunde.push(`Syntaxfehler in docs/blatt/${d}: ${String(e.stderr || e.message).split("\n").filter(Boolean).slice(0, 3).join(" | ")}`); }
}
gut.push(`${skripte.length} Skripte ohne Syntaxfehler geprüft`);

// 2. Verweise auf eigene Dateien
let verweise = 0;
for (const seite of SEITEN) {
  const html = await readFile(path.join(DOCS, seite), "utf8").catch(() => null);
  if (html === null) { befunde.push(`docs/${seite} fehlt`); continue; }
  const ziele = new Set([...html.matchAll(/\b(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)].map(m => m[1])
    .filter(r => !/^(https?:|mailto:|data:|\/\/)/.test(r) && !/[${}'+\s<>]/.test(r) && !/^\.?\/?$/.test(r)));
  for (const r of ziele) {
    verweise++;
    const s = await stat(path.join(DOCS, r)).catch(() => null);
    if (!s) befunde.push(`docs/${seite}: Verweis „${r}“ zeigt ins Leere`);
  }
}
gut.push(`${verweise} Verweise auf eigene Dateien geprüft`);

// 3. Gewicht
for (const [rel, grenze] of Object.entries(GRENZEN)) {
  const g = await groesse(rel);
  if (g === null) befunde.push(`docs/${rel} fehlt`);
  else if (g > grenze * 1024) befunde.push(`docs/${rel} ist mit ${kb(g)} größer als die Grenze von ${grenze} kB`);
}
let summe = 0; for (const rel of START) summe += (await groesse(rel)) || 0;
if (summe > START_GRENZE * 1024) befunde.push(`Die Startseite lädt mit ihren Daten ${kb(summe)} – Grenze ${START_GRENZE} kB`);
gut.push(`Startseite mit Daten: ${kb(summe)} (Grenze ${START_GRENZE} kB)`);

// 4. Daten
for (const rel of ["daten/ausgaben.json", "daten/gremien.json", "daten/gremien-notizen.json", "daten/status.json", "daten/archiv.json", "daten/termine.json"]) {
  try { JSON.parse(await readFile(path.join(DOCS, rel), "utf8")); } catch (e) { befunde.push(`docs/${rel} ist nicht lesbar: ${e.message}`); }
}
try {
  const a = JSON.parse(await readFile(path.join(DOCS, "daten/ausgaben.json"), "utf8"));
  const juengste = (a.ausgaben || []).map(x => x.datum).sort().at(-1);
  if (!juengste) befunde.push("In docs/daten/ausgaben.json steht keine Ausgabe");
  else if (juengste < dayOffset(berlinDay(), -5)) befunde.push(`Die jüngste Ausgabe ist vom ${juengste} – älter als fünf Tage`);
  else gut.push(`jüngste Ausgabe: ${juengste}`);
} catch { /* oben gemeldet */ }

// 5. Veröffentlichte Seite
if (LIVE) {
  const holen = async rel => {
    const t0 = Date.now();
    try { const r = await fetch(BASIS + rel, { headers: { "User-Agent": UA, "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(20000) }); return { status: r.status, laenge: (await r.arrayBuffer()).byteLength, ms: Date.now() - t0 }; }
    catch (e) { return { status: 0, fehler: e.message, ms: Date.now() - t0 }; }
  };
  for (const rel of ["", "ueber.html", "kalender.html", "blatt/bb.js", "blatt/bb.css", "daten/ausgaben.json", "daten/gremien.json"]) {
    const r = await holen(rel), lokal = await groesse(rel || "index.html");
    if (r.status !== 200) befunde.push(`Live: ${BASIS}${rel} antwortet mit ${r.status || r.fehler}`);
    else if (lokal !== null && r.laenge !== lokal) befunde.push(`Live: ${BASIS}${rel} hat ${r.laenge} Bytes, im Repository sind es ${lokal} – Veröffentlichung hängt nach (bei frischem Commit normal, sonst .github/workflows/seite.yml prüfen)`);
    else gut.push(`Live ${rel || "Startseite"}: 200 in ${r.ms} ms`);
  }
}

console.log("Webseiten-Prüfung\n" + gut.map(z => "  ✓ " + z).join("\n"));
console.log(befunde.length ? "\nBefunde:\n" + befunde.map(z => "  ✗ " + z).join("\n") : "\nKeine Befunde.");
