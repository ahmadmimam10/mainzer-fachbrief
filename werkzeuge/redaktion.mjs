#!/usr/bin/env node
/**
 * Mainzer Fachbrief – Redaktionswerkzeug
 *
 *   node werkzeuge/redaktion.mjs vorbereiten   offene Kandidaten aus dem Pool in arbeit/kandidaten.md schreiben
 *   node werkzeuge/redaktion.mjs abschliessen  daten/ausgaben/<heute>.json prüfen, anreichern und die Webseiten-Daten bauen
 *   node werkzeuge/redaktion.mjs bauen         nur die Webseiten-Daten aus allen Ausgaben neu bauen
 *
 * Optional: --datum=YYYY-MM-DD (Standard: heutiges Datum in Europe/Berlin)
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { ROOT, berlinDay, dayOffset, readJson, writeJson, cut } from "./lib.mjs";

const [befehl = "", ...rest] = process.argv.slice(2);
const DATUM = (rest.find(a => a.startsWith("--datum=")) || "").slice(8) || berlinDay();
const RESSORTS = {
  "jugendhilfeplanung": { name: "Jugendhilfeplanung", max: 12 },
  "fruehe-hilfen": { name: "Frühe Hilfen, Kinderschutz und Familienbildung", max: 12 },
  "quartiersmanagement": { name: "Quartiersmanagement", max: 12 },
};
const STUFEN = ["aufmacher", "wichtig", "kurz"];
const RUBRIKEN = ["mainz", "land", "bund", "fach"];
const OFFEN_TAGE = 4;          // Kandidaten bleiben so viele Tage „offen“
const SEITE_TAGE = 14;         // so viele Ausgaben lädt die Startseite
const ARCHIV_TAGE = 400;       // so weit reicht die Archivsuche

async function poolLesen() {
  const dir = path.join(ROOT, "daten/pool");
  const dateien = (await readdir(dir).catch(() => [])).filter(d => /^\d{8}-\d{4}\.json$/.test(d)).sort();
  const alle = new Map();
  for (const d of dateien) {
    const p = await readJson("daten/pool/" + d);
    const tag = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    for (const k of p.kandidaten || []) if (!alle.has(k.id)) alle.set(k.id, { ...k, gefunden: tag });
  }
  return alle;
}

async function ausgabenLesen() {
  const dir = path.join(ROOT, "daten/ausgaben");
  const dateien = (await readdir(dir).catch(() => [])).filter(d => /^\d{4}-\d{2}-\d{2}\.json$/.test(d)).sort();
  const out = [];
  for (const d of dateien) out.push(await readJson("daten/ausgaben/" + d));
  return out;
}

async function vorbereiten() {
  const quellen = Object.fromEntries((await readJson("quellen.json")).map(q => [q.id, q]));
  const pool = await poolLesen();
  const ausgaben = await ausgabenLesen();
  const gesichtet = new Set(ausgaben.flatMap(a => a.gesichtet || []));
  const bestehend = ausgaben.find(a => a.datum === DATUM);
  const grenze = dayOffset(DATUM, -OFFEN_TAGE);
  const offen = [...pool.values()].filter(k => !gesichtet.has(k.id) && k.gefunden >= grenze && k.gefunden <= DATUM && (!k.datum || k.datum >= grenze));

  // gruppiert nach Ebene und Quelle, damit sich die Liste gut lesen lässt
  const reihenfolge = ["mainz", "land", "bund", "fach"];
  offen.sort((a, b) => reihenfolge.indexOf(quellen[a.quelle]?.ebene) - reihenfolge.indexOf(quellen[b.quelle]?.ebene)
    || (quellen[a.quelle]?.kurz || "").localeCompare(quellen[b.quelle]?.kurz || "", "de") || (b.datum || "").localeCompare(a.datum || ""));
  await writeJson("arbeit/kandidaten.json", { datum: DATUM, kandidaten: offen });

  const titel = { mainz: "Mainz", land: "Rheinland-Pfalz", bund: "Bund und überregionale Medien", fach: "Fachwelt (Portale, Institute, Verbände)" };
  let md = `# Kandidaten für die Ausgabe vom ${DATUM}\n\n${offen.length} noch nicht gesichtete Meldungen. Format: [id] Titel (Datum) — Kurzbeschreibung der Quelle\n`;
  let ebene = "", quelle = "";
  for (const k of offen) {
    const q = quellen[k.quelle] || { kurz: k.quelle, ebene: "fach" };
    if (q.ebene !== ebene) { ebene = q.ebene; md += `\n## ${titel[ebene] || ebene}\n`; quelle = ""; }
    if (k.quelle !== quelle) { quelle = k.quelle; md += `\n### ${q.name} (Quelle: ${k.quelle})\n`; }
    const datum = k.termin ? `Termin ${k.termin}` : (k.datum || "ohne Datum");
    md += `- [${k.id}] ${k.titel} (${datum})${k.teaser ? " — " + cut(k.teaser, 260) : ""}\n`;
  }
  await mkdir(path.join(ROOT, "arbeit"), { recursive: true });
  await writeFile(path.join(ROOT, "arbeit/kandidaten.md"), md, "utf8");
  console.log(`${offen.length} offene Kandidaten in arbeit/kandidaten.md (Ausgabe ${DATUM}).`);
  if (bestehend) console.log(`Hinweis: Die Ausgabe ${DATUM} existiert bereits (daten/ausgaben/${DATUM}.json). Neue Kandidaten dort einarbeiten, bestehende Meldungen behalten.`);
  if (!offen.length) console.log("Hinweis: Keine offenen Kandidaten – keine neue Ausgabe anlegen.");
}

function pruefen(ausgabe, bekannte) {
  const fehler = [];
  if (ausgabe.datum !== DATUM) fehler.push(`„datum“ muss ${DATUM} sein.`);
  const r = ausgabe.ressorts || {};
  for (const id of Object.keys(r)) if (!RESSORTS[id]) fehler.push(`Unbekanntes Ressort „${id}“.`);
  for (const [id, def] of Object.entries(RESSORTS)) {
    const liste = r[id]?.meldungen;
    if (!Array.isArray(liste)) { fehler.push(`ressorts.${id}.meldungen fehlt (leere Liste ist erlaubt).`); continue; }
    if (liste.length > def.max) fehler.push(`${id}: höchstens ${def.max} Meldungen (sind ${liste.length}).`);
    const aufmacher = liste.filter(m => m.stufe === "aufmacher").length;
    if (liste.length && aufmacher !== 1) fehler.push(`${id}: genau ein Aufmacher nötig (sind ${aufmacher}).`);
    if (liste.length && liste[0].stufe !== "aufmacher") fehler.push(`${id}: der Aufmacher muss an erster Stelle stehen.`);
    if (liste.filter(m => m.stufe === "wichtig").length > 3) fehler.push(`${id}: höchstens 3 Meldungen mit Stufe „wichtig“.`);
    const doppelt = new Set();
    liste.forEach((m, i) => {
      const wo = `${id}[${i}]`;
      if (!bekannte.has(m.id)) fehler.push(`${wo}: id „${m.id}“ ist kein Kandidat.`);
      if (doppelt.has(m.id)) fehler.push(`${wo}: id „${m.id}“ doppelt im Ressort.`);
      doppelt.add(m.id);
      if (!STUFEN.includes(m.stufe)) fehler.push(`${wo}: stufe muss aufmacher, wichtig oder kurz sein.`);
      if (!m.thema || m.thema.length > 32) fehler.push(`${wo}: „thema“ fehlt oder ist länger als 32 Zeichen.`);
      if (!m.titel || m.titel.length > 150) fehler.push(`${wo}: „titel“ fehlt oder ist länger als 150 Zeichen.`);
      if (m.titel && m.titel === m.titel.toUpperCase() && /[A-ZÄÖÜ]{6}/.test(m.titel)) fehler.push(`${wo}: Titel steht in Großbuchstaben.`);
      if (m.rubrik && !RUBRIKEN.includes(m.rubrik)) fehler.push(`${wo}: rubrik muss mainz, land, bund oder fach sein.`);
      if (m.stufe !== "kurz" && (!m.kurz || m.kurz.length < 30)) fehler.push(`${wo}: Aufmacher und wichtige Meldungen brauchen „kurz“ (ein Satz).`);
      if (m.kurz && m.kurz.length > 240) fehler.push(`${wo}: „kurz“ ist länger als 240 Zeichen.`);
    });
  }
  return fehler;
}

async function abschliessen() {
  const datei = `daten/ausgaben/${DATUM}.json`;
  const ausgabe = await readJson(datei);
  const vorbereitet = await readJson("arbeit/kandidaten.json", { kandidaten: [] });
  const pool = await poolLesen();
  const fehler = pruefen(ausgabe, new Set(pool.keys()));
  if (fehler.length) {
    console.error(`Die Ausgabe ${datei} hat ${fehler.length} Fehler:\n- ` + fehler.join("\n- "));
    process.exit(2);
  }
  const quellen = Object.fromEntries((await readJson("quellen.json")).map(q => [q.id, q]));
  for (const def of Object.values(ausgabe.ressorts)) {
    def.meldungen = def.meldungen.map(m => {
      const k = pool.get(m.id);
      return {
        id: m.id, stufe: m.stufe, thema: m.thema.trim(), titel: m.titel.trim(),
        ...(m.kurz && m.stufe !== "kurz" ? { kurz: m.kurz.trim() } : {}),
        rubrik: m.rubrik || quellen[k.quelle]?.ebene || "fach",
        quelle: k.quelle, url: k.url, datum: k.datum || k.termin || k.gefunden, originaltitel: k.titel,
      };
    });
  }
  ausgabe.gesichtet = [...new Set([...(ausgabe.gesichtet || []), ...vorbereitet.kandidaten.map(k => k.id)])];
  ausgabe.erstellt = ausgabe.erstellt || new Date().toISOString();
  ausgabe.aktualisiert = new Date().toISOString();
  await writeJson(datei, ausgabe);
  await bauen();
  const zahlen = Object.entries(ausgabe.ressorts).map(([id, r]) => `${id}: ${r.meldungen.length}`).join(", ");
  console.log(`Ausgabe ${DATUM} geprüft und gespeichert (${zahlen}). ${ausgabe.gesichtet.length} Kandidaten als gesichtet markiert.`);
}

async function bauen() {
  const quellen = await readJson("quellen.json");
  const ausgaben = (await ausgabenLesen()).sort((a, b) => b.datum.localeCompare(a.datum));
  const schlank = a => ({
    datum: a.datum, erstellt: a.aktualisiert || a.erstellt,
    ressorts: Object.fromEntries(Object.entries(a.ressorts).map(([id, r]) => [id, r.meldungen.map(({ originaltitel, ...m }) => m)])),
  });
  await writeJson("docs/daten/ausgaben.json", {
    stand: new Date().toISOString(),
    erste: ausgaben.length ? ausgaben[ausgaben.length - 1].datum : DATUM,
    ressorts: Object.fromEntries(Object.entries(RESSORTS).map(([id, r]) => [id, r.name])),
    quellen: Object.fromEntries(quellen.map(q => [q.id, { name: q.name, kurz: q.kurz, ebene: q.ebene, aktiv: q.aktiv !== false }])),
    ausgaben: ausgaben.slice(0, SEITE_TAGE).map(schlank),
  }, false);
  const grenze = dayOffset(berlinDay(), -ARCHIV_TAGE);
  const archiv = [];
  for (const a of ausgaben.filter(x => x.datum >= grenze)) {
    for (const [ressort, r] of Object.entries(a.ressorts)) {
      for (const m of r.meldungen) archiv.push([a.datum, ressort, m.stufe[0], m.thema, m.titel, m.kurz || "", m.quelle, m.url]);
    }
  }
  await writeJson("docs/daten/archiv.json", { felder: ["ausgabe", "ressort", "stufe", "thema", "titel", "kurz", "quelle", "url"], eintraege: archiv }, false);
}

const befehle = { vorbereiten, abschliessen, bauen };
if (!befehle[befehl]) {
  console.error("Aufruf: node werkzeuge/redaktion.mjs vorbereiten|abschliessen|bauen [--datum=YYYY-MM-DD]");
  process.exit(1);
}
befehle[befehl]().catch(error => { console.error(error); process.exit(1); });
