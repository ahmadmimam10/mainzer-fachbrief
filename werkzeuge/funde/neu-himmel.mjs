// Fundstücke am Himmel, Teil 2 (für den Jahreskalender 2027): 25 weitere Flieger, Vögel und Wunderliches.
// Bauweise wie in himmel.mjs: jedes ist ein kleines eigenes Bild; himmel() setzt es an eine Stelle, zug() lässt es quer ziehen.
import { f, dreh, himmel, zug, TINTE, BUNT, HAUT, kreis, L, F, E } from "./hilfen.mjs";

const pendel = (x, y, innen, w, d, v = 0) => dreh("fu-pendel", x, y, innen, `--w:${w}deg;--d:${d}s;--v:${v}s`);
const fluegel = (d, farbe, takt = .3, v = 0) => `<g class="fu-schlag" style="--d:${takt}s;--v:${v}s"><path fill="${farbe}" d="${d}"/></g>`;
const schweb = (l, t, g, vb, innen, kl, mehr = {}) => himmel(l, t, g, vb, innen, mehr).replace(/<svg /, `<div class="${kl} fu-weg"><svg `).replace(/<\/svg><\/div>$/, "</svg></div></div>");
const FUNKEL = "M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z";
const stern = (x, y, g, farbe = "#f4c542", d = 1.2) => `<g transform="translate(${x} ${y}) scale(${g})"><g class="fu-blink" style="--d:${d}s"><path fill="${farbe}" d="${FUNKEL}"/></g></g>`;
const TREIBEN = (name, weg) => `.fu-${name}{animation:fu-${name} ${weg}}`;

export default [
  // Segelflugzeug gleitet lautlos vorbei
  { n: "segelflieger", ort: "himmel", platz: "himmel-zug", zeit: "fsh", wetter: "sb",
    bild: zug(-70, .3, "0 0 44 12", F("M2 6.4Q20 4.2 38 5.4Q42 5.8 43 6.6Q40 7.6 36 7.4L4 7Z", "#fdfcf9") + F("M30 5.2Q33 4.2 36 5.3Q33 5.9 30 5.9Z", "#bfe0ee") + F("M14 6.4L26 1L28 1.4L22 6.6Z", "#e9e4da") + F("M3 6.6L1 2.6H2.6L6.4 6.6Z", "#e9e4da") + L("M4 7L36 7.3", "#c8102e", .3), { d: 46, v: -10 }) },

  // Paketdrohne
  { n: "paketdrohne", ort: "himmel", platz: "himmel-zug", stufe: 2, wetter: "sb",
    bild: zug(-40, .16, "0 0 24 18", F("M8 5H16V7.4H8Z", "#3d3934") + L("M5 5.4H19M5 5.4V3.4M19 5.4V3.4", "#3d3934", .5) + `<ellipse class="fu-flimmer2" cx="5" cy="3" rx="4" ry=".4" fill="${TINTE}" opacity=".6"/><ellipse class="fu-flimmer2" cx="19" cy="3" rx="4" ry=".4" fill="${TINTE}" opacity=".6"/>`
      + pendel(12, 7.4, L("M10 7.4V10.4M14 7.4V10.4", "#857d70", .24) + F("M8 10.4H16V16H8Z", "#c98a3a") + L("M12 10.4V16M8 13H16", "#e9d9b8", .5), 4, 1.4) + `<circle class="fu-blink" cx="12" cy="6.2" r=".5" fill="#8ccf7e" style="--d:.5s"/>`, { d: 34, v: -6, nachLinks: true }) },

  // Kraniche ziehen im Keil
  { n: "kraniche", ort: "himmel", platz: "himmel-zug", zeit: "fh",
    bild: zug(-78, .5, "0 0 70 26", [[58, 13], [48, 8.4], [48, 17.6], [38, 4.4], [38, 21.6], [28, 1.6], [28, 24.4]].map(([x, y], i) => `<g transform="translate(${x} ${y})">` + fluegel("M-2 0L-.6 -3.4L1.4 0Z", "#8f98a3", .44, -i * .07) + L("M-4.6 .2H5.6", "#8f98a3", .7) + `<circle cx="5.9" cy=".1" r=".5" fill="#3d3934"/>` + L("M-4.6 .2L-7.4 .8", "#3d3934", .3) + `</g>`).join(""), { d: 52, v: -12 }) },

  // Ein Bussard kreist
  { n: "bussard", ort: "himmel", platz: "himmel-r", wetter: "sb",
    bild: schweb(118, -66, .16, "0 0 30 14", F("M15 7Q8 2 1 3.6Q6 4.6 9 7.6Q12 8.4 15 8.2Q18 8.4 21 7.6Q24 4.6 29 3.6Q22 2 15 7Z", "#7a5a3a") + F("M13.6 8L15 11.6L16.4 8Z", "#5f4530") + F("M1 3.6L2.4 5.4L3.6 4.3ZM29 3.6L27.6 5.4L26.4 4.3Z", "#5f4530") + `<circle cx="15" cy="6.4" r=".9" fill="#7a5a3a"/>`, "fu-bussard"),
    css: `.fu-bussard{animation:fu-bussard 18s linear infinite}@keyframes fu-bussard{0%{translate:0 0;rotate:0deg}25%{translate:7vw 3vh;rotate:14deg}50%{translate:0 6vh;rotate:0deg}75%{translate:-7vw 3vh;rotate:-14deg}100%{translate:0 0;rotate:0deg}}` },

  // Ein Pelikan (ganz selten)
  { n: "pelikan", ort: "himmel", platz: "himmel-zug", stufe: 3, zeit: "fs",
    bild: zug(-50, .26, "0 0 40 20", fluegel("M12 9L18 0L26 9Z", "#fdfcf9", .6) + E(18, 10.4, 8, 3.4, "#fdfcf9") + F("M3 10L10 9V11.6Z", "#e9e4da") + L("M25 9Q28 6 30 6", "#fdfcf9", 2) + `<circle cx="30.6" cy="5.6" r="1.6" fill="#fdfcf9"/><circle cx="31.2" cy="5.2" r=".26" fill="${TINTE}"/>` + F("M32 5.2L39.4 6.4Q36 10.4 32 7.6Z", "#f19a4a") + L("M20 13.6L16 15.6M22 13.6L18.6 16", "#f19a4a", .5), { d: 40, v: -8 }) },

  // Ein entflogener Papagei
  { n: "papagei", ort: "himmel", platz: "himmel-zug", stufe: 2, zeit: "fs", wetter: "sb",
    bild: zug(-36, .15, "0 0 30 16", L("M9 9L1 12.6M9 9.6L2 14.6", "#2f5fb5", .8) + fluegel("M11 8L15 1L19 8Z", "#2f5fb5", .22) + E(14, 9, 5.6, 2.6, "#d6243a") + F("M11 8.4Q14 6.6 18 8.4Q14 10 11 8.4Z", "#f4c542") + `<circle cx="20.4" cy="7.6" r="2.2" fill="#d6243a"/><circle cx="21" cy="7" r=".7" fill="#fdfcf9"/><circle cx="21.2" cy="7" r=".3" fill="${TINTE}"/>` + F("M22.2 7.4Q24.6 7.6 23.4 10Q22.4 9.6 22 8.6Z", "#3d3934"), { d: 26, v: -5 }) },

  // Eine Biene ganz nah
  { n: "biene", ort: "himmel", platz: "himmel-l", zeit: "fs", wetter: "sb",
    bild: schweb(-22, -30, .07, "0 0 16 12", `<ellipse class="fu-flimmer" cx="7" cy="3.4" rx="2.6" ry="3" fill="#fff" opacity=".7"/><ellipse class="fu-flimmer" cx="10" cy="3.6" rx="2.2" ry="2.6" fill="#fff" opacity=".6"/>` + E(8, 7.6, 4.6, 3.2, "#f4c542") + F("M6 4.8h1.5v5.6H6ZM9 4.5h1.5v6.2H9Z", TINTE) + `<circle cx="13" cy="7.2" r="2" fill="${TINTE}"/><circle cx="13.7" cy="6.7" r=".4" fill="#fdfcf9"/>` + L("M3.4 7.6L1.4 8", TINTE, .4), "fu-biene"),
    css: `.fu-biene{animation:fu-biene 9s ease-in-out infinite}@keyframes fu-biene{0%,100%{translate:0 0}15%{translate:3vw -2vh}32%{translate:6vw 1vh}50%{translate:2vw 3vh}68%{translate:-3vw 1vh}84%{translate:-2vw -2vh}}` },

  // Libelle
  { n: "libelle", ort: "himmel", platz: "himmel-r", zeit: "s", wetter: "sb",
    bild: schweb(112, -24, .08, "0 0 22 12", `<g class="fu-flimmer">` + F("M11 6L4 1.4Q8 1 12 5ZM11 6L5 10.4Q9 11 12 7Z", "#bfe0ee", 'opacity=".8"') + `</g>` + L("M1.4 6H14", "#2f8f7a", .9) + `<circle cx="15.4" cy="6" r="1.6" fill="#2f8f7a"/><circle cx="16.2" cy="5.4" r=".6" fill="#6fb0e6"/>`, "fu-libelle"),
    css: `.fu-libelle{animation:fu-libelle 7s steps(1) infinite}@keyframes fu-libelle{0%{translate:0 0}20%{translate:4vw -3vh}40%{translate:8vw 1vh}60%{translate:3vw 4vh}80%{translate:-2vw 1vh}}` },

  // Pusteblumen-Schirmchen
  { n: "pusteblume", ort: "himmel", platz: "himmel-l", zeit: "fs", wetter: "sb",
    bild: schweb(-30, -40, .26, "0 0 40 30", [[6, 22, 0], [15, 12, -2], [24, 18, -4], [33, 7, -1], [29, 26, -5]].map(([x, y, v]) => `<g class="fu-wipp" style="--d:${f(2.4 + (x % 5) * .3)}s;--h:-1.6px;--v:${v}s"><g transform="translate(${x} ${y})">` + L("M0 0V3", "#b9b1a3", .16) + L("M0 0L-1.6 -1.6M0 0L-.8 -2M0 0V-2.2M0 0L.8 -2M0 0L1.6 -1.6", "#fdfcf9", .14) + `<circle cy="3.1" r=".26" fill="#8a7460"/></g></g>`).join(""), "fu-pusteblume"),
    css: `.fu-pusteblume{animation:fu-pusteblume 26s linear infinite}@keyframes fu-pusteblume{from{translate:-6vw 3vh}to{translate:12vw -6vh}}` },

  // Ahornsamen trudeln herab (im Herbst)
  { n: "ahornsamen", ort: "himmel", platz: "himmel-r", zeit: "h",
    bild: schweb(108, -70, .2, "0 0 30 40", [[6, 6, 0, 1.1], [16, 2, -3, 1.4], [24, 10, -6, .9]].map(([x, y, v, d]) => `<g class="fu-ahorn" style="--v:${v}s"><g transform="translate(${x} ${y})"><g class="fu-dreh" style="transform-box:fill-box;transform-origin:20% 80%;--d:${d}s">` + F("M0 0Q1.6 -3.4 4.6 -3.6Q3.6 -1 .6 .4Z", "#c98a3a") + `<circle cx=".2" cy=".2" r=".5" fill="#8a5f38"/></g></g></g>`).join(""), "fu-weg"),
    css: `.fu-ahorn{animation:fu-ahorn 11s linear infinite}@keyframes fu-ahorn{from{translate:0 -4px;opacity:0}8%{opacity:1}92%{opacity:1}to{translate:-5px 32px;opacity:0}}` },

  // Eine Feder schwebt herab
  { n: "feder", ort: "himmel", platz: "himmel-m", wetter: "sb",
    bild: schweb(40, -64, .07, "0 0 14 20", pendel(7, 2, F("M7 2Q12 8 7.6 18Q2 10 7 2Z", "#fdfcf9") + L("M7 2.6Q8 10 7.4 19.4", "#c9c2b8", .3) + L("M7.2 6L10 5M7.4 9L10.6 8.4M7.5 12L10 12.4M7.2 6L4.6 5.6M7.4 9L4 9.4M7.5 12L5 13", "#e6e2dc", .2), 24, 2.2), "fu-feder"),
    css: `.fu-feder{animation:fu-feder 16s ease-in-out infinite}@keyframes fu-feder{0%{translate:-2vw -6vh;opacity:0}10%{opacity:1}50%{translate:2vw 4vh}90%{opacity:1}100%{translate:-1vw 14vh;opacity:0}}` },

  // Luftpost: ein Brief mit Flügeln
  { n: "luftpost", ort: "himmel", platz: "himmel-zug", stufe: 2,
    bild: zug(-44, .14, "0 0 26 16", fluegel("M8 7L4 0L12 5Z", "#fdfcf9", .24) + fluegel("M18 7L22 0L14 5Z", "#fdfcf9", .24, -.12) + F("M5 6H21V15H5Z", "#fdfcf9") + L("M5 6L13 11.4L21 6", "#b9b1a3", .34) + F("M17 7.4h2.6v2.6H17Z", "#c8102e") + L("M5 15L10.4 10M21 15L15.6 10", "#e6e2dc", .24), { d: 30, v: -9 }) },

  // Ein Zeitungsblatt fliegt davon
  { n: "zeitungsblatt", ort: "himmel", platz: "himmel-zug", wetter: "br",
    bild: zug(-30, .12, "0 0 20 16", `<g class="fu-dreh" style="transform-box:fill-box;transform-origin:50% 50%;--d:5s">` + F("M2 3Q10 0 18 3Q16 8 18 13Q10 16 2 13Q4 8 2 3Z", "#fdfcf9") + L("M5 4.6Q10 3 15 4.6", TINTE, .8) + L("M5 7Q10 6 15 7M5 9Q10 8.4 15 9M5 11Q10 10.6 12 11", "#b9b1a3", .34) + F("M12.6 9.4h2.6v2.4h-2.6Z", "#c8102e") + `</g>`, { d: 22, v: -4 }) },

  // Ein Hut im Wind
  { n: "flieghut", ort: "himmel", platz: "himmel-zug", wetter: "br",
    bild: zug(-22, .09, "0 0 20 14", `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 50%;--w:26deg;--d:1.1s">` + F("M5 9Q5 2 10 2Q15 2 15 9Z", "#8a5f38") + F("M5 8h10v1.4H5Z", "#3d2c1f") + E(10, 9.8, 9, 1.8, "#8a5f38") + `</g>`, { d: 18, v: -3, nachLinks: true }) },

  // Lenkdrachen zieht Achten
  { n: "lenkdrachen", ort: "himmel", platz: "himmel-l", zeit: "fsh", wetter: "sb",
    bild: schweb(-26, -56, .16, "0 0 30 20", F("M15 2L28 14L15 10L2 14Z", "#e9506b") + F("M15 2L15 10L2 14Z", "#f4c542") + F("M15 10L11 18L15 15L19 18Z", "#6fb0e6") + L("M8 12L12 40M22 12L18 40", "#7a6a58", .14), "fu-lenk"),
    css: `.fu-lenk{animation:fu-lenk 8s ease-in-out infinite}@keyframes fu-lenk{0%,100%{translate:0 0;rotate:-14deg}25%{translate:5vw -3vh;rotate:16deg}50%{translate:10vw 0;rotate:-10deg}75%{translate:5vw 3vh;rotate:-24deg}}` },

  // Himmelslaterne steigt auf
  { n: "himmelslaterne", ort: "himmel", platz: "himmel-r", stufe: 2, zeit: "hw", wetter: "sb",
    bild: schweb(116, -30, .07, "0 0 14 20", F("M3 2Q7 0 11 2L12.4 12Q7 14 1.6 12Z", "#f6c89a") + F("M4.4 4Q7 2.6 9.6 4L10.4 11Q7 12.4 3.6 11Z", "#f9e08a") + `<g class="fu-blink" style="--d:.7s">` + E(7, 14.4, 1.4, 2, "#f19a4a") + `</g>` + L("M1.6 12L5.6 14.6M12.4 12L8.4 14.6", "#8a5f38", .2), "fu-laterne"),
    css: `.fu-laterne{animation:fu-laterne 24s ease-in-out infinite}@keyframes fu-laterne{0%{translate:-2vw 16vh;opacity:0}10%{opacity:1}85%{opacity:1}100%{translate:4vw -22vh;opacity:0}}` },

  // Eine Wolke in Herzform
  { n: "herzwolke", ort: "himmel", platz: "himmel-l", stufe: 2, wetter: "sb",
    bild: schweb(-34, -62, .3, "0 0 40 34", F(kreis(13, 12, 9) + kreis(27, 12, 9) + kreis(20, 18, 8) + kreis(11, 19, 5.4) + kreis(29, 19, 5.4) + kreis(16, 25, 4.6) + kreis(24, 25, 4.6) + kreis(20, 29.6, 3.4), "#fff") + F(kreis(11, 9, 3.6) + kreis(25, 9, 3.6), "#fff", 'opacity=".7"') + F(kreis(22, 23, 5) + kreis(26, 16, 5), "#ece9e4", 'opacity=".5"'), "fu-herzwolke"),
    css: `.fu-herzwolke{animation:fu-herzwolke 60s ease-in-out infinite alternate}@keyframes fu-herzwolke{from{translate:-3vw 0}to{translate:6vw -1vh}}` },

  // Eine Wolke wie ein Wal
  { n: "walwolke", ort: "himmel", platz: "himmel-r", stufe: 2, wetter: "sb",
    bild: schweb(104, -66, .4, "0 0 60 30", F(kreis(20, 16, 10) + kreis(32, 15, 9) + kreis(12, 18, 7) + kreis(42, 17, 6) + kreis(48, 16, 4) + kreis(26, 21, 6) + kreis(36, 21, 5), "#fff") + F("M50 16Q55 8 59 6Q57 12 59 17Q55 16 50 18Z", "#fff") + `<circle cx="12" cy="16" r=".9" fill="#b9c0c8"/>` + L("M8 21Q12 23 16 21.6", "#d9d3ca", .5)
      + `<g class="fu-auf" style="--d:3s;--h:-5px;--x:0px;--o:.8">` + L("M22 5V2M22 5Q20 2.6 18.6 3M22 5Q24 2.6 25.4 3", "#fff", .7) + `</g>`, "fu-walwolke"),
    css: `.fu-walwolke{animation:fu-walwolke 70s ease-in-out infinite alternate}@keyframes fu-walwolke{from{translate:4vw 0}to{translate:-8vw 1vh}}` },

  // Kunstflieger dreht einen Looping
  { n: "looping", ort: "himmel", platz: "himmel-m", stufe: 2, zeit: "fsh", wetter: "sb",
    bild: schweb(36, -92, .3, "0 0 40 40", `<circle cx="20" cy="20" r="14" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 2.4" opacity=".8"/><g class="fu-dreh" style="transform-box:view-box;transform-origin:20px 20px;--d:7s"><g transform="translate(20 6)">` + F("M-4 0Q0 -1.6 4 -.6L5 0L4 .6Q0 1.6 -4 0Z", "#d6243a") + F("M-.6 -.4L-2 -3H.4L1.6 -.4ZM-.6 .4L-2 3H.4L1.6 .4Z", "#fdfcf9") + F("M-4 0L-5.2 -1.6H-4L-3.2 0Z", "#fdfcf9") + `<ellipse class="fu-flimmer" cx="5.2" cy="0" rx=".3" ry="1.6" fill="${TINTE}" opacity=".7"/></g></g>`, "fu-weg") },

  // Eine Rakete steigt auf (ganz selten)
  { n: "rakete", ort: "himmel", platz: "himmel-l", stufe: 3,
    bild: schweb(-18, -40, .08, "0 0 14 40", `<g class="fu-blink" style="--d:.2s">` + F("M4.4 20Q7 30 5 38Q7 34 7 30Q8 35 9.4 38Q8 28 9.6 20Z", "#f19a4a") + F("M5.6 20Q7 26 7 30Q7.4 26 8.4 20Z", "#f9e08a") + `</g>` + F("M7 1Q11 6 10.4 20H3.6Q3 6 7 1Z", "#fdfcf9") + F("M7 1Q9.6 4 10 7.4H4Q4.4 4 7 1Z", "#d6243a") + `<circle cx="7" cy="11" r="1.7" fill="#6fb0e6" stroke="#857d70" stroke-width=".3"/>` + F("M3.6 15L.6 21L3.8 19.6ZM10.4 15L13.4 21L10.2 19.6Z", "#d6243a"), "fu-rakete"),
    css: `.fu-rakete{animation:fu-rakete 14s ease-in infinite}@keyframes fu-rakete{0%{translate:0 30vh;opacity:0}6%{opacity:1}70%{opacity:1}100%{translate:3vw -60vh;opacity:0}}` },

  // Ein Satellit zieht blinkend vorbei (ganz selten)
  { n: "satellit", ort: "himmel", platz: "himmel-zug", stufe: 3,
    bild: zug(-92, .1, "0 0 26 12", F("M1 3.6H9V8.4H1ZM17 3.6H25V8.4H17Z", "#2f5fb5") + L("M3.6 3.6V8.4M6.4 3.6V8.4M19.6 3.6V8.4M22.4 3.6V8.4M1 6H9M17 6H25", "#6fb0e6", .24) + F("M10 3H16V9H10Z", "#d9b23c") + L("M13 3V.6", "#857d70", .3) + `<circle class="fu-blink" cx="13" cy=".6" r=".7" fill="#d6243a" style="--d:.6s"/>` + F("M11.6 9Q13 11.6 14.4 9Z", "#b9b1a3"), { d: 60, v: -20 }) },

  // Ein Astronaut winkt herunter (ganz selten)
  { n: "astronaut", ort: "himmel", platz: "himmel-r", stufe: 3,
    bild: schweb(118, -86, .1, "0 0 20 24", `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 50%;--w:9deg;--d:4s">` + F("M5 10H15V18H5Z", "#fdfcf9") + F("M2.6 9.6H5V17H2.6Z", "#e6e2dc") + L("M6.6 18V22.6M13.4 18V22.6", "#fdfcf9", 2.6) + L("M5 12L1.6 15", "#fdfcf9", 2.2) + pendel(15, 11.6, L("M15 11.6L18.6 7.6", "#fdfcf9", 2.2), 18, .8)
      + `<circle cx="10" cy="6" r="4.6" fill="#fdfcf9"/>` + F("M6.6 5.4Q10 3 13.4 5.4Q13.6 8.6 10 9Q6.4 8.6 6.6 5.4Z", "#2f3f6b") + F("M7.6 5.2Q9 4.2 10.4 4.6Q9 5 8.4 6Z", "#6fb0e6") + F("M7.4 12h2v1.4h-2Z", "#d6243a") + F("M10.6 12h2v1.4h-2Z", "#2f5fb5") + `</g>`, "fu-astro"),
    css: `.fu-astro{animation:fu-astro 40s ease-in-out infinite alternate}@keyframes fu-astro{from{translate:0 0}to{translate:-9vw 5vh}}` },

  // Pegasus (ganz selten)
  { n: "pegasus", ort: "himmel", platz: "himmel-zug", stufe: 3,
    bild: zug(-60, .26, "0 0 40 26", fluegel("M14 12L18 0Q24 4 24 12Z", "#fdfcf9", .5) + E(20, 15, 8, 4, "#fdfcf9") + L("M26 12Q29 7 31 5.6", "#fdfcf9", 3.4) + F("M29.6 3.6L33 2.4L36.6 6.6L34.6 8.4L30.4 7.4Z", "#fdfcf9") + F("M31 2.8L31.6 .6L32.8 2.6Z", "#fdfcf9") + `<circle cx="33" cy="5" r=".4" fill="${TINTE}"/>` + L("M28.6 4Q26 6 25.6 10", "#f4c542", 1.2)
      + `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 0;--w:16deg;--d:.5s">` + L("M15 17L11 23M18 18L16 24", "#fdfcf9", 1.4) + `</g><g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 0;--w:16deg;--d:.5s;--v:-.25s">` + L("M24 18L27 23.6M26.6 16.6L31 21", "#fdfcf9", 1.4) + `</g>` + L("M12.4 14Q7 13 4 17", "#f4c542", 1.4), { d: 36, v: -8 }) },

  // Fliegender Teppich (ganz selten)
  { n: "teppich", ort: "himmel", platz: "himmel-zug", stufe: 3,
    bild: zug(-48, .2, "0 0 36 20", `<g class="fu-wipp" style="--d:1.4s;--h:-.6px">` + F("M2 14Q10 11 18 14T34 14L33 17Q26 14.6 18 17T3 17Z", "#8a2f4a") + L("M4 15.4Q10 13 18 15.6T32 15.6", "#f4c542", .5) + L("M2 14L.6 16M2.6 15.6L1 17.6M34 14L35.4 16M33.6 15.6L35 17.6", "#f4c542", .3)
      + F("M14 13.6V9Q14 6.6 16.4 6.6H18Q20.4 6.6 20.4 9V14Z", "#2f8f7a") + `<circle cx="17.4" cy="4.4" r="2" fill="${HAUT[3]}"/>` + F("M15.2 3.6Q17.4 0 19.8 3.4Q17.4 2.6 15.2 3.6Z", "#fdfcf9") + `<circle cx="17.4" cy="1.6" r=".5" fill="#d6243a"/>` + L("M20 9.6L24 8", "#2f8f7a", 1.3) + `</g>`, { d: 30, v: -7 }) },

  // Drachenflieger
  { n: "haengegleiter", ort: "himmel", platz: "himmel-zug", zeit: "fsh", wetter: "sb",
    bild: zug(-66, .22, "0 0 40 20", F("M2 6L20 1L38 6L20 4Z", "#f19a4a") + F("M20 1L38 6L20 4Z", "#d9802e") + L("M20 4L16 12H24Z", "#857d70", .3) + L("M12 12.6H27", "#2f3542", 2) + `<circle cx="28.6" cy="12" r="1.4" fill="${HAUT[0]}"/>` + F("M27.2 11.6a1.4 1.4 0 0 1 2.8 0Z", "#d6243a") + L("M20 4L20 11", "#857d70", .24), { d: 44, v: -11, nachLinks: true }) },
];
