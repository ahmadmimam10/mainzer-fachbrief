#!/usr/bin/env node
// Baut die Intro-Animation (Zeitung schlägt auf, Dom klappt hoch, Sonne geht auf, Titel erscheint) in docs/index.html ein.
// Quelle: Logo-Teile in docs/bilder/intro/*.svg (Sonne, Dom, Zeitung links/rechts – gleiche 128×128-Fläche).
// Wiederholbar: ersetzt die markierten Blöcke INTRO-START … INTRO-ENDE.
//   node werkzeuge/intro-einbauen.mjs
import { readFileSync, writeFileSync } from "node:fs";

const teil = n => {
  const svg = readFileSync(`docs/bilder/intro/${n}.svg`, "utf8");
  return [...svg.matchAll(/<path [^>]*\/>/g)].map(m => m[0].replace(/ fill="[^"]*"/, "")).join("");
};
const SONNE = teil("01-Sonne"), DOM = teil("02-Dom"), LINKS = teil("03-Zeitung-links"), RECHTS = teil("04-Zeitung-rechts");

const css = `/* INTRO-START – Startbild mit Animation (nur hell, nur Startseite ohne Lesezeichen) */
.intro{position:relative;height:100vh;height:100svh;min-height:520px;display:grid;place-items:center;overflow:hidden;background:#f6f4ef;color:#141414}
.intro[hidden]{display:none}
.intro::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(45% 40% at 50% 42%,rgba(203,8,56,.06),rgba(203,8,56,0) 72%);animation:intro-gluehen 2.4s ease 1.2s both}
.intro-buehne{position:relative;display:flex;flex-direction:column;align-items:center;gap:clamp(10px,2.4vh,26px);padding:0 16px;
  transform:translateY(calc(var(--p,0) * -20vh)) scale(calc(1 - var(--p,0) * .3));opacity:calc(1 - var(--p,0) * 1.3);will-change:transform,opacity}
.intro-logo{position:relative;width:clamp(210px,56vw,340px);aspect-ratio:1;perspective:700px}
.intro-logo svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.intro-sonne path{fill:#cb0838;transform-box:view-box;transform-origin:64px 77.5px;animation:intro-sonne 1.5s cubic-bezier(.2,.75,.25,1) 1.05s both}
.intro-dom{fill:#181716;transform-origin:50% 61%;animation:intro-dom .85s cubic-bezier(.3,1.45,.5,1) .6s both}
.intro-zl,.intro-zr{fill:#181716;transform-origin:50% 75%}
.intro-zl{animation:intro-links .9s cubic-bezier(.2,.8,.25,1) .1s both}
.intro-zr{animation:intro-rechts .9s cubic-bezier(.2,.8,.25,1) .1s both}
.intro-titel{margin:0;font:760 clamp(48px,14vw,100px)/.98 var(--serif);letter-spacing:-.025em;text-align:center}
.intro-titel span:first-child::after{content:"";display:block}
@media (min-width:700px){.intro-titel{white-space:nowrap}.intro-titel span:first-child::after{display:none}}
.intro-titel span{display:inline-block;animation:intro-wort .8s cubic-bezier(.2,.8,.2,1) both}
.intro-titel span:nth-child(1){animation-delay:1.85s}
.intro-titel span:nth-child(2){animation-delay:2s}
.intro-titel b{display:inline-block;color:#c8102e;transform-origin:50% 85%;animation:intro-punkt .55s cubic-bezier(.3,1.7,.5,1) 2.45s both}
.intro-weiter{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom));display:inline-flex;flex-direction:column;align-items:center;gap:4px;
  padding:8px 14px;border:0;background:none;color:#5d584f;font:600 13px/1 var(--sans);letter-spacing:.04em;cursor:pointer;
  transform:translateX(-50%);opacity:calc(1 - var(--p,0) * 4);animation:intro-hinweis .6s ease 2.9s both}
.intro-weiter i{font-style:normal;font-size:20px;animation:intro-wippen 1.8s ease-in-out 3.5s infinite}
.intro.fertig *,.intro.fertig::before{animation:none!important}
@keyframes intro-links{from{transform:rotateY(86deg);opacity:0}to{transform:none;opacity:1}}
@keyframes intro-rechts{from{transform:rotateY(-86deg);opacity:0}to{transform:none;opacity:1}}
@keyframes intro-dom{from{transform:scaleY(0)}to{transform:none}}
@keyframes intro-sonne{from{transform:translateY(62px)}to{transform:none}}
@keyframes intro-gluehen{from{opacity:0}to{opacity:1}}
@keyframes intro-wort{from{transform:translateY(.45em);opacity:0}to{transform:none;opacity:1}}
@keyframes intro-punkt{from{transform:scale(0)}to{transform:none}}
@keyframes intro-hinweis{from{opacity:0}to{opacity:calc(1 - var(--p,0) * 4)}}
@keyframes intro-wippen{0%,100%{transform:none}50%{transform:translateY(5px)}}
@media (prefers-reduced-motion:reduce){.intro *,.intro::before{animation:none!important}}
/* INTRO-ENDE */
`;

const html = `<!-- INTRO-START -->
<section class="intro" id="intro" hidden aria-label="Mainzer Fachbrief">
  <div class="intro-buehne">
    <div class="intro-logo" aria-hidden="true">
      <svg class="intro-sonne" viewBox="0 0 128 128"><defs><clipPath id="intro-horizont"><rect width="128" height="77.5"/></clipPath></defs><g clip-path="url(#intro-horizont)">${SONNE}</g></svg>
      <svg class="intro-dom" viewBox="0 0 128 128">${DOM}</svg>
      <svg class="intro-zl" viewBox="0 0 128 128">${LINKS}</svg>
      <svg class="intro-zr" viewBox="0 0 128 128">${RECHTS}</svg>
    </div>
    <h1 class="intro-titel"><span>Mainzer</span> <span>Fachbrief</span><b>.</b></h1>
  </div>
  <button type="button" class="intro-weiter">Zur Ausgabe<i aria-hidden="true">↓</i></button>
</section>
<script>
/* Intro: vorerst nur als Vorschau mit ?intro. Nach Freigabe FUER_ALLE = true: dann auf der Startseite ohne Ressort-Lesezeichen, nur hell. */
(() => {
  const FUER_ALLE = false;
  const intro = document.getElementById("intro");
  const q = new URLSearchParams(location.search);
  const startseite = !location.hash && !q.has("ausgabe") && !q.has("ansicht") && !q.has("q");
  const hell = document.documentElement.dataset.thema !== "dunkel";
  if (!(q.has("intro") || (FUER_ALLE && startseite && hell))) { intro.remove(); return; }
  intro.hidden = false;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const setze = p => intro.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(3));
  if (q.has("p")) { intro.classList.add("fertig"); setze(parseFloat(q.get("p")) || 0); return; }   // Standbild für Vorschaubilder
  let offen = false;
  const rechne = () => { offen = false; setze(scrollY / (intro.offsetHeight * 0.8)); };
  addEventListener("scroll", () => { if (!offen) { offen = true; requestAnimationFrame(rechne); } }, { passive: true });
  intro.querySelector(".intro-weiter").addEventListener("click", () => document.getElementById("kopf").scrollIntoView({ behavior: "smooth" }));
  rechne();
})();
</script>
<!-- INTRO-ENDE -->
`;

let seite = readFileSync("docs/index.html", "utf8");
seite = seite.replace(/\/\* INTRO-START[\s\S]*?\/\* INTRO-ENDE \*\/\n/, "").replace(/<!-- INTRO-START -->[\s\S]*?<!-- INTRO-ENDE -->\n/, "");
const stilEnde = seite.indexOf("</style>");
if (stilEnde < 0) throw new Error("</style> nicht gefunden");
seite = seite.slice(0, stilEnde) + css + seite.slice(stilEnde);
const body = seite.match(/<body[^>]*>\n/);
if (!body) throw new Error("<body> nicht gefunden");
seite = seite.replace(body[0], body[0] + html);
writeFileSync("docs/index.html", seite);
console.log("Intro eingebaut:", css.length + html.length, "Zeichen");
