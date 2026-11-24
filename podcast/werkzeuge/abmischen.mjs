#!/usr/bin/env node
// abmischen.mjs – macht aus den erzeugten Teilen die fertige Folge:
//  • Tempo je Stimme (folge.json "tempo": { "MIRA": 1.05, "JONAS": 1.03 }): jeder Teil wird an den
//    Sprecherwechseln geschnitten (Mitte der Pause) und jedes Stück tonhöhengetreu beschleunigt (atempo)
//  • Teile mit natürlichen Pausen aneinandersetzen (≈ 0,5 s im Gespräch, ≈ 1 s bei neuem Abschnitt)
//  • Musik an den Markierungen (#> musik …): Titelmelodie, Abspann – leicht überblendet, ohne Tempoänderung
//  • Einwürfe („Mhm“) leise unter die richtige Zeile, möglichst direkt nach einem Satzende
//  • zu lange Stille kürzen, sanft verdichten, Lautheit −16 LUFS, Kapitelmarken, Metadaten
//  • Daten für die Webseite: Kapitel, Quellen mit Zeitmarken, Wellenform (audio/web.json) + Shownotes
// Aufruf: node werkzeuge/abmischen.mjs folgen/01-strukturreform     (braucht ffmpeg/ffprobe)

import { readFile, writeFile, access, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FOLGE = resolve(process.argv[2] || '.');
const AUDIO = join(FOLGE, 'audio');
const MUSIK = join(WERKSTATT, 'musik');

const LUECKE = 0.2;             // Luft zwischen zwei Teilen mitten im Gespräch (mit VOR/NACH ≈ 0,5 s)
const LUECKE_ABSCHNITT = 0.75;  // Luft, wenn ein neuer Abschnitt ohne Musik beginnt (≈ 1 s)
const VOR = 0.06, NACH = 0.25;  // Luft vor dem ersten / nach dem letzten Wort eines Teils
const PAUSE_MAX = 1.4;          // längere Stille mitten im Gespräch …
const PAUSE_BLEIBT = 1.0;       // … wird auf diese Länge gekürzt (Fassung 2: 1,8 → 1,2 war zu träge)
const EINWURF_DB = -7;          // Einwürfe leiser als die Hauptspur
// Musik: Abstand davor, Überlappung mit der folgenden Sprache, Pegel relativ zur Sprache, Ein-/Ausblenden
const MUSIK_REGEL = {
  intro: { vor: 0, ueber: 0.25, rel: 1, ein: 0, aus: 0.5 },
  thema: { vor: 0.4, ueber: 0.6, rel: 0, ein: 0.03, aus: 0.9 },
  uebergang: { vor: 0.5, ueber: 0.2, rel: -1, ein: 0.12, aus: 0.5 },
  outro: { vor: 0.7, ueber: 0, rel: 0, ein: 0.2, aus: 1.6 },
};

const nr2 = (n) => String(n).padStart(2, '0');
const gesprochen = (t) => t.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
const gibt = async (p) => access(p).then(() => true, () => false);
const zeit = (s) => { const m = Math.floor(s / 60), x = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
function ff(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 27 });
  if (r.status !== 0) throw new Error(`ffmpeg: ${(r.stderr || r.error?.message || '').slice(-1500)}`);
  return r.stderr;
}
function laenge(datei) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', datei], { encoding: 'utf8' });
  const d = parseFloat(r.stdout);
  if (!Number.isFinite(d)) throw new Error(`ffprobe kann ${datei} nicht lesen`);
  return d;
}
const lufs = (datei) => { const s = ff(['-i', datei, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']); return +JSON.parse(s.slice(s.lastIndexOf('{'), s.lastIndexOf('}') + 1)).input_i; };
const spanne = (segmente, i) => {
  const s = (segmente || []).filter((g) => i === undefined || g.dialogue_input_index === i);
  if (!s.length) return null;
  return { start: Math.min(...s.map((g) => g.start_time_seconds)), ende: Math.max(...s.map((g) => g.end_time_seconds)), cs: Math.min(...s.map((g) => g.character_start_index)), ce: Math.max(...s.map((g) => g.character_end_index)) };
};

// Tempo je Stimme: "tempo": 1.04 (alle gleich) oder { "MIRA": 1.05, "JONAS": 1.03 } in folge.json
const tempoRegel = (t) => (sprecher) => {
  if (typeof t === 'number') return t;
  if (t && typeof t === 'object') return Number(t[sprecher]) || Number(t.alle) || 1;
  return 1;
};

// Sprechzeit jeder Zeile eines Teils: erstes bis letztes gesprochenes Zeichen (Regieanweisungen in [ ] zählen nicht)
function sprechzeiten(info) {
  const al = info.alignment || {};
  const C = al.characters || [];
  const inTag = []; let tiefe = 0;
  for (let c = 0; c < C.length; c++) { if (C[c] === '[') tiefe++; inTag[c] = tiefe > 0; if (C[c] === ']') tiefe = Math.max(0, tiefe - 1); }
  const by = {};
  for (const g of info.segmente || []) {
    const b = (by[g.dialogue_input_index] ||= { cs: Infinity, ce: -Infinity, start: Infinity, ende: -Infinity });
    b.cs = Math.min(b.cs, g.character_start_index); b.ce = Math.max(b.ce, g.character_end_index);
    b.start = Math.min(b.start, g.start_time_seconds); b.ende = Math.max(b.ende, g.end_time_seconds);
  }
  return Object.keys(by).map(Number).sort((x, y) => x - y).map((i) => {
    const b = by[i]; let a = null, e = null;
    for (let c = b.cs; c < Math.min(b.ce, C.length); c++) {
      if (inTag[c] || !/\S/.test(C[c])) continue;
      if (a === null) a = al.character_start_times_seconds[c];
      e = al.character_end_times_seconds[c];
    }
    return { i, a: a ?? b.start, e: e ?? b.ende };
  });
}

// Teil im Tempo der jeweiligen Stimme: Schnitt an jedem Sprecherwechsel (Mitte der Pause), jedes Stück mit atempo
// (Tonhöhe bleibt), winzige Blenden gegen Knackser. Liefert die neue Datei und zt(): alte → neue Zeit im Teil.
function tempoTeil(t, info, mp3, tempo, d) {
  const z = sprechzeiten(info);
  const stuecke = [];
  let start = 0, sprecher = z.length ? t.zeilen[z[0].i]?.sprecher : null;
  for (let k = 1; k < z.length; k++) {
    const s = t.zeilen[z[k].i]?.sprecher;
    if (s === sprecher) continue;
    const vor = z[k - 1], nach = z[k];
    const schnitt = nach.a > vor.e ? (vor.e + nach.a) / 2 : nach.a;
    if (schnitt > start + 0.05 && schnitt < d - 0.05) { stuecke.push({ von: start, bis: schnitt, tempo: tempo(sprecher), sprecher }); start = schnitt; }
    sprecher = s;
  }
  stuecke.push({ von: start, bis: d, tempo: tempo(sprecher), sprecher });
  let pos = 0;
  for (const s of stuecke) { s.neu = pos; pos += (s.bis - s.von) / s.tempo; }
  const zeilenTempo = z.map((x) => ({ ...x, sprecher: t.zeilen[x.i]?.sprecher, tempo: tempo(t.zeilen[x.i]?.sprecher) }));
  if (stuecke.every((s) => s.tempo === 1)) return { datei: mp3, zt: (sek) => sek, zeilen: zeilenTempo, temp: false };
  const ziel = join(AUDIO, `_teil-${nr2(t.nr)}-tempo.wav`);
  const f = [`[0:a]asplit=${stuecke.length}${stuecke.map((_, j) => `[s${j}]`).join('')}`];
  stuecke.forEach((s, j) => {
    const neu = (s.bis - s.von) / s.tempo;
    f.push(`[s${j}]atrim=start=${s.von.toFixed(4)}:end=${s.bis.toFixed(4)},asetpts=PTS-STARTPTS${s.tempo !== 1 ? `,atempo=${s.tempo}` : ''},afade=t=in:d=0.004,afade=t=out:st=${Math.max(0, neu - 0.004).toFixed(4)}:d=0.004[o${j}]`);
  });
  f.push(`${stuecke.map((_, j) => `[o${j}]`).join('')}concat=n=${stuecke.length}:v=0:a=1[aus]`);
  ff(['-i', mp3, '-filter_complex', f.join(';'), '-map', '[aus]', '-ar', '44100', '-c:a', 'pcm_s16le', ziel]);
  const faktor = laenge(ziel) / pos; // atempo rundet minimal – Abweichung gleichmäßig verteilen
  const zt = (sek) => {
    const s = stuecke.find((x) => sek < x.bis) || stuecke[stuecke.length - 1];
    return (s.neu + (Math.min(Math.max(sek, s.von), s.bis) - s.von) / s.tempo) * faktor;
  };
  return { datei: ziel, zt, zeilen: zeilenTempo, temp: true, stuecke: stuecke.length };
}

async function main() {
  const meta = JSON.parse(await readFile(join(FOLGE, 'folge.json'), 'utf8'));
  const tempo = tempoRegel(meta.tempo);
  const plan = JSON.parse(await readFile(join(AUDIO, 'plan.json'), 'utf8'));

  // --- Teile einlesen, Tempo je Stimme anwenden, Ränder und überlange Pausen bestimmen
  const teile = [];
  const sprechtempo = {};
  for (const t of plan.teile) {
    const roh = join(AUDIO, `teil-${nr2(t.nr)}.mp3`);
    if (!(await gibt(roh))) throw new Error(`Teil ${nr2(t.nr)} fehlt – erst erzeugen.mjs ausführen.`);
    const info = JSON.parse(await readFile(join(AUDIO, `teil-${nr2(t.nr)}.json`), 'utf8'));
    const tt = tempoTeil(t, info, roh, tempo, laenge(roh));
    for (const x of tt.zeilen) {
      const w = gesprochen(t.zeilen[x.i]?.text || '').split(' ').filter((s) => /\w/.test(s)).length;
      const st = (sprechtempo[x.sprecher] ||= { w: 0, s: 0, tempo: x.tempo });
      st.w += w; st.s += Math.max(0, x.e - x.a) / x.tempo;
    }
    const mp3 = tt.datei;
    const d = laenge(mp3);
    const sp = spanne(info.segmente);
    const von = sp ? Math.max(0, tt.zt(sp.start) - VOR) : 0;
    const bis = sp ? Math.min(d, tt.zt(sp.ende) + NACH) : d;
    const schnitte = [];
    const sd = ff(['-i', mp3, '-af', `silencedetect=noise=-40dB:d=${PAUSE_MAX}`, '-f', 'null', '-']);
    for (const m of sd.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
      const a = +m[1], b = +m[2];
      if (a > von && b < bis && b - a > PAUSE_MAX) schnitte.push({ a: a + PAUSE_BLEIBT / 2, b: b - PAUSE_BLEIBT / 2 });
    }
    const laengeTeil = (bis - von) - schnitte.reduce((s, c) => s + (c.b - c.a), 0);
    teile.push({ ...t, mp3, temp: tt.temp, zt: tt.zt, segmente: info.segmente, alignment: info.alignment, von, bis, schnitte, laenge: laengeTeil, lufs: lufs(mp3) });
  }
  const sprachLufs = 10 * Math.log10(teile.reduce((s, t) => s + t.laenge * 10 ** (t.lufs / 10), 0) / teile.reduce((s, t) => s + t.laenge, 0));

  // --- Musik vorbereiten (hörbares Ende, Pegel)
  const musik = {};
  const brauche = new Set([...teile.map((t) => t.abschnitte[0].musik).filter(Boolean), plan.musikEnde].filter(Boolean));
  for (const name of brauche) {
    const p = join(MUSIK, `${name}.mp3`);
    if (!(await gibt(p))) throw new Error(`Musik ${name}.mp3 fehlt – erst node werkzeuge/musik.mjs ausführen.`);
    const d = laenge(p);
    const sd = ff(['-i', p, '-af', 'silencedetect=noise=-45dB:d=0.2', '-f', 'null', '-']);
    const starts = [...sd.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
    const enden = [...sd.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
    let ende = d;
    if (starts.length) { const ls = starts[starts.length - 1]; const le = enden.find((e) => e > ls); if (!le || le > d - 0.05) ende = Math.min(d, ls + 0.15); }
    const regel = MUSIK_REGEL[name] || MUSIK_REGEL.uebergang;
    musik[name] = { p, dauer: ende, gain: sprachLufs + regel.rel - lufs(p), regel };
  }

  // --- Zeitleiste: Musik und Sprache
  const musikSpur = [];
  let cursor = 0;
  teile.forEach((t, k) => {
    const m = t.abschnitte[0].musik;
    if (m) {
      const mi = musik[m];
      const start = k === 0 ? 0 : cursor + mi.regel.vor;
      musikSpur.push({ name: m, start, teil: t.nr, ...mi });
      t.offset = start + mi.dauer - mi.regel.ueber;
    } else t.offset = cursor + (k === 0 ? 0 : (t.abschnitte[0].forts ? LUECKE : LUECKE_ABSCHNITT));
    cursor = t.offset + t.laenge;
  });
  if (plan.musikEnde) { const mi = musik[plan.musikEnde]; const start = cursor + mi.regel.vor; musikSpur.push({ name: plan.musikEnde, start, ...mi }); cursor = start + mi.dauer; }
  const gesamt = cursor;
  const imFinal = (t, sek) => {
    let x = sek - t.von;
    for (const c of t.schnitte) { if (sek >= c.b) x -= c.b - c.a; else if (sek > c.a) x -= sek - c.a; }
    return t.offset + x;
  };

  // --- Einwürfe: nach einem Satzende in der Mitte der Zielzeile, sonst gegen Ende
  const einwuerfe = [];
  for (const w of plan.einwuerfe || []) {
    const mp3 = join(AUDIO, w.datei);
    if (!(await gibt(mp3))) { console.log(`Einwurf ${nr2(w.nr)} fehlt – wird ausgelassen.`); continue; }
    const info = JSON.parse(await readFile(mp3.replace(/\.mp3$/, '.json'), 'utf8'));
    const d = laenge(mp3);
    const sp = spanne(info.segmente);
    const von = sp ? Math.max(0, sp.start - 0.03) : 0, bis = sp ? Math.min(d, sp.ende + 0.08) : d;
    const wt = tempo(w.sprecher);
    const len = (bis - von) / wt;
    const t = teile.find((x) => x.nr === w.teil);
    const ziel = t && spanne(t.segmente, w.index);
    if (!ziel) { console.log(`Einwurf ${nr2(w.nr)}: Zielzeile ohne Zeitmarke – ausgelassen.`); continue; }
    const dur = ziel.ende - ziel.start;
    let lokal = dur > len + 0.4 ? Math.max(ziel.start + 0.45 * dur, ziel.ende - len - 0.15) : ziel.start + 0.2;
    const al = t.alignment;
    if (al?.characters && Number.isFinite(ziel.cs) && ziel.ce <= al.characters.length) {
      let best = null;
      for (let c = ziel.cs; c < ziel.ce; c++) {
        if (!/[.?!…:]/.test(al.characters[c])) continue;
        const te = al.character_end_times_seconds[c], rel = (te - ziel.start) / dur;
        if (rel < 0.3 || ziel.ende - te < len + 0.3) continue;
        const wert = Math.abs(rel - 0.55);
        if (!best || wert < best.wert) best = { t: te + 0.06, wert };
      }
      if (best) lokal = best.t;
    }
    einwuerfe.push({ ...w, mp3, von, bis, tempo: wt, bei: imFinal(t, t.zt(lokal)) });
  }

  // --- Kapitel und Quellen
  const kapitel = [];
  for (const t of teile) for (const a of t.abschnitte) {
    if (a.forts) continue;
    let s = t.offset;
    if (a.musik) s = musikSpur.find((m) => m.teil === t.nr)?.start ?? s;
    else if (a.ab > 0) { const z = spanne(t.segmente, a.ab); if (z) s = Math.max(t.offset, imFinal(t, t.zt(z.start)) - 0.4); }
    kapitel.push({ titel: a.titel.replace(/^\d+\s*·\s*/, ''), start: s });
  }
  kapitel.forEach((k, i) => { k.ende = i + 1 < kapitel.length ? kapitel[i + 1].start : gesamt; });
  const quellen = [];
  for (const t of teile) t.zeilen.forEach((z, i) => {
    if (!z.quellen?.length) return;
    const sp = spanne(t.segmente, i);
    const s = sp ? imFinal(t, t.zt(sp.start)) : t.offset;
    for (const q of z.quellen) quellen.push({ t: +s.toFixed(1), sprecher: z.sprecher, ...q });
  });

  // --- Filtergraph
  const ein = [];
  const f = [];
  const kette = [];
  let ende = 0;
  teile.forEach((t, k) => {
    const luecke = t.offset - ende;
    if (luecke > 0.001) { f.push(`aevalsrc=0:s=44100:c=stereo:d=${luecke.toFixed(3)}[l${k}]`); kette.push(`[l${k}]`); }
    const weg = t.schnitte.map((c) => `between(t,${(c.a - t.von).toFixed(3)},${(c.b - t.von).toFixed(3)})`).join('+');
    f.push(`[${ein.length}:a]atrim=start=${t.von.toFixed(3)}:end=${t.bis.toFixed(3)},asetpts=PTS-STARTPTS${weg ? `,aselect='not(${weg})',asetpts=N/SR/TB` : ''},aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[t${k}]`);
    ein.push(t.mp3); kette.push(`[t${k}]`);
    ende = t.offset + t.laenge;
  });
  f.push(`${kette.join('')}concat=n=${kette.length}:v=0:a=1[sprache]`);
  const misch = ['[sprache]'];
  einwuerfe.forEach((w, j) => {
    f.push(`[${ein.length}:a]atrim=start=${w.von.toFixed(3)}:end=${w.bis.toFixed(3)},asetpts=PTS-STARTPTS${w.tempo !== 1 ? `,atempo=${w.tempo}` : ''},aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${EINWURF_DB}dB,adelay=${Math.round(w.bei * 1000)}:all=1[e${j}]`);
    ein.push(w.mp3); misch.push(`[e${j}]`);
  });
  musikSpur.forEach((m, j) => {
    const r = m.regel;
    f.push(`[${ein.length}:a]atrim=start=0:end=${m.dauer.toFixed(3)},asetpts=PTS-STARTPTS,aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${m.gain.toFixed(2)}dB${r.ein ? `,afade=t=in:st=0:d=${r.ein}` : ''},afade=t=out:st=${Math.max(0, m.dauer - r.aus).toFixed(3)}:d=${r.aus},adelay=${Math.round(m.start * 1000)}:all=1[m${j}]`);
    ein.push(m.p); misch.push(`[m${j}]`);
  });
  f.push(`${misch.join('')}amix=inputs=${misch.length}:duration=longest:normalize=0:dropout_transition=0[mix]`);
  f.push(`[mix]highpass=f=60,acompressor=threshold=-21dB:ratio=2:attack=20:release=250:makeup=1.4[aus]`);

  const zwischen = join(AUDIO, '_zwischen.wav');
  ff([...ein.flatMap((e) => ['-i', e]), '-filter_complex', f.join(';'), '-map', '[aus]', '-c:a', 'pcm_s16le', zwischen]);
  const mess = ff(['-i', zwischen, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = JSON.parse(mess.slice(mess.lastIndexOf('{'), mess.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;

  const laengeFertig = gesamt;
  const META = { title: `Folge ${meta.nummer}: ${meta.titel}`, artist: 'Zwischen den Zeilen – der Podcast vom Boniblatt', album: 'Zwischen den Zeilen', date: meta.datum.slice(0, 4), genre: 'Podcast', language: 'deu', comment: `Stimmen ${meta.stimmen}. Faktenstand: ${meta.stand}. Quellen: boniblatt-mainz.de/podcast.html` };
  const esc = (s) => String(s).replace(/([=;#\\\n])/g, '\\$1');
  const kapitelDatei = join(AUDIO, '_kapitel.txt');
  await writeFile(kapitelDatei, [';FFMETADATA1', ...Object.entries(META).map(([k, v]) => `${k}=${esc(v)}`),
    ...kapitel.flatMap((k) => ['[CHAPTER]', 'TIMEBASE=1/1000', `START=${Math.round(k.start * 1000)}`, `END=${Math.round(k.ende * 1000)}`, `title=${esc(k.titel)}`])].join('\n') + '\n');
  const master = join(AUDIO, 'folge-master.mp3');
  const web = join(AUDIO, meta.datei);
  const enc = (ziel, rate) => ff(['-i', zwischen, '-i', kapitelDatei, '-map', '0:a', '-map_metadata', '1', '-map_chapters', '1', '-af', `${ln},aresample=44100`, '-c:a', 'libmp3lame', '-b:a', rate, '-id3v2_version', '3', '-write_id3v1', '1', ziel]);
  enc(master, '192k');
  enc(web, '112k');

  // Wellenform für die Webseite (240 Balken)
  const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', web, '-ac', '1', '-ar', '4000', '-f', 's16le', '-'], { maxBuffer: 1 << 27 }).stdout;
  const n = pcm.length / 2, B = 240, welle = [];
  for (let b = 0; b < B; b++) {
    let e = 0; const a = Math.floor((b * n) / B), z = Math.floor(((b + 1) * n) / B);
    for (let i = a; i < z; i++) e += (pcm.readInt16LE(i * 2) / 32768) ** 2;
    welle.push(Math.sqrt(e / Math.max(1, z - a)));
  }
  const max = Math.max(...welle);
  const kontrolle = ff(['-i', web, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const k2 = JSON.parse(kontrolle.slice(kontrolle.lastIndexOf('{'), kontrolle.lastIndexOf('}') + 1));
  await unlink(zwischen).catch(() => {});
  await unlink(kapitelDatei).catch(() => {});
  for (const t of teile) if (t.temp) await unlink(t.mp3).catch(() => {});

  const daten = {
    nummer: meta.nummer, id: meta.id, titel: meta.titel, beschreibung: meta.beschreibung, datum: meta.datum, stand: meta.stand,
    stimmen: meta.stimmen, datei: meta.datei, fassung: meta.fassung || 1, ...(meta.themaId ? { themaId: meta.themaId } : {}), dauer: Math.round(laengeFertig),
    kapitel: kapitel.map((k) => ({ t: +k.start.toFixed(1), titel: k.titel })),
    quellen, welle: welle.map((v) => +Math.pow(v / max, 0.7).toFixed(2)),
  };
  await writeFile(join(AUDIO, 'web.json'), JSON.stringify(daten));
  await writeFile(join(AUDIO, 'shownotes.md'), [`# Zwischen den Zeilen – Folge ${meta.nummer}: ${meta.titel}`, '', meta.beschreibung, '',
    `Länge ${zeit(laengeFertig)} · Stimmen ${meta.stimmen} · Faktenstand ${meta.stand}`, '', '## Kapitel', '', ...kapitel.map((k) => `- ${zeit(k.start)} ${k.titel}`),
    '', '## Quellen', '', ...quellen.map((q) => `- ${zeit(q.t)} ${q.aussage} – ${q.quelle}${q.url ? ` (${q.url})` : ''}`)].join('\n') + '\n');

  console.log(`\nFertig: ${web}  (+ ${master.split(/[\\/]/).pop()})`);
  console.log(`Länge ${zeit(laengeFertig)} · Lautheit ${k2.input_i} LUFS · Spitze ${k2.input_tp} dBTP · Sprache ${sprachLufs.toFixed(1)} LUFS vor Normierung`);
  console.log(`${kapitel.length} Kapitel · ${einwuerfe.length} Einwürfe · ${musikSpur.length} Musikstücke · ${quellen.length} Quellen-Zeitmarken`);
  const gekuerzt = teile.flatMap((t) => t.schnitte.map((c) => `Teil ${nr2(t.nr)}: −${(c.b - c.a).toFixed(1)} s`));
  if (gekuerzt.length) console.log(`Lange Pausen gekürzt: ${gekuerzt.join(' · ')}`);
  console.log(`Sprechtempo: ${Object.entries(sprechtempo).map(([k, v]) => `${k} ${Math.round(v.w / (v.s / 60))} Wörter/min (×${v.tempo})`).join(' · ')}`);
  kapitel.forEach((k) => console.log(`  ${zeit(k.start)}  ${k.titel}`));
  musikSpur.forEach((x) => console.log(`  ♪ ${x.name.padEnd(9)} ${zeit(x.start)}  ${x.dauer.toFixed(1)} s  ${x.gain >= 0 ? '+' : ''}${x.gain.toFixed(1)} dB`));
  einwuerfe.forEach((w) => console.log(`  Einwurf ${nr2(w.nr)} (${w.sprecher}) bei ${zeit(w.bei)}`));
}

main().catch((f) => { console.error(`\nFehler: ${f.message}\n`); process.exit(1); });
