// Fundstücke am Rheinufer, Teil 2: kleine Szenen an einem festen Platz (höchstens 16 breit, um x = 0 gezeichnet).
import { f, am, dreh, figur, vogel, rad, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E, schatten, amUfer } from "./hilfen.mjs";
import { hund, taube, geht, steht, pendel } from "./ufer-leute.mjs";

const HERZ = "M0 .9C-.8 .3 -1 -.1 -1 -.4C-1 -.75 -.75 -1 -.45 -1C-.25 -1 -.1 -.88 0 -.7C.1 -.88 .25 -1 .45 -1C.75 -1 1 -.75 1 -.4C1 -.1 .8 .3 0 .9Z";
const NOTE = "M0 0a.34 .25 0 1 1 -.02 -.3V-1.5l.8 -.2v.36l-.6 .16V0";
const FUNKEL = "M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z";
// Laubbaum in den Farben der Jahreszeit (nur für Frühling bis Herbst – im Winter stehen die echten Bäume kahl)
const baum = (x, h = 10, g = 2.6) => F(rechteck(x - .32, -h + g * .6, .64, h - g * .6), "#8a7d6e") + `<path style="fill:var(--ba,#8da582)" d="${kreis(x, -h, g) + kreis(x - g * .64, -h + g * .34, g * .62) + kreis(x + g * .68, -h + g * .3, g * .58)}"/><path style="fill:var(--bh,#a8bb9b)" d="${kreis(x - g * .3, -h - g * .32, g * .46)}"/>`;
const auf = (innen, { d = 4, v = 0, x = .6, h = -4, o = .9 } = {}) => `<g class="fu-auf" style="--d:${d}s;--v:${v}s;--x:${x}px;--h:${h}px;--o:${o}">${innen}</g>`;
const weste = F("M-.72 -1.95L-.66 -3.5Q-.66 -3.98 -.2 -3.98H.2Q.66 -3.98 .66 -3.5L.72 -1.95Z", "#f19a4a") + F("M-.7 -2.75h1.4v.26h-1.4ZM-.71 -2.3h1.42v.2h-1.42Z", "#f6f0c8");
const becher = (x, y) => F(`M${f(x - .16)} ${f(y - .5)}h.32l-.05 .5h-.22Z`, "#fdfcf9") + F(rechteck(x - .18, y - .56, .36, .08), "#5f564c");
const kelch = (x, y, wein = "#f1e2a0") => F(`M${f(x - .2)} ${f(y - 1)}h.4q0 .5 -.2 .5t-.2 -.5Z`, wein);
const glas = (x, y, wein) => L(`M${x} ${y}v-.5M${f(x - .16)} ${y}h.32`, "#dfe8ec", .07) + kelch(x, y, wein);
const bank = (x1, x2, h = 2.2) => F(rechteck(x1, -h, x2 - x1, .24), "#9a6e44") + F(rechteck(x1 + .1, -h - 1.55, x2 - x1 - .2, .22) + rechteck(x1 + .1, -h - 1, x2 - x1 - .2, .22), "#8a5f38") + L(`M${x1 + .5} 0V${-h - 1.5}M${x2 - .5} 0V${-h - 1.5}`, "#5f564c", .2);
const EIS = `.fu-eis-arm{animation:fu-eis 2.2s ease-in-out infinite}@keyframes fu-eis{0%,55%,100%{rotate:0deg}70%,85%{rotate:-9deg}}`;

export default [
  // Angler mit Klappstuhl, Eimer und zuckender Rute
  { n: "angler", ort: "ufer", platz: "ufer-*", wetter: "sbr",
    bild: amUfer(schatten(2.2) + L("M-1.1 -2.2H1.1M-.9 -2.2L.8 0M.9 -2.2L-.8 0", "#857d70", .2)
      + F("M-3.6 -1.3H-2.2L-2.4 0H-3.4Z", "#5f8fb5") + L("M-3.55 -1.3Q-2.9 -2.1 -2.25 -1.3", "#857d70", .1) + pendel(-2.9, -1.3, F("M-2.9 -1.3L-3.2 -2L-2.6 -2Z", "#9fb0bb"), 20, .5)
      + am(-.1, 0, 1.25, figur({ sitzen: true, mantel: "#6f8f4e", hose: "#5a5248", kopf: "hut", hut: "#8a8a5a", haar: "#9a9288", armV: [1.2, -2.9], armH: [1, -2.8], schatten: false }))
      + pendel(1.4, -3.6, L("M1.2 -3.5L7.2 -7.6", "#6b4a2c", .16) + L("M7.2 -7.6Q7.5 -3 7.4 1.6", "#fdfcf9", .06), 2.2, .9)) },

  // Auf der Bank liest jemand das Boniblatt
  { n: "zeitungsleser", ort: "ufer", platz: "ufer-*",
    bild: amUfer(bank(-3.4, 3.4) + am(-.9, 0, 1.25, figur({ sitzen: true, mantel: "#8a6b4f", hose: "#4b5261", kopf: "hut", hut: "#5a5248", haar: "#b9b1a5", armV: [1.2, -3.1], armH: [1.05, -3.3], schatten: false }))
      + pendel(.2, -3.4, F("M.3 -6L2.2 -5.6V-3.1L.3 -3.5Z", "#fdfcf9", `stroke="#8f9aa3" stroke-width=".07"`) + F("M2.2 -5.6L3 -5.85V-3.35L2.2 -3.1Z", "#ebe6dc", `stroke="#8f9aa3" stroke-width=".07"`)
        + F("M.75 -5.25a.5 .5 0 0 1 .98 .2Z", "#c8102e") + L("M.55 -4.7L1.95 -4.4M.55 -4.3L1.95 -4M.55 -3.9L1.95 -3.6", "#8f9aa3", .09), 2.5, 2.2)
      + becher(2.4, -2.2) + auf(L("M2.4 -2.9q.2 -.3 0 -.6", "#fff", .08), { d: 2.6, h: -1.2, x: .2 }) + am(5.6, 0, 1.5, taube(-1, -.8))) },

  // Eiswagen mit gestreiftem Dach; ein Kind schleckt schon
  { n: "eiswagen", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "s",
    bild: amUfer(schatten(3.4, 1.5) + steht(2.6, { mantel: "#fdfcf9", kopf: "kappe", hut: "#f29bb0", haar: "#4a3a2e", armV: [-1.2, -3.2], s: -1, schatten: false })
      + L("M-.6 -3V-6.4M4.2 -3V-6.4", "#857d70", .16) + F("M-.9 -3.4H4.5V-1H-.9Z", "#fbf3e2") + F("M-.9 -3.4H4.5v.4H-.9Z", "#f29bb0") + F("M0 -2.5a.5 .5 0 0 1 1 0L.5 -1.4Z", "#e9c58a") + `<circle cx=".5" cy="-2.62" r=".42" fill="#f29bb0"/><circle cx="2.2" cy="-2.2" r=".5" fill="#8ccf7e"/><circle cx="3.3" cy="-2.2" r=".5" fill="#f4e3b0"/>`
      + F("M-1.4 -6.3Q1.8 -7.6 5 -6.3V-5.7H-1.4Z", "#fdfcf9") + F("M-1.4 -5.7V-6.3Q-.6 -6.7 .2 -6.9V-5.7ZM1.8 -5.7V-7.15Q2.6 -7.1 3.4 -6.9V-5.7Z", "#f29bb0") + rad(0, -.8, .8, { d: 9 }) + rad(3.6, -.8, .8, { d: 9 })
      + am(-4.3, 0, .98, figur({ mantel: "#6fb0e6", hose: "#4b5261", kopf: "zopf", haar: "#d2a95c", armV: [.75, -4.1], klV: "fu-eis-arm", inHand: F("M.5 -4.3h.5l-.25 .9Z", "#e9c58a") + `<circle cx=".75" cy="-4.45" r=".3" fill="#f29bb0"/>` }))),
    css: EIS },

  // Straßenmusik: Gitarre, offener Koffer, Noten steigen auf
  { n: "strassenmusiker", ort: "ufer", platz: "ufer-*",
    bild: amUfer(am(-1, 0, 1.3, figur({ mantel: "#a8456b", hose: "#3f3a44", kopf: "hut", hut: "#3d3934", haar: "#4a3a2e", armH: [-1.15, -3.55], armV: [.5, -2.7], klV: "fu-mus-arm",
        vorn: L("M-.2 -2.9L-1.5 -3.75", "#6b4a2c", .22) + E(.35, -2.6, .82, .6, "#c98a4a", `transform="rotate(-25 .35 -2.6)"`) + `<circle cx=".3" cy="-2.62" r=".22" fill="#5a3a22"/>` }), "fu-wipp", "--d:.45s;--h:-.06px")
      + F("M2 -.5H5.4L5.1 0H2.3Z", "#3d3934") + F("M2 -.5H5.4L5.6 -1.5H1.8Z", "#5a4a40") + F(kreis(3, -.3, .14) + kreis(3.7, -.24, .14) + kreis(4.3, -.3, .14), "#f4c542")
      + [0, 1, 2].map(i => `<g transform="translate(${.6 + i * .5} ${-7.4 - i * .3}) scale(.8)">` + auf(L(NOTE, TINTE, .2) + E(-.33, -.14, .34, .25, TINTE), { d: 3.3, v: -i * 1.1, x: 1.6 + i, h: -3.4 }) + `</g>`).join("")),
    css: `.fu-mus-arm{animation:fu-mus .2s ease-in-out infinite alternate}@keyframes fu-mus{from{rotate:-9deg}to{rotate:9deg}}` },

  // Weinstand am Rhein: zwei stoßen am Fass an
  { n: "weinstand", ort: "ufer", platz: "ufer-*", zeit: "fs",
    bild: amUfer(schatten(3, -4) + steht(-4, { mantel: "#fdfcf9", kopf: "dutt", haar: "#6b4a2e", schatten: false, armV: [1.1, -2.9] }) + L("M-6.4 0V-7M-1.6 0V-7", "#8a5f38", .22) + F("M-6.6 -3.1H-1.4V0H-6.6Z", "#a9764a") + F("M-6.8 -3.4H-1.2v.36H-6.8Z", "#8a5f38") + L("M-5.3 -3V0M-4 -3V0M-2.7 -3V0", "#8a5f38", .08)
      + F("M-7 -7.9H-1L-.6 -6.6H-7.4Z", "#8e2f4a") + F("M-5.8 -7.9h1.2l.1 1.3h-1.4ZM-3.4 -7.9h1.2l.3 1.3h-1.4Z", "#f3ead2") + F(kreis(-4.2, -9, .32) + kreis(-3.8, -8.6, .32) + kreis(-4.6, -8.6, .32) + kreis(-4.2, -8.25, .32), "#7a4a8a") + L("M-4.2 -9.3q.5 -.5 .9 -.2", "#6f8f4e", .14)
      + glas(-2.6, -3.4) + glas(-5.4, -3.4, "#b0405a")
      + F("M2.6 -3H4.6Q5.1 -1.5 4.6 0H2.6Q2.1 -1.5 2.6 -3Z", "#a9764a") + L("M2.4 -2.2H4.8M2.4 -.8H4.8", "#5f564c", .14) + F("M2.2 -3.3H5v.3H2.2Z", "#8a5f38")
      + am(.9, 0, 1.3, figur({ mantel: "#4f8fd0", hose: "#4b5261", kopf: "kurz", haar: "#2a211c", armV: [1.2, -3.55], klV: "fu-wein-a", inHand: kelch(1.25, -3.7) }))
      + am(6.5, 0, 1.3, figur({ s: -1, mantel: "#d9a441", hose: "#3f3a44", kopf: "lang", haar: "#8a4a2e", armV: [-1.2, -3.55], klV: "fu-wein-b", inHand: kelch(-1.25, -3.7, "#b0405a") }))),
    css: `.fu-wein-a,.fu-wein-b{animation:fu-wein 4s ease-in-out infinite}.fu-wein-b{animation-name:fu-wein2}@keyframes fu-wein{0%,40%,70%,100%{rotate:0deg}50%,58%{rotate:14deg}}@keyframes fu-wein2{0%,40%,70%,100%{rotate:0deg}50%,58%{rotate:-14deg}}` },

  // Malerin an der Staffelei – auf der Leinwand entsteht das Logo
  { n: "malerin", ort: "ufer", platz: "ufer-*", zeit: "fs", stufe: 2,
    bild: amUfer(L("M2.2 0L3.6 -6.4L5 0M3.6 -6.4L4.6 -.4", "#8a5f38", .2) + F("M1.7 -6.3H5.5V-3.2H1.7Z", "#fdfcf9", `stroke="#8a5f38" stroke-width=".14"`) + F("M2.5 -4.3a1.1 1.1 0 0 1 2.2 0Z", "#c8102e") + F("M2.9 -4.3V-5l.25 -.5l.25 .5v.2l.25 -.7l.25 .7v-.3l.25 -.4l.25 .4v1.1Z", TINTE) + F("M1.9 -4.3H5.3v.5H1.9Z", "#a9c9de")
      + am(-.6, 0, 1.3, figur({ mantel: "#3f7a52", hose: "#4b5261", kopf: "lang", haar: "#3b2a22", armV: [1.45, -3.7], klV: "fu-mal-arm", inHand: L("M1.45 -3.7L2.1 -3.95", "#6b4a2c", .1) + F("M2.05 -4.05l.3 .05l-.26 .16Z", "#c8102e"),
        armH: [-.9, -2.8], hinten: E(-1.25, -2.75, .7, .45, "#c9a67c") + F(kreis(-1.5, -2.85, .14), "#c8102e") + F(kreis(-1.15, -2.95, .14), "#f4c542") + F(kreis(-.95, -2.65, .14), "#4f8fd0") }))
      + F("M-1.45 -6.9Q-.9 -7.45 -.15 -7Q0 -6.75 -.3 -6.65Q-.9 -6.85 -1.45 -6.65Z", "#8e2f4a")),
    css: `.fu-mal-arm{animation:fu-mal 1.3s ease-in-out infinite alternate}@keyframes fu-mal{from{rotate:-7deg}to{rotate:6deg}}` },

  // Erinnerungsfoto: es blitzt
  { n: "fotograf", ort: "ufer", platz: "ufer-*",
    bild: amUfer(am(-4, 0, 1.3, figur({ mantel: "#5f8a6e", hose: "#5a5248", kopf: "kappe", hut: "#f4c542", haar: "#4a3a2e", armV: [.95, -4.35], armH: [.6, -4.3], inHand: F("M.75 -4.95h.95v.75h-.95Z", TINTE) + `<circle cx="1.72" cy="-4.56" r=".24" fill="#8f9aa3"/>` }))
      + `<path class="fu-foto-blitz" fill="#fff" transform="translate(-1.7 -6.1) scale(.9)" d="${FUNKEL}"/>`
      + am(3, 0, 1.3, figur({ s: -1, mantel: "#e9506b", hose: "#3f4654", kopf: "lang", haar: "#d2a95c", armV: [-1.15, -4.7], klV: "fu-foto-wink" })) + am(5.3, 0, .95, figur({ s: -1, mantel: "#6fb0e6", kopf: "muetze", hut: "#f19a4a", armV: [-.9, -4.6] }), "fu-huepf", "--d:2.6s;--h:-.5px")),
    css: `.fu-foto-blitz{transform-box:fill-box;transform-origin:50% 50%;animation:fu-foto 4.2s ease-out infinite}@keyframes fu-foto{0%,66%,78%,100%{opacity:0;scale:.2}70%{opacity:1;scale:1.25}74%{opacity:.5;scale:.8}}
.fu-foto-wink{animation:fu-foto-w .5s ease-in-out infinite alternate}@keyframes fu-foto-w{from{rotate:-8deg}to{rotate:10deg}}` },

  // Baustelle: einer schaufelt, zwei schauen zu
  { n: "baustelle", ort: "ufer", platz: "ufer-*", wetter: "sbr",
    bild: amUfer(L("M-7 0V-3M-2.6 0V-3", "#857d70", .2) + F("M-7.3 -3.2H-2.3V-2.2H-7.3Z", "#fdfcf9") + F("M-6.8 -3.2h1l-.8 1h-1ZM-4.8 -3.2h1l-.8 1h-1ZM-2.8 -3.2h.5v.4l-.5 .6h-.5Z", "#d6243a")
      + steht(-5.6, { mantel: "#5a6a7a", kopf: "helm", hut: "#fdfcf9", armV: [.9, -2.5], armH: [-.9, -2.5], vorn: weste }) + steht(-3.4, { mantel: "#5a6a7a", kopf: "helm", hut: "#f4c542", haut: HAUT[1], armV: [.9, -3.3], inHand: becher(.95, -3.3), vorn: weste })
      + E(3.6, -.3, 2, .8, "#d9c08a") + E(3.2, -.6, 1, .5, "#e6d2a2")
      + am(.6, 0, 1.3, figur({ mantel: "#5a6a7a", kopf: "helm", hut: "#f19a4a", haut: HAUT[3], armV: [1.3, -2.6], armH: [1, -3.1], vorn: weste, klV: "fu-bau-arm", inHand: L("M.7 -3.6L1.9 -1.2", "#6b4a2c", .14) + F("M1.6 -1.4L2.3 -1.1L2.2 -.2L1.5 -.6Z", "#8f9aa3") }), "fu-bau", "")
      + F("M5.9 0L6.4 -1.7H6.9L7.4 0Z", "#f19a4a") + F("M6.25 -1.1h.8l.1 .36h-1Z", "#fdfcf9")),
    css: `.fu-bau-arm{animation:fu-bau-a 1.8s ease-in-out infinite}@keyframes fu-bau-a{0%,100%{rotate:0deg}35%{rotate:14deg}60%{rotate:-26deg}}
.fu-bau{transform-box:view-box;transform-origin:0px 0px;animation:fu-bau 1.8s ease-in-out infinite}@keyframes fu-bau{0%,100%{rotate:0deg}35%{rotate:5deg}60%{rotate:-2deg}}` },

  // Vermessung: „noch ein Stück … zurück“
  { n: "vermessung", ort: "ufer", platz: "ufer-*", stufe: 2,
    bild: amUfer(L("M-3 -4.4L-4.3 0M-3 -4.4L-1.7 0M-3 -4.4V-.3", "#d9a441", .2) + F("M-3.7 -5.3H-2.1V-4.4H-3.7Z", "#f4c542") + `<circle cx="-2" cy="-4.85" r=".3" fill="#5f564c"/>`
      + am(-5.4, 0, 1.3, figur({ mantel: "#5a6a7a", kopf: "kappe", hut: "#3f7a52", armV: [1.25, -4.5], klV: "fu-verm-arm", vorn: weste }))
      + `<g class="fu-verm">` + steht(5.2, { s: -1, mantel: "#5a6a7a", kopf: "helm", hut: "#f4c542", haut: HAUT[1], armV: [-1.1, -3.4], vorn: weste }) + F("M3.6 -8.2h.34V0H3.6Z", "#fdfcf9") + F("M3.6 -8.2h.34v1H3.6ZM3.6 -6.2h.34v1H3.6ZM3.6 -4.2h.34v1H3.6ZM3.6 -2.2h.34v1H3.6Z", "#d6243a") + `</g>`),
    css: `.fu-verm{animation:fu-verm 5s ease-in-out infinite}@keyframes fu-verm{0%,20%,100%{translate:0 0}40%,60%{translate:1.2px 0}80%{translate:-.4px 0}}
.fu-verm-arm{animation:fu-verm-a 5s ease-in-out infinite}@keyframes fu-verm-a{0%,18%,62%,100%{rotate:0deg}25%{rotate:-22deg}32%{rotate:-6deg}39%{rotate:-22deg}68%{rotate:16deg}76%{rotate:0deg}}` },

  // Heiratsantrag am Rhein
  { n: "heiratsantrag", ort: "ufer", platz: "ufer-*", zeit: "fs", wetter: "s", stufe: 2,
    bild: amUfer(schatten(2, -1.8) + am(-2, 1.1, 1.3, figur({ mantel: "#343a48", hose: "#343a48", haar: "#2a211c", haut: HAUT[1], schatten: false, armV: [1.45, -3.5], armH: [-.5, -2.4],
        beine: L("M.26 -2.05H1.35V-.95", "#343a48", .5) + E(1.55, -.9, .42, .17, TINTE) + L("M-.26 -2.05V-1.05H-1.5", "#343a48", .5) + E(-1.7, -1, .3, .17, TINTE),
        inHand: F("M1.2 -4.1h.6v.5h-.6Z", "#8e2f4a") + `<path class="fu-blink" style="--d:.5s" fill="#fff" transform="translate(1.5 -4.3) scale(.26)" d="${FUNKEL}"/>` }))
      + am(2.2, 0, 1.3, figur({ s: -1, mantel: "#fdfcf9", rock: true, kopf: "lang", haar: "#8a4a2e", armV: [-.6, -4.35], armH: [.1, -4.3] }), "fu-huepf", "--d:1.5s;--h:-.3px")
      + [0, 1, 2].map(i => `<g transform="translate(${-.6 + i * .9} ${-7.6 - i * .5}) scale(.55)">` + auf(F(HERZ, i % 2 ? "#f29bb0" : "#e9506b"), { d: 3.6, v: -i * 1.2, x: (i - 1) * 1.6, h: -6 }) + `</g>`).join("")) },

  // Ballonverkäufer mit einer großen Traube
  { n: "ballonverkaeufer", ort: "ufer", platz: "ufer-*", zeit: "fsh",
    bild: amUfer(steht(-1.5, { mantel: "#c8553d", hose: "#4b5261", kopf: "hut", hut: "#f4c542", haar: "#4a3a2e", armV: [1.05, -4.4] })
      + dreh("fu-pendel", -.1, -5.7, [[-2.2, -11, 0], [-.4, -12.6, 1], [1.5, -11.6, 2], [3, -10, 3], [-1.2, -9.4, 4], [.7, -9.9, 5], [2.2, -8.6, 0], [-2.6, -8.4, 2], [.2, -7.8, 1]].map(([x, y, c]) =>
        L(`M-.1 -5.7L${x} ${f(y + 1.2)}`, "#857d70", .05) + E(x, y, .95, 1.15, BUNT[c]) + E(x - .3, y - .4, .22, .36, "#fff", `opacity=".45" transform="rotate(-24 ${f(x - .3)} ${f(y - .4)})"`)).join(""), "--w:3deg;--d:2.6s")
      + am(4.2, 0, .95, figur({ s: -1, mantel: "#8ccf7e", hose: "#4b5261", kopf: "zopf", haar: "#6b4a2e", armV: [-1.05, -4.7] }), "fu-huepf", "--d:1.9s;--h:-.45px")) },

  // Seifenblasen
  { n: "seifenblasen", ort: "ufer", platz: "ufer-*", zeit: "fs",
    bild: amUfer(am(-3.4, 0, 1, figur({ mantel: "#b07cd8", hose: "#4b5261", kopf: "zopf", haar: "#3b2a22", haut: HAUT[4], armV: [1.05, -4.3], inHand: L("M1.05 -4.3L1.6 -4.7", "#f19a4a", .1) + `<circle cx="1.85" cy="-4.9" r=".3" fill="none" stroke="#f19a4a" stroke-width=".1"/>` }))
      + [[.5, -5.2, .5, 5, -5], [1.2, -5, .8, 7, -7], [.3, -4.6, .36, 3.5, -3], [1.6, -5.6, .62, 8.5, -4.5], [.8, -4.4, .44, 6, -8.5], [1.3, -5.3, .3, 9.5, -6.4], [.9, -5.7, .7, 4.2, -9]].map(([x, y, r, dx, dy], i) =>
        auf(`<circle cx="${f(-1.55 + x)}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".28" stroke="#fff" stroke-width=".09"/><circle cx="${f(-1.55 + x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .2)}" fill="#fff"/>`, { d: 5.2, v: -i * .75, x: dx, h: dy, o: 1 })).join("")
      + `<g class="fu-huepf" style="--d:1.6s;--h:-1.1px">` + am(4.4, 0, .85, hund({ farbe: "#f1ede4", dunkel: "#b98a5a", gehen: false })) + `</g>`) },

  // Schaukel
  { n: "schaukel", ort: "ufer", platz: "ufer-*", zeit: "fsh",
    bild: amUfer(L("M0 -8.6L-3.4 0M0 -8.6L3.4 0M-2.2 -3H2.2", "#8a5f38", .3) + schatten(1.5)
      + dreh("fu-pendel", 0, -8.6, L("M0 -8.6V-2.5", "#857d70", .09) + F("M-.9 -2.5H.9v.26H-.9Z", "#8a5f38") + am(-.2, -.6, .95, figur({ sitzen: true, mantel: "#f4c542", hose: "#4b5261", kopf: "zopf", haar: "#8a4a2e", armV: [.4, -4.4], armH: [.2, -4.3], schatten: false })), "--w:24deg;--d:1.35s")) },

  // Hängematte zwischen zwei Bäumen
  { n: "haengematte", ort: "ufer", platz: "ufer-*", zeit: "s", wetter: "s",
    bild: amUfer(baum(-6.2, 10.5, 2.5) + baum(6.2, 10, 2.4) + schatten(4)
      + dreh("fu-pendel", 0, -4.8, L("M-5.9 -4.8L-4.6 -4.1M5.9 -4.8L4.6 -4.1", "#857d70", .1) + `<circle cx="-3.6" cy="-4.2" r=".8" fill="${HAUT[0]}"/>` + F("M-4.5 -4.3a.9 .9 0 0 1 1.8 -.3Z", "#f4c542") + L("M-4.7 -4.25h2.1", "#f4c542", .2)
        + F("M-4.6 -4.1Q0 -.6 4.6 -4.1Q0 -2.9 -4.6 -4.1Z", "#e9506b") + L("M-3.4 -3.25Q0 -1.5 3.4 -3.25", "#fdfcf9", .16) + dreh("fu-pendel", 3.3, -3.5, L("M3.3 -3.5L3.9 -4.6", "#4b5261", .4) + E(4, -4.75, .2, .38, TINTE), "--w:9deg;--d:.8s")
        + pendel(-1.6, -2.6, L("M-1.6 -2.6V-1.2", HAUT[0], .3), 6, 1.9), "--w:2.4deg;--d:2.8s")) },

  // Jongleur
  { n: "jongleur", ort: "ufer", platz: "ufer-*", zeit: "fsh", stufe: 2,
    bild: amUfer(steht(0, { mantel: "#7a6a9a", hose: "#d6243a", kopf: "hut", hut: "#3d3934", haar: "#4a3a2e", armV: [1.2, -3.6], armH: [-1.2, -3.6], klV: "fu-jong-a", klH: "fu-jong-b" })
      + `<g transform="translate(0 -8.4) scale(1.75 3)">` + [0, 1, 2, 3].map(i => dreh("fu-dreh", 0, 0, E(1, 0, .2, .117, BUNT[i]), `--d:1.5s;--v:${-i * .375}s`)).join("") + `</g>`
      + F("M2.6 -.4H4.6L4.4 0H2.8Z", "#3d3934") + F(kreis(3.3, -.5, .14) + kreis(3.9, -.5, .14), "#f4c542")),
    css: `.fu-jong-a,.fu-jong-b{animation:fu-jong .375s ease-in-out infinite alternate}.fu-jong-b{animation-direction:alternate-reverse}@keyframes fu-jong{from{rotate:-7deg}to{rotate:9deg}}` },

  // Picknick auf der karierten Decke – die Ameisen kommen schon
  { n: "picknick", ort: "ufer", platz: "ufer-*", zeit: "s",
    bild: amUfer(F("M-5.4 0H5.4L4.7 -.55H-4.7Z", "#d6243a") + L("M-3.4 0L-3 -.55M-1.2 0L-1.1 -.55M1.2 0L1.1 -.55M3.4 0L3 -.55M-5 -.28H5", "#fdfcf9", .14)
      + am(-2.4, 2.1, 1.25, figur({ mantel: "#4f8fd0", hose: "#5a5248", kopf: "lang", haar: "#3b2a22", schatten: false, armV: [1.1, -3.1], beine: L("M-.2 -2.05H2", "#5a5248", .5) + E(2.2, -2.15, .17, .36, TINTE), inHand: F("M.8 -3.5l.9 .2l-.9 .4Z", "#e9c58a") }))
      + am(2.4, 1.6, .95, figur({ s: -1, mantel: "#f19a4a", hose: "#4b5261", kopf: "muetze", hut: "#8ccf7e", schatten: false, armV: [-1, -3.3], beine: L("M.2 -2.05H-1.9", "#4b5261", .5) + E(-2.1, -2.15, .17, .36, TINTE), klV: "fu-eis-arm" }))
      + F("M-.4 -1.5H.9L.75 -.5H-.25Z", "#b98a5a") + L("M-.4 -1.5Q.25 -2.5 .9 -1.5", "#8a5f38", .14) + F("M3.9 -1.5h.4v1h-.4Z", "#6f8f4e") + F(kreis(1.6, -.75, .26), "#d6243a")
      + `<g class="fu-pick-ameisen">` + [0, 1, 2, 3].map(i => F(kreis(6 + i * .8, -.12, .11) + kreis(6.2 + i * .8, -.14, .09), TINTE)).join("") + F(kreis(6.1, -.36, .13), "#e8d2a0") + `</g>`),
    css: EIS + `.fu-pick-ameisen{animation:fu-pick-am 16s linear infinite}@keyframes fu-pick-am{from{translate:1.5px 0}to{translate:-2.2px 0}}` },

  // Herbst: Der Laubbläser verteilt alles neu
  { n: "laubblaeser", ort: "ufer", platz: "ufer-*", zeit: "h",
    bild: amUfer(am(-4.6, 0, 1.3, figur({ mantel: "#5a6a7a", kopf: "kappe", hut: "#3d3934", haut: HAUT[1], vorn: weste, armV: [1.2, -2.7], armH: [.7, -2.9], inHand: F("M.5 -3.2H1.6V-2.3H.5Z", "#f19a4a") + L("M1.6 -2.75L2.9 -2.2", TINTE, .3) }), "fu-pendel", "transform-box:view-box;transform-origin:0px 0px;--w:2.5deg;--d:1.4s")
      + [[0, 5, -2.5], [1, 7, -4.5], [2, 8.5, -1.5], [3, 6, -5.5], [0, 9.5, -3.3], [2, 4.5, -.6]].map(([c, dx, dy], i) =>
        auf(F("M-.8 -2.9C-.5 -3.6 .3 -3.8 1 -3.5C.9 -2.8 .3 -2.2 -.4 -2.25Z", ["#d98a3d", "#c9642f", "#e0b04a", "#b5532e"][c], `transform="rotate(${i * 50} 0 -3)"`), { d: 1.7, v: -i * .28, x: dx, h: dy + 2, o: 1 })).join("")
      + E(5.2, -.35, 2.4, .9, "#c9642f") + E(4.6, -.7, 1.3, .6, "#e0b04a") + E(6.1, -.5, 1, .5, "#d98a3d")) },

  // Schneeballschlacht
  { n: "schneeballschlacht", ort: "ufer", platz: "ufer-*", zeit: "w", wetter: "n",
    bild: amUfer(E(-3.6, -.5, 1.6, 1.1, "#fdfdfd") + E(4, -.6, 1.8, 1.3, "#fdfdfd") + E(4.4, -1.2, 1, .8, "#eef2f5")
      + am(-6, 0, 1, figur({ mantel: "#d6243a", hose: "#3f4654", kopf: "muetze", hut: "#f4c542", armV: [.9, -4.6], klV: "fu-sb-a" }))
      + am(6.3, 0, 1, figur({ s: -1, mantel: "#4f8fd0", hose: "#3f3a44", kopf: "muetze", hut: "#8ccf7e", armV: [-.9, -4.6], klV: "fu-sb-b" }), "fu-sb-duck", "")
      + `<circle class="fu-sb-1" cx="-5" cy="-4.8" r=".34" fill="#fff" stroke="#b3c0cc" stroke-width=".08"/><circle class="fu-sb-2" cx="5.3" cy="-4.8" r=".34" fill="#fff" stroke="#b3c0cc" stroke-width=".08"/>`),
    css: `.fu-sb-1{animation:fu-sb1 3.2s linear infinite}.fu-sb-2{animation:fu-sb2 3.2s linear infinite}
@keyframes fu-sb1{0%,8%{translate:0 0;opacity:1}18%{translate:3.4px -2.3px}28%{translate:6.8px -2.6px}38%{translate:10px -.6px;opacity:1}41%,100%{translate:10.4px .4px;opacity:0}}
@keyframes fu-sb2{0%,50%{translate:0 0;opacity:0}52%,58%{translate:0 0;opacity:1}68%{translate:-3.4px -2.3px}78%{translate:-6.8px -2.6px}88%{translate:-9.8px -.4px;opacity:1}91%,100%{translate:-10.2px .5px;opacity:0}}
.fu-sb-a{animation:fu-sba 3.2s ease-out infinite}@keyframes fu-sba{0%{rotate:-50deg}8%,100%{rotate:20deg}}
.fu-sb-b{animation:fu-sbb 3.2s ease-out infinite}@keyframes fu-sbb{0%,50%{rotate:-20deg}51%{rotate:50deg}58%,100%{rotate:-20deg}}
.fu-sb-duck{animation:fu-sbd 3.2s ease-in-out infinite}@keyframes fu-sbd{0%,26%,48%,100%{translate:0 0}36%{translate:0 .9px}}` },

  // Regen: In die Pfütze springen
  { n: "pfuetze", ort: "ufer", platz: "ufer-*", wetter: "r",
    bild: amUfer(E(0, -.08, 3.6, .32, "#9fb4c4") + E(-.8, -.12, 1.6, .12, "#dfe9f0")
      + `<g class="fu-pf-kind">` + am(0, 0, 1.05, figur({ mantel: "#f4c542", hose: "#4b5261", kopf: "kapuze", hut: "#f4c542", schuh: "#d6243a", armV: [1.1, -3.3], armH: [-1.1, -3.3], schatten: false })) + `</g>`
      + [[-1, -1.2, -2.6], [1, 1.2, -2.6], [-1, -2.4, -1.4], [1, 2.4, -1.4], [-1, -.5, -3.2], [1, .5, -3.2]].map(([s, x, y], i) => `<circle class="fu-pf-tr" style="--x:${x}px;--y:${y}px" cx="${s * .7}" cy="-.3" r="${i < 4 ? .2 : .15}" fill="#dfe9f0" stroke="#8fa9be" stroke-width=".06"/>`).join("")),
    css: `.fu-pf-kind{animation:fu-pf 1.7s cubic-bezier(.3,0,.5,1) infinite}@keyframes fu-pf{0%,55%,100%{translate:0 0}25%{translate:0 -2.2px}50%{translate:0 .08px}}
.fu-pf-tr{animation:fu-pft 1.7s ease-out infinite}@keyframes fu-pft{0%,46%{translate:0 0;opacity:0}50%{opacity:1}72%{translate:var(--x) var(--y);opacity:.9}95%,100%{translate:calc(var(--x) * 1.3) -.1px;opacity:0}}` },

  // Wochenmarkt (Dienstag, Freitag, Samstag)
  { n: "marktstand", ort: "ufer", platz: "ufer-*", tage: "256",
    bild: amUfer(schatten(4, -1.5) + steht(-2, { mantel: "#3f7a52", kopf: "dutt", haar: "#b9b1a5", armV: [1.2, -3.2], schatten: false, vorn: F("M-.5 -3.5H.5V-1.95H-.5Z", "#fdfcf9") }) + L("M-5.6 0V-7M2.4 0V-7", "#8a5f38", .22)
      + F("M-6.2 -7.9H3L3.5 -6.5H-6.7Z", "#3f7a52") + F("M-4.7 -7.9h1.5l.05 1.4h-1.6ZM-1.7 -7.9h1.5l.2 1.4h-1.6ZM1.3 -7.9h1.5l.4 1.4h-1.6Z", "#fdfcf9") + L("M-6.7 -6.5q.85 .7 1.7 0t1.7 0t1.7 0t1.7 0t1.7 0t1.7 0", "#3f7a52", .16)
      + F("M-5.9 -2.9H2.7V0H-5.9Z", "#a9764a") + F("M-5.7 -3.6H-3.3L-3.1 -2.9H-5.9ZM-2.9 -3.6H-.5L-.3 -2.9H-3.1ZM-.1 -3.6H2.3L2.5 -2.9H-.3Z", "#c9a67c")
      + F(kreis(-5, -3.7, .34) + kreis(-4.4, -3.75, .34) + kreis(-3.9, -3.7, .34) + kreis(-4.7, -4.1, .34), "#d6243a") + F(kreis(-2.2, -3.72, .36) + kreis(-1.5, -3.76, .36) + kreis(-1.85, -4.15, .36), "#f19a4a") + F(kreis(.6, -3.75, .42) + kreis(1.5, -3.75, .42), "#7fb65f") + F(kreis(.6, -3.9, .2) + kreis(1.5, -3.9, .2), "#a9d68a")
      + am(5.3, 0, 1.3, figur({ s: -1, mantel: "#d9a441", hose: "#3f3a44", kopf: "lang", haar: "#6b4a2e", armV: [-1.15, -3.3], armH: [.8, -2.4], hinten: F("M.5 -2.5H1.9L1.7 -1.4H.7Z", "#b98a5a") + L("M.6 -2.5Q1.2 -3.3 1.8 -2.5", "#8a5f38", .12) + F(kreis(1, -2.6, .22), "#7fb65f") + F("M1.3 -3.3l.3 .1l-.2 .8Z", "#e9c58a") }), "fu-wipp", "--d:1.7s;--h:-.07px")) },

  // Gartenzwerg mit Laterne – gut versteckt
  { n: "gartenzwerg", ort: "ufer", platz: "ufer-*", wetter: "sbrn", stufe: 2,
    bild: amUfer(am(0, 0, .82, schatten(1) + `<g class="fu-pendel" style="transform-box:view-box;transform-origin:0px 0px;--w:3deg;--d:1.8s">` + F("M-.7 0Q-.9 -1.6 0 -1.7Q.9 -1.6 .7 0Z", "#4f8fd0") + E(-.4, -.06, .42, .16, TINTE) + E(.4, -.06, .42, .16, TINTE)
      + `<circle cx="0" cy="-2.05" r=".55" fill="${HAUT[0]}"/>` + F("M-.55 -1.95Q0 -.5 .55 -1.95Q0 -1.6 -.55 -1.95Z", "#fdfcf9") + F("M-.62 -2.2Q-.1 -4.2 .3 -3.9Q.1 -3 .62 -2.2Z", "#d6243a") + `<circle cx="-.2" cy="-2.1" r=".06" fill="${TINTE}"/><circle cx=".2" cy="-2.1" r=".06" fill="${TINTE}"/>`
      + L("M.6 -1.2L1.3 -1.6V-1.2", "#4f8fd0", .22) + F("M1.05 -1.2h.5v.6h-.5Z", "#5f564c") + `<circle class="fu-blink" style="--d:1.1s" cx="1.3" cy="-.9" r=".17" fill="#ffd77a"/></g>`
      + F("M2.1 0v-.7h.3V0Z", "#f1e8d8") + F("M1.6 -.7Q2.25 -1.6 2.9 -.7Z", "#d6243a") + F(kreis(2, -.92, .09) + kreis(2.45, -1.02, .09), "#fff"))) },

  // Fliegenpilze mit Schnecke
  { n: "pilze", ort: "ufer", platz: "ufer-*", zeit: "h", wetter: "sbr",
    bild: amUfer([[-1.6, 1.5], [0, 2.1], [1.5, 1.2]].map(([x, h]) => F(`M${f(x - .28)} 0Q${f(x - .34)} ${f(-h * .6)} ${f(x - .2)} ${f(-h + .2)}H${f(x + .2)}Q${f(x + .34)} ${f(-h * .6)} ${f(x + .28)} 0Z`, "#f1e8d8") + F(`M${f(x - h * .55)} ${f(-h + .25)}Q${x} ${f(-h * 1.75)} ${f(x + h * .55)} ${f(-h + .25)}Q${x} ${f(-h + .05)} ${f(x - h * .55)} ${f(-h + .25)}Z`, "#d6243a")
        + F(kreis(x - h * .22, -h * 1.05, h * .08) + kreis(x + h * .2, -h * 1.12, h * .07) + kreis(x, -h * 1.3, h * .07) + kreis(x + h * .32, -h * .88, h * .05), "#fff")).join("")
      + `<g class="fu-pilz-schnecke">` + F("M3 -.05Q3 -.3 3.6 -.3H5Q5.4 -.3 5.6 -.9Q5.9 -.8 5.8 -.3Q5.6 0 5.2 0H3.2Z", "#d9c08a") + `<circle cx="4.1" cy="-.75" r=".6" fill="#b98a5a"/>` + L("M4.1 -.75a.3 .3 0 1 0 .3 .3", "#8a5f38", .09) + L("M5.6 -.9L5.5 -1.3M5.75 -.85L5.85 -1.25", "#d9c08a", .07) + `</g>`),
    css: `.fu-pilz-schnecke{animation:fu-pilz 40s ease-in-out infinite alternate}@keyframes fu-pilz{from{translate:-1px 0}to{translate:1.8px 0}}` },

  // Winter: Meisen am Futterhaus
  { n: "vogelhaus", ort: "ufer", platz: "ufer-*", zeit: "w", wetter: "sbn",
    bild: amUfer(F("M-.16 0V-4.5h.32V0Z", "#8a5f38") + F("M-1.7 -4.8H1.7v.3H-1.7Z", "#a9764a") + L("M-1.3 -4.8V-6M1.3 -4.8V-6", "#8a5f38", .16) + F("M-2.1 -5.9L0 -7.3L2.1 -5.9Z", "#a8432f") + `<path class="fu-vh-schnee" fill="#fdfdfd" d="M-2.1 -5.9L0 -7.3L2.1 -5.9Q1 -6.9 0 -7.6Q-1 -6.9 -2.1 -5.9Z"/>`
      + F(kreis(-.4, -4.9, .1) + kreis(.2, -4.92, .1) + kreis(.6, -4.9, .1), "#e8d2a0")
      + am(-.7, -4.8, 1.05, `<g class="fu-pick" style="--d:1.6s;--w:30deg">${vogel({ farbe: "#5f8fb5", bauch: "#f4d35a", schnabel: TINTE })}</g>`)
      + `<g class="fu-vh-flug">` + am(2.6, -4.8, 1.05, vogel({ s: -1, farbe: "#6f8f4e", bauch: "#f4d35a", schnabel: TINTE })) + `</g>`
      + [0, 1].map(i => `<circle class="fu-auf" style="--d:1.9s;--v:${-i}s;--x:${i ? -.4 : .3}px;--h:4.4px;--o:1" cx="${i ? -.3 : .5}" cy="-4.4" r=".09" fill="#c9a67c"/>`).join("")),
    css: `.fu-vh-schnee{display:none}.intro[data-wetter="schnee"] .fu-vh-schnee{display:inline}
.fu-vh-flug{animation:fu-vh 5.5s ease-in-out infinite}@keyframes fu-vh{0%,45%,100%{translate:0 0}60%{translate:3px -3.5px}72%{translate:5.5px -2px}85%{translate:2px -1.5px}}` },

  // Herbst: Drachen steigen lassen
  { n: "drachenkind", ort: "ufer", platz: "ufer-*", zeit: "h",
    bild: amUfer(`<g class="fu-dk">` + geht(-2, { mantel: "#f19a4a", hose: "#4b5261", kopf: "muetze", hut: "#4f8fd0", armV: [1, -4.5] }, 1, .3) + `<g class="fu-dk-drachen">` + L("M-1 -4.5Q1.5 -9 4.6 -11.6", "#857d70", .05)
      + `<g transform="translate(4.6 -12.6) rotate(24)">` + F("M0 -1.6L1.2 0L0 2.2L-1.2 0Z", "#e9506b") + F("M0 -1.6L1.2 0H0Z", "#f4c542") + F("M0 0H-1.2L0 2.2Z", "#6fb0e6") + L("M0 2.2q-.5 .8 .1 1.5t-.2 1.4", "#857d70", .07) + F("M-.3 3.2l.6 .2l-.5 .3ZM.3 4.4l-.6 .2l.5 .3Z", "#f4c542") + `</g></g></g>`),
    css: `.fu-dk{animation:fu-dk 9s ease-in-out infinite alternate}@keyframes fu-dk{from{translate:-3px 0}to{translate:3px 0}}
.fu-dk-drachen{transform-box:view-box;transform-origin:-1px -4.5px;animation:fu-dkd 2.3s ease-in-out infinite alternate}@keyframes fu-dkd{from{rotate:-5deg}to{rotate:6deg}}` },

  // Boule am Rheinufer
  { n: "boule", ort: "ufer", platz: "ufer-*", zeit: "fsh",
    bild: amUfer(am(-5.6, 0, 1.3, figur({ mantel: "#5f8a6e", hose: "#5a5248", kopf: "hut", hut: "#e6d2a2", haar: "#b9b1a5", armV: [.9, -2.4], klV: "fu-boule-arm" }))
      + steht(6.8, { s: -1, mantel: "#8a6b4f", hose: "#4b5261", kopf: "kappe", hut: "#3d3934", haar: "#9a9288", armV: [-.7, -2.9], armH: [.3, -2.9] })
      + `<circle class="fu-boule-kugel" cx="-4.3" cy="-3.1" r=".3" fill="#aab4bb" stroke="#6f7a82" stroke-width=".07"/>` + F(kreis(3.4, -.3, .3) + kreis(4.6, -.3, .3), "#aab4bb") + F(kreis(4, -.16, .15), "#e9506b")),
    css: `.fu-boule-arm{animation:fu-boule-a 4.5s ease-in-out infinite}@keyframes fu-boule-a{0%,60%,100%{rotate:0deg}8%{rotate:40deg}16%{rotate:-70deg}30%{rotate:0deg}}
.fu-boule-kugel{animation:fu-boule-k 4.5s linear infinite}@keyframes fu-boule-k{0%,15%{translate:0 0;opacity:0}16%{translate:0 0;opacity:1}24%{translate:2.4px -1.9px}32%{translate:4.8px -1.6px}40%{translate:6.4px 2.8px}52%{translate:7.4px 2.8px}90%{translate:7.4px 2.8px;opacity:1}96%,100%{translate:7.4px 2.8px;opacity:0}}` },

  // Tai-Chi am Morgen
  { n: "taichi", ort: "ufer", platz: "ufer-*", zeit: "fs", stufe: 2,
    bild: amUfer([[-4.6, "#f6efe1", "kurz", "#b9b1a5", 0], [0, "#a9c9de", "dutt", "#3b2a22", 4], [4.6, "#f3d2c4", "glatze", "#000", 1]].map(([x, m, k, h, hi]) =>
      am(x, 0, 1.2, figur({ mantel: m, hose: "#5a5248", kopf: k, haar: h, haut: HAUT[hi], armV: [1.35, -3.5], armH: [-1.3, -3.4], klV: "fu-tc-a", klH: "fu-tc-b" }), "fu-tc", "")).join("")),
    css: `.fu-tc{transform-box:view-box;transform-origin:0px 0px;animation:fu-tc 6s ease-in-out infinite alternate}@keyframes fu-tc{from{rotate:-3deg;translate:-.15px 0}to{rotate:3deg;translate:.15px 0}}
.fu-tc-a{animation:fu-tca 6s ease-in-out infinite alternate}@keyframes fu-tca{from{rotate:28deg}to{rotate:-48deg}}
.fu-tc-b{animation:fu-tcb 6s ease-in-out infinite alternate}@keyframes fu-tcb{from{rotate:-40deg}to{rotate:30deg}}` },

  // Liegestuhl mit Sonnenschirm
  { n: "liegestuhl", ort: "ufer", platz: "ufer-*", zeit: "s", wetter: "s",
    bild: amUfer(E(0, -.1, 5.4, .36, "#ead9ad") + L("M3.2 0V-7.6", "#857d70", .16) + F("M-.4 -7.2Q3.2 -10.2 6.8 -7.2Z", "#f4c542") + F("M2 -7.2Q3.2 -10.2 4.4 -7.2Z", "#fdfcf9") + F("M-.4 -7.2Q.5 -8.6 2.2 -9.3Q1.2 -8.4 .9 -7.2ZM5.5 -7.2Q5.2 -8.4 4.2 -9.3Q5.9 -8.6 6.8 -7.2Z", "#fdfcf9")
      + L("M-4.6 -3.4L-1.2 0M-3.4 0L-1 -2.6M-1 -1.3H1.6V0", "#8a5f38", .2) + F("M-4.7 -3.6L-2.2 -1.1H1.7v-.3H-2Z", "#4f8fd0") + L("M-4.1 -3L-1.9 -.85", "#fdfcf9", .14)
      + L("M-3.2 -2.5L-1.7 -1.55H.3L1 -.2", "#e9506b", .62) + L("M-.2 -1.6H1.2L1.7 -.3", HAUT[0], .34) + `<circle cx="-3.6" cy="-3.6" r=".8" fill="${HAUT[0]}"/>` + F("M-4.4 -3.8a.8 .8 0 0 1 1.6 -.2Z", "#6b4a2e") + L("M-3.5 -3.6h.75", TINTE, .22)
      + dreh("fu-pendel", 1.7, -.35, E(1.95, -.4, .2, .38, HAUT[0], `transform="rotate(20 1.95 -.4)"`), "--w:12deg;--d:.6s")
      + F("M-6.6 -1.6h1.4V0h-.2v-1.4h-1V0h-.2Z", "#8a5f38") + F("M-6.2 -2.4h.6l-.1 .8h-.4Z", "#f19a4a") + L("M-5.8 -2.4l.3 -.7", "#d6243a", .07)) },

  // Offener Bücherschrank – auf dem Dach schläft die Katze
  { n: "buecherschrank", ort: "ufer", platz: "ufer-*",
    bild: amUfer(schatten(2.2, -1.5) + F("M-3.4 -7.2H.4V0H-3.4Z", "#b0483c") + F("M-3.6 -7.5H.6v.4H-3.6Z", "#8e352c") + F("M-3.1 -6.8H.1V-.4H-3.1Z", "#f3ead2")
      + [-6.6, -5, -3.4, -1.8].map((y, r) => F(rechteck(-3.1, y + 1.3, 3.2, .12), "#8e352c") + [0, 1, 2, 3, 4, 5, 6].map(i => F(rechteck(-3 + i * .44, y + (i * 3 + r) % 4 * .08, .36, 1.3 - (i * 3 + r) % 4 * .08), BUNT[(i * 2 + r * 3) % 6])).join("")).join("")
      + am(-1.5, -7.5, .62, E(0, -.5, 1.4, .55, "#d98a3d") + `<circle cx="1.2" cy="-.75" r=".5" fill="#d98a3d"/>` + F("M.9 -1.1L1 -1.6L1.3 -1.2ZM1.3 -1.2L1.6 -1.55L1.65 -1.05Z", "#d98a3d") + pendel(-1.3, -.4, L("M-1.3 -.4Q-2.2 -.3 -2.3 -1.1", "#d98a3d", .24), 12, 1.4))
      + am(3, 0, 1.3, figur({ s: -1, mantel: "#7a6a9a", hose: "#3f4654", kopf: "lang", haar: "#2a211c", haut: HAUT[4], armV: [-1, -3.4], armH: [-.8, -3.5], inHand: F("M-1.7 -4.2L-.9 -4V-3.1L-1.7 -3.3Z", "#6fb0e6") + F("M-.9 -4L-.3 -4.2V-3.3L-.9 -3.1Z", "#fdfcf9") }), "fu-wipp", "--d:2.4s;--h:-.05px")) },

  // Die Feuerwehr holt eine Katze vom Baum
  { n: "katzenrettung", ort: "ufer", platz: "ufer-*", zeit: "fsh", stufe: 2,
    bild: amUfer(baum(3, 11.5, 2.9) + L("M-3.6 0L1.6 -9M-2.5 0L2.7 -9", "#aab4bb", .16) + L([1, 2, 3, 4, 5, 6, 7, 8].map(i => `M${f(-3.6 + i * .578)} ${-i}h1.1`).join(""), "#aab4bb", .12)
      + `<g class="fu-kr">` + am(-2.1, -1.6, 1.05, figur({ mantel: "#2c3a55", hose: "#2c3a55", kopf: "helm", hut: "#d6243a", armV: [1.2, -4.4], armH: [1, -4.3], schatten: false, vorn: F("M-.7 -2.6h1.4v.22h-1.4Z", "#f4c542") })) + `</g>`
      + am(2.6, -12.3, .6, `<g class="fu-wipp" style="--d:.5s;--h:-.1px">` + E(0, -.6, 1.2, .6, "#3d3934") + `<circle cx="-1" cy="-1" r=".55" fill="#3d3934"/>` + F("M-1.4 -1.3L-1.35 -1.9L-1 -1.5ZM-1 -1.5L-.7 -1.9L-.6 -1.3Z", "#3d3934") + `<circle cx="-1.2" cy="-1.05" r=".1" fill="#f4c542"/>` + L("M1.1 -.7Q1.9 -.9 1.8 -1.8", "#3d3934", .22) + `</g>`)
      + steht(-6.2, { mantel: "#d9a441", rock: true, kopf: "dutt", haar: "#b9b1a5", armV: [.6, -4.4], armH: [.3, -4.3] }, 1.2)),
    css: `.fu-kr{animation:fu-kr 7s ease-in-out infinite alternate}@keyframes fu-kr{from{translate:0 0}to{translate:2.6px -4.5px}}` },

  // Winter: Die erste Kugel für den Schneemann
  { n: "schneekugel", ort: "ufer", platz: "ufer-*", zeit: "w", wetter: "n",
    bild: amUfer(`<g class="fu-sk">` + geht(-2.9, { mantel: "#7a6a9a", hose: "#3f4654", kopf: "muetze", hut: "#e9506b", armV: [1.3, -3], armH: [1.15, -2.8] }, 1.05, .4)
      + dreh("fu-dreh", 0, -1.7, `<circle cx="0" cy="-1.7" r="1.7" fill="#fdfdfd" stroke="#b3c0cc" stroke-width=".1"/>` + L("M-1 -2.2q.4 -.6 1 -.5M.3 -.8q.6 .1 .9 -.4M-.9 -1q.1 .5 .5 .7", "#c9d6e2", .12), "--d:5s") + `</g>`
      + `<circle cx="5.6" cy="-2.2" r="2.2" fill="#fdfdfd" stroke="#b3c0cc" stroke-width=".1"/>` + F("M5.2 -4.4a2.2 2.2 0 0 1 2 3.6a3 2.2 0 0 0 -2 -3.6Z", "#c9d6e2", `opacity=".5"`) + F("M2.6 -.2l1.2 -.2l-1.2 -.25Z", "#e8862c") + F("M7.6 -.7h1.2V0H7.6ZM7.3 -.2h1.8v.2H7.3Z", TINTE)),
    css: `.fu-sk{animation:fu-sk 8s ease-in-out infinite alternate}@keyframes fu-sk{from{translate:-3px 0}to{translate:1.6px 0}}` },

  // Stadtgärtnerin gießt das Beet
  { n: "gaertnerin", ort: "ufer", platz: "ufer-*", zeit: "fs",
    bild: amUfer(am(-3.6, 0, 1.3, figur({ mantel: "#6f8f4e", hose: "#5a5248", kopf: "hut", hut: "#e6d2a2", haar: "#8a4a2e", armV: [1.25, -2.8], klV: "fu-gg-arm", vorn: F("M-.5 -3.4H.5V-1.95H-.5Z", "#3f7a52"),
        inHand: F("M1 -3.3H2V-2.3H1Z", "#5f8fb5") + L("M2 -2.6L2.9 -3.2", "#5f8fb5", .2) + L("M1.1 -3.3Q1.5 -3.9 1.9 -3.3", "#5f8fb5", .12) }))
      + [0, 1, 2, 3].map(i => `<path class="fu-auf" style="--d:.9s;--v:${-i * .22}s;--x:${f(1.6 + i * .3)}px;--h:3.6px;--o:.9" fill="none" stroke="#8fc3e6" stroke-width=".12" stroke-linecap="round" d="M.4 -4.2l.2 .3"/>`).join("")
      + F("M.8 -.5H7L6.7 0H1.1Z", "#8a6a4a") + [[1.6, 2, 0], [2.7, 2.7, 1], [3.8, 2.2, 5], [4.9, 2.9, 4], [6, 2.1, 2]].map(([x, h, c], i) => pendel(x, -.4, L(`M${x} -.4V${-h}`, "#6f9f55", .14) + F(`M${x} ${f(-h * .6)}q.6 -.5 .8 .1q-.5 .3 -.8 -.1Z`, "#7fb65f") + F(kreis(x - .32, -h, .3) + kreis(x + .32, -h, .3) + kreis(x, -h - .32, .3) + kreis(x, -h + .32, .3), BUNT[c]) + F(kreis(x, -h, .2), "#f4e3b0"), 4, 1.5 + i * .2, -i * .4)).join("")),
    css: `.fu-gg-arm{animation:fu-gg 3s ease-in-out infinite alternate}@keyframes fu-gg{from{rotate:-4deg}to{rotate:12deg}}` },

  // Litfaßsäule: Ein neues Plakat wird geklebt
  { n: "litfass", ort: "ufer", platz: "ufer-*",
    bild: amUfer(schatten(2.2, 1.4) + F("M-.2 -7.6H3V0H-.2Z", "#e6dfd2") + F("M2.2 -7.6H3V0H2.2Z", "#000", `opacity=".1"`) + F("M-.5 -8H3.3v.44H-.5Z", "#7f8f86") + F("M-.2 -8Q1.4 -9.2 3 -8Z", "#6f7f76") + F("M-.4 -.4H3.2V0H-.4Z", "#7f8f86")
      + F("M.1 -7.2H1.4V-5.2H.1Z", "#6fb0e6") + F("M1.6 -7.2H2.8V-5.6H1.6Z", "#f4c542") + F("M1.6 -5.3H2.8V-3H1.6Z", "#8ccf7e") + F("M.1 -2.7H1.4V-.8H.1Z", "#f19a4a") + F("M1.6 -2.7H2.8V-.8H1.6Z", "#b07cd8")
      + F("M.1 -5H1.4V-3H.1Z", "#fdfcf9") + F("M.3 -3.9a.45 .45 0 0 1 .9 0Z", "#c8102e") + F("M.3 -3.9h.9v.22H.3ZM.3 -3.5h.9v.12H.3Z", TINTE)
      + am(-2.4, 0, 1.3, figur({ mantel: "#5a6a7a", hose: "#4b5261", kopf: "kappe", hut: "#d6243a", armV: [1.3, -4.1], klV: "fu-lit-arm", inHand: L("M1.3 -4.1L1.9 -4.6", "#6b4a2c", .12) + F("M1.8 -4.9h.5v.4h-.5Z", "#e6d2a2") }))
      + F("M-4.6 -1H-3.6L-3.75 0H-4.45Z", "#8f9aa3") + L("M-4.55 -1Q-4.1 -1.7 -3.65 -1", "#6f7a82", .09)),
    css: `.fu-lit-arm{animation:fu-lit 1.1s ease-in-out infinite alternate}@keyframes fu-lit{from{rotate:-14deg}to{rotate:12deg}}` },
];
