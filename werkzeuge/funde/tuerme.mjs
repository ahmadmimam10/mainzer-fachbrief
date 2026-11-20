// Fundstücke an den Bonifaziustürmen. Sie liegen im Stadtband hinter den Häusern (wie die Türme selbst); die Maße
// kommen aus intro-boni.mjs: A = hoher Turm links (x 707…720,8, Dach y 8,6), BT = Turm rechts (x 724,2…736,1, Dach y 14,4).
// zelle(turm, geschoss, spalte) liefert ein Fenster (Geschoss 1 = unten, Spalte 0 = links).
import { A, BT, zelle, MAST, rechteck } from "../intro-boni.mjs";
import { f, am, dreh, figur, vogel, TINTE, BUNT, HAUT, kreis, L, F, E } from "./hilfen.mjs";

const ao = A.oben - .08, bo = BT.oben - .08;                                      // Dachkanten
const FUNKEL = "M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z";
const fenster = (t, n, c) => { const z = zelle(t, n, c); return rechteck(z.x, z.y + .13, t.cw, t.gh - .13); };
const pendel = (x, y, innen, w, d, v = 0) => dreh("fu-pendel", x, y, innen, `--w:${w}deg;--d:${d}s;--v:${v}s`);
// Bild aus Fenstern von Turm B: reihen = { Geschoss: [Spalten] }
const muster = (reihen, farbe, kl = "") => `<path${kl ? ` class="${kl}"` : ""} fill="${farbe}" d="${Object.entries(reihen).map(([n, cs]) => cs.map(c => fenster(BT, +n, c)).join("")).join("")}"/>`;
const DUNKEL = n => `.intro[data-funde~="${n}"] .bt-b .bt-licht{display:none}`;   // die übrigen Lichter in Turm B aus, damit das Bild zu erkennen ist

export default [
  // Diese beiden Szenen sind schon in der Seite gezeichnet (intro-boni.mjs)
  { n: "fensterputzer", ort: "boni", platz: "turm-b-fenster", dazu: ["putzer"] },
  { n: "turmflieger", ort: "boni", platz: "turm-a-wand", wetter: "sbr", dazu: ["flieger"] },

  // Fenster leuchten als Herz (immer am Valentinstag, sonst ab und zu)
  { n: "herzfenster", ort: "turm", platz: "turm-b-fenster", wetter: "sbrn", stufe: 2,
    bild: muster({ 18: [1, 3], 17: [0, 1, 2, 3, 4], 16: [0, 1, 2, 3, 4], 15: [1, 2, 3], 14: [2] }, "#ff8fab", "fu-herzf"),
    css: DUNKEL("herzfenster") + `.fu-herzf{animation:fu-herzf 1.1s ease-in-out infinite alternate}@keyframes fu-herzf{from{opacity:.55}to{opacity:1}}` },

  // Ein Smiley aus Fenstern, das zwinkert
  { n: "smiley", ort: "turm", platz: "turm-b-fenster", wetter: "sbrn", stufe: 2,
    bild: muster({ 18: [1], 16: [0, 4], 15: [1, 2, 3] }, "#ffe27a") + muster({ 18: [3] }, "#ffe27a", "fu-zwinker"),
    css: DUNKEL("smiley") + `.fu-zwinker{animation:fu-zwinker 4s steps(1,end) infinite}@keyframes fu-zwinker{0%,80%{opacity:1}81%,88%{opacity:0}89%,100%{opacity:1}}` },

  // „Snake“ in den Bürofenstern
  { n: "fensterschlange", ort: "turm", platz: "turm-b-fenster", wetter: "sbrn", stufe: 3,
    bild: (() => { let aus = "", i = 0; for (let n = 9; n <= 18; n++) for (let k = 0; k < 5; k++, i++) { const c = (n - 9) % 2 ? 4 - k : k; aus += `<path class="fu-snake" style="animation-delay:${f(i * .22 - 11)}s" d="${fenster(BT, n, c)}"/>`; }
      return aus + `<path class="fu-blink" style="--d:.5s" fill="#ff6b5e" d="${fenster(BT, 19, 2)}"/>`; })(),
    css: DUNKEL("fensterschlange") + `.fu-snake{fill:#8ee06a;opacity:0;animation:fu-snake 11s steps(1,end) infinite}@keyframes fu-snake{0%{opacity:1}12%,100%{opacity:0}}` },

  // Lichtwelle: Etage für Etage geht in Turm A das Licht an
  { n: "lichtwelle", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn", stufe: 2,
    bild: Array.from({ length: 24 }, (_, i) => `<path class="fu-welle" style="animation-delay:${f(i * .16 - 8)}s" d="${[0, 1, 2, 3, 4, 5].map(c => fenster(A, i + 1, c)).join("")}"/>`).join(""),
    css: `.fu-welle{fill:#ffe9ae;opacity:0;animation:fu-welle 8s ease-out infinite}@keyframes fu-welle{0%{opacity:0}3%{opacity:.95}14%,100%{opacity:0}}` },

  // Ein Riesenaffe am Antennenmast, ein Doppeldecker umkreist ihn
  { n: "riesenaffe", ort: "turm", platz: "turm-a-dach", stufe: 3,
    bild: am(MAST, ao - 2.5, 1, L("M-.5 -.1L-.2 -1M.7 -.1L.5 -1", "#3d3430", .5) + E(.15, -1.7, 1.05, 1.25, "#3d3430") + E(.3, -1.5, .55, .75, "#54463f") + L("M-.5 -2.2L.1 -3.3", "#3d3430", .46)
      + `<circle cx=".3" cy="-3.2" r=".66" fill="#3d3430"/>` + E(.62, -3.02, .36, .3, "#6b5a50") + `<circle cx=".5" cy="-3.36" r=".07" fill="#fff"/>` + pendel(.9, -2.4, L("M.9 -2.4L2.2 -3.5", "#3d3430", .46) + `<circle cx="2.3" cy="-3.6" r=".3" fill="#3d3430"/>`, 22, .5))
      + `<g transform="translate(${f(MAST + .6)} ${f(ao - 6)}) scale(1 .42)">` + dreh("fu-dreh", 0, 0, `<g transform="translate(5.2 0) scale(1 2.38)">` + dreh("fu-dreh", 0, 0, F("M-.9 0Q0 -.4 .9 0Q0 .4 -.9 0Z", "#d6243a") + F("M-.5 -.56H.5v.2H-.5ZM-.5 .36H.5v.2H-.5Z", "#f6efe1") + F("M-.9 0L-1.2 -.5H-.8Z", "#d6243a"), "--d:7s;animation-direction:reverse") + `</g>`, "--d:7s") + `</g>` },

  // Fassadenkletterer am Seil
  { n: "fassadenkletterer", ort: "turm", platz: "turm-b-wand", stufe: 2,
    bild: L(`M${f(BT.x + BT.w + 1.25)} ${f(BT.oben)}V46`, "#d6243a", .07) + `<g class="fu-klett">` + am(BT.x + BT.w + 1.25, 43, .4, figur({ gehen: true, mantel: "#f4c542", hose: "#3f4654", kopf: "helm", hut: "#d6243a", armV: [.3, -5.3], armH: [-.3, -5.4], schatten: false }), "fu-geht", "--takt:.6s") + `</g>`,
    css: `.fu-klett{animation:fu-klett 44s ease-in-out infinite alternate}@keyframes fu-klett{from{translate:0 0}to{translate:0 -24px}}` },

  // Yoga auf dem Dach
  { n: "dachyoga", ort: "turm", platz: "turm-b-dach", zeit: "fs", wetter: "s", stufe: 2,
    bild: F(rechteck(BT.x + 3.2, bo - 1.98, 2.2, .1), "#b07cd8") + am(BT.x + 4.3, bo - 2, .44, figur({ mantel: "#e9506b", hose: "#2f3542", kopf: "dutt", haar: "#3b2a22", armV: [.2, -6.3], armH: [-.2, -6.3], schatten: false,
      beine: L("M-.1 -2.05V-.1", "#2f3542", .5) + L("M.2 -2.05L1.1 -1.3L.1 -.95", "#2f3542", .46) }), "fu-pendel", "transform-box:view-box;transform-origin:0px 0px;--w:2.5deg;--d:2.6s") },

  // Am Mast wird geschweißt
  { n: "antennenmonteur", ort: "turm", platz: "turm-a-dach", stufe: 2,
    bild: am(MAST + .5, ao - 4.5, .42, figur({ s: -1, mantel: "#f19a4a", hose: "#3f4654", kopf: "helm", hut: "#fdfcf9", armV: [-.9, -4.4], armH: [-.3, -3], schatten: false }))
      + `<path class="fu-funkeln" fill="#fff6c8" transform="translate(${f(MAST)} ${f(ao - 6.4)}) scale(.5)" d="${FUNKEL}"/><circle class="fu-funkeln" cx="${f(MAST)}" cy="${f(ao - 6.4)}" r=".9" fill="#ffe27a" opacity=".4"/>`
      + [0, 1, 2].map(i => `<circle class="fu-auf" style="--d:.9s;--v:${-i * .3}s;--x:${(i - 1) * .9}px;--h:1.8px;--o:1" cx="${f(MAST)}" cy="${f(ao - 6.3)}" r=".09" fill="#ffd23c"/>`).join(""),
    css: `.fu-funkeln{animation:fu-funkeln 2.4s steps(1,end) infinite}@keyframes fu-funkeln{0%,8%,16%,24%,32%{opacity:1}4%,12%,20%,28%,36%,100%{opacity:0}}` },

  // Ein Falke hat auf dem Turm sein Revier
  { n: "turmfalke", ort: "turm", platz: "turm-b-dach", wetter: "sbr",
    bild: `<g class="fu-falke">` + am(BT.x + 8, bo - 1.05, .75, `<g class="fu-falke-sitz">${vogel({ s: -1, farbe: "#6b7480", bauch: "#e6dccb", schnabel: "#e8b23c" })}</g>`
      + `<g class="fu-falke-flug">` + E(0, -.6, .9, .3, "#6b7480") + F("M-.8 -.6L-1.3 -.75L-.8 -.45ZM.8 -.6L1.5 -.5L.8 -.4Z", "#6b7480") + `<g class="fu-schlag" style="--d:.24s"><path fill="#8a939d" d="M-.5 -.6Q0 -2.2 1.2 -2.4Q.7 -1.3 .6 -.6Z"/></g></g>`) + `</g>`,
    css: `.fu-falke{animation:fu-falke 14s ease-in-out infinite}@keyframes fu-falke{0%,50%,96%,100%{translate:0 0}58%{translate:-3px -4px}66%{translate:-9px -6.5px}74%{translate:-13px -3px}82%{translate:-8px .5px}90%{translate:-2.5px -2px}}
.fu-falke-sitz{animation:fu-falke-s 14s steps(1,end) infinite}.fu-falke-flug{animation:fu-falke-f 14s steps(1,end) infinite}
@keyframes fu-falke-s{0%,50%{opacity:1}51%,95%{opacity:0}96%,100%{opacity:1}}@keyframes fu-falke-f{0%,50%{opacity:0}51%,95%{opacity:1}96%,100%{opacity:0}}` },

  // Jemand winkt aus dem Fenster
  { n: "winker", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn",
    bild: (() => { const z = zelle(A, 12, 4), x = z.x + A.cw / 2, y = z.y + A.gh; return F(fenster(A, 12, 4), "#ffe2a0") + F(`M${f(x - .36)} ${f(y)}V${f(y - .32)}Q${f(x)} ${f(y - .6)} ${f(x + .36)} ${f(y - .32)}V${f(y)}Z`, "#4f8fd0")
      + `<circle cx="${f(x)}" cy="${f(y - .68)}" r=".24" fill="${HAUT[0]}"/>` + F(`M${f(x - .24)} ${f(y - .72)}a.24 .24 0 0 1 .48 0Z`, "#6b4a2e") + pendel(x + .3, y - .34, L(`M${f(x + .3)} ${f(y - .34)}L${f(x + .52)} ${f(y - .86)}`, "#4f8fd0", .12) + `<circle cx="${f(x + .54)}" cy="${f(y - .9)}" r=".08" fill="${HAUT[0]}"/>`, 24, .3); })() },

  // Freitag: In einem Büro läuft schon die Party
  { n: "bueroparty", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn", tage: "5", stufe: 2,
    bild: (() => { const z = zelle(A, 17, 1); return `<path class="fu-disco" d="${fenster(A, 17, 1) + fenster(A, 17, 2)}"/>` + [0, 1, 2, 3].map(i => `<circle cx="${f(z.x + .3 + i * .78)}" cy="${f(z.y + .66 - (i % 2) * .16)}" r=".22" fill="${BUNT[i]}"/>`).join("")
      + [0, 1, 2].map(i => `<path class="fu-auf" style="--d:2.2s;--v:${-i * .7}s;--x:${f((i - 1) * .9)}px;--h:-2.4px;--o:1" fill="${TINTE}" d="M${f(z.x + 1.2 + i * .5)} ${f(z.y - .2)}a.14 .1 0 1 1 0 -.12v-.5l.3 -.07v.14l-.22 .06v.5Z"/>`).join(""); })(),
    css: `.fu-disco{animation:fu-disco 1.6s steps(1,end) infinite}@keyframes fu-disco{0%{fill:#ff8fab}25%{fill:#8fd0ff}50%{fill:#ffe27a}75%{fill:#b79bff}}` },

  // Büroumzug: Ein Schreibtisch hängt am Haken
  { n: "schreibtisch", ort: "turm", platz: "turm-b-wand", stufe: 2,
    bild: (() => { const x = BT.x + 5.6, y = BT.oben; return L(`M${f(x - 1.2)} ${f(y + .1)}H${f(x + .3)}`, "#5f564c", .22) + `<g class="fu-tisch">` + dreh("fu-pendel", x, y, L(`M${x} ${f(y)}V${f(y + 9)}M${x} ${f(y + 9)}L${f(x - 1.1)} ${f(y + 10.2)}M${x} ${f(y + 9)}L${f(x + 1.1)} ${f(y + 10.2)}`, "#5f564c", .07)
      + F(rechteck(x - 1.3, y + 10.2, 2.6, .22), "#a9764a") + L(`M${f(x - 1.1)} ${f(y + 10.4)}V${f(y + 11.5)}M${f(x + 1.1)} ${f(y + 10.4)}V${f(y + 11.5)}`, "#8a5f38", .14) + F(rechteck(x + .2, y + 10.42, .8, .5), "#8a5f38")
      + F(rechteck(x - .9, y + 9.7, .5, .5), "#b0483c") + F(kreis(x - .65, y + 9.45, .3), "#6fa55f") + L(`M${f(x + .5)} ${f(y + 10.2)}v-.6l.4 -.2`, TINTE, .08) + F(`M${f(x + .75)} ${f(y + 9.3)}l.4 .1l-.3 .3Z`, "#f4c542"), "--w:2.5deg;--d:2.4s") + `</g>`; })(),
    css: `.fu-tisch{animation:fu-tisch 26s ease-in-out infinite alternate}@keyframes fu-tisch{from{translate:0 0}to{translate:0 12px}}` },

  // Eine kleine Wolke regnet nur auf Turm B
  { n: "regenwolke", ort: "turm", platz: "turm-b-dach", wetter: "sb", stufe: 2,
    bild: (() => { const x = BT.x + 5.4; return [0, 1, 2, 3, 4, 5].map(i => `<path class="fu-auf" style="--d:.8s;--v:${f(-i * .13)}s;--x:-.3px;--h:4.6px;--o:.9" fill="none" stroke="#7f9fb8" stroke-width=".1" stroke-linecap="round" d="M${f(x - 2.4 + i * .95)} 8v.6"/>`).join("")
      + `<g class="fu-wipp" style="--d:2.4s;--h:-.3px">` + F(kreis(x - 2, 6.7, 1.3) + kreis(x - .6, 5.9, 1.7) + kreis(x + 1.2, 6.2, 1.5) + kreis(x + 2.4, 7, 1.1) + rechteck(x - 2.4, 6.8, 5, 1.2), "#b3bdc8") + F(kreis(x - .8, 5.5, .9), "#c9d1da") + `</g>`; })() },

  // Geburtstag im Büro: Luftballons am Fenster
  { n: "geburtstag", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn",
    bild: (() => { const z = zelle(A, 9, 5), x = z.x + A.cw / 2, y = z.y + .2; return F(fenster(A, 9, 5), "#ffe2a0") + pendel(x, y, [[-.7, -1.5, 0], [.1, -1.9, 1], [.8, -1.4, 2], [-.2, -1.1, 4]].map(([dx, dy, c]) => L(`M${f(x)} ${f(y)}L${f(x + dx)} ${f(y + dy + .4)}`, "#857d70", .04) + E(x + dx, y + dy, .38, .46, BUNT[c])).join(""), 6, 1.6)
      + [0, 1, 2, 3].map(i => F(`M${f(z.x + i * .36)} ${f(z.y + A.gh)}h.3l-.15 .34Z`, BUNT[(i * 2 + 1) % 6])).join(""); })() },

  // Die Kaffee-Drohne beliefert den Balkon
  { n: "kaffeedrohne", ort: "turm", platz: "turm-a-wand", stufe: 2,
    bild: `<g class="fu-drohne"><g transform="translate(700.3 17.4)"><g class="fu-wipp" style="--d:.7s;--h:-.14px">` + pendel(0, .15, L("M0 .15V1.1", "#857d70", .05) + F("M-.2 1.1h.4l-.06 .5h-.28Z", "#fbf8f2") + F(rechteck(-.23, 1.04, .46, .08), "#5f564c"), 7, .9)
      + L("M-.8 -.05H.8M-.4 .1L-.55 .34M.4 .1L.55 .34", "#3d3934", .1) + F(rechteck(-.34, -.16, .68, .3), "#4a5560") + `<ellipse class="fu-flimmer2" cx="-.8" cy="-.2" rx=".5" ry=".06" fill="${TINTE}" opacity=".7"/><ellipse class="fu-flimmer2" cx=".8" cy="-.2" rx=".5" ry=".06" fill="${TINTE}" opacity=".7"/>`
      + `<circle class="fu-blink" style="--d:.4s" cx="0" cy="0" r=".08" fill="#8ccf7e"/></g></g></g>`,
    css: `.fu-drohne{animation:fu-drohne 18s ease-in-out infinite}@keyframes fu-drohne{0%{translate:-12px -7px;opacity:0}6%{opacity:1}22%,62%{translate:0 0;opacity:1}68%{translate:-.6px -.8px}90%{opacity:1}100%{translate:-13px -9px;opacity:0}}` },

  // Im Kopierraum blitzt es
  { n: "kopierer", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn",
    bild: (() => { const z = zelle(A, 14, 2); return `<clipPath id="fu-cp-kopierer"><path d="${fenster(A, 14, 2)}"/></clipPath>` + F(fenster(A, 14, 2), "#e9f4ec", `opacity=".8"`) + `<g clip-path="url(#fu-cp-kopierer)"><path class="fu-kopier" fill="#fff" d="${rechteck(z.x - .3, z.y, .3, A.gh)}"/></g>`; })(),
    css: `.fu-kopier{animation:fu-kopier 2.8s linear infinite}@keyframes fu-kopier{0%,10%{translate:0 0}45%{translate:1.8px 0}55%{translate:1.8px 0}90%,100%{translate:0 0}}` },

  // Eine Katze sitzt im Fenster
  { n: "fensterkatze", ort: "turm", platz: "turm-a-fenster", wetter: "sbrn",
    bild: (() => { const z = zelle(A, 10, 1), x = z.x + A.cw / 2, y = z.y + A.gh; return F(fenster(A, 10, 1), "#ffe2a0") + F(`M${f(x - .3)} ${f(y)}Q${f(x - .34)} ${f(y - .6)} ${f(x)} ${f(y - .62)}Q${f(x + .34)} ${f(y - .6)} ${f(x + .3)} ${f(y)}Z`, "#2f2b28")
      + `<circle cx="${f(x)}" cy="${f(y - .74)}" r=".2" fill="#2f2b28"/>` + F(`M${f(x - .2)} ${f(y - .8)}l.04 -.26l.14 .18ZM${f(x + .2)} ${f(y - .8)}l-.04 -.26l-.14 .18Z`, "#2f2b28") + pendel(x + .26, y, L(`M${f(x + .26)} ${f(y - .05)}q.3 .3 .2 .7`, "#2f2b28", .1), 16, 1.2); })() },
];
