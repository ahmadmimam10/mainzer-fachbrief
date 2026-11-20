#!/usr/bin/env node
// Baut das Intro „Morgen über Mainz“ in docs/index.html ein: Papierlagen-Szene (Hügel, Stadt, Ufer, Rhein) hinter den
// Logo-Teilen aus docs/bilder/intro/*.svg (Dom, Zeitung links/rechts – gleiche 128×128-Fläche wie die Sonne).
// Aufbau läuft von selbst (rund 3 s); der Weggang ist an das Scrollen gekoppelt (Bühne bleibt stehen, Ausgabe schiebt
// sich darüber, Logo dockt in der Kopfzeile an). Wiederholbar: ersetzt die markierten Blöcke INTRO-START … INTRO-ENDE.
//   node werkzeuge/intro-einbauen.mjs
import { readFileSync, writeFileSync } from "node:fs";

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
  let t = "";
  if (tupfen) { const r = zufall(3); for (let x = 8; x < B; x += 5 + r() * 16) { const g = .7 + r() * .9; t += kreis(x, y(x) - g * .3, g, g * .8); } }
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

// Uferpromenade: Laubbäume (Krone aus drei Kugeln mit hellem Fleck), Pappeln, Büsche, Laternen, Kaimauer mit heller Kante
const UFER = (() => {
  const r = zufall(5), fuss = H - 1.6, k = { a: "", b: "", hell: "", stamm: "", lampe: "" };
  for (let x = 5; x < B; x += 6.5 + r() * 8.5) {
    const art = r(), g = 2.1 + r() * 1.7, ton = r() < .42 ? "b" : "a";
    if (art < .17) {                                                     // Pappel
      const ry = g * 1.95, cy = fuss - 1 - ry;
      k.stamm += `M${f(x - .3)} ${fuss}V${f(cy)}h.6V${fuss}Z`; k[ton] += kreis(x, cy, g * .6, ry); k.hell += kreis(x - g * .16, cy - ry * .18, g * .28, ry * .62);
    } else if (art < .3) {                                               // Busch
      k[ton] += kreis(x, fuss - g * .5, g * .95, g * .62) + kreis(x + g * .85, fuss - g * .36, g * .62, g * .45); k.hell += kreis(x - g * .25, fuss - g * .72, g * .4, g * .26);
    } else {                                                             // Laubbaum
      const cy = fuss - 2.3 - g;
      k.stamm += `M${f(x - .34)} ${fuss}V${f(cy)}h.68V${fuss}ZM${f(x)} ${f(cy + g + 1.1)}l${f(g * .5)} ${f(-g * .5)}`;
      k[ton] += kreis(x, cy, g) + kreis(x - g * .64, cy + g * .34, g * .62) + kreis(x + g * .68, cy + g * .3, g * .58);
      k.hell += kreis(x - g * .3, cy - g * .32, g * .46);
    }
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
const SCHIFF = `<g class="i-schiff"><path class="s-spiegel" d="M725.5 5.3h14M728 6.2h8"/><path class="s-rumpf" d="M723.6 2.7h18.2l-1.9 2h-14.4Z"/><path class="s-aufbau" d="M727 2.7v-1.5h10.4l.9 1.5ZM729.6 1.2v-.9h4.6v.9Z"/><path class="s-linie" d="M724.6 3.5h16.4"/><path class="s-fenster" d="M728.2 1.7h1v.6h-1ZM730.4 1.7h1v.6h-1ZM732.6 1.7h1v.6h-1ZM734.8 1.7h1v.6h-1Z"/></g>`;

const WOLKE = `<svg viewBox="0 0 56 16"><path d="${kreis(12, 10, 5)}${kreis(22, 7.2, 7)}${kreis(34, 8.2, 6)}${kreis(44, 10.6, 4.4)}M9.5 10h37a2.5 2.5 0 0 1 0 5h-37a2.5 2.5 0 0 1 0-5Z"/></svg>`;
// Wolken: Lage in % der Logofläche, Breite als Vielfaches der Logobreite, Weg beim Scrollen
const WOLKEN = [
  { l: -62, t: -50, g: .5, fx: "-34vw", v: 0 }, { l: 104, t: -36, g: .38, fx: "30vw", v: .25 },
  { l: 196, t: -14, g: .46, fx: "42vw", v: .1 }, { l: -176, t: -8, g: .56, fx: "-46vw", v: .3 }, { l: 20, t: -74, g: .3, fx: "-12vw", v: .4 },
];

// Vögel: Endlage im Himmel (in % der Logofläche), Startversatz (Richtung Dom) und Größe
const VOEGEL = [
  { l: -24, t: 2, g: .13, x0: "150%", y0: "310%", fx: "-60vw", fy: "-30vh", v: 0 },
  { l: 0, t: -16, g: .09, x0: "90%", y0: "420%", fx: "-34vw", fy: "-52vh", v: .12 },
  { l: 94, t: -10, g: .15, x0: "-80%", y0: "330%", fx: "48vw", fy: "-44vh", v: .05 },
  { l: 116, t: 14, g: .085, x0: "-190%", y0: "260%", fx: "64vw", fy: "-22vh", v: .2 },
  { l: 76, t: -27, g: .065, x0: "-60%", y0: "520%", fx: "30vw", fy: "-60vh", v: .28 },
];

const buchstaben = (wort, ab) => [...wort].map((b, i) => `<i style="--i:${ab + i}">${b}</i>`).join("");

const css = `/* INTRO-START – „Morgen über Mainz“ (nur hell, nur Startseite ohne Lesezeichen) */
.intro{position:relative;z-index:0;height:200vh;height:200svh;margin-bottom:-100vh;margin-bottom:-100svh;color:#141414;--weich:cubic-bezier(.16,.84,.24,1);--fahrt:cubic-bezier(.45,.05,.2,1)}
.intro[hidden]{display:none}
.intro ~ :not(script){position:relative;z-index:1}
.intro-buehne{position:sticky;top:0;height:100vh;height:100svh;min-height:520px;overflow:hidden;background:#f6f4ef;--L:clamp(210px,56vw,340px)}
.i-mitte{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vh,22px);padding:0 14px 5vh}
.i-logo{position:relative;width:var(--L);aspect-ratio:1;perspective:900px;flex:none}
.i-welt{position:absolute;inset:0;clip-path:inset(-200vh -200vw var(--unten,-200vh) -200vw)}
.i-vorn{opacity:calc(var(--p,0) * 3.4)}
.i-kante{position:absolute;left:-200vw;right:-200vw;bottom:var(--unten,-200vh);height:110px;background:linear-gradient(rgba(246,244,239,0),#f6f4ef)}
.i-himmel,.i-boden{position:absolute;left:50%;width:300vw;height:160vh;margin-left:-150vw}
.i-himmel{bottom:39.45%;background:linear-gradient(to top,#fbe6d8 0,#f9ede3 16vh,#f1f2ef 40vh,#e9f0f3 78vh);opacity:calc(1 - var(--e,0))}
.i-himmel::after,.i-boden::after{content:"";position:absolute;inset:0;opacity:0;animation:i-aus 1.9s ease-in-out .3s both}
.i-himmel::after{background:linear-gradient(to top,#ecd8d0 0,#dcdbe3 24vh,#c6cedb 78vh)}
.i-boden{top:60.55%;background:linear-gradient(#d9e6ed 0,#e7eef0 8vh,#f6f4ef 24vh);translate:0 calc(var(--e,0) * 72vh)}
.i-boden::after{background:linear-gradient(#c2cddb 0,#d2dae3 12vh,#e2e6ea 44vh)}
.i-boden svg{position:absolute;left:50%;top:0;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);height:auto;overflow:visible;z-index:1;animation:i-wasser 11s ease-in-out infinite alternate}
.i-boden path{fill:none;stroke:#b3cad8;stroke-width:.42;stroke-linecap:round}
.i-boden .w-hell{stroke:#fff;stroke-width:.5;opacity:.85}
.i-boden .w-ufer{fill:#aebfc9;stroke:none;opacity:.5}
.i-boden .w-ufer2{fill:#aebfc9;stroke:none;opacity:.22}
.i-schiff{animation:i-schiff 70s ease-in-out infinite alternate}
.i-schiff .s-rumpf{fill:#fdfcf8;stroke:#8f9aa1;stroke-width:.22}
.i-schiff .s-aufbau{fill:#ebe6dc;stroke:#8f9aa1;stroke-width:.2}
.i-schiff .s-linie{stroke:#c8102e;stroke-width:.34;opacity:.75}
.i-schiff .s-fenster{fill:#7f8f99;stroke:none}
.i-schiff .s-spiegel{stroke:#fff;stroke-width:.5;opacity:.8}
.i-licht{position:absolute;left:50%;top:60.55%;width:0;height:0;opacity:calc(1 - var(--p,0) * 1.5);scale:calc(1 + var(--e,0) * 1.4)}
.i-schein,.i-strahlen{position:absolute;border-radius:50%;aspect-ratio:1}
.i-schein{width:calc(var(--L) * 4.2);margin:calc(var(--L) * -2.1);background:radial-gradient(closest-side,rgba(226,70,60,.26),rgba(240,140,96,.13) 36%,rgba(246,200,160,0) 72%);animation:i-schein 1.7s var(--weich) .75s both}
.i-strahlen{width:calc(var(--L) * 5.6);margin:calc(var(--L) * -2.8);animation:i-ein 1.4s ease 1.5s both}
.i-strahlen::before,.i-strahlen::after{content:"";position:absolute;inset:0;border-radius:50%;
  -webkit-mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%);mask:radial-gradient(closest-side,transparent 24%,#000 36%,transparent 100%)}
.i-strahlen::before{background:repeating-conic-gradient(rgba(203,8,56,0) 0deg,rgba(203,8,56,.05) 2.4deg,rgba(203,8,56,0) 4.8deg,rgba(203,8,56,0) 15deg);animation:i-drehen 140s linear infinite}
.i-strahlen::after{background:repeating-conic-gradient(from 6deg,rgba(244,160,96,0) 0deg,rgba(244,160,96,.06) 4deg,rgba(244,160,96,0) 8deg,rgba(244,160,96,0) 22.5deg);animation:i-drehen 200s linear infinite reverse}
.i-wolke{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx)) calc(var(--e,0) * -8vh);opacity:calc(1 - var(--p,0) * 1.8)}
.i-wolke svg{display:block;width:100%;height:auto;fill:#fffdf9;opacity:.82;animation:i-wolke 2.2s var(--weich) calc(.5s + var(--v)) both,i-zieh 46s ease-in-out calc(2.8s + var(--v) * 9) infinite alternate}
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
.i-huegel{--k:.08}.i-huegel svg{fill:#dfe4dc;--z:1.16;animation:i-zoom 2.5s var(--fahrt) both}
.i-huegel2{--k:.18}.i-huegel2 svg{fill:#d3dac8;--z:1.3;animation:i-zoom 2.5s var(--fahrt) both}.i-huegel2 .i-tupfen{fill:#c2cdb6}
.i-fern{--k:.4}.i-fern svg{fill:#d3ccc1;--z:1.5;--ab:0s}.i-fern .i-dach{fill:#c7bfb4}.i-fern .i-fenster{fill:#e1dcd4}.i-fern .i-lichter{fill:#f3e3bd}
.i-stadt{--k:1}.i-stadt svg{fill:#bcb3a6;--z:1.9;--ab:.12s}.i-stadt .i-dach{fill:#a89d90}.i-stadt .i-patina{fill:#9fb5a7}.i-stadt .i-fenster{fill:#d6cfc4}.i-stadt .i-lichter{fill:#f8dfa2}
.i-ufer{--k:2.2}.i-ufer svg{fill:#a8a092;--z:2.5;--ab:.26s}
.i-ufer .b-a{fill:#8da582}.i-ufer .b-b{fill:#7f9a78}.i-ufer .b-hell{fill:#a8bb9b}.i-ufer .b-stamm{fill:#8a7d6e;stroke:#8a7d6e;stroke-width:.3}.i-ufer .b-lampe{fill:#857d70}.i-ufer .b-kante{fill:#bcb4a7}
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
@keyframes i-wolke{from{transform:translateX(calc(var(--fx) * .25));opacity:0}}
@keyframes i-zieh{to{transform:translateX(16%)}}
@keyframes i-schiff{from{transform:translateX(5px)}to{transform:translateX(-9px)}}
@keyframes i-wasser{from{transform:translateX(-1.2%)}to{transform:translateX(1.2%)}}
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
const stadtBand = (kl, b, id, oben, unten) => svgBand(kl, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="${oben}"/><stop offset="1" stop-color="${unten}"/></linearGradient></defs>`
  + `<path fill="url(#${id})" d="${b.umriss}"/><path class="i-dach" d="${b.dach}"/>${b.patina ? `<path class="i-patina" d="${b.patina}"/>` : ""}<path class="i-fenster" d="${b.fenster}"/><path class="i-lichter" d="${b.licht}"/>`);

const html = `<!-- INTRO-START -->
<section class="intro" id="intro" hidden aria-label="Mainzer Fachbrief">
 <div class="intro-buehne">
  <div class="i-mitte">
    <div class="i-logo" aria-hidden="true">
      <div class="i-welt">
      <div class="i-himmel"></div>
      <div class="i-licht"><div class="i-schein"></div><div class="i-strahlen"></div></div>
      <div class="i-l i-sonne"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#i-horizont)"><path d="M5.5 77.5a58.5 58.5 0 0 1 117 0Z"/></g></svg></div>
      ${WOLKEN.map(w => `<div class="i-wolke" style="left:${w.l}%;top:${w.t}%;--g:${w.g};--fx:${w.fx};--v:${w.v}s">${WOLKE}</div>`).join("\n      ")}
      ${svgBand("i-huegel", `<path d="${HUEGEL_FERN.d}"/>`)}
      ${svgBand("i-huegel2", `<path d="${HUEGEL_NAH.d}"/><path class="i-tupfen" d="${HUEGEL_NAH.t}"/>`)}
      ${stadtBand("i-fern", FERN, "i-dunst1", "#cdc6bb", "#ddd7ce")}
      ${stadtBand("i-stadt", STADT, "i-dunst2", "#b4ab9e", "#c8c0b5")}
      ${svgBand("i-ufer", `<path class="b-lampe" d="${UFER.lampe}"/><path class="b-stamm" d="${UFER.stamm}"/><path class="b-a" d="${UFER.a}"/><path class="b-b" d="${UFER.b}"/><path class="b-hell" d="${UFER.hell}"/><path d="M0 ${H}V${H - 1.6}H${B}V${H}Z"/><path class="b-kante" d="M0 ${H - 1.6}H${B}v.45H0Z"/>`)}
      <div class="i-boden"><svg viewBox="0 0 ${B} 50"><path class="w-ufer" d="M0 0H${B}V1.3H0Z"/><path class="w-ufer2" d="M0 1.3H${B}V3.4H0Z"/><path d="${WASSER.blau}"/><path class="w-hell" d="${WASSER.weiss}"/>${SCHIFF}</svg></div>
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
  <button type="button" class="i-weiter">Zur Ausgabe<i aria-hidden="true">↓</i></button>
 </div>
</section>
<script>
/* Intro auf der Startseite ohne Ressort-Lesezeichen, nur hell; ?intro erzwingt es. ?zeit=1.5 / ?p=0.5 = Standbilder für Entwürfe. */
(() => {
  const intro = document.getElementById("intro");
  const q = new URLSearchParams(location.search);
  const startseite = !location.hash && !q.has("ausgabe") && !q.has("ansicht") && !q.has("q");
  const hell = document.documentElement.dataset.thema !== "dunkel";
  if (!(q.has("intro") || (startseite && hell))) { intro.remove(); return; }
  intro.hidden = false;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const buehne = intro.querySelector(".intro-buehne"), logo = intro.querySelector(".i-logo");
  let bild;
  const s = intro.style, grenze = x => Math.min(1, Math.max(0, x)), sanft = x => x * x * (3 - 2 * x);
  const strecke = () => intro.offsetHeight - buehne.offsetHeight;
  let offen = false;
  const rechne = () => {
    offen = false; bild = bild || document.querySelector("#kopf .marke img.logo-hell"); if (!bild || !intro.isConnected) return;
    const p = grenze(scrollY / strecke()), e = sanft(p);
    s.setProperty("--p", p.toFixed(4)); s.setProperty("--e", e.toFixed(4));
    // Platz des Bildzeichens in der Kopfzeile: das linke Quadrat des Logo-Bilds
    const a = logo.getBoundingClientRect(), z = bild.getBoundingClientRect(), zx = z.left + z.height / 2, zy = z.top + z.height / 2;
    // 1. Das Logo schrumpft zügig an Ort und Stelle und gleitet seitlich über seinen späteren Platz.
    // 2. Es wartet dort auf seiner Höhe, bis die Kopfzeile von unten ankommt, und fährt dann mit ihr nach oben –
    //    weich angesetzt, aber nie tiefer als sein Platz neben dem Schriftzug.
    const ds = 1 + (z.height / a.width - 1) * sanft(grenze(p / .5)), g = a.width * ds;
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2 - e * buehne.offsetHeight * .05, k = 16;
    let mx = ax + (zx - ax) * sanft(grenze((p - .05) / .5));
    let my = -k * Math.log(Math.exp(-ay / k) + Math.exp(-zy / k));
    if (p > .999) { mx = zx; my = zy; }
    s.setProperty("--dx", (mx - g / 2 - a.left).toFixed(1) + "px");
    s.setProperty("--dy", (my - g / 2 - a.top).toFixed(1) + "px");
    s.setProperty("--ds", ds.toFixed(4));
    s.setProperty("--ts", (1 - e * .14).toFixed(4));
    s.setProperty("--to", (1 - grenze((p - .02) / .2)).toFixed(3));
    s.setProperty("--unten", (a.bottom - (strecke() - scrollY)).toFixed(1) + "px");
    bild.style.clipPath = p < 1 ? "inset(0 0 0 13.9%)" : "";
    bild.style.opacity = p < 1 ? grenze((p - .2) / .4).toFixed(3) : "";
    buehne.style.visibility = p >= 1 ? "hidden" : "";
  };
  addEventListener("scroll", () => { if (!offen) { offen = true; requestAnimationFrame(rechne); } }, { passive: true });
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
