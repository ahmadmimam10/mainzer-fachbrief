#!/usr/bin/env node
/**
 * Notion-Abgleich für die Übergangszeit (bis 6.12.2026): Kommt alles, was die alte Make.com-Automatisierung in die
 * Notion-Datenbank „AZ“ schreibt, auch beim eigenen Abruf (werkzeuge/sammeln.mjs) an?
 *
 * Läuft täglich um 12 Uhr (.github/workflows/notion-abgleich.yml). Nimmt alle Notion-Einträge des Vortags (Berliner Zeit),
 * sucht jeden Artikel im Pool (daten/pool, zehn Tage) und unter den bekannten Links (daten/gesehen.json) und schreibt das
 * Ergebnis nach daten/notion-abgleich.json. Angezeigt wird es in docs/verwaltung.html („Notion-Abgleich“).
 *
 * Fehlt ein Artikel, steht ein Grund dabei:
 *   rubrik   Die Quelle ruft GitHub ab, diese Rubrik aber nicht (z. B. AZ Rheinhessen). Mit vermuteter Feed-Adresse.
 *   alt      Der Artikel war beim Eintrag in Notion älter als drei Tage. Der Abruf übernimmt bewusst nichts Älteres.
 *   quelle   Diese Quelle gibt es beim Abruf nicht oder sie ist pausiert.
 *   unklar   Hätte der Abruf sehen müssen. Genauer ansehen.
 *
 *   node werkzeuge/notion-abgleich.mjs                   Vortag abgleichen, verpasste Tage nachholen (braucht NOTION_TOKEN)
 *   node werkzeuge/notion-abgleich.mjs --tag=2026-11-21  einen bestimmten Tag (neu) abgleichen
 *   node werkzeuge/notion-abgleich.mjs --datei=<json>    Notion-Einträge aus einer Datei statt aus Notion (Test, Nachtrag)
 *                                                        Format: [[Zeit, Quelle, URL, Titel, Datum, Anzahl], …]
 *   node werkzeuge/notion-abgleich.mjs --ist-beendet     Ende mit 0, wenn die zwei Wochen vorbei sind (der Ablauf schaltet sich ab)
 *
 * Scheitert nie: Fehlt der Zugang oder antwortet Notion nicht, steht das in der Datei, und der Lauf endet normal.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { ROOT, berlinDay, berlinTime, dayOffset, readJson, writeJson, cut, cleanUrl, urlKey, idOf } from "./lib.mjs";

const DATENQUELLE = "1c59c874-32ff-8043-98df-000b538e2fdc";   // Notion: Seite „News“ → Datenbank „AZ“
const NOTION_VERSION = "2026-03-11";
const ERSTER_TAG = "2026-11-21";                // erster abgeglichener Tag (von Hand nachgetragen)
const LETZTER_LAUF = "2026-12-06";              // letzter Lauf; er gleicht den 5. Dezember ab
const LETZTER_TAG = dayOffset(LETZTER_LAUF, -1);
const NACHHOLEN = 4;                            // so viele verpasste Tage holt ein Lauf höchstens nach
const ALT_TAGE = 3;                             // wie ALTER_MAX in sammeln.mjs
const DATEI = "daten/notion-abgleich.json";

const argv = process.argv.slice(2);
const opt = n => (argv.find(a => a.startsWith(`--${n}=`)) || "").slice(n.length + 3);
const HEUTE = berlinDay();

if (argv.includes("--ist-beendet")) process.exit(HEUTE > LETZTER_LAUF ? 0 : 1);

// Namen aus Notion → Quelle des Abrufs, falls die Adresse allein nicht reicht
const NAME_ZU_QUELLE = {
  "allgemeine zeitung": "az", "spiegel": "spiegel", "bildungsserver": "bildungsserver", "difu": "difu", "mainz pressemeldungen": "stadt-mainz",
  "bundesministerium für bildung, familie, senioren, frauen und jugend": "bmbfsfj", "nzfh nachrichten": "nzfh", "nzfh kurznachrichten": "nzfh",
  "jugendhilfeportal.de": "jugendhilfeportal", "bundestag": "bundestag", "landtag": "landtag", "kosmo": "kosmo", "deutsches jugendinstitut": "dji",
  "bundesratkompakt": "bundesrat", "jugendgerecht.de": "jugendgerecht", "jadigital": "jadigital", "bildungsminsterium": "bm-rlp",
  "bildungsministerium": "bm-rlp", "deutscher verein veranstaltungen": "dv", "deutscher verein": "dv",
};

const host = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };
const pfad = u => { try { return decodeURIComponent(new URL(u).pathname).toLowerCase(); } catch { return ""; } };
const titelNorm = t => String(t || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Vergleichsschlüssel: genau wie beim Abruf (gesäuberte Adresse) und – wenn der Pfad selbst den Artikel benennt – nur Host und Pfad. */
function schluessel(url) {
  const sauber = cleanUrl(url);
  if (!sauber) return [];
  const k = [urlKey(sauber)], p = pfad(sauber).replace(/\/+$/, "");
  if (/[a-z]{3,}-[a-z0-9]{2,}|\d{5,}/.test(p)) k.push(host(sauber) + p);
  return [...new Set(k)];
}

/** Berliner Mitternacht eines Tages als UTC-Zeitpunkt (Winter- und Sommerzeit). */
function mitternacht(tag) {
  for (const h of [1, 2]) { const d = new Date(Date.parse(tag + "T00:00:00Z") - h * 3600e3); if (berlinDay(d) === tag && berlinTime(d) === "00:00") return d; }
  return new Date(Date.parse(tag + "T00:00:00Z") - 3600e3);
}

// ---------- Notion lesen ----------
const text = x => !x ? "" : (x.type === "title" || x.type === "rich_text") ? (x[x.type] || []).map(t => t.plain_text || "").join("") : x.type === "url" ? (x.url || "") : "";
function eintragAusSeite(s) {
  const p = s.properties || {}, werte = Object.values(p);
  return { zeit: s.created_time, quelle: text(p.Quelle).trim(), url: text(werte.find(x => x.type === "url")).trim(), titel: text(werte.find(x => x.type === "title")).trim(), datum: (p.Datum && p.Datum.date && p.Datum.date.start) || "" };
}
async function notionLesen(von, bis) {
  const token = process.env.NOTION_TOKEN;
  if (!token) { const e = new Error("Der Notion-Zugang fehlt noch: Im Repository gibt es kein GitHub-Secret „NOTION_TOKEN“."); e.zugang = "fehlt"; throw e; }
  const zeilen = [];
  let cursor;
  for (let seite = 0; seite < 40; seite++) {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${DATENQUELLE}/query`, {
      method: "POST", signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: { and: [{ timestamp: "created_time", created_time: { on_or_after: von.toISOString() } }, { timestamp: "created_time", created_time: { before: bis.toISOString() } }] },
        sorts: [{ timestamp: "created_time", direction: "ascending" }], page_size: 100, ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(r.status === 401 ? "Notion lehnt den Schlüssel ab (GitHub-Secret „NOTION_TOKEN“ prüfen)."
        : r.status === 404 ? "Notion kennt den Schlüssel, aber die Datenbank „AZ“ ist für ihn nicht freigegeben (in Notion bei „AZ“: ••• → Verbindungen → die Verbindung hinzufügen)."
        : `Notion antwortet mit ${r.status}${j.message ? ": " + j.message : ""}.`);
      e.zugang = r.status === 401 || r.status === 404 ? "fehlt" : "fehler";
      throw e;
    }
    for (const s of j.results || []) zeilen.push(eintragAusSeite(s));
    if (!j.has_more || !j.next_cursor) break;
    cursor = j.next_cursor;
  }
  return zeilen;
}
async function dateiLesen(datei) {
  const roh = JSON.parse(await readFile(path.resolve(datei), "utf8"));
  return roh.flatMap(z => {
    const e = Array.isArray(z) ? { zeit: z[0], quelle: z[1], url: z[2], titel: z[3], datum: z[4] || "", anzahl: z[5] || 1 } : { anzahl: 1, ...z };
    return Array.from({ length: Math.max(1, Number(e.anzahl) || 1) }, () => ({ zeit: new Date(e.zeit).toISOString(), quelle: e.quelle || "", url: e.url || "", titel: e.titel || "", datum: e.datum || "" }));
  });
}

// ---------- Was der Abruf kennt ----------
async function abrufLesen() {
  const pool = [];
  for (const d of (await readdir(path.join(ROOT, "daten/pool")).catch(() => [])).filter(d => /^\d{8}-\d{4}\.json$/.test(d)).sort()) {
    const p = await readJson("daten/pool/" + d, { kandidaten: [] });
    const zeit = p.abgerufen || `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:00Z`;
    for (const k of p.kandidaten || []) if (k.url) pool.push({ url: k.url, titel: k.titel || "", quelle: k.quelle, zeit });
  }
  const gesehen = (await readJson("daten/gesehen.json", { links: {} })).links || {};
  const nachSchluessel = new Map(), nachTitel = new Map();
  for (const p of pool) {
    for (const k of schluessel(p.url)) if (!nachSchluessel.has(k)) nachSchluessel.set(k, p);
    const t = p.quelle + "|" + titelNorm(p.titel); if (titelNorm(p.titel).length >= 12 && !nachTitel.has(t)) nachTitel.set(t, p);
  }
  return { pool, gesehen, nachSchluessel, nachTitel };
}

// ---------- Rubriken: welche Teile einer Quelle der Abruf abdeckt ----------
function rubrikenVon(q, pool) {
  const feeds = (q.urls || []).filter(u => !/[{}]/.test(u));
  const praefixe = feeds.map(u => {
    const p = pfad(u).replace(/^\/rss(?=\/)/, "").replace(/(?:index\.rss|feed\.rss|rss\.xml|index\.xml|feed\/?)$/, "");
    return { feed: u, host: host(u), praefix: p.endsWith("/") ? p : p + "/" };
  }).filter(x => x.praefix.split("/").filter(Boolean).length >= 1);
  if (!praefixe.length || praefixe.length < feeds.length) return null;            // es gibt einen Feed für „alles“
  const eigene = pool.filter(p => p.quelle === q.id);
  const passt = eigene.filter(p => praefixe.some(x => host(p.url) === x.host && pfad(p.url).startsWith(x.praefix))).length;
  if (eigene.length < 5 || passt < eigene.length * 0.8) return null;              // Feed-Pfade sagen nichts über die Artikel-Pfade
  return praefixe;
}
const schoen = s => s.split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join("-");
function rubrikPruefen(rubriken, url) {
  if (!rubriken) return null;
  const h = host(url), p = pfad(url);
  if (rubriken.some(x => x.host === h && p.startsWith(x.praefix))) return null;    // abgedeckt
  const tiefe = Math.min(...rubriken.map(x => x.praefix.split("/").filter(Boolean).length));
  const teile = p.split("/").filter(Boolean);
  if (teile.length <= tiefe) return null;
  const rubrik = "/" + teile.slice(0, tiefe).join("/") + "/";
  const vorlage = rubriken.find(x => x.praefix.split("/").filter(Boolean).length === tiefe) || rubriken[0];
  const name = teile.slice(0, tiefe).filter(t => t !== "lokales").map(schoen).join(" · ") || rubrik;
  return { rubrik, name, feed: vorlage.feed.replace(new RegExp(vorlage.praefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), rubrik) };
}

// ---------- Abgleich eines Tages ----------
function tagAbgleichen(tag, notion, abruf, quellen) {
  const qMap = new Map(quellen.map(q => [q.id, q]));
  const hostZuQuelle = new Map();
  for (const p of abruf.pool) { const h = host(p.url); if (h && !hostZuQuelle.has(h)) hostZuQuelle.set(h, p.quelle); }
  for (const q of quellen) for (const u of [...(q.urls || []), ...(q.stuendlich || [])]) { const h = host(u.replace(/\{[^}]*\}/g, "x")); if (h && !hostZuQuelle.has(h)) hostZuQuelle.set(h, q.id); }
  const quelleVon = n => hostZuQuelle.get(host(n.url)) || NAME_ZU_QUELLE[n.quelle.toLowerCase()] || "";
  const rubriken = new Map(quellen.map(q => [q.id, rubrikenVon(q, abruf.pool)]));

  const finden = n => {
    for (const k of schluessel(n.url)) { const p = abruf.nachSchluessel.get(k); if (p) return { p }; }
    const sauber = cleanUrl(n.url);
    if (sauber) { const tagGesehen = abruf.gesehen[idOf(sauber)]; if (tagGesehen) return { tag: tagGesehen }; }
    const q = quelleVon(n), t = titelNorm(n.titel);
    if (q && t.length >= 12) { const p = abruf.nachTitel.get(q + "|" + t); if (p) return { p }; }
    return null;
  };

  // Einträge des Tages, je Adresse nur einmal (Make.com schreibt manche Artikel doppelt)
  const desTages = notion.filter(n => berlinDay(new Date(n.zeit)) === tag);
  const artikel = new Map();
  let ohneLink = 0;
  for (const n of desTages) {
    if (!n.url) { ohneLink++; continue; }
    const k = schluessel(n.url)[0] || n.url;
    if (!artikel.has(k)) artikel.set(k, n);
  }

  const jeQuelle = new Map(), fehlend = [], vorsprung = [];
  const zeile = (name, id) => { const k = id || "?" + name; if (!jeQuelle.has(k)) jeQuelle.set(k, { name, id: id || "", notion: 0, erfasst: 0, fehlt: 0, zusaetzlich: 0 }); return jeQuelle.get(k); };
  for (const n of artikel.values()) {
    const id = quelleVon(n), z = zeile(n.quelle || host(n.url), id), f = finden(n);
    z.notion++;
    if (f) {
      z.erfasst++;
      if (f.p) vorsprung.push((Date.parse(n.zeit) - Date.parse(f.p.zeit)) / 60000);
      continue;
    }
    z.fehlt++;
    const q = qMap.get(id);
    let grund = "unklar", extra = {};
    if (!q || q.aktiv === false) { grund = "quelle"; extra = { hinweis: !q ? "Diese Quelle ruft GitHub nicht ab." : "Diese Quelle ist beim Abruf pausiert." }; }
    else {
      const r = rubrikPruefen(rubriken.get(id), cleanUrl(n.url) || n.url);
      if (r) { grund = "rubrik"; extra = { rubrik: r.rubrik, rubrikName: r.name, feed: r.feed }; }
      else if (n.datum && n.datum.slice(0, 10) < dayOffset(berlinDay(new Date(n.zeit)), -ALT_TAGE)) { grund = "alt"; extra = { datum: n.datum.slice(0, 10) }; }
    }
    fehlend.push({ titel: cut(n.titel, 160), url: n.url, quelle: n.quelle, id, zeit: n.zeit, grund, ...extra });
  }

  // Nur bei GitHub: Meldungen derselben Quellen, die der Abruf an diesem Tag fand und die in Notion (Vortag bis Folgetag) fehlen
  const notionSchluessel = new Set(), notionTitel = new Set();
  for (const n of notion.filter(n => { const t = berlinDay(new Date(n.zeit)); return t >= dayOffset(tag, -1) && t <= dayOffset(tag, 1); })) {
    for (const k of schluessel(n.url)) notionSchluessel.add(k);
    notionTitel.add(quelleVon(n) + "|" + titelNorm(n.titel));
  }
  const notionQuellen = new Set(notion.map(quelleVon).filter(Boolean));
  for (const p of abruf.pool) {
    if (berlinDay(new Date(p.zeit)) !== tag || !notionQuellen.has(p.quelle)) continue;
    if (schluessel(p.url).some(k => notionSchluessel.has(k)) || notionTitel.has(p.quelle + "|" + titelNorm(p.titel))) continue;
    zeile((qMap.get(p.quelle) || {}).name || p.quelle, p.quelle).zusaetzlich++;
  }

  const quellenZeilen = [...jeQuelle.values()].filter(z => z.notion || z.zusaetzlich).sort((a, b) => b.notion - a.notion || b.zusaetzlich - a.zusaetzlich);
  const summe = k => quellenZeilen.reduce((s, z) => s + z[k], 0);
  const v = median(vorsprung);
  return {
    tag, eintraege: desTages.length, notion: artikel.size, erfasst: summe("erfasst"), fehlt: summe("fehlt"), zusaetzlich: summe("zusaetzlich"),
    ...(ohneLink ? { ohneLink } : {}), vorsprungMinuten: v == null ? null : Math.round(v), quellen: quellenZeilen,
    fehlend: fehlend.sort((a, b) => ["unklar", "rubrik", "alt", "quelle"].indexOf(a.grund) - ["unklar", "rubrik", "alt", "quelle"].indexOf(b.grund) || a.zeit.localeCompare(b.zeit)),
  };
}

/** Über alle Tage: Wo liegen die Lücken? (je Quelle und Grund, Rubriken einzeln) */
function luecken(tage) {
  const g = new Map();
  for (const t of tage) for (const f of t.fehlend) {
    const k = [f.id || f.quelle, f.grund, f.rubrik || ""].join("|");
    const e = g.get(k) || { quelle: f.quelle, id: f.id, grund: f.grund, ...(f.rubrik ? { rubrik: f.rubrik, rubrikName: f.rubrikName, feed: f.feed } : {}), ...(f.hinweis ? { hinweis: f.hinweis } : {}), anzahl: 0, tage: [], beispiele: [] };
    e.anzahl++; if (!e.tage.includes(t.tag)) e.tage.push(t.tag); if (e.beispiele.length < 3) e.beispiele.push(f.titel);
    g.set(k, e);
  }
  return [...g.values()].sort((a, b) => (a.grund === "unklar" ? -1 : 0) - (b.grund === "unklar" ? -1 : 0) || b.anzahl - a.anzahl);
}

// ---------- Ablauf ----------
async function main() {
  const alt = await readJson(DATEI, null);
  const stand = alt || { tage: [] };
  const fertig = new Set(stand.tage.map(t => t.tag));
  const gestern = dayOffset(HEUTE, -1);
  let tage = [];
  if (opt("tag")) tage = [opt("tag")];
  else {
    const ab = [ERSTER_TAG, dayOffset(gestern, -(NACHHOLEN - 1))].sort().at(-1);
    for (let t = ab; t <= gestern && t <= LETZTER_TAG; t = dayOffset(t, 1)) if (!fertig.has(t)) tage.push(t);
  }
  if (!tage.length) { console.log(HEUTE > LETZTER_LAUF ? "Der Notion-Abgleich ist abgeschlossen." : "Nichts abzugleichen – alle Tage sind schon geprüft."); return; }

  let notion, zugang = "ok", hinweis = "";
  try {
    if (opt("datei")) notion = await dateiLesen(opt("datei"));
    else notion = await notionLesen(mitternacht(dayOffset(tage[0], -1)), new Date(Math.min(Date.now(), mitternacht(dayOffset(tage.at(-1), 2)).getTime())));
  } catch (e) {
    zugang = e.zugang || "fehler"; hinweis = e.message;
    console.log("Kein Abgleich: " + e.message);
  }

  const neu = { ...stand };
  if (notion) {
    const [abruf, quellen] = await Promise.all([abrufLesen(), readJson("quellen.json")]);
    for (const tag of tage) {
      const t = tagAbgleichen(tag, notion, abruf, quellen);
      if (!t.notion && !opt("datei")) { console.log(`${tag}: keine Einträge in Notion – Tag bleibt offen.`); continue; }
      neu.tage = [...neu.tage.filter(x => x.tag !== tag), t].sort((a, b) => b.tag.localeCompare(a.tag));
      console.log(`${tag}: ${t.notion} Artikel in Notion, ${t.erfasst} erfasst, ${t.fehlt} fehlen${t.fehlt ? " (" + [...new Set(t.fehlend.map(f => f.grund))].join(", ") + ")" : ""}, ${t.zusaetzlich} nur bei GitHub.`);
      for (const f of t.fehlend.slice(0, 12)) console.log(`   ✗ [${f.grund}${f.rubrikName ? ": " + f.rubrikName : ""}] ${f.quelle}: ${cut(f.titel, 80)}`);
    }
  }
  const tageAlle = neu.tage || [];
  const sum = k => tageAlle.reduce((s, t) => s + (t[k] || 0), 0);
  const ergebnis = {
    info: "Geschrieben von werkzeuge/notion-abgleich.mjs. Je Tag: Artikel, die Make.com in die Notion-Datenbank „AZ“ schrieb, und ob der Abruf sie auch hat. grund: rubrik / alt / quelle / unklar.",
    stand: new Date().toISOString(), zugang, ...(hinweis ? { hinweis } : {}), ersterTag: ERSTER_TAG, letzterTag: LETZTER_TAG, letzterLauf: LETZTER_LAUF,
    gesamt: { tage: tageAlle.length, notion: sum("notion"), erfasst: sum("erfasst"), fehlt: sum("fehlt"), zusaetzlich: sum("zusaetzlich") },
    luecken: luecken(tageAlle), tage: tageAlle,
  };
  const ohneStand = x => JSON.stringify({ ...x, stand: "" });
  if (!alt || ohneStand(alt) !== ohneStand(ergebnis)) { await writeJson(DATEI, ergebnis); console.log("Gespeichert: " + DATEI); }
  else console.log("Unverändert.");
}

main().catch(e => { console.log("Notion-Abgleich: unerwarteter Fehler – " + e.message); process.exit(0); });
