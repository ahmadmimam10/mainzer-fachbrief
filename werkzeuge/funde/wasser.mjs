// Fundstücke auf dem Rhein. Im Wasserbild liegt der Horizont (die Uferkante) bei y = 0, nach unten kommt das Wasser näher.
// Stücke mit Platz "wasser-*" werden um x = 0 gezeichnet (bis etwa 20 breit) und bekommen den linken oder rechten Platz.
import { f, am, dreh, fahrt, hinher, figur, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E } from "./hilfen.mjs";
import { moewe, pendel } from "./ufer-leute.mjs";

// innen: Wasserlinie bei y = 0. tiefe = wie weit vom Ufer (größer = näher am Betrachter).
const aufWasser = (innen, tiefe = 9, g = 1) => am(0, tiefe, g, innen);
const spiegel = (b, y = .9) => `<path fill="none" stroke="#fff" stroke-width=".4" stroke-linecap="round" opacity=".7" d="M${-b} ${y}h${2 * b}M${f(-b * .55)} ${f(y + .8)}h${f(b * 1.1)}"/>`;
const schaukel = (innen, d = 3.2, v = 0) => `<g class="fu-wasser" style="--d:${d}s;--v:${v}s">${innen}</g>`;
const treib = (innen, weit = 5, d = 30) => `<g class="fu-treib" style="--x:${weit}px;--d:${d}s">${innen}</g>`;
const TREIB = `.fu-treib{animation:fu-treib var(--d,30s) ease-in-out infinite alternate}@keyframes fu-treib{from{translate:calc(var(--x) * -1) 0}to{translate:var(--x) 0}}`;
const auf = (innen, { d = 4, v = 0, x = .6, h = -4, o = .9 } = {}) => `<g class="fu-auf" style="--d:${d}s;--v:${v}s;--x:${x}px;--h:${h}px;--o:${o}">${innen}</g>`;
// Nur der Teil über der Wasserlinie ist sichtbar (für alles, was auf- und abtaucht)
const ueberWasser = (id, innen) => `<clipPath id="fu-cp-${id}"><rect x="-30" y="-40" width="60" height="40"/></clipPath><g clip-path="url(#fu-cp-${id})">${innen}</g>`;
const ring = (x, kl, rx = 1.6) => `<ellipse class="${kl}" cx="${x}" cy="0" rx="${rx}" ry="${f(rx * .26)}" fill="none" stroke="#fff" stroke-width=".14"/>`;
const kopf = (x, y, haut, haar, r = .46) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${haut}"/><path fill="${haar}" d="M${f(x - r)} ${f(y - .05)}a${r} ${r} 0 0 1 ${f(2 * r)} 0Z"/>`;

export default [
  // Schwäne, Frachtschiff und Segelboot gibt es schon als Zeichnung (intro-feste.mjs)
  { n: "schwaene", ort: "fest", platz: "wasser-l", wetter: "sbr", dazu: ["schwaene"] },
  { n: "frachtschiff", ort: "fest", platz: ["wasser-l", "wasser-weg"], wetter: "sbrn", dazu: ["frachtschiff"] },
  { n: "segelboot", ort: "fest", platz: "wasser-l", zeit: "fs", dazu: ["segelboot"] },

  // Papierschiffchen, aus einer Zeitung gefaltet
  { n: "papierschiff", ort: "wasser", platz: "wasser-*", wetter: "sbr",
    bild: aufWasser(treib(spiegel(2.2) + schaukel(F("M-1.2 -.9L0 -3.1L1.2 -.9Z", "#fdfcf9", `stroke="#9aa6ad" stroke-width=".1" stroke-linejoin="round"`) + L("M0 -3.1V-.9M-.55 -1.6h.4M-.7 -1.25h.55M.2 -1.9h.3M.2 -1.5h.55", "#9aa6ad", .07)
      + F("M-2.9 -1L-1.6 .15H1.6L2.9 -1L1.3 -.75H-1.3Z", "#fdfcf9", `stroke="#9aa6ad" stroke-width=".1" stroke-linejoin="round"`) + F("M1.3 -.75L2.9 -1L1.6 .15Z", "#e6e1d8") + F(kreis(-1.9, -.5, .2), "#c8102e") + L("M-1.3 -.3h1.8M-1 -.02h1.4", "#9aa6ad", .07), 2.6), 6, 34), 8, 1.25), css: TREIB },

  // Eine riesige Gummiente treibt vorbei
  { n: "gummiente", ort: "wasser", platz: "wasser-*", stufe: 2,
    bild: aufWasser(treib(spiegel(3) + schaukel(F("M-2.4 -1.7L-3.4 -2.9L-1.7 -2.6Z", "#f4c542") + E(0, -1.3, 2.6, 1.55, "#f7d04a") + E(-.4, -1.2, 1.3, .7, "#e9b93a") + `<circle cx="1.5" cy="-3.2" r="1.3" fill="#f7d04a"/>`
      + F("M2.5 -3.5Q3.9 -3.5 3.9 -3Q3.4 -2.6 2.5 -2.75Z", "#f08a2c") + `<circle cx="1.9" cy="-3.55" r=".2" fill="${TINTE}"/><circle cx="1.95" cy="-3.6" r=".07" fill="#fff"/>` + E(-.6, -2.2, .7, .3, "#fff", `opacity=".4" transform="rotate(-20 -.6 -2.2)"`), 3.6)
      + L("M-3.2 0h6.4", "#fff", .3, `opacity=".8"`), 5, 40), 9, 1.2), css: TREIB },

  // Ein Fisch springt
  { n: "fischsprung", ort: "wasser", platz: "wasser-*", wetter: "sbr",
    bild: aufWasser(ring(-1.9, "fu-fi-r1") + ring(1.9, "fu-fi-r2") + ueberWasser("fisch", `<g class="fu-fi">` + F("M-1.1 0Q0 -.75 1.1 0Q0 .6 -1.1 0Z", "#9fb6c6") + F("M-1 0L-1.8 -.55V.5Z", "#7f9aad") + F("M-.2 -.36Q.2 -.9 .5 -.3Z", "#7f9aad") + `<circle cx=".65" cy="-.1" r=".1" fill="${TINTE}"/>` + L("M-.5 .1Q0 .35 .6 .15", "#e6eef3", .1) + `</g>`), 8, 1.3),
    css: `.fu-fi{animation:fu-fi 5.5s linear infinite}@keyframes fu-fi{0%,60%{translate:-1.9px 1.2px;rotate:-62deg}66%{translate:-1.2px -1.4px;rotate:-40deg}72%{translate:0 -2.5px;rotate:0deg}78%{translate:1.2px -1.4px;rotate:40deg}84%,100%{translate:1.9px 1.2px;rotate:62deg}}
.fu-fi-r1,.fu-fi-r2{transform-box:fill-box;transform-origin:50% 50%;animation:fu-fir 5.5s ease-out infinite}.fu-fi-r2{animation-delay:1.2s}@keyframes fu-fir{0%,60%{scale:.2;opacity:0}63%{opacity:.9}80%,100%{scale:1.5;opacity:0}}` },

  // Flaschenpost
  { n: "flaschenpost", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 2,
    bild: aufWasser(treib(spiegel(1.6, .7) + schaukel(`<g transform="rotate(-34)">` + F("M-.55 -2.4Q-.55 -2.9 -.2 -3.1V-3.9H.2V-3.1Q.55 -2.9 .55 -2.4V.6H-.55Z", "#9fd0b8", `opacity=".85"`) + F("M-.24 -4.3H.24V-3.8H-.24Z", "#a9764a") + F("M-.3 -2.2H.3V.1H-.3Z", "#f6efe1") + L("M-.3 -1.4H.3", "#c8102e", .12) + L("M-.38 -2.6V.3", "#fff", .08, `opacity=".7"`) + `</g>`, 2.4), 6, 44), 8.5, 1.2), css: TREIB },

  // Wasserschutzpolizei mit Blaulicht
  { n: "polizeiboot", ort: "wasser", platz: "wasser-weg", wetter: "sbrn",
    bild: fahrt(spiegel(4.5, 1) + L("M-5.4 .3h-3M-5.6 .9h-4.4M5.6 .2q.9 -.2 1.5 .5", "#fff", .26, `opacity=".85"`) + schaukel(F("M-5 -1.2H4.2L5.8 -.3L4.6 .5H-4.8Z", "#fdfcf9", `stroke="#8f9aa1" stroke-width=".12"`) + F("M-4.95 -.62H5.2L4.9 -.2H-4.9Z", "#2c5aa8") + F("M-1 -.62h.8l-.5 .42h-.8ZM.6 -.62h.8l-.5 .42h-.8Z", "#d7e04a")
      + F("M-2.6 -2.8H1.2L2.2 -1.2H-2.9Z", "#f3f1ea", `stroke="#8f9aa1" stroke-width=".1"`) + F("M-2.2 -2.4H-.9V-1.6H-2.3ZM-.6 -2.4H.9L1.4 -1.6H-.6Z", "#7f9fb8") + L("M-1.2 -2.8V-4.2", "#8f9aa1", .1) + F("M-1.2 -4.2l1 .25l-1 .3Z", "#2c5aa8")
      + `<path class="fu-blink" style="--d:.28s" fill="#3d7bff" d="M.1 -3.2h.6v.4H.1Z"/><circle class="fu-blink" style="--d:.28s" cx=".4" cy="-3" r=".8" fill="#6f9bff" opacity=".35"/>` + `<circle cx="-3.6" cy="-1.5" r=".3" fill="#f19a4a"/>`, 1.2), { von: 500, bis: 780, d: 21, v: -4, y: 10 }) },

  // Der Ruderachter zieht durch
  { n: "ruderachter", ort: "wasser", platz: "wasser-weg", zeit: "fsh",
    bild: fahrt(spiegel(7, .8) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const x = -5.4 + i * 1.5; return pendel(x, -.5, L(`M${x} -.5L${f(x - .3)} -1.7`, i % 2 ? "#fdfcf9" : "#c8102e", .62) + kopf(f(x - .36), -2.25, HAUT[i % 5], ["#4a3a2e", "#d2a95c", "#2a211c"][i % 3], .42), 13, .8)
        + pendel(x, -.7, L(`M${x} -.7L${f(x + .7)} .95`, "#8a5f38", .1) + F(`M${f(x + .56)} .8l.34 .56l.3 -.2l-.36 -.5Z`, "#c8102e"), 24, .8); }).join("")
      + F("M-8.6 -.6H8L9.6 -.2L8 .2H-8.6L-9.4 -.2Z", "#fdfcf9", `stroke="#8f9aa1" stroke-width=".1"`) + L("M-8.4 -.2H8.6", "#c8102e", .12) + kopf(-7.6, -1.5, HAUT[0], "#4a3a2e", .38) + L("M-7.6 -.6v-.5", "#2c5aa8", .5),
      { von: 500, bis: 780, d: 25, v: -7, y: 10 }) },

  // Stehpaddlerin
  { n: "stehpaddler", ort: "wasser", platz: "wasser-*", zeit: "fs",
    bild: aufWasser(treib(spiegel(3, .7) + schaukel(am(0, -.45, 1.05, figur({ mantel: "#f19a4a", hose: "#2f3542", kopf: "zopf", haar: "#6b4a2e", armV: [.95, -3.1], armH: [.6, -4.1], schatten: false }))
      + pendel(.7, -4, L("M.5 -5.4L1.7 .6", "#8a5f38", .14) + F("M1.5 .1L2 .2L2.1 1.3L1.5 1.2Z", "#2c5aa8"), 9, 1.2) + F("M-3.6 -.3Q0 -.85 3.9 -.36Q0 .22 -3.6 -.3Z", "#f6efe1", `stroke="#8f9aa1" stroke-width=".08"`) + L("M-2.6 -.34Q0 -.62 2.8 -.36", "#4f8fd0", .12), 2.8), 6, 24), 9), css: TREIB },

  // Tretboot in Schwanenform
  { n: "schwanentretboot", ort: "wasser", platz: "wasser-*", zeit: "fs", wetter: "s", stufe: 2,
    bild: aufWasser(treib(spiegel(4.2, .8) + schaukel(L("M3.2 -1.3C5 -1.7 5.3 -3.4 4.5 -4.6C4 -5.4 4.2 -6.2 5 -6.3", "#fdfdfd", 1.05, `stroke="#fdfdfd"`) + L("M3.2 -1.3C5 -1.7 5.3 -3.4 4.5 -4.6C4 -5.4 4.2 -6.2 5 -6.3", "#c9d3db", .08)
      + `<circle cx="5.25" cy="-6.3" r=".72" fill="#fdfdfd"/>` + F("M5.85 -6.5L7 -6.1L5.85 -5.9Z", "#e8862c") + `<circle cx="5.5" cy="-6.45" r=".1" fill="${TINTE}"/>`
      + kopf(-.9, -3, HAUT[0], "#d2a95c", .55) + L("M-.9 -2.4V-1.3", "#e9506b", .9) + kopf(1, -2.8, HAUT[1], "#2a211c", .55) + L("M1 -2.2V-1.3", "#4f8fd0", .9)
      + F("M-4.2 -1.5H3.6Q4.7 -1.2 4.4 -.1H-4.4Q-4.8 -.8 -4.2 -1.5Z", "#fdfdfd", `stroke="#b9c7d2" stroke-width=".1"`) + F("M-4.3 -1.5Q-5 -3.8 -2.4 -3.6Q-.9 -3.4 -1.1 -1.5Z", "#fdfdfd", `stroke="#b9c7d2" stroke-width=".1"`) + L("M-3.9 -2.1Q-3 -2.9 -1.6 -2.5M-3.6 -1.7Q-2.8 -2.2 -1.5 -1.9", "#c9d3db", .12), 3.4)
      + [0, 1, 2].map(i => `<circle class="fu-auf" style="--d:1.2s;--v:${-i * .4}s;--x:-1.2px;--h:-1.1px;--o:.9" cx="-4.7" cy="-.1" r=".2" fill="#fff"/>`).join(""), 5, 28), 10), css: TREIB },

  // Ein Biber schleppt einen Ast
  { n: "biber", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 2,
    bild: hinher(L("M-2.6 .2L-5.6 -.5M-2.6 .5L-5.8 1.2", "#fff", .16, `opacity=".8"`) + E(-1.7, -.12, 1.3, .36, "#6b4a32") + E(0, -.5, 1.15, .62, "#7a5a3c") + `<circle cx="-.5" cy="-1.02" r=".2" fill="#6b4a32"/><circle cx="1.02" cy="-.5" r=".16" fill="${TINTE}"/><circle cx=".42" cy="-.72" r=".08" fill="${TINTE}"/>`
      + L("M.7 -.36L3.4 -1.2", "#8a5f38", .2) + F("M3.3 -1.3q.5 -.6 1 -.2q-.4 .5 -1 .2ZM2.5 -1q.1 -.7 .7 -.7q.1 .5 -.7 .7Z", "#7fb65f") + L("M-1.2 0h2.6", "#fff", .2, `opacity=".8"`), { von: -7, bis: 7, d: 34, y: 8.5 }) },

  // Graureiher im flachen Wasser
  { n: "reiher", ort: "wasser", platz: "wasser-*", wetter: "sbr",
    bild: aufWasser(ring(.2, "fu-rh-ring", 1.4) + L("M0 0V-2.7M.5 0V-2.6", "#8a8f6a", .1) + E(.1, -3.5, 1.5, .8, "#aab6c0", `transform="rotate(-16 .1 -3.5)"`) + F("M-1.5 -3.2Q-.3 -4.3 1 -3.7Q.2 -2.9 -1.9 -2.6Z", "#7f8d99")
      + dreh("fu-rh-hals", 1.1, -3.9, L("M1.1 -3.9C2.2 -4.3 1.1 -5.3 1.6 -6.2", "#c3ccd4", .34) + E(1.75, -6.45, .46, .32, "#e3e8ec") + F("M2.1 -6.6L4 -6.3L2.1 -6.15Z", "#e8b23c") + L("M1.5 -6.7L.7 -6.5", TINTE, .12) + `<circle cx="1.9" cy="-6.5" r=".06" fill="${TINTE}"/>`), 2.6, 1.15),
    css: `.fu-rh-hals{animation:fu-rh 8s ease-in-out infinite}@keyframes fu-rh{0%,70%,88%,100%{rotate:0deg}76%{rotate:-8deg}79%,83%{rotate:72deg}}
.fu-rh-ring{transform-box:fill-box;transform-origin:50% 50%;animation:fu-rhr 3s ease-out infinite}@keyframes fu-rhr{from{scale:.3;opacity:.9}to{scale:1.2;opacity:0}}` },

  // Feuerlöschboot übt mit den Wasserwerfern
  { n: "loeschboot", ort: "wasser", platz: "wasser-*", stufe: 2,
    bild: aufWasser(spiegel(5.4, 1) + L("M3.4 -2Q7 -8.6 9.6 0", "#fff", .34, `class="fu-lb" opacity=".95"`) + L("M-.6 -3.8Q-4.4 -9.6 -8.4 0", "#fff", .3, `class="fu-lb" opacity=".95"`) + E(9.6, 0, 1, .28, "#fff", `opacity=".7"`) + E(-8.4, 0, 1, .28, "#fff", `opacity=".7"`)
      + schaukel(F("M-5.8 -1.3H4.6L6.2 -.3L5 .5H-5.4Z", "#c8102e", `stroke="#8e1a2a" stroke-width=".1"`) + F("M-5.7 -.7H5.6L5.3 -.4H-5.6Z", "#fdfcf9") + F("M-3.2 -3H1.4V-1.3H-3.2Z", "#f3f1ea", `stroke="#8f9aa1" stroke-width=".1"`) + F("M-2.8 -2.6H-1.6V-1.9H-2.8ZM-1.2 -2.6H0V-1.9H-1.2ZM.2 -2.6H1V-1.9H.2Z", "#7f9fb8")
        + F("M-2 -3.8H.4V-3H-2Z", "#c8102e") + L("M3.4 -1.3V-2M-.6 -3.8v-.1", "#5f564c", .3) + L("M-1.4 -3.8V-5", "#8f9aa1", .1) + `<circle class="fu-blink" style="--d:.4s" cx="-1.4" cy="-5.1" r=".22" fill="#3d7bff"/>`, 3.8), 10),
    css: `.fu-lb{stroke-dasharray:.8 .5;animation:fu-lb .45s linear infinite}@keyframes fu-lb{to{stroke-dashoffset:-1.3}}` },

  // Floß mit Zelt und Fahne
  { n: "floss", ort: "wasser", platz: "wasser-*", zeit: "s", stufe: 2,
    bild: aufWasser(treib(spiegel(4, .8) + schaukel(F("M-2.8 -.7L-1 -3.5L.8 -.7Z", "#f3ead2", `stroke="#b9ab8a" stroke-width=".1"`) + F("M-1.4 -.7L-1 -2.2L-.6 -.7Z", "#5a4a40") + L("M-3.6 -.7V-5.4", "#8a5f38", .14) + pendel(-3.6, -5.2, F("M-3.6 -5.4L-1.6 -4.9L-3.6 -4.3Z", "#d6243a"), 6, 1.1)
      + am(2.3, -.7, 1, figur({ mantel: "#3f7a52", hose: "#5a5248", kopf: "hut", hut: "#e6d2a2", haar: "#4a3a2e", armV: [1.1, -3.1], armH: [.9, -3.6], schatten: false })) + pendel(3.3, -3.4, L("M2.9 -5.6L4.2 1.4", "#8a5f38", .14), 5, 1.8)
      + F(kreis(-3.2, -.36, .4) + kreis(-2.4, -.36, .4) + kreis(-1.6, -.36, .4) + kreis(-.8, -.36, .4) + kreis(0, -.36, .4) + kreis(.8, -.36, .4) + kreis(1.6, -.36, .4) + kreis(2.4, -.36, .4) + kreis(3.2, -.36, .4), "#a9764a") + F("M-3.7 -.8H3.7v.24H-3.7Z", "#8a5f38")
      + F(kreis(-3.2, -.36, .16) + kreis(-1.6, -.36, .16) + kreis(0, -.36, .16) + kreis(1.6, -.36, .16) + kreis(3.2, -.36, .16), "#c9a67c"), 3.6), 6, 36), 9.5), css: TREIB },

  // Piraten auf dem Rhein
  { n: "piratenschiff", ort: "wasser", platz: "wasser-*", stufe: 3,
    bild: aufWasser(treib(spiegel(4.6, .9) + schaukel(L("M0 -1.5V-8.6M3.6 -1.6L6.6 -3", "#6b4a2c", .2) + pendel(0, -8.5, F("M0 -8.6L-1.8 -8.2L0 -7.7Z", TINTE), 7, .9) + F("M-.7 -7.2H.7V-6.8H-.7Z", "#6b4a2c")
      + F("M-2.6 -6.6Q0 -6 2.6 -6.6L3.1 -2.6Q0 -1.8 -3.1 -2.6Z", "#2f2b28") + `<circle cx="0" cy="-4.5" r=".8" fill="#fdfcf9"/>` + F(kreis(-.3, -4.6, .2) + kreis(.3, -4.6, .2), "#2f2b28") + L("M-.9 -3.5L.9 -3M.9 -3.5L-.9 -3", "#fdfcf9", .2)
      + F("M-5 -2.6H-3.2V-1.5H3.8L5.6 -2.2Q5 .2 3.4 .5H-3.2Q-4.6 .3 -5 -1.4Z", "#8a5f38") + F("M-5 -1.7H5.4L5.2 -1.2H-4.95Z", "#c8102e") + F(kreis(-2, -.5, .28) + kreis(0, -.5, .28) + kreis(2, -.5, .28), "#3d3934") + F("M-4.8 -3H-3.4v.4H-4.8Z", "#6b4a2c"), 3.4)
      + [0, 1].map(i => `<circle class="fu-auf" style="--d:5s;--v:${-i * .3}s;--x:3px;--h:-1.6px;--o:.8" cx="2.6" cy="-.6" r="${.4 + i * .2}" fill="#e6e1d8"/>`).join(""), 4, 40), 10), css: TREIB },

  // Ein Sehrohr taucht auf, schaut sich um und verschwindet wieder
  { n: "periskop", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 3,
    bild: aufWasser(ring(0, "fu-ps-ring", 1.5) + ueberWasser("peri", `<g class="fu-ps">` + F("M-.22 -3.2H.22V1H-.22Z", "#6f7a82") + F("M-.3 -1.6H.3v.2H-.3Z", "#5a646c") + `<g class="fu-ps-kopf">` + F("M-.3 -3.9H1V-3.1H-.3Z", "#6f7a82") + F(kreis(1, -3.5, .3), "#a9c9de") + F(kreis(1.08, -3.56, .1), "#fff") + `</g></g>`), 8, 1.2),
    css: `.fu-ps{animation:fu-ps 13s ease-in-out infinite}@keyframes fu-ps{0%,4%{translate:0 4.4px}14%,80%{translate:0 0}92%,100%{translate:0 4.4px}}
.fu-ps-kopf{transform-box:view-box;transform-origin:0px -3.5px;animation:fu-psk 13s steps(1,end) infinite}@keyframes fu-psk{0%,34%{scale:1 1}35%,56%{scale:-1 1}57%,100%{scale:1 1}}
.fu-ps-ring{transform-box:fill-box;transform-origin:50% 50%;animation:fu-psr 2.6s ease-out infinite}@keyframes fu-psr{from{scale:.3;opacity:.9}to{scale:1.3;opacity:0}}` },

  // Das Rheinungeheuer
  { n: "rheinungeheuer", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 3,
    bild: aufWasser(ring(3.2, "fu-ps-ring", 1.8) + ueberWasser("nessie", `<g class="fu-ru">` + F("M2.6 1Q2.4 -2.6 3.4 -4.2Q4 -5.4 5.2 -5.2Q6.3 -5 6.2 -4.2Q5.4 -3.9 4.8 -4.2Q4.3 -3.4 4.4 1Z", "#5f9f6a") + F("M3.2 -4.4L2.9 -5L3.5 -4.8ZM3.7 -5L3.6 -5.6L4.1 -5.2Z", "#3f7a52") + `<circle cx="5.1" cy="-4.75" r=".14" fill="${TINTE}"/>` + L("M5.5 -4.3q.4 .1 .6 -.1", "#3f7a52", .08)
      + F("M-1.6 1Q-1.4 -1.9 .2 -1.9Q1.8 -1.9 2 1Z", "#5f9f6a") + F("M-5 1Q-4.8 -1.3 -3.5 -1.3Q-2.2 -1.3 -2 1Z", "#5f9f6a") + F("M-7.2 1Q-6.9 -.3 -6.4 -1.4Q-6.2 -.2 -5.6 1Z", "#5f9f6a") + L("M-.6 -1.5Q.2 -1.75 1 -1.5M-4.1 -1Q-3.5 -1.2 -2.9 -1", "#7fbf88", .12) + `</g>`), 9, 1.1),
    css: `.fu-ru{animation:fu-ru 16s ease-in-out infinite}@keyframes fu-ru{0%,6%{translate:0 6.2px}22%,70%{translate:0 0}86%,100%{translate:0 6.2px}}
.fu-ps-ring{transform-box:fill-box;transform-origin:50% 50%;animation:fu-psr 2.6s ease-out infinite}@keyframes fu-psr{from{scale:.3;opacity:.9}to{scale:1.3;opacity:0}}` },

  // Eine Flosse zieht ihre Kreise
  { n: "flosse", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 3,
    bild: hinher(L("M-1.4 .1L-4 -.3M-1.4 .4L-4.4 .9", "#fff", .15, `opacity=".8"`) + F("M-1.2 0Q-.6 -2 1 -2.9Q.7 -1.4 1.5 0Z", "#6f7f8c") + F("M.3 -1.2Q.6 -2 1 -2.9Q.7 -1.4 1.5 0H.9Z", "#55636f") + L("M-1.6 0h3.6", "#fff", .22, `opacity=".85"`), { von: -8, bis: 8, d: 22, y: 9.5 }) },

  // 1966 schwamm wirklich ein weißer Wal den Rhein hinauf
  { n: "weisser-wal", ort: "wasser", platz: "wasser-*", wetter: "sbr", stufe: 3,
    bild: aufWasser(ring(.5, "fu-ps-ring", 3) + ueberWasser("wal", `<g class="fu-ww">` + F("M-5.4 1Q-3 -2.3 1.4 -2.2Q4.6 -2 5.6 1Z", "#fbfbf9", `stroke="#b9c7d2" stroke-width=".1"`) + `<circle cx="3.9" cy="-.55" r=".14" fill="${TINTE}"/>` + L("M4.6 -.1q.5 .3 .9 0", "#9fb0bb", .09) + L("M-3 -1Q-1 -1.9 1.4 -1.7", "#e3e8ec", .2)
        + [0, 1, 2, 3].map(i => `<circle class="fu-auf" style="--d:1.5s;--v:${-i * .37}s;--x:${(i - 1.5) * .9}px;--h:-3px;--o:1" cx="1.6" cy="-2.3" r=".22" fill="#fff"/>`).join("") + `</g>`
        + `<g class="fu-ww-fl">` + F("M-.3 1V-1.6Q-1.6 -2.2 -2.3 -3.4Q-.8 -3.3 0 -2.4Q.8 -3.3 2.3 -3.4Q1.6 -2.2 .3 -1.6V1Z", "#fbfbf9", `stroke="#b9c7d2" stroke-width=".1" transform="translate(-3.5 0)"`) + `</g>`), 10, 1.1),
    css: `.fu-ww{animation:fu-ww 15s ease-in-out infinite}@keyframes fu-ww{0%,4%{translate:0 3.4px}16%,52%{translate:0 0}62%,100%{translate:1.5px 3.6px}}
.fu-ww-fl{animation:fu-wwf 15s ease-in-out infinite}@keyframes fu-wwf{0%,60%{translate:0 4.6px}70%,76%{translate:0 0}86%,100%{translate:0 4.6px}}
.fu-ps-ring{transform-box:fill-box;transform-origin:50% 50%;animation:fu-psr 2.6s ease-out infinite}@keyframes fu-psr{from{scale:.3;opacity:.9}to{scale:1.3;opacity:0}}` },

  // Winter: Ein Pinguin auf der Eisscholle
  { n: "pinguin", ort: "wasser", platz: "wasser-*", zeit: "w", wetter: "n", stufe: 3,
    bild: aufWasser(treib(spiegel(3.6, .8) + schaukel(F("M-4.2 -.5L-3 -1.1L2.8 -1.2L4.4 -.5L3.2 .3H-3.4Z", "#fdfdfd", `stroke="#b9c7d2" stroke-width=".1"`) + F("M-4.2 -.5L4.4 -.5L3.2 .3H-3.4Z", "#dfe9f0")
      + `<g class="fu-huepf" style="--d:3.4s;--h:-.5px">` + E(0, -2.6, 1, 1.5, "#2f2b28") + E(.15, -2.4, .66, 1.15, "#fdfdfd") + `<circle cx=".1" cy="-4.2" r=".7" fill="#2f2b28"/>` + F("M.6 -4.3L1.5 -4.1L.6 -3.9Z", "#f19a4a") + `<circle cx=".4" cy="-4.35" r=".1" fill="#fff"/>`
        + F("M-.2 -1.1h.9v.22h-.9ZM-.9 -1.1h.6v.22h-.6Z", "#f19a4a") + pendel(-.8, -3.4, F("M-.8 -3.4Q-1.5 -2.6 -1.3 -1.6Q-.8 -2.2 -.6 -3Z", "#2f2b28"), 14, .28) + pendel(.9, -3.4, F("M.9 -3.4Q1.6 -2.6 1.4 -1.6Q.9 -2.2 .7 -3Z", "#2f2b28"), 14, .28, -.14) + `</g>`
      + F("M-2.8 -1.3Q-2.2 -1.7 -1.6 -1.3Q-2.2 -1 -2.8 -1.3Z", "#9fb6c6") + F("M-2.8 -1.3L-3.2 -1.6V-1Z", "#7f9aad"), 3.8), 5, 38), 9.5), css: TREIB },

  // Entenmutter mit Küken auf dem Wasser
  { n: "entenschwimmen", ort: "wasser", platz: "wasser-*", zeit: "fs", wetter: "sbr",
    bild: hinher([[3, 1.25, "#8a6a48", "#c9b08a", 0], [.9, .62, "#f4d35a", "#fbe9a0", .5], [-.3, .62, "#f4d35a", "#fbe9a0", 1], [-1.5, .62, "#f4d35a", "#fbe9a0", 1.5], [-2.9, .62, "#f4d35a", "#fbe9a0", .8]].map(([x, g, fa, ba, v]) =>
      am(x, 0, g, `<g class="fu-wasser" style="--d:1.6s;--v:${-v}s">` + F("M-.95 -.1Q-1.1 -.9 0 -.95Q.95 -.9 .95 -.1Z", fa) + F("M-.8 -.5L-1.5 -.9L-.9 -.2Z", fa) + E(-.05, -.42, .52, .24, ba) + `<circle cx=".8" cy="-1.02" r=".4" fill="${fa}"/>` + F("M1.12 -1.1L1.66 -.96L1.12 -.84Z", "#e8a23c") + `<circle cx=".92" cy="-1.08" r=".06" fill="${TINTE}"/></g>`
        + L("M-1 0L-2 -.3M-1 .15L-2.1 .5", "#fff", .12, `opacity=".8"`) + L("M-.9 .05h1.9", "#fff", .16, `opacity=".8"`))).join(""), { von: -6, bis: 6, d: 44, y: 7.5 }) },

  // Drachenboot mit Trommler
  { n: "drachenboot", ort: "wasser", platz: "wasser-weg", zeit: "s", stufe: 2,
    bild: fahrt(spiegel(8, .9) + [0, 1, 2, 3, 4, 5].map(i => { const x = -5 + i * 1.7; return pendel(x, -.7, L(`M${x} -.7V-1.9`, BUNT[i], .7) + kopf(x, -2.5, HAUT[(i + 1) % 5], ["#2a211c", "#6b4a2e", "#d2a95c"][i % 3], .44), 9, .5) + pendel(x + .3, -1.6, L(`M${f(x + .3)} -1.6L${f(x + 1)} .7`, "#8a5f38", .12) + F(`M${f(x + .86)} .5l.3 .7l.34 -.14l-.3 -.66Z`, "#f4c542"), 20, .5); }).join("")
      + F("M-8.6 -1.1H7.6L8.6 -.1L7.8 .4H-8.2Q-9 -.2 -8.6 -1.1Z", "#c8102e", `stroke="#8e1a2a" stroke-width=".1"`) + L("M-8 -.5q.7 .5 1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0t1.4 0", "#f4c542", .12)
      + F("M7.4 -1.1Q8.4 -3 9.8 -3.2Q11.2 -3.2 11.2 -2.4L9.9 -2L11 -1.6Q10 -.9 8.6 -.9Z", "#3f9a5f") + F("M9 -3.1L8.9 -3.9L9.6 -3.2Z", "#f4c542") + `<circle cx="9.9" cy="-2.7" r=".15" fill="#fff"/>` + L("M10.9 -1.9l.7 .2", "#e9506b", .12)
      + F("M-8.6 -1.1Q-9.8 -1.8 -9.8 -3.2Q-9 -2.6 -8.4 -1.6Z", "#3f9a5f") + `<g class="fu-wipp" style="--d:.25s;--h:-.12px">` + kopf(6.3, -2.7, HAUT[0], "#2a211c", .44) + L("M6.3 -2.1V-1.2", "#f4c542", .7) + `</g>` + E(7.2, -1.5, .5, .45, "#f6efe1", `stroke="#8a5f38" stroke-width=".12"`),
      { von: 500, bis: 780, d: 27, v: -9, y: 11 }) },

  // Auf der Boje sitzt eine Möwe
  { n: "boje", ort: "wasser", platz: "wasser-*", wetter: "sbrn",
    bild: aufWasser(ring(0, "fu-ps-ring", 1.8) + dreh("fu-pendel", 0, 0, F("M-1.2 0L-.5 -3.3H.5L1.2 0Z", "#d6243a") + F("M-.86 -1.6H.86L.98 -1H-.98Z", "#fdfcf9") + E(0, 0, 1.25, .3, "#b01f33") + `<g transform="translate(-.1 -3.3) scale(1.25)">` + moewe(1) + `</g>`, "--w:6deg;--d:2.2s"), 8, 1.25),
    css: `.fu-ps-ring{transform-box:fill-box;transform-origin:50% 50%;animation:fu-psr 2.6s ease-out infinite}@keyframes fu-psr{from{scale:.3;opacity:.9}to{scale:1.3;opacity:0}}` },

  // Zu zweit im Kanu
  { n: "kanu", ort: "wasser", platz: "wasser-weg", zeit: "fsh",
    bild: fahrt(spiegel(4.6, .8) + schaukel([[-1.8, "#f4c542", 0], [1.6, "#4f8fd0", 3]].map(([x, c, h], i) => L(`M${x} -.6V-1.9`, c, .8) + kopf(x, -2.6, HAUT[h], i ? "#2a211c" : "#8a4a2e", .5)
        + dreh("fu-kanu-p", x + .2, -1.7, L(`M${f(x - .5)} -3L${f(x + 1)} .8`, "#8a5f38", .13) + F(`M${f(x + .82)} .5l.36 .9l.36 -.14l-.36 -.86Z`, "#8a5f38"), `animation-delay:${-i * .8}s`)).join("")
      + F("M-5.4 -1.1Q0 -.5 5.4 -1.1Q4.4 .5 0 .5Q-4.4 .5 -5.4 -1.1Z", "#3f9a5f", `stroke="#2f7a4a" stroke-width=".1"`) + L("M-4.6 -.5Q0 0 4.6 -.5", "#f6efe1", .12), 2.6), { von: 500, bis: 780, d: 38, v: -12, y: 9 }),
    css: `.fu-kanu-p{animation:fu-kanu 1.6s ease-in-out infinite}@keyframes fu-kanu{0%,100%{rotate:16deg}50%{rotate:-22deg}}` },

  // Wasserski hinter dem Motorboot
  { n: "wasserski", ort: "wasser", platz: "wasser-weg", zeit: "s", wetter: "s", stufe: 2,
    bild: fahrt(L("M-2.6 -1.2L-11 -2.6", "#5f564c", .07) + `<g class="fu-wasser" style="--d:.7s">` + am(-12, -.2, 1, `<g transform="rotate(-13)">` + figur({ mantel: "#e9506b", hose: "#2f3542", kopf: "lang", haar: "#d2a95c", armV: [1.25, -3], armH: [1.1, -2.9], schatten: false }) + `</g>`) + L("M-13.4 -.1L-10.2 -.5", "#f4c542", .22) + `</g>`
      + [0, 1, 2, 3].map(i => `<circle class="fu-auf" style="--d:.8s;--v:${-i * .2}s;--x:-2.4px;--h:-1.4px;--o:.9" cx="-13.2" cy="-.2" r="${f(.3 + i * .08)}" fill="#fff"/>`).join("")
      + L("M-3.4 .3h-5M-3.2 .9h-7", "#fff", .26, `opacity=".85"`) + `<g class="fu-wasser" style="--d:.9s">` + F("M-3.2 -1.2H2L3.8 -.5L2.6 .4H-3Z", "#fdfcf9", `stroke="#8f9aa1" stroke-width=".1"`) + F("M-3.1 -.6H3.5L3.1 -.2H-3.05Z", "#d6243a") + F("M-.6 -2H.9L1.6 -1.2H-.6Z", "#a9c9de") + kopf(-1.3, -2, HAUT[1], "#2a211c", .46) + F("M-3.7 -1.4h.6v1.2h-.6Z", "#3d3934") + `</g>`,
      { von: 480, bis: 800, d: 14, v: -3, y: 11 }) },
];
