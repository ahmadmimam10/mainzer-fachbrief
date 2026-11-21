#!/usr/bin/env node
// Baut die Entwürfe für den Nachrichtenteil (nur auf dem Zweig entwurf/kacheln).
//   Erste Runde:  docs/entwurf-a.html (Druckbogen), -b.html (Bento), -c.html (Morgenglas) – je docs/entwurf/<x>.css und <x>.js
//   Zweite Runde: docs/entwurf-b1.html (Bento „Druck“) und -b2.html (Bento „Spiel“) – beide aus docs/entwurf/bb.css und bb.js,
//                 mit neuem Schriftzug neben dem Bildzeichen, Jahreszeit-Farben, Wetter für 7 Tage und „Was geht heute ab?“
// Oben bleibt alles wie auf der echten Seite (Intro aus docs/index.html).
//   node werkzeuge/entwurf-bauen.mjs        (vorher node werkzeuge/intro-einbauen.mjs, falls das Intro geändert wurde)
// Ansehen: entwurf-b1.html (mit Intro) · ?ohne = ohne Intro · ?still = ohne Bewegung · ?farbe=sommer|winter|fruehling|herbst
//          ?mehr = zwei weitere Bereiche zum Ausprobieren · #fruehe-hilfen wählt einen Bereich
import { readFileSync, writeFileSync } from "node:fs";

const seite = readFileSync("docs/index.html", "utf8");
const kopf = seite.slice(0, seite.indexOf("</head>"));
let intro = seite.match(/<!-- INTRO-START -->[\s\S]*?<!-- INTRO-ENDE -->\n/)[0];
// ?ohne zeigt den Entwurf ohne Intro (für Bilder vom unteren Teil)
intro = intro.replace('if (!(q.has("intro") || (hell && !vonUeber)))', 'if (q.has("ohne") || !(q.has("intro") || (hell && !vonUeber)))');
const body = seite.match(/<body[^>]*>\n/)[0];

// Bildzeichen ohne Schriftzug (Sonne, Dom, Zeitung) – der Schriftzug steht in den B-Varianten als Text daneben
const teil = n => readFileSync(`docs/bilder/intro/${n}.svg`, "utf8").match(/<g [\s\S]*<\/g>/)[0];
writeFileSync("docs/bilder/zeichen.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256"><title>Mainzer Boniblatt</title>${["01-Sonne", "02-Dom", "03-Zeitung-links", "04-Zeitung-rechts"].map(teil).join("")}</svg>\n`);

const ALT = { a: "Druckbogen", b: "Bento", c: "Morgenglas" }, NEU = { b1: "Bento Druck", b2: "Bento Spiel" };
const wahl = (liste, x) => Object.entries(liste).map(([y, n]) => `<a href="entwurf-${y}.html"${y === x ? ' aria-current="page"' : ""}><b>${y.toUpperCase()}</b> ${n.replace("Bento ", "")}</a>`).join("");

for (const [x, name] of Object.entries(ALT)) {
  const html = kopf.replace(/<title>[^<]*<\/title>/, `<title>Entwurf ${x.toUpperCase()} „${name}“ – Mainzer Boniblatt</title>`)
    + `<meta name="robots" content="noindex">\n<link rel="stylesheet" href="entwurf/schrift.css">\n<link rel="stylesheet" href="entwurf/${x}.css">\n</head>\n`
    + body + intro
    + `<header id="kopf" class="e-kopf"><div class="blatt kopf-zeile"><span></span><h1 class="marke"><a href="entwurf-${x}.html" title="Zum Anfang">
      <img class="logo-hell" src="bilder/logo-hell.svg" alt="Mainzer Boniblatt" width="919" height="128"></a></h1><span></span></div></header>
<main id="e" class="${x}" data-r="jugendhilfeplanung"></main>
<nav class="e-wahl" aria-label="Entwürfe">${wahl(ALT, x)}</nav>
<script src="entwurf/gemeinsam.js"></script>
<script src="entwurf/${x}.js"></script>
</body>
</html>
`;
  writeFileSync(`docs/entwurf-${x}.html`, html);
}

for (const [x, name] of Object.entries(NEU)) {
  const html = kopf.replace("<html", `<html data-entwurf="${x}"`).replace(/<title>[^<]*<\/title>/, `<title>Entwurf ${x.toUpperCase()} „${name}“ – Mainzer Boniblatt</title>`)
    + `<meta name="robots" content="noindex">\n<link rel="stylesheet" href="entwurf/schrift.css">\n<link rel="stylesheet" href="entwurf/bb.css">\n</head>\n`
    // Das Bildzeichen der Kopfzeile bleibt ganz verdeckt, bis das Intro entfernt ist (statt nur der linke Teil des alten Logos)
    + body + intro.replace('"inset(0 0 0 14.2%)"', '"inset(0 0 0 100%)"')
    + `<header id="kopf" class="e-kopf bb-kopf"><div class="blatt kopf-zeile"><span></span><h1 class="marke bb-marke"><a href="entwurf-${x}.html" title="Zum Anfang">
      <img class="logo-hell" src="bilder/zeichen.svg" alt="" width="128" height="128"><span class="bb-wort">Mainzer <i>Boniblatt</i><b>.</b></span></a></h1><span></span></div></header>
<main id="e" class="bb ${x}" data-r="jugendhilfeplanung"></main>
<nav class="e-wahl" aria-label="Entwürfe">${wahl(NEU, x)}</nav>
<script src="daten/wetter7.js"></script>
<script src="entwurf/gemeinsam.js"></script>
<script src="entwurf/bb.js"></script>
</body>
</html>
`;
  writeFileSync(`docs/entwurf-${x}.html`, html);
}
console.log("Entwürfe gebaut:", [...Object.keys(ALT), ...Object.keys(NEU)].map(x => `entwurf-${x}.html`).join(", "));
