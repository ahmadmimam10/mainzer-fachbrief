#!/usr/bin/env node
// Baut das Intro „Morgen über Mainz“ in docs/index.html ein: Papierlagen-Szene (Hügel, Stadt, Ufer, Rhein) hinter den
// Logo-Teilen aus docs/bilder/intro/*.svg (Dom, Zeitung links/rechts – gleiche 128×128-Fläche wie die Sonne).
// Aufbau läuft von selbst (rund 3 s); der Weggang ist an das Scrollen gekoppelt (Bühne bleibt stehen, Ausgabe schiebt
// sich darüber, Logo dockt in der Kopfzeile an). Wiederholbar: ersetzt die markierten Blöcke INTRO-START … INTRO-ENDE.
//   node werkzeuge/intro-einbauen.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { FERIEN, festeFuer, FEST_CSS, FEST_HIMMEL, FEST_VORN, FEST_STADT, FEST_UFER, FEST_WASSER, FEST_BUEHNE } from "./intro-feste.mjs";

const DOCS = "docs", ZIEL = "docs";
const teil = n => {
  const svg = readFileSync(`${DOCS}/bilder/intro/${n}.svg`, "utf8");
  return [...svg.matchAll(/<path [^>]*\/>/g)].map(m => m[0].replace(/ fill="[^"]*"/, "")).join("");
};
const DOM = teil("02-Dom"), LINKS = teil("03-Zeitung-links"), RECHTS = teil("04-Zeitung-rechts");

// ---------- Szene (Einheiten wie im Logo: 128 = Logobreite; Bandmitte = 640; H = Horizont) ----------
const B = 1280, H = 60;
const f = n => +n.toFixed(1);
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const kreis = (cx, cy, rx, ry = rx) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

// Gebäude: Umriss, dazu Dächer (etwas dunkler), Kuppeln (Patina), Fenster (heller) und einzelne erleuchtete Fenster
function bauten(teile, r) {
  let x = 0, umriss = `M0 ${H}`, dach = "", patina = "", fenster = "", licht = "";
  for (const [typ, w, h = 0, e = 0] of teile) {
    const y = H - h, x2 = x + w, xm = x + w / 2;
    umriss += `V${f(y)}`;
    if (typ === "g") {                                                   // Giebel / Turmspitze
      const p = `L${f(xm)} ${f(y - e)}L${f(x2)} ${f(y)}`; umriss += p; if (w > 3) dach += `M${f(x)} ${f(y)}${p}Z`;
    } else if (typ === "s") {                                            // Walmdach
      const p = `L${f(x + w * .22)} ${f(y - e)}H${f(x + w * .78)}L${f(x2)} ${f(y)}`; umriss += p; dach += `M${f(x)} ${f(y)}${p}Z`;
    } else if (typ === "T") {                                            // Turm mit Helm und Schallfenster
      umriss += `H${f(x + w * .2)}V${f(y - e * .28)}L${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}V${f(y)}H${f(x2)}`;
      dach += `M${f(x + w * .2)} ${f(y - e * .28)}L${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}Z`;
      fenster += `M${f(xm - .55)} ${f(y + 3.6)}v-1.6a.55 .55 0 0 1 1.1 0v1.6Z`;
      if (h > 14) fenster += `M${f(xm - .45)} ${f(y + 7.4)}v-1.3a.45 .45 0 0 1 .9 0v1.3Z`;
    } else if (typ === "k") {                                            // Kuppel mit Laterne
      const p = `C${f(x)} ${f(y - e * .9)} ${f(xm - w * .14)} ${f(y - e)} ${f(xm - w * .06)} ${f(y - e)}V${f(y - e * 1.35)}H${f(xm + w * .06)}V${f(y - e)}C${f(xm + w * .14)} ${f(y - e)} ${f(x2)} ${f(y - e * .9)} ${f(x2)} ${f(y)}`;
      umriss += p; patina += `M${f(x)} ${f(y)}${p}Z`;
      for (let i = 0; i < 3; i++) fenster += `M${f(x + w * (.22 + i * .28) - .5)} ${f(y + 3.4)}v-1.5a.5 .5 0 0 1 1 0v1.5Z`;
    } else umriss += `H${f(x2)}`;
    if ("hgs".includes(typ) && w >= 6 && w < 40 && h >= 6) {             // Fensterreihen
      const sp = Math.max(1, Math.floor((w - 1.6) / 2.3)), ze = Math.max(1, Math.floor((h - 2.2) / 2.7)), ab = (w - sp * .9) / (sp + 1);
      for (let i = 0; i < sp; i++) for (let j = 0; j < ze; j++) {
        const z = r(); if (z < .2) continue;
        const d = `M${f(x + ab + i * (.9 + ab))} ${f(y + 1.5 + j * 2.7)}h.9v1.3h-.9Z`;
        if (z > .93) licht += d; else fenster += d;
      }
    }
    x = x2;
  }
  return { umriss: umriss + `V${H}Z`, dach, patina, fenster, licht };
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
  laub1: blaetter(280, 560, 7, 12, LAUB, BLATT), laub2: blaetter(210, 420, 5, 17, LAUB, BLATT, .8),
  bluete: blaetter(260, 520, 8, 23, ["#f6bfd0", "#fbdde6", "#f2a8bf"], BLUETE, 1.32),
};

// Vögel: Endlage im Himmel (in % der Logofläche), Startversatz (Richtung Dom) und Größe
const VOEGEL = [
  { l: -24, t: 2, g: .13, x0: "150%", y0: "310%", fx: "-60vw", fy: "-30vh", v: 0 },
  { l: 0, t: -16, g: .09, x0: "90%", y0: "420%", fx: "-34vw", fy: "-52vh", v: .12 },
  { l: 94, t: -10, g: .15, x0: "-80%", y0: "330%", fx: "48vw", fy: "-44vh", v: .05 },
  { l: 116, t: 14, g: .085, x0: "-190%", y0: "260%", fx: "64vw", fy: "-22vh", v: .2 },
  { l: 76, t: -27, g: .065, x0: "-60%", y0: "520%", fx: "30vw", fy: "-60vh", v: .28 },
];

const buchstaben = (wort, ab) => [...wort].map((b, i) => `<i style="--i:${ab + i}">${b}</i>`).join("");

// Jahreszeit (aus dem Datum) × Wetterlage (aus daten/wetter.js): 4 × 3 Varianten, im Winter zusätzlich Schnee = 13.
// Die Jahreszeit färbt Bäume, Wiese und Hügel, die Wetterlage Himmel, Licht, Wolken und Wasser.
const VARIANTEN = `.i-nieder{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:calc(1 - var(--p,0) * 2.6)}
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
.intro{position:relative;z-index:0;height:200vh;height:200svh;margin-bottom:-100vh;margin-bottom:-100svh;color:#141414;--weich:cubic-bezier(.16,.84,.24,1);--fahrt:cubic-bezier(.45,.05,.2,1)}
.intro[hidden]{display:none}
.intro ~ :not(script){position:relative;z-index:1}
.intro-buehne{position:sticky;top:0;height:100vh;height:100svh;min-height:520px;overflow:hidden;background:#f6f4ef;--L:clamp(210px,56vw,340px)}
.i-mitte{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vh,22px);padding:0 14px 5vh}
.i-logo{position:relative;width:var(--L);aspect-ratio:1;perspective:900px;flex:none}
.i-welt{position:absolute;inset:0;clip-path:inset(-200vh -200vw var(--unten,-200vh) -200vw)}
.i-vorn{opacity:calc(var(--p,0) * 3.4)}
.intro.gelandet .i-l{visibility:hidden}
.i-kante{position:absolute;left:-200vw;right:-200vw;bottom:var(--unten,-200vh);height:110px;background:linear-gradient(rgba(246,244,239,0),#f6f4ef)}
.i-himmel,.i-boden{position:absolute;left:50%;width:300vw;height:160vh;margin-left:-150vw}
.i-himmel{bottom:39.45%;background:linear-gradient(to top,var(--h1,#fbe6d8) 0,var(--h2,#f9ede3) 16vh,var(--h3,#f1f2ef) 40vh,var(--h4,#e9f0f3) 78vh);opacity:calc(1 - var(--e,0))}
.i-himmel::after,.i-boden::after{content:"";position:absolute;inset:0;opacity:0;animation:i-aus 1.9s ease-in-out .3s both}
.i-himmel::after{background:linear-gradient(to top,#ecd8d0 0,#dcdbe3 24vh,#c6cedb 78vh)}
.i-boden{top:calc(60.55% - 1px);background:linear-gradient(var(--wa1,#d9e6ed) 0,var(--wa2,#e7eef0) 8vh,#f6f4ef 24vh);translate:0 calc(var(--e,0) * 72vh)}
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
.i-licht{position:absolute;left:50%;top:60.55%;width:0;height:0;opacity:calc(var(--schein,1) - var(--p,0) * 1.5);scale:calc(1 + var(--e,0) * 1.4)}
.i-schein,.i-strahlen{position:absolute;border-radius:50%;aspect-ratio:1}
.i-schein{width:calc(var(--L) * 4.2);margin:calc(var(--L) * -2.1);background:radial-gradient(closest-side,rgba(226,70,60,.26),rgba(240,140,96,.13) 36%,rgba(246,200,160,0) 72%);animation:i-schein 1.7s var(--weich) .75s both}
.i-strahlen{width:calc(var(--L) * 5.6);margin:calc(var(--L) * -2.8);animation:i-ein 1.4s ease 1.5s both}
.i-strahlen::before,.i-strahlen::after{content:"";position:absolute;inset:0;border-radius:50%;
  -webkit-mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%);mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%)}
.i-strahlen::before{background:repeating-conic-gradient(rgba(203,8,56,0) 0deg,rgba(203,8,56,.05) 2.4deg,rgba(203,8,56,0) 4.8deg,rgba(203,8,56,0) 15deg);animation:i-drehen 140s linear infinite}
.i-strahlen::after{background:repeating-conic-gradient(from 6deg,rgba(244,160,96,0) 0deg,rgba(244,160,96,.06) 4deg,rgba(244,160,96,0) 8deg,rgba(244,160,96,0) 22.5deg);animation:i-drehen 200s linear infinite reverse}
.i-wolke{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx)) calc(var(--e,0) * -8vh);opacity:calc(1 - var(--p,0) * 1.8)}
.i-mehr{display:none}
.i-defs{position:absolute}
.i-wolke svg{display:block;width:100%;height:auto;opacity:var(--wod,.92);animation:i-wolke 2.2s var(--weich) calc(.5s + var(--v)) both,i-zieh 46s ease-in-out calc(2.8s + var(--v) * 9) infinite alternate}
.i-l{position:absolute;inset:0;transform-origin:0 0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(var(--ds,1));will-change:transform}
.i-l svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.i-sonne svg,.i-dom svg{transform-origin:50% 60.55%;--z:2.15;animation:i-zoom 2.5s var(--fahrt) both}
.i-dom svg{fill:#181716;transform-origin:50% 63%;animation:i-zoom 2.5s var(--fahrt) both,i-dom 1.15s cubic-bezier(.3,.9,.3,1) .22s both}
.i-sonne path{fill:#cb0838;transform-box:view-box;animation:i-sonne 1.5s cubic-bezier(.2,.75,.25,1) .75s both}
.i-zl svg,.i-zr svg{fill:#181716;transform-origin:50% 75%}
.i-zl svg{animation:i-blatt-l .95s cubic-bezier(.2,.9,.24,1.06) 1.05s both}
.i-zr svg{animation:i-blatt-r .95s cubic-bezier(.2,.9,.24,1.06) 1.13s both}
.i-band{position:absolute;left:50%;bottom:39.45%;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);transform-origin:50% 100%;
  translate:0 calc(var(--e,0) * 72vh);scale:calc(1 + var(--e,0) * var(--k));will-change:transform}
.i-band svg{display:block;width:100%;height:auto;transform-origin:50% 100%;animation:i-zoom 2.5s var(--fahrt) both,i-steig .95s cubic-bezier(.2,.9,.25,1.04) var(--ab,0s) both}
.i-huegel{--k:.08}.i-huegel svg{fill:var(--hu1,#dfe4dc);--z:1.16;animation:i-zoom 2.5s var(--fahrt) both}
.i-huegel2{--k:.18}.i-huegel2 svg{fill:var(--hu2,#d3dac8);--z:1.3;animation:i-zoom 2.5s var(--fahrt) both}.i-huegel2 .i-tupfen{fill:var(--tu1,#c2cdb6)}.i-huegel2 .t2{fill:var(--tu2,#c2cdb6)}
.i-fern{--k:.4}.i-fern svg{fill:#d3ccc1;--z:1.5;--ab:0s}.i-fern .i-dach{fill:var(--d1,#c7bfb4)}.i-fern .i-fenster{fill:#e1dcd4}.i-fern .i-lichter{fill:#f3e3bd}
.i-stadt{--k:1}.i-stadt svg{fill:#bcb3a6;--z:1.9;--ab:.12s}.i-stadt .i-dach{fill:var(--d2,#a89d90)}.i-stadt .i-patina{fill:#9fb5a7}.i-stadt .i-fenster{fill:#d6cfc4}.i-stadt .i-lichter{fill:#f8dfa2}
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
.i-vogel{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx)) calc(var(--e,0) * var(--fy));scale:calc(1 + var(--e,0) * 6);opacity:calc(var(--o,1) - var(--p,0) * 1.7)}
.i-vogel svg{display:block;width:100%;height:auto;overflow:visible;animation:i-flug 1.7s cubic-bezier(.3,.6,.3,1) calc(1.2s + var(--v)) both,i-schweben 7s ease-in-out calc(2.9s + var(--v) * 6) infinite alternate}
.i-vogel path{fill:#3d3934;transform-box:fill-box;transform-origin:50% 62%;animation:i-schlag .62s ease-in-out calc(var(--v) * -2s) infinite alternate}
.i-titelplatz{position:relative;z-index:2;flex:none}
.i-titel{margin:0;font:760 clamp(46px,13.6vw,100px)/1 var(--serif);letter-spacing:-.025em;text-align:center;
  transform:translate(var(--tx,0px),var(--ty,0px)) scale(var(--ts,1));opacity:var(--to,1);will-change:transform,opacity}
.i-w{display:inline-block;overflow:hidden;padding:.1em .06em .14em;margin:-.1em -.06em -.14em;vertical-align:bottom}
.i-w i{display:inline-block;font-style:normal;animation:i-buchstabe .75s cubic-bezier(.16,1,.3,1) calc(1.8s + var(--i) * 28ms) both}
.i-titel b{display:inline-block;color:#c8102e;transform-origin:50% 85%;animation:i-punkt .55s cubic-bezier(.3,1.7,.5,1) 2.5s both}
@media (min-width:700px){.i-titel{white-space:nowrap}.i-titel br{display:none}}
.i-unter{position:relative;z-index:2;margin:0;display:flex;align-items:center;gap:12px;color:#57524a;font:600 clamp(13px,3.5vw,17px)/1.3 var(--sans);text-align:center;
  opacity:calc(1 - var(--p,0) * 5);translate:0 calc(var(--p,0) * -60px)}
.i-unter span{letter-spacing:.02em;animation:i-unter 1s cubic-bezier(.16,1,.3,1) 2.4s both}
.i-unter::before,.i-unter::after{content:"";width:clamp(0px,calc((100vw - 380px) * .3),34px);height:1px;background:#a8a093;animation:i-strich .8s cubic-bezier(.16,1,.3,1) 2.6s both}
.i-unter::before{transform-origin:100% 50%}.i-unter::after{transform-origin:0 50%}
.i-weiter{position:absolute;z-index:3;left:50%;bottom:max(18px,env(safe-area-inset-bottom));display:inline-flex;flex-direction:column;align-items:center;gap:4px;
  padding:8px 14px;border:0;background:none;color:#5d584f;font:600 13px/1 var(--sans);letter-spacing:.04em;cursor:pointer;
  transform:translateX(-50%);opacity:calc(1 - var(--p,0) * 6);animation:i-ein .6s ease 2.9s both}
.i-weiter i{font-style:normal;font-size:20px;animation:i-wippen 1.8s ease-in-out 3.5s infinite}
.intro.fertig *,.intro.fertig *::before,.intro.fertig *::after{animation:none!important}
@keyframes i-aus{from{opacity:1}}
@keyframes i-ein{from{opacity:0}}
@keyframes i-zoom{from{scale:var(--z)}}
@keyframes i-steig{from{translate:0 104%}}
${VARIANTEN}
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
@keyframes i-sonne{from{transform:translateY(64px)}}
@keyframes i-dom{from{transform:perspective(520px) rotateX(-90deg)}55%{transform:perspective(520px) rotateX(10deg)}78%{transform:perspective(520px) rotateX(-4deg)}to{transform:perspective(520px) rotateX(0)}}
@keyframes i-blatt-l{from{transform:perspective(900px) translate3d(-175%,120%,0) rotateY(78deg) rotateZ(-34deg) scale(5.2);opacity:0}18%{opacity:1}to{transform:perspective(900px)}}
@keyframes i-blatt-r{from{transform:perspective(900px) translate3d(175%,120%,0) rotateY(-78deg) rotateZ(34deg) scale(5.2);opacity:0}18%{opacity:1}to{transform:perspective(900px)}}
@keyframes i-flug{from{transform:translate(var(--x0),var(--y0)) scale(.15);opacity:0}22%{opacity:1}}
@keyframes i-schweben{to{transform:translate(18%,-30%)}}
@keyframes i-schlag{from{transform:scaleY(1.08)}to{transform:scaleY(.42)}}
@keyframes i-buchstabe{from{transform:translateY(118%) rotate(7deg)}}
@keyframes i-punkt{from{transform:scale(0)}}
@keyframes i-unter{from{opacity:0;letter-spacing:.24em}}
@keyframes i-strich{from{transform:scaleX(0)}}
@keyframes i-wippen{0%,100%{transform:none}50%{transform:translateY(5px)}}
@media (prefers-reduced-motion:reduce){.intro *,.intro *::before,.intro *::after{animation:none!important}}
/* INTRO-ENDE */
`;

const svgBand = (kl, innen) => `<div class="i-band ${kl}"><svg viewBox="0 0 ${B} ${H}">${innen}</svg></div>`;
// Stadtlage mit leichtem Dunst nach unten (Verlauf), Dächern, Fenstern und einzelnen Lichtern
const stadtBand = (kl, b, id, oben, unten, extra = "") => svgBand(kl, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="${oben}"/><stop offset="1" stop-color="${unten}"/></linearGradient></defs>`
  + `<path fill="url(#${id})" d="${b.umriss}"/><path class="i-dach" d="${b.dach}"/>${b.patina ? `<path class="i-patina" d="${b.patina}"/>` : ""}<path class="i-fenster" d="${b.fenster}"/><path class="i-lichter" d="${b.licht}"/>${extra}`);

const html = `<!-- INTRO-START -->
<section class="intro" id="intro" hidden aria-label="Mainzer Fachbrief">
 <div class="intro-buehne">
  <div class="i-mitte">
    <div class="i-logo" aria-hidden="true">
      <div class="i-welt">
      ${WOLKEN_DEFS}
      <div class="i-himmel"></div>
      <div class="i-licht"><div class="i-schein"></div><div class="i-strahlen"></div></div>
      <div class="i-l i-sonne"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont"><rect width="128" height="76.7"/></clipPath></defs><g clip-path="url(#i-horizont)"><path d="M5.5 77.5a58.5 58.5 0 0 1 117 0Z"/></g></svg></div>
      ${WOLKEN.map((w, i) => `<div class="i-wolke${w.mehr ? " i-mehr" : ""}" style="left:${w.l}%;top:${w.t}%;--g:${w.g};--fx:${w.fx};--v:${w.v}s">${WOLKE(i % 3)}</div>`).join("\n      ")}
      <div class="i-flocken"></div>
      ${FEST_HIMMEL}
      ${svgBand("i-huegel", `<path d="${HUEGEL_FERN.d}"/>`)}
      ${svgBand("i-huegel2", `<path d="${HUEGEL_NAH.d}"/><path class="i-tupfen" d="${HUEGEL_NAH.t[0]}"/><path class="i-tupfen t2" d="${HUEGEL_NAH.t[1]}"/>`)}
      ${stadtBand("i-fern", FERN, "i-dunst1", "#cdc6bb", "#ddd7ce")}
      ${stadtBand("i-stadt", STADT, "i-dunst2", "#b4ab9e", "#c8c0b5", FEST_STADT)}
      ${svgBand("i-ufer", `<path class="b-lampe" d="${UFER.lampe}"/><path class="b-stamm" d="${UFER.stamm}"/><defs><path id="i-ast" d="${UFER.kahl}"/></defs><use class="b-kahl" href="#i-ast"/><use class="b-reif" href="#i-ast" transform="translate(-.1 -.24)"/><path class="b-a" d="${UFER.a}"/><path class="b-b" d="${UFER.b}"/><path class="b-c" d="${UFER.c}"/><path class="b-hell" d="${UFER.hell}"/><path class="b-chell" d="${UFER.chell}"/>`
        + `<path class="b-busch" d="${UFER.busch}"/><path class="b-buschhell" d="${UFER.buschhell}"/><path class="b-wiese" d="M0 ${H - 2.05}H${B}v.5H0Z"/><path class="b-blume bl1" d="${UFER.blume1}"/><path class="b-blume bl2" d="${UFER.blume2}"/><path d="M0 ${H}V${H - 1.6}H${B}V${H}Z"/><path class="b-kante" d="M0 ${H - 1.6}H${B}v.45H0Z"/><path class="b-schnee" d="${SCHNEEBANK}"/>${FEST_UFER}`)}
      <div class="i-dunst"></div>
      ${FEST_VORN}
      <div class="i-boden"><svg viewBox="0 0 ${B} 50"><path class="w-ufer" d="M0 0H${B}V1.3H0Z"/><path class="w-ufer2" d="M0 1.3H${B}V3.4H0Z"/><path d="${WASSER.blau}"/><path class="w-hell" d="${WASSER.weiss}"/>${WASSERDINGE}${SCHIFF}${FEST_WASSER}</svg></div>
      <div class="i-kante"></div>
      </div>
      <div class="i-l i-sonne i-vorn"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont2"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#i-horizont2)"><path d="M5.5 77.5a58.5 58.5 0 0 1 117 0Z"/></g></svg></div>
      <div class="i-l i-dom"><svg viewBox="0 0 128 128"><g>${DOM}</g></svg></div>
      <div class="i-l i-zl"><svg viewBox="0 0 128 128">${LINKS}</svg></div>
      <div class="i-l i-zr"><svg viewBox="0 0 128 128">${RECHTS}</svg></div>
      ${VOEGEL.map(v => `<div class="i-vogel" style="left:${v.l}%;top:${v.t}%;--g:${v.g};--x0:${v.x0};--y0:${v.y0};--fx:${v.fx};--fy:${v.fy};--v:${v.v}s;--o:${(.5 + v.g * 3.4).toFixed(2)}"><svg viewBox="0 0 32 13"><path d="M16 6.2C14.6 4.2 12.4 2.6 9.8 2.4C6.6 2.2 3.6 3.4 1 5.6C4 4.6 6.8 4.3 9.4 4.9C11.8 5.5 13.6 7 14.8 9.2L16 11.6L17.2 9.2C18.4 7 20.2 5.5 22.6 4.9C25.2 4.3 28 4.6 31 5.6C28.4 3.4 25.4 2.2 22.2 2.4C19.6 2.6 17.4 4.2 16 6.2ZM14.5 6.9a1.5 1.6 0 1 0 3 0a1.5 1.6 0 1 0-3 0Z"/></svg></div>`).join("\n      ")}
    </div>
    <div class="i-titelplatz"><h1 class="i-titel"><span class="i-w">${buchstaben("Mainzer", 0)}</span> <br><span class="i-w">${buchstaben("Fachbrief", 7)}</span><b>.</b></h1></div>
    <p class="i-unter"><span>Deine tagesaktuelle Fachzeitung aus Mainz</span></p>
  </div>
  ${FEST_BUEHNE}
  <div class="i-nieder" aria-hidden="true"><div class="i-wieg"><div class="n n1"></div><div class="n n2"></div><div class="n n5"></div><div class="n n3"></div><div class="n n4"></div></div></div>
  <button type="button" class="i-weiter">Zur Ausgabe<i aria-hidden="true">↓</i></button>
 </div>
</section>
<script src="daten/wetter.js"></script>
<script>
/* Intro bei jedem Aufruf der Ausgabe (auch mit Ressort-Lesezeichen), nur hell und nicht nach der Rückkehr von ueber.html; ?intro erzwingt es. ?zeit=1.5 / ?p=0.5 = Standbilder für Entwürfe. */
(() => {
  const intro = document.getElementById("intro");
  const q = new URLSearchParams(location.search);
  const hell = document.documentElement.dataset.thema !== "dunkel";
  const vonUeber = document.referrer.includes("/ueber.html");
  if (!(q.has("intro") || (hell && !vonUeber))) { intro.remove(); return; }
  // Variante: Jahreszeit aus dem Datum, Wetterlage für heute aus daten/wetter.js (Mainz). ?wetter=herbst-regen zeigt eine bestimmte.
  const jetzt = new Date(), monat = +new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", month: "numeric" }).format(jetzt);
  const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(jetzt);
  let zeit = monat >= 3 && monat <= 5 ? "fruehling" : monat >= 6 && monat <= 8 ? "sommer" : monat >= 9 && monat <= 11 ? "herbst" : "winter";
  let wetter = (window.FACHBRIEF_WETTER || {})[heute];
  for (const teil of (q.get("wetter") || "").split("-")) {
    if (["fruehling", "sommer", "herbst", "winter"].includes(teil)) zeit = teil;
    if (["sonne", "bewoelkt", "regen", "schnee"].includes(teil)) wetter = teil;
  }
  if (!["sonne", "bewoelkt", "regen", "schnee"].includes(wetter)) wetter = "sonne";
  if (wetter === "schnee" && zeit !== "winter") wetter = "regen";
  intro.dataset.zeit = zeit; intro.dataset.wetter = wetter;
  // Besondere Tage und gelegentliche Überraschungen (Regeln in werkzeuge/intro-feste.mjs). ?fest=advent oder ?fest=riesenrad zeigt
  // einen Anlass bzw. ein Element gezielt, ?fest=aus keines.
  const festeFuer = ${festeFuer.toString()};
  const hd = heute.split("-"), fest = festeFuer(new Date(+hd[0], +hd[1] - 1, +hd[2]), zeit, wetter, Math.random(), ${JSON.stringify(FERIEN)});
  let elemente = fest.elemente;
  if (q.has("fest")) {
    elemente = wetter === "schnee" ? ["schneemann"] : [];
    q.get("fest").split(",").forEach(n => { const a = fest.alle.find(x => x[0] === n); (a ? a[1] : n === "aus" ? [] : [n]).forEach(e => elemente.push(e)); });
  }
  intro.dataset.fest = elemente.join(" ");
  intro.hidden = false;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const buehne = intro.querySelector(".intro-buehne"), logo = intro.querySelector(".i-logo");
  let bild;
  const s = intro.style, grenze = x => Math.min(1, Math.max(0, x)), sanft = x => x * x * (3 - 2 * x);
  const strecke = () => intro.offsetHeight - buehne.offsetHeight;
  let offen = false;
  const rechne = () => {
    offen = false; bild = bild || document.querySelector("#kopf .marke img.logo-hell"); if (!bild || !intro.isConnected) return;
    if (fertig) { if (scrollY < strecke()) scrollTo(0, strecke()); return; }      // angekommen: kein Zurück ins Intro
    const p = grenze(scrollY / strecke()), e = sanft(p);
    s.setProperty("--p", p.toFixed(4)); s.setProperty("--e", e.toFixed(4));
    // Platz des Bildzeichens in der Kopfzeile: das linke Quadrat des Logo-Bilds
    const a = logo.getBoundingClientRect(), z = bild.getBoundingClientRect(), zx = z.left + z.height / 2, zy = z.top + z.height / 2;
    // Das Logo bleibt auf seiner Höhe stehen (die Bühne ist angeheftet, es kann also nicht ruckeln) und wird stetig
    // kleiner, je näher die Kopfzeile von unten kommt: Genau bei ihrer Ankunft hat es seine Endgröße und steht über
    // seinem Platz. Ab dann zeigt die Kopfzeile ihr eigenes Bildzeichen – das scrollt mit der Seite und sitzt fest.
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const t = grenze(1 - (zy - ay) / Math.max(1, zy + scrollY - ay)), gelandet = zy <= ay;
    const ds = 1 + (z.height / a.width - 1) * sanft(t), g = a.width * ds, mx = ax + (zx - ax) * sanft(grenze(t / .85));
    s.setProperty("--dx", (mx - g / 2 - a.left).toFixed(1) + "px");
    s.setProperty("--dy", (ay - g / 2 - a.top).toFixed(1) + "px");
    s.setProperty("--ds", ds.toFixed(4));
    s.setProperty("--ts", (1 - e * .14).toFixed(4));
    s.setProperty("--to", (1 - grenze((p - .02) / .2)).toFixed(3));
    s.setProperty("--unten", (a.bottom - (strecke() - scrollY)).toFixed(1) + "px");
    intro.classList.toggle("gelandet", gelandet);
    bild.style.clipPath = gelandet ? "" : "inset(0 0 0 13.9%)";
    bild.style.opacity = gelandet ? "" : grenze((t - .3) / .45).toFixed(3);
    buehne.style.visibility = p >= 1 ? "hidden" : "";
    if (p >= 1) { fertig = true; clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); }
  };
  // Ist die Ausgabe ganz da, verschwindet das Intro endgültig (erst wieder nach dem Neuladen). Es wird entfernt, sobald
  // das Scrollen kurz ruht – so springt nichts, auch nicht beim Schwung-Scrollen auf dem Handy.
  let fertig = false, ruhe = 0;
  const einklappen = () => {
    if (!fertig || !intro.isConnected) return;
    const rest = Math.max(0, scrollY - strecke());
    if (bild) bild.style.clipPath = bild.style.opacity = "";
    intro.remove(); scrollTo(0, rest);
  };
  addEventListener("scrollend", einklappen);
  addEventListener("scroll", () => {
    if (fertig) { clearTimeout(ruhe); ruhe = setTimeout(einklappen, 160); }
    if (!offen) { offen = true; requestAnimationFrame(rechne); }
  }, { passive: true });
  addEventListener("resize", rechne);
  // Wer am Intro auf Dunkel schaltet, bekommt die Ausgabe ohne Intro (die Szene gibt es nur hell).
  new MutationObserver(() => {
    if (document.documentElement.dataset.thema !== "dunkel" || !intro.isConnected) return;
    const bild = document.querySelector("#kopf .marke img.logo-hell"); if (bild) bild.style.clipPath = bild.style.opacity = "";
    const rest = Math.max(0, scrollY - strecke()); intro.remove(); scrollTo(0, rest);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-thema"] });
  intro.querySelector(".i-weiter").addEventListener("click", () => {
    const von = scrollY, bis = strecke(), t0 = performance.now(), dauer = 1500;
    const schritt = jetzt => { const x = grenze((jetzt - t0) / dauer); scrollTo(0, von + (bis - von) * (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)); if (x < 1) requestAnimationFrame(schritt); };
    requestAnimationFrame(schritt);
  });
  rechne(); addEventListener("DOMContentLoaded", rechne);
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
