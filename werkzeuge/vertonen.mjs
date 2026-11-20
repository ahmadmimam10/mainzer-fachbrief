#!/usr/bin/env node
// Vertont die Hörfassungen je Ressort der neuesten Ausgaben mit Azure Speech (Gratis-Tarif F0) als MP3.
// Läuft beim Veröffentlichen der Seite (.github/workflows/seite.yml). Die MP3s kommen NICHT ins Repository:
//   .audio-cache/<hash>.mp3            bleibt zwischen den Läufen per actions/cache erhalten (keine doppelten Kosten)
//   docs/audio/<datum>-<ressort>-*.mp3  und  docs/daten/audio.json  nur im veröffentlichten Seitenpaket
// Ohne AZURE_SPEECH_KEY / AZURE_SPEECH_REGION passiert nichts – die Seite liest dann mit der Browser-Stimme vor.
//
//   node werkzeuge/vertonen.mjs                vertonen (braucht die beiden Umgebungsvariablen)
//   node werkzeuge/vertonen.mjs --trocken      nur anzeigen, was vertont würde (ohne Azure)
//   node werkzeuge/vertonen.mjs --stimmproben  kurze Hörprobe je deutscher Stimme nach stimmproben/ (Workflow „Stimmproben“)
//
// Einstellbar über Repository-Variablen (GitHub → Settings → Secrets and variables → Actions → Variables):
//   AZURE_SPEECH_STIMME  z. B. de-DE-KatjaNeural (mehrere mit Komma = Ersatzstimmen)
//   AZURE_SPEECH_STIL    z. B. cheerful (nur bei Stimmen, die diesen Sprechstil kennen)
//   AZURE_SPEECH_TEMPO   z. B. +6%     AZURE_SPEECH_HOEHE  z. B. +2%
//
// Das Skript bricht nie mit Fehler ab: Scheitert die Vertonung, wird die Seite trotzdem veröffentlicht.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TROCKEN = process.argv.includes("--trocken");
const PROBEN = process.argv.includes("--stimmproben");
const KEY = (process.env.AZURE_SPEECH_KEY || "").trim();
const REGION = (process.env.AZURE_SPEECH_REGION || "").trim().toLowerCase().replace(/\s+/g, "");
const sicher = (wert, muster, vorgabe) => (muster.test((wert || "").trim()) ? wert.trim() : vorgabe);
const STIMMEN = (process.env.AZURE_SPEECH_STIMME || "de-DE-SeraphinaMultilingualNeural,de-DE-KatjaNeural")
  .split(",").map(s => s.trim()).filter(s => /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/.test(s));
const STIL = sicher(process.env.AZURE_SPEECH_STIL, /^[a-z-]{3,30}$/, "");
const TEMPO = sicher(process.env.AZURE_SPEECH_TEMPO, /^[+-]\d{1,2}%$/, "+3%");
const HOEHE = sicher(process.env.AZURE_SPEECH_HOEHE, /^[+-]\d{1,2}%$/, "+0%");
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const BYTES_PRO_SEKUNDE = 6000;            // 48 kbit/s
const ANZAHL_AUSGABEN = 5;                 // so viele neueste Ausgaben bekommen Ton
const MIN_ZEICHEN = 200, MAX_ZEICHEN = 3200;
const CACHE = ".audio-cache";
const RESSORTS = ["jugendhilfeplanung", "fruehe-hilfen", "quartiersmanagement"];
const PROBETEXT = "Guten Morgen und willkommen beim Mainzer Fachbrief! Heute ist Freitag, der 20. November. "
  + "Kaffee bereit? Dann legen wir los.\n\nWir starten mit einer großen Zahl: 31,7 Millionen Euro fließen aus dem "
  + "Startchancen-Programm an Mainzer Schulen.";

const melden = (name, wert) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${wert}\n`); };
const warte = ms => new Promise(r => setTimeout(r, ms));
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function ssml(text, stimme, { stil = STIL, tempo = TEMPO, hoehe = HOEHE } = {}) {
  const absaetze = text.replace(/\r\n?/g, "\n").split(/\n{2,}/).map(a => a.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  let inhalt = `<prosody rate="${tempo}" pitch="${hoehe}">${absaetze.map(xml).join('<break time="700ms"/>')}</prosody>`;
  if (stil) inhalt = `<mstts:express-as style="${stil}">${inhalt}</mstts:express-as>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" `
    + `xml:lang="de-DE"><voice name="${stimme}">${inhalt}</voice></speak>`;
}

// Eine Anfrage an Azure; wirft bei Fehlern (mit .status), wiederholt bei Netz- und Lastfehlern.
async function anfrage(text, stimme, optionen) {
  let letzter = "", status = 0;
  for (let versuch = 1; versuch <= 3; versuch++) {
    let antwort;
    try {
      antwort = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": FORMAT, "User-Agent": "MainzerFachbrief" },
        body: ssml(text, stimme, optionen),
        signal: AbortSignal.timeout(90000),
      });
    } catch (fehler) { letzter = fehler.message; await warte(3000 * versuch); continue; }
    status = antwort.status;
    if (antwort.ok) {
      const daten = Buffer.from(await antwort.arrayBuffer());
      if (daten.length > 2000) return daten;
      letzter = "leere Antwort";
    } else letzter = `HTTP ${antwort.status}`;
    if ([400, 401, 403].includes(antwort.status)) break;
    await warte(antwort.status === 429 ? 20000 * versuch : 3000 * versuch);
  }
  const e = new Error(status === 401 || status === 403
    ? `Azure lehnt den Zugang ab (${letzter}) – Schlüssel, Region und Tarif prüfen.` : `Vertonung fehlgeschlagen (${letzter}).`);
  e.status = status; e.abbruch = status === 401 || status === 403;
  throw e;
}

// Stimmen im Wechsel, werktags reihum (Wunsch des Nutzers): Conrad (fröhlich), Seraphina, Florian.
// Ist AZURE_SPEECH_STIMME gesetzt, gilt stattdessen immer diese Stimme.
const WECHSEL = [
  { stimme: "de-DE-ConradNeural", stil: "cheerful", tempo: "+4%", hoehe: "+0%" },
  { stimme: "de-DE-SeraphinaMultilingualNeural", stil: "", tempo: "+3%", hoehe: "+0%" },
  { stimme: "de-DE-FlorianMultilingualNeural", stil: "", tempo: "+3%", hoehe: "+0%" },
];
function stimmeFuer(datum) {
  if ((process.env.AZURE_SPEECH_STIMME || "").trim() && STIMMEN.length) {
    return { stimme: STIMMEN[0], stil: STIL, tempo: TEMPO, hoehe: HOEHE, ersatz: STIMMEN.slice(1) };
  }
  const tage = Math.round((Date.UTC(+datum.slice(0, 4), +datum.slice(5, 7) - 1, +datum.slice(8, 10)) - Date.UTC(2026, 0, 5)) / 86400000);
  const werktage = Math.floor(tage / 7) * 5 + Math.min(((tage % 7) + 7) % 7, 4);          // Werktage seit Mo, 5.1.2026
  return { ...WECHSEL[(((werktage + 2) % 3) + 3) % 3], ersatz: ["de-DE-KatjaNeural"] };
}

async function synthese(text, wahl) {
  const versuche = [wahl, ...wahl.ersatz.map(stimme => ({ stimme, stil: "", tempo: wahl.tempo, hoehe: wahl.hoehe }))];
  let letzter;
  for (const v of versuche) {
    try { return { daten: await anfrage(text, v.stimme, v), stimme: v.stimme }; }
    catch (fehler) { if (fehler.abbruch) throw fehler; letzter = fehler; }   // 400 = Stimme/Stil nicht verfügbar → Ersatzstimme
  }
  throw letzter || new Error("Keine Stimme konfiguriert.");
}

async function stimmproben() {
  const antwort = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
    { headers: { "Ocp-Apim-Subscription-Key": KEY }, signal: AbortSignal.timeout(30000) });
  if (!antwort.ok) throw new Error(`Stimmenliste nicht abrufbar (HTTP ${antwort.status}).`);
  const stimmen = (await antwort.json()).filter(v => v.Locale === "de-DE" && !v.ShortName.includes(":"));
  await mkdir("stimmproben", { recursive: true });
  const zeilen = [];
  for (const v of stimmen) {
    const stile = v.StyleList || [];
    const froh = ["cheerful", "excited", "friendly"].filter(s => stile.includes(s));
    zeilen.push(`${v.ShortName} | ${v.Gender} | ${v.VoiceType || ""} | Stile: ${stile.join(", ") || "–"}`);
    for (const stil of ["", ...froh]) {
      const name = `${v.ShortName.replace(/^de-DE-|Neural$/g, "")}${stil ? "-" + stil : ""}.mp3`;
      try {
        await writeFile(join("stimmproben", name), await anfrage(PROBETEXT, v.ShortName, { stil, tempo: "+6%", hoehe: "+0%" }));
        console.log(`✓ ${name}`);
      } catch (fehler) {
        console.log(`✗ ${name}: ${fehler.message}`);
        if (fehler.abbruch) throw fehler;
      }
      await warte(3500);                                   // Gratis-Tarif: höchstens 20 Anfragen pro Minute
    }
  }
  await writeFile(join("stimmproben", "stimmen.txt"), zeilen.join("\n") + "\n");
  console.log(zeilen.join("\n"));
}

async function hauptteil() {
  if (!TROCKEN && (!KEY || !REGION)) { console.log("Vertonung übersprungen: AZURE_SPEECH_KEY / AZURE_SPEECH_REGION nicht gesetzt."); return 0; }
  if (!TROCKEN && !/^[a-z0-9]+$/.test(REGION)) { console.log("Vertonung übersprungen: AZURE_SPEECH_REGION hat kein gültiges Format (z. B. westeurope)."); return 0; }
  if (PROBEN) { await stimmproben(); return 0; }

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
    console.log(`${ausgaben.reduce((n, a) => n + a.texte.length, 0)} Hörfassungen gefunden; Stimme ${STIMMEN[0]}, Stil ${STIL || "–"}, Tempo ${TEMPO}, Höhe ${HOEHE}.`);
    return 0;
  }

  await mkdir(CACHE, { recursive: true });
  await mkdir("docs/audio", { recursive: true });
  const manifest = { stand: new Date().toISOString(), stimme: "wechselnd", ausgaben: {} };
  const behalten = new Set();
  let neu = 0, zeichen = 0, abbruch = false;

  for (const { datum, texte } of ausgaben) {
    const wahl = stimmeFuer(datum);
    for (const [ressort, text] of texte) {
      const hash = createHash("sha1").update(`${wahl.stimme}|${wahl.stil}|${wahl.tempo}|${wahl.hoehe}|${FORMAT}|${text}`).digest("hex").slice(0, 12);
      const cacheDatei = join(CACHE, `${hash}.mp3`);
      behalten.add(`${hash}.mp3`);
      if (!existsSync(cacheDatei)) {
        if (abbruch) continue;
        try {
          const { daten, stimme } = await synthese(text, wahl);
          await writeFile(cacheDatei, daten);
          neu++; zeichen += text.length;
          console.log(`✓ ${datum} ${ressort}: ca. ${Math.round(daten.length / BYTES_PRO_SEKUNDE)} s, ${text.length} Zeichen (${stimme})`);
          await warte(3500);                               // Gratis-Tarif: höchstens 20 Anfragen pro Minute
        } catch (fehler) {
          console.log(`✗ ${datum} ${ressort}: ${fehler.message}`);
          if (fehler.abbruch) abbruch = true;
          continue;
        }
      }
      const datei = `audio/${datum}-${ressort}-${hash.slice(0, 8)}.mp3`;
      await copyFile(cacheDatei, join("docs", datei));
      const { size } = await stat(cacheDatei);
      (manifest.ausgaben[datum] ||= {})[ressort] = { datei, sekunden: Math.round(size / BYTES_PRO_SEKUNDE),
        stimme: wahl.stimme.replace(/^de-DE-|MultilingualNeural$|Neural$/g, "") };
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
