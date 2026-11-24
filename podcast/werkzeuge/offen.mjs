#!/usr/bin/env node
// offen.mjs – welche Folge muss die Action „Podcast produzieren“ bauen?
// Offen ist ein Ordner unter podcast/folgen mit skript.txt und folge.json, dessen Skript-Fingerabdruck noch nicht in
// docs/daten/podcast.json steht: eine neue Folge oder ein geändertes Skript. Ausgegeben wird die jüngste offene Folge.
//   node podcast/werkzeuge/offen.mjs              → ordner=<name>, anzahl=<n>   (Zeilen für $GITHUB_OUTPUT)
//   node podcast/werkzeuge/offen.mjs 02-thema     → genau diese Folge, auch wenn sie schon fertig ist (neu produzieren)
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(WERKSTATT, '..');
const NAME = /^[0-9]{2,3}-[a-z0-9-]+$/;
const gibt = (p) => access(p).then(() => true, () => false);
const wunsch = (process.argv[2] || '').trim().replace(/^podcast\/folgen\//, '').replace(/\/+$/, '');

const bestand = await readFile(join(REPO, 'docs', 'daten', 'podcast.json'), 'utf8').then(JSON.parse, () => ({ folgen: [] }));
const fertig = new Map((bestand.folgen || []).map((f) => [f.id, f.skriptHash]));
const offen = [];
for (const name of (await readdir(join(WERKSTATT, 'folgen')).catch(() => [])).sort()) {
  if (!NAME.test(name) || (wunsch && name !== wunsch)) continue;
  const ordner = join(WERKSTATT, 'folgen', name);
  if (!(await gibt(join(ordner, 'skript.txt'))) || !(await gibt(join(ordner, 'folge.json')))) continue;
  let meta;
  try { meta = JSON.parse(await readFile(join(ordner, 'folge.json'), 'utf8')); } catch { console.error(`${name}: folge.json nicht lesbar – übersprungen.`); continue; }
  const hash = createHash('sha1').update(await readFile(join(ordner, 'skript.txt'))).digest('hex').slice(0, 12);
  if (wunsch || fertig.get(meta.id) !== hash) offen.push({ name, datum: String(meta.datum || '') });
}
offen.sort((a, b) => b.datum.localeCompare(a.datum) || b.name.localeCompare(a.name));
console.log(`ordner=${offen[0] ? offen[0].name : ''}`);
console.log(`anzahl=${offen.length}`);
