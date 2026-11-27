#!/usr/bin/env node
// Baut das Intro „Morgen über Mainz“ in docs/index.html ein: Papierlagen-Szene (Hügel, Stadt, Ufer, Rhein) hinter den
// Logo-Teilen aus docs/bilder/intro/*.svg (Kirche, Boniturm mit Fenstern, Zeitung links/rechts – gleiche 128×128-Fläche wie die Sonne).
// Aufbau läuft von selbst (rund 3 s); der Weggang ist an das Scrollen gekoppelt (Bühne bleibt stehen, Ausgabe schiebt
// sich darüber, Logo dockt in der Kopfzeile an). Wiederholbar: ersetzt die markierten Blöcke INTRO-START … INTRO-ENDE.
//   node werkzeuge/intro-einbauen.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { FERIEN, TERMINE, festeFuer, FEST_CSS, FEST_HIMMEL, FEST_VORN, FEST_STADT, FEST_UFER, FEST_WASSER, FEST_BUEHNE } from "./intro-feste.mjs";
import { BONI_SVG, BONI_CSS, boniSzene } from "./intro-boni.mjs";

const DOCS = "docs", ZIEL = "docs";
// Fassung der Fundstücke (docs/intro-funde.js aus werkzeuge/intro-funde.mjs): hängt als ?v=… an der Adresse, damit nach
// einer Änderung niemand die alte Datei aus dem Zwischenspeicher bekommt.
const FUNDE_V = existsSync(`${DOCS}/intro-funde.js`) ? createHash("sha1").update(readFileSync(`${DOCS}/intro-funde.js`)).digest("hex").slice(0, 8) : "";
const teil = n => {
  const svg = readFileSync(`${DOCS}/bilder/intro/${n}.svg`, "utf8");
  return [...svg.matchAll(/<path [^>]*\/>/g)].map(m => m[0].replace(/ fill="[^"]*"/, "")).join("");
};
const DOM = teil("02-Kirche"), TURM = teil("05-Boniturm"), LINKS = teil("03-Zeitung-links"), RECHTS = teil("04-Zeitung-rechts");
// Fenster des Boniturms einzeln (11 Reihen zu 3 Scheiben). Sie gehen nicht reihenweise an, sondern einzeln und in gemischter, aber fester
// Reihenfolge – wie in einem Haus am Morgen: erst zwei, drei Lichter mit Abstand, dann immer mehr, zum Schluss ein paar Nachzügler. --v ist der Zeitpunkt,
// --f der Ton: Alle Fenster sind am Ende an, aber nicht gleich hell (helles Warmweiß, Beige, gedämpftes Beige).
const FENSTER = (() => {
  const pfade = [...readFileSync(`${DOCS}/bilder/intro/06-Fenster.svg`, "utf8").matchAll(/<path [^>]*\/>/g)].map(m => m[0].replace(/ fill="[^"]*"/, ""));
  let s = 20261122; const z = () => (s = s * 16807 % 2147483647) / 2147483647;
  const folge = pfade.map((_, i) => i); for (let i = folge.length - 1; i > 0; i--) { const j = Math.floor(z() * (i + 1)); [folge[i], folge[j]] = [folge[j], folge[i]]; }
  const wann = []; let ms = 0;
  folge.forEach((f, k) => { wann[f] = Math.round(ms); ms += k < 3 ? 210 + z() * 90 : k >= folge.length - 4 ? 240 + z() * 200 : 34 + z() * 62; });
  const ton = pfade.map(() => { const w = z(); return w < .38 ? "#fffaf0" : w < .8 ? "#f1e6d0" : "#dccdb2"; });
  return pfade.map((pfad, i) => pfad.replace("<path ", `<path style="--v:${wann[i]}ms;--f:${ton[i]}" `)).join("");
})();

// ---------- Szene (Einheiten wie im Logo: 128 = Logobreite; Bandmitte = 640; H = Horizont) ----------
const B = 1280, H = 60;
const f = n => +n.toFixed(1);
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const kreis = (cx, cy, rx, ry = rx) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

// Gebäude: Umriss, dazu Dächer (etwas dunkler), Kuppeln (Patina), Fenster (heller) und einzelne erleuchtete Fenster.
// Feinheiten obendrauf: Schattenseite (rechts), Traufen und Gesimse als feine Linien, Schornsteine, Türen, Uhren und Kreuze
// an den Kirchtürmen, an den Kuppeln Rippen, Glanz, eine richtige Laterne mit Haube und Kreuz und Ecktürmchen.
function bauten(teile, r) {
  const r2 = zufall(4711);                 // eigene Zufallsfolge für die Feinheiten – die Fenster bleiben, wo sie waren
  let x = 0, umriss = `M0 ${H}`, dach = "", patina = "", fenster = "", licht = "", schatten = "", linie = "", rippe = "", glanz = "", tuer = "", wand = "";
  for (const [typ, w, h = 0, e = 0] of teile) {
    const y = H - h, x2 = x + w, xm = x + w / 2, haus = "hgs".includes(typ) && w >= 6 && w < 40 && h >= 6;
    umriss += `V${f(y)}`;
    if (typ === "g") {                                                   // Giebel / Turmspitze
      const p = `L${f(xm)} ${f(y - e)}L${f(x2)} ${f(y)}`; umriss += p; if (w > 3) dach += `M${f(x)} ${f(y)}${p}Z`;
      if (w > 3) { schatten += `M${f(xm)} ${f(y - e)}L${f(x2)} ${f(y)}H${f(xm)}Z`; linie += `M${f(x - .2)} ${f(y)}H${f(x2 + .2)}`; }
      else linie += `M${f(xm)} ${f(y - e)}v-1.3M${f(xm - .4)} ${f(y - e - .85)}h.8`;                       // schlanke Spitze: Kreuz
      if (haus && w >= 8 && r2() < .6) { const cx = x + w * (.66 + r2() * .1), cy = y - e * (1 - Math.abs((cx - x) / w - .5) * 2); dach += `M${f(cx - .45)} ${f(cy + .5)}v-1.9h.9v1.9Z`; }
    } else if (typ === "s") {                                            // Walmdach
      const p = `L${f(x + w * .22)} ${f(y - e)}H${f(x + w * .78)}L${f(x2)} ${f(y)}`; umriss += p; dach += `M${f(x)} ${f(y)}${p}Z`;
      schatten += `M${f(x + w * .62)} ${f(y - e)}H${f(x + w * .78)}L${f(x2)} ${f(y)}H${f(x + w * .62)}Z`; linie += `M${f(x - .2)} ${f(y)}H${f(x2 + .2)}`;
      if (haus && r2() < .7) { const cx = x + w * (.3 + r2() * .4); dach += `M${f(cx - .45)} ${f(y - e + .3)}v-1.7h.9v1.7Z`; }
      if (haus && w >= 10) { const gx = x + w * .5; fenster += `M${f(gx - .5)} ${f(y - e * .28)}h1v${f(e * .22)}h-1Z`; linie += `M${f(gx - .8)} ${f(y - e * .3)}L${f(gx)} ${f(y - e * .62)}L${f(gx + .8)} ${f(y - e * .3)}`; }
    } else if (typ === "T") {                                            // Turm mit Helm, Uhr, Schallfenster und Kreuz
      umriss += `H${f(x + w * .2)}V${f(y - e * .28)}L${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}V${f(y)}H${f(x2)}`;
      dach += `M${f(x + w * .2)} ${f(y - e * .28)}L${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}Z`;
      schatten += `M${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}H${f(xm)}Z` + `M${f(xm + w * .12)} ${f(y)}H${f(x2)}V${H}H${f(xm + w * .12)}Z`;
      fenster += `M${f(xm - .55)} ${f(y + 5)}v-1.6a.55 .55 0 0 1 1.1 0v1.6Z` + kreis(xm, y + 1.5, .78);
      linie += `M${f(xm)} ${f(y + 1.5)}v-.5M${f(xm)} ${f(y + 1.5)}h.36` + `M${f(xm)} ${f(y - e)}v-1.5M${f(xm - .45)} ${f(y - e - 1)}h.9` + `M${f(x - .15)} ${f(y)}H${f(x2 + .15)}`;
      if (h > 14) fenster += `M${f(xm - .45)} ${f(y + 8.6)}v-1.3a.45 .45 0 0 1 .9 0v1.3Z`;
    } else if (typ === "k") {                                            // Kuppel auf einem Tambour, mit Laterne, Haube und Kreuz
      const lb = w * .065, lu = y - e, lo = y - e * 1.22;                // Laterne: halbe Breite, Unterkante, Oberkante des Schafts
      const p = `C${f(x)} ${f(y - e * .9)} ${f(xm - w * .14)} ${f(lu)} ${f(xm - lb)} ${f(lu)}V${f(lo)}Q${f(xm)} ${f(y - e * 1.48)} ${f(xm + lb)} ${f(lo)}V${f(lu)}C${f(xm + w * .14)} ${f(lu)} ${f(x2)} ${f(y - e * .9)} ${f(x2)} ${f(y)}`;
      umriss += p; patina += `M${f(x)} ${f(y)}${p}Z`;
      for (let i = 0; i < 3; i++) fenster += `M${f(x + w * (.22 + i * .28) - .5)} ${f(y + 3.6)}v-1.7a.5 .5 0 0 1 1 0v1.7Z`;
      for (const k of [-.36, -.19, 0, .19, .36]) rippe += `M${f(xm + k * w)} ${f(y - (k ? .1 : 0))}Q${f(xm + k * w * 1.04)} ${f(y - e * (1 - Math.abs(k) * .62))} ${f(xm + k * w * .16)} ${f(lu + .15)}`;
      glanz += `M${f(x + w * .09)} ${f(y - e * .3)}C${f(x + w * .1)} ${f(y - e * .78)} ${f(xm - w * .2)} ${f(y - e * .95)} ${f(xm - w * .13)} ${f(y - e * .97)}C${f(xm - w * .24)} ${f(y - e * .8)} ${f(x + w * .17)} ${f(y - e * .62)} ${f(x + w * .16)} ${f(y - e * .3)}Z`;
      schatten += `M${f(xm + w * .2)} ${f(y)}H${f(x2)}V${H}H${f(xm + w * .2)}Z`;
      linie += `M${f(x - .35)} ${f(y)}H${f(x2 + .35)}M${f(x - .15)} ${f(y + 1)}H${f(x2 + .15)}` + `M${f(xm - lb - .25)} ${f(lu)}h${f(lb * 2 + .5)}` + `M${f(xm)} ${f(y - e * 1.35)}v-1.6M${f(xm - .5)} ${f(y - e * 1.35 - 1.05)}h1`;
      fenster += `M${f(xm - lb * .62)} ${f(lu - .45)}v${f(-(lu - lo) * .5)}a${f(lb * .23)} ${f(lb * .23)} 0 0 1 ${f(lb * .46)} 0v${f((lu - lo) * .5)}Z` + `M${f(xm + lb * .16)} ${f(lu - .45)}v${f(-(lu - lo) * .5)}a${f(lb * .23)} ${f(lb * .23)} 0 0 1 ${f(lb * .46)} 0v${f((lu - lo) * .5)}Z`;
      if (w >= 16) for (const tx of [x - 2.3, x2 + .1]) {                 // Ecktürmchen neben der großen Kuppel
        wand += `M${f(tx)} ${f(y + 3.2)}V${f(y - e * .3)}h2.2V${f(y + 3.2)}Z`; patina += `M${f(tx - .25)} ${f(y - e * .3)}Q${f(tx + 1.1)} ${f(y - e * .56)} ${f(tx + 2.45)} ${f(y - e * .3)}Z`;
        fenster += `M${f(tx + .75)} ${f(y - e * .06)}v-1.2a.35 .35 0 0 1 .7 0v1.2Z`; linie += `M${f(tx + 1.1)} ${f(y - e * .43)}v-1`;
      }
    } else umriss += `H${f(x2)}`;
    if (haus) {                                                          // Fensterreihen, Schattenseite, Tür
      const sp = Math.max(1, Math.floor((w - 1.6) / 2.3)), ze = Math.max(1, Math.floor((h - 2.2) / 2.7)), ab = (w - sp * .9) / (sp + 1);
      for (let i = 0; i < sp; i++) for (let j = 0; j < ze; j++) {
        const z = r(); if (z < .2) continue;
        const d = `M${f(x + ab + i * (.9 + ab))} ${f(y + 1.5 + j * 2.7)}h.9v1.3h-.9Z`;
        if (z > .93) licht += d; else fenster += d;
      }
      schatten += `M${f(x + w * .7)} ${f(y)}H${f(x2)}V${H}H${f(x + w * .7)}Z`;
      if (typ === "h") linie += `M${f(x - .15)} ${f(y)}H${f(x2 + .15)}`;                                   // Flachdach: Attika
      if (w >= 7 && r2() < .7) { const tx = x + ab + Math.floor(r2() * sp) * (.9 + ab) + .45; tuer += `M${f(tx - .55)} ${H}v-1.7a.55 .55 0 0 1 1.1 0v1.7Z`; }
    }
    x = x2;
  }
  return { umriss: umriss + `V${H}Z` + wand, dach, patina, fenster, licht, schatten, linie, rippe, glanz, tuer };
}

function stadt({ seed, hMin, hMax, wMin, wMax, marken }) {
  const r = zufall(seed), teile = [], m = [...marken].sort((a, b) => a.x - b.x);
  let x = 0;
  while (x < B) {
    if (m.length && x >= m[0].x) { for (const t of m.shift().teile) { teile.push(t); x += t[1]; } continue; }
    let w = wMin + r() * (wMax - wMin); const h = hMin + r() * (hMax - hMin), z = r();
    if (m.length && x + w > m[0].x) w = Math.max(1, m[0].x - x);
    teile.push(z < .34 ? ["h", w, h] : z < .74 ? ["g", w, h, w * (.26 + r() * .2)] : z < .92 ? ["s", w, h, w * .22] : ["h", w * .6, hMin * .6]);
    x += teile.at(-1)[1];
  }
  return bauten(teile, r);
}

// Hügel in zwei Lagen; auf der vorderen Kuppe ein paar Baumtupfen
const huegel = (y, tupfen) => {
  let d = `M0 ${H}V${f(y(0))}`;
  for (let x = 20; x <= B; x += 20) d += `Q${x - 10} ${f(y(x - 10) - .6)} ${x} ${f(y(x))}`;
  const t = ["", ""];
  if (tupfen) { const r = zufall(3); let i = 0; for (let x = 8; x < B; x += 5 + r() * 16) { const g = .7 + r() * .9; t[i++ % 2] += kreis(x, y(x) - g * .3, g, g * .8); } }
  return { d: d + `V${H}Z`, t };
};
const HUEGEL_FERN = huegel(x => H - (15 + 6 * Math.sin(x / 120 + 1.4) + 4 * Math.sin(x / 53) + 2 * Math.sin(x / 23 + 2)));
const HUEGEL_NAH = huegel(x => H - (9 + 6 * Math.sin(x / 95) + 4 * Math.sin(x / 41 + 1) + 3 * Math.sin(x / 170 + 2)), true);

const FERN = stadt({ seed: 7, hMin: 3, hMax: 8, wMin: 6, wMax: 13, marken: [
  { x: 150, teile: [["h", 7, 18]] }, { x: 300, teile: [["g", 1.8, 26, 8]] },
  { x: 498, teile: [["h", 7, 19], ["h", 3, 6], ["h", 6, 23]] },
  { x: 716, teile: [["h", 2, 27], ["h", 4, 5], ["h", 2.4, 23]] },
  { x: 770, teile: [["h", 8, 17]] }, { x: 960, teile: [["h", 6, 21], ["h", 3, 5], ["h", 7, 16]] }, { x: 1120, teile: [["g", 1.8, 24, 8]] },
] });

const STADT = stadt({ seed: 21, hMin: 6, hMax: 12, wMin: 7, wMax: 14, marken: [
  { x: 120, teile: [["g", 5, 16, 12]] }, { x: 290, teile: [["T", 6, 15, 10], ["g", 13, 10, 4]] },
  { x: 440, teile: [["T", 6, 16, 9], ["g", 12, 11, 4], ["T", 6, 16, 9]] },
  { x: 500, teile: [["g", 10, 9, 3], ["h", 8, 12], ["s", 12, 8, 3], ["h", 6, 10], ["h", 5, 12], ["k", 18, 15, 13], ["h", 5, 12], ["g", 9, 8, 3], ["s", 11, 10, 3], ["h", 8, 7],
    ["h", 98, 6], ["g", 9, 9, 3], ["T", 7, 21, 12], ["g", 15, 13, 5], ["h", 7, 8], ["s", 12, 10, 3], ["g", 8, 12, 4], ["h", 10, 7], ["T", 5, 15, 9], ["g", 11, 9, 4]] },
  { x: 880, teile: [["k", 14, 10, 9]] }, { x: 1010, teile: [["g", 5, 17, 13]] }, { x: 1150, teile: [["T", 6, 14, 9]] },
] });

// Uferpromenade: Laubbäume (Krone aus drei Kugeln mit hellem Fleck), Pappeln, Büsche, Laternen, Wiese und Kaimauer.
// Für die Jahreszeiten liegen die Kronen in drei Farbgruppen (a, b, c – c blüht im Frühling als Kirschbaum), dazu
// kahle Äste für den Winter und Blumen für den Frühling. Die Zufallsfolge bleibt wie bisher, damit die Bäume stehen bleiben.
const UFER = (() => {
  const r = zufall(5), rb = zufall(8), fuss = H - 1.6;
  const k = { a: "", b: "", c: "", hell: "", chell: "", busch: "", buschhell: "", stamm: "", kahl: "", lampe: "", blume1: "", blume2: "" };
  const ast = (x, y, dx, dy) => `M${f(x)} ${f(y)}l${f(dx)} ${f(dy)}`;
  for (let x = 5; x < B; x += 6.5 + r() * 8.5) {
    const art = r(), g = 2.1 + r() * 1.7, z = r(), ton = z < .42 ? "b" : z > .76 ? "c" : "a";
    if (art < .17) {                                                     // Pappel
      const ry = g * 1.95, cy = fuss - 1 - ry, t2 = ton === "c" ? "a" : ton;
      k.stamm += `M${f(x - .3)} ${fuss}V${f(cy)}h.6V${fuss}Z`; k[t2] += kreis(x, cy, g * .6, ry); k.hell += kreis(x - g * .16, cy - ry * .18, g * .28, ry * .62);
      k.kahl += `M${f(x)} ${f(cy)}V${f(cy - ry * .82)}`;
      for (let i = 1; i <= 5; i++) k.kahl += ast(x, fuss - 1 - i * ry * .33, (i % 2 ? -1 : 1) * g * .34, -ry * .3);
    } else if (art < .3) {                                               // Busch
      k.busch += kreis(x, fuss - g * .5, g * .95, g * .62) + kreis(x + g * .85, fuss - g * .36, g * .62, g * .45); k.buschhell += kreis(x - g * .25, fuss - g * .72, g * .4, g * .26);
    } else {                                                             // Laubbaum
      const cy = fuss - 2.3 - g;
      k.stamm += `M${f(x - .34)} ${fuss}V${f(cy)}h.68V${fuss}ZM${f(x)} ${f(cy + g + 1.1)}l${f(g * .5)} ${f(-g * .5)}`;
      k[ton] += kreis(x, cy, g) + kreis(x - g * .64, cy + g * .34, g * .62) + kreis(x + g * .68, cy + g * .3, g * .58);
      k[ton === "c" ? "chell" : "hell"] += kreis(x - g * .3, cy - g * .32, g * .46);
      k.kahl += ast(x, cy + g * .95, -g * .8, -g * .95) + ast(x, cy + g * .95, g * .85, -g * .9) + ast(x, cy + g * .35, -g * .52, -g * .85) + ast(x, cy + g * .35, g * .48, -g * .95)
        + ast(x, cy, 0, -g * .9) + ast(x - g * .44, cy + g * .47, -g * .38, -g * .1) + ast(x + g * .46, cy + g * .42, g * .36, -g * .2);
    }
    for (let i = 0; i < 3; i++) if (rb() < .55) k[rb() < .5 ? "blume1" : "blume2"] += kreis(x - 3 + rb() * 6, fuss - .75, .46);
  }
  for (let x = 14; x < B; x += 27) k.lampe += `M${x} ${fuss}v-4.4h1.3v.5h-.8V${fuss}Z`;
  return k;
})();

// Rhein: feine Wellenstriche in zwei Tönen (um das Logo herum frei gelassen), Spiegelung am Ufer, ein kleines Ausflugsschiff
const WASSER = (() => {
  const r = zufall(11); let blau = "", weiss = "";
  for (let i = 0; i < 110; i++) {
    const y = 2.4 + r() * r() * 44, l = 8 + r() * 46 * (.45 + y / 44), x = r() * B, hell = r() < .4;
    if (x + l > 574 && x < 706) continue;
    if (hell) weiss += `M${f(x)} ${f(y)}h${f(l)}`; else blau += `M${f(x)} ${f(y)}h${f(l)}`;
  }
  return { blau, weiss };
})();
const WASSERDINGE = (() => {
  const r = zufall(19); let ringe = "", eis = "", laub = "";
  const frei = (x, breit) => x + breit < 572 || x > 708;
  for (let i = 0; i < 16; i++) { const x = 300 + r() * 680, y = 4 + r() * 30; if (frei(x - 4, 8)) ringe += `<ellipse class="w-ring" cx="${f(x)}" cy="${f(y)}" rx="${f(2.2 + y * .06)}" ry="${f(.55 + y * .015)}" style="animation-delay:${f(-r() * 3.6)}s"/>`; }
  for (let i = 0; i < 30; i++) { const x = 300 + r() * 680, y = 3 + r() * r() * 34, b = 3 + r() * 7; if (frei(x, b)) eis += `M${f(x)} ${f(y)}h${f(b)}a.55 .55 0 0 1 0 1.1h${f(-b)}a.55 .55 0 0 1 0-1.1Z`; }
  for (let i = 0; i < 34; i++) { const x = 300 + r() * 680, y = 3 + r() * r() * 30; if (frei(x, 2)) laub += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(.7 + r() * .5)}" ry=".32" fill="${["#d98a3d", "#c9642f", "#e0b04a", "#b5532e"][i % 4]}" transform="rotate(${Math.round(r() * 30 - 15)} ${f(x)} ${f(y)})"/>`; }
  return `<g class="w-ringe">${ringe}</g><path class="w-eis" d="${eis}"/><g class="w-laub">${laub}</g>`;
})();
// Schneebank auf der Kaimauer (nur bei Schnee)
const SCHNEEBANK = (() => { const r = zufall(27); let d = `M0 ${H - 1.5}`; for (let x = 0; x < B; ) { const b = 4 + r() * 7; d += `q${f(b / 2)} ${f(-.5 - r() * .9)} ${f(b)} 0`; x += b; } return d + `V${H - 1.35}H0Z`; })();
const SCHIFF = `<g class="i-schiff"><path class="s-spiegel" d="M725.5 5.3h14M728 6.2h8"/><path class="s-rumpf" d="M723.6 2.7h18.2l-1.9 2h-14.4Z"/><path class="s-aufbau" d="M727 2.7v-1.5h10.4l.9 1.5ZM729.6 1.2v-.9h4.6v.9Z"/><path class="s-linie" d="M724.6 3.5h16.4"/><path class="s-fenster" d="M728.2 1.7h1v.6h-1ZM730.4 1.7h1v.6h-1ZM732.6 1.7h1v.6h-1ZM734.8 1.7h1v.6h-1Z"/></g>`;

// Wolken: drei gezeichnete Formen (Haufenwolke, lange Bank, kleiner Bausch) mit weichem Verlauf nach unten und einer
// helleren Kuppe; als <symbol> einmal abgelegt und je Wolke nur verwiesen.
const WOLKENFORM = [
  [52, "M8 23C4.2 23 2 20.6 2.4 18C2.8 15.4 5.2 14 7.8 14.5C7.4 10.6 10.4 7.6 14.2 8.2C15.6 4.2 19.8 1.6 24.4 2.4C28.4 3.1 31.4 6 32.2 9.6C34.4 7.8 37.8 7.4 40.4 8.8C43.2 10.3 44.6 13.2 44.2 16C47 15.4 49.8 17 50.2 19.6C50.5 21.6 49 23 47 23Z"],
  [59, "M7 22C3.6 22 2 19.8 2.6 17.6C3.2 15.4 5.6 14.4 7.8 15C8.4 11.8 11.6 9.8 14.8 10.6C16.6 7.4 20.6 5.8 24.2 6.8C26.4 4 30.6 2.8 34.2 4.2C37 5.3 38.8 7.6 39.2 10.2C42 8.8 45.6 9.6 47.4 12C48.6 13.6 48.8 15.4 48.4 17C51.4 16.2 54.6 17.4 56 19.6C57 21.2 55.6 22 54 22Z"],
  [36, "M6 20C3.4 20 2 18.2 2.4 16.4C2.8 14.6 4.6 13.6 6.4 14C6.6 10.6 9.6 8.2 13 8.8C14.8 5.6 18.8 4.2 22.2 5.6C25 6.7 26.8 9.2 27 12C29.4 11.2 32 12.4 32.8 14.6C33.6 16.8 32.4 20 29.6 20Z"],
];
const WOLKEN_DEFS = `<svg class="i-defs" width="0" height="0" aria-hidden="true"><defs><linearGradient id="i-wg" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" style="stop-color:var(--wo,#fffdf9)"/><stop offset="1" style="stop-color:var(--wos,#ece5e1)"/></linearGradient></defs>`
  + WOLKENFORM.map(([, d], i) => `<symbol id="i-w${i}"><path fill="url(#i-wg)" d="${d}"/><path fill="#fff" opacity=".55" transform="translate(${i === 2 ? 3.4 : 5.2} 1.4) scale(.78)" d="${d}"/></symbol>`).join("") + `</svg>`;
const WOLKE = i => `<svg viewBox="0 0 ${WOLKENFORM[i][0]} 25"><use href="#i-w${i}"/></svg>`;
// Wolken: Lage in % der Logofläche, Breite als Vielfaches der Logobreite, Weg beim Scrollen; „mehr“ = nur bei bedecktem Himmel
const WOLKEN = [
  { l: -62, t: -50, g: .5, fx: "-34vw", v: 0 }, { l: 104, t: -36, g: .38, fx: "30vw", v: .25 },
  { l: 196, t: -14, g: .46, fx: "42vw", v: .1 }, { l: -176, t: -8, g: .56, fx: "-46vw", v: .3 }, { l: 20, t: -74, g: .3, fx: "-12vw", v: .4 },
  { l: -28, t: -62, g: .52, fx: "-26vw", v: .15, mehr: 1 }, { l: 62, t: -88, g: .6, fx: "20vw", v: .05, mehr: 1 }, { l: 128, t: -62, g: .5, fx: "36vw", v: .35, mehr: 1 },
  { l: -118, t: -34, g: .62, fx: "-40vw", v: .2, mehr: 1 }, { l: 252, t: -46, g: .62, fx: "48vw", v: .1, mehr: 1 }, { l: -252, t: -52, g: .58, fx: "-52vw", v: .3, mehr: 1 },
  { l: -74, t: -96, g: .46, fx: "-18vw", v: .45, mehr: 1 },
];

// Niederschlag: kleine SVG-Kacheln, die als Hintergrund gekachelt und nur per transform verschoben werden (läuft auf der
// Grafikkarte). Die Bewegung ist genau ein Kachelschritt, deshalb läuft sie nahtlos.
const kachel = (w, h, innen) => `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${innen}</svg>`.replace(/[%#<>]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())}")`;
// Regen: jeder Tropfen ist ein feiner Strich mit kräftigerem unteren Ende
const regen = (w, h, n, seed, lang, dicke) => {
  const r = zufall(seed); let t = "";
  for (let i = 0; i < n; i++) {
    const l = lang * (.55 + r() * .7), x = 8 + r() * (w - 12), y = 2 + r() * (h - lang * 1.3 - 4), dx = -l * w / h, o = .16 + r() * .22;
    t += `<path d='M${f(x)} ${f(y)}l${f(dx)} ${f(l)}' stroke='#6d8498' stroke-width='${dicke}' stroke-linecap='round' opacity='${o.toFixed(2)}'/>`
      + `<path d='M${f(x + dx * .55)} ${f(y + l * .55)}l${f(dx * .45)} ${f(l * .45)}' stroke='#5a7389' stroke-width='${f(dicke * 1.15)}' stroke-linecap='round' opacity='${(o + .14).toFixed(2)}'/>`;
  }
  return kachel(w, h, t);
};
// Schnee: weiche Flocken – weißer Kern, zarter Hof, ein Hauch Kontur (sonst verschwinden sie vor hellem Papier)
const schnee = (w, h, n, seed, gr, kontur = .5) => {
  const r = zufall(seed); let t = "";
  for (let i = 0; i < n; i++) {
    const g = gr * (.5 + r()), x = f(6 + r() * (w - 12)), y = f(6 + r() * (h - 12));
    t += `<circle cx='${x}' cy='${y}' r='${f(g * 1.9)}' fill='#fff' opacity='.28'/><circle cx='${x}' cy='${y}' r='${f(g)}' fill='#fff' stroke='#9db0c2' stroke-width='${kontur}' opacity='${(.85 + r() * .15).toFixed(2)}'/>`;
  }
  return kachel(w, h, t);
};
const blaetter = (w, h, n, seed, farben, form, mass = 1) => {
  const r = zufall(seed); let t = "";
  for (let i = 0; i < n; i++) t += `<path d='${form}' transform='translate(${f(14 + r() * (w - 28))} ${f(14 + r() * (h - 28))}) rotate(${Math.round(r() * 360)}) scale(${(mass * (.7 + r() * .7)).toFixed(2)})' fill='${farben[Math.floor(r() * farben.length)]}' opacity='${(.8 + r() * .2).toFixed(2)}'/>`;
  return kachel(w, h, t);
};
const LAUB = ["#d98a3d", "#c9642f", "#e0b04a", "#b5532e", "#cf7a2c"];
// Blatt mit Stiel und Spitze, Blütenblatt als Tropfen
const BLATT = "M0 0C1.4 -3.4 5.4 -4.4 9 -2.8C8.4 .8 5.6 3.6 1.8 3.4L-1.6 5L.2 2.4C-.4 1.6 -.4 .8 0 0Z", BLUETE = "M0 0q1.6 -2.6 4.6 0q-3 2.6 -4.6 0Z";
const KACHELN = {
  regen1: regen(170, 680, 9, 2, 22, 1), regen2: regen(130, 520, 8, 9, 15, .75), regen3: regen(100, 400, 8, 14, 10, .55),
  schnee1: schnee(240, 480, 12, 4, 2.7), schnee2: schnee(170, 340, 14, 6, 1.7), schnee3: schnee(120, 240, 22, 8, .95, .3),
  laub1: blaetter(280, 560, 4, 12, LAUB, BLATT), laub2: blaetter(210, 420, 2, 17, LAUB, BLATT, .8),
  bluete: blaetter(260, 520, 8, 23, ["#f6bfd0", "#fbdde6", "#f2a8bf"], BLUETE, 1.32),
};

// Vögel: klein und dezent. Sie tauchen am Rand auf und fliegen vom Betrachter weg in die Sonne – das Ziel (l, t in % der
// Logofläche) liegt auf der roten Fläche neben den Domtürmen; unterwegs werden sie kleiner und verschwinden.
// x0/y0 = Startversatz in Logobreiten, d = Flugdauer, v = Vorlauf in Sekunden (negativ = schon unterwegs).
const VOEGEL = [
  { l: 11, t: 40, g: .11, x0: -1.25, y0: -.42, d: 13, v: -2, fx: "-40vw", fy: "-24vh" },
  { l: 84, t: 38, g: .095, x0: 1.2, y0: -.5, d: 15, v: -8, fx: "42vw", fy: "-30vh" },
  { l: 20, t: 31, g: .085, x0: -.7, y0: -.78, d: 12, v: -5.5, fx: "-26vw", fy: "-44vh" },
  { l: 78, t: 33, g: .105, x0: 1.45, y0: -.2, d: 16, v: -12.5, fx: "50vw", fy: "-18vh" },
  { l: 38.5, t: 23, g: .075, x0: -.25, y0: -.95, d: 11, v: -9.5, fx: "-8vw", fy: "-50vh" },
  { l: 7, t: 45, g: .09, x0: -1.5, y0: .05, d: 14, v: -.5, fx: "-50vw", fy: "-12vh" },
];

const buchstaben = (wort, ab) => [...wort].map((b, i) => `<i style="--i:${ab + i}">${b}</i>`).join("");

// Jahreszeit (aus dem Datum) × Wetterlage (aus daten/wetter.js): 4 × 3 Varianten, im Winter zusätzlich Schnee = 13.
// Die Jahreszeit färbt Bäume, Wiese und Hügel, die Wetterlage Himmel, Licht, Wolken und Wasser.
const VARIANTEN = `.i-nieder{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:calc(1 - var(--ip,0) * 2.6)}
.i-wieg{position:absolute;inset:0;animation:i-ein 1.4s ease 1s both,i-wiegen 4.6s ease-in-out infinite alternate}
.i-nieder .n{display:none;position:absolute;inset:calc(var(--ky) * -1) calc(var(--kx) * -1 - 12px) 0 calc(var(--kx) * -1 - 12px);background-size:var(--kx) var(--ky);animation:i-fall var(--kd) linear infinite;will-change:transform}
/* Jahreszeiten */
.intro[data-zeit="fruehling"]{--ba:#9bc48a;--bb:#86b77b;--bc:#f0aec2;--bh:#b8d8a8;--bch:#fbd7e1;--bu:#8fbd80;--buh:#b4d6a3;--wi:#a6cc92;--hu1:#dfeadb;--hu2:#cfe3bf;--tu1:#f3c3cf;--tu2:#b6d4a3;--wieg:12px}
.intro[data-zeit="fruehling"] .b-blume{display:block}
.intro[data-zeit="fruehling"]:not([data-wetter="regen"]) .n3{display:block;background-image:${KACHELN.bluete};--kx:260px;--ky:520px;--kr:-1;--kd:13s}
.intro[data-zeit="sommer"]{--ba:#6fae5a;--bb:#5a9c52;--bc:#66a655;--bh:#97c97f;--bch:#97c97f;--bu:#64a258;--buh:#97c97f;--wi:#8fc474;--hu1:#d5e6cf;--hu2:#bcdba6;--tu1:#a1c98b;--tu2:#aed39a;--d2:#b08f7c}
.intro[data-zeit="sommer"] :is(.i-stadt,.i-fern){filter:saturate(1.25)}
.intro[data-zeit="sommer"][data-wetter="sonne"]{--h1:#fbe2cf;--h2:#f8ece0;--h3:#e9f2f4;--h4:#cfe5f5;--wa1:#bfdcf0;--wa2:#dcebf3;--wl:#8fbcd9;--wu:#93b9d2}
.intro[data-zeit="herbst"]{--ba:#dca45c;--bb:#c8773e;--bc:#b5533a;--bh:#efc986;--bch:#d88f6c;--bu:#b98a4e;--buh:#d6ad6c;--wi:#c6b98c;--hu1:#e6e3d6;--hu2:#dcd5b5;--tu1:#d2a55f;--tu2:#c58a55;--wieg:12px}
.intro[data-zeit="herbst"] :is(.b-blume,.w-laub){display:block}.intro[data-zeit="herbst"]{--bl1:#d98a3d;--bl2:#b5532e}
.intro[data-zeit="herbst"] .n3{display:block;background-image:${KACHELN.laub1};--kx:280px;--ky:560px;--kr:-1;--kd:10s}
.intro[data-zeit="herbst"]:not([data-wetter="regen"]) .n4{display:block;background-image:${KACHELN.laub2};--kx:210px;--ky:420px;--kr:-1;--kd:15s;opacity:.8}
.intro[data-zeit="winter"]{--bu:#a59a8e;--buh:#b9afa3;--wi:#d0cfc6;--hu1:#e6e8e6;--hu2:#dadcd5;--tu1:#cbcec6;--tu2:#cfd2ca}
.intro[data-zeit="winter"][data-wetter="sonne"]{--h1:#f9e4da;--h4:#e2eaf1}
.intro[data-zeit="winter"] :is(.b-a,.b-b,.b-c,.b-hell,.b-chell){display:none}.intro[data-zeit="winter"] .b-kahl{display:block}
/* Wetterlagen */
.intro:not([data-wetter="sonne"]) .i-strahlen{display:none}.intro:not([data-wetter="sonne"]) .i-mehr{display:block}
.intro[data-wetter="bewoelkt"]{--wos:#d9dfe6;--h1:#f2e6df;--h2:#edebe8;--h3:#e6e9eb;--h4:#dce2e8;--schein:.42;--wo:#f6f7f8;--wod:.95;--wa1:#d2dde4;--wa2:#e3e8ea;--wl:#a8bcc9}
.intro[data-wetter="regen"]{--wos:#b9c3ce;--h1:#e2e1e2;--h2:#dbdfe3;--h3:#cfd6dd;--h4:#bfc9d4;--schein:.14;--wo:#e3e7eb;--wod:1;--wa1:#c4d0d9;--wa2:#dbe1e5;--wl:#9db0bd;--wu:#9fb0bb}
.intro[data-wetter="regen"] :is(.i-ufer,.i-huegel2){filter:saturate(.8) brightness(.97)}
.intro:is([data-wetter="regen"],[data-wetter="schnee"]) .i-dunst,.intro[data-wetter="regen"] .w-ringe{display:block}
.intro[data-wetter="regen"] .n5{display:block;background-image:${KACHELN.regen3};--kx:100px;--ky:400px;--kr:-1;--kd:1.9s;opacity:.5}
.intro[data-wetter="regen"] .n1{display:block;background-image:${KACHELN.regen1};--kx:170px;--ky:680px;--kr:-1;--kd:1.05s}
.intro[data-wetter="regen"] .n2{display:block;background-image:${KACHELN.regen2};--kx:130px;--ky:520px;--kr:-1;--kd:1.4s;opacity:.7}
.intro[data-wetter="schnee"]{--wos:#c3cdd9;--h1:#e3e6ea;--h2:#d6dde5;--h3:#c5cfdb;--h4:#b3c0d0;--schein:.2;--wo:#eef1f5;--wod:1;--wa1:#c3d0db;--wa2:#dde4e9;--wl:#a2b4c2;--wu:#9fb1bf;--du:rgba(236,240,244,.6);
  --d1:#f1f3f4;--d2:#fbfbfb;--hu1:#f1f3f4;--hu2:#eaedef;--tu1:#dfe3e4;--tu2:#e3e6e7;--bu:#eceef0;--buh:#fafbfb;--wi:#f6f7f8;--ka:#fdfdfd;--wieg:18px}
.intro[data-wetter="schnee"] :is(.b-reif,.b-schnee,.i-flocken),.intro[data-wetter="schnee"] .i-boden .w-eis{display:block}
.intro[data-wetter="schnee"] .n1{display:block;background-image:${KACHELN.schnee1};--kx:240px;--ky:480px;--kd:8s}
.intro[data-wetter="schnee"] .n2{display:block;background-image:${KACHELN.schnee2};--kx:170px;--ky:340px;--kd:12s;opacity:.9}
.intro:is([data-wetter="regen"],[data-wetter="schnee"]) .i-vogel{display:none}`;

const css = `/* INTRO-START – „Morgen über Mainz“ (nur hell; bei jedem Aufruf der Ausgabe) */
.intro{--wh:78px;position:relative;display:grid;grid-template:100%/100%;height:calc(200vh + var(--wh));height:calc(200svh + var(--wh));margin-bottom:-100vh;margin-bottom:-100svh;color:#141414;--weich:cubic-bezier(.16,.84,.24,1);--fahrt:cubic-bezier(.45,.05,.2,1);--L:clamp(210px,56vw,340px)}
.intro[hidden]{display:none}
/* Scroll-Fortschritt (--ip) und seine geglättete Form (--ie): als eigene, NICHT vererbte Eigenschaften angemeldet. Das Skript
   setzt sie nur an den Elementen, deren Regeln sie benutzen – so rechnet der Browser beim Scrollen nicht mehr die Stile der
   ganzen Szene neu (das kostete rund 15 ms je Bild), sondern nur die der wenigen bewegten Lagen. */
@property --ip{syntax:"<number>";inherits:false;initial-value:0}
@property --ie{syntax:"<number>";inherits:false;initial-value:0}
/* Die Ausgabe kommt als Blatt mit Wellenkante von unten über die Szene: zwei Wellen, die gegeneinander laufen (nur transform,
   läuft im Compositor). Die Kante hängt am Ende der ersten Bildschirmhöhe und fährt mit der Seite mit – ganz ohne Skript. */
.i-woge{position:absolute;left:0;right:0;top:calc(100vh - 1px);top:calc(100svh - 1px);height:calc(var(--wh) + 2px);overflow:hidden;z-index:1;pointer-events:none}
.i-woge svg{position:absolute;left:0;bottom:-1px;width:200%;height:78%;fill:#f6f4ef;animation:i-woge 19s linear infinite;will-change:transform}
.i-woge svg:first-child{height:100%;fill:#fff;opacity:.55;animation-duration:31s;animation-direction:reverse}
@keyframes i-woge{to{transform:translateX(-50%)}}
@media (max-width:700px){.intro{--wh:52px}.i-woge svg{width:320%}}
.intro-buehne,.i-traeger{grid-area:1/1;align-self:start;min-width:0}
/* Das Logo liegt in einem eigenen Träger über der Bühne. Er klebt wie die Bühne oben am Fenster und ist genau so hoch,
   dass ihn das Ende des Intros in dem Moment nach oben mitnimmt, in dem der Platz in der Kopfzeile das Logo erreicht:
   Ab da läuft das Logo mit der Seite mit – das macht der Browser selbst, ohne Skript, also ohne Nachhinken. */
.i-traeger{position:sticky;top:0;z-index:2;height:var(--hc,calc(100vh + 260px));overflow:hidden;pointer-events:none}
.i-platz{position:absolute;left:var(--ll,calc(50% - var(--L) / 2));top:var(--lt,0px);width:var(--L);aspect-ratio:1}
.intro ~ :not(script){position:relative;z-index:1}
.intro-buehne{position:sticky;top:0;height:100vh;height:100svh;min-height:520px;overflow:hidden;background:#f6f4ef}
.i-mitte{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vh,22px);padding:0 14px 5vh}
.i-logo{position:relative;width:var(--L);aspect-ratio:1;perspective:900px;flex:none}
.i-welt{position:absolute;inset:0}
.i-vorn{opacity:calc(var(--ip,0) * 3.4)}
.i-welt .i-sonne{opacity:calc((.5 - var(--ip,0)) * 12)}
.i-kante{display:none}
.i-himmel,.i-boden{position:absolute;left:50%;width:300vw;height:160vh;margin-left:-150vw}
.i-himmel{bottom:39.45%;background:linear-gradient(to top,var(--h1,#fbe6d8) 0,var(--h2,#f9ede3) 16vh,var(--h3,#f1f2ef) 40vh,var(--h4,#e9f0f3) 78vh);opacity:calc(1 - var(--ie,0) * .55)}
.i-himmel::after,.i-boden::after{content:"";position:absolute;inset:0;opacity:0;animation:i-aus 1.9s ease-in-out .3s both}
.i-himmel::after{background:linear-gradient(to top,#ecd8d0 0,#dcdbe3 24vh,#c6cedb 78vh)}
.i-boden{top:calc(60.55% - 1px);background:linear-gradient(var(--wa1,#d9e6ed) 0,var(--wa2,#e7eef0) 8vh,#f6f4ef 24vh);translate:0 calc(var(--ie,0) * -27vh);will-change:transform}
.i-boden::after{background:linear-gradient(#c2cddb 0,#d2dae3 12vh,#e2e6ea 44vh)}
.i-boden svg{position:absolute;left:50%;top:0;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);height:auto;overflow:visible;z-index:1}
.i-boden svg>path:not(.w-ufer):not(.w-ufer2):not(.w-eis){animation:i-wasser 9s ease-in-out infinite alternate}
.i-boden svg>path{fill:none;stroke:var(--wl,#b3cad8);stroke-width:.42;stroke-linecap:round}
.i-boden .w-hell{stroke:#fff;stroke-width:.5;opacity:.85}
.i-boden .w-ufer{fill:var(--wu,#aebfc9);stroke:none;opacity:.5}
.i-boden .w-ufer2{fill:var(--wu,#aebfc9);stroke:none;opacity:.22}
.i-schiff{animation:i-schiff 70s ease-in-out infinite alternate}
.i-schiff .s-rumpf{fill:#fdfcf8;stroke:#8f9aa1;stroke-width:.22}
.i-schiff .s-aufbau{fill:#ebe6dc;stroke:#8f9aa1;stroke-width:.2}
.i-schiff .s-linie{stroke:#c8102e;stroke-width:.34;opacity:.75}
.i-schiff .s-fenster{fill:#7f8f99;stroke:none}
.i-schiff .s-spiegel{stroke:#fff;stroke-width:.5;opacity:.8}
.i-licht{position:absolute;left:50%;top:60.55%;width:0;height:0;opacity:calc(var(--schein,1) - var(--ip,0) * 1.5);scale:calc(1 + var(--ie,0) * 1.4)}
.i-schein,.i-strahlen{position:absolute;border-radius:50%;aspect-ratio:1}
.i-schein{width:calc(var(--L) * 4.2);margin:calc(var(--L) * -2.1);background:radial-gradient(closest-side,rgba(226,70,60,.26),rgba(240,140,96,.13) 36%,rgba(246,200,160,0) 72%);animation:i-schein 1.7s var(--weich) .75s both}
.i-strahlen{width:calc(var(--L) * 5.6);margin:calc(var(--L) * -2.8);animation:i-ein 1.4s ease 1.5s both}
.i-strahlen::before,.i-strahlen::after{content:"";position:absolute;inset:0;border-radius:50%;
  -webkit-mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%);mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%)}
.i-strahlen::before{background:repeating-conic-gradient(rgba(203,8,56,0) 0deg,rgba(203,8,56,.05) 2.4deg,rgba(203,8,56,0) 4.8deg,rgba(203,8,56,0) 15deg);animation:i-drehen 140s linear infinite}
.i-strahlen::after{background:repeating-conic-gradient(from 6deg,rgba(244,160,96,0) 0deg,rgba(244,160,96,.06) 4deg,rgba(244,160,96,0) 8deg,rgba(244,160,96,0) 22.5deg);animation:i-drehen 200s linear infinite reverse}
.i-wolke{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--ie,0) * var(--fx)) calc(var(--ie,0) * -8vh);opacity:calc(1 - var(--ip,0) * 1.8)}
.i-mehr{display:none}
.i-defs{position:absolute}
.i-wolke svg{display:block;width:100%;height:auto;opacity:var(--wod,.92);animation:i-wolke 2.2s var(--weich) calc(.5s + var(--v)) both,i-zieh 46s ease-in-out calc(2.8s + var(--v) * 9) infinite alternate}
.i-l{position:absolute;inset:0;transform-origin:0 0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(var(--ds,1))}
.i-l svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
/* Auftakt des Logos – ruhig: Nichts wächst, dreht oder springt. Zeitung, Kirche und Boniturm stehen von Anfang an an ihrem Platz und treten
   nur aus dem Morgendunst hervor (Deckkraft, wenige Pixel Weg). Dahinter geht langsam die Sonne auf, und im Turm geht nach und nach das Licht
   an – jedes Fenster einzeln, kurz ganz hell, dann in seinem eigenen Ton zwischen Warmweiß und Beige. Alles zusammen fährt die Kamera ein kleines Stück heran. */
.i-sonne svg,.i-dom svg,.i-turm svg,.i-fenster svg{transform-origin:50% 60.55%;--z:1.16;animation:i-zoom 3.4s cubic-bezier(.2,.7,.2,1) both}
.i-dom svg,.i-turm svg{fill:#151414}
.i-dom g{transform-box:view-box;animation:i-dom 1.7s cubic-bezier(.22,.61,.36,1) .45s both}
.i-turm g{transform-box:view-box;animation:i-dom 1.7s cubic-bezier(.22,.61,.36,1) .65s both}
.i-turm .i-dunkel{fill:#2f2b2b}
.i-fenster path{fill:var(--f,#f6eedd);animation:i-fenster .9s cubic-bezier(.3,.6,.3,1) calc(1.75s + var(--v)) both}
/* Nur etwa die Hälfte der Fenster leuchtet, der Rest ist dunkelgrau; alle paar Sekunden geht eines an oder aus (docs/blatt/rahmen.js):
   .aus = von Anfang an dunkel, .dunkel = geht gerade aus, .an = geht gerade an */
.i-l.i-fenster path.aus{fill:#57524d;animation:i-ein 1.2s ease 1.3s both}
.i-l.i-fenster path.dunkel{fill:#57524d;animation:none;transition:fill 2.6s ease}
.i-l.i-fenster path.an{animation:i-licht 1.9s ease both}
.i-sonne path{fill:#cf073d;transform-box:view-box;animation:i-sonne 3.4s cubic-bezier(.22,.61,.36,1) .3s both}
.i-zl svg,.i-zr svg{fill:#151414;transform-origin:50% 75%}
.i-zl svg{animation:i-blatt 1.6s cubic-bezier(.22,.61,.36,1) .15s both}
.i-zr svg{animation:i-blatt 1.6s cubic-bezier(.22,.61,.36,1) .28s both}
/* Bis Schriften und Bilder geladen sind, steht alles still (Klasse „wartet“ setzt das Skript) – so beginnt die Bewegung erst, wenn nichts mehr nachlädt */
.intro.wartet *,.intro.wartet *::before,.intro.wartet *::after{animation-play-state:paused!important}
.i-band{position:absolute;left:50%;bottom:39.45%;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);transform-origin:50% 100%;
  translate:0 calc(var(--ie,0) * var(--hub,-26vh));scale:calc(var(--nah,1) * (1 + var(--ie,0) * var(--k) * .12));will-change:transform}
/* Die Lagen steigen langsamer als das Blatt (ferne etwas weniger als nahe): Das Blatt holt die Stadt erst kurz vor dem Ziel ein und deckt sie von unten zu */
.i-huegel{--hub:-22vh}.i-huegel2{--hub:-23.5vh}.i-fern{--hub:-25vh}.i-stadt{--hub:-26vh}.i-ufer{--hub:-27vh}
.intro{--nah:1.1}@media (min-width:700px){.intro{--nah:1.3}}@media (min-width:1000px){.intro{--nah:1.52}}
.i-band svg{display:block;width:100%;height:auto;transform-origin:50% 100%;animation:i-zoom 2.5s var(--fahrt) both,i-steig .95s cubic-bezier(.2,.9,.25,1.04) var(--ab,0s) both}
.i-huegel{--k:.08}.i-huegel svg{fill:var(--hu1,#dfe4dc);--z:1.16;animation:i-zoom 2.5s var(--fahrt) both}
.i-huegel2{--k:.18}.i-huegel2 svg{fill:var(--hu2,#d3dac8);--z:1.3;animation:i-zoom 2.5s var(--fahrt) both}.i-huegel2 .i-tupfen{fill:var(--tu1,#c2cdb6)}.i-huegel2 .t2{fill:var(--tu2,#c2cdb6)}
.i-fern{--k:.4}.i-fern svg{fill:#d3ccc1;--z:1.5;--ab:0s}.i-fern .i-dach{fill:var(--d1,#c7bfb4)}.i-fern .i-fenster{fill:#e1dcd4}.i-fern .i-lichter{fill:#f3e3bd}
.i-stadt{--k:1}.i-stadt svg{fill:#bcb3a6;--z:1.9;--ab:.12s}.i-stadt .i-dach{fill:var(--d2,#a89d90)}.i-stadt .i-patina{fill:#9fb5a7}.i-schatten{fill:#3d3428;opacity:.075}.i-glanz{fill:#fff;opacity:.2}.i-rippe{fill:none;stroke:#6f8c7e;stroke-width:.16;stroke-linecap:round;opacity:.7}.i-linie{fill:none;stroke:#7d7265;stroke-width:.2;stroke-linecap:round;opacity:.6}.i-tuer{fill:#8f8475}.i-fern .i-linie,.i-fern .i-tuer{opacity:.3}.i-fern .i-schatten{opacity:.05}.i-stadt .i-fenster{fill:#d6cfc4}.i-stadt .i-lichter{fill:#f8dfa2}
.i-ufer{--k:2.2}.i-ufer svg{fill:#a8a092;--z:2.5;--ab:.26s}
.i-ufer .b-a{fill:var(--ba,#8da582)}.i-ufer .b-b{fill:var(--bb,#7f9a78)}.i-ufer .b-c{fill:var(--bc,#8da582)}.i-ufer .b-hell{fill:var(--bh,#a8bb9b)}.i-ufer .b-chell{fill:var(--bch,#a8bb9b)}
.i-ufer .b-busch{fill:var(--bu,#86a07c)}.i-ufer .b-buschhell{fill:var(--buh,#a8bb9b)}.i-ufer .b-stamm{fill:#8a7d6e;stroke:#8a7d6e;stroke-width:.3}.i-ufer .b-lampe{fill:#857d70}
.i-ufer .b-kahl{display:none;fill:none;stroke:#7b6f63;stroke-width:.3;stroke-linecap:round}.i-ufer .b-wiese{fill:var(--wi,#a5bb95)}.i-ufer .b-kante{fill:var(--ka,#bcb4a7)}.i-ufer .b-blume{display:none}.i-ufer .bl1{fill:var(--bl1,#fff4c2)}.i-ufer .bl2{fill:var(--bl2,#f3a3ba)}
.i-ufer .b-reif{display:none;fill:none;stroke:#fff;stroke-width:.26;stroke-linecap:round}.i-ufer .b-schnee{display:none;fill:#fdfdfd}
.i-dunst{display:none;position:absolute;left:50%;bottom:39.45%;width:300vw;margin-left:-150vw;height:13vh;background:linear-gradient(to top,var(--du,rgba(215,222,228,.7)),transparent);
  -webkit-mask:linear-gradient(90deg,#000 calc(50% - var(--L) * .56),transparent calc(50% - var(--L) * .47),transparent calc(50% + var(--L) * .47),#000 calc(50% + var(--L) * .56));mask:linear-gradient(90deg,#000 calc(50% - var(--L) * .56),transparent calc(50% - var(--L) * .47),transparent calc(50% + var(--L) * .47),#000 calc(50% + var(--L) * .56))}
.i-flocken{display:none;position:absolute;left:50%;bottom:39.45%;width:140vw;margin-left:-70vw;height:calc(78vh + 240px);background-image:${KACHELN.schnee3};background-size:120px 240px;animation:i-flocken 13s linear infinite;will-change:transform}
.w-ringe,.w-laub,.i-boden .w-eis{display:none}.w-ring{fill:none;stroke:#fff;stroke-width:.3;transform-box:fill-box;transform-origin:50% 50%;animation:i-ring 3.6s ease-out infinite}
.i-boden .w-eis{fill:#fdfdfd;stroke:#b9c7d2;stroke-width:.14}
.i-vogel{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--ie,0) * var(--fx)) calc(var(--ie,0) * var(--fy));scale:calc(1 + var(--ie,0) * 3);opacity:calc(.72 - var(--ip,0) * 1.7);animation:i-ein 1.2s ease 1.3s both}
.i-vogel svg{display:block;width:100%;height:auto;overflow:visible;animation:i-flug var(--d) cubic-bezier(.3,.25,.55,1) var(--v) infinite}
.i-vogel path{fill:#4a443e;transform-box:fill-box;transform-origin:50% 62%;animation:i-schlag .62s ease-in-out calc(var(--v) * .37) infinite alternate}
.i-titelplatz{position:relative;z-index:2;flex:none}
.i-titel{margin:0;font:760 clamp(46px,13.6vw,100px)/1 var(--serif);letter-spacing:-.025em;text-align:center;
  transform:translate(var(--tx,0px),var(--ty,0px)) scale(var(--ts,1));opacity:var(--to,1);will-change:transform,opacity}
.i-w{display:inline-block;overflow:hidden;padding:.1em .06em .14em;margin:-.1em -.06em -.14em;vertical-align:bottom}
.i-w i{display:inline-block;font-style:normal;animation:i-buchstabe 1s cubic-bezier(.2,.75,.2,1) calc(1.5s + var(--i) * 24ms) both}
.i-titel b{display:inline-block;color:#c8102e;transform-origin:50% 85%;animation:i-punkt .7s cubic-bezier(.22,.61,.36,1) 2.35s both}
@media (min-width:700px){.i-titel{white-space:nowrap}.i-titel br{display:none}}
.i-unter{position:relative;z-index:2;margin:0;display:flex;align-items:center;gap:12px;color:#57524a;font:600 clamp(13px,3.5vw,17px)/1.3 var(--sans);text-align:center;
  opacity:calc(1 - var(--ip,0) * 5);translate:0 calc(var(--ip,0) * -60px)}
.i-unter span{display:inline-block;white-space:nowrap;letter-spacing:.02em;animation:i-unter 1s cubic-bezier(.16,1,.3,1) 2.4s both}
.i-unter::before,.i-unter::after{content:"";width:clamp(0px,calc((100vw - 380px) * .3),34px);height:1px;background:#a8a093;animation:i-strich .8s cubic-bezier(.16,1,.3,1) 2.6s both}
.i-unter::before{transform-origin:100% 50%}.i-unter::after{transform-origin:0 50%}
/* Fachbereichswahl: drei Knöpfe am unteren Rand. Der gewählte fliegt bei der Fahrt nach unten mit und landet als aktiver Reiter. */
.i-wahl{position:absolute;z-index:3;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 12px;
  opacity:calc(1 - var(--ip,0) * 6);pointer-events:none}
.i-wahl>*{pointer-events:auto}
.i-wahl-reihe{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.i-wahl-reihe button,.i-flug{display:inline-flex;align-items:center;gap:8px;padding:10px 17px 10px 11px;border:0;border-radius:999px;background:rgba(255,253,248,.9);color:#1f1c18;
  font:600 15.5px/1 "Bricolage Grotesque",var(--sans);white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 1px rgba(31,28,24,.07),0 10px 24px -16px rgba(40,30,20,.6)}
.i-wahl-reihe button{cursor:pointer;animation:i-wahl .8s cubic-bezier(.2,1.25,.3,1) calc(2.75s + var(--nr) * .11s) both;transition:background .3s,color .3s,translate .35s cubic-bezier(.3,1.7,.5,1),opacity .5s}
.i-wahl-reihe button i,.i-flug i{flex:none;width:24px;aspect-ratio:1;background:currentColor;-webkit-mask:var(--bild) center/contain no-repeat;mask:var(--bild) center/contain no-repeat}
.i-wahl-reihe button:hover,.i-wahl-reihe button:focus-visible{background:#1f1c18;color:#f6f4ef;translate:0 -2px}
.i-wahl.gewaehlt .i-wahl-reihe button{opacity:0;pointer-events:none}.i-wahl.gewaehlt .i-weiter{opacity:0}
.i-flug{position:fixed;z-index:40;left:0;top:0;margin:0;pointer-events:none;transform-origin:0 0;will-change:transform;transition:background-color 1s ease .5s,color 1s ease .5s}
.i-flug.faerbt{background:var(--zf,#1f1c18);color:var(--zt,#f6f4ef)}
@keyframes i-wahl{from{opacity:0;transform:translateY(16px)}}
@media (max-width:560px){.i-wahl-reihe{gap:7px}.i-wahl-reihe button,.i-flug{padding:9px 14px 9px 9px;font-size:14.5px}.i-wahl-reihe button i,.i-flug i{width:21px}}
.i-weiter{display:inline-flex;flex-direction:column;align-items:center;gap:2px;
  padding:6px 14px 2px;border:0;background:none;color:#5d584f;font:600 12.5px/1 var(--sans);letter-spacing:.04em;cursor:pointer;
  transition:opacity .4s;animation:i-ein .6s ease 3.2s both}
.i-weiter i{font-style:normal;font-size:20px;animation:i-wippen 1.8s ease-in-out 3.5s infinite}
.intro.fertig *,.intro.fertig *::before,.intro.fertig *::after{animation:none!important}
@keyframes i-aus{from{opacity:1}}
@keyframes i-ein{from{opacity:0}}
@keyframes i-zoom{from{scale:var(--z)}}
@keyframes i-steig{from{translate:0 104%}}
${VARIANTEN}${BONI_CSS}
@keyframes i-flocken{from{transform:translateY(-240px)}}
@keyframes i-ring{from{transform:scale(.15);opacity:.9}to{transform:scale(1);opacity:0}}
${FEST_CSS}
@keyframes i-fall{to{transform:translate3d(calc(var(--kx) * var(--kr,0)),var(--ky),0)}}
@keyframes i-wiegen{from{transform:translateX(calc(var(--wieg,0px) * -1))}to{transform:translateX(var(--wieg,0px))}}
@keyframes i-wolke{from{transform:translateX(calc(var(--fx) * .25));opacity:0}}
@keyframes i-zieh{to{transform:translateX(16%)}}
@keyframes i-schiff{from{transform:translateX(5px)}to{transform:translateX(-9px)}}
@keyframes i-wasser{from{transform:translateX(-6px)}to{transform:translateX(6px)}}
@keyframes i-schein{from{transform:scale(.25);opacity:0}}
@keyframes i-drehen{to{transform:rotate(360deg)}}
@keyframes i-sonne{from{transform:translateY(44px)}}
@keyframes i-fenster{0%{opacity:0;fill:#fffdf8}35%{opacity:1;fill:#fffdf8}100%{opacity:1}}
@keyframes i-licht{0%{fill:#57524d}32%{fill:#fffdf8}}
@keyframes i-dom{from{transform:translateY(3px);opacity:0}}
@keyframes i-blatt{from{transform:translateY(3.5%);opacity:0}}
@keyframes i-flug{0%{transform:translate(calc(var(--L) * var(--x0)),calc(var(--L) * var(--y0))) scale(1);opacity:0}7%{opacity:1}86%{opacity:1}100%{transform:translate(0,0) scale(.3);opacity:0}}
@keyframes i-schlag{from{transform:scaleY(1.08)}to{transform:scaleY(.42)}}
@keyframes i-buchstabe{from{transform:translateY(112%)}}
@keyframes i-punkt{from{transform:scale(.5);opacity:0}}
@keyframes i-unter{from{opacity:0;transform:translateY(6px) scaleX(1.1)}}
@keyframes i-strich{from{transform:scaleX(0)}}
@keyframes i-wippen{0%,100%{transform:none}50%{transform:translateY(5px)}}
@media (prefers-reduced-motion:reduce){.intro *,.intro *::before,.intro *::after{animation:none!important}}
/* INTRO-ENDE */
`;

const svgBand = (kl, innen, nach = "") => `<div class="i-band ${kl}"><svg viewBox="0 0 ${B} ${H}">${innen}</svg>${nach}</div>`;
// Stadtlage mit leichtem Dunst nach unten (Verlauf), Dächern, Fenstern und einzelnen Lichtern
const stadtBand = (kl, b, id, oben, unten, extra = "", vorher = "", nach = "") => svgBand(kl, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="${oben}"/><stop offset="1" stop-color="${unten}"/></linearGradient></defs>`
  + vorher + `<path fill="url(#${id})" d="${b.umriss}"/><path class="i-schatten" d="${b.schatten}"/><path class="i-dach" d="${b.dach}"/>${b.patina ? `<path class="i-patina" d="${b.patina}"/><path class="i-glanz" d="${b.glanz}"/><path class="i-rippe" d="${b.rippe}"/>` : ""}<path class="i-tuer" d="${b.tuer}"/><path class="i-fenster" d="${b.fenster}"/><path class="i-lichter" d="${b.licht}"/><path class="i-linie" d="${b.linie}"/>${extra}`, nach);

const html = `<!-- INTRO-START -->
<section class="intro" id="intro" hidden aria-label="Mainzer Boniblatt">
 <div class="intro-buehne">
  <div class="i-mitte">
    <div class="i-logo" aria-hidden="true">
      <div class="i-welt">
      ${WOLKEN_DEFS}
      <div class="i-himmel"></div>
      <div class="i-licht"><div class="i-schein"></div><div class="i-strahlen"></div></div>
      <div class="i-l i-sonne"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont"><rect width="128" height="76.7"/></clipPath></defs><g clip-path="url(#i-horizont)"><path d="M9.6 77.5a54.4 54.4 0 0 1 108.8 0Z"/></g></svg></div>
      ${WOLKEN.map((w, i) => `<div class="i-wolke${w.mehr ? " i-mehr" : ""}" style="left:${w.l}%;top:${w.t}%;--g:${w.g};--fx:${w.fx};--v:${w.v}s">${WOLKE(i % 3)}</div>`).join("\n      ")}
      <div class="i-flocken"></div>
      ${FEST_HIMMEL}
      ${svgBand("i-huegel", `<path d="${HUEGEL_FERN.d}"/>`)}
      ${svgBand("i-huegel2", `<path d="${HUEGEL_NAH.d}"/><path class="i-tupfen" d="${HUEGEL_NAH.t[0]}"/><path class="i-tupfen t2" d="${HUEGEL_NAH.t[1]}"/>`)}
      ${stadtBand("i-fern", FERN, "i-dunst1", "#cdc6bb", "#ddd7ce")}
      ${stadtBand("i-stadt", STADT, "i-dunst2", "#b4ab9e", "#c8c0b5", FEST_STADT, BONI_SVG)}
      ${svgBand("i-ufer", `<path class="b-lampe" d="${UFER.lampe}"/><path class="b-stamm" d="${UFER.stamm}"/><defs><path id="i-ast" d="${UFER.kahl}"/></defs><use class="b-kahl" href="#i-ast"/><use class="b-reif" href="#i-ast" transform="translate(-.1 -.24)"/><path class="b-a" d="${UFER.a}"/><path class="b-b" d="${UFER.b}"/><path class="b-c" d="${UFER.c}"/><path class="b-hell" d="${UFER.hell}"/><path class="b-chell" d="${UFER.chell}"/>`
        + `<path class="b-busch" d="${UFER.busch}"/><path class="b-buschhell" d="${UFER.buschhell}"/><path class="b-wiese" d="M0 ${H - 2.05}H${B}v.5H0Z"/><path class="b-blume bl1" d="${UFER.blume1}"/><path class="b-blume bl2" d="${UFER.blume2}"/><path d="M0 ${H}V${H - 1.6}H${B}V${H}Z"/><path class="b-kante" d="M0 ${H - 1.6}H${B}v.45H0Z"/><path class="b-schnee" d="${SCHNEEBANK}"/>${FEST_UFER}`)}
      <div class="i-dunst"></div>
      ${FEST_VORN}
      <div class="i-boden"><svg viewBox="0 0 ${B} 50"><path class="w-ufer" d="M0 0H${B}V1.3H0Z"/><path class="w-ufer2" d="M0 1.3H${B}V3.4H0Z"/><path d="${WASSER.blau}"/><path class="w-hell" d="${WASSER.weiss}"/>${WASSERDINGE}${SCHIFF}${FEST_WASSER}</svg></div>
      <div class="i-kante"></div>
      </div>
      ${VOEGEL.map(v => `<div class="i-vogel" style="left:${v.l}%;top:${v.t}%;--g:${v.g};--x0:${v.x0};--y0:${v.y0};--d:${v.d}s;--v:${v.v}s;--fx:${v.fx};--fy:${v.fy}"><svg viewBox="0 0 32 13"><path d="M16 6.6C14.4 4.2 11.8 2.7 9 2.7C6 2.7 3.2 4 1 6.2C3.6 4.9 6.4 4.5 9 5C11.8 5.6 14.2 7.2 16 9.6C17.8 7.2 20.2 5.6 23 5C25.6 4.5 28.4 4.9 31 6.2C28.8 4 26 2.7 23 2.7C20.2 2.7 17.6 4.2 16 6.6Z"/></svg></div>`).join("\n      ")}
    </div>
    <div class="i-titelplatz"><h1 class="i-titel"><span class="i-w">${buchstaben("Mainzer", 0)}</span> <br><span class="i-w">${buchstaben("Boniblatt", 7)}</span><b>.</b></h1></div>
    <p class="i-unter"><span>Deine tagesaktuelle Fachzeitung aus Mainz</span></p>
  </div>
  ${FEST_BUEHNE}
  <div class="i-nieder" aria-hidden="true"><div class="i-wieg"><div class="n n1"></div><div class="n n2"></div><div class="n n5"></div><div class="n n3"></div><div class="n n4"></div></div></div>
  <nav class="i-wahl" aria-label="Fachbereich wählen"><div class="i-wahl-reihe">${[["jugendhilfeplanung", "Jugendhilfeplanung", "stadtplan"], ["fruehe-hilfen", "Fachstelle", "haende"], ["quartiersmanagement", "Quartiermanagement", "parkbank"]].map(([id, name, bild], i) => `<button type="button" data-r="${id}" style="--nr:${i};--bild:url(bilder/motive/${bild}.webp)"><i aria-hidden="true"></i>${name}</button>`).join("")}</div>
    <button type="button" class="i-weiter" aria-label="Zur Ausgabe"><i aria-hidden="true">↓</i></button></nav>
 </div>
 <div class="i-traeger" aria-hidden="true"><div class="i-platz">
      <div class="i-l i-sonne i-vorn"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont2"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#i-horizont2)"><path d="M9.6 77.5a54.4 54.4 0 0 1 108.8 0Z"/></g></svg></div>
      <div class="i-l i-turm"><svg viewBox="0 0 128 128"><g><rect class="i-dunkel" x="80.5" y="3" width="15.8" height="66.5"/>${TURM}</g></svg></div>
      <div class="i-l i-fenster"><svg viewBox="0 0 128 128">${FENSTER}</svg></div>
      <div class="i-l i-dom"><svg viewBox="0 0 128 128"><g>${DOM}</g></svg></div>
      <div class="i-l i-zl"><svg viewBox="0 0 128 128">${LINKS}</svg></div>
      <div class="i-l i-zr"><svg viewBox="0 0 128 128">${RECHTS}</svg></div>
 </div></div>
 <div class="i-woge" aria-hidden="true"><svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 60V30C100 6 200 6 300 30S500 54 600 30S800 6 900 30S1100 54 1200 30V60Z"/></svg><svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 60V30C100 6 200 6 300 30S500 54 600 30S800 6 900 30S1100 54 1200 30V60Z"/></svg></div>
</section>
<script src="daten/wetter.js"></script>
<script src="daten/flieger.js"></script>
<script src="daten/podcast.js"></script>
<script>
/* Intro bei jedem Aufruf der Ausgabe (auch mit Ressort-Lesezeichen), nur hell und nicht nach der Rückkehr von ueber.html; ?intro erzwingt es. ?zeit=1.5 / ?p=0.5 = Standbilder für Entwürfe. */
(() => {
  const intro = document.getElementById("intro");
  const q = new URLSearchParams(location.search);
  const hell = document.documentElement.dataset.thema !== "dunkel";
  const vonUeber = document.referrer.includes("/ueber.html");
  if (q.has("ohne") || !(q.has("intro") || (hell && !vonUeber))) { intro.remove(); return; }
  // Variante: Jahreszeit aus dem Datum, Wetterlage für heute aus daten/wetter.js (Mainz). ?wetter=herbst-regen zeigt eine bestimmte.
  // ?tag=2027-06-18 zeigt das Intro eines anderen Tages (Anlässe und Fundstücke; das Wetter dazu mit ?wetter=).
  const heute = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(q.get("tag") || "") ? q.get("tag") : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const monat = +heute.slice(5, 7);
  let zeit = monat >= 3 && monat <= 5 ? "fruehling" : monat >= 6 && monat <= 8 ? "sommer" : monat >= 9 && monat <= 11 ? "herbst" : "winter";
  let wetter = (window.FACHBRIEF_WETTER || {})[heute];
  for (const teil of (q.get("wetter") || "").split("-")) {
    if (["fruehling", "sommer", "herbst", "winter"].includes(teil)) zeit = teil;
    if (["sonne", "bewoelkt", "regen", "schnee"].includes(teil)) wetter = teil;
  }
  if (!["sonne", "bewoelkt", "regen", "schnee"].includes(wetter)) wetter = "sonne";
  if (wetter === "schnee" && zeit !== "winter") wetter = "regen";
  intro.dataset.zeit = zeit; intro.dataset.wetter = wetter; intro.dataset.tag = heute;
  // Besondere Tage (Regeln in werkzeuge/intro-feste.mjs). ?fest=advent oder ?fest=riesenrad zeigt
  // einen Anlass bzw. ein Element gezielt, ?fest=aus keines.
  const festeFuer = ${festeFuer.toString()};
  const hd = heute.split("-"), fest = festeFuer(new Date(+hd[0], +hd[1] - 1, +hd[2]), zeit, wetter, Math.random(), ${JSON.stringify(FERIEN)}, ${JSON.stringify(TERMINE)});
  let elemente = fest.elemente;
  if (q.has("fest")) {
    elemente = wetter === "schnee" ? ["schneemann"] : [];
    q.get("fest").split(",").forEach(n => { const a = fest.alle.find(x => x[0] === n); (a ? a[1] : n === "aus" ? [] : [n]).forEach(e => elemente.push(e)); });
  }
  intro.dataset.fest = elemente.join(" ");
  // Bonifaziustürme: Auf dem Balkon stehen je Aufruf die Raucher oder die Kaffeerunde (werkzeuge/intro-boni.mjs); ?boni=raucher, ?boni=kaffee
  (${boniSzene.toString()})(intro, q);
  // Fundstücke des Tages (werkzeuge/intro-funde.mjs): werden nachgeladen und suchen sich ihren Platz selbst.
  // ?fund=name,name zeigt bestimmte, ?fund=aus keine; ?fq=ufer lädt einen Entwurf (docs/_funde-ufer.js).
  // Dieselbe Datei zeichnet auch den Werbeflieger mit dem Spruch des Tages (daten/flieger.js); ?spruch=Text zeigt einen beliebigen.
  const fq = /^[a-z-]+$/.test(q.get("fq") || "") ? q.get("fq") : "", fundSkript = document.createElement("script");
  fundSkript.src = fq ? "_funde-" + fq + ".js?" + Date.now() : "intro-funde.js?v=${FUNDE_V}";
  // Für Standbilder (?zeit, ?p) wird die Datei sofort mitgeladen, damit das Bild verlässlich alles enthält.
  if (q.get("fund") === "aus" && !q.has("spruch") && !(window.BONIBLATT_FLIEGER || {})[heute]) ; else if (q.has("zeit") || q.has("p")) document.write('<script src="' + fundSkript.src + '"><' + '/script>'); else document.head.appendChild(fundSkript);
  intro.hidden = false;
  // Erst bewegen, wenn alles da ist: Bis Schriften und Bilder geladen sind (höchstens 2,5 Sekunden), ruhen alle Animationen des Startbilds.
  if (!q.has("zeit") && !q.has("p")) { intro.classList.add("wartet");
    const fertig = Promise.all([document.fonts && document.fonts.ready, new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }))]);
    Promise.race([fertig, new Promise(r => setTimeout(r, 2500))]).then(() => requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.remove("wartet")))); }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const buehne = intro.querySelector(".intro-buehne"), logo = intro.querySelector(".i-logo"), platzEl = intro.querySelector(".i-platz"), traeger = intro.querySelector(".i-traeger"), titel = intro.querySelector(".i-titel"), sonneHinten = intro.querySelector(".i-welt .i-sonne");
  let bild, geo = null, fertig = false, ruhe = 0, offen = false, fahrt = 0;
  const grenze = x => Math.min(1, Math.max(0, x)), sanft = x => x * x * (3 - 2 * x);
  const strecke = () => intro.offsetHeight - buehne.offsetHeight;
  // Wer die Scroll-Werte braucht: alle Elemente, deren Regeln --ip oder --ie benutzen (auch Fundstücke und Festschmuck, die
  // später dazukommen). Die Werte stehen nur an diesen Elementen, nie an der Wurzel des Intros.
  let nutzer = [], sammelnNoetig = true;
  const sammeln = () => {
    sammelnNoetig = false; const menge = new Set();
    const durch = liste => { for (const r of liste) {
      if (r.cssRules && r.cssRules.length && !r.selectorText) { durch(r.cssRules); continue; }
      if (!r.selectorText || !(r.cssText.includes("var(--ip") || r.cssText.includes("var(--ie"))) continue;
      try { intro.querySelectorAll(r.selectorText).forEach(x => menge.add(x)); } catch (e) {} } };
    for (const blatt of document.styleSheets) { try { durch(blatt.cssRules); } catch (e) {} }
    nutzer = [...menge];
  };
  new MutationObserver(() => { sammelnNoetig = true; }).observe(intro, { childList: true, subtree: true });
  // Maße: nur beim Laden und wenn sich die Größe ändert. Beim Scrollen wird nichts gemessen – der Platz des Logos auf der
  // Bühne steht fest (die Bühne klebt am Fenster), der Platz in der Kopfzeile wandert genau mit der Scrollhöhe.
  const messen = () => {
    if (!intro.isConnected || fertig) return;
    bild = bild || document.querySelector("#kopf .marke .logo-hell"); if (!bild) return;
    const a = logo.getBoundingClientRect(), b = buehne.getBoundingClientRect(), z = bild.getBoundingClientRect(), i = intro.getBoundingClientRect();
    geo = { aw: a.width, al: a.left - b.left, at: a.top - b.top, ax: a.left - b.left + a.width / 2, ay: a.top - b.top + a.height / 2,
      zx: z.left + z.height / 2 - b.left, zy: z.top + z.height / 2 + scrollY, zh: z.height, strecke: strecke() };
    platzEl.style.setProperty("--lt", geo.at.toFixed(1) + "px"); platzEl.style.setProperty("--ll", geo.al.toFixed(1) + "px");
    // Der Träger ist genau so hoch, dass ihn das Ende des Intros in dem Moment nach oben mitnimmt, in dem der Platz in der
    // Kopfzeile das Logo erreicht – ab da läuft das Logo mit der Seite mit, das macht der Browser selbst.
    traeger.style.setProperty("--hc", (i.bottom + scrollY - geo.zy + geo.ay).toFixed(1) + "px");
    bild.style.clipPath = "inset(0 0 0 100%)";
    zeichnen();
  };
  const zeichnen = () => {
    if (!geo || !intro.isConnected) return 0;
    if (sammelnNoetig) sammeln();
    const y = scrollY, p = grenze(y / geo.strecke), e = sanft(p), ps = p.toFixed(4), es = e.toFixed(4);
    for (const x of nutzer) { x.style.setProperty("--ip", ps); x.style.setProperty("--ie", es); }
    // Das Logo bleibt auf seiner Höhe stehen und wird stetig kleiner, je näher die Kopfzeile von unten kommt: Genau bei
    // ihrer Ankunft hat es seine Endgröße und steht über seinem Platz.
    const t = grenze(1 - (geo.zy - y - geo.ay) / Math.max(1, geo.zy - geo.ay));
    const ds = 1 + (geo.zh / geo.aw - 1) * sanft(t), g = geo.aw * ds, mx = geo.ax + (geo.zx - geo.ax) * sanft(grenze(t / .85));
    const dx = (mx - g / 2 - geo.al).toFixed(1) + "px", dy = ((geo.aw - g) / 2).toFixed(1) + "px", dss = ds.toFixed(4);
    for (const x of [platzEl, sonneHinten]) if (x) { x.style.setProperty("--dx", dx); x.style.setProperty("--dy", dy); x.style.setProperty("--ds", dss); }
    titel.style.setProperty("--ts", (1 - e * .14).toFixed(4)); titel.style.setProperty("--to", (1 - grenze((p - .02) / .2)).toFixed(3));
    bild.style.opacity = grenze((t - .3) / .45).toFixed(3);
    return p;
  };
  const rechne = () => {
    offen = false; if (!intro.isConnected) return;
    if (!geo) messen(); if (!geo) return;
    if (fertig) { if (!fahrt && scrollY < geo.strecke) scrollTo(0, geo.strecke); return; }      // angekommen: kein Zurück ins Intro
    if (zeichnen() >= 1) { buehne.style.visibility = "hidden"; fertig = true; clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); }
  };
  // Ist die Ausgabe ganz da, verschwindet das Intro endgültig (erst wieder nach dem Neuladen). Es wird entfernt, sobald
  // das Scrollen kurz ruht – so springt nichts, auch nicht beim Schwung-Scrollen auf dem Handy. Solange die Fahrt nach dem
  // Klick auf „Zur Ausgabe“ läuft, bleibt es stehen: Sonst landete ihr letzter Schritt eine Bildschirmhöhe zu tief.
  const einklappen = () => {
    if (!fertig || fahrt || !intro.isConnected) return;
    const rest = Math.max(0, scrollY - strecke());
    if (bild) bild.style.clipPath = bild.style.opacity = "";
    intro.remove(); scrollTo(0, rest);
  };
  addEventListener("scrollend", einklappen);
  addEventListener("scroll", () => {
    if (fertig) { clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); }
    if (!offen) { offen = true; requestAnimationFrame(rechne); }
  }, { passive: true });
  addEventListener("resize", () => { messen(); rechne(); });
  // Wer am Intro auf Dunkel schaltet, bekommt die Ausgabe ohne Intro (die Szene gibt es nur hell).
  new MutationObserver(() => {
    if (document.documentElement.dataset.thema !== "dunkel" || !intro.isConnected) return;
    const bild = document.querySelector("#kopf .marke .logo-hell"); if (bild) bild.style.clipPath = bild.style.opacity = "";
    const rest = Math.max(0, scrollY - strecke()); intro.remove(); scrollTo(0, rest);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-thema"] });
  // „Zur Ausgabe“: eine einzige ruhige Fahrt bis genau an den Anfang der Ausgabe. Wer dabei selbst scrollt, übernimmt.
  const halt = () => { if (fahrt) { cancelAnimationFrame(fahrt); fahrt = 0; if (fertig) { clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); } } };
  addEventListener("wheel", halt, { passive: true }); addEventListener("touchstart", halt, { passive: true });
  const kurve = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const fahre = (dauer, unterwegs) => {
    if (fahrt || fertig) return false; if (!geo) messen();
    const von = scrollY, bis = strecke(), t0 = performance.now();
    const schritt = jetzt => {
      if (!intro.isConnected) { fahrt = 0; return; }
      const x = grenze((jetzt - t0) / dauer);
      scrollTo(0, von + (bis - von) * kurve(x)); if (unterwegs) unterwegs(x);
      if (x < 1) fahrt = requestAnimationFrame(schritt); else { fahrt = 0; clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); }
    };
    fahrt = requestAnimationFrame(schritt); return true;
  };
  intro.querySelector(".i-weiter").addEventListener("click", () => fahre(1400));
  // Fachbereich im Startbild wählen: Die Ausgabe stellt sich auf den Bereich ein (Ereignis „boni-bereich“, blatt/bb.js), dann
  // fährt die Seite hinunter. Der gewählte Knopf fliegt als Kopie mit und landet genau auf seinem Reiter in der Ausgabe.
  const wahl = intro.querySelector(".i-wahl");
  wahl.addEventListener("click", e => {
    const k = e.target.closest("button[data-r]"); if (!k || fahrt || fertig) return;
    window.BONI_START = k.dataset.r; document.dispatchEvent(new CustomEvent("boni-bereich", { detail: k.dataset.r }));
    const a = k.getBoundingClientRect(), flug = document.createElement("div"); flug.className = "i-flug"; flug.innerHTML = k.innerHTML; flug.style.cssText = k.style.cssText;
    // Zielfarbe = Farbe des Bereichs in der Ausgabe (Rollen wie in blatt/bb.css: Bereich 1 → Farbe 1, 2 → 4, 3 → 3). Fest eingetragen, weil die
    // Rollenfarbe --ra beim Umschalten selbst gerade umläuft – ein Übergang dorthin käme nie in Gang.
    const ziel = document.getElementById("e"), fnr = [1, 4, 3, 2, 5][[...wahl.querySelectorAll("button[data-r]")].indexOf(k) % 5];
    if (ziel) { const cs = getComputedStyle(ziel), zf = cs.getPropertyValue("--p" + fnr).trim(), zt = cs.getPropertyValue("--t" + fnr).trim(); if (zf) flug.style.setProperty("--zf", zf); if (zt) flug.style.setProperty("--zt", zt); }
    (ziel || document.body).appendChild(flug); wahl.classList.add("gewaehlt"); requestAnimationFrame(() => requestAnimationFrame(() => flug.classList.add("faerbt")));
    const setze = (x, y, g, o) => { flug.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + g.toFixed(4) + ")"; flug.style.opacity = o; };
    setze(a.left, a.top, 1, 1);
    const weg = () => { flug.remove(); };
    const los = fahre(1700, x => {
      // Ziel: der Reiter des Bereichs, so wie er am Ende der Fahrt im Fenster steht (er wandert mit der Seite nach oben)
      const z = document.querySelector('#e .bb-reiter button[data-r="' + k.dataset.r + '"]'); if (!z) { setze(a.left, a.top, 1, 1 - x); return; }
      const r = z.getBoundingClientRect(), rest = strecke() - scrollY, zy = r.top - rest, g = r.height / a.height, w = kurve(grenze(x * 1.04));
      // leichter Bogen: erst ein kleines Stück nach oben, dann hinunter zum Reiter
      setze(a.left + (r.left - a.left) * w, a.top + (zy - a.top) * w - Math.sin(Math.PI * x) * 26, 1 + (g - 1) * w, x > .9 ? (1 - x) / .1 : 1);
      if (x >= 1) weg();
    });
    if (!los) weg(); else { const ab = () => { if (!fahrt) { flug.style.transition = "opacity .3s"; flug.style.opacity = 0; setTimeout(weg, 320); } }; addEventListener("wheel", ab, { passive: true, once: true }); addEventListener("touchstart", ab, { passive: true, once: true }); }
  });
  messen(); addEventListener("DOMContentLoaded", messen); addEventListener("load", messen);
  // Lädt die Titelschrift nach, verschiebt sich die Logofläche auf der Bühne um ein paar Pixel – der Träger zieht sofort nach.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(messen);
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => messen()); intro.querySelectorAll(".i-mitte > *, .intro-buehne").forEach(e => ro.observe(e)); }
  // Standbilder für Entwürfe
  if (q.has("zeit") || q.has("p")) addEventListener("load", () => {
    if (q.has("p")) { intro.classList.add("fertig"); scrollTo(0, strecke() * parseFloat(q.get("p"))); rechne(); return; }
    const ms = parseFloat(q.get("zeit")) * 1000;
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
  });
})();
</script>
<!-- INTRO-ENDE -->
`;

let seite = readFileSync(`${DOCS}/index.html`, "utf8");
seite = seite.replace(/\/\* INTRO-START[\s\S]*?\/\* INTRO-ENDE \*\/\n/, "").replace(/<!-- INTRO-START -->[\s\S]*?<!-- INTRO-ENDE -->\n/, "");
const stilEnde = seite.indexOf("</style>");
seite = seite.slice(0, stilEnde) + css + seite.slice(stilEnde);
const body = seite.match(/<body[^>]*>\n/);
seite = seite.replace(body[0], body[0] + html);
writeFileSync(`${ZIEL}/index.html`, seite);
console.log("Intro eingebaut:", css.length + html.length, "Zeichen");
