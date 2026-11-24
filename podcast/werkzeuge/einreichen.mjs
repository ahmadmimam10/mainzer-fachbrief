#!/usr/bin/env node
// einreichen.mjs – für die Wochenroutine (routinen/podcast.md): prüft eine neue Folge und lädt NUR ihren Ordner hoch.
// Danach baut die Action „Podcast produzieren“ (.github/workflows/podcast.yml) Ton, Prüfung, Abmischung und Seite.
//   node podcast/werkzeuge/einreichen.mjs podcast/folgen/02-thema            prüfen, dann Commit und Push
//   node podcast/werkzeuge/einreichen.mjs podcast/folgen/02-thema --probe    nur prüfen
// Exit 2 = Prüffehler (Dateien korrigieren und denselben Befehl wiederholen) · Exit 3 = Hochladen gescheitert
import { readFile, readdir, access } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WERKSTATT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(WERKSTATT, '..');
const args = process.argv.slice(2);
const FOLGE = resolve(args.find((a) => !a.startsWith('--')) || '.');
const NAME = basename(FOLGE);
const PFAD = relative(REPO, FOLGE).split('\\').join('/');
const WOERTER = [2100, 2900];          // ≈ 15–20 Minuten bei Miras und Jonas' Tempo (≈ 143–146 Wörter/min)
const QUELLEN_MIN = 12;
const KUERZEL_OK = new Set(['EU', 'UN', 'USA', 'OECD', 'ARD', 'ZDF', 'SWR', 'WDR', 'NDR', 'DIN', 'TV', 'OK', 'SPD', 'CDU', 'CSU', 'FDP', 'BSW']);   // Parteien werden ohnehin buchstabiert
const fehler = [], hinweise = [];
const gibt = (p) => access(p).then(() => true, () => false);

// ---------- Ordner und folge.json ----------
if (!/^[0-9]{2,3}-[a-z0-9]+(-[a-z0-9]+)*$/.test(NAME) || PFAD !== `podcast/folgen/${NAME}`) fehler.push(`Ordner muss podcast/folgen/<NN>-<thema> heißen (klein, ohne Umlaute), ist: ${PFAD}`);
let meta = {};
try { meta = JSON.parse(await readFile(join(FOLGE, 'folge.json'), 'utf8')); } catch (e) { fehler.push(`folge.json fehlt oder ist kein gültiges JSON (${e.message}).`); }
const nn = NAME.split('-')[0], slug = NAME.slice(nn.length + 1);
const bestand = await readFile(join(REPO, 'docs', 'daten', 'podcast.json'), 'utf8').then(JSON.parse, () => ({ folgen: [] }));
const vorhanden = (bestand.folgen || []).find((f) => f.id === meta.id);
const hoechste = Math.max(0, ...(bestand.folgen || []).map((f) => f.nummer || 0));
if (meta.id !== undefined) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.datum)) || Number.isNaN(Date.parse(meta.datum))) fehler.push('folge.json: „datum“ muss JJJJ-MM-TT sein (Erscheinungstag, also der Montag).');
  else if (new Date(meta.datum + 'T12:00:00Z').getUTCDay() !== 1) hinweise.push(`folge.json: ${meta.datum} ist kein Montag – stimmt das?`);
  if (meta.id !== `${meta.datum}-${slug}`) fehler.push(`folge.json: „id“ muss „${meta.datum}-${slug}“ sein.`);
  if (!Number.isInteger(meta.nummer) || meta.nummer < 1) fehler.push('folge.json: „nummer“ muss eine ganze Zahl sein.');
  else if (!vorhanden && meta.nummer !== hoechste + 1) fehler.push(`folge.json: „nummer“ muss ${hoechste + 1} sein (bisher höchste: ${hoechste}).`);
  if (Number(nn) !== meta.nummer) fehler.push(`Ordnername beginnt mit ${nn}, „nummer“ ist ${meta.nummer} – beides gleich halten (z. B. 02-…).`);
  if (meta.datei !== `folge-${nn}-${slug}.mp3`) fehler.push(`folge.json: „datei“ muss „folge-${nn}-${slug}.mp3“ sein.`);
  if (typeof meta.titel !== 'string' || meta.titel.length < 10 || meta.titel.length > 90) fehler.push('folge.json: „titel“ 10–90 Zeichen.');
  if (typeof meta.beschreibung !== 'string' || meta.beschreibung.length < 60 || meta.beschreibung.length > 320) fehler.push('folge.json: „beschreibung“ 60–320 Zeichen.');
  if (typeof meta.stand !== 'string' || !meta.stand.trim()) fehler.push('folge.json: „stand“ fehlt (Faktenstand, z. B. „30.11.2026“).');
  if (typeof meta.stimmen !== 'string' || !/KI/.test(meta.stimmen)) fehler.push('folge.json: „stimmen“ muss die KI-Kennzeichnung enthalten, z. B. „KI-generiert (ElevenLabs Eleven v4)“.');
}
// ---------- Besetzung: Jonas ist immer da, dazu genau ein Gast (folge.json → "gast") ----------
const besetzung = await readFile(join(WERKSTATT, 'besetzung.json'), 'utf8').then(JSON.parse, () => ({ gastgeber: 'JONAS', figuren: { JONAS: { tempo: 1 }, MIRA: { tempo: 1.02 } } }));
const FIGUREN = besetzung.figuren || {}, GASTGEBER = besetzung.gastgeber || 'JONAS';
if (meta.id !== undefined) {
  if (!meta.gast || !FIGUREN[meta.gast] || meta.gast === GASTGEBER) fehler.push(`folge.json: „gast“ muss eine Figur aus podcast/besetzung.json sein: ${Object.keys(FIGUREN).filter((k) => k !== GASTGEBER).join(', ')}.`);
  const soll = Object.fromEntries([GASTGEBER, meta.gast].filter((k) => FIGUREN[k]).map((k) => [k, FIGUREN[k].tempo || 1]));
  const ok = meta.tempo && typeof meta.tempo === 'object' && Object.keys(soll).every((k) => meta.tempo[k] > 0.9 && meta.tempo[k] < 1.12);
  if (!ok) fehler.push(`folge.json: „tempo“ braucht Werte für Gastgeber und Gast, wie in podcast/besetzung.json: ${JSON.stringify(soll)}.`);
}

// ---------- Themenliste aus der Verwaltung: Dran ist das oberste Thema, das noch keine Folge hat ----------
const liste = await readFile(join(REPO, 'daten', 'podcast-themen.json'), 'utf8').then(JSON.parse, () => ({ themen: [] }));
const themen = Array.isArray(liste.themen) ? liste.themen : [];
const benutzt = new Set();
for (const name of await readdir(join(WERKSTATT, 'folgen')).catch(() => [])) {
  if (name === NAME) continue;
  try { const m = JSON.parse(await readFile(join(WERKSTATT, 'folgen', name, 'folge.json'), 'utf8')); if (m.themaId) benutzt.add(m.themaId); } catch { /* kein Folgenordner */ }
}
const dran = themen.find((t) => !benutzt.has(t.id));
if (meta.themaId) {
  const t = themen.find((x) => x.id === meta.themaId);
  if (!t) fehler.push(`folge.json: „themaId“ ${meta.themaId} steht nicht in daten/podcast-themen.json.`);
  else if (benutzt.has(meta.themaId)) fehler.push(`folge.json: Zum Thema „${t.thema}“ gibt es schon eine Folge.`);
  else if (!vorhanden && dran && meta.themaId !== dran.id) fehler.push(`folge.json: Dran ist das oberste offene Thema „${dran.thema}“ – "themaId": "${dran.id}".`);
} else if (!vorhanden && dran) fehler.push(`In der Themenliste wartet „${dran.thema}“: folge.json braucht "themaId": "${dran.id}", und die Folge muss dieses Thema mit seinen Anweisungen behandeln.`);
if (meta.themaId) {
  const t = themen.find((x) => x.id === meta.themaId) || {};
  console.log(`Thema aus der Verwaltung: ${t.thema || meta.themaId}${t.gast ? ` · Gast laut Liste: ${t.gast}` : ''}`);
  if (t.gast && meta.gast !== t.gast) fehler.push(`Für dieses Thema ist in der Verwaltung ${(FIGUREN[t.gast] || {}).name || t.gast} als Gast eingetragen – folge.json: "gast": "${t.gast}".`);
}

// ---------- skript.txt ----------
let skript = '';
try { skript = await readFile(join(FOLGE, 'skript.txt'), 'utf8'); } catch { fehler.push('skript.txt fehlt.'); }
if (skript) {
  const zeilen = skript.split(/\r?\n/);
  const erstesKapitel = zeilen.findIndex((z) => z.startsWith('## '));
  if (!zeilen.slice(0, Math.max(0, erstesKapitel)).some((z) => /^#>\s*musik\s+thema\b/.test(z.trim()))) fehler.push('Die Titelmelodie fehlt: „#> musik thema“ gehört direkt vor das erste „## …“.');
  const letzte = zeilen.map((z) => z.trim()).filter(Boolean).pop() || '';
  if (!/^#>\s*musik\s+outro\b/.test(letzte)) fehler.push('Der Abspann fehlt: „#> musik outro“ muss die letzte Zeile sein.');
  if (zeilen.some((z) => /^#>\s*musik\s+(uebergang|intro)\b/.test(z.trim()))) fehler.push('Keine Übergangs- oder Intro-Musik (Wunsch des Nutzers): nur „thema“ am Anfang und „outro“ am Ende.');
  let quellen = 0;
  const sprecher = new Set();
  zeilen.forEach((roh, i) => {
    const z = roh.trim(), wo = `skript.txt, Zeile ${i + 1}`;
    if (z.startsWith('#@')) {
      quellen++;
      const teile = z.slice(2).split('|').map((s) => s.trim());
      if (teile.length < 3 || !teile[0] || !teile[1] || !/^https:\/\/\S+$/.test(teile[2])) fehler.push(`${wo}: Quelle braucht „#@ Aussage | Fundstelle | https://…“.`);
      return;
    }
    const m = z.match(/^(\+)?([A-Za-zÄÖÜäöüß]+):\s*(.*)$/);
    if (!m || z.startsWith('#')) return;
    if (![GASTGEBER, meta.gast].includes(m[2])) { fehler.push(`${wo}: „${m[2]}“ spricht hier nicht mit – in dieser Folge nur ${GASTGEBER} und der Gast ${meta.gast || '(folge.json → gast)'}.`); return; }
    if (!m[1]) sprecher.add(m[2]);
    const gesprochen = m[3].replace(/\[[^\]]*\]/g, ' ');
    if (/[§%€]/.test(gesprochen)) fehler.push(`${wo}: Zeichen § % € ausschreiben („Paragraf“, „Prozent“, „Euro“).`);
    if (/\b(Abs|Nr|bzw|ca|ggf|usw|vgl|inkl|evtl)\.|\b[zZ]\.\s?[bB]\.|\bd\.\s?h\./.test(gesprochen)) fehler.push(`${wo}: Abkürzung ausschreiben (Absatz, Nummer, beziehungsweise, zum Beispiel …).`);
    for (const k of gesprochen.match(/\b[A-ZÄÖÜ]{2,}[a-zäöü]?\b/g) || []) if (!KUERZEL_OK.has(k)) fehler.push(`${wo}: Kürzel „${k}“ ausschreiben – ElevenLabs spricht es sonst falsch.`);
    if (/\[[^\]]*[äöüÄÖÜß][^\]]*\]/.test(m[3])) fehler.push(`${wo}: Regieanweisungen in [ ] auf Englisch schreiben (z. B. [laughs], [thoughtful]).`);
  });
  if (quellen < QUELLEN_MIN) fehler.push(`Nur ${quellen} Quellenangaben – jede Faktenaussage braucht eine „#@“-Zeile (mindestens ${QUELLEN_MIN}).`);
  if (meta.gast && !(sprecher.has(GASTGEBER) && sprecher.has(meta.gast))) fehler.push(`Im Skript müssen ${GASTGEBER} und der Gast ${meta.gast} sprechen.`);

  const probe = spawnSync(process.execPath, [join(WERKSTATT, 'werkzeuge', 'erzeugen.mjs'), FOLGE, '--probe'], { encoding: 'utf8' });
  if (probe.status !== 0) fehler.push(`erzeugen.mjs --probe scheitert: ${(probe.stderr || probe.stdout).trim().slice(-400)}`);
  else {
    const w = Number((probe.stdout.match(/(\d+) gesprochene Wörter/) || [])[1]);
    const g = probe.stdout.match(/Größter Teil: (\d+) Zeichen \(Grenze (\d+)\)/);
    if (!w || w < WOERTER[0] || w > WOERTER[1]) fehler.push(`${w || '?'} gesprochene Wörter – gewünscht ${WOERTER[0]}–${WOERTER[1]} (≈ 15–20 Minuten).`);
    if (g && Number(g[1]) > Number(g[2])) fehler.push(`Ein Teil hat ${g[1]} Zeichen (Grenze ${g[2]}) – Abschnitt teilen.`);
    console.log(probe.stdout.trim().split('\n').slice(0, 4).join('\n'));
  }
}

hinweise.forEach((h) => console.log(`Hinweis: ${h}`));
if (fehler.length) {
  console.error(`\n${fehler.length} Prüffehler – bitte korrigieren und denselben Befehl wiederholen:\n- ${[...new Set(fehler)].slice(0, 40).join('\n- ')}`);
  process.exit(2);
}
console.log(`\nFolge ${meta.nummer} „${meta.titel}“ ist in Ordnung.`);
if (args.includes('--probe')) process.exit(0);

// ---------- Hochladen: nur dieser Ordner ----------
const git = (a, still = false) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: still ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'] });
const versuch = (a) => { try { git(a); return true; } catch { return false; } };
const identitaet = (() => { try { return git(['config', 'user.email'], true).trim(); } catch { return ''; } })()
  ? [] : ['-c', 'user.name=Boniblatt-Podcast', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];
git(['add', '--', PFAD]);
const geaendert = (() => { try { git(['diff', '--cached', '--quiet', '--', PFAD], true); return false; } catch { return true; } })();
if (!geaendert) { console.log('Nichts Neues hochzuladen – der Ordner ist schon so im Repository.'); process.exit(0); }
git([...identitaet, 'commit', '-q', '-m', `Podcast: Skript Folge ${meta.nummer} – ${meta.titel}`, '--', PFAD]);
for (let n = 1; n <= 3; n++) {
  if (versuch(['push', '-q', 'origin', 'HEAD:main'])) {
    console.log(`Skript auf main. Die Action „Podcast produzieren“ nimmt jetzt auf und veröffentlicht die Folge (etwa 15 Minuten).`);
    process.exit(0);
  }
  console.log(`Push auf main abgelehnt (Versuch ${n}) – hole den neuen Stand und versuche es erneut.`);
  if (!versuch(['pull', '-q', '--rebase', 'origin', 'main'])) { versuch(['rebase', '--abort']); break; }
}
const zweig = `claude/podcast-${meta.datum}`;
if (versuch(['push', '-q', '-f', 'origin', `HEAD:${zweig}`])) {
  console.log(`Push auf main nicht möglich – das Skript liegt auf ${zweig}; „Ausgabe übernehmen“ führt es nach main und startet die Produktion.`);
  process.exit(0);
}
console.error('Hochladen fehlgeschlagen: weder main noch der Ausweich-Branch ließen sich pushen.');
process.exit(3);
