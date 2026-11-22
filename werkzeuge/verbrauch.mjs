#!/usr/bin/env node
/**
 * Verbrauch erfassen: Wie viele Tokens hat der laufende Claude-Lauf (Morgenausgabe, Qualitätssicherung) gebraucht?
 *
 * Claude Code schreibt jede Sitzung als Protokoll nach ~/.claude/projects/…/<sitzung>.jsonl; jede Antwort trägt dort ihre
 * Tokenzahlen. Dieses Werkzeug nimmt das jüngste Protokoll, zählt zusammen und hängt das Ergebnis an daten/verbrauch.json.
 * Angezeigt wird es in docs/verwaltung.html. Findet sich kein Protokoll, wird das vermerkt – der Lauf scheitert daran nie.
 *
 *   node werkzeuge/verbrauch.mjs --art=ausgabe      (ruft werkzeuge/redaktion.mjs beim Veröffentlichen selbst auf)
 *   node werkzeuge/verbrauch.mjs --art=qualitaet    (letzter Schritt der Qualitätssicherung, vor dem Commit)
 *
 * Nicht erfassbar ist der Anteil am 5-Stunden-Kontingent des Abos: Den gibt Anthropic einem Lauf nicht heraus.
 */
import { readdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { berlinDay, readJson, writeJson } from "./lib.mjs";

const BEHALTEN = 150, FRISCH_MS = 6 * 36e5;

async function protokolle(ordner, tiefe = 0, out = []) {
  for (const e of await readdir(ordner, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory() && tiefe < 3) await protokolle(p, tiefe + 1, out);
    else if (e.isFile() && e.name.endsWith(".jsonl")) out.push({ p, zeit: (await stat(p)).mtimeMs });
  }
  return out;
}

async function zaehlen(datei) {
  const je = new Map();            // Antwort-Kennung → Verbrauch (jede Antwort steht mehrfach im Protokoll, die letzte Zeile gilt)
  let erste = null, letzte = null;
  for await (const zeile of createInterface({ input: createReadStream(datei, "utf8"), crlfDelay: Infinity })) {
    if (!zeile.includes('"usage"')) continue;
    let j; try { j = JSON.parse(zeile); } catch { continue; }
    const m = j.message, u = m && m.usage;
    if (j.type !== "assistant" || !u || !m.id) continue;
    je.set(m.id, { modell: m.model || "", ein: u.input_tokens || 0, schreiben: u.cache_creation_input_tokens || 0, lesen: u.cache_read_input_tokens || 0, aus: u.output_tokens || 0 });
    if (j.timestamp) { erste ||= j.timestamp; letzte = j.timestamp; }
  }
  const s = { anfragen: je.size, eingabe: 0, cache_schreiben: 0, cache_lesen: 0, ausgabe: 0 }, modelle = new Map();
  for (const v of je.values()) { s.eingabe += v.ein; s.cache_schreiben += v.schreiben; s.cache_lesen += v.lesen; s.ausgabe += v.aus; modelle.set(v.modell, (modelle.get(v.modell) || 0) + 1); }
  const modell = [...modelle].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  return { modell, ...s, minuten: erste && letzte ? Math.round((Date.parse(letzte) - Date.parse(erste)) / 6000) / 10 : null };
}

export async function verbrauchErfassen(art = "ausgabe", datum = berlinDay()) {
  const wurzel = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "projects");
  const frisch = (await protokolle(wurzel)).filter(d => Date.now() - d.zeit < FRISCH_MS).sort((a, b) => b.zeit - a.zeit)[0];
  let eintrag = { datum, art, erfasst: new Date().toISOString() };
  if (!frisch) eintrag.fehlt = "kein Sitzungsprotokoll gefunden";
  else {
    const z = await zaehlen(frisch.p);
    eintrag = z.anfragen ? { ...eintrag, ...z } : { ...eintrag, fehlt: "Protokoll ohne Verbrauchsangaben" };
  }
  const daten = await readJson("daten/verbrauch.json", { laeufe: [] });
  daten.info = "Tokenverbrauch der Claude-Läufe, geschrieben von werkzeuge/verbrauch.mjs. eingabe = neu gelesene Tokens, cache_schreiben/cache_lesen = Zwischenspeicher, ausgabe = geschriebene Tokens.";
  daten.laeufe = [eintrag, ...(daten.laeufe || []).filter(l => !(l.datum === datum && l.art === art))].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, BEHALTEN);
  await writeJson("daten/verbrauch.json", daten);
  return eintrag;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const art = (process.argv.find(a => a.startsWith("--art=")) || "--art=ausgabe").slice(6).replace(/[^a-z]/g, "") || "ausgabe";
  const e = await verbrauchErfassen(art).catch(err => ({ fehlt: err.message }));
  console.log(e.fehlt ? `Verbrauch nicht erfasst: ${e.fehlt}.` : `Verbrauch erfasst (${e.art}): ${e.anfragen} Anfragen, ${e.eingabe + e.cache_schreiben} Tokens neu gelesen, ${e.cache_lesen} aus dem Zwischenspeicher, ${e.ausgabe} geschrieben, ${e.minuten} Minuten (${e.modell}).`);
}
