#!/usr/bin/env node
// Fundstücke des Tages: kleine Überraschungen im Intro (Leute am Ufer, Tiere, Boote, Dinge am Himmel, an den Türmen,
// auf dem Zeitungsblatt …). Jeden Tag erscheinen zwei bis vier davon – für alle dieselben, passend zu Jahreszeit,
// Wetter und Wochentag. Die Zeichnungen stehen in werkzeuge/funde/*.mjs (Regeln dort in LIES-MICH.md).
//   node werkzeuge/intro-funde.mjs               → schreibt docs/intro-funde.js (wird vom Intro nachgeladen)
//   node werkzeuge/intro-funde.mjs --nur=ufer    → schreibt docs/_funde-ufer.js (Entwurf, im Browser mit ?fq=ufer)
//   node werkzeuge/intro-funde.mjs --nur=ufer --blatt=1  → Prüfblatt docs/_blatt-ufer.html (alle Stücke des Moduls groß nebeneinander)
//   node werkzeuge/intro-funde.mjs --liste       → zeigt alle Fundstücke; --plan=2027-03 zeigt, was an welchem Tag erscheint
// Danach node werkzeuge/intro-einbauen.mjs (trägt die neue Fassung in die Seite ein).
// Im Browser: ?fund=name,name zeigt bestimmte, ?fund=aus keine, ?tag=2027-06-18 einen anderen Tag.
import { writeFileSync, renameSync, existsSync } from "node:fs";
import { CSS_ALLE, BELEGT, MIT } from "./funde/hilfen.mjs";

const MODULE = ["himmel", "stadt", "tuerme", "ufer-leute", "ufer-szenen", "wasser", "blatt"];
const ORTE = ["himmel", "vorn", "ferne", "huegel", "fern", "stadt", "turm", "ufer", "wasser", "buehne", "titel", "unter", "logo", "fest", "boni"];
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || "").split("=")[1];
const nur = arg("nur");

const funde = [];
for (const m of nur ? [nur] : MODULE) {
  if (!existsSync(new URL(`./funde/${m}.mjs`, import.meta.url))) { console.warn(`(noch kein Modul ${m})`); continue; }
  for (const x of (await import(`./funde/${m}.mjs`)).default) funde.push({ ...x, modul: m });
}
// Prüfen und in die kurze Form bringen
const daten = funde.map(x => {
  const fehler = t => { throw new Error(`Fundstück „${x.n}“ (${x.modul}): ${t}`); };
  if (!/^[a-z0-9-]+$/.test(x.n || "")) fehler("Name fehlt oder enthält andere Zeichen als a–z, 0–9, -");
  if (funde.filter(y => y.n === x.n).length > 1) fehler("Name doppelt");
  if (!ORTE.includes(x.ort)) fehler(`unbekannter Ort ${x.ort}`);
  if (!x.platz) fehler("Platz fehlt");
  if (!["fest", "boni"].includes(x.ort) && !x.bild) fehler("Zeichnung (bild) fehlt");
  if (String(x.platz).endsWith("-*") && !["ufer", "wasser"].includes(x.ort)) fehler("freie Plätze gibt es nur am Ufer und auf dem Wasser");
  return { n: x.n, o: x.ort, p: [].concat(x.platz), z: x.zeit || "fshw", w: x.wetter || "sb", t: x.tage || "1234567", s: x.stufe || 1, a: x.am ? [].concat(x.am) : 0,
    m: x.bild || "", c: (x.css || "").trim(), x: x.dazu || 0, sp: x.spiegeln ? 1 : 0 };
});

// ---- Läuft im Browser ----
function fundeZeigen(F, CSS, BELEGT, MIT) {
  const intro = document.getElementById("intro"); if (!intro || intro.dataset.funde !== undefined) return;
  const q = new URLSearchParams(location.search), D = intro.dataset;
  const tag = D.tag || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const p = tag.split("-"), dat = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), t = Math.round(dat / 864e5), wt = dat.getUTCDay() || 7;   // wt: 1 = Montag … 7 = Sonntag
  const at = Math.floor((t + 3) / 7) * 5 + Math.min(wt, 5) - 1;          // Arbeitstag-Nummer: das Wochenende zählt wie der Freitag
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return h >>> 0; };
  const Z = { fruehling: "f", sommer: "s", herbst: "h", winter: "w" }[D.zeit] || "f", W = { sonne: "s", bewoelkt: "b", regen: "r", schnee: "n" }[D.wetter] || "s";
  const md = tag.slice(5), fr13 = wt === 5 && +p[2] === 13;
  const festNamen = (D.fest || "").split(" ").filter(Boolean), belegt = new Set();
  festNamen.forEach(n => (BELEGT[n] || []).forEach(x => belegt.add(x)));
  // Jedes Fundstück hat in jedem Durchgang (30, 60 oder 120 Arbeitstage – gewöhnlich, besonders, selten) genau einen Tag,
  // an dem es dran ist; Stücke mit festem Datum (am) nur dann.
  const PERIODE = [0, 30, 60, 120];
  const passt = x => x.z.includes(Z) && x.w.includes(W) && x.t.includes(wt) && !x.p.some(pl => belegt.has(pl));
  const anDer = (x, a) => hash(x.n + ":" + Math.floor(a / PERIODE[x.s])) % PERIODE[x.s] === a % PERIODE[x.s];        // ist am Arbeitstag a an der Reihe
  const dran = x => x.a ? x.a.includes(md) || (fr13 && x.a.includes("fr13")) : anDer(x, at) && !anDer(x, at - 1);
  let wahl = [];
  // Freie Plätze: Stücke mit Platz "ufer-*" oder "wasser-*" bekommen heute einen der noch freien Plätze dieser Art
  const PLAETZE = { "ufer-": [["l1", 537], ["l2", 562], ["r1", 717], ["r2", 743]], "wasser-": [["l", 548], ["r", 736]] };
  const pl = x => x.q || x.p, besetzt = n => belegt.has(n) || wahl.some(y => pl(y).includes(n));
  const platzFuer = (x, wunsch) => {
    if (x.p[0].slice(-2) !== "-*") return wunsch || !x.p.some(besetzt);
    const art = x.p[0].slice(0, -1), frei = PLAETZE[art].filter(s => !besetzt(art + s[0]));
    const s = wunsch ? PLAETZE[art].find(s => art + s[0] === wunsch) || PLAETZE[art][0] : frei[hash(x.n + "@" + at) % frei.length];
    if (!s) return false; x.q = [art + s[0]].concat(x.p.slice(1)); x.dx = s[1]; return true;
  };
  // ?fund=angler,gassi zeigt bestimmte Stücke; angler@ufer-r2 = an diesem Platz, gassi@spiegel = gespiegelt
  if (q.has("fund")) q.get("fund").split(",").forEach(w => { const t = w.split("@"), x = F.find(y => y.n === t[0]); if (!x) return; platzFuer(x, t[1] === "spiegel" ? "" : t[1] || " "); x.gespiegelt = t[1] === "spiegel"; wahl.push(x); });
  else {
    const festtag = festNamen.some(n => n !== "schneemann"), max = festtag ? 2 : 4, min = festtag ? 1 : 2;
    const kann = F.filter(passt), rang = x => hash(x.n + "/" + at);
    // höchstens zwei Stücke aus demselben Bereich (Ufer, Wasser, Himmel, Stadt mit Türmen, Hügel, Blatt), damit es sich verteilt
    const bereich = x => ({ turm: "stadt", boni: "stadt", ferne: "huegel", fern: "huegel", titel: "blatt", unter: "blatt", buehne: "blatt", logo: "blatt", fest: x.p[0].split("-")[0] })[x.o] || x.o;
    const nimm = x => { if (wahl.length < max && !wahl.includes(x) && wahl.filter(y => bereich(y) === bereich(x)).length < 2 && platzFuer(x)) { x.gespiegelt = x.sp && hash(x.n + "~" + at) % 2 === 1; wahl.push(x); } };
    festNamen.forEach(n => (MIT[n] || []).forEach(m => { const x = F.find(y => y.n === m); if (x && platzFuer(x)) wahl.push(x); }));
    kann.filter(dran).sort((a, b) => (b.a ? 9 : b.s) - (a.a ? 9 : a.s) || rang(a) - rang(b)).forEach(nimm);
    kann.filter(x => !x.a && x.s === 1 && !wahl.includes(x) && !anDer(x, at - 1)).sort((a, b) => rang(a) - rang(b)).forEach(x => { if (wahl.length < min) nimm(x); });
  }
  D.funde = wahl.map(x => x.n).join(" ");
  if (wahl.some(x => pl(x).includes("wasser-r"))) intro.classList.add("fu-wasser-r");      // Platz für das Stück: Das Ausflugsschiff bleibt heute im Hafen
  window.BONI_FUNDE = { heute: wahl.map(x => x.n), alle: F.map(x => x.n) };
  if (!wahl.length) return;
  const stil = document.createElement("style"); stil.textContent = CSS + wahl.map(x => x.c).join("\n"); document.head.appendChild(stil);
  const NS = "http://www.w3.org/2000/svg", welt = intro.querySelector(".i-welt"), buehne = intro.querySelector(".intro-buehne"), titel = intro.querySelector(".i-titel");
  const ZIEL = { stadt: ".i-stadt svg", turm: ".i-stadt .bt", ufer: ".i-ufer svg", wasser: ".i-boden svg", huegel: ".i-huegel2 svg", ferne: ".i-huegel svg", fern: ".i-fern svg" };
  const amTitel = [];
  wahl.forEach(x => {
    if (x.o === "fest") { D.fest = ((D.fest || "") + " " + x.x.join(" ")).trim(); return; }
    if (x.o === "boni") { D.boni = ((D.boni || "") + " " + x.x.join(" ")).trim(); return; }
    if (ZIEL[x.o]) { const g = document.createElementNS(NS, "g"); g.setAttribute("class", "fu fu-" + x.n); g.innerHTML = x.dx ? '<g transform="translate(' + x.dx + ' 0)">' + x.m + "</g>" : x.m;
      if (x.gespiegelt) g.setAttribute("transform", "translate(1280 0) scale(-1 1)"); intro.querySelector(ZIEL[x.o]).appendChild(g); return; }
    const d = document.createElement(x.o === "titel" || x.o === "unter" ? "span" : "div"); d.setAttribute("aria-hidden", "true");
    if (x.o === "logo") {                                              // eigene Lage über dem Logo (wandert und schrumpft mit ihm)
      d.className = "i-l fu-logo fu-" + x.n; d.innerHTML = '<svg viewBox="0 0 128 128">' + x.m + "</svg>";
      const logo = intro.querySelector(".i-logo"); logo.insertBefore(d, logo.querySelector(".i-vogel")); return;
    }
    d.className = (x.o === "titel" ? "fu-t fu-" : "fu-w fu-") + x.n; d.innerHTML = x.m.replace("{{TAG}}", p[2] + "." + p[1] + "." + p[0]);
    if (x.o === "himmel") welt.insertBefore(d, welt.querySelector(".i-huegel"));
    else if (x.o === "vorn") welt.insertBefore(d, welt.querySelector(".i-boden"));
    else if (x.o === "buehne") buehne.insertBefore(d, buehne.querySelector(".i-nieder"));
    else if (x.o === "unter") intro.querySelector(".i-unter").appendChild(d);
    else if (x.o === "titel") { titel.appendChild(d); amTitel.push([d, x.x || 0]); }
  });
  // Am Titel: an einen Buchstaben heften (dazu = Nummer des Buchstabens, 0 = M … 15 = letztes t); Maße in em der Titelschrift
  const heften = () => { const fs = parseFloat(getComputedStyle(titel).fontSize), bs = titel.querySelectorAll("i");
    amTitel.forEach(([d, nr]) => { const b = bs[nr]; if (!b) return; d.style.setProperty("--tl", ((b.offsetLeft + b.offsetWidth / 2) / fs).toFixed(3) + "em"); d.style.setProperty("--tt", (b.offsetTop / fs).toFixed(3) + "em"); d.style.setProperty("--tb", (b.offsetWidth / fs).toFixed(3) + "em"); d.style.setProperty("--tw", (titel.offsetWidth / fs).toFixed(3) + "em"); }); };
  if (amTitel.length) { heften(); addEventListener("resize", heften); addEventListener("load", heften); if (document.fonts && document.fonts.ready) document.fonts.ready.then(heften); }
}

// ---- Ausgabe ----
if (process.argv.includes("--liste")) {
  for (const m of MODULE) { const l = daten.filter((x, i) => funde[i].modul === m); if (l.length) console.log(`${m} (${l.length}): ` + l.map(x => x.n + (x.s > 1 ? "*".repeat(x.s - 1) : "")).join(", ")); }
  console.log(`${daten.length} Fundstücke (* besonders, ** selten)`);
} else if (arg("blatt")) {
  // Prüfblatt: alle Fundstücke eines Moduls groß nebeneinander (docs/_blatt-<modul>.html?t=5 – t = Sekunde, an der alle Bewegungen anhalten)
  const hinter = { ufer: `<rect x="-99" y="0" width="2999" height="58.4" fill="#c9c0b3"/><rect x="-99" y="57.95" width="2999" height=".5" fill="#8fc474"/><rect x="-99" y="58.4" width="2999" height="9" fill="#a8a092"/>`,
    wasser: `<rect x="-99" y="-99" width="2999" height="99" fill="#f3e2d8"/><rect x="-99" y="0" width="2999" height="99" fill="#c9dfee"/>`, huegel: `<rect x="-99" y="-99" width="2999" height="299" fill="#cfe3bf"/>` };
  const zellen = daten.filter(x => !["fest", "boni"].includes(x.o)).map(x => {
    const svg = ["ufer", "wasser", "stadt", "turm", "fern", "ferne", "huegel"].includes(x.o);
    return `<figure data-o="${x.o}"><figcaption>${x.n} · ${x.o} · ${x.z}/${x.w}${x.s > 1 ? " · " + "★".repeat(x.s - 1) : ""}</figcaption>` + (svg ? `<svg class="band">${hinter[x.o] || `<rect x="-99" y="-99" width="2999" height="299" fill="#f6e6dc"/>`}<g class="fu-${x.n}">${x.m}</g></svg>` : x.o === "logo" ? `<svg viewBox="0 0 128 128">${x.m}</svg>` : `<div class="frei fu-${x.n}">${x.m}</div>`) + `</figure>`;
  }).join("");
  const seite = `<!doctype html><meta charset="utf-8"><title>Fundstücke ${nur || ""}</title><style>
body{margin:0;background:#2b2b2b;display:grid;grid-template-columns:repeat(${arg("spalten") || 6},1fr);gap:3px;font:12px system-ui}
figure{margin:0;background:#f6e6dc;position:relative;aspect-ratio:3/2;overflow:hidden}figcaption{position:absolute;z-index:3;left:0;top:0;padding:1px 5px;background:rgba(0,0,0,.6);color:#fff}
svg.band{position:absolute;inset:0;width:100%;height:100%}.frei{position:absolute;inset:14% 6% 4%;--L:300px;--p:0;--e:0;font:760 60px/1 Georgia,serif}
.frei .fu-h{position:static;width:100%;translate:none}.frei .fu-b,.frei .fu-u{position:static;width:60%}.frei svg{max-height:100%}.frei>svg{position:static;width:60%;height:auto}
@keyframes i-ein{from{opacity:0}}@keyframes i-drehen{to{transform:rotate(360deg)}}
${CSS_ALLE}.fu-fahrt,.fu-hinher,.fu-weg{animation:none!important;translate:0 0!important;rotate:0deg!important;scale:1!important;opacity:1!important}
${daten.map(x => x.c).join("\n")}</style>${zellen}
<script>
for (const s of document.querySelectorAll("svg.band")) { const g = s.lastElementChild, b = g.getBBox(), r = 1.2; let w = Math.max(b.width + 2 * r, 9), h = Math.max(b.height + 2 * r, 6);
  if (w / h > 1.5) h = w / 1.5; else w = h * 1.5; s.setAttribute("viewBox", [b.x + b.width / 2 - w / 2, b.y + b.height / 2 - h / 2, w, h].join(" ")); }
const t = parseFloat(new URLSearchParams(location.search).get("t") || "5");
addEventListener("load", () => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; } });
</script>`;
  writeFileSync(`docs/_blatt-${nur || "alle"}.html`, seite); console.log(`docs/_blatt-${nur || "alle"}.html: ${daten.length} Fundstücke`);
} else if (arg("plan")) {
  // Probelauf ohne Browser: was erscheint an den Tagen eines Monats (bei Sonne, ohne Festmotive)
  const [j, mo] = arg("plan").split("-").map(Number), wetter = arg("wetter") || "sonne";
  for (let d = 1; d <= new Date(j, mo, 0).getDate(); d++) {
    const tag = `${j}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, ds = { tag, zeit: mo >= 3 && mo <= 5 ? "fruehling" : mo >= 6 && mo <= 8 ? "sommer" : mo >= 9 && mo <= 11 ? "herbst" : "winter", wetter, fest: "" };
    globalThis.window = {}; globalThis.location = { search: "" };
    globalThis.document = { getElementById: () => ({ dataset: ds, querySelector: () => null }), createElement: () => { throw 0; } };
    try { fundeZeigen(daten, "", BELEGT, MIT); } catch { /* ohne Browser endet der Lauf nach der Auswahl */ }
    console.log(tag, ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(j, mo - 1, d).getDay()], ds.funde);
  }
} else {
  const js = `/* Mainzer Boniblatt – Fundstücke des Tages. Erzeugt von werkzeuge/intro-funde.mjs, nicht von Hand ändern. */\n(${fundeZeigen.toString()})(${JSON.stringify(daten)},${JSON.stringify(CSS_ALLE.trim())},${JSON.stringify(BELEGT)},${JSON.stringify(MIT)});\n`;
  const ziel = nur ? `docs/_funde-${nur}.js` : "docs/intro-funde.js";
  writeFileSync(ziel + ".neu", js); renameSync(ziel + ".neu", ziel);
  console.log(`${ziel}: ${daten.length} Fundstücke, ${js.length} Zeichen`);
}
