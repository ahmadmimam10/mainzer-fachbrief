#!/usr/bin/env node
// Baut die Entwürfe für den Nachrichtenteil (nur auf dem Zweig entwurf/kacheln): docs/entwurf-a.html, -b.html, -c.html.
// Oben bleibt alles wie auf der echten Seite (Intro und Logo-Kopf aus docs/index.html), darunter kommt je Entwurf ein
// eigener Aufbau aus docs/entwurf/<x>.css und <x>.js. Gemeinsame Teile: docs/entwurf/gemeinsam.js, schrift.css.
//   node werkzeuge/entwurf-bauen.mjs        (vorher node werkzeuge/intro-einbauen.mjs, falls das Intro geändert wurde)
// Ansehen: entwurf-a.html (mit Intro), entwurf-a.html?ohne (ohne Intro), #fruehe-hilfen wählt ein Ressort.
import { readFileSync, writeFileSync } from "node:fs";

const seite = readFileSync("docs/index.html", "utf8");
const kopf = seite.slice(0, seite.indexOf("</head>"));
let intro = seite.match(/<!-- INTRO-START -->[\s\S]*?<!-- INTRO-ENDE -->\n/)[0];
// ?ohne zeigt den Entwurf ohne Intro (für Bilder vom unteren Teil)
intro = intro.replace('if (!(q.has("intro") || (hell && !vonUeber)))', 'if (q.has("ohne") || !(q.has("intro") || (hell && !vonUeber)))');
const body = seite.match(/<body[^>]*>\n/)[0];

const ENTWUERFE = { a: "Druckbogen", b: "Bento", c: "Morgenglas" };
for (const [x, name] of Object.entries(ENTWUERFE)) {
  const wahl = Object.entries(ENTWUERFE).map(([y, n]) => `<a href="entwurf-${y}.html"${y === x ? ' aria-current="page"' : ""}><b>${y.toUpperCase()}</b> ${n}</a>`).join("");
  const html = kopf.replace(/<title>[^<]*<\/title>/, `<title>Entwurf ${x.toUpperCase()} „${name}“ – Mainzer Boniblatt</title>`)
    + `<meta name="robots" content="noindex">\n<link rel="stylesheet" href="entwurf/schrift.css">\n<link rel="stylesheet" href="entwurf/${x}.css">\n</head>\n`
    + body + intro
    + `<header id="kopf" class="e-kopf"><div class="blatt kopf-zeile"><span></span><h1 class="marke"><a href="entwurf-${x}.html" title="Zum Anfang">
      <img class="logo-hell" src="bilder/logo-hell.svg" alt="Mainzer Boniblatt" width="919" height="128"></a></h1><span></span></div></header>
<main id="e" class="${x}" data-r="jugendhilfeplanung"></main>
<nav class="e-wahl" aria-label="Entwürfe">${wahl}</nav>
<script src="entwurf/gemeinsam.js"></script>
<script src="entwurf/${x}.js"></script>
</body>
</html>
`;
  writeFileSync(`docs/entwurf-${x}.html`, html);
  console.log(`docs/entwurf-${x}.html (${name})`);
}
