#!/usr/bin/env node
/**
 * Mainzer Fachbrief – Quellenabruf
 *
 * Ruft alle Quellen aus quellen.json ab und legt neue Meldungen als Kandidaten im Pool ab
 * (daten/pool/<Zeitpunkt>.json). Sitzungstermine aus dem Ratsinformationssystem landen in
 * docs/daten/termine.json, der Abrufstatus je Quelle in docs/daten/status.json.
 *
 *   node werkzeuge/sammeln.mjs                normaler Lauf
 *   node werkzeuge/sammeln.mjs --probe        nur testen und anzeigen, nichts speichern
 *   node werkzeuge/sammeln.mjs --nur=az,dji   nur bestimmte Quellen (mit --probe kombinierbar)
 */
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import {
  ROOT, UA, text, attr, parseDate, cleanUrl, urlKey, idOf, berlinDay, dayOffset, readJson, writeJson, cut,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const PROBE = argv.includes("--probe");
const GRUNDSTAND = argv.includes("--grundstand");   // undatierte Meldungen nur als bekannt merken (für neue Quellen)
const ONLY = (argv.find(a => a.startsWith("--nur=")) || "").slice(6).split(",").filter(Boolean);
const HEUTE = berlinDay();
const ALTER_MAX = 3;            // datierte Meldungen älter als 3 Tage werden ignoriert
const POOL_TAGE = 10;           // Poolabrufe älter als 10 Tage werden gelöscht
const GESEHEN_TAGE = 400;       // so lange merkt sich der Abruf bekannte Links

async function holen(url, accept) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "de-DE,de;q=0.9,en;q=0.4" },
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 8_000_000) throw new Error("Seite zu groß");
  const ct = res.headers.get("content-type") || "";
  let cs = (ct.match(/charset=["']?([\w-]+)/i) || [])[1];
  let body = new TextDecoder("utf-8").decode(buf);
  if (!cs) cs = (body.slice(0, 3000).match(/<meta[^>]+charset=["']?([\w-]+)/i) || body.slice(0, 300).match(/encoding=["']([\w-]+)/i) || [])[1];
  if (cs && !/^utf-?8$/i.test(cs)) {
    try { body = new TextDecoder(cs.toLowerCase()).decode(buf); } catch { /* bleibt UTF-8 */ }
  }
  return { body, finalUrl: res.url || url };
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
    out.push({
      url,
      titel: text(text(feld("title"))),
      teaser: text(text(feld("description") || feld("summary") || feld("content:encoded") || feld("content"))),
      datum: parseDate(feld("pubDate") || feld("dc:date") || feld("published") || feld("updated")),
    });
  }
  return out;
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
      const t = text(attr(l.attrs, "title")).replace(/^(?:weiterlesen|mehr|details|zum artikel|zur meldung)\s*[:–-]?\s*/i, "");
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
    const besserTitel = alt && alt.titel.length >= titel.length && alt.titel.length < 260 ? alt.titel : titel.slice(0, 300);
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
    const datum = parseDate(danach) || parseDate(ueberschrift);
    if (!datum || !/newsletter|ausgabe|leser/i.test(ueberschrift + " " + text(danach).slice(0, 300))) continue;
    const link = (danach.match(/<a\b[^>]*href="([^"]+)"/i) || [])[1];
    const u = new URL(basis);
    u.searchParams.set("ausgabe", datum);
    out.push({ url: link && /newsletter|ausgabe/i.test(link) ? cleanUrl(link, basis) : u.href, titel: ueberschrift, teaser: cut(text(danach), 300), datum });
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
  for (const url of quelle.urls.map(platzhalter)) {
    try {
      const accept = quelle.typ === "rss" ? "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5"
        : quelle.typ === "landtag-api" ? "application/json" : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5";
      const { body, finalUrl } = await holen(url, accept);
      const items = LESER[quelle.typ](body, quelle, finalUrl);
      ergebnisse.push(...items);
    } catch (error) {
      fehler.push(`${new URL(url).hostname}: ${error.message}`.slice(0, 160));
    }
  }
  return { ergebnisse, fehler };
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

async function main() {
  const alleQuellen = await readJson("quellen.json");
  const quellen = alleQuellen.filter(q => q.aktiv !== false && (!ONLY.length || ONLY.includes(q.id)));
  const gesehen = await readJson("daten/gesehen.json", { stand: "", links: {} });
  const jetzt = new Date();

  const status = {};
  const kandidaten = [];
  const termine = [];
  const ergebnisse = await inGruppen(quellen, 8, async q => [q, await quelleAbrufen(q)]);

  for (const [q, { ergebnisse: items, fehler }] of ergebnisse) {
    let neu = 0;
    if (q.typ === "ratsinfo") {
      for (const t of items) {
        if (t.datum >= dayOffset(HEUTE, -1) && t.datum <= dayOffset(HEUTE, 28)) termine.push({ ...t, quelle: q.id });
      }
    } else {
      for (const it of items) {
        if (!it.url || !it.titel) continue;
        const id = idOf(it.url);
        const zukunft = it.datum && it.datum > dayOffset(HEUTE, 1);
        const zuAlt = it.datum && !zukunft && it.datum < dayOffset(HEUTE, -ALTER_MAX);
        if (zuAlt || gesehen.links[id] || kandidaten.some(k => k.id === id)) continue;
        if (q.filter && !new RegExp(q.filter, "i").test(it.titel + " " + it.teaser + " " + it.url)) continue;
        if (GRUNDSTAND && !it.datum) { gesehen.links[id] = HEUTE; continue; }
        kandidaten.push({
          id, url: it.url, quelle: q.id, titel: cut(it.titel, 300), teaser: MUELL.test(it.teaser || "") ? "" : cut(it.teaser, 420),
          datum: zukunft ? "" : (it.datum || ""), ...(zukunft ? { termin: it.datum } : {}),
        });
        neu++;
      }
    }
    status[q.id] = { ok: items.length > 0 || !fehler.length, treffer: items.length, neu: q.typ === "ratsinfo" ? undefined : neu, fehler: fehler.length ? fehler : undefined };
  }

  // Kurzbeschreibung nachladen, wo die Quelle keine liefert (nur Fachquellen, begrenzt)
  const ohneText = kandidaten.filter(k => (k.teaser || "").length < 60 && !["spiegel", "az", "swr"].includes(k.quelle)).slice(0, 50);
  const nachgeladen = await inGruppen(ohneText, 8, async k => [k, await beschreibungNachladen(k)]);
  for (const [k, beschreibung] of nachgeladen) if (beschreibung) k.teaser = cut(beschreibung, 420);

  const zusammenfassung = Object.entries(status).map(([id, s]) => `${s.ok ? "✓" : "✗"} ${id.padEnd(22)} ${String(s.treffer).padStart(3)} gefunden${s.neu !== undefined ? `, ${String(s.neu).padStart(3)} neu` : ""}${s.fehler ? "  ⚠ " + s.fehler.join(" | ") : ""}`);
  console.log(zusammenfassung.join("\n"));
  console.log(`\n${kandidaten.length} neue Kandidaten, ${termine.length} Sitzungstermine, ${Object.values(status).filter(s => !s.ok).length} Quellen mit Fehlern.`);

  if (PROBE) {
    for (const q of quellen) {
      const eigene = kandidaten.filter(k => k.quelle === q.id).slice(0, 4);
      if (eigene.length) console.log(`\n[${q.id}]\n` + eigene.map(k => `  ${k.datum || k.termin || "----------"}  ${k.titel.slice(0, 90)}\n              ${k.url.slice(0, 110)}\n              ${(k.teaser || "").slice(0, 110)}`).join("\n"));
    }
    if (termine.length) console.log("\n[termine]\n" + termine.map(t => `  ${t.datum} ${t.zeit} ${t.titel}  ${t.url}`).join("\n"));
    return;
  }

  // Pool-Datei schreiben (nur neue Kandidaten)
  const stempel = jetzt.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
  if (kandidaten.length) {
    await writeJson(`daten/pool/${stempel}.json`, { abgerufen: jetzt.toISOString(), kandidaten });
  }
  for (const k of kandidaten) gesehen.links[k.id] = HEUTE;
  const grenze = dayOffset(HEUTE, -GESEHEN_TAGE);
  for (const [id, tag] of Object.entries(gesehen.links)) if (tag < grenze) delete gesehen.links[id];
  gesehen.stand = jetzt.toISOString();
  await writeJson("daten/gesehen.json", gesehen, false);

  // Termine und Status für die Webseite
  const quellenNamen = Object.fromEntries(alleQuellen.map(q => [q.id, q.name]));
  if (ergebnisse.some(([q]) => q.typ === "ratsinfo")) {
    await writeJson("docs/daten/termine.json", {
      stand: jetzt.toISOString(),
      termine: termine.sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit)),
    });
  }
  // Status: bei Teilabrufen (--nur) die übrigen Quellen und den Zeitstempel aus dem bisherigen Stand übernehmen
  const bisher = ONLY.length ? await readJson("docs/daten/status.json", { stand: jetzt.toISOString(), quellen: [] }) : null;
  const info = Object.fromEntries(alleQuellen.map(q => [q.id, q]));
  const neuStatus = Object.entries(status).map(([id, s]) => ({ id, name: quellenNamen[id], kurz: info[id].kurz, ebene: info[id].ebene, ok: s.ok, treffer: s.treffer }));
  await writeJson("docs/daten/status.json", {
    stand: bisher ? bisher.stand : jetzt.toISOString(),
    quellen: [...(bisher ? bisher.quellen.filter(q => !status[q.id] && quellenNamen[q.id]) : []), ...neuStatus],
  });

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
