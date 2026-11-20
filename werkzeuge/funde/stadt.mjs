// Fundstücke auf den Dächern der Stadt, in der fernen Stadt und auf den Hügeln. Koordinaten wie im Stadtband
// (1280 × 60, Horizont y = 60). Dächer, die auch auf dem Handy zu sehen sind:
//   links   Flachdächer 530…536 (y 50) und 536…541 (y 48) · Kuppel der Christuskirche 541…559 (Laterne bis y 27,5, Mitte x 550)
//           Flachdach 559…564 (y 48) · Giebel 564…573 (Spitze 568,5 / 49)
//   rechts  Kirchturm 699…706 (Spitze 702,5 / 27, Schallfenster bei y 41,5) · Giebel 706…721 (Spitze 713,5 / 42)
//           Flachdach 721…728 (y 52) · Walmdach 728…740 (oben flach 730,6…737,4 bei y 47) · Giebel 740…748 (Spitze 744 / 44)
//           Flachdach 748…758 (y 53)
// Ferner Hügel rechts (x 741…756): y ≈ 35; naher Hügel dort: y ≈ 43 (schaut über dem Flachdach 748…758 hervor).
import { f, am, dreh, hinher, figur, vogel, huegelFern, huegelNah, TINTE, BUNT, HAUT, kreis, rechteck, L, F, E } from "./hilfen.mjs";
import { katze, pendel } from "./ufer-leute.mjs";

const auf = (innen, { d = 4, v = 0, x = .6, h = -4, o = .9 } = {}) => `<g class="fu-auf" style="--d:${d}s;--v:${v}s;--x:${x}px;--h:${h}px;--o:${o}">${innen}</g>`;
const kraehe = s => vogel({ s, farbe: "#2f2b28", bauch: "#45403b", schnabel: "#6b6156" });
const schornstein = (x, y) => F(rechteck(x, y - 2.2, 1.2, 2.2), "#a8705a") + F(rechteck(x - .15, y - 2.5, 1.5, .34), "#8a5a48");
// Steigung des fernen Hügels zwischen zwei Stellen (für alles, was den Kamm entlanggeht)
const hang = (y, x1, x2, innen) => `<g transform="translate(${x1} ${f(y(x1))}) rotate(${f(Math.atan2(y(x2) - y(x1), x2 - x1) * 180 / Math.PI)})">${innen}</g>`;

export default [
  // Eine Katze streift übers Dach
  { n: "dachkatze", ort: "stadt", platz: "dach-r2", wetter: "sbn",
    bild: hinher(am(0, 0, .62, katze({ farbe: "#d98a3d", auge: "#3d3934" })), { von: 731.7, bis: 736.3, d: 20, y: 47 }) },

  // Der Schornsteinfeger bringt Glück
  { n: "schornsteinfeger", ort: "stadt", platz: "dach-l2", wetter: "sbn",
    bild: schornstein(562.2, 48) + [0, 1, 2].map(i => `<circle class="fu-auf" style="--d:3s;--v:${-i}s;--x:1.4px;--h:-3.4px;--o:.55" cx="562.8" cy="45.3" r="${f(.34 + i * .14)}" fill="#3d3934"/>`).join("")
      + am(560.4, 48, .6, figur({ mantel: "#2f2b28", hose: "#2f2b28", kopf: "hut", hut: "#2f2b28", haar: "#2f2b28", armV: [1.5, -4.6], klV: "fu-sf-arm", inHand: L("M1.5 -4.6L3.9 -4.9V-3", "#5f564c", .12) + F(kreis(3.9, -2.9, .5), "#2f2b28"),
        hinten: L("M-.9 -4.6L.2 -.4M-.2 -4.9L.9 -.7M-.75 -3.8l.7 -.3M-.5 -2.8l.7 -.3M-.25 -1.8l.7 -.3", "#b98a5a", .14) })),
    css: `.fu-sf-arm{animation:fu-sf 1.3s ease-in-out infinite alternate}@keyframes fu-sf{from{rotate:-6deg}to{rotate:14deg}}` },

  // Storchennest auf dem Giebel
  { n: "storchennest", ort: "stadt", platz: "dach-r3", zeit: "fs",
    bild: E(744, 43.7, 2, .62, "#8a6a48") + L("M742.1 43.5l.9 .5M743.4 44.1l1.2 -.5M745 44.1l.9 -.6M742.6 43.2h2.8", "#6b4a2c", .12)
      + `<circle class="fu-wipp" style="--d:.7s;--h:-.16px" cx="745" cy="43.1" r=".34" fill="#d9d4cc"/>` + F("M745.3 43L745.8 43.1L745.3 43.2Z", "#5f564c")
      + L("M743.3 43.3V41.3M743.8 43.3V41.3", "#d6243a", .1) + E(743.5, 40.7, 1.35, .72, "#fdfdfd", `transform="rotate(-14 743.5 40.7)"`) + F("M742.2 40.6Q742.6 41.5 743.9 41.2Q743 40.4 742.2 40.6Z", "#2f2b28") + L("M744.5 40.4Q745.2 39.6 744.9 38.7", "#fdfdfd", .36)
      + `<circle cx="745" cy="38.5" r=".36" fill="#fdfdfd"/><circle cx="745.1" cy="38.44" r=".06" fill="${TINTE}"/>` + F("M745.3 38.5L747.2 38.75L745.3 38.74Z", "#d6243a") + dreh("fu-sn-schnabel", 745.3, 38.5, F("M745.3 38.3L747.2 38.6L745.3 38.56Z", "#d6243a")),
    css: `.fu-sn-schnabel{animation:fu-sn 2.6s steps(2,end) infinite}@keyframes fu-sn{0%,50%{rotate:0deg}55%,60%,65%,70%,75%{rotate:-14deg}57%,62%,67%,72%,80%,100%{rotate:0deg}}` },

  // Wäsche trocknet auf dem Dach
  { n: "waescheleine", ort: "stadt", platz: "dach-l1", zeit: "fs", wetter: "s",
    bild: L("M531 50V46.4M540.4 48V45", "#857d70", .16) + L("M531 46.6Q535.7 47.9 540.4 45.2", "#6b6156", .07)
      + [[532.2, 46.95, "#fdfcf9", "M-.6 0H.6L1 .5L.7 .8L.55 .6V1.7H-.55V.6L-.7 .8L-1 .5Z"], [534, 47.25, "#d6243a", "M-.2 0H.2V.9L.5 1.1V1.3H-.2Z"], [534.9, 47.3, "#d6243a", "M-.2 0H.2V.9L.5 1.1V1.3H-.2Z"], [536.6, 47.2, "#6fb0e6", "M-.8 0H.8V1.6H-.8Z"], [538.6, 46.6, "#f4c542", "M-.6 0H.6L1 .5L.7 .8L.55 .6V1.7H-.55V.6L-.7 .8L-1 .5Z"]]
        .map(([x, y, c, d], i) => `<g transform="translate(${x} ${y})">` + pendel(0, 0, F(d, c, `stroke="#000" stroke-opacity=".12" stroke-width=".05"`), 9, 1.3 + i * .17, -i * .4) + `</g>`).join("") },

  // Krähen auf dem Flachdach
  { n: "kraehen", ort: "stadt", platz: "dach-r2", zeit: "hw", wetter: "sbrn",
    bild: am(731.6, 47, 1.05, `<g class="fu-pick" style="--d:3.8s">${kraehe(1)}</g>`) + am(734.2, 47, 1.15, kraehe(-1)) + am(736.6, 47, 1, kraehe(-1), "fu-huepf", "--d:3.2s;--h:-.6px;--x:-.4px") },

  // Dachterrasse mit Sonnenschirm
  { n: "dachterrasse", ort: "stadt", platz: "dach-r2", zeit: "s", wetter: "s",
    bild: L("M726.2 52V47.2", "#857d70", .12) + F("M723.6 47.7Q726.2 45 728.8 47.7Z", "#f4c542") + F("M725.4 47.7Q726.2 45 727 47.7Z", "#fdfcf9") + L("M721.6 50.4L723.9 52M722.6 52L724 50.9", "#8a5f38", .12) + L("M721.7 50.5L723.2 51.4H724.6", "#e9506b", .4)
      + `<circle cx="721.7" cy="49.9" r=".42" fill="${HAUT[0]}"/>` + F("M721.3 49.8a.42 .42 0 0 1 .84 0Z", "#6b4a2e") + dreh("fu-pendel", 724.6, 51.4, L("M724.6 51.4l.3 -.5", HAUT[0], .22), "--w:14deg;--d:.6s")
      + F("M727.3 51.2h.9l-.15 .8h-.6Z", "#b0483c") + F(kreis(727.75, 50.7, .5) + kreis(727.35, 50.95, .36) + kreis(728.2, 50.9, .36), "#6fa55f") },

  // Die Glocken läuten
  { n: "glocken", ort: "stadt", platz: "dach-t", wetter: "sbrn",
    bild: dreh("fu-pendel", 702.5, 40.7, F("M702.2 40.8Q702.2 41.9 701.95 42.2H703.05Q702.8 41.9 702.8 40.8Z", "#e3b23c") + `<circle cx="702.5" cy="42.3" r=".12" fill="#8a6a2a"/>`, "--w:22deg;--d:.5s")
      + [2, 3.2, 4.4].map((r, i) => `<path class="fu-gl" style="animation-delay:${-i * .5}s" fill="none" stroke="#fff" stroke-width=".16" stroke-linecap="round" d="M${f(702.5 - r)} ${f(41.5 - r * .5)}A${r} ${r} 0 0 0 ${f(702.5 - r)} ${f(41.5 + r * .5)}M${f(702.5 + r)} ${f(41.5 - r * .5)}A${r} ${r} 0 0 1 ${f(702.5 + r)} ${f(41.5 + r * .5)}"/>`).join(""),
    css: `.fu-gl{animation:fu-gl 1.5s ease-out infinite}@keyframes fu-gl{0%{opacity:0}30%{opacity:.9}100%{opacity:0}}` },

  // Der goldene Wetterhahn dreht sich im Wind
  { n: "wetterhahn", ort: "stadt", platz: "dach-t", wetter: "sbrn",
    bild: L("M702.5 27V23.9", "#8a6a2a", .12) + `<circle cx="702.5" cy="26.2" r=".22" fill="#e3b23c"/>` + L("M701.3 25.5H703.7M702.5 25.5", "#8a6a2a", .09)
      + dreh("fu-wh", 702.5, 24, F("M701.3 23.9Q701 23 701.7 22.3Q701.5 23.1 702.2 23.2Q702.6 22.3 703.3 22.3L703.2 21.9L703.6 22.2L703.7 21.8L703.95 22.3Q704.3 22.5 704.3 22.9L703.8 22.9Q703.9 23.9 702.9 23.95Z", "#e3b23c") + F("M703.9 22.9l.5 .12l-.5 .14Z", "#d6243a")),
    css: `.fu-wh{animation:fu-wh 9s ease-in-out infinite}@keyframes fu-wh{0%,22%{scale:1 1}34%,58%{scale:-1 1}70%,100%{scale:1 1}}` },

  // An der Kuppel wird gebaut
  { n: "geruest", ort: "stadt", platz: "dach-kuppel",
    bild: F(rechteck(541.8, 35.4, 6.4, 9.6), "#7fb08a", `opacity=".22"`) + L("M541.8 45V35.4M543.9 45V35.4M546.1 45V35.4M548.2 45V35.4M541.8 37.6H548.2M541.8 40H548.2M541.8 42.4H548.2M541.8 42.4L543.9 40L546.1 42.4L548.2 40M541.8 37.6L543.9 35.4", "#8f9aa3", .13)
      + F(rechteck(541.6, 37.5, 6.8, .22) + rechteck(541.6, 39.9, 6.8, .22) + rechteck(541.6, 42.3, 6.8, .22), "#b98a5a")
      + am(545, 37.5, .42, figur({ mantel: "#5a6a7a", kopf: "helm", hut: "#f4c542", armV: [1.4, -3.9], klV: "fu-ger-arm", inHand: L("M1.4 -3.9L1.9 -4.9", "#6b4a2c", .22) + F("M1.5 -5.3h.9v.5h-.9Z", "#5f564c"), schatten: false }))
      + am(543, 42.3, .42, figur({ s: -1, mantel: "#f19a4a", kopf: "helm", hut: "#fdfcf9", haut: HAUT[1], schatten: false })),
    css: `.fu-ger-arm{animation:fu-ger .45s ease-in infinite alternate}@keyframes fu-ger{from{rotate:-24deg}to{rotate:12deg}}` },

  // Eine Eule sitzt auf dem Giebel und blinzelt
  { n: "eule", ort: "stadt", platz: "dach-l2", zeit: "hw", wetter: "sbrn", stufe: 2,
    bild: `<g class="fu-eule">` + E(568.5, 47.9, .85, 1.12, "#8a6a48") + E(568.5, 48.2, .5, .7, "#c9a67c") + F("M567.75 47L567.8 46.3L568.2 46.85ZM569.25 47L569.2 46.3L568.8 46.85Z", "#6b4a32") + L("M568.2 49V49.2M568.8 49V49.2", "#e8a23c", .1)
      + `<g class="fu-eule-auge">` + F(kreis(568.15, 47.4, .3) + kreis(568.85, 47.4, .3), "#fdf6d8") + F(kreis(568.17, 47.42, .13) + kreis(568.87, 47.42, .13), TINTE) + `</g>` + F("M568.5 47.6l-.12 .3h.24Z", "#e8a23c") + `</g>`,
    css: `.fu-eule{animation:fu-eule 7s ease-in-out infinite}@keyframes fu-eule{0%,40%,100%{translate:0 0}48%,60%{translate:-.14px 0}70%,84%{translate:.14px 0}}
.fu-eule-auge{transform-box:fill-box;transform-origin:50% 50%;animation:fu-eule-a 4.2s linear infinite}@keyframes fu-eule-a{0%,90%,100%{scale:1 1}94%{scale:1 .08}}` },

  // Winter: Der Schornstein raucht
  { n: "schornsteinrauch", ort: "stadt", platz: "dach-l1", zeit: "w", wetter: "sbn",
    bild: schornstein(538, 48) + [0, 1, 2, 3].map(i => `<circle class="fu-auf" style="--d:5.2s;--v:${-i * 1.3}s;--x:${f(2 + i * .5)}px;--h:-8px;--o:.75" cx="538.6" cy="45.2" r="${f(.5 + i * .18)}" fill="#fff"/>`).join("") },

  // Die Stadtfahne weht auf der Kuppel
  { n: "kuppelfahne", ort: "stadt", platz: "dach-kuppel", wetter: "sbr",
    bild: L("M550 27.5V22.8", "#8a8276", .12) + `<circle cx="550" cy="22.7" r=".17" fill="#e3b23c"/><g class="fu-kf">` + F("M550.1 23Q551.3 22.5 552.5 23T554.9 23V25Q553.7 25.5 552.5 25T550.1 25Z", "#d6243a") + F("M550.1 24Q551.3 23.5 552.5 24T554.9 24V25Q553.7 25.5 552.5 25T550.1 25Z", "#fdfcf9")
      + F(kreis(552.1, 23.95, .22) + kreis(552.9, 23.95, .22), "#fdfcf9") + F(kreis(552.1, 23.95, .1) + kreis(552.9, 23.95, .1), "#d6243a") + `</g>`,
    css: `.fu-kf{transform-box:fill-box;transform-origin:0 50%;animation:fu-kf 1.5s ease-in-out infinite alternate}@keyframes fu-kf{from{transform:skewY(-6deg)}to{transform:skewY(6deg) scaleX(.93)}}` },

  // Stadtimker auf dem Dach
  { n: "stadtimker", ort: "stadt", platz: "dach-l1", zeit: "fs", stufe: 2,
    bild: `<g transform="translate(-218.4 -3)">` + [[749.2, "#f4c542"], [750.9, "#6fb0e6"], [752.6, "#fdfcf9"]].map(([x, c]) => F(rechteck(x, 51.5, 1.3, 1.5), c, `stroke="#000" stroke-opacity=".15" stroke-width=".06"`) + F(rechteck(x - .1, 51.3, 1.5, .26), "#8a5f38") + F(rechteck(x + .4, 52.6, .5, .14), TINTE)).join("")
      + am(755.6, 53, .6, figur({ s: -1, mantel: "#fdfcf9", hose: "#f1ede4", kopf: "hut", hut: "#f1ede4", haar: "#f1ede4", armV: [-1.3, -3], inHand: F("M-1.9 -3.3h.7v.8h-.7Z", "#8f9aa3") + L("M-1.9 -3.1l-.4 -.3", "#8f9aa3", .16) }))
      + [0, 1].map(i => `<circle class="fu-auf" style="--d:2.4s;--v:${-i * 1.2}s;--x:-1.2px;--h:-1.6px;--o:.6" cx="754" cy="51" r=".3" fill="#fff"/>`).join("")
      + [[750, 50.6, .9, 1.7, 0], [751.6, 50.2, 1.2, 2.3, -.6], [753, 50.7, .8, 1.4, -.3], [751, 49.8, 1.4, 2.9, -1.1]].map(([x, y, r, d, v]) => dreh("fu-dreh", x, y, `<circle cx="${f(x + r)}" cy="${y}" r=".13" fill="#3d3934"/><circle cx="${f(x + r)}" cy="${y}" r=".07" fill="#f4c542"/>`, `--d:${d}s;--v:${v}s`)).join("") + `</g>` },

  // ---- Hügel und ferne Stadt ----
  // Windräder auf dem fernen Hügel
  { n: "windraeder", ort: "ferne", platz: "huegel-r", wetter: "sbrn",
    bild: [[741.6, 8.6, 5.2, 0], [747.6, 10.6, 6.6, -1.4], [753.9, 7.8, 4.6, -3]].map(([x, h, d, v]) => { const y0 = huegelFern(x) + .3, y = y0 - h; return L(`M${x} ${f(y0)}V${f(y)}`, "#b1b6b0", .26)
      + dreh("fu-dreh", x, y, [90, 210, 330].map(w => { const a = w * Math.PI / 180; return `M${x} ${f(y)}L${f(x + Math.cos(a) * 3.3)} ${f(y - Math.sin(a) * 3.3)}`; }).map(d => L(d, "#b1b6b0", .22)).join(""), `--d:${d}s;--v:${v}s`) + `<circle cx="${x}" cy="${f(y)}" r=".22" fill="#9aa09a"/>`; }).join("") },

  // Sendemast mit Warnlicht
  { n: "sendemast", ort: "ferne", platz: "huegel-r", wetter: "sbrn",
    bild: (() => { const x = 750.4, y0 = huegelFern(x) + .3; let d = ""; for (let i = 0; i < 6; i++) d += `M${f(x - .5 + i * .07)} ${f(y0 - i * 1.9)}L${f(x + .5 - (i + 1) * .07)} ${f(y0 - (i + 1) * 1.9)}M${f(x + .5 - i * .07)} ${f(y0 - i * 1.9)}L${f(x - .5 + (i + 1) * .07)} ${f(y0 - (i + 1) * 1.9)}`;
      return L(`M${x - .5} ${f(y0)}L${x - .08} ${f(y0 - 11.4)}M${x + .5} ${f(y0)}L${x + .08} ${f(y0 - 11.4)}`, "#b5aaa0", .14) + L(d, "#b5aaa0", .08) + L(`M${x} ${f(y0 - 11.4)}V${f(y0 - 13.6)}`, "#d98a8a", .14)
        + `<circle class="fu-blink" style="--d:1.1s" cx="${x}" cy="${f(y0 - 13.8)}" r=".7" fill="#e8463c" opacity=".3"/><circle class="fu-blink" style="--d:1.1s" cx="${x}" cy="${f(y0 - 13.8)}" r=".26" fill="#e8463c"/>`; })() },

  // Ein Hirsch auf der Hügelkuppe
  { n: "hirsch", ort: "ferne", platz: "huegel-r", zeit: "hw", wetter: "sbn", stufe: 2,
    bild: am(748, huegelFern(748) + .2, .9, L("M-1 -1.3V0M-.6 -1.3V0M.7 -1.3V0M1.05 -1.3V0", "#7d8a78", .18) + E(0, -1.6, 1.3, .55, "#7d8a78") + F("M-1.2 -1.8L-1.5 -1.5L-1.2 -1.4Z", "#7d8a78")
      + dreh("fu-hirsch", 1, -1.8, L("M1 -1.8L1.5 -2.9", "#7d8a78", .34) + E(1.75, -3.05, .42, .26, "#7d8a78", `transform="rotate(14 1.75 -3.05)"`) + L("M1.5 -3.2L1.2 -4.2M1.3 -3.8L.9 -3.9M1.25 -4L1.5 -4.4M1.7 -3.25L1.9 -4.2M1.85 -3.8L2.25 -3.95M1.9 -4.1L1.7 -4.5", "#7d8a78", .1))),
    css: `.fu-hirsch{animation:fu-hirsch 9s ease-in-out infinite}@keyframes fu-hirsch{0%,35%,100%{rotate:0deg}45%,80%{rotate:62deg}}` },

  // Zwei Wanderer auf dem Kamm
  { n: "wanderer", ort: "ferne", platz: "huegel-r", zeit: "fsh",
    bild: hang(huegelFern, 741, 756, hinher(am(0, 0, .4, figur({ gehen: true, mantel: "#d6243a", hose: "#5a5248", kopf: "hut", hut: "#8a8a5a", schatten: false, hinten: F("M-1.2 -3.8H-.5V-2.3H-1.2Z", "#4f8fd0"), inHand: "" }), "fu-geht", "--takt:.4s")
      + am(-2.2, 0, .37, figur({ gehen: true, mantel: "#f4c542", hose: "#4b5261", kopf: "zopf", haar: "#6b4a2e", schatten: false, hinten: F("M-1.2 -3.8H-.5V-2.3H-1.2Z", "#3f7a52") }), "fu-geht", "--takt:.36s"), { von: 1.5, bis: 13.5, d: 60, y: .2 })) },

  // Schafe am Hang
  { n: "schafe", ort: "huegel", platz: "nahhuegel-r", zeit: "fs",
    bild: [[748.8, 1, 0, ""], [750.6, -1, .8, "fu-pick"], [752.3, 1, 0, "fu-huepf"], [754.2, 1, 1.9, "fu-pick"], [756.3, -1, 0, ""]].map(([x, s, v, kl], i) => am(x, huegelNah(x) + .25 + (i % 2) * .5, .5, `<g class="${kl}" style="--d:${kl === "fu-huepf" ? 4 : 5}s;--v:${-v}s;--h:-.7px;--w:${24 * s}deg;transform-origin:${s > 0 ? 70 : 30}% 100%">`
      + L("M-.6 -.5V0M.6 -.5V0", "#5a5248", .22) + E(0, -.95, 1.15, .7, "#fdfcf9") + E(s * 1.15, -1.2, .42, .5, "#5a5248") + `</g>`)).join("") },

  // Weinlese: Der Traktor tuckert durch die Reben
  { n: "weinlese", ort: "huegel", platz: "nahhuegel-r", zeit: "h",
    bild: [0, 1, 2].map(r => [748, 749.1, 750.2, 751.3, 752.4, 753.5, 754.6, 755.7, 756.8].map(x => `M${f(x + r * .35)} ${f(huegelNah(x) + 1.3 + r * 1.5)}v-.8`).join("")).map((d, r) => L(d, r % 2 ? "#b98a3e" : "#8f9a4e", .36)).join("")
      + hang(huegelNah, 748, 757, hinher(`<g class="fu-wipp" style="--d:.18s;--h:-.05px">` + F("M-1.6 -.9H-.2V-.3H-1.6Z", "#8a5f38") + F(kreis(-1.2, -1, .2) + kreis(-.8, -1.05, .2) + kreis(-.45, -1, .2), "#7a4a8a") + F("M0 -1.2H.9V-.7H1.5V-.3H0Z", "#d6243a") + F("M.15 -1.7H.8V-1.2H.15Z", "#fdfcf9", `opacity=".8"`)
        + F(kreis(-.9, -.22, .24) + kreis(.35, -.3, .32) + kreis(1.25, -.22, .22), TINTE) + `</g>` + `<circle class="fu-auf" style="--d:1.4s;--x:-.8px;--h:-1.2px;--o:.6" cx="1.3" cy="-1.3" r=".2" fill="#fff"/>`, { von: 1.5, bis: 7.6, d: 34, y: .9 })) },

  // Über der fernen Stadt dreht sich ein Baukran
  { n: "baukran", ort: "fern", platz: "fern-l", wetter: "sbrn",
    bild: L("M532.7 57V34.6M533.3 57V34.6", "#c9b06a", .14) + L(Array.from({ length: 11 }, (_, i) => `M532.7 ${57 - i * 2}L533.3 ${55 - i * 2}`).join(""), "#c9b06a", .08) + F(rechteck(532.4, 35.2, 1.2, 1), "#d9c98a")
      + dreh("fu-kran", 533, 34.6, L("M528.6 34.4H545M533 32.4L528.6 34.4M533 32.4L545 34.4M533 34.4V32.4", "#c9b06a", .16) + F(rechteck(528.4, 34.4, 1.6, .9), "#a89a80")
        + dreh("fu-pendel", 541.5, 34.4, L("M541.5 34.4V41.6", "#a89a80", .07) + F(rechteck(540.8, 41.6, 1.4, .9), "#c9a67c"), "--w:3deg;--d:2.6s")),
    css: `.fu-kran{animation:fu-kran 26s ease-in-out infinite alternate}@keyframes fu-kran{from{scale:1 1}to{scale:-.75 1}}` },
];
