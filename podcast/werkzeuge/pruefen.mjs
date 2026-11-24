#!/usr/bin/env node
// pruefen.mjs – prüft die erzeugten Teile einer Folge, ohne dass jemand zuhören muss:
//  1. Spracherkennung (ElevenLabs Scribe) je Teil → Wortfehlerrate gegen das Skript, vorgelesene Tags, Lacher als Geräusch
//  2. Stimmen-Gleichheit: Tonhöhe und Pegel je Sprecher über alle Teile (Ausreißer = andere „Person“)
//  3. Sprechtempo gesamt
// Aufruf: node werkzeuge/pruefen.mjs folgen/01-strukturreform [--ohne-stt] [--nur 3,5]
// Kosten: Scribe rechnet nach Audiodauer ab (eine 20-Minuten-Folge kostete ca. 300–1.000 Credits).
// Ergebnis zusätzlich in audio/pruefung.json: je Teil Fehlerrate und vorgelesene Tags, dazu „auffaellig“ = Teile, die
// produzieren.mjs einmal neu aufnehmen lässt (Fehlerrate über 6 %, vorgelesene Tags oder Stimme weicht ab).
import { readFile, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const FOLGE = resolve(args.find((a) => !a.startsWith('--') && !/^\d/.test(a)) || '.');
const AUDIO = join(FOLGE, 'audio');
const KEY = process.env.ELEVENLABS_API_KEY;
const nur = args.includes('--nur') ? args[args.indexOf('--nur') + 1].split(',').map(Number) : null;
const plan = JSON.parse(await readFile(join(AUDIO, 'plan.json'), 'utf8'));
const nr2 = (n) => String(n).padStart(2, '0');
const gibt = (p) => access(p).then(() => true, () => false);
const norm = (s) => s.toLowerCase().replace(/\[[^\]]*\]/g, ' ').replace(/[„“”"’'.,:;!?…()–—-]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
const TAGWORT = /^(laugh|laughs|laughing|chuckles?|amused|jumping|pause|skeptical|thoughtful|thoughtfully|dryly|warmly|teasing|deadpan|surprised|grinning|sighs?|curious|cautiously|serious|pleased|quietly|softly|mock|conceding|pushing|under|energetic|animated|annoyed|frustrated|excited|enthusiastic|incredulous|pragmatic|honest|happy|offended|interrupting|breath|whispers?|calm|engaged|concerned|matter|fact|lightly|slightly|measured|relaxed)$/;
const FEHLER_MAX = 6;   // Prozent Wortfehler je Teil, ab dem neu aufgenommen wird (übliche Werte: 0–2 %, meist nur Zahlenschreibweise)
const PRUEFUNG = join(AUDIO, 'pruefung.json');
const pruefung = (await gibt(PRUEFUNG)) ? JSON.parse(await readFile(PRUEFUNG, 'utf8')) : { teile: {} };

// ---------- 1. Spracherkennung ----------
if (!args.includes('--ohne-stt')) {
  if (!KEY) { console.error('Kein ELEVENLABS_API_KEY – mit --ohne-stt nur die Messungen.'); process.exit(1); }
  for (const t of plan.teile) {
    if (nur && !nur.includes(t.nr)) continue;
    const mp3 = await readFile(join(AUDIO, `teil-${nr2(t.nr)}.mp3`));
    const fd = new FormData();
    fd.append('file', new Blob([mp3], { type: 'audio/mpeg' }), `teil-${nr2(t.nr)}.mp3`);
    for (const [k, v] of Object.entries({ model_id: 'scribe_v2', language_code: 'de', tag_audio_events: 'true', diarize: 'true', num_speakers: '2', timestamps_granularity: 'word' })) fd.append(k, v);
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': KEY }, body: fd });
    if (!r.ok) { console.error(`Teil ${nr2(t.nr)}: Spracherkennung ${r.status} ${(await r.text()).slice(0, 200)}`); continue; }
    const j = await r.json();
    await writeFile(join(AUDIO, `teil-${nr2(t.nr)}.stt.json`), JSON.stringify(j));
    const soll = norm(t.zeilen.map((z) => z.text).join(' '));
    const ist = norm(j.words.filter((w) => w.type === 'word').map((w) => w.text).join(' '));
    const d = Array.from({ length: soll.length + 1 }, (_, i) => [i]);
    for (let k = 1; k <= ist.length; k++) d[0][k] = k;
    for (let i = 1; i <= soll.length; i++) for (let k = 1; k <= ist.length; k++) d[i][k] = Math.min(d[i - 1][k] + 1, d[i][k - 1] + 1, d[i - 1][k - 1] + (soll[i - 1] === ist[k - 1] ? 0 : 1));
    const diff = []; let i = soll.length, k = ist.length;
    while (i > 0 || k > 0) {
      if (i > 0 && k > 0 && d[i][k] === d[i - 1][k - 1] + (soll[i - 1] === ist[k - 1] ? 0 : 1)) { if (soll[i - 1] !== ist[k - 1]) diff.push(`${soll[i - 1]}→${ist[k - 1]}`); i--; k--; }
      else if (i > 0 && d[i][k] === d[i - 1][k] + 1) { diff.push(`−${soll[i - 1]}`); i--; }
      else { diff.push(`+${ist[k - 1]}`); k--; }
    }
    const ereignisse = j.words.filter((w) => w.type === 'audio_event').map((w) => w.text).join(' ');
    const tags = ist.filter((w) => TAGWORT.test(w));
    pruefung.teile[t.nr] = { fehlerrate: +(100 * d[soll.length][ist.length] / soll.length).toFixed(1), tags, geprueft: new Date().toISOString() };
    console.log(`Teil ${nr2(t.nr)}: Fehlerrate ${(100 * d[soll.length][ist.length] / soll.length).toFixed(1)} % · ${new Set(j.words.filter((w) => w.type === 'word').map((w) => w.speaker_id)).size} Sprecher · Geräusche: ${ereignisse || '–'}${tags.length ? ` · ⚠ vorgelesene Tags: ${tags.join(', ')}` : ''}`);
    console.log(`   Abweichungen: ${diff.reverse().join(' · ') || 'keine'}`);
  }
}

// ---------- 2. Stimmen-Gleichheit und Tempo ----------
const SR = 16000;
const pcm = (dat) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-i', dat, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 }); const b = r.stdout; const s = new Float32Array(b.length / 2); for (let i = 0; i < s.length; i++) s[i] = b.readInt16LE(i * 2) / 32768; return s; };
function f0(s, von, bis) {
  const F = 640, H = 320, minL = SR / 400 | 0, maxL = SR / 65 | 0, out = []; let eSum = 0, n = 0;
  for (let i = Math.floor(von * SR); i + F <= Math.min(s.length, bis * SR); i += H) {
    let e0 = 0; for (let j = 0; j < F; j++) e0 += s[i + j] ** 2;
    const rms = Math.sqrt(e0 / F); if (rms < 0.01) continue; eSum += 20 * Math.log10(rms); n++;
    let best = 0, bestL = 0;
    for (let L = minL; L <= maxL; L++) { let c = 0, e1 = 0; for (let j = 0; j < F - L; j++) { c += s[i + j] * s[i + j + L]; e1 += s[i + j + L] ** 2; } const v = c / Math.sqrt(e0 * e1 + 1e-12); if (v > best) { best = v; bestL = L; } }
    if (best > 0.65) out.push(SR / bestL);
  }
  return { f0: out, db: n ? eSum / n : null };
}
const median = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const werte = {};
let woerter = 0, dauer = 0;
for (const t of plan.teile) {
  const j = JSON.parse(await readFile(join(AUDIO, `teil-${nr2(t.nr)}.json`), 'utf8'));
  const s = pcm(join(AUDIO, `teil-${nr2(t.nr)}.mp3`));
  const proSprecher = {};
  for (const g of j.segmente) {
    const sp = t.zeilen[g.dialogue_input_index].sprecher;
    const r = f0(s, g.start_time_seconds, g.end_time_seconds);
    (proSprecher[sp] ||= { f0: [], db: [] }).f0.push(...r.f0); if (r.db !== null) proSprecher[sp].db.push(r.db);
  }
  for (const [sp, v] of Object.entries(proSprecher)) (werte[sp] ||= []).push({ teil: nr2(t.nr), f0: median(v.f0), db: v.db.reduce((a, b) => a + b, 0) / v.db.length });
  woerter += t.zeilen.reduce((a, z) => a + norm(z.text).length, 0);
  dauer += Math.max(...j.segmente.map((g) => g.end_time_seconds));
}
console.log(`\nSprechtempo: ${(woerter / dauer * 60).toFixed(0)} Wörter/min · ${(dauer / 60).toFixed(1)} min Sprache`);
const stimmeAuffaellig = new Set();
for (const [sp, liste] of Object.entries(werte)) {
  const m = median(liste.map((x) => x.f0)), mdb = liste.reduce((a, x) => a + x.db, 0) / liste.length;
  const auffaellig = liste.filter((x) => Math.abs(12 * Math.log2(x.f0 / m)) > 1.5 || Math.abs(x.db - mdb) > 3);
  auffaellig.forEach((x) => stimmeAuffaellig.add(Number(x.teil)));
  console.log(`${sp}: Tonhöhe ${m.toFixed(0)} Hz, Spannweite ${Math.min(...liste.map((x) => 12 * Math.log2(x.f0 / m))).toFixed(1)}…+${Math.max(...liste.map((x) => 12 * Math.log2(x.f0 / m))).toFixed(1)} Halbtöne${auffaellig.length ? ` · ⚠ auffällig: Teil ${auffaellig.map((x) => x.teil).join(', ')}` : ' · gleichmäßig'}`);
}
// Maschinenlesbares Ergebnis für produzieren.mjs (Teile ohne neue Prüfung behalten ihren letzten Stand)
pruefung.stimme = [...stimmeAuffaellig].sort((a, b) => a - b);
pruefung.tempo = Math.round(woerter / dauer * 60);
pruefung.auffaellig = plan.teile.map((t) => t.nr).filter((n) => {
  const p = pruefung.teile[n];
  return stimmeAuffaellig.has(n) || (p && (p.fehlerrate > FEHLER_MAX || p.tags.length > 0));
});
await writeFile(PRUEFUNG, JSON.stringify(pruefung, null, 1));
console.log(pruefung.auffaellig.length ? `\n⚠ Auffällig: Teil ${pruefung.auffaellig.map(nr2).join(', ')}` : '\nAlle Teile unauffällig.');
