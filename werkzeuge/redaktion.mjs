#!/usr/bin/env node
/**
 * Mainzer Boniblatt – Redaktionswerkzeug
 *
 *   node werkzeuge/redaktion.mjs vorbereiten   offene Kandidaten aus dem Pool in arbeit/kandidaten.md schreiben
 *   node werkzeuge/redaktion.mjs abschliessen  daten/ausgaben/<heute>.json und daten/gremien-notizen.json prüfen, anreichern
 *                                              und die Webseiten-Daten bauen
 *   node werkzeuge/redaktion.mjs veroeffentlichen  wie abschliessen, danach Commit und Push – nur wenn die Prüfung bestanden ist
 *   node werkzeuge/redaktion.mjs bauen         nur die Webseiten-Daten aus allen Ausgaben neu bauen
 *
 * Optional: --datum=YYYY-MM-DD (Standard: heutiges Datum in Europe/Berlin)
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { ROOT, berlinDay, dayOffset, readJson, writeJson, cut } from "./lib.mjs";
import { FERIEN, TERMINE, festeFuer } from "./intro-feste.mjs";

const [befehl = "", ...rest] = process.argv.slice(2);
const DATUM = (rest.find(a => a.startsWith("--datum=")) || "").slice(8) || berlinDay();
const RESSORTS = {
  "jugendhilfeplanung": { name: "Jugendhilfeplanung", max: 12 },
  "fruehe-hilfen": { name: "Frühe Hilfen, Kinderschutz und Familienbildung", max: 12 },
  "quartiersmanagement": { name: "Quartiersmanagement", max: 12 },
};
const STUFEN = ["aufmacher", "wichtig", "kurz"];
const RUBRIKEN = ["mainz", "land", "bund", "fach"];
// Themen-Icons je Meldung (Feld „icon“) – Dateien unter docs/bilder/icons/hell|dunkel/<id>.svg, Bedeutung in REDAKTION.md
const ICONS = ["jugendhilfeplanung", "fruehe-hilfen", "kinderschutz", "familie", "kita", "schule", "quartier",
  "sozialraum", "gremien", "haushalt", "zahl-des-tages", "quellen", "termine"];
const OFFEN_TAGE = 4;          // Kandidaten bleiben so viele Tage „offen“
const SEITE_TAGE = 14;         // so viele Ausgaben lädt die Startseite
const ARCHIV_TAGE = 400;       // so weit reicht die Archivsuche
const NOTIZ_TAGE = 21;         // Gremien-Notizen vergangener Sitzungen so lange auf der Seite
const NOTIZ_MAX = 160;         // Zeichen je Ressort-Notiz
const HOER_MIN = 900;          // Hörfassung je Ressort (ressorts.<id>.hoerfassung): höchstens 3 Minuten, etwa 250–400 Wörter
const HOER_MAX = 2800;
const HOER_ALT_MIN = 1500;     // früheres Feld „hoerfassung“ oben (ein Text für alle Ressorts) – nur noch für alte Ausgaben
const HOER_ALT_MAX = 6000;
const LINK = /https?:\/\/|www\./i;
// Werbeflieger im Intro: Spruch des Tages (Feld „flieger“ der Ausgabe, Regeln in REDAKTION.md)
const FLIEGER_MIN = 4, FLIEGER_MAX = 34;   // Zeichen – das Banner muss auch auf dem Handy lesbar bleiben
const FLIEGER_TAGE = 30;                   // so viele Tage stehen die Sprüche in docs/daten/flieger.js
// „Was geht?“: Termine der nächsten 7 Tage (Feld „termine“ der Ausgabe, Regeln in REDAKTION.md)
const HEUTE_ARTEN = ["fussball", "sport", "markt", "flohmarkt", "fest", "musik", "party", "kino", "theater", "ausstellung", "neu", "familie", "wein", "essen", "fastnacht", "spiel", "restaurant", "ausflug", "spielzeug", "verein", "entdecken"];
// Empfehlungen: montags, mittwochs und freitags ein Tipp, reihum aus diesen Bereichen; keiner doppelt innerhalb von acht Wochen
const TIPP_ARTEN = ["restaurant", "ausflug", "spielzeug", "verein", "entdecken"], TIPP_TAGE = [1, 3, 5], TIPP_WOCHEN = 8;
const TIPP_NAMEN = { restaurant: "Restaurant oder Café", ausflug: "Unternehmung", spielzeug: "Spielzeug oder Spiel", verein: "Verein zum Mitmachen", entdecken: "besonderer Ort oder coole Sache" };
const ERGEBNISSE = ["beschlossen", "einstimmig", "mehrheitlich", "abgelehnt", "vertagt", "zurückgestellt", "zur Kenntnis"];
const HEUTE_MAX = 14, HEUTE_TAGE = 7;
const BUEHNE_MAX = 2, ART_MAX = 3;   // „Was geht?“: Konzerte + Theater zusammen höchstens 2, jede andere Art (außer Fußball) höchstens 3
const heuteListe = a => Array.isArray(a?.termine) ? a.termine.filter(x => x && typeof x === "object").map(x => Object.fromEntries(["art", "tag", "wann", "titel", "ort", "url"].map(f => [f, String(x[f] ?? "").replace(/\s+/g, " ").trim()]))) : [];
const fliegerText = a => typeof a?.flieger === "string" ? a.flieger.replace(/\s+/g, " ").trim() : "";

/** Lage für den Werbeflieger: Wetter, besondere Tage, letzte Flüge und ob er heute dran ist. */
async function fliegerLage(ausgaben) {
  const [j, m, d] = DATUM.split("-").map(Number), tag = new Date(j, m - 1, d);
  const zeit = m >= 3 && m <= 5 ? "fruehling" : m >= 6 && m <= 8 ? "sommer" : m >= 9 && m <= 11 ? "herbst" : "winter";
  let wetter = "";
  try { wetter = JSON.parse((await readFile(path.join(ROOT, "docs/daten/wetter.js"), "utf8")).match(/=(\{.*\});/)[1])[DATUM] || ""; } catch { /* ohne Wetterdatei */ }
  const anlaesse = festeFuer(tag, zeit, wetter || "sonne", 1, FERIEN, TERMINE).anlaesse;
  const frueher = ausgaben.filter(a => a.datum < DATUM && !a.nachtraeglich).sort((a, b) => b.datum.localeCompare(a.datum));
  const fluege = frueher.filter(a => fliegerText(a)).map(a => ({ datum: a.datum, spruch: fliegerText(a) }));
  const seit = frueher.findIndex(a => fliegerText(a));          // Ausgaben seit dem letzten Flug (0 = flog in der letzten Ausgabe, -1 = noch nie)
  const rat = seit === 0 ? "heute NICHT fliegen – er flog in der letzten Ausgabe (die Prüfung lehnt einen Spruch ab)"
    : seit === 1 ? "eher pausieren – nur fliegen, wenn es heute einen wirklich guten Anlass gibt"
    : seit === 2 || seit === 3 ? "heute dran (etwa jede dritte Ausgabe)" : "überfällig – heute fliegen";
  return { wochentag: tag.toLocaleDateString("de-DE", { weekday: "long" }), zeit, wetter, anlaesse, fluege, seit, rat };
}

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
  const fl = await fliegerLage(ausgaben), namen = { sonne: "sonnig", bewoelkt: "bewölkt", regen: "Regen", schnee: "Schnee", fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst", winter: "Winter" };
  md += `\n## Was geht? – Termine vom ${DATUM} bis ${dayOffset(DATUM, HEUTE_TAGE)} (Regeln: REDAKTION.md, Abschnitt „Was geht?“)\n`
    + `- Feld „termine“ der Ausgabe: 8–${HEUTE_MAX} belegte Termine der nächsten ${HEUTE_TAGE} Tage, jeder mit „tag“ (JJJJ-MM-TT).\n`
    + `- Fußball nur von FC Barcelona, Real Madrid, Spanien und Ägypten (Nationalmannschaften): deren Spiele der ${HEUTE_TAGE} Tage eintragen – die Seite zeigt je Mannschaft nur das nächste. Keine anderen Vereine.\n`
    + `- Dazu Rhein-Main (Mainz zuerst, dann Wiesbaden, Frankfurt, Ingelheim): Feste, Märkte, Sport, Familie, Essen und Wein, Neueröffnungen, Kino, Ausstellungen – nichts Nischiges. Gute Mischung: Konzerte und Theater/Bühne zusammen höchstens ${BUEHNE_MAX}, jede andere Art höchstens ${ART_MAX} (die Prüfung lehnt mehr ab); nicht alles aus einem Ticketportal holen. Nur mit Quelle; sonst das Feld weglassen.\n`;
  { // Empfehlungen: Tipp-Tag? Welcher Bereich ist dran? Was kam in den letzten acht Wochen schon?
    const frueher = ausgaben.filter(a => a.datum < DATUM && a.datum >= dayOffset(DATUM, -7 * TIPP_WOCHEN)).sort((a, b) => b.datum.localeCompare(a.datum))
      .flatMap(a => (Array.isArray(a.termine) ? a.termine : []).filter(x => TIPP_ARTEN.includes(x.art)).map(x => ({ ...x, am: a.datum })));
    const dran = TIPP_ARTEN[(TIPP_ARTEN.indexOf(frueher[0]?.art) + 1) % TIPP_ARTEN.length], tippTag = TIPP_TAGE.includes(new Date(DATUM + "T12:00:00Z").getUTCDay());
    md += `- Tipp heute: ${tippTag ? `heute ist Tipp-Tag – ein Tipp aus dem Bereich „${TIPP_NAMEN[dran]}“ (art „${dran}“)` : "heute kein fester Tipp"}; bei weniger als 8 Terminen ein bis zwei weitere Tipps zum Auffüllen.\n`
      + `- Tipps der letzten ${TIPP_WOCHEN} Wochen (nicht wiederholen): ${frueher.length ? frueher.map(x => `${x.am} ${x.art}: ${x.titel} (${x.ort})`).join(" · ") : "noch keine"}\n`;
  }
  md += `\n## Werbeflieger – Lage für heute (Regeln: REDAKTION.md, Abschnitt „Werbeflieger“)\n`
    + `- Heute: ${fl.wochentag}, ${namen[fl.zeit]}, Wetter in Mainz: ${namen[fl.wetter] || "unbekannt"}\n`
    + `- Besondere Tage im Intro heute: ${fl.anlaesse.length ? fl.anlaesse.join(", ") : "keine"}\n`
    + `- Letzte Flüge: ${fl.fluege.length ? fl.fluege.slice(0, 8).map(f => `${f.datum} „${f.spruch}“`).join(" · ") : "noch keiner"}\n`
    + `- Empfehlung: ${fl.rat}\n`;
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
  console.log(`Werbeflieger: ${fl.rat}.`);
  if (bestehend) console.log(`Hinweis: Die Ausgabe ${DATUM} existiert bereits (daten/ausgaben/${DATUM}.json). Neue Kandidaten dort einarbeiten, bestehende Meldungen behalten.`);
  if (!offen.length) console.log("Hinweis: Keine offenen Kandidaten – keine neue Ausgabe anlegen.");
}

function pruefen(ausgabe, bekannte, ausgaben = []) {
  const fehler = [];
  if (ausgabe.datum !== DATUM) fehler.push(`„datum“ muss ${DATUM} sein.`);
  // „Was geht?“ (optional): höchstens 14 Termine der nächsten 7 Tage, jeder mit Art, Tag, Titel, Ort und Quelle
  if (ausgabe.termine !== undefined && ausgabe.termine !== null) {
    if (!Array.isArray(ausgabe.termine)) fehler.push("„termine“ muss eine Liste sein (oder fehlen).");
    else {
      const termine = heuteListe(ausgabe), bis = dayOffset(DATUM, HEUTE_TAGE);
      if (termine.length > HEUTE_MAX) fehler.push(`„termine“: höchstens ${HEUTE_MAX} Termine (sind ${termine.length}).`);
      // Gute Mischung (Wunsch des Herausgebers): wenig Bühne. Konzerte und Theater zusammen höchstens zwei; auch sonst nicht viermal dasselbe.
      const jeArt = termine.reduce((z, x) => (z[x.art] = (z[x.art] || 0) + 1, z), {}), buehne = (jeArt.musik || 0) + (jeArt.theater || 0);
      if (buehne > BUEHNE_MAX) fehler.push(`„termine“: höchstens ${BUEHNE_MAX} Konzerte und Theater-/Bühnenabende zusammen (sind ${buehne}) – streichen oder durch anderes ersetzen: Feste, Märkte, Sport, Familie, Essen und Wein, Neueröffnungen, Kino, Ausstellungen, Flohmärkte.`);
      for (const [art, n] of Object.entries(jeArt)) if (n > ART_MAX && art !== "fussball") fehler.push(`„termine“: ${n}-mal „${art}“ – höchstens ${ART_MAX} je Art, damit die Mischung stimmt.`);
      termine.forEach((x, i) => {
        const wo = `„termine“ Nr. ${i + 1}`;
        if (!HEUTE_ARTEN.includes(x.art)) fehler.push(`${wo}: „art“ muss eines von ${HEUTE_ARTEN.join(", ")} sein.`);
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(x.tag) || x.tag < DATUM || x.tag > bis) fehler.push(`${wo}: „tag“ muss ein Datum von ${DATUM} bis ${bis} sein (JJJJ-MM-TT).`);
        if (x.wann.length > 16) fehler.push(`${wo}: „wann“ kurz halten (höchstens 16 Zeichen, z. B. „21 Uhr“; ganztägig: leer).`);
        if (x.titel.length < 4 || x.titel.length > 52) fehler.push(`${wo}: „titel“ muss 4–52 Zeichen lang sein (sind ${x.titel.length}).`);
        if (x.ort.length < 2 || x.ort.length > 34) fehler.push(`${wo}: „ort“ muss 2–34 Zeichen lang sein (sind ${x.ort.length}).`);
        if (!/^https:\/\/[^\s<>"]+$/.test(x.url)) fehler.push(`${wo}: „url“ muss die Quelle sein (https://…).`);
        if (/[<>{}]/.test(x.wann + x.titel + x.ort)) fehler.push(`${wo}: keine Zeichen wie < > { }.`);
      });
    }
  }
  // Werbeflieger (optional): eine kurze Zeile; nicht in zwei Ausgaben hintereinander, kein Spruch doppelt
  if (ausgabe.flieger !== undefined && ausgabe.flieger !== null && ausgabe.flieger !== "") {
    const spruch = fliegerText(ausgabe);
    if (typeof ausgabe.flieger !== "string") fehler.push("„flieger“ muss ein Text sein (oder fehlen).");
    else {
      if (spruch.length < FLIEGER_MIN || spruch.length > FLIEGER_MAX) fehler.push(`„flieger“ muss ${FLIEGER_MIN}–${FLIEGER_MAX} Zeichen lang sein (sind ${spruch.length}).`);
      if (/[<>{}\\\n\r]/.test(ausgabe.flieger) || LINK.test(spruch)) fehler.push("„flieger“: nur eine Zeile, keine Links, keine Zeichen wie < > { }.");
      const frueher = ausgaben.filter(a => a.datum < DATUM && !a.nachtraeglich).sort((a, b) => b.datum.localeCompare(a.datum));
      if (frueher[0] && fliegerText(frueher[0])) fehler.push(`„flieger“: Der Werbeflieger flog schon in der letzten Ausgabe (${frueher[0].datum}) – heute weglassen.`);
      const gleich = frueher.find(a => fliegerText(a).toLowerCase() === spruch.toLowerCase());
      if (gleich) fehler.push(`„flieger“: Diesen Spruch gab es schon am ${gleich.datum}.`);
    }
  }
  // Hörfassung (optional): reiner Sprechtext ohne Links. Neu je Ressort (ressorts.<id>.hoerfassung, siehe unten);
  // das frühere Feld oben (ein Text für alle Ressorts) bleibt für alte Ausgaben erlaubt.
  const hoerPruefen = (text, wo, min, max) => {
    if (text === undefined || text === null) return;
    if (typeof text !== "string") { fehler.push(`„${wo}“ muss ein Text sein.`); return; }
    const laenge = text.trim().length;
    if (laenge < min || laenge > max) fehler.push(`„${wo}“ muss ${min}–${max} Zeichen lang sein (sind ${laenge}).`);
    if (LINK.test(text)) fehler.push(`„${wo}“ darf keine Links enthalten.`);
  };
  hoerPruefen(ausgabe.hoerfassung, "hoerfassung", HOER_ALT_MIN, HOER_ALT_MAX);
  const r = ausgabe.ressorts || {};
  for (const id of Object.keys(r)) if (!RESSORTS[id]) fehler.push(`Unbekanntes Ressort „${id}“.`);
  for (const [id, def] of Object.entries(RESSORTS)) {
    const liste = r[id]?.meldungen;
    if (!Array.isArray(liste)) { fehler.push(`ressorts.${id}.meldungen fehlt (leere Liste ist erlaubt).`); continue; }
    // „Wusstest du schon?“ gibt es seit dem 20.11.2026 nicht mehr: die Felder „wusstest“/„zahl“ werden nicht geprüft
    // und beim Abschließen entfernt.
    hoerPruefen(r[id].hoerfassung, `${id}.hoerfassung`, HOER_MIN, HOER_MAX);
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
      if (m.icon !== undefined && !ICONS.includes(m.icon)) fehler.push(`${wo}: icon „${m.icon}“ ist nicht erlaubt (erlaubt: ${ICONS.join(", ")}).`);
      if (m.stufe !== "kurz" && (!m.kurz || m.kurz.length < 30)) fehler.push(`${wo}: Aufmacher und wichtige Meldungen brauchen „kurz“ (ein Satz).`);
      if (m.kurz && m.kurz.length > 240) fehler.push(`${wo}: „kurz“ ist länger als 240 Zeichen.`);
    });
  }
  return fehler;
}

/** Gremien-Notizen (daten/gremien-notizen.json) prüfen: { notizen: { <Sitzungs-id>: { gremium, datum, url, vorschau?, ressorts } } } */
function notizenPruefen(datei) {
  const fehler = [];
  if (!datei || typeof datei.notizen !== "object" || Array.isArray(datei.notizen)) return ["daten/gremien-notizen.json: Objekt „notizen“ fehlt."];
  for (const [id, n] of Object.entries(datei.notizen)) {
    const wo = `gremien-notizen ${id}`;
    if (!/^\d+$/.test(id)) fehler.push(`${wo}: Schlüssel muss die Sitzungs-id aus gremien.json sein.`);
    if (!n || typeof n !== "object") { fehler.push(`${wo}: Eintrag fehlt.`); continue; }
    if (!n.gremium) fehler.push(`${wo}: „gremium“ fehlt.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(n.datum || "")) fehler.push(`${wo}: „datum“ muss JJJJ-MM-TT sein.`);
    if (!/^https?:\/\//.test(n.url || "")) fehler.push(`${wo}: „url“ fehlt.`);
    if (n.vorschau !== undefined && typeof n.vorschau !== "boolean") fehler.push(`${wo}: „vorschau“ muss true sein oder fehlen.`);
    if (!n.ressorts || typeof n.ressorts !== "object" || Array.isArray(n.ressorts)) {
      fehler.push(`${wo}: „ressorts“ fehlt (altes Format mit „text“? Leeres Objekt, wenn nichts relevant ist).`);
      continue;
    }
    for (const [r, t] of Object.entries(n.ressorts)) {
      if (!RESSORTS[r]) fehler.push(`${wo}: unbekanntes Ressort „${r}“.`);
      if (typeof t !== "string" || !t.trim() || t.length > NOTIZ_MAX) fehler.push(`${wo}.${r}: Text fehlt oder ist länger als ${NOTIZ_MAX} Zeichen.`);
    }
    // „ergebnis“ (optional): je Ressort eine Liste aus den festen Wörtern – nur bei vergangenen Sitzungen mit veröffentlichtem Ergebnis
    if (n.ergebnis !== undefined) {
      if (!n.ergebnis || typeof n.ergebnis !== "object" || Array.isArray(n.ergebnis)) fehler.push(`${wo}: „ergebnis“ muss ein Objekt je Ressort sein (oder fehlen).`);
      else for (const [r, l] of Object.entries(n.ergebnis)) {
        if (!n.ressorts[r]) fehler.push(`${wo}: „ergebnis“ für „${r}“, aber keine Notiz für dieses Ressort.`);
        if (!Array.isArray(l) || !l.length || l.length > 2 || l.some(x => !ERGEBNISSE.includes(x))) fehler.push(`${wo}.${r}: „ergebnis“ ist eine Liste mit ein bis zwei Wörtern aus: ${ERGEBNISSE.join(", ")}.`);
      }
      if (n.vorschau) fehler.push(`${wo}: Eine Vorschau hat noch kein „ergebnis“.`);
    }
  }
  return fehler;
}

async function abschliessen() {
  const datei = `daten/ausgaben/${DATUM}.json`;
  const ausgabe = await readJson(datei);
  const vorbereitet = await readJson("arbeit/kandidaten.json", { kandidaten: [] });
  const pool = await poolLesen();
  const fehler = [...pruefen(ausgabe, new Set(pool.keys()), await ausgabenLesen()), ...notizenPruefen(await readJson("daten/gremien-notizen.json", { notizen: {} }))];
  if (fehler.length) {
    console.error(`Prüfung nicht bestanden – ${fehler.length} Fehler in ${datei} bzw. daten/gremien-notizen.json:\n- ` + fehler.join("\n- "));
    process.exit(2);
  }
  const quellen = Object.fromEntries((await readJson("quellen.json")).map(q => [q.id, q]));
  for (const def of Object.values(ausgabe.ressorts)) {
    def.meldungen = def.meldungen.map(m => {
      const k = pool.get(m.id);
      return {
        id: m.id, stufe: m.stufe, thema: m.thema.trim(), titel: m.titel.trim(),
        ...(m.kurz && m.stufe !== "kurz" ? { kurz: m.kurz.trim() } : {}),
        ...(m.icon ? { icon: m.icon } : {}),
        rubrik: m.rubrik || quellen[k.quelle]?.ebene || "fach",
        quelle: k.quelle, url: k.url, datum: k.datum || k.termin || k.gefunden, originaltitel: k.titel,
      };
    });
    delete def.zahl; delete def.wusstest;         // „Wusstest du schon?“ ist abgeschafft
    if (typeof def.hoerfassung === "string" && def.hoerfassung.trim()) def.hoerfassung = def.hoerfassung.replace(/\r\n?/g, "\n").trim();
    else delete def.hoerfassung;
  }
  if (typeof ausgabe.hoerfassung === "string" && ausgabe.hoerfassung.trim()) ausgabe.hoerfassung = ausgabe.hoerfassung.replace(/\r\n?/g, "\n").trim();
  else delete ausgabe.hoerfassung;
  if (fliegerText(ausgabe)) ausgabe.flieger = fliegerText(ausgabe); else delete ausgabe.flieger;
  if (heuteListe(ausgabe).length) ausgabe.termine = heuteListe(ausgabe); else delete ausgabe.termine;
  ausgabe.gesichtet = [...new Set([...(ausgabe.gesichtet || []), ...vorbereitet.kandidaten.map(k => k.id)])];
  ausgabe.erstellt = ausgabe.erstellt || new Date().toISOString();
  ausgabe.aktualisiert = new Date().toISOString();
  await writeJson(datei, ausgabe);
  await bauen();
  const zahlen = Object.entries(ausgabe.ressorts).map(([id, r]) => `${id}: ${r.meldungen.length}`).join(", ");
  console.log(`Ausgabe ${DATUM} geprüft und gespeichert (${zahlen}). ${ausgabe.gesichtet.length} Kandidaten als gesichtet markiert.`);
}

function git(args, still = false) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: still ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"] });
}

function gitVersuch(args) {
  try { git(args); return true; } catch { return false; }
}

async function veroeffentlichen() {
  await abschliessen();                       // bricht bei Prüffehlern mit Exit-Code 2 ab – dann wird nichts hochgeladen
  const identitaet = (() => { try { return git(["config", "user.email"], true).trim(); } catch { return ""; } })()
    ? [] : ["-c", "user.name=Boniblatt-Redaktion", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com"];
  // Tokenverbrauch dieses Laufs festhalten (daten/verbrauch.json, Anzeige in docs/verwaltung.html) – darf nie stören
  try { const { verbrauchErfassen } = await import("./verbrauch.mjs"); const v = await verbrauchErfassen("ausgabe", DATUM); console.log(v.fehlt ? `Verbrauch nicht erfasst: ${v.fehlt}.` : `Verbrauch erfasst: ${v.eingabe + v.cache_schreiben} Tokens neu gelesen, ${v.ausgabe} geschrieben.`); } catch (e) { console.log("Verbrauch nicht erfasst: " + e.message); }
  git(["add", "daten", "docs/daten", "quellen.json"]);
  const geaendert = (() => { try { git(["diff", "--cached", "--quiet"], true); return false; } catch { return true; } })();
  if (!geaendert) { console.log("Nichts Neues zu veröffentlichen."); return; }
  git([...identitaet, "commit", "-q", "-m", `Ausgabe ${DATUM}`]);
  for (let versuch = 1; versuch <= 3; versuch++) {
    if (gitVersuch(["push", "-q", "origin", "HEAD:main"])) { console.log(`Ausgabe ${DATUM} auf main veröffentlicht.`); return; }
    console.log(`Push auf main abgelehnt (Versuch ${versuch}) – hole den neuen Stand und versuche es erneut.`);
    if (!gitVersuch(["pull", "-q", "--rebase", "origin", "main"])) { gitVersuch(["rebase", "--abort"]); break; }
  }
  const zweig = `claude/ausgabe-${DATUM}`;
  if (gitVersuch(["push", "-q", "-f", "origin", `HEAD:${zweig}`])) {
    console.log(`Push auf main nicht möglich – Ausgabe liegt auf dem Branch ${zweig}; die Action „Ausgabe übernehmen“ führt ihn nach main.`);
    return;
  }
  console.error("Veröffentlichen fehlgeschlagen: weder main noch der Ausweich-Branch ließen sich pushen.");
  process.exit(3);
}

async function bauen() {
  const quellen = await readJson("quellen.json");
  const ausgaben = (await ausgabenLesen()).sort((a, b) => b.datum.localeCompare(a.datum));
  // Hörfassungen je Ressort stehen auf der Seite in einem eigenen Objekt neben den Meldungslisten,
  // weil ressorts.<id> dort die Liste der Meldungen ist: hoerfassungen.<id> = ressorts.<id>.hoerfassung der Ausgabe.
  const text = t => typeof t === "string" && t.trim() ? t.trim() : "";
  const schlank = a => {
    const hoerfassungen = Object.fromEntries(Object.entries(a.ressorts).map(([id, r]) => [id, text(r.hoerfassung)]).filter(([, t]) => t));
    return {
      datum: a.datum, erstellt: a.aktualisiert || a.erstellt, ...(a.nachtraeglich ? { nachtraeglich: true } : {}),
      ...(text(a.hoerfassung) ? { hoerfassung: text(a.hoerfassung) } : {}),   // früheres Feld (alte Ausgaben)
      ressorts: Object.fromEntries(Object.entries(a.ressorts).map(([id, r]) => [id, r.meldungen.map(({ originaltitel, ...m }) => m)])),
      ...(Object.keys(hoerfassungen).length ? { hoerfassungen } : {}),
      ...(heuteListe(a).length ? { termine: heuteListe(a) } : {}),   // „Was geht?“
    };
  };
  // Gremien-Notizen (von der Redaktion geschrieben) für die Webseite: vergangene Sitzungen der letzten 21 Tage mit
  // mindestens einem Ressort-Bezug, dazu alle kommenden Sitzungen (Vorschau, auch ohne Bezug).
  const notizen = await readJson("daten/gremien-notizen.json", { notizen: {} });
  const heute = berlinDay(), notizGrenze = dayOffset(heute, -NOTIZ_TAGE);
  const seitenNotizen = {};
  for (const [id, n] of Object.entries(notizen.notizen || {})) {
    if (!n || typeof n.ressorts !== "object" || !n.ressorts || !/^\d{4}-\d{2}-\d{2}$/.test(n.datum || "") || n.datum < notizGrenze) continue;
    const ressorts = Object.fromEntries(Object.entries(n.ressorts).filter(([r, t]) => RESSORTS[r] && typeof t === "string" && t.trim()));
    if (n.datum < heute && !Object.keys(ressorts).length) continue;
    const ergebnis = n.ergebnis && typeof n.ergebnis === "object" ? Object.fromEntries(Object.entries(n.ergebnis).filter(([r, l]) => ressorts[r] && Array.isArray(l))) : {};
    seitenNotizen[id] = { gremium: n.gremium, datum: n.datum, url: n.url, ...(n.vorschau ? { vorschau: true } : {}), ressorts, ...(Object.keys(ergebnis).length ? { ergebnis } : {}) };
  }
  await writeJson("docs/daten/gremien-notizen.json", { notizen: seitenNotizen }, false);
  await writeJson("docs/daten/ausgaben.json", {
    stand: new Date().toISOString(),
    erste: (ausgaben.filter(a => !a.nachtraeglich).pop() || ausgaben[ausgaben.length - 1] || { datum: DATUM }).datum,
    ressorts: Object.fromEntries(Object.entries(RESSORTS).map(([id, r]) => [id, r.name])),
    quellen: Object.fromEntries(quellen.map(q => [q.id, { name: q.name, kurz: q.kurz, ebene: q.ebene, aktiv: q.aktiv !== false }])),
    ausgaben: ausgaben.slice(0, SEITE_TAGE).map(schlank),
  }, false);
  // Sprüche des Werbefliegers je Tag – das Intro lädt die Datei wie die Wetterlage
  const fliegerAb = dayOffset(berlinDay(), -FLIEGER_TAGE);
  const sprueche = Object.fromEntries(ausgaben.filter(a => a.datum >= fliegerAb && fliegerText(a)).map(a => [a.datum, fliegerText(a)]).reverse());
  await writeFile(path.join(ROOT, "docs/daten/flieger.js"), `/* Werbeflieger im Intro: Spruch je Tag – erzeugt von werkzeuge/redaktion.mjs */\nwindow.BONIBLATT_FLIEGER=${JSON.stringify(sprueche)};\n`, "utf8");
  const grenze = dayOffset(berlinDay(), -ARCHIV_TAGE);
  const archiv = [];
  for (const a of ausgaben.filter(x => x.datum >= grenze)) {
    for (const [ressort, r] of Object.entries(a.ressorts)) {
      for (const m of r.meldungen) archiv.push([a.datum, ressort, m.stufe[0], m.thema, m.titel, m.kurz || "", m.quelle, m.url, m.rubrik || "", m.datum || "", m.icon || ""]);
    }
  }
  await writeJson("docs/daten/archiv.json", {
    felder: ["ausgabe", "ressort", "stufe", "thema", "titel", "kurz", "quelle", "url", "rubrik", "datum", "icon"],
    ausgaben: ausgaben.filter(x => x.datum >= grenze).map(a => ({ datum: a.datum, erstellt: a.aktualisiert || a.erstellt, ...(a.nachtraeglich ? { nachtraeglich: true } : {}) })),
    eintraege: archiv,
  }, false);
}

const befehle = { vorbereiten, abschliessen, veroeffentlichen, bauen };
if (!befehle[befehl]) {
  console.error("Aufruf: node werkzeuge/redaktion.mjs vorbereiten|abschliessen|veroeffentlichen|bauen [--datum=YYYY-MM-DD]");
  process.exit(1);
}
befehle[befehl]().catch(error => { console.error(error); process.exit(1); });
