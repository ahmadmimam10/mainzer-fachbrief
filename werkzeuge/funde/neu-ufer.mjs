// Fundstücke am Rheinufer, Teil 3 (für den Jahreskalender 2027): 50 weitere Szenen, Leute und Tiere.
// Bauweise wie in ufer-szenen.mjs: um x = 0 gezeichnet, höchstens 16 breit, Boden bei y = 0.
import { f, am, dreh, fahrt, hinher, figur, vogel, rad, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E, schatten, amUfer, FUSS } from "./hilfen.mjs";
import { hund, geht, steht, pendel, ente } from "./ufer-leute.mjs";

const NOTE = "M0 0a.34 .25 0 1 1 -.02 -.3V-1.5l.8 -.2v.36l-.6 .16V0";
const HERZ = "M0 .9C-.8 .3 -1 -.1 -1 -.4C-1 -.75 -.75 -1 -.45 -1C-.25 -1 -.1 -.88 0 -.7C.1 -.88 .25 -1 .45 -1C.75 -1 1 -.75 1 -.4C1 -.1 .8 .3 0 .9Z";
const auf = (innen, { d = 4, v = 0, x = .6, h = -4, o = .9 } = {}) => `<g class="fu-auf" style="--d:${d}s;--v:${v}s;--x:${x}px;--h:${h}px;--o:${o}">${innen}</g>`;
const wipp = (innen, d = 1.2, h = -.3, v = 0) => `<g class="fu-wipp" style="--d:${d}s;--h:${h}px;--v:${v}s">${innen}</g>`;
const huepf = (innen, d = 2, h = -1, v = 0, x = 0) => `<g class="fu-huepf" style="--d:${d}s;--h:${h}px;--x:${x}px;--v:${v}s">${innen}</g>`;
const U = (b, innen) => amUfer(schatten(b) + innen);
const tisch = (x, b = 2.4, h = 2.6, farbe = "#9a6e44") => F(rechteck(x - b / 2, -h, b, .28), farbe) + L(`M${f(x - b / 2 + .3)} ${f(-h + .2)}V0M${f(x + b / 2 - .3)} ${f(-h + .2)}V0`, "#5f564c", .2);
const hocker = x => F(rechteck(x - .7, -2.1, 1.4, .22), "#8a5f38") + L(`M${f(x - .5)} -1.9V0M${f(x + .5)} -1.9V0`, "#5f564c", .18);
const bude = (x, b, h, wand, dach, streif) => F(rechteck(x - b / 2, -h * .46, b, h * .46), wand) + F(`M${f(x - b / 2 - .5)} ${f(-h + .9)}L${f(x - b / 2 + .3)} ${-h}H${f(x + b / 2 - .3)}L${f(x + b / 2 + .5)} ${f(-h + .9)}Z`, dach)
  + F(Array.from({ length: Math.floor(b / 1.4) }, (_, i) => `M${f(x - b / 2 - .3 + i * 1.4 + .35)} ${f(-h + .9)}L${f(x - b / 2 + i * 1.4 + .75)} ${-h}h.7L${f(x - b / 2 - .3 + i * 1.4 + 1.05)} ${f(-h + .9)}Z`).join(""), streif) + L(`M${f(x - b / 2 + .2)} ${f(-h + .9)}V${f(-h * .46)}M${f(x + b / 2 - .2)} ${f(-h + .9)}V${f(-h * .46)}`, "#8a7d6e", .18);
const ball = (x, y, r, farbe = "#fdfcf9") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${farbe}" stroke="${TINTE}" stroke-width=".06"/>`;
const noten = (x, y) => auf(am(x, y, .7, F(NOTE, "#5f564c")), { d: 3.4, h: -3, x: .8 }) + auf(am(x + .9, y + .2, .6, F(NOTE, "#5f564c")), { d: 3.4, v: -1.6, h: -3.2, x: -.5 });
const kind = (x, o = {}, kl = "", stil = "") => steht(x, o, .95, kl, stil);

export default [
  // Postbotin leert den gelben Briefkasten
  { n: "postbotin", ort: "ufer", platz: "ufer-*",
    bild: U(2.8, F(rechteck(2.45, -1.3, .3, 1.3), "#857d70") + F("M1.6 -3.2Q2.6 -3.8 3.6 -3.2V-1.3H1.6Z", "#f4c542") + F(rechteck(1.95, -2.75, 1.3, .16), TINTE) + F("M2.2 -2.3h.8v.5h-.8Z", "#fdfcf9")
      + steht(-.3, { mantel: "#f4c542", hose: "#2f3f6b", kopf: "kappe", hut: "#2f3f6b", haar: "#6b4a2e", armV: [1.4, -2.6], klV: "fu-pendel", hinten: F("M-1.2 -3.2h.9v1.5h-.9Z", "#8a5f38") })) },

  // Straßenkehrer mit Besen
  { n: "strassenkehrer", ort: "ufer", platz: "ufer-*",
    bild: U(2.6, steht(-.8, { mantel: "#f19a4a", hose: "#4b5261", kopf: "kappe", hut: "#f19a4a", armV: [1, -2.4], armH: [.7, -3] })
      + pendel(.4, -3.6, L("M.3 -3.9L2.2 -.3", "#9a6e44", .18) + F("M1.6 -.5L2.9 -.2L2.7 .05L1.4 -.2Z", "#c9a67c"), 9, .7)
      + auf(E(3.2, -.3, .5, .3, "#b9b1a3"), { d: 1.4, h: -.6, x: 1.2, o: .5 }) + F(kreis(4.4, -.2, .28) + kreis(4.9, -.14, .2), "#c98a3a")) },

  // Brautpaar spaziert vorbei, Herzen steigen auf
  { n: "hochzeitspaar", ort: "ufer", platz: "ufer-weg", zeit: "fsh", stufe: 2, spiegeln: true,
    bild: hinher(geht(-1, { mantel: "#fdfcf9", rock: true, kopf: "dutt", haar: "#6b4a2e", haut: HAUT[2], schuh: "#fdfcf9", inHand: F(kreis(.7, -2.4, .34), "#e9506b") + F(kreis(.95, -2.2, .26), "#f4c542") }, 1.3, .62)
      + geht(1, { mantel: "#2f3542", hose: "#2f3542", kopf: "kurz", haar: "#262321", haut: HAUT[1] }, 1.3, .62)
      + auf(am(0, -7.4, .5, F(HERZ, "#e9506b")), { d: 3, h: -3 }) + auf(am(.8, -7, .36, F(HERZ, "#f19a4a")), { d: 3, v: -1.4, h: -3.4, x: -.6 }), { von: 520, bis: 572, d: 46, y: FUSS }) },

  // Zwillingswagen
  { n: "zwillingswagen", ort: "ufer", platz: "ufer-weg", spiegeln: true,
    bild: hinher(geht(-2.2, { mantel: "#3f7a52", hose: "#4b5261", kopf: "lang", haar: "#8a5a34", armV: [1.2, -2.6] }, 1.3, .56)
      + L("M-.6 -3.3L.6 -2.4", "#857d70", .16) + F("M.4 -2.6H4.2V-1.1H.4Z", "#5f8fb5") + F("M.4 -2.6Q.4 -4 2.2 -4V-2.6Z", "#4a7399") + F("M2.4 -2.6Q2.4 -4 4.2 -4V-2.6Z", "#4a7399")
      + `<circle cx="1.5" cy="-2.9" r=".42" fill="${HAUT[0]}"/><circle cx="3.5" cy="-2.9" r=".42" fill="${HAUT[3]}"/>` + rad(1, -.5, .5, { d: .9, speichen: 4 }) + rad(3.6, -.5, .5, { d: .9, speichen: 4 }), { von: 712, bis: 752, d: 44, y: FUSS }) },

  // Kind auf dem Tretroller
  { n: "rollerkind", ort: "ufer", platz: "ufer-weg",
    bild: fahrt(am(0, 0, 1, schatten(1.6) + rad(-1.1, -.34, .34, { d: .5, speichen: 4 }) + rad(1.1, -.34, .34, { d: .5, speichen: 4 }) + L("M-1.1 -.36H1.1L.9 -3.2M.5 -3.2H1.3", "#e9506b", .16)
      + am(-.2, -.45, .95, figur({ mantel: "#6fb0e6", hose: "#2f3542", kopf: "helm", hut: "#f4c542", armV: [1.1, -2.8], schatten: false }))), { von: 500, bis: 780, d: 24, v: -6, y: FUSS }) },

  // Einradfahrer mit ausgebreiteten Armen
  { n: "einrad", ort: "ufer", platz: "ufer-weg", stufe: 2, spiegeln: true,
    bild: hinher(am(0, 0, 1, schatten(1.1) + rad(0, -.8, .8, { d: 1, speichen: 6 }) + L("M0 -.8V-2.6", "#857d70", .16) + F(rechteck(-.5, -2.75, 1, .2), TINTE)
      + pendel(0, -.8, am(0, -.5, 1.1, figur({ mantel: "#b07cd8", hose: "#2f3542", kopf: "kappe", hut: "#f4c542", armV: [1.5, -3.6], armH: [-1.5, -3.6], beine: L("M-.2 -2L-.3 -.9M.2 -2L.3 -.4", "#2f3542", .5), schatten: false })), 4, .9)), { von: 710, bis: 750, d: 30, y: FUSS }) },

  // Stelzenläuferin
  { n: "stelzenlaeufer", ort: "ufer", platz: "ufer-weg", zeit: "fsh", stufe: 2, spiegeln: true,
    bild: hinher(am(0, 0, 1, schatten(1.4) + `<g class="fu-geht" style="--takt:.7s">` + dreh("fu-b1", .3, -5.6, L("M.3 -5.6V-.1", "#d6243a", .34)) + dreh("fu-b2", -.3, -5.6, L("M-.3 -5.6V-.1", "#f4c542", .34)) + `</g>`
      + am(0, -3.4, 1.2, figur({ mantel: "#e9506b", hose: "#d6243a", kopf: "hut", hut: "#6fb0e6", haar: "#f19a4a", armV: [1.4, -3.4], armH: [-1.3, -3.2], beine: "", schatten: false, inHand: ball(1.4, -3.9, .4, "#f4c542") }))), { von: 524, bis: 570, d: 50, y: FUSS }) },

  // Saxophonist
  { n: "saxophonist", ort: "ufer", platz: "ufer-*", wetter: "sb",
    bild: U(2.2, wipp(steht(0, { mantel: "#2f3542", hose: "#4b5261", kopf: "hut", hut: "#2f3542", haut: HAUT[3], haar: "#262321", armV: [.9, -2.5], armH: [.6, -3], vorn: L("M.5 -4.2Q1.3 -3.4 1 -2.2Q.9 -1.5 1.6 -1.6", "#e0b032", .32) + F(kreis(1.75, -1.75, .34), "#e0b032") }), 1.1, -.18)
      + noten(2.6, -5.6) + F("M-3.4 -.5H-1.6L-1.9 0H-3.1Z", "#5f564c") + F(kreis(-2.7, -.5, .14) + kreis(-2.3, -.52, .12), "#f4c542")) },

  // Akkordeonspielerin auf dem Hocker
  { n: "akkordeon", ort: "ufer", platz: "ufer-*", zeit: "fsh",
    bild: U(2.2, hocker(0) + am(0, -.35, 1.25, figur({ sitzen: true, mantel: "#8a5f8a", hose: "#3f3a44", kopf: "dutt", haar: "#c9c2b8", haut: HAUT[2], armV: [1.4, -2.9], armH: [.3, -2.9], schatten: false,
      vorn: F("M.2 -3.6h.5v1.6h-.5Z", "#d6243a") + `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:0 50%;--w:0deg">` + F("M.7 -3.5L1.3 -3.6V-1.9L.7 -2Z", "#fdfcf9") + L("M.9 -3.5V-2M1.1 -3.55V-1.95", "#b9b1a3", .05) + `</g>` + F("M1.3 -3.7h.5v1.9h-.5Z", "#d6243a") }))
      + noten(2.4, -5.2)) },

  // Zwei beim Schach
  { n: "schachspieler", ort: "ufer", platz: "ufer-*", zeit: "fsh", wetter: "sb",
    bild: U(4.4, tisch(0, 2.6, 2.5) + F(rechteck(-.9, -2.62, 1.8, .1), "#fdfcf9") + F("M-.9 -2.62h.45v.1h-.45ZM0 -2.62h.45v.1H0Z", TINTE) + L("M-.5 -2.62v-.5M.1 -2.62v-.4M.6 -2.62v-.6", TINTE, .14) + L("M-.2 -2.62v-.45", "#fdfcf9", .14)
      + hocker(-2.6) + am(-2.6, -.35, 1.25, figur({ sitzen: true, mantel: "#5f7a5a", hose: "#4b5261", kopf: "kappe", hut: "#8a7d6e", haar: "#c9c2b8", armV: [1.5, -2.5], klV: "fu-pendel", schatten: false }))
      + hocker(2.6) + am(2.6, -.35, 1.25, figur({ s: -1, sitzen: true, mantel: "#b5651d", hose: "#3f3a44", kopf: "glatze", haut: HAUT[1], armV: [-.7, -4.3], schatten: false }))) },

  // Kaffeerad: Espresso vom Lastenrad
  { n: "kaffeerad", ort: "ufer", platz: "ufer-*", wetter: "sb",
    bild: U(4, rad(-2.6, -.9, .9, { d: 9 }) + rad(2.9, -.9, .9, { d: 9 }) + F("M-1.6 -3.2H2.2V-1H-1.6Z", "#6b4a32") + F("M-1.8 -3.4H2.4V-3.1H-1.8Z", "#3d2c1f") + F("M-1.2 -4.4h.9v1h-.9Z", "#b9b1a3") + F("M.2 -3.9h.5v.5h-.5ZM1 -3.9h.5v.5H1Z", "#fdfcf9")
      + L("M-1.6 -3.6L-2.9 -4.6V-5M2.9 -.9V-3", "#857d70", .14) + F("M-3.6 -5.1Q-1 -6.3 1.8 -5.1Z", "#e9d9b8") + auf(E(-.7, -4.8, .3, .4, "#fff"), { d: 2.6, h: -1.6, o: .6 })
      + steht(4.4, { s: -1, mantel: "#4a7399", hose: "#2f3542", kopf: "zopf", haar: "#262321", haut: HAUT[1], armV: [-1.1, -3], inHand: F("M-1.3 -3.5h.4l-.06 .6h-.28Z", "#fdfcf9") })) },

  // Brezelstand
  { n: "brezelstand", ort: "ufer", platz: "ufer-*",
    bild: U(3.4, bude(-.6, 5, 6.2, "#c98a3a", "#fdfcf9", "#c8102e") + [-2.2, -1, .2].map((x, i) => L(`M${x} -3.3q.5 -.9 1 0q-.5 .8 -1 0M${f(x + .2)} -3.1q.3 .5 .6 0`, "#a8672a", .16)).join("")
      + am(-.6, 0, 1.15, figur({ mantel: "#fdfcf9", hose: "#4b5261", kopf: "muetze", hut: "#fdfcf9", haar: "#6b4a2e", armV: [1.2, -3.2], klV: "fu-pendel", schatten: false, beine: "" }))
      + F(rechteck(-3.1, -2.85, 5, 2.85), "#c98a3a") + F(rechteck(-3.1, -2.85, 5, .26), "#a8672a") + kind(3.4, { s: -1, mantel: "#8ccf7e", hose: "#4b5261", kopf: "zopf", haar: "#8a5a34", armV: [-1.1, -3.3] })) },

  // Fastnachter mit Narrenkappe und Fahne (in der fünften Jahreszeit)
  { n: "fastnachter", ort: "ufer", platz: "ufer-*", zeit: "w",
    bild: U(2.2, pendel(.9, -3.2, L("M.9 -3.2V-9", "#857d70", .16) + F("M.9 -9H4.4V-7.9H.9Z", "#c8102e") + F("M.9 -7.9H4.4V-6.8H.9Z", "#fdfcf9") + F("M.9 -6.8H4.4V-5.7H.9Z", "#2f5fb5") + F("M.9 -5.7H4.4V-4.6H.9Z", "#f4c542"), 5, 1.4)
      + steht(0, { mantel: "#c8102e", hose: "#2f5fb5", kopf: "kurz", haar: "#6b4a2e", armV: [.7, -2.4], vorn: F("M-.7 -5.2Q-.2 -6.6 .9 -6.3L.7 -5.2Z", "#f4c542") + F("M-.7 -5.2L.7 -5.2L.6 -5.5L-.6 -5.5Z", "#2f5fb5") + ball(.95, -6.35, .2, "#c8102e") })) },

  // Mainzer Schwellkopp
  { n: "schwellkopp", ort: "ufer", platz: "ufer-weg", zeit: "w", stufe: 3, spiegeln: true,
    bild: hinher(wipp(am(0, 0, 1.3, figur({ mantel: "#2f5fb5", hose: "#c8102e", kopf: "glatze", haut: "#f0c9a8", armV: [1.1, -2.2], armH: [-1.1, -2.2], gehen: true, takt: .6 }), "fu-geht", "--takt:.6s")
      + E(.1, -7.6, 2.5, 2.9, "#f0c9a8") + F("M-2.2 -8.6Q.1 -11.6 2.5 -8.6Q.2 -9.4 -2.2 -8.6Z", "#6b4a2e") + E(1.2, -7.9, .28, .36, "#fdfcf9") + `<circle cx="1.3" cy="-7.9" r=".14" fill="${TINTE}"/>` + E(2.3, -7.2, .7, .5, "#e9a58c") + L("M.6 -6Q1.5 -5.3 2.2 -6.1", "#a8472b", .2) + E(.2, -6.7, .5, .36, "#e9506b", 'opacity=".5"'), .6, -.25), { von: 520, bis: 574, d: 60, y: FUSS }) },

  // Gardist mit Trommel
  { n: "gardist", ort: "ufer", platz: "ufer-weg", zeit: "w", stufe: 2, spiegeln: true,
    bild: hinher(geht(0, { mantel: "#2f5fb5", hose: "#fdfcf9", kopf: "hut", hut: "#2f5fb5", haar: "#262321", armV: [1, -2.6], klV: "fu-pendel", vorn: F("M-.66 -3.5L.66 -2.2M.66 -3.5L-.66 -2.2", "none") + L("M-.6 -3.5L.6 -2.3M.6 -3.5L-.6 -2.3", "#fdfcf9", .16) + E(1.05, -2.1, .5, .62, "#c8102e") + E(1.05, -2.1, .34, .46, "#fdfcf9"), inHand: L("M.9 -2.9L1.2 -2.3", "#9a6e44", .1) }, 1.3, .5)
      + am(.1, -7.5, .5, F("M0 -2.4Q.6 -1.2 0 0Q-.6 -1.2 0 -2.4Z", "#f4c542")), { von: 706, bis: 754, d: 40, y: FUSS }) },

  // Zwei mit Walking-Stöcken
  { n: "nordic-walking", ort: "ufer", platz: "ufer-weg", spiegeln: true,
    bild: hinher([[-1.4, "#e9506b", "zopf", "#c9c2b8"], [1.3, "#8ccf7e", "kappe", "#8a7d6e"]].map(([x, farbe, kopf, haar], i) => geht(x, { mantel: farbe, hose: "#2f3542", kopf, hut: "#fdfcf9", haar, armV: [1.1, -2.8], armH: [-.9, -2.6], inHand: L("M1.1 -2.8L1.9 0", "#857d70", .08), hinten: L("M-.9 -2.6L-1.9 0", "#857d70", .08) }, 1.3, .38 + i * .02)).join(""), { von: 700, bis: 756, d: 36, y: FUSS }) },

  // Yoga am Ufer: der Baum
  { n: "yoga", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "sb",
    bild: U(2, F(rechteck(-2.2, -.14, 4.4, .14), "#b07cd8") + wipp(am(0, -.14, 1.3, figur({ mantel: "#6fb0e6", hose: "#2f3542", kopf: "dutt", haar: "#6b4a2e", armV: [.2, -6.3], armH: [-.2, -6.3], schatten: false,
      beine: L("M-.2 -2.05V-.15", "#2f3542", .5) + L("M.25 -2.05L1 -1.3L.1 -.9", "#2f3542", .46) + E(-.05, -.08, .42, .17, TINTE) })), 2.6, -.1)) },

  // Seilspringen
  { n: "seilspringen", ort: "ufer", platz: "ufer-*", zeit: "fsh", wetter: "sb",
    bild: U(1.6, `<g class="fu-seil">` + L("M-1.1 -2Q0 2.2 1.1 -2", "#e9506b", .1) + `</g>` + huepf(kind(0, { mantel: "#f4c542", hose: "#4a7399", kopf: "zopf", haar: "#8a5a34", armV: [1.15, -2.1], armH: [-1.15, -2.1] }), .9, -.7)),
    css: `.fu-seil{transform-box:fill-box;transform-origin:50% 0;animation:fu-seil .9s linear infinite}@keyframes fu-seil{0%,100%{scale:1 1}50%{scale:1 -2.2}}` },

  // Hüpfkästchen
  { n: "huepfkaestchen", ort: "ufer", platz: "ufer-*", zeit: "fsh", wetter: "sb",
    bild: U(1.2, L("M-3.6 -.06H3.4M-2.4 -.2V.06M-1.2 -.2V.06M0 -.2V.06M1.2 -.2V.06M2.4 -.2V.06", "#fdfcf9", .1) + huepf(kind(-3, { mantel: "#e9506b", hose: "#2f3542", kopf: "zopf", haar: "#262321", haut: HAUT[3], armV: [1, -3.4], armH: [-1, -3.3], beine: L("M0 -2.05V-.2", "#2f3542", .5) + E(.16, -.1, .42, .17, TINTE) }), 1.3, -1.1, 0, 2.4)
      + kind(4.4, { s: -1, mantel: "#8ccf7e", hose: "#4b5261", kopf: "kappe", hut: "#f19a4a", armV: [-.9, -3.6] })) },

  // Kreidebild auf dem Pflaster
  { n: "kreidebild", ort: "ufer", platz: "ufer-*", zeit: "fsh", wetter: "sb",
    bild: U(1.2, E(1.6, -.05, 2.6, .16, "#f4c542", 'opacity=".9"') + E(.6, -.05, .7, .1, "#e9506b") + E(2.5, -.05, .8, .1, "#6fb0e6") + E(1.6, -.05, .5, .08, "#8ccf7e")
      + am(-1.6, 0, .95, figur({ mantel: "#b07cd8", hose: "#4a7399", kopf: "lang", haar: "#f19a4a", armV: [1.5, -.5], klV: "fu-pendel", beine: L("M-.2 -2L.9 -1.9L.9 -.1M.2 -2L-.9 -.2", "#4a7399", .5), schatten: false })) + F(rechteck(-3.8, -.5, .9, .5), "#fdfcf9") + L("M-3.6 -.5v-.3M-3.3 -.5v-.34M-3.05 -.5v-.28", "#e9506b", .14)) },

  // Pantomime in der unsichtbaren Kiste
  { n: "pantomime", ort: "ufer", platz: "ufer-*", stufe: 2, wetter: "sb",
    bild: U(2, steht(0, { mantel: "#2f3542", hose: "#2f3542", kopf: "hut", hut: "#2f3542", haut: "#fdfcf9", haar: "#262321", armV: [1.5, -4.1], armH: [-1.5, -3.5], klV: "fu-wipp", klH: "fu-wipp", vorn: F("M-.66 -3.5h1.32v.24h-1.32ZM-.68 -3h1.36v.24h-1.36ZM-.7 -2.5h1.4v.24h-1.4Z", "#fdfcf9") })
      + L("M2.3 -7V-.4M-2.3 -7V-.4", "#fff", .06, 'stroke-dasharray=".3 .5" opacity=".7"') + F("M-4 -.5H-2.9L-3.1 0H-3.8Z", "#5f564c")) },

  // Lebende Statue in Gold
  { n: "lebende-statue", ort: "ufer", platz: "ufer-*", stufe: 2, wetter: "sb",
    bild: U(2.4, F(rechteck(-1.3, -1.2, 2.6, 1.2), "#b9b1a3") + F(rechteck(-1.5, -1.4, 3, .26), "#a39a8c") + am(0, -1.4, 1.3, figur({ mantel: "#d9b23c", hose: "#c9a030", haut: "#e8c95a", haar: "#c9a030", schuh: "#b08a20", kopf: "hut", hut: "#c9a030", armV: [1.2, -4.4], klV: "fu-statue", schatten: false }))
      + F("M2.6 -.4H3.8L3.6 0H2.8Z", "#5f564c") + kind(5, { s: -1, mantel: "#e9506b", hose: "#4b5261", kopf: "zopf", haar: "#8a5a34", armV: [-1, -3.4] })),
    css: `.fu-statue{animation:fu-statue 7s ease-in-out infinite}@keyframes fu-statue{0%,80%,100%{rotate:0deg}86%,94%{rotate:-22deg}90%{rotate:-8deg}}` },

  // Zauberer mit Hut und Kaninchen
  { n: "zauberer", ort: "ufer", platz: "ufer-*", stufe: 2,
    bild: U(2.6, tisch(2.2, 1.8, 2.6, "#6b3f6b") + F("M1.6 -3.9h1.2v1.3H1.6Z", TINTE) + F("M1.3 -2.75h1.8v.16H1.3Z", TINTE) + `<g class="fu-hase">` + E(2.2, -4.2, .42, .5, "#fdfcf9") + L("M2.05 -4.6V-5.4M2.38 -4.6V-5.3", "#fdfcf9", .2) + `<circle cx="2.34" cy="-4.26" r=".06" fill="${TINTE}"/></g>`
      + steht(-.4, { mantel: "#2f3542", hose: "#2f3542", kopf: "hut", hut: "#2f3542", haar: "#262321", armV: [1.6, -4.2], klV: "fu-pendel", inHand: L("M1.6 -4.2L2.3 -5", "#fdfcf9", .1), hinten: F("M-.7 -3.9L-1.5 -1L.2 -1.4Z", "#8a2f4a") }) + am(2.6, -5.6, .3, `<g class="fu-blink" style="--d:.7s">` + F("M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z", "#f4c542") + `</g>`)),
    css: `.fu-hase{animation:fu-hase 6s ease-in-out infinite}@keyframes fu-hase{0%,40%,100%{translate:0 1.2px}55%,85%{translate:0 0}}` },

  // Kiosk mit Zeitungen
  { n: "kiosk", ort: "ufer", platz: "ufer-*",
    bild: U(3.4, F(rechteck(-2.6, -5.6, 5.2, 5.6), "#5f7a8a") + F("M-3.1 -5.6H3.1L2.6 -6.5H-2.6Z", "#4a6373") + F(rechteck(-2, -4.6, 4, 2.2), "#2f3f4a") + F(rechteck(-2.6, -2.5, 5.2, .3), "#e9d9b8")
      + am(0, -2.4, 1, figur({ mantel: "#b5651d", kopf: "kurz", haar: "#c9c2b8", beine: "", schatten: false, armV: [1, -2.4] })) + F(rechteck(-2.6, -2.5, 5.2, 2.5), "#5f7a8a") + F("M-2.2 -2h1.1v1.4h-1.1ZM-.8 -2H.3v1.4H-.8ZM.6 -2h1.1v1.4H.6Z", "#fdfcf9") + L("M-2 -1.7h.7M-.6 -1.7h.7M.8 -1.7h.7", "#c8102e", .14)
      + steht(4.2, { s: -1, mantel: "#8a5f8a", hose: "#3f3a44", kopf: "lang", haar: "#6b4a2e", armV: [-1.1, -2.9], inHand: F("M-1.5 -3.4h.8v1h-.8Z", "#fdfcf9") })) },

  // Blumenstand
  { n: "blumenstand", ort: "ufer", platz: "ufer-*", zeit: "fsh",
    bild: U(3.4, bude(0, 5.4, 6.4, "#8a9a6a", "#fdfcf9", "#8ccf7e") + am(-.2, 0, 1.15, figur({ mantel: "#3f7a52", kopf: "zopf", haar: "#8a5a34", beine: "", schatten: false, armV: [1.2, -3] }))
      + F(rechteck(-2.7, -2.9, 5.4, 2.9), "#8a9a6a") + [-2.6, -1.3, 0, 1.3].map((x, i) => F(`M${x + .1} -1h1l-.14 1h-.72Z`, "#857d70") + L(`M${x + .35} -1v-.8M${x + .6} -1v-1.1M${x + .85} -1v-.7`, "#5f8f4a", .08)
        + F(kreis(x + .35, -1.9, .26) + kreis(x + .85, -1.8, .24), BUNT[i]) + F(kreis(x + .6, -2.2, .28), BUNT[(i + 2) % 6])).join("")) },

  // Lastenrad mit zwei Kindern
  { n: "lastenrad", ort: "ufer", platz: "ufer-weg",
    bild: fahrt(am(0, 0, 1, schatten(3.4) + rad(-2.6, -.95, .95, { d: .8 }) + rad(2.9, -.8, .8, { d: .7 }) + F("M-.6 -2.6H2.6L2.2 -1H-.2Z", "#5f8fb5") + `<circle cx=".5" cy="-3" r=".46" fill="${HAUT[0]}"/><circle cx="1.6" cy="-3" r=".46" fill="${HAUT[3]}"/>` + F("M.04 -3.1a.46 .46 0 0 1 .92 0Z", "#f4c542") + F("M1.14 -3.1a.46 .46 0 0 1 .92 0Z", "#e9506b")
      + L("M-2.6 -.95L-1.8 -2.9M-1.8 -2.2L-.4 -1.2M-.9 -3.4H-.2L2.9 -.8", "#3d3934", .16)
      + am(-1.9, -1.2, 1.15, figur({ mantel: "#f19a4a", hose: "#2f3542", kopf: "helm", hut: "#fdfcf9", armV: [1.2, -2.6], beine: L("M0 -2L.6 -1.2L.2 -.4", "#2f3542", .5), schatten: false }))), { von: 500, bis: 780, d: 28, v: -9, y: FUSS }) },

  // Fahrrad-Rikscha mit Fahrgästen
  { n: "rikscha", ort: "ufer", platz: "ufer-weg", zeit: "fsh", stufe: 2,
    bild: fahrt(am(0, 0, 1, schatten(4) + rad(-2.4, -1, 1, { d: 1 }) + rad(3.6, -.9, .9, { d: .9 }) + F("M-4.4 -3.4H-.6V-1.2H-4.4Z", "#d6243a") + F("M-4.8 -5.4Q-2.6 -6.2 -.2 -5.4L-.6 -4.9H-4.4Z", "#f4c542") + L("M-4.4 -4.9V-3.4M-.6 -4.9V-3.4", "#857d70", .12)
      + `<circle cx="-3.3" cy="-3.9" r=".5" fill="${HAUT[1]}"/><circle cx="-1.8" cy="-3.9" r=".5" fill="${HAUT[2]}"/>` + F("M-3.9 -3.5h1.2v1h-1.2Z", "#6fb0e6") + F("M-2.4 -3.5h1.2v1h-1.2Z", "#8ccf7e") + L("M-.6 -1.4L1.6 -1.2L3.6 -.9M1.4 -3.2H2.2", "#3d3934", .16)
      + am(1, -1.1, 1.15, figur({ mantel: "#fdfcf9", hose: "#2f3542", kopf: "kappe", hut: "#d6243a", haut: HAUT[3], armV: [1.1, -2.2], beine: L("M0 -2L.7 -1.2L.3 -.3", "#2f3542", .5), schatten: false }))), { von: 500, bis: 780, d: 44, v: -12, y: FUSS }) },

  // E-Roller saust vorbei
  { n: "e-roller", ort: "ufer", platz: "ufer-weg",
    bild: fahrt(am(0, 0, 1, schatten(1.7) + rad(-1.2, -.36, .36, { d: .3, speichen: 4 }) + rad(1.2, -.36, .36, { d: .3, speichen: 4 }) + L("M-1.2 -.4H1.2L1 -4M.6 -4H1.5", "#8ccf7e", .18)
      + am(-.3, -.5, 1.25, figur({ mantel: "#2f3542", hose: "#4b5261", kopf: "kurz", haar: "#6b4a2e", armV: [1, -2.8], schatten: false, hinten: F("M-1.3 -3.7h.8v1.5h-.8Z", "#e9506b") })) + L("M-3.6 -2.4h1.2M-3.9 -1.6h1.5", "#fff", .08, 'opacity=".7"')), { von: 500, bis: 780, d: 15, v: -3, y: FUSS }) },

  // Seniorin mit Rollator
  { n: "rollator", ort: "ufer", platz: "ufer-weg", spiegeln: true,
    bild: hinher(geht(-.6, { mantel: "#8a5f8a", hose: "#5f564c", kopf: "dutt", haar: "#e6e2dc", haut: HAUT[2], armV: [1, -2.5] }, 1.2, .9) + L("M.6 -3.1H1.7V-.4M1.7 -1.6H.9V-.4", "#857d70", .16) + F(rechteck(.8, -2.1, 1, .5), "#d6243a") + rad(.9, -.3, .3, { d: 2, speichen: 4 }) + rad(1.8, -.3, .3, { d: 2, speichen: 4 }), { von: 708, bis: 740, d: 70, y: FUSS }) },

  // Dackel unterwegs
  { n: "dackel", ort: "ufer", platz: "ufer-weg", spiegeln: true,
    bild: hinher(am(0, 0, 1, `<g class="fu-geht" style="--takt:.14s">` + schatten(2) + dreh("fu-b1", -1.3, -.5, L("M-1.3 -.5V-.05", "#7a4a2a", .26)) + dreh("fu-b2", -1, -.5, L("M-1 -.5V-.05", "#7a4a2a", .26)) + dreh("fu-b2", 1.1, -.5, L("M1.1 -.5V-.05", "#7a4a2a", .26)) + dreh("fu-b1", 1.4, -.5, L("M1.4 -.5V-.05", "#7a4a2a", .26))
      + F("M-1.7 -.55Q-1.7 -1.15 -1 -1.15H1.3Q1.9 -1.15 2 -.9L2.9 -.95Q3.1 -.7 2.6 -.5H-1.2Q-1.7 -.5 -1.7 -.55Z", "#9a5f34") + F("M1.6 -1.1Q1.5 -.3 1.9 -.3Q2.1 -.6 2 -1.1Z", "#7a4a2a") + `<circle cx="2.3" cy="-.86" r=".07" fill="${TINTE}"/><circle cx="2.9" cy="-.82" r=".1" fill="${TINTE}"/>`
      + pendel(-1.7, -.9, L("M-1.7 -.9L-2.5 -1.5", "#9a5f34", .16), 16, .2) + L("M-.4 -1.15V-1.3H.6", "#c8102e", .1) + `</g>`), { von: 520, bis: 570, d: 38, y: FUSS }) },

  // Gänsemarsch
  { n: "gaensemarsch", ort: "ufer", platz: "ufer-weg", zeit: "fsh", spiegeln: true,
    bild: hinher([0, -2, -4, -6].map((x, i) => am(x, 0, i ? .8 : 1.1, wipp(schatten(.9) + L("M-.1 -.6V-.05M.2 -.6V-.05", "#e8a23c", .1) + E(0, -1, .9, .56, "#fdfcf9") + L("M.6 -1.2Q.9 -2 1 -2.5", "#fdfcf9", .34) + `<circle cx="1.04" cy="-2.6" r=".3" fill="#fdfcf9"/><circle cx="1.14" cy="-2.66" r=".05" fill="${TINTE}"/>` + F("M1.3 -2.66L1.8 -2.56L1.3 -2.46Z", "#e8a23c"), .3, -.1, i * -.08))).join(""), { von: 712, bis: 754, d: 48, y: FUSS }) },

  // Kaninchen im Gras
  { n: "kaninchen", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "sb",
    bild: U(2.6, [[-2, "#b9a58c", 1, 0], [1.2, "#fdfcf9", -1, -1.4], [3.2, "#8a7460", -1, -.6]].map(([x, farbe, s, v]) => huepf(am(x, 0, .9, E(0, -.7, .95, .7, farbe) + `<circle cx="${.8 * s}" cy="-1.2" r=".5" fill="${farbe}"/>` + L(`M${.7 * s} -1.6V-2.5M${.98 * s} -1.6V-2.4`, farbe, .2) + `<circle cx="${.98 * s}" cy="-1.26" r=".07" fill="${TINTE}"/><circle cx="${-.95 * s}" cy="-.6" r=".24" fill="#fdfcf9"/>`), 3.2, -.5, v, .5 * s)).join("")) },

  // Maulwurf schaut aus seinem Hügel
  { n: "maulwurf", ort: "ufer", platz: "ufer-*", zeit: "fsh", stufe: 2,
    bild: U(1.4, F("M-4 0Q-3 -1.2 -2 0Z", "#6b4a32") + `<clipPath id="fu-cp-maul"><rect x="-3" y="-4" width="8" height="3"/></clipPath><g clip-path="url(#fu-cp-maul)"><g class="fu-maul">` + E(1, -1.4, .8, 1.2, "#3d3934") + F("M1.5 -1.9L2.2 -1.7L1.5 -1.5Z", "#e9a58c") + `<circle cx="1.3" cy="-2" r=".07" fill="#fdfcf9"/>` + L("M.4 -1.2L-.1 -1.5M1.6 -1.1L2.1 -1.3", "#e9a58c", .14) + `</g></g>` + F("M-.6 0Q1 -1.6 2.6 0Z", "#6b4a32")),
    css: `.fu-maul{animation:fu-maul 7s ease-in-out infinite}@keyframes fu-maul{0%,30%,100%{translate:0 2px}40%,80%{translate:0 0}}` },

  // Pfau schlägt ein Rad
  { n: "pfau", ort: "ufer", platz: "ufer-*", zeit: "fs", stufe: 3, wetter: "sb",
    bild: U(2.2, `<g class="fu-pfau-rad">` + F("M0 -1.4L-3.4 -3.6A4 4 0 0 1 3.4 -3.6Z", "#2f8f7a") + [-2.4, -1.4, -.4, .6, 1.6, 2.5].map((x, i) => `<circle cx="${x}" cy="${f(-4.2 - (2 - Math.abs(i - 2.5)) * .34)}" r=".34" fill="#f4c542"/><circle cx="${x}" cy="${f(-4.2 - (2 - Math.abs(i - 2.5)) * .34)}" r=".16" fill="#2f5fb5"/>`).join("") + `</g>`
      + L("M-.2 -.7V-.05M.3 -.7V-.05", "#857d70", .1) + E(0, -1.3, .8, .7, "#2f5fb5") + L("M.4 -1.7Q.8 -2.6 .7 -3.2", "#2f5fb5", .32) + `<circle cx=".72" cy="-3.3" r=".3" fill="#2f5fb5"/><circle cx=".82" cy="-3.36" r=".05" fill="#fdfcf9"/>` + F("M1 -3.34L1.4 -3.26L1 -3.18Z", "#e8a23c") + L("M.6 -3.6V-4M.76 -3.6V-4.06M.9 -3.58V-3.96", "#2f5fb5", .05)),
    css: `.fu-pfau-rad{transform-box:fill-box;transform-origin:50% 100%;animation:fu-pfau 9s ease-in-out infinite}@keyframes fu-pfau{0%,20%,100%{scale:.2 .5;opacity:.4}35%,85%{scale:1 1;opacity:1}}` },

  // Waschbär am Papierkorb
  { n: "waschbaer", ort: "ufer", platz: "ufer-*", zeit: "hw", stufe: 2,
    bild: U(2, F("M-.9 -2.6H.9L.7 0H-.7Z", "#5f7a5a") + F(rechteck(-1.05, -2.8, 2.1, .26), "#4a6046") + pendel(.7, -2.8, am(.9, -2.8, .9, E(.6, -.8, .9, .7, "#8f8f8f") + `<circle cx="1.3" cy="-1.5" r=".56" fill="#a3a3a3"/>` + F("M.9 -1.6H1.8V-1.36H.9Z", TINTE) + `<circle cx="1.14" cy="-1.5" r=".07" fill="#fdfcf9"/><circle cx="1.5" cy="-1.5" r=".07" fill="#fdfcf9"/>` + F("M.9 -2L1 -2.4L1.2 -2ZM1.5 -2L1.7 -2.4L1.8 -1.96Z", "#8f8f8f")
      + L("M-.2 -.6Q-1.2 -.2 -1.4 -1.2", "#8f8f8f", .36) + L("M-.7 -.34L-.86 -.5M-1.16 -.5L-1.3 -.7", TINTE, .12)), 6, 1.3) + F(kreis(2.6, -.14, .2), "#fdfcf9") + F("M3 -.3h.5l-.1 .3h-.3Z", "#e9506b")) },

  // Paar auf der Bank
  { n: "bankpaar", ort: "ufer", platz: "ufer-*",
    bild: U(3.4, F(rechteck(-2.6, -2.3, 5.2, .26), "#9a6e44") + F(rechteck(-2.5, -4, 5, .24) + rechteck(-2.5, -3.4, 5, .24), "#8a5f38") + L("M-2.1 0V-4M2.1 0V-4", "#5f564c", .2)
      + am(-.8, -.35, 1.25, figur({ sitzen: true, mantel: "#4a7399", hose: "#3f3a44", kopf: "kurz", haar: "#6b4a2e", armV: [1.3, -3.5], schatten: false })) + am(.9, -.35, 1.25, figur({ sitzen: true, mantel: "#e9506b", hose: "#4b5261", kopf: "lang", haar: "#262321", haut: HAUT[1], schatten: false }))
      + auf(am(.1, -7.2, .42, F(HERZ, "#e9506b")), { d: 4, h: -2.6 })) },

  // Nickerchen auf der Bank
  { n: "nickerchen", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "sb",
    bild: U(3.4, F(rechteck(-2.8, -2.3, 5.6, .26), "#9a6e44") + L("M-2.3 0V-2.3M2.3 0V-2.3", "#5f564c", .2) + L("M-1.9 -2.7H1.2", "#4b5261", .6) + F("M1 -2.4Q1.6 -3.4 2.4 -2.4Z", "#6b7fa3") + `<circle cx="2.3" cy="-2.8" r=".6" fill="${HAUT[0]}"/>` + F("M1.5 -3.3L2.9 -3.5L3 -2.9L1.6 -2.7Z", "#fdfcf9") + L("M1.8 -3.1L2.7 -3.22", "#b9b1a3", .06)
      + E(-2.2, -2.56, .5, .2, TINTE) + [0, 1, 2].map(i => auf(`<text x="${f(2.8 + i * .2)}" y="-3.8" font-size="${f(.9 + i * .2)}" font-family="sans-serif" font-weight="700" fill="#857d70">z</text>`, { d: 3.6, v: -i * 1.2, h: -2.4, x: 1 })).join("")) },

  // Vorlesestunde auf der Decke
  { n: "vorleserin", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "sb",
    bild: U(4, F("M-4.2 0H4.2L3.8 -.16H-3.8Z", "#e9506b") + am(-2, -.1, 1.25, figur({ sitzen: true, mantel: "#b5651d", hose: "#4b5261", kopf: "dutt", haar: "#8a5a34", armV: [1.3, -3], schatten: false, inHand: F("M.9 -3.5L1.6 -3.3V-2.5L.9 -2.7Z", "#2f5fb5") + F("M1.6 -3.3L2.3 -3.5V-2.7L1.6 -2.5Z", "#fdfcf9") }))
      + [[1.4, "#f4c542", "zopf"], [3, "#8ccf7e", "kurz"]].map(([x, farbe, kopf]) => am(x, -.1, .9, figur({ s: -1, sitzen: true, mantel: farbe, hose: "#4a7399", kopf, haar: "#6b4a2e", schatten: false }))).join("")) },

  // Federball
  { n: "federball", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "sb",
    bild: U(1.4, steht(-4.4, { mantel: "#f19a4a", hose: "#2f3542", kopf: "zopf", haar: "#6b4a2e", armV: [1.2, -4.3], klV: "fu-pendel", inHand: L("M1.2 -4.3L1.7 -5.2", "#857d70", .1) + E(1.9, -5.6, .36, .46, "none", `stroke="#857d70" stroke-width=".08"`) })
      + steht(4.4, { s: -1, mantel: "#6fb0e6", hose: "#4b5261", kopf: "kappe", hut: "#fdfcf9", armV: [-1.2, -4.3], klV: "fu-pendel", inHand: L("M-1.2 -4.3L-1.7 -5.2", "#857d70", .1) + E(-1.9, -5.6, .36, .46, "none", `stroke="#857d70" stroke-width=".08"`) })
      + `<g class="fu-fb-ball">` + F("M0 0L-.3 -.5H.3Z", "#fdfcf9") + `<circle r=".16" fill="#e9506b"/></g>`),
    css: `.fu-fb-ball{animation:fu-fb-x 1.8s ease-in-out infinite alternate,fu-fb-y .9s ease-out infinite alternate}@keyframes fu-fb-x{from{translate:-2.6px -7.4px}to{translate:2.6px -7.4px}}@keyframes fu-fb-y{from{transform:translateY(0)}to{transform:translateY(-2.6px)}}` },

  // Tischtennis
  { n: "tischtennis", ort: "ufer", platz: "ufer-*", zeit: "fsh", wetter: "sb",
    bild: U(4, F(rechteck(-2.4, -2.5, 4.8, .26), "#3f7a52") + L("M-1.8 -2.3V0M1.8 -2.3V0", "#5f564c", .22) + F(rechteck(-.06, -3, .12, .5), "#fdfcf9")
      + steht(-4, { mantel: "#e9506b", hose: "#2f3542", kopf: "kurz", haar: "#262321", haut: HAUT[1], armV: [1.3, -3], klV: "fu-pendel", inHand: F(kreis(1.5, -3.3, .34), "#c8102e") }) + steht(4, { s: -1, mantel: "#f4c542", hose: "#4b5261", kopf: "zopf", haar: "#8a5a34", armV: [-1.3, -3], klV: "fu-pendel", inHand: F(kreis(-1.5, -3.3, .34), "#2f5fb5") })
      + `<circle class="fu-pingpong" r=".13" fill="#fdfcf9"/>`),
    css: `.fu-pingpong{animation:fu-pp-x .8s linear infinite alternate,fu-pp-y .4s ease-in infinite alternate}@keyframes fu-pp-x{from{translate:-2.2px -3.6px}to{translate:2.2px -3.6px}}@keyframes fu-pp-y{from{transform:translateY(-.8px)}to{transform:translateY(.9px)}}` },

  // Slackline zwischen zwei Pfosten
  { n: "slackline", ort: "ufer", platz: "ufer-*", zeit: "fs", stufe: 2, wetter: "sb",
    bild: U(1.4, L("M-5 0V-2.4M5 0V-2.4", "#8a5f38", .36) + L("M-5 -2.1Q0 -1.5 5 -2.1", "#f4c542", .12) + pendel(0, -1.7, am(0, -1.7, 1.2, figur({ mantel: "#8ccf7e", hose: "#2f3542", kopf: "kurz", haar: "#6b4a2e", armV: [1.5, -3.9], armH: [-1.5, -3.7], schatten: false, beine: L("M-.1 -2.05V-.2M.2 -2.05L.9 -1.1", "#2f3542", .5) + E(.05, -.1, .42, .17, TINTE) })), 5, 1.1)) },

  // Drohnenpilot
  { n: "drohnenpilot", ort: "ufer", platz: "ufer-*", stufe: 2, wetter: "sb",
    bild: U(2, steht(-2, { mantel: "#4b5261", hose: "#2f3542", kopf: "kappe", hut: "#d6243a", armV: [.9, -3.2], armH: [.5, -3.2], vorn: F("M.3 -3.5h1v.6h-1Z", TINTE) })
      + `<g class="fu-drohne">` + F(rechteck(1.8, -10.3, 1.6, .5), "#3d3934") + L("M1.4 -10.2H3.8", "#3d3934", .12) + `<ellipse class="fu-flimmer2" cx="1.4" cy="-10.5" rx=".8" ry=".08" fill="${TINTE}" opacity=".6"/><ellipse class="fu-flimmer2" cx="3.8" cy="-10.5" rx=".8" ry=".08" fill="${TINTE}" opacity=".6"/><circle class="fu-blink" cx="2.6" cy="-9.7" r=".14" fill="#8ccf7e" style="--d:.5s"/></g>`),
    css: `.fu-drohne{animation:fu-drohne 8s ease-in-out infinite alternate}@keyframes fu-drohne{0%{translate:-1px .6px}50%{translate:2px -1px}100%{translate:4px .4px}}` },

  // Vogelguckerin mit Fernglas
  { n: "vogelgucker", ort: "ufer", platz: "ufer-*", wetter: "sb",
    bild: U(2.2, steht(0, { mantel: "#7a8a5a", hose: "#5f564c", kopf: "hut", hut: "#8a7d6e", haar: "#c9c2b8", armV: [.9, -4.7], armH: [.5, -4.7], vorn: F("M.6 -4.95h.9v.5h-.9Z", TINTE), hinten: F("M-1.3 -3.7h.9v1.7h-.9Z", "#8a5f38") })
      + L("M3 0L3.6 -3.6L4.2 0M3.6 -3.6V-.6", "#857d70", .12) + F("M3 -4.1L4.6 -4.5L4.7 -4L3.1 -3.6Z", "#3d3934") + am(6.6, -9.4, .8, wipp(vogel({ s: -1, farbe: "#e9506b", bauch: "#f6d8c8" }), .5, -.15))) },

  // Schatzsucher mit Metalldetektor
  { n: "schatzsucher", ort: "ufer", platz: "ufer-weg", stufe: 2, spiegeln: true,
    bild: hinher(geht(0, { mantel: "#5f7a5a", hose: "#5f564c", kopf: "hut", hut: "#c9a67c", haar: "#6b4a2e", armV: [1.1, -2.2], inHand: L("M1.1 -2.2L2.2 -.3", "#3d3934", .12) + E(2.4, -.2, .56, .14, "#3d3934"), hinten: F("M-1.2 -3.6h.8v1.4h-.8Z", "#8a5f38") }, 1.3, .9)
      + am(3.4, -.5, .26, `<g class="fu-blink" style="--d:.9s">` + F("M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z", "#f4c542") + `</g>`), { von: 708, bis: 748, d: 64, y: FUSS }) },

  // Schneemann wird gebaut
  { n: "schneemannbau", ort: "ufer", platz: "ufer-*", zeit: "w", wetter: "nsb",
    bild: U(3, F(kreis(0, -1.3, 1.3) + kreis(0, -3.2, .95), "#fdfcf9") + L("M-.3 -3.4h.01M.3 -3.4h.01", TINTE, .16) + F("M0 -3.2L.9 -3.05L0 -2.95Z", "#f19a4a") + L("M.9 -2.4L2 -3.2M-.9 -2.4L-1.9 -3", "#6b4a32", .12)
      + kind(-3, { mantel: "#e9506b", hose: "#4a7399", kopf: "muetze", hut: "#f4c542", armV: [1.5, -4], klV: "fu-pendel", inHand: F(kreis(1.6, -4.3, .5), "#fdfcf9") }) + kind(3.2, { s: -1, mantel: "#6fb0e6", hose: "#2f3542", kopf: "muetze", hut: "#d6243a", armV: [-1.2, -1.2] }) + F(kreis(2, -.5, .5), "#fdfcf9")) },

  // Glühweinstand
  { n: "gluehweinstand", ort: "ufer", platz: "ufer-*", zeit: "w",
    bild: U(3.6, bude(-.4, 5.4, 6.6, "#7a4a2a", "#c8102e", "#fdfcf9") + am(-.6, 0, 1.15, figur({ mantel: "#3f7a52", kopf: "muetze", hut: "#c8102e", haar: "#6b4a2e", beine: "", schatten: false, armV: [1.2, -3] }))
      + F(rechteck(-3.1, -2.9, 5.4, 2.9), "#7a4a2a") + F("M.4 -3.9h1.2v1H.4Z", "#b9b1a3") + auf(E(1, -4.2, .34, .4, "#fff"), { d: 2.4, h: -1.8, o: .6 }) + auf(E(1.3, -4.3, .28, .34, "#fff"), { d: 2.4, v: -1.2, h: -2, o: .5 })
      + L("M-3.1 -5.6H2.3", "#f4c542", .06) + [-2.6, -1.5, -.4, .7, 1.8].map((x, i) => `<circle class="fu-blink" cx="${x}" cy="-5.5" r=".16" fill="${BUNT[i % 6]}" style="--d:${f(.8 + i * .13)}s"/>`).join("")
      + steht(4, { s: -1, mantel: "#4a7399", hose: "#3f3a44", kopf: "muetze", hut: "#f4c542", armV: [-1, -3.2], inHand: F("M-1.2 -3.7h.4v.6h-.4Z", "#c8102e") })) },

  // Sternsinger (um den 6. Januar)
  { n: "sternsinger", ort: "ufer", platz: "ufer-weg", zeit: "w", am: ["01-05", "01-06", "01-07"], spiegeln: true,
    bild: hinher([[-2, "#c8102e", HAUT[0]], [0, "#2f5fb5", HAUT[3]], [2, "#3f7a52", HAUT[1]]].map(([x, farbe, haut], i) => geht(x, { mantel: farbe, hose: farbe, rock: true, haut, kopf: "kurz", haar: "#6b4a2e", vorn: F("M-.5 -5.3L-.5 -5.9L-.2 -5.6L.1 -5.95L.4 -5.6L.7 -5.9V-5.3Z", "#f4c542"),
      ...(i === 2 ? { armV: [1, -4], inHand: L("M1 -3.6V-6.4", "#857d70", .1) + am(1, -6.9, .42, F("M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z", "#f4c542")) } : {}) }, .95, .46)).join(""), { von: 522, bis: 574, d: 50, y: FUSS }) },

  // Kind mit Laterne (im Herbst)
  { n: "laternenkind", ort: "ufer", platz: "ufer-weg", zeit: "h", spiegeln: true,
    bild: hinher(geht(0, { mantel: "#b5651d", hose: "#4a7399", kopf: "muetze", hut: "#f4c542", armV: [1.2, -3.6], inHand: L("M1.2 -3.6L2.2 -4.6", "#857d70", .08) + pendel(2.2, -4.6, L("M2.2 -4.6V-4", "#857d70", .05) + E(2.2, -3.3, .56, .7, "#f19a4a") + E(2.2, -3.3, .3, .44, "#f9e08a"), 12, .9) }, .95, .5)
      + geht(-1.8, { mantel: "#4a7399", hose: "#3f3a44", kopf: "lang", haar: "#8a5a34" }, 1.3, .6), { von: 706, bis: 752, d: 48, y: FUSS }) },

  // Sandburg (im Sommer)
  { n: "sandburg", ort: "ufer", platz: "ufer-*", zeit: "s", wetter: "sb",
    bild: U(3, F("M-3.6 0Q0 -.7 3.6 0Z", "#e6cf9a") + F("M-.2 -.3h2.4v-1.3h-.5v.4h-.5v-.4h-.4v.4h-.5v-.4h-.5Z", "#d9bd7c") + F("M.6 -1.2h.9v-1.2h-.3v.3h-.3v-.3h-.3Z", "#d9bd7c") + L("M1.05 -2.4V-3.3", "#857d70", .06) + F("M1.05 -3.3L1.8 -3.1L1.05 -2.9Z", "#d6243a")
      + am(-2.2, 0, .95, figur({ mantel: "#fdfcf9", hose: "#e9506b", kopf: "hut", hut: "#f4c542", armV: [1.4, -1], klV: "fu-pendel", beine: L("M-.2 -2L.9 -1.9L.9 -.1M.2 -2L-.9 -.2", "#e9506b", .5), schatten: false, inHand: F("M1.3 -1h.5l-.1 .5h-.3Z", "#2f5fb5") })) + F("M3 -.1h.7l-.14 -.6h-.42Z", "#d6243a")) },

  // Grillen am Ufer (im Sommer)
  { n: "grill", ort: "ufer", platz: "ufer-*", zeit: "s", wetter: "sb",
    bild: U(2.6, L("M1.3 0L2 -2M2.9 0L2.2 -2", "#3d3934", .14) + F("M1 -2.6H3.2Q3.2 -1.8 2.1 -1.8Q1 -1.8 1 -2.6Z", "#3d3934") + L("M1.2 -2.7H3", "#857d70", .08) + F("M1.4 -2.86h.6v.16h-.6ZM2.2 -2.86h.6v.16h-.6Z", "#a8472b")
      + auf(E(2, -3.3, .5, .4, "#d9d3ca"), { d: 2.8, h: -3, x: .8, o: .6 }) + auf(E(2.3, -3.4, .4, .34, "#d9d3ca"), { d: 2.8, v: -1.4, h: -3.4, x: -.4, o: .5 })
      + steht(-.6, { mantel: "#fdfcf9", hose: "#4a7399", kopf: "kappe", hut: "#3f7a52", haut: HAUT[1], armV: [1.5, -3], klV: "fu-pendel", inHand: L("M1.5 -3L2 -2.9", "#857d70", .1), vorn: F("M-.5 -3.5h1v1.5h-1Z", "#d6243a") })) },
];
