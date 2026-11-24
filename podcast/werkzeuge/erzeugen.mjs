#!/usr/bin/env node
// erzeugen.mjs – macht aus folgen/<ordner>/skript.txt die Sprachaufnahmen einer Folge.
// ElevenLabs „Text to Dialogue“ (Eleven v4) mit Zeitmarken: beide Stimmen in einer Anfrage, dadurch klingen
// Unterbrechungen, Lacher und Tempo wie ein echtes Gespräch. Die Zeitmarken braucht abmischen.mjs für
// Einwürfe, Kapitel, Musik und die Quellen-Zeitstempel auf der Webseite.
//
//   node werkzeuge/erzeugen.mjs folgen/01-strukturreform --probe     nur prüfen (kostenlos)
//   node werkzeuge/erzeugen.mjs folgen/01-strukturreform --test      nur Teil 1 (Stimmen/Tempo testen)
//   node werkzeuge/erzeugen.mjs folgen/01-strukturreform             alle Teile + Einwürfe (fertige werden übersprungen)
//   node werkzeuge/erzeugen.mjs folgen/01-strukturreform --nur 4 --seed 900   Teil 4 neu „aufnehmen“
// Schalter: --stabilitaet 0.4  --modell eleven_v4  --grenze 1900  --ohne-einwuerfe
// Braucht: Node 18+, ELEVENLABS_API_KEY (Umgebungsvariable), Stimmen-IDs in stimmen.json (Podcast-Ordner oder Folgenordner).

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const FOLGE = resolve(args.find((a) => !a.startsWith('--') && !/^\d/.test(a)) || '.');
const AUDIO = join(FOLGE, 'audio');
const API = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps'; // Umleitung nur für Tests

const hat = (n) => args.includes(n);
const wert = (n, std) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : std; };
const E = {
  modell: wert('--modell', 'eleven_v4'),
  stabilitaet: Number(wert('--stabilitaet', '0.4')), // niedriger = lebendiger, höher = ruhiger (0.4 seit Folge 1, Fassung 3)
  grenze: Number(wert('--grenze', '1900')),             // Zeichen je Anfrage; ElevenLabs empfiehlt höchstens 2000
  format: wert('--format', 'mp3_44100_128'),
  seed: Number(wert('--seed', '4711')),
};

// ---------- Skript lesen ----------
// NAME: Text | +NAME: Einwurf | ## Abschnitt | #> musik NAME | #@ Aussage | Quelle | Link | # Kommentar
function lies(text) {
  const elemente = [];
  let musikOffen = null, letzteZeile = null;
  text.split(/\r?\n/).forEach((roh, i) => {
    const z = roh.trim();
    if (!z) return;
    if (z.startsWith('#>')) { const m = z.match(/^#>\s*musik\s+([a-z0-9-]+)/i); if (m) musikOffen = m[1].toLowerCase(); return; }
    if (z.startsWith('#@')) {
      const [aussage, quelle, url] = z.slice(2).split('|').map((s) => s.trim());
      if (letzteZeile) (letzteZeile.quellen ||= []).push({ aussage, quelle, url: url || '' });
      return;
    }
    if (z.startsWith('##')) { elemente.push({ art: 'abschnitt', titel: z.replace(/^#+\s*/, ''), musik: musikOffen }); musikOffen = null; return; }
    if (z.startsWith('#')) return;
    const m = z.match(/^(\+)?([A-Za-zÄÖÜäöüß]+):\s*(.+)$/);
    if (!m) throw new Error(`skript.txt, Zeile ${i + 1} nicht verstanden: „${z.slice(0, 60)}“`);
    const e = { art: 'zeile', einwurf: !!m[1], sprecher: m[2].toUpperCase(), text: m[3].trim(), zeile: i + 1 };
    elemente.push(e);
    if (!e.einwurf) letzteZeile = e;
  });
  return { elemente, musikEnde: musikOffen };
}

const gesprochen = (t) => t.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
const endetMitStrich = (t) => /[—–-]\s*$/.test(t);

// ---------- In Teile schneiden ----------
function schneide(elemente) {
  const bausteine = [];
  for (const e of elemente) {
    if (e.art === 'abschnitt') { bausteine.push({ abschnitt: e }); continue; }
    if (e.einwurf) continue;
    const letzter = bausteine[bausteine.length - 1];
    if (letzter?.zeilen && endetMitStrich(letzter.zeilen[letzter.zeilen.length - 1].text)) {
      letzter.zeilen.push(e); letzter.zeichen += e.text.length;
    } else bausteine.push({ zeilen: [e], zeichen: e.text.length });
  }
  // Abschnitte sammeln
  const abschnitte = [];
  let offen = null;
  for (const b of bausteine) {
    if (b.abschnitt) { offen = { info: b.abschnitt, bausteine: [], zeichen: 0 }; abschnitte.push(offen); continue; }
    if (!offen) { offen = { info: { titel: 'Anfang', musik: null }, bausteine: [], zeichen: 0 }; abschnitte.push(offen); }
    offen.bausteine.push(b); offen.zeichen += b.zeichen;
    if (b.zeichen > E.grenze) console.warn(`Achtung: Ein Baustein ab Skriptzeile ${b.zeilen[0].zeile} ist länger als ${E.grenze} Zeichen.`);
  }
  const teile = [];
  let teil = null;
  const neu = (info, forts) => { teil = { nr: teile.length + 1, abschnitte: [{ titel: info.titel, musik: forts ? null : info.musik || null, ab: 0, forts }], zeilen: [], zeichen: 0 }; teile.push(teil); };
  for (const a of abschnitte) {
    // Passt ein Abschnitt ohne Musik noch ganz in den laufenden Teil, bleibt er dort.
    if (teil && !a.info.musik && teil.zeichen + a.zeichen <= E.grenze) {
      teil.abschnitte.push({ titel: a.info.titel, musik: null, ab: teil.zeilen.length, forts: false });
      for (const b of a.bausteine) { teil.zeilen.push(...b.zeilen); teil.zeichen += b.zeichen; }
      continue;
    }
    // Sonst: neuer Teil (bei Musik immer), langer Abschnitt in gleich große Teile – keine Ein-Zeilen-Reste
    const k = Math.max(1, Math.ceil(a.zeichen / (E.grenze * 0.95)));
    const ziel = a.zeichen / k;
    neu(a.info, false);
    let stueck = 1;
    for (const b of a.bausteine) {
      const zuVoll = teil.zeichen + b.zeichen > E.grenze;
      const zielErreicht = stueck < k && teil.zeichen + b.zeichen / 2 > ziel;
      if (teil.zeilen.length && (zuVoll || zielErreicht)) { neu(a.info, true); stueck++; }
      teil.zeilen.push(...b.zeilen); teil.zeichen += b.zeichen;
    }
  }
  return teile;
}
const abschnittsText = (t) => t.abschnitte.map((a) => (a.musik ? `♪${a.musik} ` : '') + a.titel + (a.forts ? ' (Forts.)' : '')).join(' + ');

// Einwürfe: unter welche Hauptzeile (Teil + Zeilennummer im Teil) sie gehören
function einwuerfe(elemente, teile) {
  const ort = new Map();
  for (const t of teile) t.zeilen.forEach((z, i) => ort.set(z, { teil: t.nr, index: i }));
  const liste = [];
  let vorher = null;
  for (const e of elemente) {
    if (e.art !== 'zeile') continue;
    if (!e.einwurf) { vorher = e; continue; }
    const o = vorher ? ort.get(vorher) : { teil: 1, index: 0 };
    liste.push({ ...e, nr: liste.length + 1, teil: o.teil, index: o.index, unter: vorher });
  }
  return liste;
}

const nr2 = (n) => String(n).padStart(2, '0');
const teilDatei = (n, endung = 'mp3') => join(AUDIO, `teil-${nr2(n)}.${endung}`);
const einwurfDatei = (w, endung = 'mp3') => join(AUDIO, `einwurf-${nr2(w.nr)}-${w.sprecher.toLowerCase()}.${endung}`);
const gibt = async (p) => access(p).then(() => true, () => false);
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const signatur = (inputs) => createHash('sha1').update(JSON.stringify({ inputs, m: E.modell, s: E.stabilitaet, f: E.format })).digest('hex').slice(0, 12);

// ---------- ElevenLabs ----------
async function erzeuge(inputs, seed, vorherIds, schluessel) {
  const body = { inputs, model_id: E.modell, language_code: 'de', settings: { stability: E.stabilitaet }, seed };
  if (vorherIds?.length) body.previous_request_ids = vorherIds.slice(-3);
  for (let versuch = 1; versuch <= 4; versuch++) {
    const res = await fetch(`${API}?output_format=${E.format}`, {
      method: 'POST',
      headers: { 'xi-api-key': schluessel, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const id = res.headers.get('request-id');
      if ((res.headers.get('content-type') || '').includes('json')) {
        const j = await res.json();
        if (!j.audio_base64) throw new Error(`Antwort ohne audio_base64 (Felder: ${Object.keys(j).join(', ')})`);
        return { audio: Buffer.from(j.audio_base64, 'base64'), id, segmente: j.voice_segments || null, alignment: j.alignment || null, normalisiert: j.normalized_alignment || null };
      }
      return { audio: Buffer.from(await res.arrayBuffer()), id, segmente: null };
    }
    const text = await res.text().catch(() => '');
    if ((res.status === 400 || res.status === 422) && body.previous_request_ids) { delete body.previous_request_ids; continue; }
    if ((res.status === 429 || res.status >= 500) && versuch < 4) { await warte(versuch * 6000); continue; }
    if (res.status === 401) throw new Error('ElevenLabs lehnt den API-Schlüssel ab (401). Schlüssel und Rechte prüfen.');
    throw new Error(`ElevenLabs antwortet mit ${res.status}: ${text.slice(0, 400)}`);
  }
  throw new Error('ElevenLabs hat nach mehreren Versuchen nicht geantwortet.');
}

function pruefe(zeilen, segmente) {
  if (!segmente) return { dauer: null, hinweise: ['keine Zeitmarken'] };
  const hinweise = [];
  zeilen.forEach((z, i) => {
    const s = segmente.filter((g) => g.dialogue_input_index === i);
    const zeichen = gesprochen(z.text).length;
    if (!s.length) { hinweise.push(`Zeile ${i + 1} (${z.sprecher}) ohne Ton: „${gesprochen(z.text).slice(0, 40)}“`); return; }
    const d = s.reduce((a, g) => a + (g.end_time_seconds - g.start_time_seconds), 0);
    const tempo = zeichen / Math.max(d, 0.01);
    if (zeichen > 12 && (tempo < 5 || tempo > 28)) hinweise.push(`Zeile ${i + 1} (${z.sprecher}) auffälliges Tempo ${tempo.toFixed(1)} Zeichen/s: „${gesprochen(z.text).slice(0, 40)}“`);
  });
  return { dauer: +Math.max(...segmente.map((g) => g.end_time_seconds)).toFixed(2), hinweise };
}

// ---------- Ablauf ----------
async function main() {
  const { elemente, musikEnde } = lies(await readFile(join(FOLGE, 'skript.txt'), 'utf8'));
  const teile = schneide(elemente);
  const extras = einwuerfe(elemente, teile);
  const sprecher = [...new Set(elemente.filter((e) => e.art === 'zeile').map((e) => e.sprecher))];
  const haupt = elemente.filter((e) => e.art === 'zeile' && !e.einwurf);
  const woerter = haupt.map((e) => gesprochen(e.text)).join(' ').split(/\s+/).filter(Boolean).length;

  if (hat('--probe')) {
    const zeichen = haupt.reduce((s, e) => s + e.text.length, 0) + extras.reduce((s, e) => s + e.text.length, 0);
    const turns = haupt.map((e) => gesprochen(e.text).split(/\s+/).length);
    console.log(`\nSkript: ${haupt.length} Wortwechsel, ${woerter} gesprochene Wörter (Ø ${(woerter / haupt.length).toFixed(1)} je Beitrag, ${turns.filter((n) => n <= 6).length} sehr kurze), Sprecher: ${sprecher.join(', ')}`);
    console.log(`Geschätzte Sprechdauer bei ~128 Wörtern/min: ${(woerter / 128).toFixed(1)} min (ohne Musik)`);
    console.log(`Quellenangaben: ${haupt.reduce((s, e) => s + (e.quellen?.length || 0), 0)} · Musik: ${elemente.filter((e) => e.musik).map((e) => e.musik).join(', ')}${musikEnde ? `, ${musikEnde} (Ende)` : ''}\n`);
    for (const t of teile) console.log(`Teil ${nr2(t.nr)}  ${String(t.zeichen).padStart(5)} Zeichen  ${String(t.zeilen.length).padStart(3)} Zeilen  ${abschnittsText(t)}`);
    console.log(`\nEinwürfe zum Unterlegen: ${extras.length}`);
    console.log(`Zeichen insgesamt (so zählt ElevenLabs): ${zeichen}`);
    console.log(`Größter Teil: ${Math.max(...teile.map((t) => t.zeichen))} Zeichen (Grenze ${E.grenze})\n`);
    return;
  }

  const schluessel = process.env.ELEVENLABS_API_KEY;
  if (!schluessel) { console.error('\nKein API-Schlüssel (ELEVENLABS_API_KEY) gefunden.\n'); process.exit(1); }
  const stimmenPfad = (await gibt(join(FOLGE, 'stimmen.json'))) ? join(FOLGE, 'stimmen.json') : join(WERKSTATT, 'stimmen.json');
  const stimmen = JSON.parse(await readFile(stimmenPfad, 'utf8'));
  for (const s of sprecher) if (!stimmen[s] || /HIER/.test(stimmen[s])) { console.error(`\nIn stimmen.json fehlt die Stimmen-ID für ${s}.\n`); process.exit(1); }

  await mkdir(AUDIO, { recursive: true });
  await writeFile(join(AUDIO, 'plan.json'), JSON.stringify({
    musikEnde,
    teile: teile.map((t) => ({ nr: t.nr, abschnitte: t.abschnitte, zeichen: t.zeichen, zeilen: t.zeilen.map((z) => ({ sprecher: z.sprecher, text: z.text, quellen: z.quellen || [] })) })),
    einwuerfe: extras.map((w) => ({ nr: w.nr, sprecher: w.sprecher, text: w.text, teil: w.teil, index: w.index, datei: einwurfDatei(w).split(/[\\/]/).pop() })),
  }, null, 1));

  const berichtPfad = join(AUDIO, 'bericht.json');
  const bericht = (await gibt(berichtPfad)) ? JSON.parse(await readFile(berichtPfad, 'utf8')) : { teile: {}, einwuerfe: {} };
  const speichereBericht = () => writeFile(berichtPfad, JSON.stringify(bericht, null, 2));
  const nur = hat('--nur') ? String(wert('--nur', '')).split(',').map(Number).filter(Boolean) : null;
  const auswahl = hat('--test') ? [1] : nur;
  const erzwingen = (n) => hat('--test') || (nur && nur.includes(n));

  for (const t of teile) {
    if (auswahl && !auswahl.includes(t.nr)) continue;
    const inputs = t.zeilen.map((z) => ({ text: z.text, voice_id: stimmen[z.sprecher] }));
    const sig = signatur(inputs);
    if (!erzwingen(t.nr) && (await gibt(teilDatei(t.nr)))) {
      if (bericht.teile[t.nr]?.sig === sig) { console.log(`Teil ${nr2(t.nr)} liegt schon vor – übersprungen.`); continue; }
      console.log(`Teil ${nr2(t.nr)}: Skript, Stimme oder Einstellung geändert – wird neu erzeugt.`);
    }
    const seed = E.seed + t.nr;
    const vorher = [bericht.teile[t.nr - 2]?.id, bericht.teile[t.nr - 1]?.id].filter(Boolean);
    process.stdout.write(`Teil ${nr2(t.nr)}/${nr2(teile.length)} (${t.zeichen} Zeichen, ${abschnittsText(t)}) … `);
    const { audio, id, segmente, alignment, normalisiert } = await erzeuge(inputs, seed, vorher, schluessel);
    const p = pruefe(t.zeilen, segmente);
    await writeFile(teilDatei(t.nr), audio);
    await writeFile(teilDatei(t.nr, 'json'), JSON.stringify({ nr: t.nr, requestId: id, seed, segmente, alignment, normalisiert }));
    bericht.teile[t.nr] = { id, seed, sig, zeichen: t.zeichen, dauer: p.dauer, hinweise: p.hinweise, erzeugt: new Date().toISOString() };
    await speichereBericht();
    console.log(`fertig${p.dauer ? `, ${p.dauer} s` : ''}${p.hinweise.length ? `\n   ⚠ ${p.hinweise.join('\n   ⚠ ')}` : ''}`);
  }

  if (!hat('--test') && !nur && !hat('--ohne-einwuerfe')) {
    for (const w of extras) {
      const inputs = [{ text: w.text, voice_id: stimmen[w.sprecher] }];
      const sig = signatur(inputs);
      if ((await gibt(einwurfDatei(w))) && bericht.einwuerfe[w.nr]?.sig === sig) continue;
      process.stdout.write(`Einwurf ${nr2(w.nr)} (${w.sprecher}: ${gesprochen(w.text)}) … `);
      const { audio, id, segmente } = await erzeuge(inputs, E.seed + 100 + w.nr, [], schluessel);
      await writeFile(einwurfDatei(w), audio);
      await writeFile(einwurfDatei(w, 'json'), JSON.stringify({ nr: w.nr, requestId: id, segmente }));
      bericht.einwuerfe[w.nr] = { id, sig, erzeugt: new Date().toISOString() };
      await speichereBericht();
      console.log('fertig');
    }
  }
  const fehlend = [];
  for (const t of teile) if (!(await gibt(teilDatei(t.nr)))) fehlend.push(nr2(t.nr));
  console.log(fehlend.length ? `\nEs fehlen noch Teile: ${fehlend.join(', ')}.\n` : `\nAlle ${teile.length} Teile da. Weiter mit: node werkzeuge/pruefen.mjs ${FOLGE} · node werkzeuge/abmischen.mjs ${FOLGE}\n`);
}

main().catch((f) => { console.error(`\nFehler: ${f.message}\n`); process.exit(1); });
