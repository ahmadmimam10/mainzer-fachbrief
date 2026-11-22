#!/usr/bin/env node
/**
 * Quellen-Kontrolle: Liefert jede Quelle wirklich aktuelle Meldungen – oder läuft sie nur scheinbar?
 *
 * Der Abruf (werkzeuge/sammeln.mjs) merkt sich je Quelle in daten/quellen-zustand.json
 *   – den Zustand des letzten Abrufs (ok / auffaellig / gestoert) samt Trefferzahl,
 *   – „juengstes“: das Datum des jüngsten Eintrags, den die Quelle beim letzten Abruf zeigte,
 *   – „letzteNeu“: wann zuletzt eine Meldung neu in den Pool kam (mit Titel), und „neuTage“: wie viele an welchem Tag.
 * Dieses Werkzeug macht daraus eine Ampel je Quelle und schreibt daten/quellen-kontrolle.json (Anzeige: docs/verwaltung.html).
 *
 *   grün  „ok“          Abruf klappt und die Quelle zeigt frische Einträge
 *   gelb  „auffaellig“  der Abruf hatte zuletzt Fehler oder ungewöhnlich wenige Treffer
 *   rot   „gestoert“    der Abruf scheitert seit mehreren Läufen
 *   grau  „still“       der Abruf klappt technisch, aber die Quelle zeigt seit langem nichts Neues – genau der Fall, der sonst
 *                       monatelang unbemerkt bliebe (Seite umgezogen, Datum falsch gelesen, Liste eingefroren)
 *
 * „Lange“ heißt: länger als "takt_tage" der Quelle in quellen.json (wenn gesetzt), sonst 45 Tage.
 * Läuft nach jedem vollen Abruf (sammeln.yml) und in der Qualitätssicherung; scheitert nie.
 *
 *   node werkzeuge/quellen-kontrolle.mjs            schreibt die Datei und zeigt die Übersicht
 *   node werkzeuge/quellen-kontrolle.mjs --nur-auffaellige   zeigt nur, was nicht grün ist
 *   node werkzeuge/quellen-kontrolle.mjs --kennt=<Adresse>   Hat der Abruf diesen Artikel schon gesehen? (für die Stichprobe)
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { ROOT, berlinDay, dayOffset, readJson, writeJson, cut, idOf } from "./lib.mjs";

const STILL_TAGE = 45;
const NUR = process.argv.includes("--nur-auffaellige");
const ART = { rss: "Feed", html: "Übersichtsseite", ratsinfo: "Ratsinformationssystem", "landtag-api": "Schnittstelle des Landtags", dv: "Übersichtsseite (Sonderleser)", jadigital: "Newsletter-Archiv" };
const heute = berlinDay(), tage = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);

const kennt = (process.argv.find(a => a.startsWith("--kennt=")) || "").slice(8);
if (kennt) {
  const gesehen = (await readJson("daten/gesehen.json", { links: {} })).links || {};
  let id = ""; try { id = idOf(kennt); } catch { console.log("Das ist keine gültige Adresse."); process.exit(0); }
  console.log(gesehen[id] ? `bekannt – zuerst gesehen am ${gesehen[id]}` : "unbekannt – diesen Artikel hat der Abruf bisher nicht gesehen (oder er war beim ersten Sehen älter als drei Tage und wurde deshalb nicht gemerkt)");
  process.exit(0);
}
const quellen = await readJson("quellen.json");
const zustand = (await readJson("daten/quellen-zustand.json", { quellen: {} })).quellen || {};

// Rückfall für die erste Zeit: Was der Pool der letzten Tage über neue Meldungen weiß
const pool = {};
for (const d of (await readdir(path.join(ROOT, "daten/pool")).catch(() => [])).filter(d => /^\d{8}-\d{4}\.json$/.test(d)).sort()) {
  const tag = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  for (const k of (await readJson("daten/pool/" + d, { kandidaten: [] })).kandidaten || []) {
    const e = pool[k.quelle] ||= { neuTage: {}, juengstes: "", letzteNeu: null };
    e.neuTage[tag] = (e.neuTage[tag] || 0) + 1;
    if (k.datum && k.datum > e.juengstes && k.datum <= heute) e.juengstes = k.datum;
    e.letzteNeu = { am: tag, titel: k.titel };
  }
}

const liste = [];
for (const q of quellen) {
  const z = zustand[q.id] || {}, p = pool[q.id] || { neuTage: {} };
  const neuTage = { ...p.neuTage, ...(z.neuTage || {}) };
  const summe = n => Object.entries(neuTage).filter(([t]) => t > dayOffset(heute, -n)).reduce((s, [, x]) => s + x, 0);
  const juengstes = z.juengstes || p.juengstes || "";
  const letzteNeu = z.letzteNeu || p.letzteNeu || null;
  const grenze = Number(q.takt_tage) > 0 ? Number(q.takt_tage) : STILL_TAGE;
  const beobachtetSeit = (z.seitBeobachtung || z.seit || "").slice(0, 10) || heute;
  let ampel = "ok", grund = "";
  if (q.aktiv === false) { ampel = "pausiert"; grund = q.hinweis || "pausiert"; }
  else if (z.zustand === "gestoert") { ampel = "gestoert"; grund = z.hinweis || ""; }
  else if (z.zustand === "auffaellig") { ampel = "auffaellig"; grund = z.hinweis || ""; }
  else if (q.typ === "ratsinfo") { grund = `${z.brauchbar ?? "?"} Sitzungstermine gelesen`; }
  else if (juengstes && tage(juengstes, heute) > grenze) { ampel = "still"; grund = `jüngster Eintrag der Quelle ist vom ${juengstes} – seit ${tage(juengstes, heute)} Tagen nichts Neueres (erwartet: spätestens alle ${grenze} Tage)`; }
  else if (!juengstes && letzteNeu && tage(letzteNeu.am.slice(0, 10), heute) > grenze) { ampel = "still"; grund = `Quelle ohne Datumsangaben; zuletzt neu am ${letzteNeu.am.slice(0, 10)} – seit ${tage(letzteNeu.am.slice(0, 10), heute)} Tagen nichts Neues`; }
  else if (!juengstes && !letzteNeu && tage(beobachtetSeit, heute) > grenze) { ampel = "still"; grund = `seit Beobachtungsbeginn (${beobachtetSeit}) keine einzige neue Meldung`; }
  else grund = juengstes ? `jüngster Eintrag vom ${juengstes}` : letzteNeu ? `zuletzt neu am ${letzteNeu.am.slice(0, 10)}` : "noch keine neue Meldung seit Beobachtungsbeginn";
  liste.push({
    id: q.id, name: q.name, kurz: q.kurz || q.name, ebene: q.ebene, art: ART[q.typ] || q.typ, adressen: (q.urls || []).length, stuendlich: (q.stuendlich || []).length,
    ampel, grund: cut(grund, 260), treffer: z.brauchbar ?? null, letzterLauf: z.letzterLauf || null, juengstes,
    letzteNeu: letzteNeu ? { am: letzteNeu.am, titel: cut(letzteNeu.titel || "", 120) } : null, neu7: summe(7), neu30: summe(30), takt_tage: grenze,
  });
}
const zaehl = a => liste.filter(x => x.ampel === a).length;
const aus = { stand: new Date().toISOString(), info: "Geschrieben von werkzeuge/quellen-kontrolle.mjs. ampel: ok / auffaellig / gestoert / still (klappt technisch, zeigt aber lange nichts Neues) / pausiert.",
  zusammen: { ok: zaehl("ok"), auffaellig: zaehl("auffaellig"), gestoert: zaehl("gestoert"), still: zaehl("still"), pausiert: zaehl("pausiert") }, quellen: liste };
await writeJson("daten/quellen-kontrolle.json", aus, false).catch(() => {});

const zeichen = { ok: "✓", auffaellig: "!", gestoert: "✗", still: "…", pausiert: "–" };
console.log(`Quellen-Kontrolle ${heute}: ${aus.zusammen.ok} in Ordnung, ${aus.zusammen.auffaellig} auffällig, ${aus.zusammen.gestoert} gestört, ${aus.zusammen.still} still, ${aus.zusammen.pausiert} pausiert.`);
for (const x of liste.filter(x => !NUR || x.ampel !== "ok"))
  console.log(`  ${zeichen[x.ampel]} ${x.id.padEnd(20)} ${x.art.padEnd(16).slice(0, 16)} neu 7 T.: ${String(x.neu7).padStart(3)}  30 T.: ${String(x.neu30).padStart(3)}  ${x.grund}`);
