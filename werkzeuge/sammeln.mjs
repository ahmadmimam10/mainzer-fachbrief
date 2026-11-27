#!/usr/bin/env node
/**
 * Mainzer Boniblatt – Quellenabruf
 *
 * Ruft alle Quellen aus quellen.json ab und legt neue Meldungen als Kandidaten im Pool ab
 * (daten/pool/<Zeitpunkt>.json). Sitzungstermine aus dem Ratsinformationssystem landen in
 * docs/daten/termine.json, der Abrufstatus je Quelle in docs/daten/status.json.
 *
 * Qualitätsschranken: Ein Kandidat kommt nur in den Pool, wenn Titel und Link plausibel sind und der Link
 * erreichbar ist (Linkprüfung). Verworfene Kandidaten werden nicht als bekannt gemerkt und beim nächsten Lauf
 * erneut geprüft. Den Zustand je Quelle (ok / auffaellig / gestoert, mit Verlauf) schreibt der Abruf nach
 * daten/quellen-zustand.json; von auffälligen HTML- und Sonderquellen legt er das zuletzt geladene Rohmaterial
 * unter daten/diagnose/ ab (Reparatur: REDAKTION.md, Abschnitt „Quellenpflege“).
 *
 *   node werkzeuge/sammeln.mjs                normaler Lauf
 *   node werkzeuge/sammeln.mjs --probe        nur testen und anzeigen, nichts speichern
 *   node werkzeuge/sammeln.mjs --nur=az,dji   nur bestimmte Quellen (mit --probe kombinierbar)
 *   node werkzeuge/sammeln.mjs --zwischen     stündlicher Zwischenabruf: nur die Feed-Adressen, die in quellen.json unter
 *                                             "stuendlich" stehen; speichert nur, wenn es Neues gibt (siehe werkzeuge/abruf-takt.mjs)
 *   node werkzeuge/sammeln.mjs --probe --nur=ism --datei=daten/diagnose/ism.html
 *                                             gespeicherte Seite statt Abruf parsen (offline, ohne Linkprüfung)
 *   node werkzeuge/sammeln.mjs --zustand      Zustand der Quellen anzeigen; mit --streng Exit-Code 1, wenn eine
 *                                             Quelle seit über 2 Tagen gestört ist (letzter Schritt im Workflow)
 */
import { readdir, unlink, readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import {
  ROOT, UA, text, attr, parseDate, cleanUrl, urlKey, idOf, berlinDay, dayOffset, readJson, writeJson, cut,
} from "./lib.mjs";
import { gremienAbrufen } from "./gremien.mjs";

const argv = process.argv.slice(2);
const PROBE = argv.includes("--probe");
const GRUNDSTAND = argv.includes("--grundstand");   // undatierte Meldungen nur als bekannt merken (für neue Quellen)
const ONLY = (argv.find(a => a.startsWith("--nur=")) || "").slice(6).split(",").filter(Boolean);
const DATEI = (argv.find(a => a.startsWith("--datei=")) || "").slice(8);   // offline: gespeicherte Seite statt Abruf
const ZUSTAND = argv.includes("--zustand");
const STRENG = argv.includes("--streng");
const ZWISCHEN = argv.includes("--zwischen");   // nur die schnell drehenden Feeds ("stuendlich" in quellen.json)
const HEUTE = berlinDay();
const ALTER_MAX = 3;            // datierte Meldungen älter als 3 Tage werden ignoriert
const POOL_TAGE = 10;           // Poolabrufe älter als 10 Tage werden gelöscht
const GESEHEN_TAGE = 400;       // so lange merkt sich der Abruf bekannte Links
const LINK_TIMEOUT = 10_000;    // Linkprüfung: Zeitlimit je Anfrage
const LINK_PARALLEL = 6;        // Linkprüfung: höchstens so viele Anfragen gleichzeitig
const VERLAUF_LAEUFE = 14;      // so viele Trefferzahlen merkt sich der Zustandsverlauf
const DIAGNOSE_MAX = 400_000;   // Diagnose-Schnappschuss höchstens 400 KB (ganze Datei)
const MELDEN_STUNDEN = 48;      // --zustand --streng: Fehlschlag, wenn eine Quelle länger gestört ist
const ZUSTAND_DATEI = "daten/quellen-zustand.json";
const DIAGNOSE_ORDNER = "daten/diagnose";

// Umweg (cloudflare/bestenliste/worker.js, /hol): Manche Server nehmen von GitHubs Rechnern oft keine Verbindung an (Bundesrat in mehr als
// der Hälfte der Läufe, Bildungsserver, Paritätischer – Zeitüberschreitung beim Verbindungsaufbau). Dann holt der Abruf die Seite über den
// eigenen kleinen Dienst bei Cloudflare, der von anderen Rechnern aus anfragt. UMWEG="" in der Umgebung schaltet das ab.
const UMWEG = process.env.UMWEG ?? "https://boniblatt-bestenliste.ahmadmimam10.workers.dev/hol";
const umwege = [];                                       // welche Adressen in diesem Lauf den Umweg brauchten (fürs Protokoll)
const netzFehler = e => !e?.status && (e?.name === "TimeoutError" || e?.name === "AbortError" || e?.cause?.name === "TimeoutError" || /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR|socket|network/i.test(String(e?.message) + " " + String(e?.cause?.code || "")));
const voruebergehend = e => netzFehler(e) || [403, 408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524].includes(e?.status);
/** Eine Adresse laden: direkt, bei Netzfehlern oder Abweisung (403, 429, 5xx) nach kurzer Pause noch einmal, dann über den Umweg. */
async function holen(url, accept) {
  let fehler = new Error("Umweg erzwungen");
  if (!process.env.UMWEG_IMMER) for (const [nr, zeit] of [[1, 20_000], [2, 12_000]]) {      // UMWEG_IMMER=1: zum Testen gleich über den Umweg
    try { return await holenDirekt(url, accept, zeit); }
    catch (e) { fehler = e; if (!voruebergehend(e)) throw e; if (nr === 1) await new Promise(r => setTimeout(r, 2500)); }
  }
  if (!UMWEG || DATEI) throw fehler;
  try {
    const r = await holenDirekt(UMWEG + "?u=" + encodeURIComponent(url), accept, 30_000, { "X-Umweg-UA": UA });
    umwege.push(new URL(url).hostname);
    return { ...r, finalUrl: r.umwegUrl || url, umweg: true };
  } catch (e) { throw fehler; }                          // der Umweg half nicht: der ursprüngliche Fehler sagt mehr
}
async function holenDirekt(url, accept, zeit, kopf = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "de-DE,de;q=0.9,en;q=0.4", ...kopf },
    redirect: "follow",
    signal: AbortSignal.timeout(zeit),
  });
  if (kopf["X-Umweg-UA"] && res.headers.get("x-umweg") !== "ja") throw new Error("Umweg: " + res.status);
  if (!res.ok) {
    const fehler = new Error("HTTP " + res.status);
    // Fehlerseite für den Diagnose-Schnappschuss aufheben (zeigt z. B. Sperr- oder Umzugshinweise)
    Object.assign(fehler, { status: res.status, finalUrl: res.url || url, roh: (await res.text().catch(() => "")).slice(0, 300_000) });
    throw fehler;
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 8_000_000) throw new Error("Seite zu groß");
  const ct = res.headers.get("content-type") || "";
  let cs = (ct.match(/charset=["']?([\w-]+)/i) || [])[1];
  let body = new TextDecoder("utf-8").decode(buf);
  if (!cs) cs = (body.slice(0, 3000).match(/<meta[^>]+charset=["']?([\w-]+)/i) || body.slice(0, 300).match(/encoding=["']([\w-]+)/i) || [])[1];
  if (cs && !/^utf-?8$/i.test(cs)) {
    try { body = new TextDecoder(cs.toLowerCase()).decode(buf); } catch { /* bleibt UTF-8 */ }
  }
  return { body, finalUrl: res.url || url, status: res.status, umwegUrl: res.headers.get("x-umweg-url") || "" };
}

function hostErlaubt(u, quelle, basis) {
  const h = u.hostname.replace(/^www\./, "");
  const b = new URL(basis).hostname.replace(/^www\./, "");
  return h === b || (quelle.hosts || []).some(x => h === x || h.endsWith("." + x));
}

// ---------- RSS / Atom ----------
function feedLesen(xml, quelle, basis) {
  if (!/<(rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error("Antwort ist kein RSS-/Atom-Feed");
  const out = [];
  for (const m of xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const b = m[2];
    const feld = n => (b.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, "i")) || [])[1] || "";
    let link = text(feld("link"));
    if (!link) {
      const tag = [...b.matchAll(/<link\b[^>]*>/gi)].map(x => x[0]).find(t => !/\brel=["'](?!alternate)/i.test(t));
      link = tag ? attr(tag, "href") : "";
    }
    if (!link) link = text(feld("guid"));
    const url = cleanUrl(link, basis);
    if (!url) continue;
    const teaser = text(text(feld("description") || feld("summary") || feld("content:encoded") || feld("content")));
    // Bluesky/Mastodon-Posts haben keinen Titel: dann den Anfang des Post-Textes nehmen
    const titel = text(text(feld("title"))) || postTitel(teaser);
    out.push({
      url,
      titel,
      teaser,
      datum: parseDate(feld("pubDate") || feld("dc:date") || feld("published") || feld("updated")),
    });
  }
  return out;
}

/** Titel für Posts ohne Titel: erster Satz ab etwa 40 Zeichen, höchstens 140 Zeichen.
 *  Kein Satzende nach Ziffern („Beim 30. Mainzer …“) oder kurzen Abkürzungen („z. B.“, „Dr.“). */
function postTitel(t) {
  for (const m of t.matchAll(/[.!?…](?=\s+\S)/g)) {
    const davor = t.slice(Math.max(0, m.index - 12), m.index);
    if (m[0] === "." && (/\d$/.test(davor) || /(?:^|[\s(])(?:\p{L}{1,2}|dr|nr|st|str|prof|bzw|ca|vgl|usw|etc|inkl|ggf|evtl|bzgl|mio|mrd|tel|abs)$/iu.test(davor))) continue;
    if (m.index + 1 >= 40) return cut(t.slice(0, m.index + 1).trim(), 140);
  }
  return cut(t, 140);
}

// ---------- HTML-Übersichtsseiten ----------
const GENERISCH = /^(?:mehr|weiter|weiterlesen|mehr lesen|mehr erfahren|lesen sie hier mehr|zum (?:beitrag|artikel)|details?(?: anzeigen)?|hier|link|pdf|download|zur meldung|read more)[\s.!»›>…]*$/i;

function listeLesen(html, quelle, basis) {
  const muster = new RegExp(quelle.muster, "i");
  const ohne = quelle.ohne ? new RegExp(quelle.ohne, "i") : null;
  const bereich = quelle.bereich
    ? (html.match(new RegExp(quelle.bereich, "i")) || [html])[0]
    : (html.match(/<main\b[\s\S]*<\/main>/i) || [html])[0];

  // 1. alle passenden Links mit Position sammeln
  const links = [];
  for (const m of bereich.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const url = cleanUrl(attr(m[1], "href"), basis);
    if (!url) continue;
    const u = new URL(url);
    if (!muster.test(u.pathname + u.search) || !hostErlaubt(u, quelle, basis) || (ohne && ohne.test(u.pathname + u.search))) continue;
    links.push({ url, start: m.index, end: m.index + m[0].length, attrs: m[1], inner: m[2], pfad: u.pathname });
  }

  // 2. jeden Link mit seinem Umfeld lesen: Block = Bereich zwischen den Nachbarlinks auf andere Meldungen
  const treffer = new Map();
  links.forEach((l, i) => {
    let a = i - 1; while (a >= 0 && links[a].url === l.url) a--;
    let z = i + 1; while (z < links.length && links[z].url === l.url) z++;
    const von = Math.max(a >= 0 ? links[a].end : 0, l.start - 2500);
    const bis = Math.min(z < links.length ? links[z].start : bereich.length, l.end + 2500);
    const block = bereich.slice(von, bis);
    const ueberschrift = (l.inner.match(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/i) || [])[2];
    let titel = text(ueberschrift || l.inner) || text(attr(l.attrs, "title"));
    if (!titel || titel.length < 12 || GENERISCH.test(titel)) {
      // bei „Weiterlesen“-Links steht der Titel oft im title-Attribut, sonst in einer Überschrift im Umfeld
      // („Mehr als Lesen …“ behält sein „Mehr“ – nur „Mehr:“ / „Mehr –“ ist ein Vorsatz)
      const t = text(attr(l.attrs, "title")).replace(/^(?:(?:weiterlesen|details|zum artikel|zur meldung)\s*[:–-]?|mehr\s*[:–-])\s*/i, "");
      const h = (block.match(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/i) || [])[2];
      titel = t.length >= 12 && !GENERISCH.test(t) ? t : text(h || "");
    }
    titel = titel.replace(/^(?:mehr erfahren|artikel|news|meldung|pressemitteilung|nachricht)\s+/i, "")
      .replace(/^\d{1,2}\.\d{1,2}\.20\d{2}\s*[|·–-]?\s*/, "")
      .replace(/\s*(?:mehr|weiterlesen|mehr erfahren)\s*[»›>→]?$/i, "").trim();
    if (titel.length < 12 || GENERISCH.test(titel)) return;
    const absaetze = [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(x => text(x[1])).filter(p => p.length >= 50 && p !== titel);
    // Datum: normalerweise im Block; bei „datumNach“ zuerst hinter dem Link suchen (sonst erbt man das Datum der Vormeldung)
    const nach = bereich.slice(l.end, bis), vor = bereich.slice(von, l.start);
    const suchraum = quelle.datumNach ? nach + vor : block;
    const zeit = suchraum.match(/<time\b[^>]*>/i);
    const datum = (zeit && parseDate(attr(zeit[0], "datetime") || zeit[0]))
      || (quelle.datumNach ? parseDate(text(nach).slice(0, 400)) || parseDate(text(vor).slice(-400)) : parseDate(text(block).slice(0, 700)))
      || parseDate(l.pfad);
    const alt = treffer.get(l.url);
    // (kein Abschneiden mehr: ein „Titel“ über 300 Zeichen ist meist ein falsch erkannter Block – das prüft die Titelschranke)
    const besserTitel = alt && alt.titel.length >= titel.length && alt.titel.length < 260 ? alt.titel : titel;
    treffer.set(l.url, { url: l.url, titel: besserTitel, teaser: alt?.teaser || absaetze[0] || "", datum: alt?.datum || datum || "" });
  });
  return [...treffer.values()].slice(0, quelle.max || 40);
}

// ---------- Deutscher Verein: Artikeldaten stehen als JSON in der Seite ----------
function dvLesen(html, quelle, basis) {
  const m = html.match(/articleJson\s*=\s*(\[[\s\S]*?\])\s*;\s*(?:<\/script>|\n|const|var|let|window)/);
  if (!m) throw new Error("Artikeldaten nicht gefunden");
  return JSON.parse(m[1]).filter(x => x && x.link && x.name).slice(0, 40).map(x => {
    const datum = parseDate(x.start_date || "");
    const art = x.article_type_name || "";
    return { url: cleanUrl(x.link, basis), titel: (art && !/meldung/i.test(art) ? art.replace(/en$/, "") + ": " : "") + text(x.name), teaser: text(x.text_short || ""), datum };
  });
}

// ---------- Landtag Rheinland-Pfalz: Nachrichten über die öffentliche Schnittstelle ----------
function landtagLesen(json, quelle) {
  const daten = JSON.parse(json);
  return (daten.content || []).slice(0, 30).map(x => ({
    url: "https://landtag-rlp.de/de/aktuelles/aktuelles-aus-dem-landtag/" + x.urlKey,
    titel: text(x.headline) + (x.subheading ? "" : ""),
    teaser: text(x.teaser || x.content || ""),
    datum: parseDate(x.date || x.meta?.datepublished || ""),
    rubrik: text(x.subheading || ""),
  }));
}

// ---------- JAdigital: jüngste Newsletter-Ausgabe ----------
function jadigitalLesen(html, quelle, basis) {
  const main = (html.match(/<main\b[\s\S]*<\/main>/i) || [html])[0];
  const out = [];
  for (const h of main.matchAll(/<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const ueberschrift = text(h[2]);
    const danach = main.slice(h.index + h[0].length, h.index + h[0].length + 1500).split(/<h[1-6]\b/i)[0];
    // Archiv-Einträge: Überschrift, direkt darunter das Versanddatum („November 13, 2026“); der Newsletter-Text
    // danach steht teils als maskiertes HTML in der Seite – daher Datum zuerst direkt hinter der Überschrift suchen
    // und den Text doppelt entschlüsseln.
    const inhalt = text(text(danach)).replace(/<[^>]*$/, "").trim();   // abgeschnittenes maskiertes Tag am Ende weg
    const direkt = parseDate(inhalt.slice(0, 60));
    const datum = direkt || parseDate(danach) || parseDate(ueberschrift);
    if (!datum || !(direkt || /newsletter|ausgabe|leser/i.test(ueberschrift + " " + inhalt.slice(0, 300)))) continue;
    const link = (danach.match(/<a\b[^>]*href="([^"]+)"/i) || [])[1];
    const u = new URL(basis);
    u.searchParams.set("ausgabe", datum);
    out.push({ url: link && /newsletter|ausgabe/i.test(link) ? cleanUrl(link, basis) : u.href, titel: ueberschrift, teaser: cut(inhalt.replace(/^\S+ \d{1,2}, 20\d\d\s*/, ""), 300), datum });
  }
  return out.sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 1);
}

// ---------- Ratsinformationssystem Mainz: Sitzungstermine ----------
function ratsinfoLesen(html, quelle, basis) {
  const gremien = new RegExp(quelle.gremien || "Jugendhilfeausschuss|Stadtrat", "i");
  const out = [];
  for (const m of html.matchAll(/<a\b([^>]*title="Details anzeigen:[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi)) {
    const titelAttr = text(attr(m[1], "title")).replace(/^Details anzeigen:\s*/i, "");
    const datum = parseDate(titelAttr);
    const gremium = titelAttr.replace(/\s*\d{1,2}\.\d{1,2}\.20\d{2}\s*$/, "").trim();
    if (!datum || !gremien.test(gremium)) continue;
    const nach = html.slice(m.index + m[0].length, m.index + m[0].length + 900).split(/<\/td>/i)[0];
    const angaben = [...nach.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(x => text(x[1]));
    const zeit = (angaben.find(x => /\d{1,2}:\d{2}/.test(x)) || "").match(/\d{1,2}:\d{2}/)?.[0] || "";
    const ort = angaben.find(x => !/\d{1,2}:\d{2}\s*(?:-|Uhr)/.test(x) && x.length > 4) || "";
    out.push({ url: cleanUrl(attr(m[1], "href"), basis), titel: gremium, datum, zeit, ort: cut(ort, 120) });
  }
  return [...new Map(out.map(x => [x.url, x])).values()];
}

const MUELL = /captcha|cookie|javascript|typoscript|bitte aktivieren|enable js/i;
const LESER = { rss: feedLesen, html: listeLesen, jadigital: jadigitalLesen, ratsinfo: ratsinfoLesen, dv: dvLesen, "landtag-api": landtagLesen };

function platzhalter(url) {
  const [jahr, monat] = HEUTE.split("-").map(Number);
  const naechster = monat === 12 ? [jahr + 1, 1] : [jahr, monat + 1];
  return url.replace("{JAHR_NAECHSTER}", naechster[0]).replace("{MONAT_NAECHSTER}", naechster[1]);
}

async function quelleAbrufen(quelle) {
  const ergebnisse = [];
  const fehler = [];
  const roh = [];                  // geladenes Rohmaterial je Adresse (für Diagnose-Schnappschüsse)
  const namen = new Set();         // Seiten- bzw. Feedtitel: so darf keine Meldung heißen
  const adressen = new Set();      // Übersichtsseiten: darauf darf keine Meldung zeigen
  const accept = quelle.typ === "rss" ? "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5"
    : quelle.typ === "landtag-api" ? "application/json" : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5";
  const teile = DATEI ? await dateiTeile(quelle) : quelle.urls.map(platzhalter).map(url => ({ url }));
  for (const teil of teile) {
    const url = teil.url;
    const r = { url, finalUrl: url, zeit: teil.zeit || new Date().toISOString() };
    roh.push(r);
    adressen.add(url);
    try {
      if (DATEI) {
        if (teil.fehler) throw new Error(teil.fehler + " (laut Schnappschuss)");
        Object.assign(r, { body: teil.body, finalUrl: teil.finalUrl || url, status: teil.status });
      } else {
        try {
          Object.assign(r, await holen(url, accept));
          if (r.umweg) r.finalUrl = r.finalUrl || url;
        } catch (error) {
          if (error.roh) Object.assign(r, { body: error.roh, finalUrl: error.finalUrl, status: error.status });
          throw error;
        }
      }
      adressen.add(r.finalUrl);
      // Manche Seiten geben mit <base href> eine andere Basis für relative Links vor
      const baseHref = quelle.typ === "html" ? (r.body.slice(0, 20000).match(/<base\b[^>]*\bhref=["']([^"']+)["']/i) || [])[1] : "";
      const basis = baseHref ? cleanUrl(baseHref, r.finalUrl) || r.finalUrl : r.finalUrl;
      adressen.add(basis);
      for (const n of seitenNamen(r.body)) namen.add(n);
      if (!LESER[quelle.typ]) throw new Error(`unbekannter typ „${quelle.typ}“`);
      const items = LESER[quelle.typ](r.body, quelle, basis);
      ergebnisse.push(...items.map(it => ({ ...it, adr: url })));   // adr: aus welcher Adresse der Eintrag stammt (für den Abruftakt)
    } catch (error) {
      // Netzfehler genauer benennen (fetch meldet sonst nur „fetch failed“)
      r.fehler = error.name === "TimeoutError" ? "Zeitüberschreitung" : error.cause?.code ? `${error.message} (${error.cause.code})` : error.message;
      const host = (() => { try { return new URL(url).hostname; } catch { return String(url); } })();
      fehler.push(`${host}: ${r.fehler}`.slice(0, 160));
    }
  }
  return { ergebnisse, fehler, roh, namen: [...namen], adressen: [...adressen] };
}

/** Titel der Seite bzw. des Feeds (samt Teilen wie „Aktuelles | Stadt Mainz“) und og:site_name. */
function seitenNamen(body) {
  const ende = body.search(/<\/head>|<(?:item|entry)\b/i);
  const kopf = body.slice(0, ende > 0 ? ende : 30000);
  const titel = text((kopf.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const namen = titel ? [titel, ...titel.split(/\s+[|–—·:-]\s+|\s*\|\s*/)] : [];
  const site = kopf.match(/<meta\b[^>]*(?:property|name)=["']og:site_name["'][^>]*>/i);
  if (site) namen.push(text(attr(site[0], "content")));
  return namen.map(s => s.trim()).filter(s => s.length >= 4);
}

// ---------- Qualitätsschranken ----------
const GENERISCH_TITEL = new RegExp("^(?:(?:hier |jetzt )?(?:mehr|weiter)(?: ?lesen| erfahren| informationen| infos| anzeigen| details| nachrichten| meldungen| artikel| beiträge| news)?"
  + "|weiterlesen|lesen sie (?:hier )?(?:mehr|weiter)|(?:artikel|beitrag|meldung) (?:lesen|anzeigen|öffnen)"
  + "|zum (?:beitrag|artikel|video|podcast|download|dokument|newsletter|programm)|zur (?:meldung|pressemitteilung|nachricht|veranstaltung|anmeldung|übersicht|startseite|mediathek)"
  + "|zurück(?: zur (?:übersicht|startseite|liste))?|alle (?:meldungen|nachrichten|artikel|beiträge|termine|veranstaltungen|pressemitteilungen|pressemeldungen|news|publikationen|stellungnahmen|themen)(?: anzeigen)?"
  + "|(?:nächste|vorherige|erste|letzte) seite|seite \\d+(?: von \\d+)?|details?(?: anzeigen)?|download|pdf(?: herunterladen| öffnen)?"
  + "|read more|continue reading|learn more|click here|(?:presse)?mitteilung(?:en)?|pressemeldung(?:en)?|meldung(?:en)?|nachricht(?:en)?"
  + "|aktuelles|aktuelle (?:meldungen|nachrichten|news|themen|beiträge)|news(?:letter)?|termine|veranstaltung(?:en|shinweise)?|startseite|home|übersicht|archiv"
  + "|kontakt|impressum|datenschutz(?:erklärung|hinweise)?|(?:erklärung zur )?barrierefreiheit|leichte sprache|gebärdensprache|sitemap|suche|login|anmelden|registrieren"
  + "|teilen|drucken|kein titel|ohne titel|untitled|no title)[\\s.!:»›>→…]*$", "i");
const MUELL_TITEL = new RegExp("cookie|javascript|captcha|seite (?:wurde )?nicht gefunden|page not found|not found|access denied|zugriff verweigert|zugang verweigert"
  + "|forbidden|internal server error|service unavailable|bad gateway|gateway time-?out|just a moment|attention required|checking your browser"
  + "|are you (?:a )?(?:robot|human)|kein roboter|bitte aktivieren|enable js|browser (?:wird )?nicht unterstützt|unsupported browser|wartungsmodus|maintenance mode"
  + "|lorem ipsum|\\[object object\\]|\\bundefined\\b|\\{\\{|\\}\\}|\\$\\{|<\\/?[a-z][^>]*>|\\uFFFD|â€|Ã[\\u0080-\\u00BF\\u0152\\u0153\\u0160\\u0161\\u0178\\u017D\\u017E\\u2018-\\u201E\\u2020-\\u2022\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122]"
  + "|\\b(?:error|fehler|http|status(?:code)?)\\s*[:\\-–]?\\s*(?:40\\d|41\\d|5\\d\\d)\\b|^(?:40[0-9]|50[0-9])\\s*[-–:|]?\\s*(?:not|forbidden|error|fehler|nicht|seite|zugriff|access|internal|service|bad|gateway)", "i");
const NUR_DATUM = /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mär|apr|jun|jul|aug|sept?|okt|nov|dez|uhr|kw|stand|vom|am|bis|nr)\b/gi;
const GETEILTE_ZONEN = new Set(["bund.de", "rlp.de", "nrw.de", "bayern.de", "hessen.de", "github.io", "wordpress.com", "blogspot.com", "co.uk"]);

/** Titel säubern: Tags/Entities (auch doppelt kodierte), Trennzeichen am Rand, angehängtes „Weiterlesen“. */
function titelSaeubern(t) {
  return text(text(t || ""))
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s*[-–|]?\s*(?:weiterlesen|mehr erfahren|mehr lesen|read more)\s*[»›>→…]*$/i, "")
    .replace(/^[\s|·•–—:;,\-»›>]+|[\s|·•–—:;,\-«‹<]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Titel, wie er geprüft und gespeichert wird. Überlange Titel aus Feeds und Datenquellen (eigenes Titelfeld) werden an
 *  der Wortgrenze gekürzt; bei HTML-Übersichtsseiten deutet ein „Titel“ über 300 Zeichen auf einen falsch erkannten
 *  Block – dort greift die Schranke. */
function titelFuer(quelle, roh) {
  const t = titelSaeubern(roh);
  return quelle.typ !== "html" && t.length > 300 ? cut(t, 298) : t;
}

/** Grund, warum ein Titel unbrauchbar ist – oder "" */
function titelGrund(titel, ctx) {
  if (!titel) return "Titel fehlt";
  if (titel.length < 12) return `Titel zu kurz (${titel.length} Zeichen)`;
  if (titel.length > 300) return `Titel zu lang (${titel.length} Zeichen)`;
  if (GENERISCH.test(titel) || GENERISCH_TITEL.test(titel)) return "Titel generisch";
  if (MUELL_TITEL.test(titel)) return "Titel ist Stör- oder Fehlertext";
  if (/^(?:https?:\/\/|www\.)\S+$/i.test(titel)) return "Titel ist eine Adresse";
  if ((titel.replace(NUR_DATUM, " ").match(/\p{L}/gu) || []).length < 4) return "Titel ohne Wortlaut (nur Datum/Zahlen)";
  const n = ctx.norm(titel);
  if (ctx.namen.has(n)) return "Titel gleich Seiten- oder Quellenname";
  // derselbe Titel bei vielen verschiedenen Links: meist eine Zwischenüberschrift, die für alle Einträge gegriffen wurde
  const gleich = ctx.gleicheTitel.get(n)?.size || 0;
  if (gleich >= 3 && gleich > ctx.gefunden / 2) return `Titel bei ${gleich} von ${ctx.gefunden} Meldungen gleich`;
  return "";
}

/** Grund, warum ein Link unbrauchbar ist (ohne Netz) – oder "" */
function linkGrund(url, ctx) {
  if (!url) return "Link fehlt";
  let u;
  try { u = new URL(url); } catch { return "Link ungültig"; }
  if (!/^https?:$/.test(u.protocol)) return "Link nicht http(s)";
  if (!ctx.hostErlaubt(u.hostname)) return `Link auf fremden Host (${u.hostname})`;
  if (ctx.uebersicht.has(urlKey(url))) return "Link zeigt auf die Übersichtsseite";
  if (u.pathname.replace(/\/+$/, "") === "" && !u.search) return "Link zeigt auf die Startseite";
  return "";
}

/** Vergleichswerte einer Quelle für die Schranken: Namen, Übersichtsadressen, erlaubte Hosts, gleiche Titel. */
function schrankenKontext(quelle, abruf) {
  const norm = s => text(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const namen = new Set([quelle.name, quelle.kurz, ...String(quelle.name || "").split(/\s+[–—|-]\s+|\s*\/\s*/), ...abruf.namen]
    .map(norm).filter(x => x.length >= 4));
  const uebersicht = new Set();
  const hosts = new Set((quelle.hosts || []).map(h => h.toLowerCase().replace(/^www\./, "")));
  for (const a of abruf.adressen) {
    try {
      uebersicht.add(urlKey(a));
      const h = new URL(a).hostname.toLowerCase().replace(/^www\./, "");
      hosts.add(h);
      // Elterndomain zulassen (api.landtag-rlp.de → landtag-rlp.de), aber keine gemeinsamen Zonen wie bund.de
      const eltern = h.split(".").slice(1).join(".");
      if (eltern.includes(".") && !GETEILTE_ZONEN.has(eltern)) hosts.add(eltern);
    } catch { /* ungültige Adresse */ }
  }
  const hostErlaubt = h => {
    h = h.toLowerCase().replace(/^www\./, "");
    return [...hosts].some(x => h === x || h.endsWith("." + x));
  };
  const gleicheTitel = new Map();
  for (const it of abruf.ergebnisse) {
    const n = norm(titelFuer(quelle, it.titel));
    if (n && it.url) gleicheTitel.set(n, (gleicheTitel.get(n) || new Set()).add(it.url));
  }
  return { norm, namen, uebersicht, hostErlaubt, gleicheTitel, gefunden: abruf.ergebnisse.length };
}

/** Linkprüfung: HEAD, bei Ablehnung (405/403 u. a.) ersatzweise GET mit Abbruch nach den ersten Bytes. */
async function linkPruefen(url) {
  const kopf = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "Accept-Language": "de-DE,de;q=0.9,en;q=0.4" };
  const anfrage = async methode => {
    const res = await fetch(url, { method: methode, headers: kopf, redirect: "follow", signal: AbortSignal.timeout(LINK_TIMEOUT) });
    if (methode === "GET" && res.body) {
      const leser = res.body.getReader();
      await leser.read().catch(() => {});
      leser.cancel().catch(() => {});
    }
    return res;
  };
  const netz = e => e?.name === "TimeoutError" || e?.cause?.name === "TimeoutError" ? `Zeitüberschreitung (${LINK_TIMEOUT / 1000} s)`
    : `Netzfehler (${String(e?.cause?.code || e?.cause?.message || e?.message || e).slice(0, 60)})`;
  let res;
  try {
    res = await anfrage("HEAD");
  } catch (error) {
    if (netz(error).startsWith("Zeit")) return { ok: false, weich: true, grund: netz(error) };
  }
  try {
    if (!res || res.status >= 400) res = await anfrage("GET");
  } catch (error) {
    return { ok: false, weich: true, grund: netz(error) };
  }
  if (res.status >= 400) {
    const s = res.status;
    // 403/429/5xx und Zeitüberschreitungen können vorübergehend sein (Sperre gegen Rechenzentren, Überlast)
    return { ok: false, weich: s === 403 || s === 408 || s === 425 || s === 429 || s >= 500, grund: "HTTP " + s };
  }
  const start = new URL(url), ziel = new URL(res.url || url);
  const leer = p => p.replace(/\/+$/, "") === "";
  if (ziel.hostname === start.hostname && !leer(start.pathname) && leer(ziel.pathname) && !ziel.search) return { ok: false, weich: false, grund: "leitet auf die Startseite um" };
  const fehlerPfad = /\/(?:404|fehler(?:seite)?|error|not[-_]?found|seite[-_]nicht[-_]gefunden)(?:[/._-]|$)/i;
  if (fehlerPfad.test(ziel.pathname) && !fehlerPfad.test(start.pathname)) return { ok: false, weich: false, grund: "leitet auf eine Fehlerseite um" };
  return { ok: true, status: res.status };
}

/** fn für alle Einträge, höchstens n gleichzeitig (Reihenfolge bleibt erhalten). */
async function parallel(liste, n, fn) {
  const out = new Array(liste.length);
  let naechster = 0;
  await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => {
    while (naechster < liste.length) {
      const i = naechster++;
      out[i] = await fn(liste[i], i);
    }
  }));
  return out;
}

// ---------- Zustand je Quelle ----------
function median(werte) {
  const s = [...werte].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
}

function haeufigster(liste) {
  const z = new Map();
  for (const x of liste) z.set(x, (z.get(x) || 0) + 1);
  return [...z.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

const tagKurz = iso => iso ? new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "–";

/**
 * Neuer Zustand einer Quelle aus dem bisherigen Eintrag und diesem Lauf.
 *   gestoert:   Fehler in ≥ 3 Läufen in Folge · 0 brauchbare Treffer in ≥ 4 Läufen in Folge, obwohl die Quelle früher
 *               Treffer hatte · mehr als die Hälfte der gefundenen Einträge (mind. 2) scheitert an Titel-/Linkschranke
 *               oder an der Linkprüfung mit hartem Fehler (404 u. a.) · mögliche Netzaussetzer bei der Linkprüfung
 *               (Zeitüberschreitung, 403/429/5xx) bei mehr als der Hälfte der neuen Kandidaten im 3. Lauf in Folge
 *   auffaellig: erste Fehler (1.–2. Lauf) · 0 Treffer im 1.–3. Lauf · Treffer > 70 % unter dem Median der letzten Läufe ·
 *               mehr als die Hälfte der neuen Kandidaten (mind. 2) verworfen · Linkprüfung-Aussetzer im 1.–2. Lauf
 */
function zustandBerechnen(quelle, alt, abruf, p, jetzt) {
  const verworfen = p.verworfen.titel + p.verworfen.link + p.verworfen.linkpruefung;
  const brauchbar = Math.max(0, p.gefunden - p.unbrauchbar - p.linkHart);   // ohne Einträge mit Titel-/Linkfehler oder totem Link
  const nichtsGeladen = abruf.roh.length > 0 && abruf.roh.every(r => r.fehler);   // keine Adresse lieferte Verwertbares
  const vorher = (alt.trefferVerlauf || []).filter(x => x != null);
  const hatteTreffer = Boolean(alt.letzterErfolg) || vorher.some(x => x > 0);
  const linkAussetzer = p.linkWeich >= 2 && p.linkWeich > p.linkGeprueft / 2;
  const e = {
    zustand: "ok", hinweis: "", seit: alt.seit || jetzt, letzterLauf: jetzt, letzterErfolg: alt.letzterErfolg || null,
    fehlerInFolge: abruf.fehler.length ? (alt.fehlerInFolge || 0) + 1 : 0,
    nullTrefferInFolge: nichtsGeladen ? (alt.nullTrefferInFolge || 0) : brauchbar === 0 ? (alt.nullTrefferInFolge || 0) + 1 : 0,
    linkStoerungInFolge: !p.linkGeprueft ? (alt.linkStoerungInFolge || 0) : linkAussetzer ? (alt.linkStoerungInFolge || 0) + 1 : 0,
    gefunden: p.gefunden, brauchbar, neu: p.neu, verworfen, verworfenNach: { ...p.verworfen },
    beispiele: p.beispiele.slice(0, 3),
    trefferVerlauf: [...(alt.trefferVerlauf || []), nichtsGeladen ? null : brauchbar].slice(-VERLAUF_LAEUFE),
    // Quellen-Kontrolle (werkzeuge/quellen-kontrolle.mjs): Wie frisch ist, was die Quelle zeigt – und wann kam zuletzt etwas Neues bei uns an?
    seitBeobachtung: alt.seitBeobachtung || alt.seit || jetzt,
    juengstes: nichtsGeladen ? (alt.juengstes || "") : (p.juengstes || ""),
    letzteNeu: p.neu ? { am: jetzt, titel: cut(p.neuTitel, 120) } : (alt.letzteNeu || null),
    neuTage: (() => { const t = { ...(alt.neuTage || {}) }, tag = jetzt.slice(0, 10); if (p.neu) t[tag] = (t[tag] || 0) + p.neu; for (const k of Object.keys(t)) if (k < dayOffset(tag, -60)) delete t[k]; return t; })(),
    fehler: abruf.fehler.slice(0, 3),
    // Meldungen, die die Quelle zeigt, die der Abruf aber bewusst nicht übernimmt, weil sie älter als drei Tage sind (ALTER_MAX) – damit der
    // Notion-Abgleich solche Lücken erklären kann („alt“ statt „unklar“)
    zuAlt: nichtsGeladen ? (alt.zuAlt || []) : (p.zuAlt || []).slice(0, 12),
  };
  const gestoert = [], auffaellig = [];
  const ersterFehler = abruf.fehler[0] || "";
  const abhilfe = quelle.typ === "rss" ? "Feed-Adresse prüfen (urls)" : quelle.typ === "html" ? "Seitenstruktur prüfen (muster, bereich)" : "Seitenstruktur prüfen (Sonderleser)";
  // Nicht erreichbar (Zeitüberschreitung, Verbindung abgelehnt, Server überlastet) ist etwas anderes als „Seite umgebaut“: Der Abruf hat es
  // schon zweimal direkt und einmal über den Umweg versucht und holt beim nächsten Lauf alles nach (Feeds halten ihre Einträge tagelang).
  // Deshalb erst auffällig, wenn seit über 24 Stunden nichts ankam, und gestört erst nach 48 Stunden.
  const nurNetz = abruf.fehler.length > 0 && abruf.fehler.every(f => /Zeitüberschreitung|fetch failed|UND_ERR|ECONNRESET|ETIMEDOUT|EAI_AGAIN|HTTP (403|408|429|5[0-9][0-9])/i.test(f));
  const ohneErfolg = e.letzterErfolg ? (Date.parse(jetzt) - Date.parse(e.letzterErfolg)) / 3600_000 : Infinity;
  if (nurNetz && hatteTreffer) {
    if (ohneErfolg > 48) gestoert.push(`seit ${Math.round(ohneErfolg)} Stunden nicht erreichbar (auch nicht über den Umweg): ${ersterFehler}`);
    else if (ohneErfolg > 24) auffaellig.push(`seit ${Math.round(ohneErfolg)} Stunden nicht erreichbar: ${ersterFehler}`);
    else e.pause = `letzter Abruf nicht erreichbar (${ersterFehler}) – wird beim nächsten Lauf nachgeholt`;
  }
  else if (e.fehlerInFolge >= 3) gestoert.push(`Abruf seit ${e.fehlerInFolge} Läufen fehlerhaft: ${ersterFehler}`);
  else if (e.fehlerInFolge) auffaellig.push(`Abruffehler (${e.fehlerInFolge}. Lauf in Folge): ${ersterFehler}`);
  if (e.nullTrefferInFolge >= 4 && hatteTreffer) {
    const zuvor = [...vorher].reverse().find(x => x > 0);
    gestoert.push(`seit ${e.nullTrefferInFolge} Läufen keine brauchbaren Treffer (${zuvor ? `zuvor ${zuvor}` : `zuletzt Treffer am ${tagKurz(e.letzterErfolg)}`}) – ${abhilfe}`);
  } else if (e.nullTrefferInFolge && !nichtsGeladen) {
    auffaellig.push(hatteTreffer ? `keine brauchbaren Treffer (${e.nullTrefferInFolge}. Lauf in Folge)` : `bisher keine Treffer – ${abhilfe}`);
  }
  const ueblich = vorher.length >= 3 ? median(vorher) : 0;
  if (!nichtsGeladen && brauchbar > 0 && ueblich && brauchbar < 0.3 * ueblich) auffaellig.push(`nur ${brauchbar} brauchbare${brauchbar === 1 ? "r" : ""} Treffer statt üblicherweise ${ueblich}`);
  const kaputt = p.unbrauchbar + p.linkHart;
  const schrankeGestoert = kaputt >= 2 && kaputt > p.gefunden / 2;
  if (schrankeGestoert) {
    gestoert.push(`${kaputt} von ${p.gefunden} Einträgen unbrauchbar (${haeufigster(p.gruende)}) – Titel- und Linkerkennung prüfen (muster, bereich)`);
  } else {
    const hart = p.verworfen.titel + p.verworfen.link + p.linkHart;
    if (hart >= 2 && hart > (p.neu + verworfen) / 2) auffaellig.push(`${hart} von ${p.neu + verworfen} neuen Kandidaten verworfen (${haeufigster(p.verworfenGruende)})`);
  }
  if (linkAussetzer) {
    const satz = `${p.linkWeich} von ${p.linkGeprueft} neuen Links nicht erreichbar (${haeufigster(p.linkGruende)}), ${e.linkStoerungInFolge}. Lauf in Folge`;
    (e.linkStoerungInFolge >= 3 ? gestoert : auffaellig).push(satz);
  }
  e.zustand = gestoert.length ? "gestoert" : auffaellig.length ? "auffaellig" : "ok";
  e.hinweis = cut([...gestoert, ...auffaellig].join("; "), 300) || e.pause || `unauffällig – ${brauchbar} Treffer${abruf.roh.some(r => r.umweg) ? " (über den Umweg geholt)" : ""}`
    + (verworfen ? `, ${verworfen === 1 ? "1 neuer Kandidat" : `${verworfen} neue Kandidaten`} verworfen (${haeufigster(p.verworfenGruende)})` : "");
  if (e.zustand !== alt.zustand) e.seit = jetzt;
  if (brauchbar > 0 && !schrankeGestoert) e.letzterErfolg = jetzt;
  return e;
}

/** Startwert für Quellen ohne Zustandsverlauf: letzte Trefferzahl aus docs/daten/status.json übernehmen. */
function startZustand(id, statusAlt) {
  const s = (statusAlt.quellen || []).find(x => x.id === id);
  return s && Number.isFinite(s.treffer) ? { trefferVerlauf: [s.treffer], letzterErfolg: s.treffer > 0 && statusAlt.stand ? statusAlt.stand : null } : {};
}

/** JSON mit Zahlenlisten in einer Zeile (lesbarer Verlauf). */
function zustandJson(daten) {
  return JSON.stringify(daten, null, 1).replace(/\[\s*((?:-?\d+|null)(?:,\s*(?:-?\d+|null))*)\s*\]/g, (m, inhalt) => "[" + inhalt.split(/,\s*/).join(", ") + "]") + "\n";
}

// ---------- Diagnose-Schnappschüsse ----------
const DIAGNOSE_MARKE = /^<!-- fachbrief-diagnose (\{.*\}) -->\r?\n?/gm;

function diagnosePfad(id, ext) {
  return path.join(ROOT, DIAGNOSE_ORDNER, id + ext);
}

async function diagnoseVorhanden(id) {
  for (const ext of [".html", ".xml", ".json"]) {
    try { await readFile(diagnosePfad(id, ext)); return `${DIAGNOSE_ORDNER}/${id}${ext}`; } catch { /* nächste Endung */ }
  }
  return "";
}

async function diagnoseLoeschen(id) {
  for (const ext of [".html", ".xml", ".json"]) await unlink(diagnosePfad(id, ext)).catch(() => {});
}

/** Ballast entfernen, ohne die Struktur anzutasten: Stile, Grafiken, Kommentare, eingebettete Bilder. */
function entruempeln(body, quelle) {
  let b = body;
  // Deutscher Verein: die Artikeldaten (JSON) auf die ersten 80 Einträge kürzen – der Leser nimmt ohnehin nur 40
  if (quelle.typ === "dv") {
    b = b.replace(/(articleJson\s*=\s*)(\[[\s\S]*?\])(\s*;\s*(?:<\/script>|\n|const|var|let|window))/, (m, a, json, z) => {
      try { return a + JSON.stringify(JSON.parse(json).slice(0, 80)) + z; } catch { return m; }
    });
  }
  return b.replace(/<style\b[\s\S]*?<\/style>/gi, "<style></style>").replace(/<svg\b[\s\S]*?<\/svg>/gi, "<svg></svg>")
    .replace(/<!--(?!\s*fachbrief)[\s\S]*?-->/g, "").replace(/data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+/g, "data:,");
}

/** Hinten kürzen (an einer Tag-Grenze), <main> bleibt geschlossen. */
function abschneiden(b, budget) {
  let kurz = Buffer.from(b).subarray(0, Math.max(0, budget - 100)).toString("utf8").replace(/\uFFFD+$/, "");
  const tag = kurz.lastIndexOf("<");
  if (tag > kurz.length - 4000) kurz = kurz.slice(0, tag);
  if (/<main\b/i.test(kurz) && !/<\/main>/i.test(kurz)) kurz += "</main>";
  return kurz + "\n<!-- … gekürzt … -->";
}

/** Budget so verteilen, dass kleine Teile vollständig bleiben und große sich den Rest teilen. */
function verteilen(groessen, budget) {
  const out = new Array(groessen.length);
  let rest = budget, offen = groessen.length;
  for (const [g, i] of groessen.map((g, i) => [g, i]).sort((a, b) => a[0] - b[0])) {
    out[i] = Math.min(g, Math.floor(rest / offen));
    rest -= out[i];
    offen--;
  }
  return out;
}

/** Schnappschuss des zuletzt geladenen Rohmaterials schreiben; ohne neues Material bleibt der alte bestehen. */
async function diagnoseSchreiben(quelle, abruf, eintrag, jetzt) {
  const teile = abruf.roh;
  const mitInhalt = teile.filter(t => t.body);
  if (!mitInhalt.length) return diagnoseVorhanden(quelle.id);
  const erstes = mitInhalt[0].body.trimStart();
  // Endung nach dem Inhalt (JSON, XML/Feed, sonst HTML); nur wenn der Inhalt nichts verrät, nach dem Typ der Quelle
  const ext = /^[[{]/.test(erstes) ? ".json" : /^(?:<\?xml|<rss\b|<feed\b|<rdf:RDF\b)/i.test(erstes) ? ".xml"
    : erstes.startsWith("<") || quelle.typ !== "landtag-api" ? ".html" : ".json";
  const datei = `${DIAGNOSE_ORDNER}/${quelle.id}${ext}`;
  const sicher = s => String(s).replace(/</g, "‹").replace(/>/g, "›").replace(/--/g, "–");
  let inhalt = `<!-- Diagnose-Schnappschuss des Quellenabrufs (werkzeuge/sammeln.mjs) für „${sicher(quelle.id)}“ (${sicher(quelle.name)}), `
    + `gespeichert ${jetzt}. Zustand ${eintrag.zustand}: ${sicher(eintrag.hinweis)}. Je abgerufener Adresse folgt eine Zeile `
    + `„fachbrief-diagnose“ (Adresse, Zeit, HTTP-Status), danach das Rohmaterial. Offline testen: `
    + `node werkzeuge/sammeln.mjs ‹probe› ‹nur=${sicher(quelle.id)}› ‹datei=${datei}› (jeweils mit zwei Bindestrichen) -->\n`;
  // Budget: höchstens DIAGNOSE_MAX für die ganze Datei; erst Ballast entfernen, dann notfalls hinten kürzen
  const budget = DIAGNOSE_MAX - Buffer.byteLength(inhalt) - teile.length * 700;
  const bytes = s => Buffer.byteLength(s || "");
  let koerper = teile.map(t => t.body || "");
  const vermerk = teile.map(() => "");
  if (koerper.reduce((s, b) => s + bytes(b), 0) > budget) {
    koerper = koerper.map((b, i) => { const r = b ? entruempeln(b, quelle) : b; if (r !== b) vermerk[i] = "Stile, Grafiken und Kommentare entfernt"; return r; });
    if (koerper.reduce((s, b) => s + bytes(b), 0) > budget) {
      const anteile = verteilen(koerper.map(bytes), budget);
      koerper = koerper.map((b, i) => {
        if (bytes(b) <= anteile[i]) return b;
        vermerk[i] = `Ballast entfernt und auf ${Math.round(anteile[i] / 1024)} KB gekürzt`;
        return abschneiden(b, anteile[i]);
      });
    }
  }
  for (const [i, t] of teile.entries()) {
    const info = { url: t.url, endadresse: t.finalUrl, zeit: t.zeit, ...(t.status ? { status: t.status } : {}), ...(t.fehler ? { fehler: t.fehler } : {}),
      bytes: bytes(t.body), ...(vermerk[i] ? { gekuerzt: vermerk[i] } : {}) };
    inhalt += `<!-- fachbrief-diagnose ${JSON.stringify(info).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/--/g, "-\\u002d")} -->\n${koerper[i]}\n`;
  }
  await diagnoseLoeschen(quelle.id);
  await mkdir(path.join(ROOT, DIAGNOSE_ORDNER), { recursive: true });
  await writeFile(path.join(ROOT, datei), inhalt, "utf8");
  return datei;
}

/** --datei: gespeicherten Schnappschuss (oder beliebige gespeicherte Seite) in Teile je Adresse zerlegen. */
async function dateiTeile(quelle) {
  let inhalt = null;
  for (const basis of [process.cwd(), ROOT]) {
    try { inhalt = await readFile(path.resolve(basis, DATEI), "utf8"); break; } catch { /* nächster Ort */ }
  }
  if (inhalt === null) throw new Error(`Datei für --datei nicht gefunden: ${DATEI}`);
  const marken = [...inhalt.matchAll(DIAGNOSE_MARKE)];
  if (!marken.length) {
    // beliebige gespeicherte Seite: gilt als Inhalt der ersten Adresse der Quelle
    const url = platzhalter(quelle.urls[0]);
    return [{ url, finalUrl: url, body: inhalt, zeit: "" }];
  }
  return marken.map((m, i) => {
    const info = JSON.parse(m[1]);
    const body = inhalt.slice(m.index + m[0].length, i + 1 < marken.length ? marken[i + 1].index : inhalt.length);
    // Fehlerseiten und leere Teile wie beim Abruf als Fehler behandeln; Leserfehler (z. B. „kein RSS-Feed“) neu prüfen
    const kaputt = info.status >= 400 || !body.trim();
    return { url: info.url || platzhalter(quelle.urls[i] || quelle.urls[0]), finalUrl: info.endadresse || info.url, zeit: info.zeit || "", status: info.status,
      fehler: kaputt ? info.fehler || (info.status ? `HTTP ${info.status}` : "kein Inhalt") : "", body };
  });
}

// ---------- --zustand: Übersicht und Meldung an den Workflow ----------
async function zustandZeigen() {
  const quellen = await readJson("quellen.json");
  const aktiv = new Map(quellen.filter(q => q.aktiv !== false).map(q => [q.id, q]));
  let daten;
  try { daten = await readJson(ZUSTAND_DATEI, null); } catch (error) {
    console.error(`${ZUSTAND_DATEI} ist nicht lesbar (${error.message}). Der nächste Abruf legt den Zustand neu an.`);
    if (STRENG) process.exitCode = 1;
    return;
  }
  if (!daten) { console.log(`Noch kein Zustand gespeichert (${ZUSTAND_DATEI} fehlt) – erst nach dem nächsten Abruf.`); return; }
  const jetzt = Date.now();
  const eintraege = Object.entries(daten.quellen || {}).filter(([id]) => aktiv.has(id));
  const zahl = z => eintraege.filter(([, e]) => e.zustand === z).length;
  console.log(`Quellenzustand (Stand ${tagKurz(daten.stand)}): ${zahl("ok")} ok, ${zahl("auffaellig")} auffällig, ${zahl("gestoert")} gestört.`);
  const reihe = { gestoert: 0, auffaellig: 1 };
  for (const [id, e] of eintraege.filter(([, e]) => e.zustand !== "ok").sort((a, b) => reihe[a[1].zustand] - reihe[b[1].zustand] || (a[1].seit || "").localeCompare(b[1].seit || ""))) {
    console.log(`\n${e.zustand === "gestoert" ? "✗ gestört   " : "⚠ auffällig "} ${id} – ${aktiv.get(id).name} (seit ${tagKurz(e.seit)})\n   ${e.hinweis}`
      + (e.beispiele?.length ? "\n   z. B.: " + e.beispiele.map(b => `${b.grund}: „${cut(b.titel || "", 60)}“ ${b.url || ""}`).join("\n          ") : "")
      + (e.diagnose ? `\n   Schnappschuss: ${e.diagnose} → node werkzeuge/sammeln.mjs --probe --nur=${id} --datei=${e.diagnose}` : ""));
  }
  const lange = eintraege.filter(([, e]) => e.zustand === "gestoert" && jetzt - Date.parse(e.seit) > MELDEN_STUNDEN * 3600_000);
  if (!STRENG || !lange.length) return;
  const zeilen = lange.map(([id, e]) => `${aktiv.get(id).name} (${id}) – gestört seit ${tagKurz(e.seit)} (${Math.floor((jetzt - Date.parse(e.seit)) / 86_400_000)} Tage): ${e.hinweis}`);
  const titel = lange.length === 1 ? "Eine Quelle ist seit über 2 Tagen gestört" : `${lange.length} Quellen sind seit über 2 Tagen gestört`;
  const schluss = "Der Abruf selbst ist gelaufen und gespeichert. Reparatur: REDAKTION.md, Abschnitt „Quellenpflege“ "
    + "(Zustand in daten/quellen-zustand.json, Schnappschüsse in daten/diagnose/, Protokoll in daten/wartung.md).";
  if (process.env.GITHUB_ACTIONS) for (const z of zeilen) console.log(`::error title=${titel}::${z.replace(/%/g, "%25").replace(/\r?\n/g, " ")}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## ${titel}\n\n${zeilen.map(z => "- " + z).join("\n")}\n\n${schluss}\n`).catch(() => {});
  }
  console.error(`\n${titel}:\n${zeilen.map(z => "  ✗ " + z).join("\n")}\n\n${schluss}`);
  process.exitCode = 1;
}

async function beschreibungNachladen(k) {
  try {
    const res = await fetch(k.url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(10_000) });
    if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) return "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let head = "";
    while (head.length < 150_000 && !/<\/head>/i.test(head)) {
      const { value, done } = await reader.read();
      if (done) break;
      head += dec.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    const metas = [...head.matchAll(/<meta\b[^>]+>/gi)].map(m => m[0]);
    for (const name of ["og:description", "description", "twitter:description"]) {
      const tag = metas.find(t => (attr(t, "property") || attr(t, "name")).toLowerCase() === name);
      const inhalt = tag && text(attr(tag, "content"));
      if (inhalt && inhalt.length >= 40 && !MUELL.test(inhalt)) return inhalt;
    }
  } catch { /* ohne Beschreibung weiter */ }
  return "";
}

async function inGruppen(liste, groesse, fn) {
  const out = [];
  for (let i = 0; i < liste.length; i += groesse) out.push(...await Promise.all(liste.slice(i, i + groesse).map(fn)));
  return out;
}

function beispielMerken(p, titel, url, grund) {
  if (p.beispiele.length < 3 && !p.beispiele.some(b => b.url === url && b.grund === grund)) p.beispiele.push({ grund, titel: cut(titel || "", 120), url: url || "" });
}

/** --datei: alle gelesenen Einträge mit Prüfergebnis zeigen, damit sich eine Reparatur offline beurteilen lässt. */
function dateiBericht(q, p, z) {
  const mitDatum = p.eintraege.filter(e => e.datum);
  const tage = [...new Set(mitDatum.map(e => e.datum))].sort();
  const brauchbar = p.eintraege.filter(e => !e.grund).length;
  console.log(`\nOffline-Probe [${q.id}] aus ${DATEI} – Linkprüfung übersprungen (offline, wird beim nächsten Abruf nachgeholt).`);
  console.log(`  ${p.eintraege.length} Einträge gelesen, ${brauchbar} brauchbar, ${p.eintraege.length - brauchbar} unbrauchbar; Datum bei ${mitDatum.length}`
    + `${tage.length ? ` (${tage.length} verschiedene, ${tage[0]} bis ${tage[tage.length - 1]})` : ""}.`);
  if (mitDatum.length >= 4 && tage.length === 1) console.log("  ⚠ Alle Einträge tragen dasselbe Datum – Datumserkennung prüfen (z. B. datumNach).");
  for (const e of p.eintraege.slice(0, 40)) {
    const merk = e.grund ? `   [${e.grund}]` : e.bekannt ? "   (schon bekannt)" : e.zuAlt ? "   (älter als 3 Tage)" : "   (neu)";
    console.log(`  ${e.grund ? "✗" : "✓"} ${(e.datum || "----------").padEnd(10)}  ${cut(e.titel || "(ohne Titel)", 100)}${merk}\n                ${(e.url || "(ohne Link)").slice(0, 120)}`);
  }
  if (p.eintraege.length > 40) console.log(`  … und ${p.eintraege.length - 40} weitere`);
  console.log(`\nBewertung nach diesem Ergebnis (ohne Linkprüfung): ${z.zustand} – ${z.hinweis}`);
}

async function main() {
  if (ZUSTAND) return zustandZeigen();
  if (DATEI && (!PROBE || ONLY.length !== 1)) {
    console.error("--datei geht nur zusammen mit --probe und genau einer Quelle, z. B.: node werkzeuge/sammeln.mjs --probe --nur=ism --datei=daten/diagnose/ism.html");
    process.exit(1);
  }
  const alleQuellen = await readJson("quellen.json");
  // mit --probe lassen sich über --nur auch abgeschaltete Quellen testen (z. B. vor dem Wiedereinschalten)
  const quellen = ZWISCHEN
    ? alleQuellen.filter(q => q.aktiv !== false && Array.isArray(q.stuendlich) && q.stuendlich.length).map(q => ({ ...q, urls: q.stuendlich }))
    : alleQuellen.filter(q => (q.aktiv !== false || (PROBE && ONLY.includes(q.id))) && (!ONLY.length || ONLY.includes(q.id)));
  if (ZWISCHEN && !quellen.length) { console.log("Zwischenabruf: Keine Quelle hat „stuendlich“-Adressen – nichts zu tun."); return; }
  const takt = {};                 // je Feed-Adresse: gezeigte und noch unbekannte Einträge dieses Laufs
  const unbekannt = ONLY.filter(id => !alleQuellen.some(q => q.id === id));
  if (unbekannt.length) console.log(`Unbekannte Quelle(n) in --nur: ${unbekannt.join(", ")}`);
  if (DATEI && !quellen.length) { console.error(`Keine Quelle „${ONLY[0]}“ in quellen.json.`); process.exit(1); }
  const gesehen = await readJson("daten/gesehen.json", { stand: "", links: {} });
  const jetzt = new Date();

  const status = {};
  const kandidaten = [];
  const termine = [];
  const ergebnisse = await inGruppen(quellen, 8, async q => [q, await quelleAbrufen(q)]);

  // 1. Schranken ohne Netz: Titel und Link jedes gefundenen Eintrags prüfen, neue Kandidaten vormerken.
  //    Verworfene Kandidaten werden nicht als bekannt gemerkt – nach einer Reparatur der Quelle kommen sie wieder.
  const pruefung = {};
  const vorgemerkt = [];
  const vergeben = new Set();
  for (const [q, abruf] of ergebnisse) {
    const p = pruefung[q.id] = {
      gefunden: abruf.ergebnisse.length, unbrauchbar: 0, neu: 0, verworfen: { titel: 0, link: 0, linkpruefung: 0 },
      linkGeprueft: 0, linkHart: 0, linkWeich: 0, gruende: [], verworfenGruende: [], linkGruende: [], beispiele: [], verworfenListe: [], eintraege: [],
      juengstes: "", neuTitel: "",   // für die Quellen-Kontrolle: jüngstes Datum, das die Quelle zeigt, und der Titel der letzten neuen Meldung
    };
    if (q.typ === "ratsinfo") {
      for (const t of abruf.ergebnisse) {
        if (t.datum >= dayOffset(HEUTE, -1) && t.datum <= dayOffset(HEUTE, 28)) termine.push({ ...t, quelle: q.id });
      }
      continue;
    }
    const ctx = schrankenKontext(q, abruf);
    for (const it of abruf.ergebnisse) {
      const titel = titelFuer(q, it.titel);
      const grund = titelGrund(titel, ctx) || linkGrund(it.url, ctx);
      if (grund) { p.unbrauchbar++; p.gruende.push(grund); beispielMerken(p, titel, it.url, grund); }
      let id = "";
      try { id = it.url ? idOf(it.url) : ""; } catch { /* ungültiger Link – schon als unbrauchbar gezählt */ }
      const zukunft = it.datum && it.datum > dayOffset(HEUTE, 1);
      const zuAlt = it.datum && !zukunft && it.datum < dayOffset(HEUTE, -ALTER_MAX);
      if (it.datum && !zukunft && it.datum > p.juengstes) p.juengstes = it.datum;
      const bekannt = Boolean(id && gesehen.links[id]);
      if (q.typ === "rss" && it.adr) { const m = takt[it.adr] ||= { quelle: q.id, gezeigt: 0, unbekannt: 0 }; m.gezeigt++; if (id && !bekannt && !zuAlt) m.unbekannt++; }
      if (DATEI) p.eintraege.push({ titel, url: it.url || "", datum: it.datum || "", grund, bekannt, zuAlt });
      if (zuAlt && !bekannt && it.url) (p.zuAlt ||= []).push({ url: it.url, datum: it.datum });
      if (!id || zuAlt || bekannt || vergeben.has(id)) continue;
      if (q.filter && !new RegExp(q.filter, "i").test(it.titel + " " + it.teaser + " " + it.url)) continue;
      if (grund) {
        p.verworfen[grund.startsWith("Link") ? "link" : "titel"]++;
        p.verworfenGruende.push(grund);
        p.verworfenListe.push({ titel, url: it.url, grund });
        continue;
      }
      vergeben.add(id);
      // Grundstand: undatierte Meldungen nur als bekannt merken – per --grundstand oder, für eine neu eingeschaltete Übersichtsseite,
      // mit "grundstand": "JJJJ-MM-TT" in quellen.json (gilt bis einschließlich diesem Tag, also für den ersten Abruf danach)
      if ((GRUNDSTAND || (q.grundstand && HEUTE <= q.grundstand)) && !it.datum) { gesehen.links[id] = HEUTE; continue; }
      vorgemerkt.push({ p, k: {
        id, url: it.url, quelle: q.id, titel, teaser: MUELL.test(it.teaser || "") ? "" : cut(it.teaser, 420),
        datum: zukunft ? "" : (it.datum || ""), ...(zukunft ? { termin: it.datum } : {}),
      } });
    }
  }

  // 2. Linkprüfung für jeden neuen Kandidaten: Status ≥ 400 oder Netzfehler → verwerfen (offline mit --datei übersprungen)
  const linkErgebnis = new Map();
  if (!DATEI) {
    const urls = [...new Set(vorgemerkt.map(v => v.k.url))];
    await parallel(urls, LINK_PARALLEL, async u => linkErgebnis.set(u, await linkPruefen(u)));
  }
  for (const { p, k } of vorgemerkt) {
    const r = linkErgebnis.get(k.url);
    if (r) {
      p.linkGeprueft++;
      if (!r.ok) {
        p.verworfen.linkpruefung++;
        if (r.weich) { p.linkWeich++; p.linkGruende.push(r.grund); } else { p.linkHart++; p.gruende.push(r.grund); }
        p.verworfenGruende.push(r.grund);
        p.verworfenListe.push({ titel: k.titel, url: k.url, grund: r.grund });
        beispielMerken(p, k.titel, k.url, r.grund);
        continue;
      }
    }
    kandidaten.push(k);
    p.neu++; p.neuTitel = k.titel;
  }
  for (const [q, { ergebnisse: items, fehler }] of ergebnisse) {
    status[q.id] = { ok: items.length > 0 || !fehler.length, treffer: items.length, neu: q.typ === "ratsinfo" ? undefined : pruefung[q.id].neu, fehler: fehler.length ? fehler : undefined };
  }

  // Kurzbeschreibung nachladen, wo die Quelle keine liefert (nur Fachquellen, begrenzt; offline nicht)
  const ohneText = DATEI ? [] : kandidaten.filter(k => (k.teaser || "").length < 60 && !["spiegel", "az", "swr"].includes(k.quelle)).slice(0, 50);
  const nachgeladen = await inGruppen(ohneText, 8, async k => [k, await beschreibungNachladen(k)]);
  for (const [k, beschreibung] of nachgeladen) if (beschreibung) k.teaser = cut(beschreibung, 420);

  // 3. Zustand je Quelle aus Verlauf und diesem Lauf (bei --probe nur angezeigt, nicht gespeichert)
  // eine beschädigte Zustandsdatei darf den Abruf nicht aufhalten: dann beginnt der Verlauf neu
  const zustandAlt = await readJson(ZUSTAND_DATEI, { quellen: {} }).catch(error => {
    console.log(`Warnung: ${ZUSTAND_DATEI} nicht lesbar (${error.message}) – Zustandsverlauf beginnt neu.`);
    return { quellen: {} };
  });
  const statusAlt = await readJson("docs/daten/status.json", { stand: "", quellen: [] }).catch(() => ({ stand: "", quellen: [] }));
  const zustand = {};
  for (const [q, abruf] of ergebnisse) {
    zustand[q.id] = zustandBerechnen(q, zustandAlt.quellen?.[q.id] || startZustand(q.id, statusAlt), abruf, pruefung[q.id], jetzt.toISOString());
  }

  const summe = v => v.titel + v.link + v.linkpruefung;
  if (umwege.length) console.log(`Über den Umweg geholt (direkt nicht erreichbar): ${[...new Set(umwege)].join(", ")}`);
  const zusammenfassung = Object.entries(status).map(([id, s]) => {
    const z = zustand[id], v = summe(pruefung[id].verworfen);
    return `${s.ok ? "✓" : "✗"} ${id.padEnd(22)} ${String(s.treffer).padStart(3)} gefunden${s.neu !== undefined ? `, ${String(s.neu).padStart(3)} neu` : ""}`
      + `${v ? `, ${v} verworfen` : ""}${s.fehler ? "  ⚠ " + s.fehler.join(" | ") : ""}${z.zustand !== "ok" ? `\n    → ${z.zustand}: ${z.hinweis}` : ""}`;
  });
  console.log(zusammenfassung.join("\n"));
  const anzahl = x => Object.values(zustand).filter(z => z.zustand === x).length;
  const linksKaputt = [...linkErgebnis.values()].filter(r => !r.ok).length;
  console.log(`\n${kandidaten.length} neue Kandidaten (${Object.values(pruefung).reduce((s, p) => s + summe(p.verworfen), 0)} verworfen), ${termine.length} Sitzungstermine, `
    + `${Object.values(status).filter(s => !s.ok).length} Quellen mit Fehlern. Zustand: ${anzahl("ok")} ok, ${anzahl("auffaellig")} auffällig, ${anzahl("gestoert")} gestört.`
    + (DATEI ? "\nLinkprüfung übersprungen (Offline-Modus --datei)." : `\nLinkprüfung: ${linkErgebnis.size} neue Links geprüft, ${linksKaputt} nicht erreichbar.`));

  if (PROBE) {
    for (const q of quellen) {
      const eigene = kandidaten.filter(k => k.quelle === q.id).slice(0, 4);
      if (eigene.length) console.log(`\n[${q.id}]\n` + eigene.map(k => `  ${k.datum || k.termin || "----------"}  ${k.titel.slice(0, 90)}\n              ${k.url.slice(0, 110)}\n              ${(k.teaser || "").slice(0, 110)}`).join("\n"));
      const weg = pruefung[q.id].verworfenListe;
      if (weg.length) console.log(`\n[${q.id}] verworfen:\n` + weg.slice(0, 4).map(b => `  ✗ ${b.grund}: ${cut(b.titel || "(ohne Titel)", 80)}\n              ${(b.url || "(ohne Link)").slice(0, 110)}`).join("\n"));
    }
    if (termine.length) console.log("\n[termine]\n" + termine.map(t => `  ${t.datum} ${t.zeit} ${t.titel}  ${t.url}`).join("\n"));
    if (DATEI) dateiBericht(quellen[0], pruefung[quellen[0].id], zustand[quellen[0].id]);
    console.log("\nProbe: nichts gespeichert.");
    return;
  }

  // Pool-Datei schreiben (nur neue Kandidaten)
  const stempel = jetzt.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
  if (kandidaten.length) {
    await writeJson(`daten/pool/${stempel}.json`, { abgerufen: jetzt.toISOString(), kandidaten });
  }
  for (const k of kandidaten) gesehen.links[k.id] = HEUTE;
  // Abruftakt: je Feed-Adresse festhalten, wie viele Einträge der Feed zeigte und wie viele davon noch unbekannt waren. Waren (fast) alle
  // unbekannt, gab es keine Überlappung mit dem vorigen Abruf – dann können Meldungen durchgerutscht sein. Wertet werkzeuge/abruf-takt.mjs aus.
  if (!ONLY.length && (!ZWISCHEN || kandidaten.length)) {
    const messung = await readJson("daten/abruf-takt.json", { adressen: {} });
    messung.info = "Vom Quellenabruf geschrieben. Je Feed-Adresse: [Zeit (UTC), gezeigte Einträge, davon unbekannt, v = voller Abruf / z = Zwischenabruf]. Auswertung: node werkzeuge/abruf-takt.mjs";
    for (const [adr, m] of Object.entries(takt)) {
      const e = messung.adressen[adr] ||= { quelle: m.quelle, beobachtungen: [] };
      e.quelle = m.quelle; e.beobachtungen.push([jetzt.toISOString().slice(0, 16), m.gezeigt, m.unbekannt, ZWISCHEN ? "z" : "v"]);
      e.beobachtungen = e.beobachtungen.slice(-200);
    }
    await writeJson("daten/abruf-takt.json", messung, false);
  }
  if (ZWISCHEN) {
    // Zwischenabruf: nur speichern, wenn es etwas Neues gibt – sonst entsteht kein Commit; Status, Zustand und Webseite bleiben unberührt
    if (kandidaten.length) { gesehen.stand = jetzt.toISOString(); await writeJson("daten/gesehen.json", gesehen, false); }
    console.log(`Zwischenabruf: ${kandidaten.length} neue Kandidaten aus ${quellen.map(q => q.id).join(", ")}.`);
    return;
  }
  const grenze = dayOffset(HEUTE, -GESEHEN_TAGE);
  for (const [id, tag] of Object.entries(gesehen.links)) if (tag < grenze) delete gesehen.links[id];
  gesehen.stand = jetzt.toISOString();
  await writeJson("daten/gesehen.json", gesehen, false);

  // Termine und Status für die Webseite
  const quellenNamen = Object.fromEntries(alleQuellen.map(q => [q.id, q.name]));
  if (ergebnisse.some(([q]) => q.typ === "ratsinfo")) {
    if (termine.length) await writeJson("docs/daten/termine.json", {
      stand: jetzt.toISOString(),
      termine: termine.sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit)),
    });
    // Gremien: Sitzungen mit Tagesordnung und Ergebnissen (mit Zwischenspeicher, Fehler brechen den Abruf nicht ab)
    try {
      const bisherGremien = await readJson("docs/daten/gremien.json", null);
      const gremien = await gremienAbrufen({ heute: HEUTE, bisher: bisherGremien });
      if (gremien?.sitzungen?.length) await writeJson("docs/daten/gremien.json", gremien, false);
      console.log(`Gremien: ${gremien?.sitzungen?.length || 0} Sitzungen, ${gremien?.abrufe?.gesamt ?? "?"} Abrufe.`);
    } catch (error) {
      console.error("Gremien-Abruf fehlgeschlagen:", error.message);
    }
  }
  // Status: bei Teilabrufen (--nur) die übrigen Quellen und den Zeitstempel aus dem bisherigen Stand übernehmen
  const bisher = ONLY.length ? await readJson("docs/daten/status.json", { stand: jetzt.toISOString(), quellen: [] }) : null;
  const info = Object.fromEntries(alleQuellen.map(q => [q.id, q]));
  const neuStatus = Object.entries(status).map(([id, s]) => ({
    id, name: quellenNamen[id], kurz: info[id].kurz, ebene: info[id].ebene, ok: s.ok, treffer: s.treffer, zustand: zustand[id].zustand, hinweis: zustand[id].hinweis,
  }));
  await writeJson("docs/daten/status.json", {
    stand: bisher ? bisher.stand : jetzt.toISOString(),
    quellen: [...(bisher ? bisher.quellen.filter(q => !status[q.id] && quellenNamen[q.id]) : []), ...neuStatus],
  });

  // Zustandsverlauf je Quelle; bei Teilabrufen (--nur) bleiben die übrigen Quellen unverändert
  const zustandNeu = {};
  for (const q of alleQuellen) {
    if (zustand[q.id]) zustandNeu[q.id] = zustand[q.id];
    else if (ONLY.length && zustandAlt.quellen?.[q.id]) zustandNeu[q.id] = zustandAlt.quellen[q.id];
  }
  // Diagnose-Schnappschüsse: auffällige oder gestörte HTML- und Sonderquellen sichern, bei ok löschen
  for (const [q, abruf] of ergebnisse) {
    const z = zustandNeu[q.id];
    delete z.diagnose;
    if (q.typ !== "rss" && z.zustand !== "ok") {
      const datei = await diagnoseSchreiben(q, abruf, z, jetzt.toISOString());
      if (datei) z.diagnose = datei;
    } else {
      await diagnoseLoeschen(q.id);
    }
  }
  if (!ONLY.length) {
    // Schnappschüsse abgeschalteter oder entfernter Quellen aufräumen
    const aktiv = new Set(alleQuellen.filter(q => q.aktiv !== false).map(q => q.id));
    for (const datei of await readdir(path.join(ROOT, DIAGNOSE_ORDNER)).catch(() => [])) {
      const m = datei.match(/^([a-z0-9-]+)\.(?:html|xml|json)$/);
      if (m && !aktiv.has(m[1])) await unlink(path.join(ROOT, DIAGNOSE_ORDNER, datei)).catch(() => {});
    }
  }
  await mkdir(path.dirname(path.join(ROOT, ZUSTAND_DATEI)), { recursive: true });
  await writeFile(path.join(ROOT, ZUSTAND_DATEI), zustandJson({
    stand: jetzt.toISOString(),
    info: "Vom Quellenabruf (werkzeuge/sammeln.mjs) geschrieben, nicht von Hand ändern. zustand: ok | auffaellig | gestoert; "
      + "trefferVerlauf: brauchbare Treffer der letzten 14 Läufe (null = Abruf fehlgeschlagen); verworfen: neue Kandidaten des letzten Laufs, "
      + "die an Titel-, Link- oder Linkprüfung scheiterten. Reparatur: REDAKTION.md, Abschnitt „Quellenpflege“.",
    quellen: zustandNeu,
  }), "utf8");

  // alte Pool-Dateien aufräumen
  const pool = path.join(ROOT, "daten/pool");
  const altGrenze = dayOffset(HEUTE, -POOL_TAGE).replace(/-/g, "");
  for (const datei of await readdir(pool).catch(() => [])) {
    if (/^\d{8}-\d{4}\.json$/.test(datei) && datei.slice(0, 8) < altGrenze) await unlink(path.join(pool, datei));
  }
}

main().catch(error => {
  console.error("Abruf fehlgeschlagen:", error);
  process.exit(1);
});
