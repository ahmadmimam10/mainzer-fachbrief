// Gremien-Kasten: Sitzungen, Tagesordnungen und Ergebnisse aus dem Mainzer Ratsinformationssystem (SessionNet).
// Quelle: https://bi.mainz.de  (Kalender si0046.php, Sitzung si0057.php, Tagesordnungspunkt to0050.php)
import { text, attr, parseDate, cleanUrl, berlinDay, dayOffset, UA } from "./lib.mjs";

const BASIS = "https://bi.mainz.de/";
const PARALLEL = 3;
const TIMEOUT_MS = 20_000;
const TAGE_ZURUECK = 14;
const TAGE_VOR = 60;
// Diese Gremien erscheinen immer mit ihrer nächsten Sitzung, auch jenseits des Fensters (Suche bis zu 4 weitere Monate).
const PFLICHT_GREMIEN = ["Jugendhilfeausschuss", "Sozialausschuss"];
const PFLICHT_MONATE_EXTRA = 4;
const H = 3600_000;
// Zwischenspeicher (Stunden)
const KOMMEND_MAX_ALTER_H = 12;
const ALLE_MAX_ALTER_H = 24;
// Vergangene Sitzung ohne Ergebnis: erst nach dieser Zeit erneut laden (0 = bei jedem Lauf, wie in der Vorgabe).
const OHNE_ERGEBNIS_MIN_ALTER_H = 2;

// ---------- Abruf ----------
let abrufZaehler = { kalender: 0, sitzungen: 0 };

async function holen(url, art) {
  let letzter;
  for (let versuch = 0; versuch < 2; versuch++) {
    if (versuch) await new Promise(r => setTimeout(r, 1500));
    try {
      abrufZaehler[art]++;
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "de-DE,de;q=0.9", accept: "text/html" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });
      if (!res.ok) {
        letzter = new Error(`HTTP ${res.status}`);
        if (res.status < 500 && res.status !== 429) throw letzter; // 4xx: nicht wiederholen
        continue;
      }
      return await res.text();
    } catch (e) {
      letzter = e.name === "TimeoutError" ? new Error("Zeitüberschreitung (20 s)") : e;
      if (/^HTTP 4/.test(letzter.message) && !/429/.test(letzter.message)) break;
    }
  }
  throw letzter;
}

/** Aufgaben mit höchstens n gleichzeitig ausführen. */
async function pool(liste, n, fn) {
  const out = new Array(liste.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => {
    while (i < liste.length) {
      const k = i++;
      out[k] = await fn(liste[k], k);
    }
  }));
  return out;
}

// ---------- Kalender ----------
function monateImFenster(heute) {
  const von = dayOffset(heute, -TAGE_ZURUECK).slice(0, 7);
  const bis = dayOffset(heute, TAGE_VOR).slice(0, 7);
  const out = [];
  let [j, m] = von.split("-").map(Number);
  for (;;) {
    const key = `${j}-${String(m).padStart(2, "0")}`;
    out.push({ jahr: j, monat: m, key });
    if (key >= bis) break;
    if (++m > 12) { m = 1; j++; }
  }
  return out;
}

function kalenderLesen(html) {
  const out = new Map();
  for (const m of html.matchAll(/<a\b([^>]*title="Details anzeigen:[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(m[1], "href");
    const id = (href.match(/__ksinr=(\d+)/) || [])[1];
    const titelAttr = text(attr(m[1], "title")).replace(/^Details anzeigen:\s*/i, "");
    const datum = parseDate(titelAttr);
    const gremium = titelAttr.replace(/\s*\d{1,2}\.\d{1,2}\.20\d{2}\s*$/, "").trim();
    if (!id || !datum || !gremium) continue;
    const nach = html.slice(m.index + m[0].length, m.index + m[0].length + 1200).split(/<\/td>/i)[0];
    const angaben = [...nach.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(x => text(x[1]));
    const zeitLi = angaben.find(x => /^\d{1,2}:\d{2}/.test(x)) || "";
    const zeit = (zeitLi.match(/^(\d{1,2}):(\d{2})/) || []).slice(1).map(x => x.padStart(2, "0")).join(":");
    const ort = angaben.find(x => x && x !== zeitLi) || "";
    out.set(id, { id, gremium, datum, zeit, ort, url: cleanUrl(href, BASIS) });
  }
  return [...out.values()];
}

// ---------- Tagesordnung ----------
const FRAKTION = "ÖDP|CDU|SPD|FDP|Volt|AfD|BSW|Parteilos|fraktionslos|Die\\s+Fraktion|DIE\\s+GRÜNEN|BÜNDNIS\\s*90\\s*/\\s*DIE\\s+GRÜNEN|Bündnis\\s*90\\s*/\\s*Die\\s+Grünen|GRÜNE|Grüne|Die\\s+Linke|DIE\\s+LINKE|Linke|FW|Freie\\s+Wähler|Die\\s+PARTEI|PARTEI|Piraten|Tierschutzpartei|CDU/FDP|SPD/CDU|[A-ZÄÖÜa-zäöü]+(?:\\s*,\\s*[A-ZÄÖÜ][\\wÄÖÜäöü]+)+";
const FRAKTION_RE = new RegExp(`\\s*\\(\\s*(${FRAKTION})\\s*\\)`, "gi");
// Verweis auf Nummern ("BV 0626/2025", "Antrag 0672/2026") bleibt; frei stehende Vorlagennummern fliegen raus.
const NUMMER_RE = /(?<!(?:BV|VO|Antrag|Anfrage|Vorlage|Vorlagen|Nr\.?|Drucksache|DS)\s?)\b\d{3,4}\/20\d{2}(?:\/\d+)?\b/g;
const DATEI_RE = /[\wÄÖÜäöüß\-.()]+(?:\s[\wÄÖÜäöüß\-.()]+){0,6}\.(?:pdf|docx?|xlsx?|pptx?|odt|jpe?g|png)\b/gi;

export function titelSaubern(roh) {
  const original = text(roh);
  let s = original;
  let fraktion = "";
  s = s.replace(FRAKTION_RE, (_, f) => { fraktion ||= f.replace(/\s+/g, " ").trim(); return ""; });
  s = s.replace(DATEI_RE, " ");
  // Anhangsbezeichnungen: alles ab „VO Beschlussvorlage …“, „AF SR Nov26 …“, „AN Anfrage (Stadtrat)“, „Anlage 1 …“
  s = s.replace(/\s+(?:VO|AF|AN)\s+(?:Beschlussvorlage|Anfrage|Antrag|SR|Stadtrat)\b.*$/i, "");
  s = s.replace(/^(?:VO|AF|AN)\s+(?:Beschlussvorlage|Anfrage|Antrag|SR|Stadtrat)\b\s*[-–:]?\s*/i, "");
  s = s.replace(/\s+Anlage\s+\d+.*$/i, "");
  s = s.replace(NUMMER_RE, " ");
  s = s.replace(/\(\s*\)/g, " ").replace(/\s+([,;:.)])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+/g, " ");
  s = s.replace(/^[\s\-–,;:]+|[\s\-–,;:]+$/g, "").trim();
  return { titel: s || original, fraktion };
}

const HEADING_RE = /^(?:anfragen(?: aus vorherigen sitzungen)?|anträge|antrag|beschlussvorlagen|sachstandsberichte|berichte|beratungsgegenstände|haushalt|haushaltsangelegenheiten|wahlen?|t\s?e\s?i\s?l\s+[ivx]+|[a-c]\)\s.*|stadtteilmittel|vergabeangelegenheiten|wirtschaftliche beteiligungen|ratsmitglieder bei denen .*)$/i;

const FORMALIA = [
  /^(?:eröffnung|begrüßung|feststellung|festlegung der tagesordnung|genehmigung der tagesordnung)\b/i,
  /beschlussfähigkeit/i,
  /niederschrift/i, // Genehmigung / Kenntnisnahme / Bestätigung der Niederschrift
  // reine Sammelpunkte; „Mitteilung der Verwaltung hier: …“ mit Inhalt bleibt erhalten
  /^(?:mitteilung(?:en)?|verschiedenes|sonstiges|bekanntgaben?)(?:\s*(?:und|\/|-|–)\s*(?:mitteilung(?:en)?|verschiedenes|sonstiges|öffentlich))?\s*$/i,
  /fragestunde/i,
];
const istFormalie = t => FORMALIA.some(re => re.test(t));

function artBestimmen({ titel, rawTitel, ueberschrift, vo, docs, ergebnis }) {
  const alles = `${rawTitel} ${docs.map(d => d.name).join(" ")}`;
  if (/sachstands|bericht/i.test(titel)) return "bericht";
  if (/anfrage zur sitzung|von OV beantwortet/i.test(ergebnis) || /\banfrage\b/i.test(alles) || docs.some(d => /^(?:AF|AN)\b/.test(d.name) || (d.icon === "AN" && /anfrage/i.test(d.name))) || ueberschrift === "anfrage") return "anfrage";
  if (/antrag/i.test(titel) || ueberschrift === "antrag" || docs.some(d => /\bantrag\b/i.test(d.name))) return "antrag";
  if (vo || docs.some(d => d.icon === "VO") || /\b(?:BV|VO)\b|beschlussvorlage/i.test(alles) || ueberschrift === "vorlage") return "vorlage";
  if (/bericht/i.test(ueberschrift || "")) return "bericht";
  return "sonstiges";
}

export function tagesordnungLesen(html) {
  const zeilen = [];
  let oeffentlich = true;
  for (const teil of html.split(/<tr\b/i).slice(1)) {
    const r = teil.split(/<\/tr>/i)[0];
    const trenn = r.match(/class="totrenn"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (trenn) {
      const h = text(trenn[1]);
      if (/^nicht\s?öffentlich/i.test(h)) oeffentlich = false;
      else if (/^öffentlich/i.test(h)) oeffentlich = true;
      continue;
    }
    const badge = r.match(/<td class="tofnum">\s*<span class="badge">([\s\S]*?)<\/span>/i);
    if (!badge || !oeffentlich) continue;
    const kopf = text(badge[1]);
    if (!/^Ö/.test(kopf)) continue; // Nichtöffentliches („N 1“) auslassen
    const link = r.match(/href="(to0050\.php\?[^"]*)"/i);
    const roh = (r.match(/smc_datatype_to"\s*>([\s\S]*?)<\/a>/i) || [])[1];
    if (!roh) continue;
    const nr = kopf.replace(/^Ö\s*/, "").trim();
    const beschluss = text((r.match(/<strong>\s*Beschluss:\s*<\/strong>([\s\S]*?)<\/p>/i) || [])[1] || "");
    const voM = r.match(/<td[^>]*class="[^"]*\btovo\b[^"]*"[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    const docs = [...r.matchAll(/smc-doc-symbol[^>]*>([^<]*)<\/i>[\s\S]*?type=do"[^>]*>([^<]*)<\/a>/g)]
      .map(d => ({ icon: text(d[1]), name: text(d[2]) }));
    zeilen.push({
      nr,
      rawTitel: text(roh),
      beschluss,
      vo: voM ? { nr: text(voM[2]), url: cleanUrl(attr(voM[1], "href"), BASIS) } : null,
      docs,
      url: link ? cleanUrl(link[1], BASIS) : "",
    });
  }

  const tops = [];
  let ueberschriftNr = "";
  let ueberschrift = ""; // zuletzt gesehene Zwischenüberschrift („Anfragen“, „Anträge“ …)
  zeilen.forEach((z, i) => {
    const { titel, fraktion } = titelSaubern(z.rawTitel);
    const hatKinder = !!z.nr && zeilen[i + 1]?.nr.startsWith(z.nr + ".");
    const istUeberschrift = hatKinder || (!z.vo && !z.beschluss && HEADING_RE.test(titel));
    // Numerierte Überschrift gilt nur für ihre Unterpunkte (4.1, 4.2 …); unnumerierte („Anfragen“) bis zur nächsten.
    if (ueberschriftNr && !z.nr.startsWith(ueberschriftNr + ".")) { ueberschrift = ""; ueberschriftNr = ""; }
    if (istUeberschrift) {
      ueberschriftNr = z.nr;
      const k = titel.toLowerCase();
      ueberschrift = /anfrage/.test(k) ? "anfrage" : /antr/.test(k) ? "antrag" : /beschlussvorlage/.test(k) ? "vorlage" : /sachstand|bericht/.test(k) ? "bericht" : "";
      return;
    }
    if (istFormalie(titel)) return;
    const top = {
      nr: z.nr,
      titel,
      ergebnis: z.beschluss,
      art: artBestimmen({ titel, rawTitel: z.rawTitel, ueberschrift, vo: z.vo, docs: z.docs, ergebnis: z.beschluss }),
      url: z.url,
    };
    if (fraktion) top.fraktion = fraktion;
    if (z.vo?.nr) top.vorlagenr = z.vo.nr;
    tops.push(top);
  });
  return tops;
}

// ---------- Zwischenspeicher ----------
function alterH(sitzung, jetzt) {
  const t = Date.parse(sitzung?.abgerufen || "");
  return Number.isFinite(t) ? (jetzt - t) / H : Infinity;
}

function neuLadenNoetig(alt, status, jetzt) {
  if (!alt || alt.fehler || !Array.isArray(alt.tops)) return true;
  const alter = alterH(alt, jetzt);
  if (alter > ALLE_MAX_ALTER_H) return true;
  if (status === "kommend") return alter > KOMMEND_MAX_ALTER_H;
  if (alt.status !== status) return true; // war kommend, ist jetzt vergangen: Ergebnisse holen
  const mitErgebnis = alt.tops.some(t => t.ergebnis);
  return !mitErgebnis && alter > OHNE_ERGEBNIS_MIN_ALTER_H;
}

// ---------- Hauptfunktion ----------
export async function gremienAbrufen({ heute = berlinDay(), bisher = null } = {}) {
  abrufZaehler = { kalender: 0, sitzungen: 0 };
  const jetzt = Date.now();
  const iso = new Date(jetzt).toISOString();
  const von = dayOffset(heute, -TAGE_ZURUECK);
  const bis = dayOffset(heute, TAGE_VOR);
  const alte = new Map((bisher?.sitzungen || []).map(s => [String(s.id), s]));
  const kalenderFehler = [];

  // 1) Kalender der betroffenen Monate
  const monate = monateImFenster(heute);
  const proMonat = await pool(monate, PARALLEL, async ({ jahr, monat, key }) => {
    try {
      const html = await holen(`${BASIS}si0046.php?__cjahr=${jahr}&__cmonat=${monat}&__canz=1`, "kalender");
      return kalenderLesen(html);
    } catch (e) {
      kalenderFehler.push(`Kalender ${key}: ${e.message}`);
      // Ersatz: bekannte Sitzungen dieses Monats aus dem Zwischenspeicher
      return [...alte.values()].filter(s => s.datum?.startsWith(key));
    }
  });
  const kalender = new Map();
  for (const s of proMonat.flat()) kalender.set(String(s.id), s);

  // 1b) Nächste Sitzung der Pflicht-Gremien, falls im Fenster keine liegt
  const ab = () => [...kalender.values()].filter(s => s.datum >= heute);
  const pflichtFehlt = () => PFLICHT_GREMIEN.filter(g => !ab().some(s => s.gremium === g));
  let [ej, em] = monate.at(-1).key.split("-").map(Number);
  for (let k = 0; k < PFLICHT_MONATE_EXTRA && pflichtFehlt().length; k++) {
    if (++em > 12) { em = 1; ej++; }
    try {
      for (const s of kalenderLesen(await holen(`${BASIS}si0046.php?__cjahr=${ej}&__cmonat=${em}&__canz=1`, "kalender"))) {
        if (PFLICHT_GREMIEN.includes(s.gremium)) kalender.set(String(s.id), s);
      }
    } catch (e) { kalenderFehler.push(`Kalender ${ej}-${em}: ${e.message}`); }
  }
  const pflichtNaechste = new Set(PFLICHT_GREMIEN.map(g =>
    ab().filter(s => s.gremium === g).sort((a, b) => a.datum.localeCompare(b.datum))[0]?.id).filter(Boolean).map(String));

  // 2) Fenster und Status
  const liste = [...kalender.values()]
    .filter(s => (s.datum >= von && s.datum <= bis) || pflichtNaechste.has(String(s.id)))
    .map(s => ({ ...s, status: s.datum < heute ? "vergangen" : "kommend" }))
    .sort((a, b) => a.datum.localeCompare(b.datum) || (a.zeit || "").localeCompare(b.zeit || "") || a.gremium.localeCompare(b.gremium));

  // 3) Sitzungsseiten (nur wenn nötig)
  const sitzungen = await pool(liste, PARALLEL, async s => {
    const alt = alte.get(String(s.id));
    const basis = { id: s.id, gremium: s.gremium, datum: s.datum, zeit: s.zeit || alt?.zeit || "", ort: s.ort || alt?.ort || "", url: s.url, status: s.status };
    if (!neuLadenNoetig(alt, s.status, jetzt)) {
      return { ...basis, tops: alt.tops, abgerufen: alt.abgerufen };
    }
    try {
      const html = await holen(s.url, "sitzungen");
      return { ...basis, tops: tagesordnungLesen(html), abgerufen: new Date().toISOString() };
    } catch (e) {
      // Fehler bleibt auf diese Sitzung beschränkt; bekannte Punkte aus dem Zwischenspeicher bleiben erhalten
      return { ...basis, tops: Array.isArray(alt?.tops) ? alt.tops : [], fehler: e.message, abgerufen: alt?.abgerufen || "" };
    }
  });

  const ergebnis = { stand: iso, sitzungen, abrufe: { ...abrufZaehler, gesamt: abrufZaehler.kalender + abrufZaehler.sitzungen } };
  if (kalenderFehler.length) ergebnis.fehler = kalenderFehler;
  return ergebnis;
}
