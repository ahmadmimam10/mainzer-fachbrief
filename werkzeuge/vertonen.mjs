#!/usr/bin/env node
// Vertont die Hörfassungen je Ressort der neuesten Ausgaben mit Azure Speech (Gratis-Tarif F0) als MP3.
// Läuft beim Veröffentlichen der Seite (.github/workflows/seite.yml). Die MP3s kommen NICHT ins Repository:
//   .audio-cache/<hash>.mp3            bleibt zwischen den Läufen per actions/cache erhalten (keine doppelten Kosten)
//   docs/audio/<datum>-<ressort>-*.mp3  und  docs/daten/audio.json  nur im veröffentlichten Seitenpaket
// Ohne AZURE_SPEECH_KEY / AZURE_SPEECH_REGION passiert nichts – die Seite liest dann mit der Browser-Stimme vor.
//
//   node werkzeuge/vertonen.mjs            vertonen (braucht die beiden Umgebungsvariablen)
//   node werkzeuge/vertonen.mjs --trocken  nur anzeigen, was vertont würde (ohne Azure)
//
// Das Skript bricht nie mit Fehler ab: Scheitert die Vertonung, wird die Seite trotzdem veröffentlicht.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TROCKEN = process.argv.includes("--trocken");
const KEY = (process.env.AZURE_SPEECH_KEY || "").trim();
const REGION = (process.env.AZURE_SPEECH_REGION || "").trim().toLowerCase().replace(/\s+/g, "");
const STIMMEN = (process.env.AZURE_SPEECH_STIMME || "de-DE-SeraphinaMultilingualNeural,de-DE-KatjaNeural")
  .split(",").map(s => s.trim()).filter(Boolean);
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const BYTES_PRO_SEKUNDE = 6000;            // 48 kbit/s
const ANZAHL_AUSGABEN = 5;                 // so viele neueste Ausgaben bekommen Ton
const MIN_ZEICHEN = 200, MAX_ZEICHEN = 3200;
const CACHE = ".audio-cache";
const RESSORTS = ["jugendhilfeplanung", "fruehe-hilfen", "quartiersmanagement"];

const melden = (name, wert) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${wert}\n`); };
const warte = ms => new Promise(r => setTimeout(r, ms));
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function ssml(text, stimme) {
  const absaetze = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map(a => a.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE"><voice name="${stimme}">`
    + `<prosody rate="+3%">${absaetze.map(xml).join('<break time="700ms"/>')}</prosody></voice></speak>`;
}

async function synthese(text) {
  let letzter = "";
  for (const stimme of STIMMEN) {
    for (let versuch = 1; versuch <= 3; versuch++) {
      let antwort;
      try {
        antwort = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": FORMAT, "User-Agent": "MainzerFachbrief" },
          body: ssml(text, stimme),
          signal: AbortSignal.timeout(90000),
        });
      } catch (fehler) { letzter = fehler.message; await warte(3000 * versuch); continue; }
      if (antwort.ok) {
        const daten = Buffer.from(await antwort.arrayBuffer());
        if (daten.length > 2000) return { daten, stimme };
        letzter = "leere Antwort";
      } else letzter = `HTTP ${antwort.status}`;
      if (antwort.status === 401 || antwort.status === 403) {
        const e = new Error(`Azure lehnt den Zugang ab (${letzter}) – Schlüssel, Region und Tarif prüfen.`); e.abbruch = true; throw e;
      }
      if (antwort.status === 400) break;                 // Stimme nicht verfügbar → nächste Stimme
      await warte(antwort.status === 429 ? 20000 * versuch : 3000 * versuch);
    }
  }
  throw new Error(`Vertonung fehlgeschlagen (${letzter}).`);
}

async function hauptteil() {
  if (!TROCKEN && (!KEY || !REGION)) { console.log("Vertonung übersprungen: AZURE_SPEECH_KEY / AZURE_SPEECH_REGION nicht gesetzt."); return 0; }
  if (!TROCKEN && !/^[a-z0-9]+$/.test(REGION)) { console.log("Vertonung übersprungen: AZURE_SPEECH_REGION hat kein gültiges Format (z. B. westeurope)."); return 0; }

  const namen = (await readdir("daten/ausgaben")).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  const ausgaben = [];
  for (const name of namen) {
    const a = JSON.parse(await readFile(join("daten/ausgaben", name), "utf8"));
    const texte = RESSORTS.map(r => [r, (a.ressorts?.[r]?.hoerfassung || "").trim()])
      .filter(([, t]) => t.length >= MIN_ZEICHEN && t.length <= MAX_ZEICHEN && !/https?:\/\//i.test(t));
    if (texte.length) ausgaben.push({ datum: a.datum || name.slice(0, 10), texte });
    if (ausgaben.length >= ANZAHL_AUSGABEN) break;
  }
  if (TROCKEN) {
    for (const { datum, texte } of ausgaben) for (const [r, t] of texte) console.log(`${datum} ${r}: ${t.length} Zeichen, ca. ${Math.round(t.length / 15)} s`);
    console.log(`${ausgaben.reduce((n, a) => n + a.texte.length, 0)} Hörfassungen gefunden.`);
    return 0;
  }

  await mkdir(CACHE, { recursive: true });
  await mkdir("docs/audio", { recursive: true });
  const manifest = { stand: new Date().toISOString(), stimme: STIMMEN[0], ausgaben: {} };
  const behalten = new Set();
  let neu = 0, zeichen = 0, abbruch = false;

  for (const { datum, texte } of ausgaben) {
    for (const [ressort, text] of texte) {
      const hash = createHash("sha1").update(`${STIMMEN[0]}|${FORMAT}|${text}`).digest("hex").slice(0, 12);
      const cacheDatei = join(CACHE, `${hash}.mp3`);
      behalten.add(`${hash}.mp3`);
      if (!existsSync(cacheDatei)) {
        if (abbruch) continue;
        try {
          const { daten, stimme } = await synthese(text);
          await writeFile(cacheDatei, daten);
          neu++; zeichen += text.length;
          console.log(`✓ ${datum} ${ressort}: ca. ${Math.round(daten.length / BYTES_PRO_SEKUNDE)} s, ${text.length} Zeichen (${stimme})`);
          await warte(1500);                               // Gratis-Tarif: höchstens 20 Anfragen pro Minute
        } catch (fehler) {
          console.log(`✗ ${datum} ${ressort}: ${fehler.message}`);
          if (fehler.abbruch) abbruch = true;
          continue;
        }
      }
      const datei = `audio/${datum}-${ressort}-${hash.slice(0, 8)}.mp3`;
      await copyFile(cacheDatei, join("docs", datei));
      const { size } = await stat(cacheDatei);
      (manifest.ausgaben[datum] ||= {})[ressort] = { datei, sekunden: Math.round(size / BYTES_PRO_SEKUNDE) };
    }
  }

  for (const f of await readdir(CACHE)) if (!behalten.has(f)) await unlink(join(CACHE, f));   // Alte Vertonungen aufräumen
  const anzahl = Object.values(manifest.ausgaben).reduce((n, o) => n + Object.keys(o).length, 0);
  if (anzahl) await writeFile("docs/daten/audio.json", JSON.stringify(manifest));
  console.log(`Vertonung: ${neu} neu (${zeichen} Zeichen an Azure), ${anzahl} MP3 auf der Seite.`);
  return neu;
}

try {
  const neu = await hauptteil();
  melden("neu", neu ? "ja" : "nein");
} catch (fehler) {
  console.log(`Vertonung übersprungen: ${fehler.message}`);
  melden("neu", "nein");
}
