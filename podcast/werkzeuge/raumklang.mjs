// Raumklang einer Stimme grob messen: Wie schnell klingt sie nach Wortenden ab (Nachhall), und wie laut ist die Stille?
// Trocken und nah aufgenommen wie Jonas: Abklingen um 20 dB in etwa 60–100 ms, Stille weit unter der Sprache.
// Raumig („klingt wie in einem anderen Raum“): Abklingen ab etwa 150 ms. Beispiel: Yvonne, für Leonie verworfen, 190 ms.
// Am aussagekräftigsten ist eine Einzelprobe (Text-to-Speech, ein Sprecher) mit demselben Text wie die Vergleichsstimme.
// Aufruf: node podcast/werkzeuge/raumklang.mjs <datei.mp3> [weitere …]
import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

const SR = 16000, F = 160; // 10-ms-Rahmen
function pegel(datei) {
  const b = spawnSync('ffmpeg', ['-v', 'error', '-i', datei, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 27 }).stdout;
  const n = Math.floor(b.length / 2 / F), L = new Float64Array(n);
  for (let r = 0; r < n; r++) { let e = 0; for (let i = 0; i < F; i++) { const v = b.readInt16LE((r * F + i) * 2) / 32768; e += v * v; } L[r] = 10 * Math.log10(e / F + 1e-12); }
  return L;
}
const quantil = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

if (process.argv.length < 3) { console.error('Aufruf: node podcast/werkzeuge/raumklang.mjs <datei.mp3> [weitere …]'); process.exit(1); }
for (const datei of process.argv.slice(2)) {
  const L = pegel(datei);
  const sprache = quantil(L, 0.9);           // typischer Sprachpegel
  const stille = quantil(L, 0.05);           // Grundrauschen in Pausen
  // Abklingzeiten: von einem Rahmen nahe Sprachpegel (≥ sprache − 8 dB), der in eine Pause übergeht, bis 20 dB darunter
  const zeiten = [];
  for (let i = 1; i < L.length - 40; i++) {
    if (L[i] < sprache - 8 || L[i + 1] >= L[i]) continue;
    // nur echte Übergänge in Stille: innerhalb von 0,4 s fällt der Pegel unter sprache − 30 dB
    let j = i + 1; while (j < Math.min(L.length, i + 40) && L[j] > L[i] - 20) j++;
    let k = j; while (k < Math.min(L.length, i + 40) && L[k] > sprache - 30) k++;
    if (j < i + 40 && k < i + 40 && L.slice(i + 1, j).every((x, m, a) => m === 0 || x <= a[m - 1] + 2)) { zeiten.push((j - i) * 10); i = k; }
  }
  const abkl = zeiten.length ? quantil(zeiten, 0.5) : NaN;
  console.log(`${basename(datei).padEnd(52)} Abklingen 20 dB: ${String(abkl).padStart(4)} ms (n=${zeiten.length})  ·  Stille ${(stille - sprache).toFixed(1)} dB unter Sprache`);
}
