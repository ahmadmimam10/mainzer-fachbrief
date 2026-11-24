#!/usr/bin/env node
// produzieren.mjs – eine Folge vom fertigen Skript bis auf die Seite, ohne dass jemand zuhören muss.
// Läuft wöchentlich in der Action „Podcast produzieren“ (.github/workflows/podcast.yml), geht aber genauso von Hand:
//  1. erzeugen.mjs      alle Teile aufnehmen (schon vorhandene mit gleicher Signatur werden übersprungen)
//  2. pruefen.mjs       Spracherkennung, Stimmen, Tempo → audio/pruefung.json
//  3. auffällige Teile (Fehlerrate über 6 %, vorgelesene Tags, Stimme weicht ab) einmal mit anderem Seed neu aufnehmen
//     und nachprüfen; bleibt etwas auffällig, wird trotzdem veröffentlicht und im Bericht gewarnt
//  4. abmischen.mjs     Tempo je Stimme, Musik, Einwürfe, Lautheit, Kapitel, Quellen-Zeitmarken
//  5. veroeffentlichen.mjs  MP3 nach docs/podcast, docs/daten/podcast.json und podcast.js
// Aufruf: node podcast/werkzeuge/produzieren.mjs podcast/folgen/02-thema [--ohne-pruefung]
// Braucht ELEVENLABS_API_KEY, ffmpeg und ffprobe. Commit, Push und Seitenveröffentlichung macht die Action.
import { spawnSync } from 'node:child_process';
import { readFile, appendFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FOLGE = resolve(args.find((a) => !a.startsWith('--')) || '.');
const KEY = process.env.ELEVENLABS_API_KEY;
const nr2 = (n) => String(n).padStart(2, '0');

function lauf(skript, ...weitere) {
  console.log(`\n▶ ${skript} ${weitere.join(' ')}`);
  const r = spawnSync(process.execPath, [join(W, skript), FOLGE, ...weitere], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${skript} ist fehlgeschlagen (Exit ${r.status}).`);
}
async function konto() {
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': KEY }, signal: AbortSignal.timeout(20000) });
    const j = await r.json(); return { verbraucht: j.character_count, grenze: j.character_limit };
  } catch { return null; }
}

if (!KEY) { console.error('Kein ELEVENLABS_API_KEY – ohne Schlüssel keine Aufnahme.'); process.exit(1); }
const meta = JSON.parse(await readFile(join(FOLGE, 'folge.json'), 'utf8'));
const vorher = await konto();
const bericht = [`## Podcast: Folge ${meta.nummer} – ${meta.titel}`, ''];

lauf('erzeugen.mjs');
let auffaellig = [];
if (!args.includes('--ohne-pruefung')) {
  lauf('pruefen.mjs');
  const p1 = JSON.parse(await readFile(join(FOLGE, 'audio', 'pruefung.json'), 'utf8'));
  auffaellig = p1.auffaellig || [];
  if (auffaellig.length) {
    bericht.push(`- Auffällig nach der ersten Aufnahme: Teil ${auffaellig.map(nr2).join(', ')} – einmal neu aufgenommen`);
    lauf('erzeugen.mjs', '--nur', auffaellig.join(','), '--seed', '5000');
    lauf('pruefen.mjs', '--nur', auffaellig.join(','));
    auffaellig = JSON.parse(await readFile(join(FOLGE, 'audio', 'pruefung.json'), 'utf8')).auffaellig || [];
  }
  const p = JSON.parse(await readFile(join(FOLGE, 'audio', 'pruefung.json'), 'utf8'));
  const raten = Object.values(p.teile || {}).map((t) => t.fehlerrate);
  bericht.push(`- Spracherkennung: Fehlerrate höchstens ${raten.length ? Math.max(...raten).toFixed(1) : '?'} % je Teil · Sprechtempo roh ${p.tempo} Wörter/min`);
  bericht.push(auffaellig.length ? `- ⚠ Weiter auffällig: Teil ${auffaellig.map(nr2).join(', ')} (veröffentlicht trotzdem – bitte reinhören)` : '- Alle Teile unauffällig');
}
lauf('abmischen.mjs');
lauf('veroeffentlichen.mjs');

const web = JSON.parse(await readFile(join(FOLGE, 'audio', 'web.json'), 'utf8'));
const nachher = await konto();
bericht.push(`- Länge ${Math.floor(web.dauer / 60)}:${String(web.dauer % 60).padStart(2, '0')} · ${web.kapitel.length} Kapitel · ${web.quellen.length} Quellen-Zeitmarken`);
if (vorher && nachher) bericht.push(`- ElevenLabs: ${(nachher.verbraucht - vorher.verbraucht).toLocaleString('de-DE')} Credits für diese Folge · im Abo verbraucht ${nachher.verbraucht.toLocaleString('de-DE')} von ${nachher.grenze.toLocaleString('de-DE')}`);
console.log('\n' + bericht.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, bericht.join('\n') + '\n');
