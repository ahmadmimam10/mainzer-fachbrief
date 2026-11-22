#!/usr/bin/env node
/**
 * Schnappschüsse auf Bestellung: Der Qualitätsmanager kommt aus seiner Cloud-Umgebung nicht an fremde Webseiten. Braucht er
 * das HTML einer Seite (um ein Link-Muster zu bauen oder einen Feed zu prüfen), trägt er die Adresse in
 * daten/diagnose/anfragen.json ein. GitHub holt sie beim nächsten Abruf (sammeln.yml) und legt sie in daten/diagnose/ ab.
 *
 *   node werkzeuge/schnappschuss.mjs           holt offene Anfragen (höchstens 6 je Lauf)
 *   node werkzeuge/schnappschuss.mjs --liste   zeigt Anfragen und Ergebnisse, holt nichts
 *
 * Geholt werden nur öffentliche https-Adressen mit normalem Rechnernamen (keine IP-Adressen, keine Ports, keine Zugangsdaten),
 * höchstens 400 KB Text. Scheitert nie.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { ROOT, UA, readJson, writeJson, cut } from "./lib.mjs";

const DATEI = "daten/diagnose/anfragen.json", MAX = 6, GROESSE = 400_000;
const d = await readJson(DATEI, { anfragen: [] });
const liste = Array.isArray(d.anfragen) ? d.anfragen : [];
const erlaubt = u => { try { const x = new URL(u); return x.protocol === "https:" && !x.username && !x.password && !x.port && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(x.hostname) && !/^\d+(\.\d+){3}$/.test(x.hostname) && u.length < 600; } catch { return false; } };

if (process.argv.includes("--liste")) {
  if (!liste.length) console.log("Keine Schnappschuss-Anfragen.");
  for (const a of liste) console.log(`${a.ergebnis ? (a.ergebnis.datei ? "✓" : "✗") : "…"} ${String(a.quelle).padEnd(18)} ${a.url}\n    ${a.ergebnis ? (a.ergebnis.datei ? `liegt in ${a.ergebnis.datei} (${a.ergebnis.bytes} Bytes, ${a.ergebnis.typ}, geholt ${a.ergebnis.am})` : `nicht geholt: ${a.ergebnis.fehler} (${a.ergebnis.am})`) : "wartet auf den nächsten Abruf"}`);
  process.exit(0);
}

let geholt = 0;
for (const a of liste) {
  if (a.ergebnis || geholt >= MAX) continue;
  geholt++;
  const am = new Date().toISOString().slice(0, 16), id = String(a.quelle || "x").replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "x";
  if (!erlaubt(a.url)) { a.ergebnis = { am, fehler: "Adresse nicht zulässig (nur öffentliche https-Adressen)" }; continue; }
  try {
    const r = await fetch(a.url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml,application/rss+xml,application/json;q=0.9,*/*;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const typ = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok) { a.ergebnis = { am, fehler: `HTTP ${r.status}`, endadresse: r.url }; continue; }
    if (!/text|xml|json|html/.test(typ)) { a.ergebnis = { am, fehler: `kein Text (${typ || "unbekannt"})` }; continue; }
    const text = (await r.text()).slice(0, GROESSE);
    const datei = `daten/diagnose/anfrage-${id}-${createHash("sha1").update(a.url).digest("hex").slice(0, 8)}.${/xml|rss/.test(typ) ? "xml" : /json/.test(typ) ? "json" : "html"}`;
    await mkdir(path.join(ROOT, "daten/diagnose"), { recursive: true });
    await writeFile(path.join(ROOT, datei), text, "utf8");
    a.ergebnis = { am, datei, bytes: text.length, typ, endadresse: r.url };
  } catch (e) { a.ergebnis = { am, fehler: cut(String(e.cause?.code || e.message || e), 120) }; }
}
if (geholt) { d.anfragen = liste; d.info = "Schnappschuss-Anfragen des Qualitätsmanagers (QUALITAET.md, „Quellen reparieren“). GitHub holt sie beim nächsten Abruf; Erledigtes löscht der Qualitätsmanager."; await writeJson(DATEI, d).catch(() => {}); }
console.log(geholt ? `Schnappschüsse: ${geholt} Anfrage${geholt === 1 ? "" : "n"} bearbeitet.` : "Schnappschüsse: nichts angefordert.");
