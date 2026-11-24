#!/usr/bin/env node
// veroeffentlichen.mjs – bringt eine fertig abgemischte Folge auf die Boniblatt-Seite:
//  • MP3 nach docs/podcast/ im Repository
//  • Folge in docs/daten/podcast.json eintragen (gleiche id wird ersetzt)
//  • docs/daten/podcast.js neu schreiben: neueste Folge → 3 Tage Werbeflieger „Neue KI-Podcast-Folge ist raus!“
//    und glänzender Podcast-Knopf auf der Startseite
// Aufruf: node werkzeuge/veroeffentlichen.mjs folgen/01-strukturreform [--repo ..]   (Vorgabe: das Repository um podcast/)
// Wöchentlich erledigt das die Action „Podcast produzieren“ (produzieren.mjs) samt Commit und Seitenveröffentlichung.
// Von Hand danach im Repository: git add docs/podcast docs/daten/podcast.* && git commit && git push
import { readFile, writeFile, copyFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const FOLGE = resolve(args.find((a) => !a.startsWith('--')) || '.');
const REPO = resolve(args.includes('--repo') ? args[args.indexOf('--repo') + 1] : join(WERKSTATT, '..'));
const DOCS = join(REPO, 'docs');
const TAGE_NEU = 3;

const web = JSON.parse(await readFile(join(FOLGE, 'audio', 'web.json'), 'utf8'));
await mkdir(join(DOCS, 'podcast'), { recursive: true });
await copyFile(join(FOLGE, 'audio', web.datei), join(DOCS, 'podcast', web.datei));

const jsonPfad = join(DOCS, 'daten', 'podcast.json');
const bestand = await access(jsonPfad).then(() => readFile(jsonPfad, 'utf8').then(JSON.parse), () => ({ folgen: [] }));
// Fingerabdruck des Skripts: daran erkennt die Action „Podcast produzieren“ (offen.mjs), ob eine Folge schon fertig ist.
// Wird eine schon veröffentlichte Folge neu produziert, zählt die Fassung hoch – das ändert die Audio-Adresse (?v=…).
web.skriptHash = createHash('sha1').update(await readFile(join(FOLGE, 'skript.txt'))).digest('hex').slice(0, 12);
const alt = bestand.folgen.find((f) => f.id === web.id);
if (alt && alt.skriptHash && alt.skriptHash !== web.skriptHash) web.fassung = Math.max(web.fassung || 1, (alt.fassung || 1) + 1);
bestand.folgen = [web, ...bestand.folgen.filter((f) => f.id !== web.id)].sort((a, b) => b.datum.localeCompare(a.datum) || b.nummer - a.nummer);
await writeFile(jsonPfad, JSON.stringify(bestand));

const n = bestand.folgen[0];
const js = `/* Boniblatt-Podcast: neueste Folge – erzeugt von Podcast/werkzeuge/veroeffentlichen.mjs.
   ${TAGE_NEU} Tage nach dem Erscheinen fliegt der Werbeflieger mit „Neue KI-Podcast-Folge ist raus!“ und der Podcast-Knopf glänzt.
   Vorschau: ?podcast=neu */
window.BONIBLATT_PODCAST = ${JSON.stringify({ neueste: { id: n.id, nummer: n.nummer, titel: n.titel, datum: n.datum }, tageNeu: TAGE_NEU })};
(function () {
  var p = window.BONIBLATT_PODCAST, n = p && p.neueste;
  if (!n) return;
  var q = new URLSearchParams(location.search);
  var heute = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(q.get("tag") || "") ? q.get("tag") : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  var tage = (Date.parse(heute) - Date.parse(n.datum)) / 864e5;
  p.istNeu = q.get("podcast") === "neu" || (tage >= 0 && tage <= (p.tageNeu || 3));
  if (p.istNeu && !q.has("spruch")) (window.BONIBLATT_FLIEGER = window.BONIBLATT_FLIEGER || {})[heute] = "Neue KI-Podcast-Folge ist raus!";
})();
`;
await writeFile(join(DOCS, 'daten', 'podcast.js'), js);

// Öffentliche Besetzung (ohne Stimmen-IDs) für podcast.html und die Verwaltung (Gast je Thema)
const besetzung = await readFile(join(WERKSTATT, 'besetzung.json'), 'utf8').then(JSON.parse, () => null);
if (besetzung) {
  const oeffentlich = { gastgeber: besetzung.gastgeber, figuren: Object.fromEntries(Object.entries(besetzung.figuren || {})
    .map(([k, f]) => [k, { name: f.name, rolle: f.rolle, ort: f.ort, kurz: f.kurz, themen: f.themen || [] }])) };
  await writeFile(join(DOCS, 'daten', 'podcast-besetzung.json'), JSON.stringify(oeffentlich, null, 1));
}
console.log(`Veröffentlicht: Folge ${web.nummer} „${web.titel}“ → docs/podcast/${web.datei}`);
console.log(`podcast.json: ${bestand.folgen.length} Folge(n) · neu bis ${new Date(Date.parse(n.datum) + TAGE_NEU * 864e5).toISOString().slice(0, 10)}`);
