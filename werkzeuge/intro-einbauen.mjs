#!/usr/bin/env node
// Baut das Intro „Morgen über Mainz“ in docs/index.html ein: Papierlagen-Szene (Hügel, Stadt, Ufer, Rhein) hinter den
// Logo-Teilen aus docs/bilder/intro/*.svg (Dom, Zeitung links/rechts – gleiche 128×128-Fläche wie die Sonne).
// Aufbau läuft von selbst (rund 3 s); der Weggang ist an das Scrollen gekoppelt (Bühne bleibt stehen, Ausgabe schiebt
// sich darüber, Logo dockt in der Kopfzeile an). Wiederholbar: ersetzt die markierten Blöcke INTRO-START … INTRO-ENDE.
//   node werkzeuge/intro-einbauen.mjs
import { readFileSync, writeFileSync } from "node:fs";

const DOCS = "docs", ZIEL = "docs";
const teil = n => {
  const svg = readFileSync(`${DOCS}/bilder/intro/${n}.svg`, "utf8");
  return [...svg.matchAll(/<path [^>]*\/>/g)].map(m => m[0].replace(/ fill="[^"]*"/, "")).join("");
};
const DOM = teil("02-Dom"), LINKS = teil("03-Zeitung-links"), RECHTS = teil("04-Zeitung-rechts");

// ---------- Silhouetten (Einheiten wie im Logo: 128 = Logobreite; Bandmitte = 640) ----------
const B = 1280, H = 60;
const f = n => +n.toFixed(1);
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

function pfad(teile) {
  let x = 0, d = `M0 ${H}`;
  for (const [typ, w, h = 0, e = 0] of teile) {
    const y = H - h, x2 = x + w, xm = x + w / 2;
    d += `V${f(y)}`;
    if (typ === "g") d += `L${f(xm)} ${f(y - e)}L${f(x2)} ${f(y)}`;                                   // Giebel / Turmspitze
    else if (typ === "s") d += `L${f(x + w * .22)} ${f(y - e)}H${f(x + w * .78)}L${f(x2)} ${f(y)}`;      // Walmdach
    else if (typ === "T") d += `H${f(x + w * .2)}V${f(y - e * .28)}L${f(xm)} ${f(y - e)}L${f(x2 - w * .2)} ${f(y - e * .28)}V${f(y)}H${f(x2)}`; // Turm mit Helm
    else if (typ === "k") d += `C${f(x)} ${f(y - e * .9)} ${f(xm - w * .14)} ${f(y - e)} ${f(xm - w * .06)} ${f(y - e)}V${f(y - e * 1.35)}H${f(xm + w * .06)}V${f(y - e)}C${f(xm + w * .14)} ${f(y - e)} ${f(x2)} ${f(y - e * .9)} ${f(x2)} ${f(y)}`; // Kuppel mit Laterne
    else d += `H${f(x2)}`;
    x = x2;
  }
  return d + `V${H}Z`;
}

function stadt({ seed, hMin, hMax, wMin, wMax, marken }) {
  const r = zufall(seed), teile = [], m = [...marken].sort((a, b) => a.x - b.x);
  let x = 0;
  while (x < B) {
    if (m.length && x >= m[0].x) { for (const t of m.shift().teile) { teile.push(t); x += t[1]; } continue; }
    let w = wMin + r() * (wMax - wMin); const h = hMin + r() * (hMax - hMin), z = r();
    if (m.length && x + w > m[0].x) w = Math.max(1, m[0].x - x);
    teile.push(z < .34 ? ["h", w, h] : z < .74 ? ["g", w, h, w * (.26 + r() * .2)] : z < .92 ? ["s", w, h, w * .22] : ["h", w * .6, hMin * .6]);
    x += teile.at(-1)[1];
  }
  return pfad(teile);
}

const HUEGEL = (() => {
  const y = x => H - (11 + 6 * Math.sin(x / 95) + 4 * Math.sin(x / 41 + 1) + 3 * Math.sin(x / 170 + 2));
  let d = `M0 ${H}V${f(y(0))}`;
  for (let x = 20; x <= B; x += 20) d += `Q${x - 10} ${f(y(x - 10) - .6)} ${x} ${f(y(x))}`;
  return d + `V${H}Z`;
})();

const FERN = stadt({ seed: 7, hMin: 3, hMax: 8, wMin: 6, wMax: 13, marken: [
  { x: 150, teile: [["h", 7, 18]] }, { x: 300, teile: [["g", 1.8, 26, 8]] },
  { x: 498, teile: [["h", 7, 19], ["h", 3, 6], ["h", 6, 23]] },
  { x: 716, teile: [["h", 2, 27], ["h", 4, 5], ["h", 2.4, 23]] },
  { x: 770, teile: [["h", 8, 17]] }, { x: 960, teile: [["h", 6, 21], ["h", 3, 5], ["h", 7, 16]] }, { x: 1120, teile: [["g", 1.8, 24, 8]] },
] });

const STADT = stadt({ seed: 21, hMin: 6, hMax: 12, wMin: 7, wMax: 14, marken: [
  { x: 120, teile: [["g", 5, 16, 12]] }, { x: 290, teile: [["T", 6, 15, 10], ["g", 13, 10, 4]] },
  { x: 440, teile: [["T", 6, 16, 9], ["g", 12, 11, 4], ["T", 6, 16, 9]] },
  { x: 500, teile: [["g", 10, 9, 3], ["h", 8, 12], ["s", 12, 8, 3], ["h", 6, 10], ["h", 5, 12], ["k", 18, 15, 13], ["h", 5, 12], ["g", 9, 8, 3], ["s", 11, 10, 3], ["h", 8, 7],
    ["h", 98, 6], ["g", 9, 9, 3], ["T", 7, 21, 12], ["g", 15, 13, 5], ["h", 7, 8], ["s", 12, 10, 3], ["g", 8, 12, 4], ["h", 10, 7], ["T", 5, 15, 9], ["g", 11, 9, 4]] },
  { x: 880, teile: [["k", 14, 10, 9]] }, { x: 1010, teile: [["g", 5, 17, 13]] }, { x: 1150, teile: [["T", 6, 14, 9]] },
] });

const UFER = (() => {
  const r = zufall(5); let d = "";
  for (let x = 6; x < B; x += 8 + r() * 9) {
    const rad = 2.4 + r() * 1.6, cy = H - 1.6 - 2.6 - rad;
    d += `M${f(x - .35)} ${H - 1.6}V${f(cy)}h.7V${H - 1.6}ZM${f(x - rad)} ${f(cy)}a${f(rad)} ${f(rad)} 0 1 0 ${f(rad * 2)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-rad * 2)} 0Z`;
  }
  return d;
})();
const MAUER = `M0 ${H}V${H - 1.6}H${B}V${H}Z`;

const WASSER = (() => {
  const r = zufall(11); let d = "";
  for (let i = 0; i < 70; i++) { const y = 2 + r() * r() * 46, x = r() * B, l = 14 + r() * 70; d += `M${f(x)} ${f(y)}h${f(l)}`; }
  return d;
})();

// Vögel: Endlage im Himmel (in % der Logofläche), Startversatz (Richtung Dom) und Größe
const VOEGEL = [
  { l: -24, t: 2, g: .13, x0: "150%", y0: "310%", fx: "-60vw", fy: "-30vh", v: 0 },
  { l: 0, t: -16, g: .09, x0: "90%", y0: "420%", fx: "-34vw", fy: "-52vh", v: .12 },
  { l: 94, t: -10, g: .15, x0: "-80%", y0: "330%", fx: "48vw", fy: "-44vh", v: .05 },
  { l: 116, t: 14, g: .085, x0: "-190%", y0: "260%", fx: "64vw", fy: "-22vh", v: .2 },
  { l: 76, t: -27, g: .065, x0: "-60%", y0: "520%", fx: "30vw", fy: "-60vh", v: .28 },
];

const buchstaben = (wort, ab) => [...wort].map((b, i) => `<i style="--i:${ab + i}">${b}</i>`).join("");

const css = `/* INTRO-START – „Morgen über Mainz“ (nur hell, nur Startseite ohne Lesezeichen) */
.intro{position:relative;z-index:0;height:200vh;height:200svh;margin-bottom:-100vh;margin-bottom:-100svh;color:#141414;--weich:cubic-bezier(.16,.84,.24,1);--fahrt:cubic-bezier(.45,.05,.2,1)}
.intro[hidden]{display:none}
.intro ~ :not(script){position:relative;z-index:1}
.intro-buehne{position:sticky;top:0;height:100vh;height:100svh;min-height:520px;overflow:hidden;background:#f6f4ef;--L:clamp(210px,56vw,340px)}
.i-mitte{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vh,22px);padding:0 14px 5vh}
.i-logo{position:relative;width:var(--L);aspect-ratio:1;perspective:900px;flex:none}
.i-welt{position:absolute;inset:0;clip-path:inset(-200vh -200vw var(--unten,-200vh) -200vw)}
.i-vorn{opacity:calc(var(--p,0) * 3.4)}
.i-kante{position:absolute;left:-200vw;right:-200vw;bottom:var(--unten,-200vh);height:110px;background:linear-gradient(rgba(246,244,239,0),#f6f4ef)}
.i-himmel,.i-boden{position:absolute;left:50%;width:300vw;height:160vh;margin-left:-150vw}
.i-himmel{bottom:39.45%;background:linear-gradient(to top,#fbe6d8 0,#f9ede3 16vh,#f1f2ef 40vh,#e9f0f3 78vh);opacity:calc(1 - var(--e,0))}
.i-himmel::after,.i-boden::after{content:"";position:absolute;inset:0;opacity:0;animation:i-aus 1.9s ease-in-out .3s both}
.i-himmel::after{background:linear-gradient(to top,#ecd8d0 0,#dcdbe3 24vh,#c6cedb 78vh)}
.i-boden{top:60.55%;background:linear-gradient(#d9e6ed 0,#e7eef0 8vh,#f6f4ef 24vh);translate:0 calc(var(--e,0) * 72vh)}
.i-boden::after{background:linear-gradient(#c2cddb 0,#d2dae3 12vh,#e2e6ea 44vh)}
.i-boden svg{position:absolute;left:50%;top:0;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);height:auto;overflow:visible;z-index:1;animation:i-wasser 11s ease-in-out infinite alternate}
.i-boden path{fill:none;stroke:#b3cad8;stroke-width:.45;stroke-linecap:round}
.i-licht{position:absolute;left:50%;top:60.55%;width:0;height:0;opacity:calc(1 - var(--p,0) * 1.5);scale:calc(1 + var(--e,0) * 1.4)}
.i-schein,.i-strahlen{position:absolute;border-radius:50%;aspect-ratio:1}
.i-schein{width:calc(var(--L) * 4.2);margin:calc(var(--L) * -2.1);background:radial-gradient(closest-side,rgba(226,70,60,.26),rgba(240,140,96,.13) 36%,rgba(246,200,160,0) 72%);animation:i-schein 1.7s var(--weich) .75s both}
.i-strahlen{width:calc(var(--L) * 5.6);margin:calc(var(--L) * -2.8);animation:i-ein 1.4s ease 1.5s both}
.i-strahlen::before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(rgba(203,8,56,.038) 0 4deg,rgba(203,8,56,0) 4deg 15deg);
  -webkit-mask:radial-gradient(closest-side,transparent 26%,#000 34%,transparent 100%);mask:radial-gradient(closest-side,transparent 26%,#000 34%,transparent 100%);animation:i-drehen 120s linear infinite}
.i-l{position:absolute;inset:0;transform-origin:0 0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(var(--ds,1));will-change:transform}
.i-l svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.i-sonne svg,.i-dom svg{transform-origin:50% 60.55%;--z:2.15;animation:i-zoom 2.5s var(--fahrt) both}
.i-dom svg{fill:#181716;transform-origin:50% 63%;animation:i-zoom 2.5s var(--fahrt) both,i-dom 1.15s cubic-bezier(.3,.9,.3,1) .22s both}
.i-sonne path{fill:#cb0838;transform-box:view-box;animation:i-sonne 1.5s cubic-bezier(.2,.75,.25,1) .75s both}
.i-zl svg,.i-zr svg{fill:#181716;transform-origin:50% 75%}
.i-zl svg{animation:i-blatt-l .95s cubic-bezier(.2,.9,.24,1.06) 1.05s both}
.i-zr svg{animation:i-blatt-r .95s cubic-bezier(.2,.9,.24,1.06) 1.13s both}
.i-band{position:absolute;left:50%;bottom:39.45%;width:calc(var(--L) * 10);margin-left:calc(var(--L) * -5);transform-origin:50% 100%;
  translate:0 calc(var(--e,0) * 72vh);scale:calc(1 + var(--e,0) * var(--k));will-change:transform}
.i-band svg{display:block;width:100%;height:auto;transform-origin:50% 100%;animation:i-zoom 2.5s var(--fahrt) both,i-steig .95s cubic-bezier(.2,.9,.25,1.04) var(--ab,0s) both}
.i-huegel{--k:.12}.i-huegel svg{fill:#d7dccd;--z:1.22;animation:i-zoom 2.5s var(--fahrt) both}
.i-fern{--k:.4}.i-fern svg{fill:#d3ccc1;--z:1.5;--ab:0s}
.i-stadt{--k:1}.i-stadt svg{fill:#bcb3a6;--z:1.9;--ab:.12s}
.i-ufer{--k:2.2}.i-ufer .i-baum{fill:#92a686}.i-ufer svg{fill:#a8a092;--z:2.5;--ab:.26s}
.i-vogel{position:absolute;width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx)) calc(var(--e,0) * var(--fy));scale:calc(1 + var(--e,0) * 6);opacity:calc(var(--o,1) - var(--p,0) * 1.7)}
.i-vogel svg{display:block;width:100%;height:auto;overflow:visible;animation:i-flug 1.7s cubic-bezier(.3,.6,.3,1) calc(1.2s + var(--v)) both,i-schweben 7s ease-in-out calc(2.9s + var(--v) * 6) infinite alternate}
.i-vogel path{fill:#3d3934;transform-box:fill-box;transform-origin:50% 62%;animation:i-schlag .62s ease-in-out calc(var(--v) * -2s) infinite alternate}
.i-titelplatz{position:relative;z-index:2;flex:none}
.i-titel{margin:0;font:760 clamp(46px,13.6vw,100px)/1 var(--serif);letter-spacing:-.025em;text-align:center;
  transform:translate(var(--tx,0px),var(--ty,0px)) scale(var(--ts,1));opacity:var(--to,1);will-change:transform,opacity}
.i-w{display:inline-block;overflow:hidden;padding:.1em .06em .14em;margin:-.1em -.06em -.14em;vertical-align:bottom}
.i-w i{display:inline-block;font-style:normal;animation:i-buchstabe .75s cubic-bezier(.16,1,.3,1) calc(1.8s + var(--i) * 28ms) both}
.i-titel b{display:inline-block;color:#c8102e;transform-origin:50% 85%;animation:i-punkt .55s cubic-bezier(.3,1.7,.5,1) 2.5s both}
@media (min-width:700px){.i-titel{white-space:nowrap}.i-titel br{display:none}}
.i-unter{position:relative;z-index:2;margin:0;display:flex;align-items:center;gap:12px;color:#57524a;font:600 clamp(13px,3.5vw,17px)/1.3 var(--sans);text-align:center;
  opacity:calc(1 - var(--p,0) * 5);translate:0 calc(var(--p,0) * -60px)}
.i-unter span{letter-spacing:.02em;animation:i-unter 1s cubic-bezier(.16,1,.3,1) 2.4s both}
.i-unter::before,.i-unter::after{content:"";width:clamp(0px,calc((100vw - 380px) * .3),34px);height:1px;background:#a8a093;animation:i-strich .8s cubic-bezier(.16,1,.3,1) 2.6s both}
.i-unter::before{transform-origin:100% 50%}.i-unter::after{transform-origin:0 50%}
.i-weiter{position:absolute;z-index:3;left:50%;bottom:max(18px,env(safe-area-inset-bottom));display:inline-flex;flex-direction:column;align-items:center;gap:4px;
  padding:8px 14px;border:0;background:none;color:#5d584f;font:600 13px/1 var(--sans);letter-spacing:.04em;cursor:pointer;
  transform:translateX(-50%);opacity:calc(1 - var(--p,0) * 6);animation:i-ein .6s ease 2.9s both}
.i-weiter i{font-style:normal;font-size:20px;animation:i-wippen 1.8s ease-in-out 3.5s infinite}
.intro.fertig *,.intro.fertig *::before,.intro.fertig *::after{animation:none!important}
@keyframes i-aus{from{opacity:1}}
@keyframes i-ein{from{opacity:0}}
@keyframes i-zoom{from{scale:var(--z)}}
@keyframes i-steig{from{translate:0 104%}}
@keyframes i-wasser{from{transform:translateX(-1.2%)}to{transform:translateX(1.2%)}}
@keyframes i-schein{from{transform:scale(.25);opacity:0}}
@keyframes i-drehen{to{transform:rotate(360deg)}}
@keyframes i-sonne{from{transform:translateY(64px)}}
@keyframes i-dom{from{transform:perspective(520px) rotateX(-90deg)}55%{transform:perspective(520px) rotateX(10deg)}78%{transform:perspective(520px) rotateX(-4deg)}to{transform:perspective(520px) rotateX(0)}}
@keyframes i-blatt-l{from{transform:perspective(900px) translate3d(-175%,120%,0) rotateY(78deg) rotateZ(-34deg) scale(5.2);opacity:0}18%{opacity:1}to{transform:perspective(900px)}}
@keyframes i-blatt-r{from{transform:perspective(900px) translate3d(175%,120%,0) rotateY(-78deg) rotateZ(34deg) scale(5.2);opacity:0}18%{opacity:1}to{transform:perspective(900px)}}
@keyframes i-flug{from{transform:translate(var(--x0),var(--y0)) scale(.15);opacity:0}22%{opacity:1}}
@keyframes i-schweben{to{transform:translate(18%,-30%)}}
@keyframes i-schlag{from{transform:scaleY(1.08)}to{transform:scaleY(.42)}}
@keyframes i-buchstabe{from{transform:translateY(118%) rotate(7deg)}}
@keyframes i-punkt{from{transform:scale(0)}}
@keyframes i-unter{from{opacity:0;letter-spacing:.24em}}
@keyframes i-strich{from{transform:scaleX(0)}}
@keyframes i-wippen{0%,100%{transform:none}50%{transform:translateY(5px)}}
@media (prefers-reduced-motion:reduce){.intro *,.intro *::before,.intro *::after{animation:none!important}}
/* INTRO-ENDE */
`;

const band = (kl, d) => `<div class="i-band ${kl}"><svg viewBox="0 0 ${B} ${H}">${`<path d="${d}"/>`}</svg></div>`;

const html = `<!-- INTRO-START -->
<section class="intro" id="intro" hidden aria-label="Mainzer Fachbrief">
 <div class="intro-buehne">
  <div class="i-mitte">
    <div class="i-logo" aria-hidden="true">
      <div class="i-welt">
      <div class="i-himmel"></div>
      <div class="i-licht"><div class="i-schein"></div><div class="i-strahlen"></div></div>
      <div class="i-l i-sonne"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#i-horizont)"><path d="M5.5 77.5a58.5 58.5 0 0 1 117 0Z"/></g></svg></div>
      ${band("i-huegel", HUEGEL)}
      ${band("i-fern", FERN)}
      ${band("i-stadt", STADT)}
      <div class="i-band i-ufer"><svg viewBox="0 0 ${B} ${H}"><path class="i-baum" d="${UFER}"/><path d="${MAUER}"/></svg></div>
      <div class="i-boden"><svg viewBox="0 0 ${B} 50"><path d="${WASSER}"/></svg></div>
      <div class="i-kante"></div>
      </div>
      <div class="i-l i-sonne i-vorn"><svg viewBox="0 0 128 128"><defs><clipPath id="i-horizont2"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#i-horizont2)"><path d="M5.5 77.5a58.5 58.5 0 0 1 117 0Z"/></g></svg></div>
      <div class="i-l i-dom"><svg viewBox="0 0 128 128"><g>${DOM}</g></svg></div>
      <div class="i-l i-zl"><svg viewBox="0 0 128 128">${LINKS}</svg></div>
      <div class="i-l i-zr"><svg viewBox="0 0 128 128">${RECHTS}</svg></div>
      ${VOEGEL.map(v => `<div class="i-vogel" style="left:${v.l}%;top:${v.t}%;--g:${v.g};--x0:${v.x0};--y0:${v.y0};--fx:${v.fx};--fy:${v.fy};--v:${v.v}s;--o:${(.5 + v.g * 3.4).toFixed(2)}"><svg viewBox="0 0 32 13"><path d="M16 6.2C14.6 4.2 12.4 2.6 9.8 2.4C6.6 2.2 3.6 3.4 1 5.6C4 4.6 6.8 4.3 9.4 4.9C11.8 5.5 13.6 7 14.8 9.2L16 11.6L17.2 9.2C18.4 7 20.2 5.5 22.6 4.9C25.2 4.3 28 4.6 31 5.6C28.4 3.4 25.4 2.2 22.2 2.4C19.6 2.6 17.4 4.2 16 6.2ZM14.5 6.9a1.5 1.6 0 1 0 3 0a1.5 1.6 0 1 0-3 0Z"/></svg></div>`).join("\n      ")}
    </div>
    <div class="i-titelplatz"><h1 class="i-titel"><span class="i-w">${buchstaben("Mainzer", 0)}</span> <br><span class="i-w">${buchstaben("Fachbrief", 7)}</span><b>.</b></h1></div>
    <p class="i-unter"><span>Deine tagesaktuelle Fachzeitung aus Mainz</span></p>
  </div>
  <button type="button" class="i-weiter">Zur Ausgabe<i aria-hidden="true">↓</i></button>
 </div>
</section>
<script>
/* Intro auf der Startseite ohne Ressort-Lesezeichen, nur hell; ?intro erzwingt es. ?zeit=1.5 / ?p=0.5 = Standbilder für Entwürfe. */
(() => {
  const intro = document.getElementById("intro");
  const q = new URLSearchParams(location.search);
  const startseite = !location.hash && !q.has("ausgabe") && !q.has("ansicht") && !q.has("q");
  const hell = document.documentElement.dataset.thema !== "dunkel";
  if (!(q.has("intro") || (startseite && hell))) { intro.remove(); return; }
  intro.hidden = false;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const buehne = intro.querySelector(".intro-buehne"), logo = intro.querySelector(".i-logo");
  let marke;
  const s = intro.style, grenze = x => Math.min(1, Math.max(0, x)), sanft = x => x * x * (3 - 2 * x);
  const strecke = () => intro.offsetHeight - buehne.offsetHeight;
  let offen = false;
  const rechne = () => {
    offen = false; marke = marke || document.querySelector("#kopf .marke a"); if (!marke || !intro.isConnected) return;
    const p = grenze(scrollY / strecke()), e = sanft(p), d = sanft(grenze(p / .86));
    s.setProperty("--p", p.toFixed(4)); s.setProperty("--e", e.toFixed(4));
    const a = logo.getBoundingClientRect(), z = marke.getBoundingClientRect(), bild = marke.querySelector("img.logo-hell");
    // Das Logo schrumpft zügig und landet von oben auf seinem Platz links neben dem Schriftzug: rechte und untere Kante
    // zielen auf den Platz, damit es unterwegs nicht über den Schriftzug fährt.
    const ds = 1 + (z.height / a.width - 1) * sanft(grenze(p / .82)), g = a.width * ds, w = sanft(grenze((p - .3) / .64));
    const mx = a.left + a.width / 2 + (z.left + z.height - g / 2 - a.left - a.width / 2) * w;
    const my = a.top + a.height / 2 + (z.top + z.height - g / 2 - a.top - a.height / 2) * w;
    s.setProperty("--dx", (mx - g / 2 - a.left).toFixed(1) + "px");
    s.setProperty("--dy", (my - g / 2 - a.top).toFixed(1) + "px");
    s.setProperty("--ds", ds.toFixed(4));
    s.setProperty("--ts", (1 - e * .14).toFixed(4));
    s.setProperty("--to", (1 - grenze((p - .02) / .2)).toFixed(3));
    s.setProperty("--unten", (a.bottom - (strecke() - scrollY)).toFixed(1) + "px");
    bild.style.clipPath = p < 1 ? "inset(0 0 0 13.9%)" : "";
    bild.style.opacity = p < 1 ? grenze((p - .34) / .46).toFixed(3) : "";
    buehne.style.visibility = p >= 1 ? "hidden" : "";
  };
  addEventListener("scroll", () => { if (!offen) { offen = true; requestAnimationFrame(rechne); } }, { passive: true });
  addEventListener("resize", rechne);
  // Wer am Intro auf Dunkel schaltet, bekommt die Ausgabe ohne Intro (die Szene gibt es nur hell).
  new MutationObserver(() => {
    if (document.documentElement.dataset.thema !== "dunkel" || !intro.isConnected) return;
    const bild = document.querySelector("#kopf .marke img.logo-hell"); if (bild) bild.style.clipPath = bild.style.opacity = "";
    const rest = Math.max(0, scrollY - strecke()); intro.remove(); scrollTo(0, rest);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-thema"] });
  intro.querySelector(".i-weiter").addEventListener("click", () => {
    const von = scrollY, bis = strecke(), t0 = performance.now(), dauer = 1500;
    const schritt = jetzt => { const x = grenze((jetzt - t0) / dauer); scrollTo(0, von + (bis - von) * (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)); if (x < 1) requestAnimationFrame(schritt); };
    requestAnimationFrame(schritt);
  });
  rechne(); addEventListener("DOMContentLoaded", rechne);
  // Standbilder für Entwürfe
  if (q.has("zeit") || q.has("p")) addEventListener("load", () => {
    if (q.has("p")) { intro.classList.add("fertig"); scrollTo(0, strecke() * parseFloat(q.get("p"))); rechne(); return; }
    const ms = parseFloat(q.get("zeit")) * 1000;
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
  });
})();
</script>
<!-- INTRO-ENDE -->
`;

let seite = readFileSync(`${DOCS}/index.html`, "utf8");
seite = seite.replace(/\/\* INTRO-START[\s\S]*?\/\* INTRO-ENDE \*\/\n/, "").replace(/<!-- INTRO-START -->[\s\S]*?<!-- INTRO-ENDE -->\n/, "");
const stilEnde = seite.indexOf("</style>");
seite = seite.slice(0, stilEnde) + css + seite.slice(stilEnde);
const body = seite.match(/<body[^>]*>\n/);
seite = seite.replace(body[0], body[0] + html);
writeFileSync(`${ZIEL}/index.html`, seite);
console.log("Intro eingebaut:", css.length + html.length, "Zeichen");
