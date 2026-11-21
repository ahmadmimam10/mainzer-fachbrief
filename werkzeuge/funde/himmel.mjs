// Fundstücke am Himmel. Jedes ist ein kleines eigenes Bild (viewBox frei wählbar), das mit himmel() an eine Stelle
// gesetzt wird oder mit zug() quer über den Himmel zieht. Lage in % der Logofläche: t negativ = über dem Logo.
import { f, dreh, himmel, zug, zufall, TINTE, BUNT, HAUT, kreis, L, F, E } from "./hilfen.mjs";

const FUNKEL = "M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z";
const pendel = (x, y, innen, w, d, v = 0) => dreh("fu-pendel", x, y, innen, `--w:${w}deg;--d:${d}s;--v:${v}s`);
const fluegel = (d, farbe, takt = .3, v = 0, mehr = "") => `<g class="fu-schlag" style="--d:${takt}s;--v:${v}s"><path fill="${farbe}" d="${d}"/>${mehr}</g>`;
const propeller = (x, y, r = 1.6) => `<ellipse class="fu-flimmer" cx="${x}" cy="${y}" rx="${f(r * .2)}" ry="${r}" fill="${TINTE}" opacity=".8"/>`;
// frei schwebend mit eigener Bewegung des ganzen Bildes (Klasse aus dem css-Feld)
const schweb = (l, t, g, vb, innen, kl, mehr = {}) => himmel(l, t, g, vb, innen, mehr).replace(/<svg /, `<div class="${kl} fu-weg"><svg `).replace(/<\/svg><\/div>$/, "</svg></div></div>");

// Kleines Schleppflugzeug (Nase rechts, Heck bei x = 76, Höhe wie das Banner); auch der Werbeflieger mit dem Tagesspruch nutzt es
export const FLUGZEUG = F("M78 8L76.2 4.2H78.6L80.6 7Z", "#d6243a") + F("M78 8.2Q80 5.8 86 5.9H92Q95.2 6.7 95.2 8.2Q95.2 9.8 92 10H82Q79 9.8 78 8.2Z", "#fdfcf9", `stroke="#8f9aa3" stroke-width=".15"`) + L("M80 8.4H94", "#d6243a", .6) + F("M87.6 6.2H91V7.6H87.6Z", "#9fc3d8") + F("M83.4 4.6H92.4V5.6H83.4Z", "#d6243a") + L("M86 5.6L87 6.4M90.6 5.6L89.8 6.4", "#5f564c", .2) + L("M86.4 10L85.6 11.8", "#5f564c", .25) + `<circle cx="85.4" cy="12.2" r=".8" fill="${TINTE}"/>` + propeller(95.6, 8.2, 2.2);

export default [
  // Diese Zeichnungen gibt es schon (intro-feste.mjs)
  { n: "heissluftballon", ort: "fest", platz: "himmel-r", zeit: "fsh", wetter: "s", dazu: ["heissluftballon"] },
  { n: "regenbogen", ort: "fest", platz: ["himmel-r", "huegel-r"], zeit: "fsh", wetter: "s", stufe: 2, dazu: ["regenbogen"] },
  { n: "flugzeug", ort: "fest", platz: "himmel-zug", wetter: "s", dazu: ["flugzeug"] },
  { n: "papierflieger", ort: "fest", platz: "himmel-zug", dazu: ["papierflieger"] },
  { n: "ballontraube", ort: "fest", platz: "himmel-r", dazu: ["luftballons"] },
  { n: "drachen", ort: "fest", platz: "himmel-l", zeit: "h", dazu: ["drachen"] },
  { n: "schmetterlinge", ort: "fest", platz: "vorn", zeit: "fs", dazu: ["schmetterlinge"] },

  // Zeppelin: zieht ganz gemächlich vorbei
  { n: "zeppelin", ort: "himmel", platz: "himmel-zug", stufe: 2,
    bild: zug(-64, .56, "0 0 64 25", F("M7 11L1 5H5.6L11 9ZM7 13L1 19H5.6L11 15Z", "#b3bbc2") + F("M2.4 11.2H9.6v1.6H2.4Z", "#c8102e") + E(33, 12, 29, 8, "#dfe3e6") + F("M4.2 13.2Q33 27 61.8 13.2Q33 21.4 4.2 13.2Z", "#c3c9ce")
      + L("M18 4.7Q16.2 12 18 19.3M33 4Q31.6 12 33 20M48 4.9Q47.2 12 48 19.1", "#b9c0c6", .2) + L("M4.6 12.2Q33 14.8 61.4 12.2", "#c8102e", .9) + E(30, 7.4, 17, 1.8, "#fff", `opacity=".55"`)
      + F("M27 19.4H39.4L38 22.8H28.4Z", "#5f6a72") + F("M29.4 20.2H31.2V21.4H29.4ZM32.2 20.2H34V21.4H32.2ZM35 20.2H36.8V21.4H35Z", "#cfe3ee") + propeller(26.2, 21.2, 1.7), { d: 95, v: -30 }) },

  // Ufo: schwebt, leuchtet, saust davon – und ist plötzlich wieder da
  { n: "ufo", ort: "himmel", platz: "himmel-l", wetter: "sb", stufe: 3,
    bild: schweb(-30, -58, .26, "0 0 40 36", `<path class="fu-ufo-strahl" fill="#fff3a8" d="M14.5 16L7 36H33L25.5 16Z"/>` + F("M13 12a7 7 0 0 1 14 0Z", "#cfeaf4") + `<circle cx="20" cy="9.4" r="2.3" fill="#8ccf7e"/>` + F(kreis(19.1, 9, .5) + kreis(20.9, 9, .5), TINTE) + L("M20 7.1V5.6", "#8ccf7e", .3) + `<circle cx="20" cy="5.4" r=".45" fill="#8ccf7e"/>`
      + E(20, 13.8, 15, 3.8, "#8f9aa3") + E(20, 12.9, 15, 3.2, "#c9d2d8") + E(20, 12.2, 9, 1.4, "#e3e8ec") + E(20, 16.2, 6.4, 1.3, "#6f7a82")
      + [7.5, 13.5, 20, 26.5, 32.5].map((x, i) => `<circle class="fu-blink" style="--d:.5s;--v:${-i * .2}s" cx="${x}" cy="${f(14.2 + (i === 2 ? .9 : i % 4 ? .5 : -.1))}" r=".85" fill="${i % 2 ? "#f4c542" : "#e9506b"}"/>`).join(""), "fu-ufo"),
    css: `.fu-ufo{animation:fu-ufo 16s ease-in-out infinite}@keyframes fu-ufo{0%,8%{translate:-40vw -20vh;scale:.2;opacity:0}16%{translate:0 0;scale:1;opacity:1}24%{translate:1.5vw -1vh}32%{translate:-1.5vw .6vh}40%{translate:1vw 1vh}48%{translate:-1vw -.6vh}56%,62%{translate:0 0;scale:1;opacity:1}68%,100%{translate:44vw -26vh;scale:.15;opacity:0}}
.fu-ufo-strahl{animation:fu-ufo-s 16s linear infinite}@keyframes fu-ufo-s{0%,30%,60%,100%{opacity:0}34%,54%{opacity:.5}44%{opacity:.25}}` },

  // Gleitschirm
  { n: "gleitschirm", ort: "himmel", platz: "himmel-r", zeit: "fsh",
    bild: schweb(112, -62, .2, "0 0 34 36", pendel(17, 5, F("M2 11Q17 -5 32 11Q17 3.4 2 11Z", "#e9506b") + F("M8.6 6Q11.4 2.6 14.6 1.6Q12.4 4 11.4 5ZM25.4 6Q22.6 2.6 19.4 1.6Q21.6 4 22.6 5Z", "#f4c542") + F("M14.6 1.6Q17 1 19.4 1.6Q17 3.2 14.6 1.6Z", "#fdfcf9")
      + L("M3 10.6L16 27M10.4 6.2L16.6 27M23.6 6.2L17.4 27M31 10.6L18 27", "#7a6a58", .14) + E(17, 29.6, 1.6, 2.3, "#2f3542") + `<circle cx="17" cy="26.6" r="1.25" fill="${HAUT[0]}"/>` + F("M15.7 26.4a1.3 1.3 0 0 1 2.6 0Z", "#f4c542") + L("M16.4 31.4L15.6 34M17.6 31.4L18.6 33.8", TINTE, .7), 7, 2.4), "fu-gleit"),
    css: `.fu-gleit{animation:fu-gleit 22s ease-in-out infinite alternate}@keyframes fu-gleit{0%{translate:-7vw -4vh}50%{translate:5vw 1vh}100%{translate:-3vw 5vh}}` },

  // Rettungshubschrauber
  { n: "hubschrauber", ort: "himmel", platz: "himmel-zug", wetter: "sbr",
    bild: zug(-58, .34, "0 0 48 22", F("M42 10.2L46.2 5.4H47.8L45.6 12Z", "#f4c542") + `<ellipse class="fu-flimmer" cx="46.8" cy="8" rx=".4" ry="2.6" fill="${TINTE}" opacity=".7"/>`
      + F("M8 9Q8 5 14 5H24Q29 5 31 9L44 10.4V12L31 13Q29 16.6 24 16.6H13Q8 16 8 12Z", "#f4c542") + F("M8.1 12.2H31.2L30.5 13.5H8.6Z", "#d6243a") + F("M9.4 9.6Q9.7 6.4 14 6.4H17.4V10.6H9.5Z", "#bfe0ee") + F("M18.6 6.4H23V10.6H18.6Z", "#bfe0ee")
      + F("M25.6 7.6h1v1.4h1.4v1h-1.4v1.4h-1V10h-1.4V9h1.4Z", "#fdfcf9") + L("M20 5V3", "#5f564c", .5) + `<ellipse class="fu-flimmer2" cx="20" cy="2.7" rx="18" ry=".45" fill="${TINTE}" opacity=".75"/>`
      + L("M10 19.8H28M14 16.6V19.8M23 16.6V19.8", "#5f564c", .5) + `<circle class="fu-blink" style="--d:.5s" cx="12" cy="17.2" r=".6" fill="#e2332f"/>`, { d: 26, v: -8, nachLinks: true }) },

  // Der Storch bringt ein Bündel
  { n: "storch", ort: "himmel", platz: "himmel-zug", zeit: "fs", stufe: 2,
    bild: zug(-66, .32, "0 -6 52 32", L("M14 13L2.6 15.4M14 13.7L3.2 16.8", "#d6243a", .5) + F("M13.8 10.6L8 9.2L13 13.6Z", "#2f2b28") + E(22, 12, 9, 3.6, "#fdfdfd") + L("M30 11.2Q36 9.8 39.8 8.4", "#fdfdfd", 2.2) + `<circle cx="40.6" cy="8" r="1.55" fill="#fdfdfd"/>` + F("M41.8 7.3L49.4 8.4L41.8 9Z", "#d6243a") + `<circle cx="41" cy="7.7" r=".22" fill="${TINTE}"/>`
      + fluegel("M17 11.4Q20 -1 31 -4Q27.4 5 27.4 11.4Z", "#fdfdfd", .42, 0, F("M24.4 2Q27.4 -1.8 31 -4Q28.8 1.6 28 5Z", "#2f2b28"))
      + pendel(47, 8.6, L("M47 8.6V14", "#8f9aa3", .2) + F("M43.2 14.2Q47 12.4 50.8 14.2Q51.2 20 47 20.8Q42.8 20 43.2 14.2Z", "#fdfcf9", `stroke="#b9c2c9" stroke-width=".2"`) + `<circle cx="47" cy="15.8" r="1.5" fill="${HAUT[0]}"/>` + L("M46.6 14.4q.5 -.5 .9 0", "#8a5a3c", .22) + F("M46.2 13.8l.8 -.9l.8 .9Z", "#fdfcf9", `stroke="#b9c2c9" stroke-width=".2"`), 8, 1.1), { d: 42, v: -12 }) },

  // Gänse ziehen im Keil
  { n: "gaense", ort: "himmel", platz: "himmel-zug", zeit: "fh",
    bild: zug(-70, .5, "0 0 72 34", [[6, 17], [15, 13], [15, 21], [24, 9], [24, 25], [33, 5], [33, 29]].map(([x, y], i) => `<g transform="translate(${x} ${y})">` + L("M0 0L-3.4 -.3", "#5a5248", .5) + F("M0 -.5Q3 -1.2 6 0Q3 1.1 0 .5Z", "#6b6156") + F("M5.6 0L7.4 -.5V.5Z", "#5a5248") + F("M-3.4 -.7L-4.6 -.2L-3.4 .1Z", "#e8862c")
      + fluegel("M1.6 0Q2.6 -4.4 5.4 -4.8Q4.4 -1.8 4.4 0Z", "#857d70", .34, -i * .06) + `</g>`).join(""), { d: 36, v: -10, nachLinks: true }) },

  // Ein kleines Flugzeug schleppt das Banner mit dem Zeitungskopf
  { n: "bannerflieger", ort: "himmel", platz: "himmel-zug", zeit: "fs", wetter: "s", stufe: 2,
    bild: zug(-60, .8, "0 0 98 17", L("M78 8.4L60 8.4", "#7a6a58", .15) + `<g class="fu-bf-banner">` + F("M8 4.6Q21 3 34 4.6T60 4.6V12.4Q47 14 34 12.4T8 12.4Z", "#fdfcf9", `stroke="#b9b1a3" stroke-width=".18"`) + F("M13 10.6a4 4 0 0 1 8 0Z", "#c8102e") + L("M26 7.2H52M26 9.8H45", "#181716", 1.2) + `<circle cx="54.6" cy="10" r=".85" fill="#c8102e"/></g>`
      + FLUGZEUG, { d: 48, v: -14 }),
    css: `.fu-bf-banner{transform-box:fill-box;transform-origin:100% 50%;animation:fu-bf 1.6s ease-in-out infinite alternate}@keyframes fu-bf{from{transform:skewY(-2.5deg)}to{transform:skewY(2.5deg) scaleX(.97)}}` },

  // Blasser Mond am Morgenhimmel
  { n: "tagmond", ort: "himmel", platz: "himmel-l", wetter: "s",
    bild: himmel(-26, -64, .1, "0 0 20 20", F("M12 1.6A8.5 8.5 0 1 0 12 18.4A6.4 8.5 0 0 1 12 1.6Z", "#fff", `opacity=".78"`) + F(kreis(7, 7.4, 1) + kreis(6, 12, 1.4) + kreis(8.6, 14.8, .7), "#e3eaf0", `opacity=".8"`)) },

  // Eine Wolke, die aussieht wie ein Schaf
  { n: "schafwolke", ort: "himmel", platz: "himmel-r", wetter: "sb",
    bild: schweb(108, -50, .3, "0 0 52 36", L("M17 25V31.4M22 26V32.4M31.6 26V32.4M36.6 25V31.4", "#5a5248", 1.3) + `<g style="fill:var(--wo,#fffdf9)">` + F(kreis(9, 17, 3.2) + kreis(15, 16, 7) + kreis(23, 12, 8) + kreis(32, 13, 7.5) + kreis(38, 18.4, 6.4) + kreis(28, 20, 8) + kreis(19, 21, 7), "inherit").replace(`fill="inherit"`, "") + `</g>`
      + E(26.6, 24.6, 13, 2.6, "#000", `opacity=".06"`) + E(21, 9.6, 5, 2.6, "#fff", `opacity=".7"`) + E(40.6, 12.8, 1.2, 2.5, "#5a5248", `transform="rotate(-38 40.6 12.8)"`) + E(43.6, 16.6, 4.2, 5, "#5a5248", `transform="rotate(12 43.6 16.6)"`)
      + `<circle cx="44.8" cy="15.6" r=".8" fill="#fff"/><circle cx="45" cy="15.7" r=".36" fill="${TINTE}"/>`, "fu-schafw"),
    css: `.fu-schafw{animation:fu-schafw 30s ease-in-out infinite alternate}@keyframes fu-schafw{from{translate:-5vw 0}to{translate:5vw -1vh}}` },

  // Ein roter Luftballon ist jemandem davongeflogen
  { n: "roter-ballon", ort: "himmel", platz: "himmel-l", wetter: "sb",
    bild: schweb(-14, -8, .07, "0 0 12 34", pendel(6, 8, E(6, 7.5, 5, 6.4, "#d6243a") + F("M5.2 13.7h1.6l.5 1.3h-2.6Z", "#b01f33") + E(4.2, 5, 1.1, 1.8, "#fff", `opacity=".5" transform="rotate(-24 4.2 5)"`) + L("M6 15Q4 20 6.5 24T5.5 33", "#857d70", .25), 6, 1.7), "fu-rball"),
    css: `.fu-rball{animation:fu-rball 46s linear infinite}@keyframes fu-rball{0%{translate:0 8vh;opacity:0}4%{opacity:1}90%{opacity:1}100%{translate:9vw -64vh;opacity:0}}` },

  // Fallschirmspringer
  { n: "fallschirm", ort: "himmel", platz: "himmel-l", zeit: "fsh", stufe: 2,
    bild: schweb(-22, -70, .16, "0 0 28 36", pendel(14, 4, F("M1 12Q14 -8 27 12Q24.4 10.4 21.6 12Q19.2 10.4 16.6 12Q14 10.4 11.4 12Q8.8 10.4 6.4 12Q3.6 10.4 1 12Z", "#f19a4a") + F("M11.4 12Q14 -6.4 16.6 12Q14 10.4 11.4 12ZM1 12Q3 4 7.6 .6Q5 6 6.4 12Q3.6 10.4 1 12ZM27 12Q25 4 20.4 .6Q23 6 21.6 12Q24.4 10.4 27 12Z", "#fdfcf9")
      + L("M1 12L13 27M11.4 12L13.6 27M16.6 12L14.4 27M27 12L15 27", "#7a6a58", .15) + L("M13 28.4L11.6 26M15 28.4L16.4 26", "#2c5aa8", .8) + L("M14 27.6V31.4", "#2c5aa8", 2.3) + L("M13.4 31.6L12.6 35M14.6 31.6L15.6 35", TINTE, .9) + `<circle cx="14" cy="26.4" r="1.3" fill="${HAUT[1]}"/>` + F("M12.7 26.2a1.3 1.3 0 0 1 2.6 0Z", "#d6243a"), 6, 2.2), "fu-fschirm"),
    css: `.fu-fschirm{animation:fu-fschirm 34s linear infinite}@keyframes fu-fschirm{0%{translate:-4vw -34vh;opacity:0}5%{opacity:1}88%{opacity:1}100%{translate:5vw 38vh;opacity:0}}` },

  // Ein Superheld auf dem Weg zur Arbeit
  { n: "superheld", ort: "himmel", platz: "himmel-zug", stufe: 3,
    bild: zug(-54, .26, "-10 0 50 16", L("M-8 4h6M-10 9.4h7M-6 13h5", "#fff", .45, `opacity=".85"`) + pendel(10, 6.4, F("M10 5.6Q3 2.4 0 6.6Q4.4 7.4 2 11.4Q7.6 10.4 13 8.8Z", "#d6243a"), 6, .25) + L("M9 8.4L2 9.4", "#2c5aa8", 2.1) + L("M2.6 9.3L.6 9.6", "#d6243a", 2.2) + L("M9 8H20", "#2c5aa8", 3.5) + F(kreis(15, 8, 1), "#f4c542")
      + L("M19 7.2L27.4 6.4", "#2c5aa8", 1.5) + `<circle cx="28" cy="6.3" r=".95" fill="${HAUT[0]}"/><circle cx="21.8" cy="5.4" r="2" fill="${HAUT[0]}"/>` + F("M19.8 5.2a2 2 0 0 1 3.6 -1.2Q21.4 3.8 19.8 5.2Z", "#2a211c") + L("M21.4 5.2h2.2", "#2c5aa8", .7), { d: 9, v: -2 }),
    css: `.fu-superheld .fu-zieh{animation-duration:26s;animation-timing-function:cubic-bezier(.1,.6,.1,1)}` },

  // Walpurgisnacht und Halloween: die Hexe mit ihrer Katze
  { n: "hexe", ort: "himmel", platz: "himmel-zug", wetter: "sbr", am: ["04-30", "10-31"], stufe: 3,
    bild: zug(-60, .34, "0 -6 46 30", [[4, 8, .5], [-2, 13, .36], [7, 19, .3]].map(([x, y, g], i) => `<path class="fu-blink" style="--d:.6s;--v:${-i * .3}s" fill="#f4e38a" transform="translate(${x} ${y}) scale(${g})" d="${FUNKEL}"/>`).join("")
      + F("M0 13.4L7 14.5V16L0 18.2Z", "#d9a441") + L("M6 15.2L42 12", "#8a5f38", .7) + E(12, 12.6, 2.4, 1.2, TINTE) + `<circle cx="14.6" cy="11.2" r="1.1" fill="${TINTE}"/>` + F("M13.8 10.6L14 9.2L14.8 10.2ZM14.9 10.2L15.7 9.3L15.7 10.7Z", TINTE) + L("M9.8 12.2Q8 11 8.6 9", TINTE, .5)
      + pendel(20, 7, F("M20 7Q14 8 12 5Q16 5.6 19 3.6Z", "#6a3f8a"), 8, .4) + F("M17.4 14Q16.4 7 20.4 6L24.4 6.4Q27.4 9 26.8 13.4Z", "#4a2f6a") + L("M19.6 13.6L16 18.6", TINTE, 1) + L("M15.6 18.8l-1.6 .4", TINTE, 1) + L("M22.4 8.4L28.6 12.4", "#4a2f6a", 1.1)
      + L("M22 3.6Q19 5 18.6 7.6M22.6 3.4Q20 6 20.4 8", "#d9772e", .5) + `<circle cx="23.6" cy="4.6" r="1.9" fill="#c9d88a"/>` + F("M25.2 4.6L27 5.4L25.2 5.6Z", "#c9d88a") + `<circle cx="24.4" cy="4.2" r=".22" fill="${TINTE}"/>` + F("M19.8 3.8L24.8 -4.6L26.8 3Z", "#2f2b28") + L("M18.4 3.7L28.6 3", "#2f2b28", .9) + L("M20.4 2.9L26.4 2.3", "#8a5fb0", .5),
      { d: 20, v: -5 }) },

  // Ein Doppeldecker dreht Runden
  { n: "doppeldecker", ort: "himmel", platz: "himmel-l", zeit: "fsh", wetter: "s", stufe: 2,
    bild: schweb(-30, -64, .2, "0 0 31 18", F("M3 10L1.4 5.2H4L6.6 8.8Z", "#d6243a") + F("M3 10Q8 7.6 16 7.6H24Q27.4 8.4 27.4 10Q27.4 11.8 24 12.2H12Q6 12 3 10Z", "#d6243a") + L("M8 10H24", "#f6efe1", .5) + L("M13 5.6V12.8M21 5.6V12.8M15 5.6L19 12.6", "#5f564c", .25)
      + F("M10.6 4.4H23.4V5.7H10.6Z", "#f6efe1", `stroke="#b9b1a3" stroke-width=".12"`) + F("M10.6 12.6H23.4V13.9H10.6Z", "#f6efe1", `stroke="#b9b1a3" stroke-width=".12"`) + `<circle cx="16.6" cy="6.9" r="1.2" fill="${HAUT[0]}"/>` + F("M15.4 6.7a1.2 1.2 0 0 1 2.4 0Z", "#8a5f38")
      + pendel(15.6, 7.6, L("M15.6 7.6Q13 7 11.4 8.2", "#fdfcf9", .5), 14, .2) + L("M15.6 13.9V15.2", "#5f564c", .3) + `<circle cx="15.6" cy="15.8" r="1.1" fill="${TINTE}"/>` + propeller(28, 10, 2.6), "fu-dd"),
    css: `.fu-dd{transform-origin:50% 480%;animation:fu-dd 11s linear infinite}@keyframes fu-dd{from{rotate:-20deg}to{rotate:340deg}}` },

  // Starenschwarm: eine Wolke aus Vögeln, die ständig ihre Form ändert
  { n: "stare", ort: "himmel", platz: "himmel-r", zeit: "hw", wetter: "sb",
    bild: himmel(104, -60, .42, "0 0 70 44", [0, 1].map(k => { const r = zufall(31 + k * 7); let d = ""; for (let i = 0; i < 34; i++) { const w = r() * 6.283, a = Math.sqrt(r()), x = 35 + (k ? 5 : -4) + Math.cos(w) * a * 22, y = 22 + Math.sin(w) * a * 11; d += `M${f(x)} ${f(y)}l.9 .5l.9 -.5`; }
      return `<path class="fu-stare fu-st${k}" fill="none" stroke="${TINTE}" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`; }).join("")),
    css: `.fu-stare{transform-box:fill-box;transform-origin:50% 50%;animation:fu-stare 7s ease-in-out infinite alternate}.fu-st1{animation-duration:9s;animation-direction:alternate-reverse}
@keyframes fu-stare{0%{transform:translate(-7px,2px) scale(1.25,.7) skewX(-20deg)}50%{transform:translate(4px,-3px) scale(.8,1.25) skewX(10deg)}100%{transform:translate(8px,3px) scale(1.3,.8) skewX(26deg)}}` },

  // Wetterballon mit Messkasten
  { n: "wetterballon", ort: "himmel", platz: "himmel-r", stufe: 2,
    bild: schweb(118, -30, .08, "0 0 16 44", pendel(8, 9, E(8, 9, 7, 8.4, "#fdfdfd", `stroke="#c9d3db" stroke-width=".25"`) + E(5.4, 6, 1.6, 2.6, "#fff", `opacity=".9" transform="rotate(-22 5.4 6)"`) + F("M7.2 17.2h1.6l.4 1.2H6.8Z", "#c9d3db") + L("M8 18.4V36", "#857d70", .2) + F("M5.4 25Q8 22.4 10.6 25Z", "#d6243a")
      + F("M6.2 36H9.8V39.8H6.2Z", "#f19a4a") + L("M9.8 37l1.6 -1.4", "#5f564c", .2) + F("M6.8 36.8h1v1h-1Z", "#fdfcf9"), 4, 2.6), "fu-wballon"),
    css: `.fu-wballon{animation:fu-wballon 60s linear infinite}@keyframes fu-wballon{0%{translate:0 10vh;opacity:0}4%{opacity:1}92%{opacity:1}100%{translate:-8vw -62vh;opacity:0}}` },

  // Eine Taube trägt die Zeitung aus
  { n: "zeitungstaube", ort: "himmel", platz: "himmel-zug",
    bild: zug(-48, .2, "0 -3 30 22", F("M7.6 9L2.6 7.4L3 10.6L7.4 11.4Z", "#8f98a3") + E(13, 10, 6, 2.8, "#9aa3ad") + E(14, 10.8, 3.6, 1.5, "#c3cad1") + `<circle cx="19.4" cy="8.4" r="1.7" fill="#9aa3ad"/>` + F("M20.9 8L22.8 8.5L20.9 9Z", "#e8a23c") + `<circle cx="19.9" cy="8" r=".22" fill="${TINTE}"/>` + F("M17.4 9.6a1.6 1 0 0 0 2.2 .9Z", "#6f8f8a")
      + fluegel("M9.6 9.6Q12 .4 19.4 -1Q16.6 5 16.4 9.6Z", "#b9c0c8", .2, 0, L("M12.6 6Q14.6 3.2 17.4 1.4", "#8f98a3", .3))
      + L("M12 12.6V14M15 12.6V14", "#d98a8a", .3) + F("M8.6 14H19.4V16.6H8.6Z", "#fdfcf9", `stroke="#8f9aa3" stroke-width=".2"`) + L("M13.2 14V16.6M14.6 14V16.6", "#c8102e", .45) + L("M9.6 15.3h2.6M16 15.3h2.6", "#8f9aa3", .25), { d: 24, v: -6 }) },

  // Schwalben jagen im Bogen
  { n: "schwalben", ort: "himmel", platz: "himmel-l", zeit: "fs", wetter: "sb",
    bild: himmel(-34, -52, .4, "0 0 70 44", [[20, 18, 15, 3.2, 0], [44, 22, 19, 4.1, -1.3], [34, 30, 12, 2.7, -.6]].map(([cx, cy, r, d, v], i) => `<g transform="translate(${cx} ${cy}) scale(1 .55)">` + dreh("fu-dreh", 0, 0,
      `<g transform="translate(${r} 0) scale(1 1.8)"><path fill="${TINTE}" d="M0 -1.7L.7 -.5L3.4 .3L1 .5L.3 2.6L0 1.2L-.3 2.6L-1 .5L-3.4 .3L-.7 -.5Z"/></g>`, `--d:${d}s;--v:${v}s${i === 1 ? ";animation-direction:reverse" : ""}`) + `</g>`).join("")) },

  // Regen: Ein Schirm hat sich losgerissen
  { n: "schirmflug", ort: "himmel", platz: "himmel-zug", wetter: "r",
    bild: zug(-42, .12, "0 0 22 22", dreh("fu-dreh", 11, 11, F("M2 11Q11 -1 20 11Q17.6 9.6 15.4 11Q13.2 9.6 11 11Q8.8 9.6 6.6 11Q4.4 9.6 2 11Z", "#d6243a") + F("M11 5Q16 5.6 20 11Q17.6 9.6 15.4 11Q14.4 7 11 5Z", "#000", `opacity=".12"`) + L("M11 5V19.4q0 1.5 -1.5 1.5", TINTE, .5), "--d:3.4s"), { d: 15, v: -4, nachLinks: true }),
    css: `.fu-schirmflug .fu-zieh>svg{animation:i-ein 1.2s ease 1.2s both,fu-schirmflug 3s ease-in-out infinite alternate}@keyframes fu-schirmflug{from{translate:0 -3vh}to{translate:0 4vh}}` },

  // Wetterleuchten hinter den Hügeln
  { n: "wetterleuchten", ort: "himmel", platz: "himmel-r", zeit: "fsh", wetter: "r", stufe: 2,
    bild: `<div class="fu-wl-himmel"></div>` + himmel(116, -44, .14, "0 0 14 30", F("M8 0L2 14H7L4 30L13 11H8L11 0Z", "#fffbe0", `stroke="#f4e38a" stroke-width=".3" class="fu-wl-blitz"`)),
    css: `.fu-wl-himmel{position:absolute;left:-200vw;right:-200vw;top:-200vh;bottom:39.45%;background:#fff;opacity:0;animation:fu-wl 9s linear infinite}
.fu-wl-blitz{opacity:0;animation:fu-wl2 9s linear infinite}@keyframes fu-wl{0%,72%,100%{opacity:0}73%{opacity:.45}74%{opacity:.08}75.5%{opacity:.36}78%{opacity:0}}@keyframes fu-wl2{0%,72%,100%{opacity:0}73%{opacity:1}74%{opacity:.2}75.5%{opacity:1}77%{opacity:0}}` },

  // 1. April: Fische schwimmen durch den Himmel
  { n: "himmelsfische", ort: "himmel", platz: "himmel-zug", wetter: "sbr", am: "04-01", stufe: 3,
    bild: zug(-58, .5, "0 0 62 28", [[40, 7, 1.5, "#f19a4a", "#d9772e"], [22, 16, 1.15, "#6fb0e6", "#4f8fd0"], [8, 8, .9, "#e9506b", "#c93a57"]].map(([x, y, g, c, c2], i) => `<g transform="translate(${x} ${y}) scale(${g})">` + pendel(-3.4, 0, F("M-3.4 0L-6 -2.2V2.2Z", c2), 16, .3, -i * .1) + F("M-4 0Q0 -3.4 4 0Q0 3.4 -4 0Z", c) + F("M-.6 -1.8Q.6 -3.4 1.6 -1.6Z", c2) + L("M-1.4 -1.3Q-.6 0 -1.4 1.3", c2, .3) + `<circle cx="2.2" cy="-.4" r=".5" fill="#fff"/><circle cx="2.34" cy="-.4" r=".24" fill="${TINTE}"/></g>`
      + `<circle class="fu-auf" style="--d:2.4s;--v:${-i * .8}s;--x:1px;--h:-6px;--o:.9" cx="${x + 7}" cy="${y - 1}" r=".7" fill="none" stroke="#fff" stroke-width=".3"/>`).join(""), { d: 34, v: -9 }) },
];
