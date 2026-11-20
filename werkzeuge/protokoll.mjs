#!/usr/bin/env node
// Hängt das Ergebnis eines Abruflaufs an daten/laufprotokoll.json an – für die Qualitätssicherung, ohne Mails.
//   node werkzeuge/protokoll.mjs <exitcode> <logdatei>
import { readFile } from "node:fs/promises";
import { readJson, writeJson } from "./lib.mjs";

const [code = "0", logDatei = ""] = process.argv.slice(2);
let log = "";
try { log = await readFile(logDatei, "utf8"); } catch { /* ohne Log weiter */ }
const protokoll = await readJson("daten/laufprotokoll.json", []).catch(() => []);
const liste = Array.isArray(protokoll) ? protokoll : [];
liste.push({
  zeit: new Date().toISOString(),
  ergebnis: code === "0" ? "ok" : "fehler",
  exitcode: Number(code) || 0,
  zusammenfassung: (log.match(/^\d+ neue Kandidaten.*$/m) || [""])[0],
  auffaellig: log.split("\n").filter(z => /✗|⚠|fehlgeschlagen|Error|gestoert|gestört|auffällig/i.test(z)).slice(0, 20),
});
await writeJson("daten/laufprotokoll.json", liste.slice(-150));
