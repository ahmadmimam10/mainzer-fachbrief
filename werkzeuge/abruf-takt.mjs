#!/usr/bin/env node
/**
 * Abruftakt prüfen: Welche Feeds brauchen den stündlichen Zwischenabruf – und welche nicht mehr?
 *
 * Grundlage ist daten/abruf-takt.json. Der Abruf (werkzeuge/sammeln.mjs) notiert dort je Feed-Adresse bei jedem Lauf,
 * wie viele Einträge der Feed zeigte und wie viele davon noch unbekannt waren:  [Zeit, gezeigt, unbekannt, "v"|"z"]
 * ("v" = voller Abruf alle drei Stunden, "z" = stündlicher Zwischenabruf).
 *
 * Regeln (bewusst vorsichtig, damit nichts unnötig Rechenzeit verbraucht):
 *  - Hochstufen: Ein Feed ohne Zwischenabruf zeigte in den letzten 14 Tagen bei mindestens zwei vollen Abrufen (fast) nur
 *    Unbekanntes – es gab also keine Überlappung mit dem Abruf davor, Meldungen können durchgerutscht sein. → stündlich abrufen.
 *  - Herabstufen: Ein Feed mit Zwischenabruf brachte über mindestens 10 Tage in keinem Drei-Stunden-Fenster mehr als die
 *    Hälfte seiner Länge an Neuem. → der Abruf alle drei Stunden reicht wieder.
 *
 *   node werkzeuge/abruf-takt.mjs             Bericht und Empfehlungen anzeigen, nichts ändern
 *   node werkzeuge/abruf-takt.mjs --anwenden  Empfehlungen in quellen.json eintragen (Feld "stuendlich" je Quelle)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, readJson } from "./lib.mjs";

const ANWENDEN = process.argv.includes("--anwenden");
const TAGE = 14, MIN_TAGE_HERAB = 10, FENSTER_H = 3;
const stunden = (a, b) => (Date.parse(b + ":00Z") - Date.parse(a + ":00Z")) / 36e5;

const quellen = await readJson("quellen.json");
const takt = await readJson("daten/abruf-takt.json", { adressen: {} });
const seit = new Date(Date.now() - TAGE * 864e5).toISOString().slice(0, 16);
const istStuendlich = new Map();   // Adresse → Quellen-id
for (const q of quellen) for (const u of q.stuendlich || []) istStuendlich.set(u, q.id);

const hoch = [], herab = [], zeilen = [];
for (const q of quellen.filter(q => q.aktiv !== false && q.typ === "rss")) {
  for (const adr of q.urls) {
    const alle = (takt.adressen[adr]?.beobachtungen || []);
    const b = alle.slice(1).filter(x => x[0] >= seit);      // die allererste Beobachtung zählt nicht: da ist alles „neu“
    if (!b.length) { zeilen.push(`  ?  ${q.id.padEnd(18)} noch keine Messwerte  ${adr}`); continue; }
    const laenge = Math.max(...b.map(x => x[1]));
    if (!istStuendlich.has(adr)) {
      const knapp = b.filter(x => x[3] === "v" && x[1] >= 5 && x[2] >= x[1] - 1);
      const hoechst = Math.max(...b.map(x => x[2]));
      zeilen.push(`  ${knapp.length >= 2 ? "↑" : "·"}  ${q.id.padEnd(18)} Feedlänge ${String(laenge).padStart(2)}, höchstens ${String(hoechst).padStart(2)} neu je Abruf, ${knapp.length}× ohne Überlappung  ${adr}`);
      if (knapp.length >= 2) hoch.push({ id: q.id, adr, grund: `${knapp.length}× ohne Überlappung (zuletzt ${knapp.at(-1)[0]})` });
    } else {
      // Neues je Drei-Stunden-Fenster zusammenzählen
      const fenster = new Map();
      for (const x of b) { const k = Math.floor(Date.parse(x[0] + ":00Z") / (FENSTER_H * 36e5)); fenster.set(k, (fenster.get(k) || 0) + x[2]); }
      const spitze = Math.max(...fenster.values()), spanne = stunden(b[0][0], b.at(-1)[0]) / 24;
      const ruhig = spanne >= MIN_TAGE_HERAB && spitze <= laenge / 2;
      zeilen.push(`  ${ruhig ? "↓" : "⏱"}  ${q.id.padEnd(18)} stündlich · Feedlänge ${String(laenge).padStart(2)}, Spitze ${spitze} neu in ${FENSTER_H} h, Messzeit ${spanne.toFixed(1)} Tage  ${adr}`);
      if (ruhig) herab.push({ id: q.id, adr, grund: `Spitze ${spitze} von ${laenge} in ${FENSTER_H} h über ${spanne.toFixed(0)} Tage` });
    }
  }
}

console.log(`Abruftakt – Messwerte der letzten ${TAGE} Tage (↑ sollte stündlich, ↓ braucht es nicht mehr, ⏱ bleibt stündlich):\n` + zeilen.join("\n"));
console.log(`\nEmpfehlung: ${hoch.length} hochstufen, ${herab.length} herabstufen.`);
for (const x of hoch) console.log(`  ↑ ${x.id}: ${x.adr} – ${x.grund}`);
for (const x of herab) console.log(`  ↓ ${x.id}: ${x.adr} – ${x.grund}`);

if (ANWENDEN && (hoch.length || herab.length)) {
  // quellen.json steht mit einer Quelle je Zeile im Repository; deshalb gezielt die betroffene Zeile ändern statt alles neu zu schreiben
  const datei = path.join(ROOT, "quellen.json");
  let text = await readFile(datei, "utf8");
  const ids = new Set([...hoch, ...herab].map(x => x.id));
  for (const id of ids) {
    const q = quellen.find(x => x.id === id);
    const liste = new Set(q.stuendlich || []);
    for (const x of hoch) if (x.id === id) liste.add(x.adr);
    for (const x of herab) if (x.id === id) liste.delete(x.adr);
    const zeile = text.split("\n").find(z => z.includes(`{"id":${JSON.stringify(id)},`));
    if (!zeile) { console.error(`Zeile für „${id}“ in quellen.json nicht gefunden – bitte von Hand eintragen.`); continue; }
    let neu = zeile.replace(/,"stuendlich":\[[^\]]*\]/, "");
    if (liste.size) neu = neu.replace(/\}(,?)\s*$/, `,"stuendlich":${JSON.stringify([...liste])}}$1`);
    text = text.replace(zeile, neu);
  }
  JSON.parse(text);                 // muss gültig bleiben
  await writeFile(datei, text);
  console.log("\nquellen.json angepasst. Bitte in daten/wartung.md vermerken.");
} else if (ANWENDEN) {
  console.log("\nNichts zu ändern.");
}
