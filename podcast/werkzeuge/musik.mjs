#!/usr/bin/env node
// musik.mjs – erzeugt die Erkennungsmusik (musik/*.mp3) mit Eleven Music nach musik/musik.json.
// Fehlende Stücke werden erzeugt, vorhandene bleiben. Einzelnes Stück neu: --neu uebergang
// Braucht ELEVENLABS_API_KEY.
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = join(WERKSTATT, 'musik');
const args = process.argv.slice(2);
const neu = args.includes('--neu') ? args[args.indexOf('--neu') + 1] : null;
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Kein ELEVENLABS_API_KEY.'); process.exit(1); }
const gibt = (p) => access(p).then(() => true, () => false);

const def = JSON.parse(await readFile(join(ORDNER, 'musik.json'), 'utf8'));
for (const s of def.stuecke) {
  const ziel = join(ORDNER, `${s.name}.mp3`);
  if ((await gibt(ziel)) && neu !== s.name) { console.log(`${s.name}: liegt vor`); continue; }
  process.stdout.write(`${s.name} (${s.laenge_ms / 1000} s) … `);
  const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    // seed ist zusammen mit prompt nicht erlaubt – der gemeinsame Stil-Text sorgt für den einheitlichen Klang
    body: JSON.stringify({ prompt: `${s.prompt} Style: ${def.stil}.`, music_length_ms: s.laenge_ms, model_id: def.modell, force_instrumental: true }),
  });
  if (!r.ok) { console.error(`Fehler ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  await writeFile(ziel, Buffer.from(await r.arrayBuffer()));
  console.log('fertig');
}
