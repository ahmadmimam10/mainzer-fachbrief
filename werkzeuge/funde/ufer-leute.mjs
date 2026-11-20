// Fundstücke am Rheinufer, Teil 1: wer unterwegs ist (Leute, Fahrzeuge, Tiere). Regeln und Bausteine: hilfen.mjs.
import { f, am, dreh, fahrt, hinher, figur, vogel, rad, FUSS, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E, schatten, amUfer } from "./hilfen.mjs";

export const geht = (x, o = {}, g = 1.3, takt = .5) => am(x, 0, g, figur({ ...o, gehen: true }), "fu-geht", `--takt:${takt}s`);
export const steht = (x, o = {}, g = 1.3, kl = "", stil = "") => am(x, 0, g, figur(o), kl, stil);
export const pendel = (x, y, innen, w, d, v = 0, kl = "fu-pendel") => dreh(kl, x, y, innen, `--w:${w}deg;--d:${d}s;--v:${v}s`);

// ---- Tiere (Füße bei 0/0, Blick nach rechts) ----
export const hund = ({ farbe = "#b98a5a", dunkel = "#8a6238", gehen = true, takt = .26 } = {}) => {
  const bein = (x, kl) => dreh(kl, x, -1.15, L(`M${x} -1.15V-.08`, farbe, .34));
  return `<g class="${gehen ? "fu-geht" : ""}" style="--takt:${takt}s">` + schatten(1.9) + pendel(-1.45, -1.75, L("M-1.45 -1.75Q-2.25 -2.2 -2.05 -3.05", farbe, .32), 16, .2)
    + bein(-1.05, "fu-b2") + bein(.95, "fu-b1") + E(0, -1.55, 1.6, .68, farbe) + bein(-.7, "fu-b1") + bein(1.25, "fu-b2")
    + `<circle cx="1.75" cy="-2.2" r=".62" fill="${farbe}"/>` + E(2.3, -2.02, .46, .3, farbe) + `<circle cx="2.7" cy="-2.1" r=".13" fill="${TINTE}"/><circle cx="1.95" cy="-2.36" r=".08" fill="${TINTE}"/>`
    + F("M1.35 -2.72Q1.08 -2.2 1.3 -1.7Q1.78 -2 1.82 -2.72Z", dunkel) + `</g>`;
};
export const ente = ({ farbe = "#8a6a48", bauch = "#c9b08a", kopf = farbe, v = 0 } = {}) => `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 100%;--w:7deg;--d:.26s;--v:${v}s">`
  + L("M-.15 0v-.36M.25 0v-.36", "#e8862c", .14) + E(0, -.76, .95, .55, farbe) + F("M-.8 -.95L-1.5 -1.25L-.85 -.45Z", farbe) + E(-.05, -.7, .56, .3, bauch)
  + `<circle cx=".8" cy="-1.32" r=".4" fill="${kopf}"/>` + F("M1.12 -1.4L1.66 -1.26L1.12 -1.14Z", "#e8a23c") + `<circle cx=".92" cy="-1.38" r=".06" fill="${TINTE}"/></g>`;
export const katze = ({ farbe = "#262321", auge = "#f4c542" } = {}) => {
  const bein = (x, kl) => dreh(kl, x, -1, L(`M${x} -1V-.06`, farbe, .26));
  return `<g class="fu-geht" style="--takt:.3s">` + schatten(1.5) + pendel(-1.3, -1.35, L("M-1.3 -1.35Q-2.1 -1.6 -1.9 -2.9Q-1.8 -3.3 -1.5 -3.2", farbe, .26), 8, 1.1)
    + bein(-.95, "fu-b2") + bein(.75, "fu-b1") + E(0, -1.3, 1.4, .52, farbe) + bein(-.65, "fu-b1") + bein(1.05, "fu-b2")
    + `<circle cx="1.5" cy="-1.85" r=".52" fill="${farbe}"/>` + F("M1.08 -2.2L1.2 -2.75L1.5 -2.3ZM1.55 -2.3L1.85 -2.75L1.95 -2.15Z", farbe) + `<circle cx="1.7" cy="-1.9" r=".09" fill="${auge}"/></g>`;
};
const fuchs = () => {
  const bein = (x, kl) => dreh(kl, x, -1, L(`M${x} -1V-.06`, "#5a3a26", .26));
  return `<g class="fu-geht" style="--takt:.24s">` + schatten(2) + F("M-1.3 -1.5Q-2.6 -2 -3.6 -1.2Q-3.3 -.5 -2.3 -.7Q-1.6 -.9 -1.2 -1.1Z", "#d9772e") + F("M-3.6 -1.2Q-3.3 -.5 -2.6 -.66Q-2.9 -1.1 -2.9 -1.5Q-3.3 -1.5 -3.6 -1.2Z", "#fdfcf9")
    + bein(-1, "fu-b2") + bein(.8, "fu-b1") + E(0, -1.3, 1.5, .5, "#d9772e") + E(.2, -1.08, 1, .26, "#f3dcc4") + bein(-.7, "fu-b1") + bein(1.1, "fu-b2")
    + F("M1.1 -1.9Q1.5 -2.3 2 -1.9L2.9 -1.45L2 -1.2Q1.4 -1.2 1.1 -1.5Z", "#d9772e") + F("M1.2 -2L1.25 -2.7L1.65 -2.15ZM1.6 -2.1L1.9 -2.6L2 -1.95Z", "#5a3a26") + F("M2 -1.2L2.9 -1.45L2.2 -1.5Z", "#fdfcf9") + `<circle cx="2.9" cy="-1.46" r=".1" fill="${TINTE}"/><circle cx="1.95" cy="-1.72" r=".07" fill="${TINTE}"/></g>`;
};
export const taube = (s, v, w = 28) => `<g class="fu-pick" style="--v:${v}s;--w:${w * s}deg;transform-origin:${s > 0 ? 35 : 65}% 100%">${vogel({ s, farbe: "#8f98a3", bauch: "#b9c0c8", schnabel: "#d9a23c" })}<path fill="#6f8f8a" opacity=".8" d="M${f(s * .3)} -.78a.3 .2 0 0 0 ${f(s * .34)} 0Z"/></g>`;
export const moewe = s => vogel({ s, farbe: "#f6f6f4", bauch: "#fff", schnabel: "#f0b83a" }) + F(`M${f(-s * .5)} -.86Q${f(-s * .1)} -1.02 ${f(s * .22)} -.6Q${f(-s * .3)} -.42 ${f(-s * 1.1)} -.42Z`, "#a9b3bc");

// ---- Fahrzeuge ----
const TRET = `.fu-tret1,.fu-tret2{animation:fu-tret .42s ease-in-out infinite alternate}.fu-tret2{animation-direction:alternate-reverse}@keyframes fu-tret{from{rotate:-13deg}to{rotate:19deg}}`;
const fahrrad = (rahmen = "#c8102e") => rad(-1.45, -1, .95, { d: .8 }) + rad(1.45, -1, .95, { d: .8 })
  + L("M-1.45 -1L-.45 -2.25H.9L1.45 -1M-.45 -2.25L.05 -1.05L.9 -2.25M.05 -1.05H-1.45M.9 -2.25L1.12 -2.95", rahmen, .2) + L("M-.75 -2.47h.65M.9 -2.97h.55", TINTE, .24);
const fahrer = ({ mantel = "#3f7a52", hose = "#4b5261", haut = HAUT[0], helm = "#f4c542", dazu = "" } = {}) =>
  dreh("fu-tret1", -.4, -2.55, L("M-.4 -2.55L.32 -1.15", hose, .46) + E(.44, -1.05, .34, .15, TINTE))
  + L("M-.4 -2.6L.55 -3.9", mantel, 1.02) + dazu
  + dreh("fu-tret2", -.4, -2.55, L("M-.4 -2.55L-.05 -1.05", hose, .46) + E(.1, -.97, .34, .15, TINTE))
  + L("M.5 -3.75L1.3 -2.97", mantel, .42) + `<circle cx="1.32" cy="-2.97" r=".19" fill="${haut}"/>`
  + `<circle cx=".8" cy="-4.5" r=".62" fill="${haut}"/>` + F("M.14 -4.58a.68 .72 0 0 1 1.36 0Z", helm) + `<circle cx="1.12" cy="-4.48" r=".07" fill="${TINTE}"/>`;
export const raedchen = (x, r = .5, d = .7) => rad(x, -r, r, { d, speichen: 4 });

export default [
  { n: "joggerin", ort: "ufer", platz: "ufer-weg",
    bild: fahrt(am(0, 0, 1.3, figur({ gehen: true, mantel: "#e9506b", hose: "#2f3542", kopf: "zopf", haar: "#6b4a2e", schuh: "#f4c542" }), "fu-geht", "--takt:.21s"), { von: 500, bis: 780, d: 30, v: -4, y: FUSS }),
    css: `.fu-joggerin .fu-geht{rotate:6deg}` },

  { n: "radfahrer", ort: "ufer", platz: "ufer-weg", zeit: "fsh",
    bild: fahrt(am(0, 0, 1.25, schatten(2.4) + fahrrad() + fahrer()), { von: 480, bis: 800, d: 19, v: -5, y: FUSS }), css: TRET },

  // Zeitungsbote: wirft im Vorbeifahren gefaltete Zeitungen
  { n: "zeitungsbote", ort: "ufer", platz: "ufer-weg", stufe: 2,
    bild: fahrt(am(0, 0, 1.25, schatten(2.4) + fahrrad("#2c5aa8") + fahrer({ mantel: "#c8553d", helm: "#3d3934", dazu: F("M-1.1 -3.2h1.1v1.2h-1.1Z", "#f19a4a") + L("M-.9 -3.2L.4 -3.8", "#f19a4a", .14) + F("M-1 -3.5h.9v.34h-.9Z", "#fdfcf9") })
      + [0, 1].map(i => `<g class="fu-zb-wurf" style="animation-delay:${-i * 1.7}s"><path fill="#fdfcf9" stroke="#8f9aa3" stroke-width=".08" d="M.2 -4.3h1v.6h-1Z"/><path stroke="#8f9aa3" stroke-width=".06" d="M.35 -4.1h.7M.35 -3.9h.7"/></g>`).join("")),
      { von: 480, bis: 800, d: 22, v: -3, y: FUSS }),
    css: TRET + `.fu-zb-wurf{transform-box:fill-box;transform-origin:50% 50%;animation:fu-zb-wurf 3.4s ease-in infinite}
@keyframes fu-zb-wurf{0%{translate:0 0;rotate:0deg;opacity:0}6%{opacity:1}45%{translate:-5px -2.6px;rotate:-260deg}85%{opacity:1}100%{translate:-10px 3.6px;rotate:-560deg;opacity:0}}` },

  // Kehrmaschine der Stadtreinigung: Bürste dreht, Rundumleuchte blinkt
  { n: "kehrmaschine", ort: "ufer", platz: "ufer-weg", wetter: "sbr",
    bild: fahrt(schatten(3.6) + F("M-3.3 -3.5H.3V-4.4H2.3L3.1 -2.6V-.9H-3.3Z", "#f19a4a") + F("M-3.3 -1.75h6.4v.34h-6.4Z", "#d6772a") + F("M.75 -4.05H2.1L2.7 -2.75H.75Z", "#c3d6e2")
      + `<circle cx="1.45" cy="-3.2" r=".42" fill="${HAUT[1]}"/>` + F("M1.03 -3.25a.42 .42 0 0 1 .84 0Z", "#f19a4a") + F("M-2.9 -3.2h2.7v1h-2.7Z", "#fdfcf9", `opacity=".35"`)
      + `<path class="fu-blink" style="--d:.5s" fill="#ffd23c" d="M1.1 -4.75h.5v.36h-.5Z"/>` + rad(-1.9, -.75, .75, { d: 1.1, speichen: 4 }) + rad(1.55, -.75, .75, { d: 1.1, speichen: 4 })
      + dreh("fu-dreh", 3.55, -.5, `<circle cx="3.55" cy="-.5" r=".5" fill="#857d70"/>` + L("M3.05 -.5h1M3.55 -1v1M3.2 -.85l.7 .7M3.9 -.85l-.7 .7", "#3d3934", .1), "--d:.5s")
      + [0, 1, 2].map(i => `<circle class="fu-auf" style="--d:1.6s;--v:${-i * .5}s;--x:-1.6px;--h:-1.3px;--o:.5" cx="-3.5" cy="-.5" r="${f(.3 + i * .12)}" fill="#fff"/>`).join(""),
      { von: 470, bis: 810, d: 56, v: -12, y: FUSS }) },

  // Bimmelbahn für Ausflügler: kleine Lok mit zwei Wagen
  { n: "bimmelbahn", ort: "ufer", platz: "ufer-weg", zeit: "fs", stufe: 2,
    bild: fahrt(schatten(8, -3.5)
      + [-10.4, -5.4].map((x, k) => `<g transform="translate(${x} 0)">` + F("M0 -1.9H4.4V-.7H0Z", "#f6efe1") + F("M0 -1.2H4.4v.3H0Z", "#c8102e") + L("M.2 -1.9V-3.5M4.2 -1.9V-3.5M2.2 -1.9V-3.5", "#8a8276", .14) + F("M-.3 -3.9Q2.2 -4.5 4.7 -3.9V-3.5H-.3Z", "#c8102e")
        + [.75, 1.65, 2.95, 3.75].map((hx, i) => `<circle class="fu-wipp" style="--d:${f(.5 + i * .13)}s;--h:-.08px" cx="${hx}" cy="-2.3" r=".4" fill="${HAUT[(i + k) % 5]}"/><path fill="${BUNT[(i * 2 + k) % 6]}" d="M${f(hx - .4)} -2.36a.4 .42 0 0 1 .8 0Z"/>`).join("")
        + raedchen(.9, .42) + raedchen(3.5, .42) + L("M4.4 -1h.7", TINTE, .14) + `</g>`).join("")
      + F("M-.3 -2.9H2.4V-.7H-.3Z", "#3f7a52") + F("M-.3 -4.3H1.3V-2.9H-.3Z", "#356f49") + F("M-.5 -4.6H1.5v.34H-.5Z", "#c8102e") + F("M0 -4H1V-3.2H0Z", "#c3d6e2") + `<circle cx=".5" cy="-3.55" r=".3" fill="${HAUT[0]}"/>`
      + F("M2.4 -2.5H3.3L3.9 -.7H2.4Z", "#356f49") + F("M1.75 -3.9h.55v1H1.75Z", TINTE) + F("M1.6 -4.1h.85v.26H1.6Z", "#c8102e") + F("M-.3 -1.55h3.5v.26H-.3Z", "#f4c542")
      + pendel(2.9, -3.3, `<circle cx="2.9" cy="-3" r=".24" fill="#f4c542"/>` + L("M2.9 -3.3v.1", "#8a8276", .08), 22, .35) + raedchen(.4, .55) + raedchen(2.6, .55)
      + [0, 1, 2].map(i => `<circle class="fu-auf" style="--d:2.4s;--v:${-i * .8}s;--x:-2.6px;--h:-2.6px;--o:.85" cx="2.02" cy="-4.4" r="${f(.34 + i * .1)}" fill="#fff"/>`).join(""),
      { von: 465, bis: 815, d: 62, v: -16, y: FUSS }) },

  { n: "skater", ort: "ufer", platz: "ufer-weg", zeit: "fsh",
    bild: fahrt(`<g class="fu-skater-sprung">` + am(0, -.5, 1.1, figur({ mantel: "#f4c542", hose: "#3f4654", kopf: "kappe", hut: "#2c5aa8", haar: "#3b2a22", armV: [1.2, -3], armH: [-1.2, -3.1], schatten: false }))
      + `<g class="fu-skater-brett">` + L("M-1.5 -.5Q-1.3 -.36 -1 -.36H1Q1.3 -.36 1.5 -.5", "#8a5a3c", .2) + `<circle cx="-.85" cy="-.17" r=".17" fill="${TINTE}"/><circle cx=".85" cy="-.17" r=".17" fill="${TINTE}"/></g></g>` + schatten(1.5),
      { von: 500, bis: 780, d: 24, v: -9, y: FUSS }),
    css: `.fu-skater-sprung{animation:fu-skater-sprung 3s cubic-bezier(.3,.6,.4,1) infinite}@keyframes fu-skater-sprung{0%,62%,100%{translate:0 0;rotate:0deg}70%{translate:0 -.4px;rotate:-9deg}78%{translate:0 -1.7px;rotate:-3deg}90%{translate:0 0;rotate:3deg}}
.fu-skater-brett{transform-box:fill-box;transform-origin:20% 50%;animation:fu-skater-brett 3s ease-in-out infinite}@keyframes fu-skater-brett{0%,64%,92%,100%{rotate:0deg}74%{rotate:-22deg}84%{rotate:8deg}}` },

  // Entenmutter mit Küken; das letzte trödelt und hüpft hinterher
  { n: "entenfamilie", ort: "ufer", platz: "ufer-weg", zeit: "f", wetter: "sbr", spiegeln: true,
    bild: hinher(am(2.7, 0, 1.3, ente()) + [.7, -.5, -1.7, -2.9].map((x, i) => am(x, 0, .62, ente({ farbe: "#f4d35a", bauch: "#fbe9a0", v: -i * .07 }))).join("")
      + am(-4.5, 0, .62, ente({ farbe: "#f4d35a", bauch: "#fbe9a0", v: -.2 }), "fu-huepf", "--d:2.2s;--h:-.7px;--x:.5px"), { von: 712, bis: 752, d: 46, y: FUSS }) },

  { n: "fuchs", ort: "ufer", platz: "ufer-weg", zeit: "hw", wetter: "sbn", stufe: 2,
    bild: fahrt(am(0, 0, 1.25, fuchs()), { von: 500, bis: 780, d: 34, v: -6, y: FUSS }) },

  // Krippenwagen einer Kita: Erzieherin schiebt, ein Kind läuft nebenher
  { n: "kitawagen", ort: "ufer", platz: "ufer-weg", zeit: "fsh", spiegeln: true,
    bild: hinher(geht(-4.2, { mantel: "#2f7f86", kopf: "dutt", haar: "#8a4a2e", armV: [1.5, -2.9], armH: [1.3, -2.8] })
      + schatten(3.2, 1) + L("M-2.2 -3.4L-1.6 -1.5", "#857d70", .2) + F("M-1.7 -2.6H3.7L3.4 -.8H-1.4Z", "#d6243a") + F("M-1.7 -2.6H3.7l-.06 .4H-1.64Z", "#f4c542")
      + [-.8, .4, 1.6, 2.8].map((x, i) => `<g class="fu-wipp" style="--d:${f(.6 + i * .17)}s;--h:-.12px"><circle cx="${x}" cy="-3.1" r=".5" fill="${HAUT[i % 5]}"/><path fill="${BUNT[(i * 2 + 1) % 6]}" d="M${f(x - .52)} -3.16a.52 .55 0 0 1 1.04 0Z"/><circle cx="${f(x + .22)}" cy="-3.05" r=".06" fill="${TINTE}"/></g>`).join("")
      + raedchen(-.6, .55) + raedchen(2.6, .55)
      + geht(6, { mantel: "#f19a4a", hose: "#4b5261", kopf: "muetze", hut: "#6fb0e6", armH: [-1.2, -3] }, .92, .34), { von: 714, bis: 756, d: 44, y: FUSS }) },

  { n: "kinderwagen", ort: "ufer", platz: "ufer-weg", spiegeln: true,
    bild: hinher(geht(-2.4, { mantel: "#8a6b4f", kopf: "kurz", haar: "#2a211c", haut: HAUT[1], armV: [1.4, -2.85], armH: [1.2, -2.75] })
      + schatten(1.9, 1.4) + L("M-.55 -3.7L.2 -2.2", "#857d70", .18) + F("M.1 -2.4H2.9Q2.9 -1 1.5 -1Q.1 -1 .1 -2.4Z", "#2c4a7a") + F("M.1 -2.4Q.1 -3.9 1.6 -3.9V-2.4Z", "#3a5f9a") + L("M.6 -1L.35 -.5M2.4 -1L2.65 -.5", "#857d70", .14)
      + raedchen(.3, .5) + raedchen(2.7, .5)
      + pendel(2.9, -2.4, L("M2.9 -2.4Q3.2 -3.8 3 -5.2", "#857d70", .06) + E(3, -6, .75, .9, "#e9506b") + E(2.8, -6.3, .2, .32, "#fff", `opacity=".5"`), 5, 1.6), { von: 712, bis: 754, d: 40, y: FUSS }) },

  // Gassi gehen: Der Hund zieht voraus
  { n: "gassi", ort: "ufer", platz: "ufer-weg", wetter: "sbr", spiegeln: true,
    bild: hinher(geht(-2.6, { mantel: "#7a6a9a", hose: "#3f3a44", kopf: "muetze", hut: "#f4c542", haar: "#4a3a2e", armV: [1.25, -2.7] }) + L("M-.95 -3.5Q.6 -2.2 1.9 -2.5", "#c8102e", .09)
      + am(2.6, 0, 1.05, hund()), { von: 712, bis: 754, d: 34, y: FUSS }) },

  { n: "igel", ort: "ufer", platz: "ufer-weg", zeit: "h", wetter: "sbr", spiegeln: true,
    bild: hinher(am(0, 0, 1.25, `<g class="fu-geht" style="--takt:.16s">` + schatten(1.3) + dreh("fu-b1", -.5, -.3, L("M-.5 -.3V-.04", TINTE, .2)) + dreh("fu-b2", .5, -.3, L("M.5 -.3V-.04", TINTE, .2))
      + F("M-1.2 -.25Q-1.3 -1.5 0 -1.55Q1 -1.5 1.3 -.6L1.9 -.42Q1.6 -.2 1.1 -.2H-1Z", "#c9a67c") + F("M-1.25 -.3L-1.6 -.75L-1.2 -.8L-1.45 -1.3L-1 -1.2L-1.05 -1.75L-.6 -1.5L-.5 -2L-.15 -1.6L.15 -2.05L.35 -1.6L.75 -1.9L.75 -1.4L1.15 -1.5L1 -1L1.3 -.6Q.6 -.9 .2 -.3Z", "#6b4a32")
      + `<circle cx="1.9" cy="-.44" r=".12" fill="${TINTE}"/><circle cx="1.35" cy="-.66" r=".08" fill="${TINTE}"/></g>`), { von: 708, bis: 738, d: 52, y: FUSS }) },

  // Winter: Ein Kind wird auf dem Schlitten gezogen
  { n: "schlittenkind", ort: "ufer", platz: "ufer-weg", zeit: "w", wetter: "n", spiegeln: true,
    bild: hinher(geht(3, { mantel: "#3f7a52", hose: "#3f3a44", kopf: "muetze", hut: "#d6243a", armH: [-1.15, -2.5] }) + L("M1.5 -3.25L-1.6 -1.3", "#8a7460", .1)
      + L("M-5.2 -.12H-1.7Q-1.2 -.2 -1.2 -.9M-4.7 -.12V-1M-2.4 -.12V-1", "#8a5a3c", .2) + F("M-5.3 -1.2H-1.6v.3H-5.3Z", "#b07a4a")
      + am(-3.9, -1.25, .95, figur({ sitzen: true, mantel: "#e9506b", hose: "#4b5261", kopf: "muetze", hut: "#f4c542", armV: [1, -4.6], schatten: false }), "fu-pendel", "transform-box:fill-box;transform-origin:50% 100%;--w:3deg;--d:.7s"),
      { von: 712, bis: 754, d: 38, y: FUSS }) },

  // Regen: zu zweit unter einem Schirm
  { n: "schirmpaar", ort: "ufer", platz: "ufer-weg", wetter: "r", spiegeln: true,
    bild: hinher(geht(-1.15, { mantel: "#4f8fd0", hose: "#3f4654", kopf: "lang", haar: "#6b4a2e", armV: [.95, -3.45] }) + geht(1.1, { mantel: "#8a6b4f", hose: "#3f3a44", kopf: "kurz", haar: "#2a211c", haut: HAUT[1] })
      + L("M.1 -4.5V-10.2", TINTE, .16) + F("M-4.2 -8.3Q.1 -12.6 4.4 -8.3Q3.3 -9 2.25 -8.3Q1.2 -9 .1 -8.3Q-1 -9 -2.05 -8.3Q-3.1 -9 -4.2 -8.3Z", "#d6243a") + F("M.1 -10.42Q2.6 -10.2 4.4 -8.3Q3.3 -9 2.25 -8.3Q1.6 -9.6 .1 -10.42Z", "#000", `opacity=".12"`)
      + [-4.1, -2, 2.3, 4.3].map((x, i) => `<path class="fu-auf" style="--d:1.1s;--v:${-i * .27}s;--x:0px;--h:2.4px;--o:.8" fill="none" stroke="#8fa9be" stroke-width=".12" stroke-linecap="round" d="M${x} -8.1v.5"/>`).join(""),
      { von: 712, bis: 754, d: 36, y: FUSS }) },

  // Freitag, der 13.: Eine schwarze Katze läuft durchs Bild
  { n: "schwarze-katze", ort: "ufer", platz: "ufer-weg", wetter: "sbrn", am: "fr13", stufe: 3,
    bild: fahrt(am(0, 0, 1.3, katze()), { von: 500, bis: 780, d: 36, v: -5, y: FUSS }) },

  // Eichhörnchen knabbert eine Nuss
  { n: "eichhoernchen", ort: "ufer", platz: "ufer-*", zeit: "hw", wetter: "sbn",
    bild: amUfer(am(0, 0, 1.5, schatten(1) + `<g class="fu-huepf" style="--d:5s;--h:-.6px">` + pendel(-.5, -.3, F("M-.5 -.2Q-1.9 -.3 -1.8 -1.8Q-1.7 -3 -.7 -2.9Q-.2 -2.8 -.4 -2.2Q-1.1 -2.3 -1 -1.6Q-.9 -.8 -.2 -.5Z", "#b5623a"), 5, 1.3)
      + E(0, -.8, .6, .82, "#c97a48") + E(.2, -.7, .3, .55, "#f1dcc4") + E(.2, -.1, .5, .16, "#b5623a")
      + `<g class="fu-eich-kopf"><circle cx=".35" cy="-1.75" r=".46" fill="#c97a48"/>` + F("M.1 -2.1L.12 -2.6L.42 -2.2Z", "#b5623a") + `<circle cx=".55" cy="-1.82" r=".07" fill="${TINTE}"/><circle cx=".82" cy="-1.66" r=".06" fill="${TINTE}"/>`
      + L("M.3 -1.2L.75 -1.4", "#b5623a", .16) + `<circle cx=".86" cy="-1.42" r=".2" fill="#8a5a2c"/></g></g>`)),
    css: `.fu-eich-kopf{animation:fu-eich 1.1s steps(2,end) infinite}@keyframes fu-eich{from{translate:0 0}to{translate:0 .09px}}` },

  // Eine Möwe hat eine Brezel erbeutet, die zweite will sie haben
  { n: "moewe-brezel", ort: "ufer", platz: "ufer-*",
    bild: amUfer(`<g class="fu-mb-lauf">` + am(1.6, 0, 1.7, moewe(1) + `<g transform="translate(1.2 -.86) scale(.5)">` + L("M0 .1C-1 -1 -1.2 .9 0 .1C1.2 .9 1 -1 0 .1M-.8 -.3L.6 .7M.8 -.3L-.6 .7", "#b9773a", .28) + `</g>`, "fu-pendel", "transform-box:fill-box;transform-origin:50% 100%;--w:5deg;--d:.22s")
      + am(-2.6, 0, 1.6, moewe(1), "fu-huepf", "--d:1.2s;--h:-.35px;--x:.3px") + `</g>`),
    css: `.fu-mb-lauf{animation:fu-mb-lauf 9s ease-in-out infinite alternate}@keyframes fu-mb-lauf{from{translate:-3.5px 0}to{translate:3.5px 0}}` },

  // Frisbee: Wurf und Sprung
  { n: "frisbeehund", ort: "ufer", platz: "ufer-*", zeit: "fs", stufe: 2,
    bild: amUfer(steht(-5.5, { mantel: "#f19a4a", hose: "#4b5261", kopf: "kappe", hut: "#d6243a", armV: [1.25, -3.6] }) + `<g class="fu-fris-hund">` + am(4.4, 0, 1.05, hund({ farbe: "#f1ede4", dunkel: "#3d3934", gehen: false })) + `</g>`
      + `<g class="fu-fris">` + E(-3.6, -4.8, .7, .2, "#6fb0e6") + E(-3.6, -4.86, .4, .09, "#fff", `opacity=".6"`) + `</g>`),
    css: `.fu-fris{animation:fu-fris 3.6s linear infinite}@keyframes fu-fris{0%,12%{translate:0 0;opacity:1}30%{translate:4.2px -2.4px}47%{translate:8.6px -.2px;opacity:1}50%,96%{translate:8.6px -.2px;opacity:0}100%{translate:0 0;opacity:0}}
.fu-fris-hund{animation:fu-fris-hund 3.6s ease-out infinite}@keyframes fu-fris-hund{0%,34%,66%,100%{translate:0 0;rotate:0deg}48%{translate:.3px -2.3px;rotate:-14deg}}` },

  // Mähroboter zieht seine Bahnen – mit blindem Passagier
  { n: "maehroboter", ort: "ufer", platz: "ufer-*", zeit: "fs",
    bild: amUfer(`<g class="fu-maeh">` + schatten(1.6) + F("M-1.7 -.3Q-1.7 -1.2 -.6 -1.25H.9Q1.9 -1.1 1.9 -.3Z", "#7f8f86") + F("M-1.2 -.9Q-.9 -1.25 -.4 -1.25H.5Q.2 -.85 -.2 -.85Z", "#5f6f66") + `<circle class="fu-blink" style="--d:.7s" cx="1.4" cy="-.75" r=".14" fill="#8ccf7e"/>`
      + raedchen(-1, .34, .5) + raedchen(1.15, .26, .4) + am(-.3, -1.25, 1.1, vogel({ farbe: "#7a6a58" }))
      + [0, 1, 2].map(i => `<path class="fu-auf" style="--d:.9s;--v:${-i * .3}s;--x:-1.4px;--h:-1px;--o:.9" fill="#7fb65f" d="M-1.8 -.3l.24 -.3l.1 .3Z"/>`).join("") + `</g>`),
    css: `.fu-maeh{animation:fu-maeh 14s ease-in-out infinite alternate}@keyframes fu-maeh{from{translate:-5.5px 0}to{translate:5.5px 0}}` },

  // Tauben picken Krümel
  { n: "tauben", ort: "ufer", platz: "ufer-*", wetter: "sbr",
    bild: amUfer(am(-3.6, 0, 1.5, taube(1, 0)) + am(-.8, 0, 1.6, taube(-1, -1.3)) + am(1.6, 0, 1.45, taube(1, -2.2, 24)) + am(4.3, 0, 1.55, taube(-1, -.6), "fu-huepf", "--d:4.4s;--h:-.5px;--x:-.5px")
      + F(kreis(-2, -.12, .1) + kreis(.3, -.1, .09) + kreis(2.9, -.12, .1) + kreis(.9, -.14, .08), "#e8d2a0")) },
];
