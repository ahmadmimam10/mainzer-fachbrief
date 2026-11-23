#!/usr/bin/env node
/**
 * Stimmen des Boniblatts – holen und auswerten.
 *
 * Zwei Arten von Stimmen liegen beim Dienst (cloudflare/bestenliste/worker.js):
 *   - die Häkchen aus dem Vergleich Claude ↔ DeepSeek (Verwaltung, „Was gehört in die Zeitung?“) – je Ausgabe,
 *   - die Leserstimmen „relevant ja/nein“ von der Startseite – je Monat und Meldung zwei Zahlen.
 *
 *   node werkzeuge/stimmen.mjs holen                 holt beides ins Repository: daten/abgleich-stimmen.json, daten/leser-daumen.json
 *   node werkzeuge/stimmen.mjs abgleich [--runde=N]  wertet den Abgleich aus (je Runde, siehe ABGLEICH.md); mit --json maschinenlesbar
 *   node werkzeuge/stimmen.mjs leser [--monat=JJJJ-MM]  Leserstimmen eines Monats mit Titeln (für die Monatsauswertung, QUALITAET.md)
 *
 * Scheitert nie (Exit 0): Ist der Dienst nicht erreichbar, bleibt der letzte Stand liegen.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { ROOT, readJson, writeJson } from "./lib.mjs";

const DIENST = "https://boniblatt-bestenliste.ahmadmimam10.workers.dev";
const argv = process.argv.slice(2), befehl = argv.find(a => !a.startsWith("--")) || "abgleich";
const wert = n => (argv.find(a => a.startsWith(`--${n}=`)) || "").split("=")[1] || "";
const ALS_JSON = argv.includes("--json");
const RESSORT = { jugendhilfeplanung: "Jugendhilfeplanung", "fruehe-hilfen": "Frühe Hilfen", quartiersmanagement: "Quartiersmanagement" };
const prozent = (a, b) => b ? Math.round(a / b * 100) + " %" : "–";

// Alle Meldungen der Ausgaben (für Titel zu Kennungen)
async function meldungen() {
  const dir = path.join(ROOT, "daten/ausgaben"), map = new Map();
  for (const d of (await readdir(dir).catch(() => [])).filter(d => /^\d{4}-\d{2}-\d{2}\.json$/.test(d)).sort()) {
    const a = await readJson("daten/ausgaben/" + d, {});
    for (const [r, v] of Object.entries(a.ressorts || {})) for (const m of (Array.isArray(v) ? v : v && v.meldungen) || []) if (m && m.id) map.set(m.id, { titel: m.titel, ressort: r, ausgabe: a.datum, stufe: m.stufe, quelle: m.quelle });
  }
  return map;
}

/* ---------- holen ---------- */
async function holen() {
  let d;
  try {
    const r = await fetch(`${DIENST}/ausfuhr`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    d = await r.json();
  } catch (e) { console.log(`Dienst nicht erreichbar (${e.message}) – der letzte Stand bleibt.`); return; }
  const tage = Object.fromEntries(Object.entries(d.wahl || {}).sort(([a], [b]) => a.localeCompare(b)));
  const alt1 = await readJson("daten/abgleich-stimmen.json", {});
  if (JSON.stringify(alt1.tage || {}) !== JSON.stringify(tage)) {
    await writeJson("daten/abgleich-stimmen.json", { info: "Häkchen aus der Verwaltung (Vergleich Claude ↔ DeepSeek): je Ausgabe die Meldungen und Gremien-Notizen, die nur eine Seite hatte, und ob sie in die Zeitung gehören (rein). Geholt von werkzeuge/stimmen.mjs; Auswertung: node werkzeuge/stimmen.mjs abgleich", stand: d.stand, tage });
    console.log(`daten/abgleich-stimmen.json: ${Object.keys(tage).length} Ausgaben mit Häkchen.`);
  } else console.log("Häkchen unverändert.");
  const titel = await meldungen(), monate = {};
  for (const z of d.daumen || []) (monate[z.monat] ||= []).push({ id: z.id, hoch: z.hoch, runter: z.runter, ...(titel.get(z.id) || {}) });
  const alt2 = await readJson("daten/leser-daumen.json", {});
  if (JSON.stringify(alt2.monate || {}) !== JSON.stringify(monate)) {
    await writeJson("daten/leser-daumen.json", { info: "Leserstimmen „relevant ja/nein“ von der Startseite: je Monat und Meldung die Zahl der Daumen hoch und runter (anonym). Geholt von werkzeuge/stimmen.mjs; Auswertung: node werkzeuge/stimmen.mjs leser", stand: d.stand, monate });
    console.log(`daten/leser-daumen.json: ${Object.values(monate).reduce((n, l) => n + l.length, 0)} Meldungen mit Stimmen.`);
  } else console.log("Leserstimmen unverändert.");
}

/* ---------- abgleich ---------- */
async function abgleich() {
  const runden = (await readJson("daten/abgleich-runden.json", {})).runden || [];
  const schatten = (await readJson("daten/schatten.json", {})).laeufe || [];
  const tage = (await readJson("daten/abgleich-stimmen.json", {})).tage || {};
  const nurRunde = Number(wert("runde")) || 0, ergebnis = [];
  for (const rd of runden) {
    if (nurRunde && rd.nr !== nurRunde) continue;
    const z = { nr: rd.nr, ausgaben: [], gewaehlt: 0, gemeinsam: 0, claude: 0, deepseek: 0, nurClaude: { rein: [], raus: [], offen: [] }, nurDeepseek: { rein: [], raus: [], offen: [] },
      gremien: { claude: { rein: 0, raus: 0 }, deepseek: { rein: 0, raus: 0 }, beispiele: [] } };
    for (const datum of rd.ausgaben) {
      const lauf = schatten.find(l => l.datum === datum), m = lauf && Object.values(lauf.modelle || {})[0];
      if (!lauf || !m || m.fehler) { z.ausgaben.push({ datum, fehlt: true }); continue; }
      const w = tage[datum], rein = new Map((w ? w.stimmen : []).filter(s => s.art === "artikel").map(s => [`${s.ressort}|${s.id}`, s.rein]));
      if (w) z.gewaehlt++;
      let gem = 0, c = 0, d = 0;
      for (const [r, cl] of Object.entries(lauf.claude || {})) {
        const ds = (m.ressorts || {})[r] || [], cId = new Set(cl.map(x => x.id)), dId = new Set(ds.map(x => x.id));
        gem += cl.filter(x => dId.has(x.id)).length; c += cl.length; d += ds.length;
        for (const [liste, von] of [[cl.filter(x => !dId.has(x.id)), z.nurClaude], [ds.filter(x => !cId.has(x.id)), z.nurDeepseek]])
          for (const x of liste) { const e = { datum, ressort: r, id: x.id, titel: x.titel, stufe: x.stufe }, k = rein.get(`${r}|${x.id}`); (!w ? von.offen : k ? von.rein : von.raus).push(e); }
      }
      for (const s of (w ? w.stimmen : []).filter(s => s.art === "gremien")) {
        z.gremien[s.von][s.rein ? "rein" : "raus"]++;
        if (z.gremien.beispiele.length < 12) z.gremien.beispiele.push({ datum, gremium: s.gremium, ressort: s.ressort, von: s.von, rein: s.rein, text: s.text });
      }
      z.gemeinsam += gem; z.claude += c; z.deepseek += d; z.ausgaben.push({ datum, gewaehlt: Boolean(w), gemeinsam: gem, claude: c, deepseek: d });
    }
    // Wunschliste = gemeinsame Meldungen + angekreuzte Einzelgänger (nur Ausgaben mit Häkchen)
    const gw = z.ausgaben.filter(a => a.gewaehlt), gemW = gw.reduce((n, a) => n + a.gemeinsam, 0), cW = gw.reduce((n, a) => n + a.claude, 0), dW = gw.reduce((n, a) => n + a.deepseek, 0);
    const wunsch = gemW + z.nurClaude.rein.length + z.nurDeepseek.rein.length;
    z.kennzahlen = {
      uebereinstimmung: prozent(z.gemeinsam, z.claude),
      claudeTreffer: prozent(gemW + z.nurClaude.rein.length, cW), deepseekTreffer: prozent(gemW + z.nurDeepseek.rein.length, dW),
      claudeVollstaendig: prozent(gemW + z.nurClaude.rein.length, wunsch), deepseekVollstaendig: prozent(gemW + z.nurDeepseek.rein.length, wunsch),
      einzelgaengerClaudeGewollt: prozent(z.nurClaude.rein.length, z.nurClaude.rein.length + z.nurClaude.raus.length),
      einzelgaengerDeepseekGewollt: prozent(z.nurDeepseek.rein.length, z.nurDeepseek.rein.length + z.nurDeepseek.raus.length),
    };
    ergebnis.push(z);
  }
  if (ALS_JSON) return console.log(JSON.stringify(ergebnis, null, 1));
  if (!ergebnis.length) return console.log("Keine Runden in daten/abgleich-runden.json.");
  for (const z of ergebnis) {
    const k = z.kennzahlen, zeile = (e) => `      ${e.datum} · ${RESSORT[e.ressort] || e.ressort}${e.stufe ? " · " + e.stufe : ""}: ${e.titel}`;
    console.log(`\nRunde ${z.nr}: ${z.ausgaben.filter(a => !a.fehlt).length} Ausgaben verglichen, ${z.gewaehlt} davon mit Häkchen.`);
    console.log(`  Übereinstimmung (DeepSeek wählt, was Claude wählt): ${k.uebereinstimmung}`);
    console.log(`  Treffer (gewählte Meldungen, die du willst):  Claude ${k.claudeTreffer} · DeepSeek ${k.deepseekTreffer}`);
    console.log(`  Vollständigkeit (von allem, was du willst):   Claude ${k.claudeVollstaendig} · DeepSeek ${k.deepseekVollstaendig}`);
    console.log(`  Einzelgänger, die rein sollen: nur Claude ${k.einzelgaengerClaudeGewollt} · nur DeepSeek ${k.einzelgaengerDeepseekGewollt}`);
    console.log(`  Gremien-Notizen angekreuzt: Claude ${z.gremien.claude.rein} von ${z.gremien.claude.rein + z.gremien.claude.raus} · DeepSeek ${z.gremien.deepseek.rein} von ${z.gremien.deepseek.rein + z.gremien.deepseek.raus}`);
    for (const [name, l] of [["Nur Claude – soll rein (Claude lag richtig, DeepSeek hat es verpasst)", z.nurClaude.rein], ["Nur Claude – soll nicht rein", z.nurClaude.raus],
      ["Nur DeepSeek – soll rein (DeepSeek lag richtig, Claude hat es verpasst)", z.nurDeepseek.rein], ["Nur DeepSeek – soll nicht rein", z.nurDeepseek.raus]])
      if (l.length) console.log(`    ${name}: ${l.length}\n${l.map(zeile).join("\n")}`);
    const offen = z.nurClaude.offen.length + z.nurDeepseek.offen.length; if (offen) console.log(`    Ohne Häkchen (Ausgabe nicht angekreuzt): ${offen} Meldungen`);
    if (z.gremien.beispiele.length) console.log(`    Gremien (Auswahl):\n${z.gremien.beispiele.map(b => `      ${b.datum} · ${b.gremium} · ${RESSORT[b.ressort] || b.ressort} · ${b.von === "claude" ? "Claude" : "DeepSeek"} ${b.rein ? "✓" : "✗"}: ${b.text}`).join("\n")}`);
  }
}

/* ---------- leser ---------- */
async function leser() {
  const d = await readJson("daten/leser-daumen.json", {}), monate = d.monate || {};
  const monat = wert("monat") || Object.keys(monate).sort().pop();
  const l = (monate[monat] || []).slice();
  if (ALS_JSON) return console.log(JSON.stringify({ monat, meldungen: l }, null, 1));
  if (!l.length) return console.log(`Keine Leserstimmen für ${monat || "diesen Monat"}.`);
  const hoch = l.reduce((n, x) => n + x.hoch, 0), runter = l.reduce((n, x) => n + x.runter, 0);
  console.log(`Leserstimmen ${monat}: ${l.length} Meldungen, ${hoch}× relevant, ${runter}× nicht relevant.`);
  const zeile = x => `  ${String(x.hoch).padStart(3)}↑ ${String(x.runter).padStart(3)}↓  ${x.ausgabe || "?"} · ${RESSORT[x.ressort] || x.ressort || "?"} · ${x.stufe || "?"}: ${x.titel || x.id}`;
  console.log("\nEher nicht relevant (mehr runter als hoch):\n" + (l.filter(x => x.runter > x.hoch).sort((a, b) => (b.runter - b.hoch) - (a.runter - a.hoch)).slice(0, 25).map(zeile).join("\n") || "  –"));
  console.log("\nBesonders relevant:\n" + (l.filter(x => x.hoch > x.runter).sort((a, b) => (b.hoch - b.runter) - (a.hoch - a.runter)).slice(0, 15).map(zeile).join("\n") || "  –"));
}

try {
  if (befehl === "holen") await holen();
  else if (befehl === "leser") await leser();
  else await abgleich();
} catch (e) { console.log("Fehler: " + e.message); }
