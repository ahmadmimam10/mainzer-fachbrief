// Fundstücke auf dem Rhein, Teil 2 (für den Jahreskalender 2027): 25 weitere Boote, Schwimmer und Tiere.
// Bauweise wie in wasser.mjs: Wasserlinie bei y = 0, um x = 0 gezeichnet (Platz "wasser-*") oder quer über den Fluss ("wasser-weg").
import { f, am, dreh, fahrt, figur, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E } from "./hilfen.mjs";
import { pendel } from "./ufer-leute.mjs";

const aufWasser = (innen, tiefe = 9, g = 1) => am(0, tiefe, g, innen);
const spiegel = (b, y = .9) => `<path fill="none" stroke="#fff" stroke-width=".4" stroke-linecap="round" opacity=".7" d="M${-b} ${y}h${2 * b}M${f(-b * .55)} ${f(y + .8)}h${f(b * 1.1)}"/>`;
const schaukel = (innen, d = 3.2, v = 0) => `<g class="fu-wasser" style="--d:${d}s;--v:${v}s">${innen}</g>`;
const auf = (innen, { d = 4, v = 0, x = .6, h = -4, o = .9 } = {}) => `<g class="fu-auf" style="--d:${d}s;--v:${v}s;--x:${x}px;--h:${h}px;--o:${o}">${innen}</g>`;
const wipp = (innen, d = 1.2, h = -.3, v = 0) => `<g class="fu-wipp" style="--d:${d}s;--h:${h}px;--v:${v}s">${innen}</g>`;
const ueberWasser = (id, innen) => `<clipPath id="fu-cp-${id}"><rect x="-30" y="-40" width="60" height="40"/></clipPath><g clip-path="url(#fu-cp-${id})">${innen}</g>`;
const ringe = (x = 0, b = 2.4) => `<ellipse cx="${x}" cy=".3" rx="${b}" ry=".5" fill="none" stroke="#fff" stroke-width=".18" opacity=".7"/>`;
const kopf = (x, y, haut = HAUT[0], haar = "#6b4a2e", r = .6) => `<circle cx="${f(x - .08)}" cy="${f(y - .1)}" r="${f(r * 1.08)}" fill="${haar}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${haut}"/><circle cx="${f(x + r * .5)}" cy="${f(y - .04)}" r=".08" fill="${TINTE}"/>`;
const sitzer = (x, y, farbe, haut, haar) => F(`M${f(x - .6)} ${y}V${f(y - 1.5)}Q${f(x - .6)} ${f(y - 2)} ${f(x - .1)} ${f(y - 2)}H${f(x + .2)}Q${f(x + .6)} ${f(y - 2)} ${f(x + .6)} ${f(y - 1.5)}V${y}Z`, farbe) + kopf(x + .08, y - 2.6, haut, haar);
const vogelkopf = (x, y, farbe, schnabel = "#e8a23c", s = 1) => `<circle cx="${x}" cy="${y}" r=".36" fill="${farbe}"/><circle cx="${f(x + s * .12)}" cy="${f(y - .06)}" r=".05" fill="#fdfcf9"/>` + F(`M${f(x + s * .3)} ${f(y - .08)}L${f(x + s * .95)} ${y}L${f(x + s * .3)} ${f(y + .1)}Z`, schnabel);

export default [
  // Tretboot mit zwei Leuten
  { n: "tretboot", ort: "wasser", platz: "wasser-*", zeit: "fs", wetter: "sb",
    bild: aufWasser(schaukel(F("M-3.4 -.9H3.4L2.8 .2H-2.8Z", "#f4c542") + F("M-2.6 -1.8H1.8V-.9H-2.6Z", "#fdfcf9") + sitzer(-1.3, -1.2, "#e9506b", HAUT[0], "#8a5a34") + sitzer(.3, -1.2, "#6fb0e6", HAUT[3], "#262321") + F("M-3.4 -.9H3.4L3.3 -.6H-3.3Z", "#e0b032")
      + `<g class="fu-dreh" style="transform-box:fill-box;transform-origin:50% 50%;--d:1.4s">` + L("M2.5 -.5V.5M2 0H3", "#857d70", .16) + `</g>`) + spiegel(3)) },

  // Schlauchboot mit Außenborder
  { n: "schlauchboot", ort: "wasser", platz: "wasser-weg",
    bild: fahrt(am(0, 0, 1, F("M-3 -.9Q-3.6 -.9 -3.6 -.3Q-3.6 .2 -3 .2H2.4Q3.8 .2 4 -.6Q3.2 -.9 2.4 -.9Z", "#f19a4a") + F("M-3 -.9H2.4Q3.2 -.9 4 -.6Q3 -.5 2.4 -.5H-3Q-3.4 -.5 -3.6 -.3Q-3.6 -.9 -3 -.9Z", "#d9802e") + F(rechteck(-4, -1.2, .5, 1.1), "#3d3934")
      + sitzer(-1.6, -.8, "#3f7a52", HAUT[1], "#262321") + sitzer(.6, -.8, "#f4c542", HAUT[0], "#c98a3a") + L("M-4.4 .2Q-6 -.2 -7.6 .4M-4.4 .7Q-6 .5 -7 1", "#fff", .2, 'opacity=".8"')), { von: 510, bis: 770, d: 22, v: -5, y: 8 }) },

  // Ruderboot mit Angler
  { n: "ruderboot", ort: "wasser", platz: "wasser-*", wetter: "sbr",
    bild: aufWasser(schaukel(F("M-3.6 -1H3.6Q3.2 .2 2.2 .2H-2.2Q-3.2 .2 -3.6 -1Z", "#8a5f38") + F("M-3.6 -1H3.6L3.5 -.7H-3.5Z", "#6b4a2e") + sitzer(-.8, -.9, "#5f7a5a", HAUT[0], "#c9c2b8") + F("M-1.5 -3.6H.1L-.1 -3.3H-1.3Z", "#8a7d6e")
      + pendel(-.3, -2.4, L("M-.3 -2.4L3.6 -4.8", "#6b4a2e", .12) + L("M3.6 -4.8V-.2", "#dfe8ec", .05), 4, 1.6) + L("M1.4 -.9L2.6 .8", "#9a6e44", .16)) + spiegel(3.2) + `<circle class="fu-wipp" cx="3.6" cy=".1" r=".2" fill="#d6243a" style="--d:1.1s;--h:.2px"/>`) },

  // Rheinfähre mit Autos
  { n: "faehre", ort: "wasser", platz: "wasser-weg", stufe: 2,
    bild: fahrt(am(0, 0, 1, F("M-7 -1.2H7L6.2 .3H-6.2Z", "#fdfcf9") + F("M-7 -1.2H7L6.8 -.8H-6.8Z", "#2f5fb5") + F("M-6.6 -1.8L-5.6 -1.2H-7ZM6.6 -1.8L5.6 -1.2H7Z", "#b9b1a3") + F(rechteck(-1.2, -3.6, 2.4, 2.4), "#e9e4da") + F(rechteck(-.9, -3.3, 1.8, .7), "#7f8f99") + F(rechteck(-1.5, -3.9, 3, .3), "#2f5fb5")
      + F("M-5.2 -1.2V-1.8Q-5.2 -2.4 -4.4 -2.4H-3.4Q-2.6 -2.4 -2.6 -1.8V-1.2Z", "#d6243a") + F("M2.4 -1.2V-1.9Q2.4 -2.5 3.2 -2.5H4.6Q5.2 -2.5 5.2 -1.9V-1.2Z", "#f4c542") + F("M-4.8 -2.1h1.8v.5h-1.8ZM2.8 -2.2h2v.5h-2Z", "#bfe0ee") + L("M0 -3.9V-5", "#857d70", .1) + F("M0 -5H1.1V-4.4H0Z", "#c8102e")
      + L("M-7.4 .3Q-9 0 -10.4 .5", "#fff", .22, 'opacity=".8"')), { von: 500, bis: 780, d: 54, v: -14, y: 6 }) },

  // Zwei im Kajak
  { n: "kajak", ort: "wasser", platz: "wasser-weg", zeit: "fsh",
    bild: fahrt(am(0, 0, 1, F("M-4.4 -.4Q0 -1.1 4.4 -.4Q0 .5 -4.4 -.4Z", "#e9506b") + [-1.2, 1].map((x, i) => sitzer(x, -.5, i ? "#6fb0e6" : "#f4c542", HAUT[i * 2], i ? "#262321" : "#8a5a34")
      + `<g class="fu-pendel" style="transform-box:view-box;transform-origin:${x}px -1.6px;--w:24deg;--d:.7s;--v:${i * -.35}s">` + L(`M${x - 1.6} -.2L${x + 1.6} -3`, "#3d3934", .1) + E(x - 1.7, -.1, .34, .2, "#fdfcf9") + E(x + 1.7, -3.1, .34, .2, "#fdfcf9") + `</g>`).join("")), { von: 510, bis: 770, d: 34, v: -8, y: 10 }) },

  // Jetski mit Gischt
  { n: "jetski", ort: "wasser", platz: "wasser-weg", zeit: "s", stufe: 2, wetter: "sb",
    bild: fahrt(am(0, 0, 1, F("M-2.4 -.9H.6L2.8 -.3Q2.2 .3 1.4 .3H-2Q-2.6 .3 -2.4 -.9Z", "#fdfcf9") + F("M-2.4 -.9H.6L1.6 -.6H-2.4Z", "#2f8f7a") + L("M.2 -.9L.9 -2", "#3d3934", .14)
      + am(-.6, -.8, 1, figur({ mantel: "#f19a4a", hose: "#2f3542", kopf: "helm", hut: "#fdfcf9", armV: [1.4, -2.4], beine: L("M0 -2L.5 -1.2L0 -.4", "#2f3542", .5), schatten: false }))
      + F("M-2.6 .2Q-4.4 -1.8 -6.4 -.4Q-4.6 -.4 -3.4 .5Z", "#fff", 'opacity=".85"') + auf(E(-4.6, -.8, .3, .3, "#fff"), { d: .8, h: -1.2, x: -1 })), { von: 500, bis: 780, d: 12, v: -3, y: 12 }) },

  // Hausboot mit Dachterrasse
  { n: "hausboot", ort: "wasser", platz: "wasser-*", stufe: 2,
    bild: aufWasser(schaukel(F("M-5 -.9H5L4.4 .3H-4.4Z", "#5f564c") + F(rechteck(-4, -3.8, 7.4, 2.9), "#e9d9b8") + F("M-4.4 -4.2H3.8V-3.8H-4.4Z", "#8a5f38") + F("M-3.2 -3.2h1.3v1.2h-1.3ZM-1.2 -3.2H.1v1.2h-1.3Z", "#bfe0ee") + F("M1.2 -3.3h1.3v2.4H1.2Z", "#3f7a52")
      + L("M-4.2 -4.2V-5H3.6V-4.2", "#857d70", .08) + F("M-3 -4.2h1.2l-.2 -.7h-.8Z", "#a8672a") + F(kreis(-2.4, -5.3, .5), "#5f8f4a") + am(1.6, -4.2, .8, figur({ sitzen: true, mantel: "#e9506b", hose: "#4b5261", kopf: "hut", hut: "#f4c542", schatten: false }))
      + L("M3 -4.2V-6.6", "#857d70", .08) + auf(E(3, -6.9, .3, .3, "#d9d3ca"), { d: 3, h: -2, o: .6 }), 4.4) + spiegel(4.4)) },

  // Baggerschiff
  { n: "baggerschiff", ort: "wasser", platz: "wasser-*", stufe: 2,
    bild: aufWasser(schaukel(F("M-5.4 -1H5.4L5 .3H-5Z", "#3d3934") + F("M-5.4 -1H5.4L5.3 -.7H-5.3Z", "#f4c542") + F(rechteck(-4.4, -3, 2.2, 2), "#f19a4a") + F(rechteck(-4, -2.7, 1.3, .8), "#bfe0ee")
      + pendel(-2.2, -2.4, L("M-2.2 -2.4L1.6 -5.2L3.8 -3", "#f19a4a", .34) + F("M3.3 -3L4.5 -3.2L4.3 -2L3.5 -2.1Z", "#5f564c"), 6, 3) + F("M1.4 -1Q2.8 -2.4 4.4 -1Z", "#a8926a"), 5) + spiegel(4.8)) },

  // Flusskreuzfahrtschiff
  { n: "kreuzfahrtschiff", ort: "wasser", platz: "wasser-weg", zeit: "fsh", stufe: 2,
    bild: fahrt(am(0, 0, 1, F("M-9 -1H9L8 .3H-8.4Z", "#fdfcf9") + F("M-9 -1H9L8.8 -.7H-8.9Z", "#2f3f6b") + F(rechteck(-7.6, -2.3, 14.6, 1.3), "#fdfcf9") + F(Array.from({ length: 11 }, (_, i) => rechteck(-7.2 + i * 1.3, -2.1, .9, .7)).join(""), "#7fa3bf")
      + F(rechteck(-6, -3.2, 10, .9), "#e9e4da") + F(Array.from({ length: 7 }, (_, i) => rechteck(-5.6 + i * 1.35, -3, .9, .5)).join(""), "#7fa3bf") + F("M4.6 -3.2H6.6L7 -2.3H4.6Z", "#bfe0ee") + L("M-3 -3.2V-4", "#857d70", .1) + F("M-3 -4h1.2v.6H-3Z", "#c8102e")
      + L("M-9.4 .3Q-11 0 -12.6 .5M-9 .8Q-10.4 .7 -11.4 1.1", "#fff", .22, 'opacity=".8"')), { von: 490, bis: 790, d: 70, v: -20, y: 5 }) },

  // Taucher: Flossen und Luftblasen
  { n: "taucher", ort: "wasser", platz: "wasser-*", zeit: "fs", stufe: 2,
    bild: aufWasser(ringe(0, 2.6) + ueberWasser("taucher", `<g class="fu-taucher">` + F("M-.9 0L-1.4 -2.2L-.4 -2.6L-.2 0Z", "#f4c542") + F("M.3 0L.5 -2.6L1.5 -2.2L1 0Z", "#f4c542") + L("M-.6 0V1M.6 0V1", "#3d3934", .5) + `</g>`)
      + [0, 1, 2].map(i => auf(`<circle cx="${3 + i * .5}" cy=".4" r="${f(.16 + i * .06)}" fill="none" stroke="#fff" stroke-width=".08"/>`, { d: 2.4, v: -i * .8, h: -1.6, x: .3 })).join("") + F(rechteck(4.6, -1.3, .12, 1.5), "#857d70") + F("M4.72 -1.3H5.9V-.6H4.72Z", "#d6243a") + L("M4.72 -1.3L5.9 -.6", "#fdfcf9", .14)),
    css: `.fu-taucher{animation:fu-taucher 6s ease-in-out infinite}@keyframes fu-taucher{0%,20%,100%{translate:0 3px}35%,70%{translate:0 0;rotate:0deg}52%{rotate:8deg}}` },

  // Rheinschwimmerin mit Boje
  { n: "rheinschwimmer", ort: "wasser", platz: "wasser-weg", zeit: "s", wetter: "sb",
    bild: fahrt(am(0, 0, 1, kopf(0, -.4, HAUT[0], "#f4c542", .6) + F("M-.66 -.5a.66 .7 0 0 1 1.3 0Z", "#f4c542") + `<g class="fu-kraul">` + L("M-.4 0Q.4 -1.6 1.4 -.1", HAUT[0], .3) + `</g>` + L("M-.9 .1L-3.2 .1", "#f19a4a", .06) + E(-3.8, -.1, .7, .46, "#f19a4a")
      + L("M1.6 .3h1.4M-2 .5h-1", "#fff", .16, 'opacity=".8"')), { von: 520, bis: 760, d: 60, v: -15, y: 11 }),
    css: `.fu-kraul{transform-box:view-box;transform-origin:-.4px 0;animation:fu-kraul 1.2s linear infinite}@keyframes fu-kraul{0%{rotate:0deg;opacity:1}45%{rotate:-150deg;opacity:1}50%,95%{opacity:0}100%{rotate:0deg;opacity:1}}` },

  // Wasserball treibt vorbei
  { n: "wasserball", ort: "wasser", platz: "wasser-weg", zeit: "s",
    bild: fahrt(am(0, 0, 1, `<g class="fu-wipp" style="--d:1.6s;--h:.25px"><g class="fu-dreh" style="transform-box:fill-box;transform-origin:50% 50%;--d:9s">` + F(kreis(0, -.8, 1.1), "#fdfcf9") + F("M0 -.8L0 -1.9A1.1 1.1 0 0 1 .95 -1.35Z", "#e9506b") + F("M0 -.8L.95 -.25A1.1 1.1 0 0 1 0 .3Z", "#f4c542") + F("M0 -.8L-.95 -.25A1.1 1.1 0 0 1 -.95 -1.35Z", "#6fb0e6") + `</g></g>` + ringe(0, 1.5)), { von: 530, bis: 750, d: 80, v: -30, y: 9 }) },

  // Auf der Luftmatratze
  { n: "luftmatratze", ort: "wasser", platz: "wasser-*", zeit: "s", wetter: "sb",
    bild: aufWasser(schaukel(F("M-3.6 -.5Q-3.6 -.9 -3 -.9H3Q3.6 -.9 3.6 -.5V0H-3.6Z", "#6fb0e6") + L("M-2.4 -.9V0M-1.2 -.9V0M0 -.9V0M1.2 -.9V0M2.4 -.9V0", "#4a8fc9", .08) + L("M-2.6 -1.2H1.4", "#e9506b", .6) + kopf(2.1, -1.4, HAUT[1], "#262321", .56) + F("M1.7 -1.5h1v.2h-1Z", TINTE)
      + L("M-2.6 -1.2L-3.4 -1.3", HAUT[1], .3) + F("M-.4 -1.5h.9l-.1 .5h-.7Z", "#f4c542"), 3.6) + spiegel(3.2)) },

  // Einhorn-Schwimmring
  { n: "einhornring", ort: "wasser", platz: "wasser-*", zeit: "s", stufe: 2, wetter: "sb",
    bild: aufWasser(schaukel(E(0, -.5, 2.6, .9, "#fdfcf9") + E(0, -.7, 1.3, .4, "#c9dfee") + F("M1.8 -.8Q2 -2.8 2.9 -3.2Q3.9 -3.2 3.8 -2.2Q3.2 -2 3 -.8Z", "#fdfcf9") + F("M3 -3.2L3.5 -4.6L3.5 -3.1Z", "#f4c542") + `<circle cx="3.3" cy="-2.6" r=".09" fill="${TINTE}"/>`
      + L("M2.4 -3.1Q1.6 -2.6 1.9 -1.6", "#e9506b", .3) + L("M2.2 -2.9Q1.5 -2.2 1.7 -1.3", "#b07cd8", .22) + sitzer(-.2, -.6, "#8ccf7e", HAUT[0], "#8a5a34"), 3.4) + spiegel(2.6)) },

  // Aufblasbares Krokodil
  { n: "krokodil", ort: "wasser", platz: "wasser-weg", zeit: "s", stufe: 2,
    bild: fahrt(am(0, 0, 1, `<g class="fu-wipp" style="--d:1.8s;--h:.2px">` + F("M-4.6 -.4Q-3 -1.2 -.4 -1H2.6Q4.6 -1 4.9 -.5Q4.6 0 2.6 0H-3Q-4.2 0 -4.6 -.4Z", "#5fae5a") + F("M-3.2 -1L-2.8 -1.5L-2.4 -1L-2 -1.5L-1.6 -1L-1.2 -1.5L-.8 -1L-.4 -1.5L0 -1Z", "#3f8a44") + `<circle cx="2.6" cy="-1.1" r=".34" fill="#fdfcf9"/><circle cx="2.7" cy="-1.1" r=".12" fill="${TINTE}"/>` + L("M2.6 -.4H4.7", "#3f8a44", .08) + `</g>` + ringe(0, 3.6)), { von: 525, bis: 755, d: 90, v: -40, y: 10 }) },

  // Otter auf dem Rücken
  { n: "otter", ort: "wasser", platz: "wasser-*", stufe: 2,
    bild: aufWasser(schaukel(F("M-2.8 -.2Q-1 -1.2 1.4 -.9Q2.2 -.8 2.2 -.3Q1 0 -2.6 0Z", "#7a5a3a") + F("M-1.6 -.6Q-.2 -1 1 -.8Q.2 -.4 -1.4 -.3Z", "#c9a67c") + `<circle cx="2.1" cy="-.9" r=".66" fill="#7a5a3a"/><circle cx="2.4" cy="-1" r=".07" fill="${TINTE}"/><circle cx="2.7" cy="-.8" r=".1" fill="${TINTE}"/>` + F(kreis(1.7, -1.5, .16), "#7a5a3a")
      + pendel(-.2, -.9, L("M-.4 -.8L0 -1.5M.4 -.8L0 -1.5", "#7a5a3a", .22) + F(kreis(0, -1.6, .28), "#b9b1a3"), 10, .4) + L("M-2.8 -.2Q-3.8 -.5 -4.2 .1", "#7a5a3a", .34), 2.6) + spiegel(2.8)) },

  // Kormoran trocknet seine Flügel
  { n: "kormoran", ort: "wasser", platz: "wasser-*", wetter: "sbr",
    bild: aufWasser(F(rechteck(-.3, -2.2, .6, 3), "#6b4a32") + ringe(0, 1.2) + L("M-.1 -2.3V-2.8M.2 -2.3V-2.8", TINTE, .08) + E(0, -3.5, .6, .9, "#2a2a2c")
      + pendel(-.4, -3.9, F("M-.4 -3.9L-2.4 -4.6L-2.2 -3.4L-1.6 -3.6L-1.4 -3L-.5 -3.2Z", "#2a2a2c"), 5, 1.2) + pendel(.4, -3.9, F("M.4 -3.9L2.4 -4.6L2.2 -3.4L1.6 -3.6L1.4 -3L.5 -3.2Z", "#2a2a2c"), 5, 1.2, -.6)
      + L("M.1 -4.2Q.3 -4.9 .2 -5.4", "#2a2a2c", .3) + vogelkopf(.2, -5.5, "#2a2a2c", "#c9a23c")) },

  // Haubentaucher mit Küken auf dem Rücken
  { n: "haubentaucher", ort: "wasser", platz: "wasser-*", zeit: "fs",
    bild: aufWasser(schaukel(E(0, -.5, 1.9, .7, "#8a7460") + E(.2, -.3, 1.4, .4, "#e6dccb") + L("M1.4 -.8Q1.8 -1.8 1.7 -2.4", "#e6dccb", .34) + vogelkopf(1.7, -2.5, "#e6dccb", "#e9a58c") + F("M1.3 -2.7L1 -3.3L1.6 -3L1.7 -3.5L2 -2.9Z", "#3d3934") + F("M1.4 -2.3Q1.1 -2 1.5 -1.9Z", "#b5651d")
      + am(-.5, -1.1, .5, E(0, 0, .8, .6, "#b9b1a3") + vogelkopf(.6, -.5, "#b9b1a3", "#e9a58c")) + am(-1.2, -1, .44, E(0, 0, .8, .6, "#b9b1a3") + vogelkopf(.6, -.5, "#b9b1a3", "#e9a58c")), 2.8) + spiegel(2.2)) },

  // Ein Seehund hat sich verirrt
  { n: "seehund", ort: "wasser", platz: "wasser-*", stufe: 3,
    bild: aufWasser(ringe(0, 2.2) + ueberWasser("seehund", `<g class="fu-seehund">` + F("M-1 1.4Q-1.1 -1.6 0 -1.8Q1.1 -1.6 1 1.4Z", "#8f98a3") + E(0, -.9, .6, .4, "#b9c0c8") + `<circle cx="-.36" cy="-1.3" r=".1" fill="${TINTE}"/><circle cx=".36" cy="-1.3" r=".1" fill="${TINTE}"/><circle cx="0" cy="-1" r=".12" fill="${TINTE}"/>`
      + L("M-.2 -.9L-1.1 -1M-.2 -.8L-1 -.6M.2 -.9L1.1 -1M.2 -.8L1 -.6", "#fdfcf9", .04) + `</g>`)),
    css: `.fu-seehund{animation:fu-seehund 8s ease-in-out infinite}@keyframes fu-seehund{0%,25%,100%{translate:0 3px}35%,80%{translate:0 0}}` },

  // Delfine springen (ganz selten)
  { n: "delfin", ort: "wasser", platz: "wasser-*", stufe: 3, zeit: "fs",
    bild: aufWasser(ringe(-2.4, 1.4) + ringe(2.6, 1.4) + ueberWasser("delfin", `<g class="fu-delfin">` + F("M-2.6 .4Q-1.8 -3.4 1.4 -3.6Q2.6 -3.4 3.4 -2.4Q2.2 -2.6 1.4 -2.2Q-.4 -1.4 -1.2 .6Z", "#7f93a8") + F("M-.2 -3.2Q.2 -4.4 1 -4.2Q.6 -3.6 .8 -3.3Z", "#6a7f94") + F("M.8 -2.5Q.2 -1.9 -.6 -1.7Q.2 -2.4 .6 -2.6Z", "#b9c7d4") + `<circle cx="2.2" cy="-3" r=".1" fill="${TINTE}"/></g>`)),
    css: `.fu-delfin{transform-box:view-box;transform-origin:0 2px;animation:fu-delfin 5s ease-in-out infinite}@keyframes fu-delfin{0%,45%,100%{rotate:-80deg;translate:-2px 2px}60%{rotate:-10deg;translate:0 -1px}78%{rotate:70deg;translate:2px 2px}}` },

  // Eisscholle mit Möwe (im Winter)
  { n: "eisscholle", ort: "wasser", platz: "wasser-weg", zeit: "w", wetter: "nsb",
    bild: fahrt(am(0, 0, 1, `<g class="fu-wipp" style="--d:2.4s;--h:.15px">` + F("M-3.4 -.3L-2.4 -.8H2.2L3.4 -.4L2.6 .3H-2.6Z", "#f4f8fb") + F("M-3.4 -.3L-2.6 .3H2.6L3.4 -.4L2.4 0H-2.4Z", "#c9dce8") + am(.4, -.8, .9, L("M-.1 0v-.3M.14 0v-.3", TINTE, .07) + E(0, -.62, .62, .42, "#f6f6f4") + vogelkopf(.6, -1, "#f6f6f4", "#f0b83a")) + `</g>`), { von: 520, bis: 760, d: 110, v: -50, y: 8 }) },

  // Schildkröte sonnt sich auf Treibholz
  { n: "schildkroete", ort: "wasser", platz: "wasser-*", zeit: "s", stufe: 2, wetter: "sb",
    bild: aufWasser(schaukel(F("M-3.6 -.5Q0 -1 3.6 -.4Q0 .3 -3.6 -.5Z", "#7a5a3a") + L("M2.4 -.6L3.4 -1.6M3 -1.2L3.6 -1.3", "#7a5a3a", .16) + F("M-1.4 -.7Q-.2 -2.2 1 -.7Z", "#5f8f4a") + L("M-.9 -.8Q-.2 -1.6 .5 -.8M-.2 -1.5V-.8", "#3f6a34", .08)
      + pendel(1, -.9, L("M1 -.9L1.7 -1.3", "#8ab36a", .3) + `<circle cx="1.8" cy="-1.36" r=".06" fill="${TINTE}"/>`, 8, 2.2) + L("M-1.3 -.7L-1.8 -.5M.6 -.7L.9 -.5", "#8ab36a", .2), 4.2) + spiegel(3)) },

  // Frosch auf dem Seerosenblatt
  { n: "frosch", ort: "wasser", platz: "wasser-*", zeit: "fs",
    bild: aufWasser(E(0, .1, 2.2, .5, "#5fae5a") + F("M0 .1L2.2 -.2V.4Z", "#c9dfee") + E(-3, .5, 1.2, .3, "#5fae5a") + F(kreis(-3.1, .2, .34), "#fdfcf9") + F(kreis(-3.1, .2, .16), "#f4c542")
      + `<g class="fu-huepf" style="--d:5s;--h:-1.6px">` + E(-.3, -.5, .8, .56, "#3f8a44") + `<circle cx="-.6" cy="-1" r=".24" fill="#3f8a44"/><circle cx="0" cy="-1" r=".24" fill="#3f8a44"/><circle cx="-.6" cy="-1.02" r=".1" fill="${TINTE}"/><circle cx="0" cy="-1.02" r=".1" fill="${TINTE}"/>` + L("M-.9 -.2L-1.3 0M.3 -.2L.7 0", "#3f8a44", .2) + `</g>`) },

  // Eine Gondel wie in Venedig (ganz selten)
  { n: "gondel", ort: "wasser", platz: "wasser-weg", zeit: "fs", stufe: 3,
    bild: fahrt(am(0, 0, 1, F("M-5.6 -1.8Q-5.2 -.4 -3.6 -.2H3.4Q5.2 -.3 5.8 -2.2Q5 -.9 3.4 -.8H-3.6Q-5 -.8 -5.6 -1.8Z", "#1f1c1a") + L("M5.8 -2.2L5.6 -2.8H5.2", "#b9b1a3", .14) + sitzer(-1.4, -.7, "#e9506b", HAUT[0], "#8a5a34") + sitzer(-.2, -.7, "#2f3542", HAUT[1], "#262321")
      + am(3, -.8, 1.15, figur({ mantel: "#fdfcf9", hose: "#1f1c1a", kopf: "hut", hut: "#e6cf9a", armV: [.9, -3], schatten: false, vorn: F("M-.66 -3.4h1.32v.2h-1.32ZM-.68 -2.9h1.36v.2h-1.36Z", "#c8102e") })) + pendel(4, -4, L("M4.2 -5.6L3.6 1.2", "#8a5f38", .12), 6, 1.4)), { von: 500, bis: 780, d: 64, v: -22, y: 9 }) },

  // Wikingerschiff (ganz selten)
  { n: "wikingerschiff", ort: "wasser", platz: "wasser-weg", stufe: 3,
    bild: fahrt(am(0, 0, 1, F("M-5.4 -1.2Q-5 .3 -3.4 .3H3.4Q5 .3 5.6 -1.4Q6.4 -2.6 5.8 -3.4Q5.2 -2.4 4.6 -1.2Z", "#7a4a2a") + F("M5.8 -3.4Q6.6 -3.9 6.9 -3.3L6.2 -3.1Z", "#7a4a2a") + L("M-5.4 -1.2Q-6.2 -2.2 -5.8 -2.8", "#7a4a2a", .34)
      + [-3.6, -2.2, -.8, .6, 2, 3.4].map((x, i) => `<circle cx="${x}" cy="-.9" r=".6" fill="${["#c8102e", "#f4c542", "#2f5fb5"][i % 3]}"/><circle cx="${x}" cy="-.9" r=".16" fill="#b9b1a3"/>`).join("") + L("M0 -1.2V-7", "#6b4a2e", .2)
      + `<g class="fu-wipp" style="--d:2s;--h:.15px">` + F("M-3.2 -6.6Q0 -6 3.2 -6.6Q2.6 -4.4 3.2 -2.4Q0 -3 -3.2 -2.4Q-2.6 -4.4 -3.2 -6.6Z", "#fdfcf9") + F("M-1.9 -6.4Q-1.5 -4.4 -1.9 -2.6L-.7 -2.8Q-.4 -4.5 -.7 -6.3ZM.7 -6.3Q1 -4.5 .7 -2.8L1.9 -2.6Q1.5 -4.4 1.9 -6.4Z", "#c8102e") + `</g>`), { von: 495, bis: 785, d: 76, v: -28, y: 7 }) },
];
