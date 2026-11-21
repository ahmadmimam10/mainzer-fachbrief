// Fundstücke auf dem Zeitungsblatt selbst: am Titel, an der Unterzeile, an den Rändern der Bühne und am Logo.
//   titel  – hängt an einem Buchstaben des Titels (dazu = Nummer: 0 M, 1 a, 2 i, 3 n, 4 z, 5 e, 6 r, 7 B, 8 o, 9 n, 10 i,
//            11 b, 12 l, 13 a, 14 t, 15 t). Der Ursprung liegt oben in der Mitte des Buchstabenfelds; Maße in em der
//            Titelschrift (Oberkante von l, b, t ≈ 0.21em; Grundlinie ≈ 0.8em). --tw = Breite des ganzen Titels.
//   unter  – liegt in der Unterzeile (Klasse fu-u: absolut in der Zeile).
//   buehne – liegt auf der ganzen Bühne (Klasse fu-b: absolut, Maße in px oder %).
//   logo   – liegt über dem Logo (viewBox 0 0 128 128; Domspitze Mitte 64,2 / 2, linker Turm 38 / 12, rechter 88,4 / 35).
import { f, dreh, vogel, TINTE, kreis, L, F, E } from "./hilfen.mjs";

const pendel = (x, y, innen, w, d, v = 0) => dreh("fu-pendel", x, y, innen, `--w:${w}deg;--d:${d}s;--v:${v}s`);
const taube = s => vogel({ s, farbe: "#fdfdfd", bauch: "#fff", schnabel: "#e8a23c" });

export default [
  // Ein Spatz sitzt auf dem l und pickt
  { n: "spatz", ort: "titel", platz: "titel", dazu: 12,
    bild: `<svg viewBox="-2 -2.2 4 2.2" style="left:-.2em;top:-.01em;width:.4em"><g class="fu-huepf" style="--d:5s;--h:-.4px"><g class="fu-pick" style="--d:2.6s;--w:28deg">${vogel()}</g></g></svg>` },

  // Die Zeitungsente watschelt unter dem Titel entlang
  { n: "zeitungsente", ort: "titel", platz: "titel", dazu: 0, stufe: 2,
    bild: `<span class="fu-ze"><svg viewBox="-3 -4 6.4 4.2" style="left:-.3em;top:.87em;width:.3em"><g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 100%;--w:7deg;--d:.28s">` + L("M-.3 0v-.6M.5 0v-.6", "#e8862c", .22)
      + F("M-2 -1.6L-2.9 -2.6L-1.6 -2.4Z", "#fdfcf9", `stroke="#8f9aa3" stroke-width=".1"`) + F("M-2 -1.2Q-2 -2.5 0 -2.5Q1.8 -2.5 1.8 -1.2Q1.8 -.5 0 -.5Q-2 -.5 -2 -1.2Z", "#fdfcf9", `stroke="#8f9aa3" stroke-width=".1"`) + L("M-1.3 -1.9h1.8M-1.4 -1.5h2.2M-1.2 -1.1h1.7", "#8f9aa3", .1)
      + `<circle cx="1.5" cy="-2.9" r=".78" fill="#fdfcf9" stroke="#8f9aa3" stroke-width=".1"/>` + F("M2.2 -3.1L3.3 -2.85L2.2 -2.6Z", "#e8862c") + `<circle cx="1.75" cy="-3.05" r=".12" fill="#c8102e"/></g></svg></span>`,
    css: `.fu-ze{position:absolute;left:0;top:0;animation:fu-ze 36s linear 3s infinite}@keyframes fu-ze{0%{translate:-.4em 0;scale:1 1}49.5%{translate:calc(var(--tw) - 1em) 0;scale:1 1}50%{translate:calc(var(--tw) - 1em) 0;scale:-1 1}99.5%{translate:-.4em 0;scale:-1 1}100%{translate:-.4em 0;scale:1 1}}` },

  // Der rote Punkt hüpft
  { n: "huepfpunkt", ort: "titel", platz: "titel", dazu: 15,
    bild: `<svg viewBox="0 0 1 1" style="width:0"></svg>`,
    css: `.intro .i-titel b{animation:i-punkt .55s cubic-bezier(.3,1.7,.5,1) 2.5s both,fu-punkt 6s cubic-bezier(.3,0,.4,1) 4.5s infinite}@keyframes fu-punkt{0%,68%,100%{translate:0 0}76%{translate:0 -.46em}84%{translate:0 0}89%{translate:0 -.15em}94%{translate:0 0}}` },

  // Ein Marienkäfer krabbelt über die Unterzeile
  { n: "marienkaefer", ort: "unter", platz: "unter", zeit: "fs",
    bild: `<span class="fu-u" style="left:10%;right:10%;bottom:74%;height:0"><span class="fu-mk"><svg viewBox="-3 -3.4 6.4 3.6" style="width:.9em">` + `<g class="fu-pendel" style="transform-box:fill-box;transform-origin:50% 100%;--w:4deg;--d:.2s">` + L("M-1.4 -.5L-1.9 0M0 -.4V0M1.3 -.5L1.8 0", TINTE, .22)
      + F("M-2.4 -.6a2.4 2.4 0 0 1 4.8 0Z", "#d6243a") + F("M2.4 -.6a.9 .9 0 0 0 0 -1.6Q3.3 -1.6 3.2 -.6Z", TINTE) + F(kreis(-1.2, -1.3, .42) + kreis(.2, -2.2, .4) + kreis(.9, -1.1, .4) + kreis(-.3, -.95, .3), TINTE) + L("M0 -3V-.6", TINTE, .12) + E(-.9, -2.2, .5, .26, "#fff", `opacity=".5" transform="rotate(-30 -.9 -2.2)"`) + `</g></svg></span></span>`,
    css: `.fu-mk{position:absolute;bottom:0;left:0;animation:fu-mk 44s linear 3.4s infinite}.fu-mk>svg{display:block;height:auto;overflow:visible}
@keyframes fu-mk{0%{left:0;scale:1 1}49.5%{left:calc(100% - .9em);scale:1 1}50%{left:calc(100% - .9em);scale:-1 1}99.5%{left:0;scale:-1 1}100%{left:0;scale:1 1}}` },

  // Regen: Eine Schnecke kriecht über die Unterzeile
  { n: "schnecke", ort: "unter", platz: "unter", wetter: "r",
    bild: `<span class="fu-u" style="left:4%;right:4%;bottom:74%;height:0"><span class="fu-sch"><svg viewBox="-3.4 -4 7.4 4.2" style="width:1.15em">` + F("M-3 -.1Q-3 -.7 -2 -.7H1.4Q2.2 -.7 2.6 -1.9Q3.4 -1.8 3.3 -.8Q3 0 2.2 0H-2.6Z", "#d9c08a") + `<circle cx="-.5" cy="-1.9" r="1.5" fill="#b98a5a"/>` + L("M-.5 -1.9a.8 .8 0 1 0 .8 .8M-.5 -1.9a.4 .4 0 1 1 -.4 .4", "#8a5f38", .2)
      + pendel(2.8, -1.8, L("M2.7 -1.9L2.5 -3M3.1 -1.8L3.4 -2.9", "#d9c08a", .16) + F(kreis(2.5, -3.1, .16) + kreis(3.4, -3, .16), TINTE), 8, 1.4) + `</svg></span></span>`,
    css: `.fu-sch{position:absolute;bottom:0;left:0;animation:fu-sch 150s linear 3.4s infinite}.fu-sch>svg{display:block;height:auto;overflow:visible}@keyframes fu-sch{from{left:0}to{left:calc(100% - 1.15em)}}` },

  // Herbst: Eine Spinne seilt sich vom oberen Rand ab
  { n: "spinne", ort: "buehne", platz: "rand-o", zeit: "h", stufe: 2,
    bild: `<div class="fu-b" style="top:0;left:78%;width:22px"><svg viewBox="0 0 10 10"><g class="fu-spinne">` + L("M5 -200V4", "#8f9aa3", .16) + `<g class="fu-pendel" style="transform-box:view-box;transform-origin:5px 5px;--w:6deg;--d:.5s">` + L("M3.6 4.4L1.2 3M3.4 5.2L.6 5.2M3.6 6L1 7.6M4 6.6L2.6 9M6.4 4.4L8.8 3M6.6 5.2L9.4 5.2M6.4 6L9 7.6M6 6.6L7.4 9", TINTE, .32)
      + E(5, 6.2, 1.9, 2.3, TINTE) + `<circle cx="5" cy="3.9" r="1.2" fill="${TINTE}"/></g></g></svg></div>`,
    css: `.fu-spinne{animation:fu-spinne 11s ease-in-out 3s infinite alternate both}@keyframes fu-spinne{0%,8%{translate:0 -14px}80%,100%{translate:0 42px}}` },

  // Montag: Jemand hat die Kaffeetasse auf der Zeitung abgestellt
  { n: "kaffeering", ort: "buehne", platz: "rand-ul", tage: "1", stufe: 2,
    bild: `<div class="fu-b" style="left:max(12px,6%);bottom:14%;width:clamp(62px,9vw,96px);opacity:calc(.9 - var(--ip,0) * 3)"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="none" stroke="#9a6a3a" stroke-width="2.6" opacity=".2"/><path fill="none" stroke="#8a5a2c" stroke-width=".8" stroke-linecap="round" opacity=".34" d="M8.6 9.6A15.6 15.6 0 0 1 33.6 12M35.4 22A15.6 15.6 0 0 1 12 33.6"/>`
      + `<circle cx="20" cy="20" r="13.2" fill="#9a6a3a" opacity=".05"/><circle cx="36" cy="33" r="1.5" fill="#9a6a3a" opacity=".22"/><circle cx="33" cy="37" r=".8" fill="#9a6a3a" opacity=".2"/></svg></div>` },

  // Eselsohr oben rechts
  { n: "eselsohr", ort: "buehne", platz: "rand-or",
    bild: `<div class="fu-b" style="top:0;right:0;width:clamp(34px,5vw,54px)"><svg viewBox="0 0 20 20"><path fill="#f6f4ef" d="M0 0H20V20Z"/><path fill="#000" opacity=".1" d="M0 0L20 20L1.4 21.4Z"/><path class="fu-ohr" fill="#e9e5dc" stroke="#cfc9bd" stroke-width=".3" d="M0 0L20 20L.6 19.4Z"/></svg></div>`,
    css: `.fu-ohr{transform-box:fill-box;transform-origin:50% 50%;animation:fu-ohr 7s ease-in-out infinite}@keyframes fu-ohr{0%,80%,100%{scale:1}88%{scale:.94}}` },

  // Sommer: Eine Fliege landet auf der Zeitung, putzt sich und fliegt weiter
  { n: "fliege", ort: "buehne", platz: "rand-ur", zeit: "s", stufe: 2,
    bild: `<div class="fu-b" style="right:16%;bottom:24%;width:15px"><div class="fu-fliege"><svg viewBox="-5 -5 10 10">` + `<g class="fu-fl-fluegel">` + E(-2.4, -1, 2.6, 1.3, "#cfd8de", `opacity=".75" transform="rotate(28 -2.4 -1)"`) + E(2.4, -1, 2.6, 1.3, "#cfd8de", `opacity=".75" transform="rotate(-28 2.4 -1)"`) + `</g>`
      + L("M-1.2 .6L-3 2.4M1.2 .6L3 2.4M-1 -.6L-3.2 -1.6M1 -.6L3.2 -1.6", TINTE, .34) + E(0, .6, 1.5, 2.4, "#2f2b28") + `<circle cx="0" cy="-2.2" r="1.3" fill="#3d3934"/>` + F(kreis(-.7, -2.5, .5) + kreis(.7, -2.5, .5), "#8a2f2a")
      + `<g class="fu-fl-putz">` + L("M-.5 -3.3L-.2 -4.4M.5 -3.3L.2 -4.4", TINTE, .3) + `</g></svg></div></div>`,
    css: `.fu-fliege{animation:fu-fliege 19s linear 3s infinite both}@keyframes fu-fliege{0%{translate:40vw -50vh;rotate:200deg;opacity:0}3%{opacity:1}7%{translate:18vw -22vh;rotate:240deg}11%{translate:6vw -30vh;rotate:150deg}15%{translate:3vw -6vh;rotate:200deg}19%,40%{translate:0 0;rotate:25deg}44%,60%{translate:26px 14px;rotate:70deg}64%,80%{translate:8px 30px;rotate:-40deg}86%{translate:-10vw -16vh;rotate:-30deg}93%{translate:-34vw -8vh;rotate:-80deg;opacity:1}97%,100%{translate:-70vw -40vh;rotate:-60deg;opacity:0}}
.fu-fl-putz{transform-box:fill-box;transform-origin:50% 100%;animation:fu-fl-p .3s ease-in-out infinite alternate}@keyframes fu-fl-p{from{scale:1 1}to{scale:.3 1}}
.fu-fl-fluegel{transform-box:fill-box;transform-origin:50% 60%;animation:fu-fl-f 19s steps(1,end) 3s infinite both}@keyframes fu-fl-f{0%,18%{scale:1.5 1}19%,84%{scale:1 1}85%,100%{scale:1.5 1}}` },

  // Eingangsstempel mit dem Datum von heute
  { n: "eingangsstempel", ort: "buehne", platz: "rand-ur", stufe: 2,
    bild: `<div class="fu-b fu-stempel" style="right:max(14px,7%);bottom:16%;opacity:calc(.58 - var(--ip,0) * 3)"><b>Eingegangen</b><i>{{TAG}}</i><u>Mainz · Poststelle</u></div>`,
    css: `.fu-stempel{rotate:-9deg;padding:5px 9px 4px;border:2px solid #2c5aa8;border-radius:4px;outline:1px solid #2c5aa8;outline-offset:2px;color:#2c5aa8;font:700 11px/1.25 var(--sans);letter-spacing:.09em;text-transform:uppercase;text-align:center;mix-blend-mode:multiply}
.fu-stempel b,.fu-stempel i,.fu-stempel u{display:block;font-style:normal;text-decoration:none}.fu-stempel i{font:700 15px/1.2 var(--serif);letter-spacing:.04em}.fu-stempel u{font-weight:600;font-size:8.5px}` },

  // Eine Katze ist über die Zeitung gelaufen
  { n: "pfoten", ort: "buehne", platz: "rand-ul", stufe: 2,
    bild: `<div class="fu-b" style="left:max(8px,5%);bottom:9%;width:clamp(130px,22vw,220px);opacity:calc(.5 - var(--ip,0) * 3)"><svg viewBox="0 0 80 40">` + [[6, 32, 0], [15, 24, 1], [25, 27, 0], [34, 18, 1], [44, 21, 0], [53, 12, 1], [63, 15, 0], [72, 6, 1]].map(([x, y, s], i) =>
      `<g class="fu-pfote" style="animation-delay:${f(i * .45 - 9)}s" transform="translate(${x} ${y}) rotate(${52 + (s ? 8 : -8)})">` + E(0, 0, 1.7, 1.4, "#6b5a50") + F(kreis(-1.7, -2, .7) + kreis(-.6, -2.7, .72) + kreis(.6, -2.7, .72) + kreis(1.7, -2, .7), "#6b5a50") + `</g>`).join("") + `</svg></div>`,
    css: `.fu-pfote{opacity:0;animation:fu-pfote 9s linear infinite}@keyframes fu-pfote{0%{opacity:0}2%{opacity:1}55%{opacity:1}75%,100%{opacity:0}}` },

  // Büroklammer am oberen Rand
  { n: "bueroklammer", ort: "buehne", platz: "rand-ol",
    bild: `<div class="fu-b" style="top:-9px;left:max(18px,9%);width:17px;rotate:7deg"><svg viewBox="0 0 10 26"><path fill="none" stroke="#8f9aa3" stroke-width="1.1" stroke-linecap="round" d="M7.4 9V20.4a2.8 2.8 0 0 1 -5.6 0V5.6a2.1 2.1 0 0 1 4.2 0V18a.9 .9 0 0 1 -1.8 0V8.4"/><path fill="none" stroke="#fff" stroke-width=".3" stroke-linecap="round" opacity=".7" d="M7.1 10V20M2.2 6V19"/></svg></div>` },

  // Ein rotes Lesebändchen hängt vom oberen Rand
  { n: "lesezeichen", ort: "buehne", platz: "rand-o",
    bild: `<div class="fu-b" style="top:0;right:max(40px,13%);width:13px"><svg viewBox="0 0 8 44"><g class="fu-pendel" style="transform-box:view-box;transform-origin:4px 0px;--w:2.4deg;--d:2.7s"><path fill="#c8102e" d="M1 0H7V40L4 36.6L1 40Z"/><path fill="#000" opacity=".12" d="M5 0H7V40L5 37.8Z"/></g></svg></div>` },

  // Haftnotiz mit einem gekritzelten Gruß
  { n: "haftnotiz", ort: "buehne", platz: "rand-ur",
    bild: `<div class="fu-b" style="right:max(10px,5%);bottom:11%;width:clamp(44px,6vw,62px);rotate:5deg"><svg viewBox="0 0 30 30"><path fill="#000" opacity=".1" d="M2 4H30V28L26 31H2Z"/><path fill="#fbe57a" d="M0 0H28V24L24 28H0Z"/><path fill="#e6cc55" d="M28 24H24V28Z"/><path fill="#f0d862" d="M0 0H28V4H0Z"/>`
      + `<g class="fu-notiz" fill="none" stroke="#3d5a9a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="15" r="7"/><path d="M11.2 13v1.2M16.8 13v1.2M10.6 17.4q3.4 3.2 6.8 0"/></g></svg></div>`,
    css: `.fu-notiz{stroke-dasharray:70;animation:fu-notiz 9s ease-in-out 3.2s infinite both}@keyframes fu-notiz{0%{stroke-dashoffset:70}22%,100%{stroke-dashoffset:0}}` },

  // Der Domsgickel dreht sich auf der Turmspitze
  { n: "domsgickel", ort: "logo", platz: "logo-dom", wetter: "sbrn",
    bild: L("M64.2 2.2V-4", "#b88a1e", .5) + `<circle cx="64.2" cy="-1" r=".9" fill="#e3b23c"/>` + dreh("fu-gickel", 64.2, -4, F("M60.4 -4.2Q59.4 -7 61.4 -9Q61 -6.8 63 -6.4Q64 -9 66.2 -9L66 -10.2L67.2 -9.4L67.6 -10.6L68.4 -9Q69.4 -8.4 69.4 -7.2L67.8 -7.2Q68 -4.2 65.2 -4Z", "#e3b23c") + F("M68 -7.2l1.6 .4l-1.6 .5Z", "#d6243a") + F("M66.6 -5.4Q67.4 -4.4 66.6 -4Z", "#d6243a")),
    css: `.fu-gickel{animation:fu-gickel 10s ease-in-out infinite}@keyframes fu-gickel{0%,24%{scale:1 1}36%,60%{scale:-1 1}72%,100%{scale:1 1}}` },

  // Tauben auf den Domtürmen
  { n: "domtauben", ort: "logo", platz: "logo-dom", wetter: "sbr",
    bild: `<g transform="translate(38 12) scale(2.7)"><g class="fu-pick" style="--d:4.4s;--w:24deg">${taube(1)}</g></g><g class="fu-dt"><g transform="translate(88.4 35) scale(2.5)">${taube(-1)}</g></g>`,
    css: `.fu-dt{animation:fu-dt 12s ease-in-out infinite}@keyframes fu-dt{0%,60%,100%{translate:0 0}70%{translate:6px -9px}80%{translate:-3px -13px}90%{translate:2px -5px}}` },
];
