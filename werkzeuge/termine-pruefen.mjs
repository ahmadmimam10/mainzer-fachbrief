#!/usr/bin/env node
// Prüft die Termintabellen der besonderen Tage (werkzeuge/intro-feste.mjs) und zeigt den Jahresplan.
//   node werkzeuge/termine-pruefen.mjs          → fehlende Einträge für dieses und das nächste Jahr + Plan für das nächste Jahr
//   node werkzeuge/termine-pruefen.mjs 2028     → Plan für 2028
// Schlägt nie fehl; die Qualitätssicherung liest die Ausgabe (siehe QUALITAET.md, „Jährliche Terminpflege“).
import { FERIEN, TERMINE, festeFuer } from "./intro-feste.mjs";

const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
const jetzt = +heute.slice(0, 4), jahr = +(process.argv[2] || jetzt + 1);
const zeit = m => m >= 3 && m <= 5 ? "fruehling" : m >= 6 && m <= 8 ? "sommer" : m >= 9 && m <= 11 ? "herbst" : "winter";
const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// 1. Fehlende Einträge
const fehlt = [];
// Im laufenden Jahr zählt nur, was noch bevorsteht (Beginnmonat nach dem aktuellen Monat).
const monat = +heute.slice(5, 7);
for (const j of [jetzt, jetzt + 1]) {
  for (const [art, name, beginn] of [["o", "Osterferien", 3], ["s", "Sommerferien", 6], ["h", "Herbstferien", 10], ["w", "Weihnachtsferien", 12]])
    if ((j > jetzt || beginn > monat) && !FERIEN.some(f => f[2] === art && +f[0].slice(0, 4) === j)) fehlt.push(`FERIEN ${j}: ${name} (Beginn ${j}) fehlen`);
  for (const [fest, beginn] of [["johannisnacht", 6], ["weinmarkt", 8]])
    if ((j > jetzt || beginn > monat) && !TERMINE[j]?.[fest]) fehlt.push(`TERMINE ${j}: ${fest} fehlt – Faustregel aktiv (auf mainz.de prüfen, sobald veröffentlicht)`);
}
console.log(fehlt.length ? "Zu ergänzen in werkzeuge/intro-feste.mjs:\n  " + fehlt.join("\n  ") : "Termintabellen vollständig.");

// 2. Plan: an welchen Tagen erscheint welcher Anlass (zusammenhängende Zeiträume)
const plan = new Map();
for (let x = new Date(jahr, 0, 1); x.getFullYear() === jahr; x = new Date(x.getFullYear(), x.getMonth(), x.getDate() + 1)) {
  for (const a of festeFuer(x, zeit(x.getMonth() + 1), "sonne", .99, FERIEN, TERMINE).anlaesse) {
    const z = plan.get(a) || []; const letzte = z.at(-1);
    if (letzte && (x - letzte[1]) / 864e5 <= 1.01) letzte[1] = x; else z.push([x, x]);
    plan.set(a, z);
  }
}
console.log(`\nPlan ${jahr} (Anlass: Tage, an denen die Motive erscheinen):`);
for (const [a, z] of plan) console.log("  " + a.padEnd(14) + z.map(([v, b]) => v.getTime() === b.getTime() ? `${WT[v.getDay()]} ${iso(v)}` : `${WT[v.getDay()]} ${iso(v)} – ${WT[b.getDay()]} ${iso(b)}`).join(", "));
