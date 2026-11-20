// Besondere Tage und kleine Überraschungen im Intro (wird von intro-einbauen.mjs eingebunden).
// – festeFuer() läuft im Browser (wird als Text in die Seite geschrieben) und bestimmt aus Datum, Jahreszeit und Wetter,
//   welche Elemente heute erscheinen. Grundregel: Ein Anlass gilt am Tag selbst und – wenn der Tag frei ist (Wochenende,
//   Feiertag) – schon ab dem letzten Werktag davor, weil der Fachbrief nur werktags erscheint.
// – Die Elemente sind kleine SVG-Zeichnungen an vier Stellen der Szene: Himmel, Stadt, Ufer, Wasser (plus Wimpelkette).
//   Jedes Element ist unsichtbar, bis sein Name in data-fest am Intro steht.

// Schulferien Rheinland-Pfalz (erster und letzter Ferientag; Quelle: KMK-Übersichten, Stand November 2026).
// Für spätere Jahre hier ergänzen – ohne Eintrag entfallen nur Ferienstart und Schulanfang.
export const FERIEN = [
  ["2026-12-23", "2027-01-08", "w"], ["2027-03-22", "2027-04-02", "o"], ["2027-06-28", "2027-08-06", "s"], ["2027-10-04", "2027-10-15", "h"],
  ["2027-12-23", "2028-01-07", "w"], ["2028-04-10", "2028-04-21", "o"], ["2028-07-03", "2028-08-11", "s"], ["2028-10-09", "2028-10-20", "h"],
];

// d: Datum (Ortszeit Mainz, ohne Uhrzeit), zeit: fruehling|sommer|herbst|winter, wetter: sonne|bewoelkt|regen|schnee,
// wuerfel: Zahl 0…1 für die gelegentlichen Überraschungen, ferien: Tabelle oben. Ergebnis: { anlaesse, elemente }.
export function festeFuer(d, zeit, wetter, wuerfel, ferien) {
  const J = d.getFullYear();
  const T = (m, t, j) => new Date(j === undefined ? J : j, m - 1, t);
  const plus = (x, n) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
  const ostern = j => {
    const a = j % 19, b = Math.floor(j / 100), c = j % 100, h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
    const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - c % 4) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(j, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1);
  };
  const O = ostern(J);
  // gesetzliche Feiertage in Rheinland-Pfalz (für „letzter Werktag davor“), auch über den Jahreswechsel
  const feiertage = [T(1, 1), plus(O, -2), plus(O, 1), T(5, 1), plus(O, 39), plus(O, 50), plus(O, 60), T(10, 3), T(11, 1), T(12, 25), T(12, 26), T(1, 1, J + 1), T(12, 25, J - 1), T(12, 26, J - 1)];
  const frei = x => x.getDay() === 0 || x.getDay() === 6 || feiertage.some(f => f.getTime() === x.getTime());
  const werktagBis = x => { let w = x; while (frei(w)) w = plus(w, -1); return w; };
  const zwischen = (von, bis) => d >= von && d <= bis;
  const tag = (x, bis) => zwischen(werktagBis(x), bis || x);
  const datum = t => { const p = t.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };

  const j24 = T(6, 24), johannis = plus(j24, -((j24.getDay() + 2) % 7 || 7));          // Freitag vor dem Johannistag
  const sonntagAug = plus(T(8, 31), -T(8, 31).getDay());                                 // letzter Sonntag im August
  const advent4 = plus(T(12, 24), -T(12, 24).getDay()), advent1 = plus(advent4, -21);
  const muttertag = T(5, 8 + (7 - T(5, 1).getDay()) % 7);
  const ferienstart = (ferien || []).some(f => zwischen(werktagBis(plus(datum(f[0]), -1)), plus(datum(f[0]), 2)));
  const sommerstart = (ferien || []).some(f => f[2] === "s" && zwischen(werktagBis(plus(datum(f[0]), -1)), plus(datum(f[0]), 2)));
  const schulanfang = (ferien || []).some(f => { if (f[2] !== "s") return false; let s = plus(datum(f[1]), 1); while (frei(s)) s = plus(s, 1); return zwischen(s, plus(s, 1)); });

  const liste = [
    ["neujahr", tag(T(1, 1)) || tag(T(12, 31), T(1, 1, J + 1)), ["feuerwerk"]],
    ["dreikoenig", tag(T(1, 6)), ["stern"]],
    ["valentinstag", tag(T(2, 14)), ["herzen"]],
    ["fastnacht", zwischen(plus(O, -52), plus(O, -47)), ["konfetti", "wimpel-fastnacht", "luftballons"]],
    ["ostern", zwischen(werktagBis(plus(O, -2)), plus(O, 1)), ["ostern"]],
    ["maifeiertag", tag(T(5, 1)), ["maibaum"]],
    ["muttertag", tag(muttertag), ["herzen"]],
    ["himmelfahrt", tag(plus(O, 39)), ["heissluftballon"]],
    ["pfingsten", zwischen(werktagBis(plus(O, 49)), plus(O, 50)), ["tauben"]],
    ["fronleichnam", tag(plus(O, 60)), ["wimpel-gelbweiss"]],
    ["kindertag", tag(T(6, 1)), ["luftballons"]],
    ["johannisnacht", zwischen(johannis, plus(johannis, 3)), ["riesenrad", "lichterkette"].concat(d.getTime() === plus(johannis, 3).getTime() ? ["feuerwerk"] : [])],
    ["ferienstart", ferienstart, ["papierflieger"].concat(sommerstart ? ["segelboot"] : [])],
    ["schulanfang", schulanfang, ["schultuete", "luftballons"]],
    ["weinmarkt", zwischen(plus(sonntagAug, -3), sonntagAug) || zwischen(plus(sonntagAug, 4), plus(sonntagAug, 7)), ["lichterkette", "wimpel-wein"]],
    ["weltkindertag", tag(T(9, 20)), ["drachen", "luftballons", "wimpel-bunt"]],
    ["einheit", tag(T(10, 3)), ["fahne"]],
    ["halloween", tag(T(10, 31)), ["kuerbisse", "fledermaeuse"]],
    ["martinstag", tag(T(11, 11)), ["laternen"]],
    ["elfterelfter", d.getTime() === T(11, 11).getTime(), ["konfetti", "wimpel-fastnacht"]],
    ["kinderrechte", tag(T(11, 20)), ["luftballons", "wimpel-bunt"]],
    ["advent", zwischen(werktagBis(advent1), T(12, 23)), ["tannenbaum", "lichterkette"]],
    ["nikolaus", tag(T(12, 6)), ["nikolaus"]],
    ["weihnachten", zwischen(werktagBis(T(12, 24)), T(12, 26)), ["tannenbaum", "lichterkette", "schlitten", "stern"]],
  ];
  const anlaesse = liste.filter(a => a[1]).map(a => a[0]);
  let elemente = [];
  liste.forEach(a => { if (a[1]) a[2].forEach(e => { if (elemente.indexOf(e) < 0) elemente.push(e); }); });

  // Gelegentliche Überraschungen passend zu Jahreszeit und Wetter – nur an gewöhnlichen Tagen, etwa bei jedem dritten Aufruf.
  const hell = wetter === "sonne" || wetter === "bewoelkt";
  const moeglich = ["schwaene", "frachtschiff"]
    .concat(wetter === "sonne" ? ["flugzeug"] : [])
    .concat(wetter === "sonne" && zeit !== "winter" ? ["heissluftballon", "regenbogen"] : [])
    .concat(hell && (zeit === "sommer" || zeit === "fruehling") ? ["segelboot", "schmetterlinge"] : [])
    .concat(hell && zeit === "herbst" ? ["drachen"] : []);
  if (!elemente.length && wuerfel < 0.36) elemente.push(moeglich[Math.floor(wuerfel / 0.36 * moeglich.length) % moeglich.length]);
  if (wetter === "schnee") elemente.push("schneemann");                               // Schnee ist selten: immer mit Schneemann
  return { anlaesse: anlaesse, elemente: elemente, alle: liste.map(a => [a[0], a[2]]) };
}

// ---------------------------------------------------------------------------------------------------------------
// Zeichnungen. Einheiten in Stadt/Ufer/Wasser wie in der Szene (128 = Logobreite, Bandmitte 640, Horizont y = 60 bzw. 0).
const f = n => +n.toFixed(2);
const kreis = (cx, cy, rx, ry = rx) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const BUNT = ["#e9506b", "#f4c542", "#6fb0e6", "#8ccf7e", "#f19a4a", "#b07cd8"];
const FUSS = 58.4;                                   // Oberkante der Kaimauer im Uferband

// ---- Himmel: frei schwebende Elemente, Lage in % der Logofläche (wie die Wolken) ----
const himmel = (name, l, t, g, fx, innen, vb) => `<div class="f f-h f-${name}" style="--l:${l}%;--t:${t}%;--lb:${l < 50 ? l - 58 : l + 58}%;--tb:${f(t * .42)}%;--g:${g};--fx:${fx}"><svg viewBox="${vb}">${innen}</svg></div>`;

const HEISSLUFT = `<g class="f-schweb"><path fill="#d8463f" d="M15 1C6.5 1 1.5 7.2 1.5 14c0 6.4 5 11.6 9.4 17.2h8.2C23.5 25.6 28.5 20.4 28.5 14 28.5 7.2 23.5 1 15 1Z"/><path fill="#f6ead2" d="M15 1c-3 0-5.2 6-5.2 13s2.4 12 3.6 17.2h3.2C17.8 26 20.2 21 20.2 14S18 1 15 1Z"/><path fill="#f2b441" d="M6.6 3.9C4 7 3.4 11 4 15c.7 5 3.9 10.500 7 16.200h-.1C6.500 25.600 1.500 20.400 1.500 14c0-4 1.800-7.700 5.100-10.100ZM23.400 3.900c2.600 3.100 3.200 7.100 2.600 11.100-.7 5-3.900 10.500-7 16.200h.1c4.400-5.600 9.400-10.800 9.400-17.200 0-4-1.800-7.700-5.100-10.100Z"/><path fill="none" stroke="#7a6a58" stroke-width=".4" d="M11.200 31.200l1.400 5M18.800 31.200l-1.400 5M15 31.200v5"/><path fill="#9a744c" d="M12.100 36.200h5.800v4.300a1 1 0 0 1-1 1h-3.800a1 1 0 0 1-1-1Z"/><path fill="#7d5c3a" d="M12.100 36.200h5.800v1.100h-5.800Z"/></g>`;

const REGENBOGEN = ["#e98a8a", "#f0b97a", "#f1dd86", "#a9d49a", "#93bfe3", "#b5a2dd"].map((c, i) => `<circle cx="100" cy="100" r="${f(96 - i * 3.1)}" fill="none" stroke="${c}" stroke-width="3.2"/>`).join("");

const funken = (farbe, farbe2) => {
  let t = "";
  for (let i = 0; i < 14; i++) { const w = i * 360 / 14; t += `<path transform="rotate(${f(w)})" d="M0 -6v-9.500" stroke="${i % 2 ? farbe2 : farbe}" stroke-width="${i % 2 ? .7 : 1}" stroke-linecap="round"/><circle transform="rotate(${f(w + 12)})" cx="0" cy="-18.500" r=".8" fill="${farbe}"/>`; }
  return `<g class="f-funke">${t}<circle r="1.600" fill="#fff"/></g>`;
};

const STERN = `<path class="f-schweif" fill="#f6d77a" opacity=".55" d="M12 12L46 19 44 23Z"/><path class="f-blink" fill="#f4c542" d="M12 1l2.400 7.200L21 6l-4.600 5.600L23 14l-7 .800L18 22l-5.200-5L9 23l.400-7.500L2 15.800l6.400-3.400L4 6.600l6.400 1.800Z"/>`;

const SCHLITTEN = (() => {
  const ren = x => `<ellipse cx="${x}" cy="9" rx="4" ry="1.700"/><circle cx="${x + 4.800}" cy="6.200" r="1.250"/><path d="M${x + 3.400} 8l1.400-1.800" stroke-width="1.300"/><path d="M${x + 4.600} 5.200l-.900-2.600m0 1.100l-1.300-.700M${x + 5.200} 5.100l.700-2.700m-.200 1.200l1.200-.800M${x - 2.600} 10l-2 3.600M${x - 1.400} 10.400l-.600 3.800M${x + 2.400} 10.400l2 3.200M${x + 3.300} 9.800l3.400 2.400" stroke-width=".7" fill="none"/>`;
  return `<g fill="#3d3934" stroke="#3d3934" stroke-linecap="round">${ren(9)}${ren(22)}<path d="M27.500 8.600l11 .800" stroke-width=".4" fill="none"/><path stroke="none" d="M38 8h13.500c1.400 0 2.300-1 2.300-2.400V3.800h1.800V6.800c0 2.900-1.900 4.800-4.800 4.800H40.600Z"/><path d="M36.500 14.200h16.500c1.700 0 2.900-.900 3.400-2.300M42 11.600v2.600M50 11.600v2.600" stroke-width=".8" fill="none"/><circle cx="47.200" cy="4.400" r="1.900" stroke="none"/><path stroke="none" d="M43.800 8l1-3.200h4.800l1 3.200Z"/></g><path fill="#d6243a" d="M45.600 3.200c.6-1.900 2.400-2.800 4.600-2.400-1 .5-1.500 1.300-1.400 2.600Z"/><circle cx="50.400" cy=".900" r=".750" fill="#fff"/><path fill="#c8102e" d="M52 4.200l2.600-1.600v3.400H52Z"/>`;
})();

const DRACHEN = `<g class="f-wind"><path fill="#e9506b" d="M15 2l9 11-9 0Z"/><path fill="#f4c542" d="M15 2 6 13h9Z"/><path fill="#6fb0e6" d="M6 13l9 15V13Z"/><path fill="#f19a4a" d="M24 13l-9 15V13Z"/><path fill="none" stroke="#6b6156" stroke-width=".4" d="M15 2v26M6 13h18"/><path fill="none" stroke="#6b6156" stroke-width=".45" d="M15 28c-3 4 3 7-.5 11s2.500 6.500-1.500 10"/><path fill="#6fb0e6" d="M13.200 33.200l3.200 1.200-3 1.600ZM16.500 40.800l-3.300 1 3.100 1.800Z"/><path fill="#e9506b" d="M12.200 47.400l3.200.600-2.600 2Z"/></g>`;

const LUFTBALLONS = (() => {
  const b = [[12, 11, 0], [22, 7.500, 1], [31, 13, 2], [17, 20, 3], [26.500, 22, 4]];
  return `<g class="f-schweb"><path fill="none" stroke="#857d70" stroke-width=".3" d="${b.map(([x, y]) => `M${x} ${y + 6.400}L21.500 56`).join("")}"/>${b.map(([x, y, c]) => `<path fill="${BUNT[c]}" d="${kreis(x, y, 5, 6.200)}M${x - .9} ${y + 6}h1.800l.500 1.500h-2.800Z"/><ellipse cx="${x - 1.700}" cy="${y - 2.300}" rx="1.100" ry="1.800" fill="#fff" opacity=".45" transform="rotate(-24 ${x - 1.700} ${y - 2.300})"/>`).join("")}</g>`;
})();

const HERZ = "M6 10.400C1.200 6.600 0 4.600 0 3 0 1.300 1.300 0 3 0c1.200 0 2.300.700 3 1.800C6.700.700 7.800 0 9 0c1.700 0 3 1.300 3 3 0 1.600-1.200 3.600-6 7.400Z";
const FLIEGER = `<path fill="#fdfcf9" stroke="#8f9aa3" stroke-width=".4" stroke-linejoin="round" d="M0 5.200 24 0 14.500 12l-3.200-4.600Z"/><path fill="#d5dbe0" d="M11.300 7.400 14.500 12l1.400-6.500Z"/><path fill="none" stroke="#8f9aa3" stroke-width=".35" d="M24 0 11.300 7.400"/>`;
const FLUGZEUG = `<defs><linearGradient id="f-streif" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs><path fill="url(#f-streif)" d="M0 2.400h70v1.200H0Z"/><path fill="#8f9aa3" d="M70 2.300h7.200c1.400 0 2.400.300 2.800.700-.400.400-1.400.700-2.800.700H70ZM72.400 2.400l-2-2h1.400l3 2ZM72.400 3.600l-2 2h1.400l3-2Z"/>`;
const FALTER = farbe => `<g class="f-flatter"><path fill="${farbe}" d="M6 5C4 1 1 .500.600 2.600.300 4.400 2.600 5.400 6 5ZM6 5c-2.600.400-4.400 1.600-3.800 3.200C2.800 9.600 5 8.600 6 5ZM6 5C8 1 11 .500 11.400 2.600 11.700 4.400 9.400 5.400 6 5ZM6 5c2.600.400 4.400 1.600 3.800 3.200C9.200 9.600 7 8.600 6 5Z"/><path stroke="#4a443d" stroke-width=".5" stroke-linecap="round" d="M6 3.200v4.400"/></g>`;
const FLEDER = `<path fill="#3d3934" d="M16 5.200l1-2 .800 1.600c2.600-1.600 6.200-2 9.800-.600 1.800.700 3.200 1.800 4.400 3.200-1.600-.600-3-.500-4 .500-1.200-1-2.600-1-3.600.200-1-1.100-2.400-1.200-3.400-.100-.900 1-1.600 2.300-2 3.800l-1 1.400-1-1.400c-.400-1.500-1.100-2.800-2-3.800-1-1.100-2.400-1-3.400.100-1-1.200-2.400-1.200-3.600-.200-1-1-2.400-1.100-4-.500 1.200-1.400 2.600-2.500 4.400-3.200 3.600-1.400 7.200-1 9.800.600l.800-1.600Z"/>`;

export const FEST_HIMMEL = [
  `<div class="f f-regenbogen"><svg viewBox="0 0 200 100">${REGENBOGEN}</svg></div>`,
  himmel("heissluftballon", 108, -76, .2, "34vw", HEISSLUFT, "0 0 30 43"),
  himmel("feuerwerk", -36, -42, .5, "-30vw", funken("#f4c542", "#fff3c4"), "-20 -20 40 40"),
  himmel("feuerwerk f2", 88, -64, .46, "30vw", funken("#e9506b", "#ffd0d6"), "-20 -20 40 40"),
  himmel("feuerwerk f3", 27, -72, .34, "0vw", funken("#6fb0e6", "#e1f0fb"), "-20 -20 40 40"),
  himmel("stern", 84, -60, .34, "26vw", STERN, "0 0 48 26"),
  `<div class="f f-h f-schlitten" style="--t:-58%;--tb:-25%;--g:.5;--fx:0vw"><svg viewBox="0 0 58 16">${SCHLITTEN}</svg></div>`,
  himmel("drachen", -24, -66, .16, "-30vw", DRACHEN, "0 0 30 52"),
  himmel("luftballons", 106, -62, .22, "32vw", LUFTBALLONS, "0 0 43 57"),
  ...[[-30, -22, .1, 0], [-8, -56, .07, 1.4], [104, -44, .09, .7], [122, -10, .07, 2.1], [58, -72, .06, 2.8]].map(([l, t, g, v], i) =>
    himmel("herzen", l, t, g, (l < 50 ? "-" : "") + "24vw", `<path class="f-steig" style="animation-delay:${v}s" fill="${i % 2 ? "#f29bb0" : "#e9506b"}" d="${HERZ}"/>`, "0 0 12 11")),
  `<div class="f f-h f-papierflieger" style="--l:-46%;--t:-18%;--tb:-8%;--g:.15;--fx:0vw"><svg viewBox="0 0 24 12">${FLIEGER}</svg></div>`,
  `<div class="f f-h f-papierflieger p2" style="--l:-70%;--t:-46%;--tb:-20%;--g:.1;--fx:0vw"><svg viewBox="0 0 24 12">${FLIEGER}</svg></div>`,
  `<div class="f f-h f-flugzeug" style="--l:-20%;--t:-66%;--lb:-90%;--tb:-30%;--g:.62;--fx:0vw"><svg viewBox="0 0 80 6">${FLUGZEUG}</svg></div>`,
  ...[[-26, -6, .12], [98, -22, .1], [118, 8, .08], [8, -42, .07]].map(([l, t, g]) => himmel("fledermaeuse", l, t, g, (l < 50 ? "-" : "") + "40vw", `<g class="f-flatter2">${FLEDER}</g>`, "0 0 32 14")),
].join("\n      ");

// vor der Stadt, hinter dem Logo
export const FEST_VORN = [[-24, 40, "#f19a4a"], [108, 43, "#f4c542"], [127, 35, "#7fb4e6"], [-4, 47, "#e9506b"]]
  .map(([l, t, c], i) => `<div class="f f-h f-schmetterlinge" style="--l:${l}%;--t:${t}%;--g:.062;--fx:${l < 50 ? "-" : ""}30vw"><svg viewBox="0 0 12 10" class="f-gaukel" style="animation-delay:${-i * 1.7}s">${FALTER(c)}</svg></div>`).join("\n      ");

// ---- Stadtband: Nikolausmütze auf der Kuppel der Christuskirche (Kuppelmitte x = 550, Laterne bis y ≈ 27.5) ----
export const FEST_STADT = `<g class="f f-nikolaus"><path fill="#d6243a" d="M547.700 27.900Q548.800 22.300 552.900 21.900Q551.500 24.300 552.300 27.900Z"/><path fill="#fff" d="M547.200 27.500h5.600a.650 .650 0 0 1 0 1.300h-5.600a.650 .650 0 0 1 0-1.300Z"/><circle cx="553.100" cy="21.800" r=".850" fill="#fff"/></g>`;

// ---- Uferband ----
const lichterkette = (() => {
  let schnur = "", birnen = "";
  const farben = ["#f6cf6a", "#f4a25a", "#fff1c2", "#f6cf6a"];
  for (let x = 14 + 27 * 12; x < 950; x += 27) {
    schnur += `M${x + .650} 54.200q13.500 3.600 27 0`;
    for (let i = 1; i <= 5; i++) { const t = i / 6, bx = x + .650 + 27 * t, by = 54.200 + 2 * t * (1 - t) * 3.600 + .350; birnen += `<circle cx="${f(bx)}" cy="${f(by)}" r=".800" fill="${farben[i % 4]}" style="animation-delay:${f(-((x + i * 7) % 23) / 10)}s"/>`; }
  }
  return `<g class="f f-lichterkette"><path fill="none" stroke="#6b6156" stroke-width=".26" d="${schnur}"/>${birnen}</g>`;
})();

const tannenbaum = (() => {
  const auf = `<g transform="translate(556 58.4) scale(1.18) translate(-556 -58.4)">`;
  const lichter = [[556, 40.500], [553.800, 44.800], [558.300, 46.300], [552.200, 50.200], [556.400, 50.800], [560.400, 52.200], [550.200, 54.800], [554.600, 55.200], [558.800, 55.600], [562.400, 54.900]];
  return `<g class="f f-tannenbaum">${auf}<path fill="#7a5a3c" d="M555.100 56h1.800v2.400h-1.800Z"/><path fill="#3f7a52" d="M556 36l5.500 8H559l4.800 7.500h-3l5 5.100h-19.600l5-5.100h-3L553 44h-2.500Z"/><path fill="#356a47" d="M556 36l5.500 8H559l4.800 7.500h-3l5 5.100H556Z" opacity=".55"/>${lichter.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r=".550" fill="${["#f4c542", "#e9506b", "#fff", "#8ec5f0"][i % 4]}" style="animation-delay:${-i * .37}s"/>`).join("")}<path class="f-blink" fill="#f4c542" d="M556 32.400l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9Z"/></g></g>`;
})();

const maibaum = `<g class="f f-maibaum"><path fill="#cdbb9d" d="M555.600 28.500h.800v29.900h-.800Z"/><path fill="#6fa55f" d="${kreis(556, 27.600, 1.900, 2.300)}"/><ellipse cx="556" cy="35.500" rx="4.400" ry="1.300" fill="none" stroke="#5f9a57" stroke-width="1"/><g class="f-baender" fill="none" stroke-width=".55" stroke-linecap="round"><path stroke="#e9506b" d="M552 35.800q-1.400 5 .600 9.400"/><path stroke="#6fb0e6" d="M554.400 36.700q-.800 4.600.400 8.800"/><path stroke="#f4c542" d="M557.600 36.700q.800 4.600-.400 8.800"/><path stroke="#fff" d="M560 35.800q1.400 5-.600 9.400"/></g></g>`;

const riesenrad = (() => {
  const cx = 716, cy = 41.500, r = 13.500; let sp = "", go = "";
  for (let i = 0; i < 12; i++) { const w = i * Math.PI / 6, x = cx + Math.cos(w) * r, y = cy + Math.sin(w) * r; sp += `M${cx} ${cy}L${f(x)} ${f(y)}`; go += `<circle cx="${f(x)}" cy="${f(y)}" r="1.450" fill="${["#e9506b", "#f4c542", "#6fb0e6", "#fdfcf9"][i % 4]}" stroke="#6b6156" stroke-width=".2"/>`; }
  return `<g class="f f-riesenrad"><path fill="none" stroke="#857d70" stroke-width=".7" stroke-linecap="round" d="M${cx} ${cy}L${cx - 6.500} ${FUSS}M${cx} ${cy}L${cx + 6.500} ${FUSS}M${cx - 7.800} ${FUSS}h15.600"/><g class="f-rad"><path fill="none" stroke="#8a8276" stroke-width=".4" d="${sp}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#6f675c" stroke-width=".8"/><circle cx="${cx}" cy="${cy}" r="${r - 2.300}" fill="none" stroke="#9c9488" stroke-width=".25"/>${go}</g><circle cx="${cx}" cy="${cy}" r="1.300" fill="#c8102e"/></g>`;
})();

const schultuete = (x, farbe, farbe2, neig) => `<g transform="rotate(${neig} ${x} ${FUSS})"><path fill="${farbe}" d="M${x} ${FUSS}l-3.300-11.600h6.600Z"/><path fill="${farbe2}" d="${kreis(x - 2, 46.300, 1.500)}${kreis(x, 45.700, 1.700)}${kreis(x + 2, 46.300, 1.500)}"/><path fill="#fff" opacity=".9" d="${kreis(x - .900, 50, .450)}${kreis(x + .800, 52.200, .400)}${kreis(x - .200, 54.600, .350)}"/><path fill="none" stroke="#f4c542" stroke-width=".4" d="M${x - 2.900} 47.800h5.800"/></g>`;

const kuerbis = (x, g, gesicht) => `<path fill="#6f8f4e" d="M${f(x - .200 * g)} ${f(FUSS - 2.900 * g)}h${f(.5 * g)}v${f(.800 * g)}h${f(-.5 * g)}Z"/><path fill="#e8862c" d="${kreis(x, FUSS - 1.250 * g, 1.900 * g, 1.300 * g)}"/><path fill="none" stroke="#c96a1e" stroke-width="${f(.16 * g)}" d="M${f(x)} ${f(FUSS - 2.500 * g)}v${f(2.450 * g)}M${f(x - .900 * g)} ${f(FUSS - 2.300 * g)}q${f(-.600 * g)} ${f(1.100 * g)} 0 ${f(2.100 * g)}M${f(x + .900 * g)} ${f(FUSS - 2.300 * g)}q${f(.600 * g)} ${f(1.100 * g)} 0 ${f(2.100 * g)}"/>`
  + (gesicht ? `<path class="f-glimm" fill="#ffe27a" d="M${f(x - 1 * g)} ${f(FUSS - 1.500 * g)}l${f(.450 * g)} ${f(-.650 * g)}l${f(.450 * g)} ${f(.650 * g)}ZM${f(x + .100 * g)} ${f(FUSS - 1.500 * g)}l${f(.450 * g)} ${f(-.650 * g)}l${f(.450 * g)} ${f(.650 * g)}ZM${f(x - .950 * g)} ${f(FUSS - .950 * g)}h${f(1.900 * g)}l${f(-.450 * g)} ${f(.550 * g)}h${f(-1 * g)}Z"/>` : "");

const laternen = (() => {
  const r = zufall(41); let t = "";
  const kind = (x, g, farbe, links) => {
    const s = links ? -1 : 1, kx = x + s * 2.100 * g, ky = FUSS - 5.400 * g;
    return `<path fill="#4f463e" d="M${f(x - 1.050 * g)} ${FUSS}L${f(x - .650 * g)} ${f(FUSS - 3 * g)}h${f(1.300 * g)}L${f(x + 1.050 * g)} ${FUSS}Z${kreis(x, FUSS - 3.750 * g, .800 * g)}"/><path fill="none" stroke="#4f463e" stroke-width="${f(.22 * g)}" stroke-linecap="round" d="M${f(x + s * .500 * g)} ${f(FUSS - 2.400 * g)}L${f(kx)} ${f(ky)}v${f(.700 * g)}"/><circle class="f-glimm" cx="${f(kx)}" cy="${f(ky + 2 * g)}" r="${f(2.600 * g)}" fill="${farbe}" opacity=".22"/><path fill="${farbe}" stroke="#a8693a" stroke-width=".1" d="${kreis(kx, ky + 2 * g, 1.150 * g, 1.350 * g)}"/><path fill="#fff6d0" opacity=".7" d="${kreis(kx, ky + 2.100 * g, .450 * g, .700 * g)}"/>`;
  };
  for (const x of [528, 539, 550, 561, 572, 583, 694, 705, 716, 727, 738, 749]) t += kind(x + r() * 2, 1.2 + r() * .55, ["#f6b44a", "#ee7b52", "#f3d36a", "#f29a8a"][Math.floor(r() * 4)], r() < .5);
  return `<g class="f f-laternen">${t}</g>`;
})();

const ostern = (() => {
  const r = zufall(77); let eier = "";
  for (const x of [528, 536, 544, 566, 574, 582, 590, 690, 698, 722, 730, 738, 747, 755]) { const ex = x + r() * 2, c = BUNT[Math.floor(r() * BUNT.length)]; eier += `<path fill="${c}" d="${kreis(ex, FUSS - 1.600, 1.300, 1.700)}"/><path stroke="#fff" stroke-width=".36" opacity=".85" d="M${f(ex - 1.150)} ${f(FUSS - 1.500)}h2.300"/>`; }
  const hase = `<g fill="#b7a085"><ellipse cx="710.200" cy="56.800" rx="2.100" ry="1.650"/><circle cx="712.100" cy="54.900" r="1.200"/><ellipse cx="711.700" cy="52.800" rx=".400" ry="1.500" transform="rotate(-8 711.700 52.800)"/><ellipse cx="712.700" cy="52.900" rx=".400" ry="1.500" transform="rotate(10 712.700 52.900)"/></g><circle cx="708.200" cy="57" r=".650" fill="#fff"/><circle cx="712.550" cy="54.700" r=".200" fill="#3d3934"/>`;
  return `<g class="f f-ostern">${eier}<g transform="translate(710 58.4) scale(1.9) translate(-710 -58.4)">${hase}</g></g>`;
})();

const schneemann = `<g class="f f-schneemann"><g transform="translate(708 58.4) scale(1.55) translate(-708 -58.4)"><g fill="#fdfdfd" stroke="#b3c0cc" stroke-width=".2"><circle cx="708" cy="56.300" r="2.300"/><circle cx="708" cy="53" r="1.700"/><circle cx="708" cy="50.500" r="1.250"/></g><path fill="#3d3934" d="M706.600 49.500h2.800v.400h-2.800ZM707 47.500h2v2h-2Z"/><path fill="#e8862c" d="M708 50.500l1.900.350-1.900.300Z"/><path fill="none" stroke="#d6243a" stroke-width=".5" stroke-linecap="round" d="M706.900 51.600h2.200M708.900 51.600l.500 1.500"/><path fill="none" stroke="#7a6a58" stroke-width=".25" stroke-linecap="round" d="M706.400 52.800l-2.200-1.200M709.600 52.800l2.200-1.300"/><path fill="#3d3934" d="${kreis(707.550, 50.250, .16)}${kreis(708.450, 50.250, .16)}${kreis(708, 52.500, .18)}${kreis(708, 53.500, .18)}"/></g></g>`;

const fahne = `<g class="f f-fahne"><path fill="#b9b1a3" d="M555.700 37h.6v21.400h-.6Z"/><circle cx="556" cy="36.800" r=".500" fill="#f4c542"/><g class="f-wehen"><path fill="#1c1b1a" d="M556.300 37.800q2.400-.900 4.800 0t4.800 0v1.900q-2.400.900-4.800 0t-4.800 0Z"/><path fill="#d6243a" d="M556.300 39.700q2.400-.900 4.800 0t4.800 0v1.900q-2.400.900-4.800 0t-4.800 0Z"/><path fill="#f4c542" d="M556.300 41.600q2.400-.900 4.800 0t4.800 0v1.900q-2.400.900-4.800 0t-4.800 0Z"/></g></g>`;

export const FEST_UFER = [
  lichterkette, tannenbaum, maibaum, riesenrad, fahne,
  `<g class="f f-schultuete"><g transform="translate(561 58.4) scale(1.45) translate(-561 -58.4)">${schultuete(561, "#e9506b", "#f8c7d2", 14)}</g><g transform="translate(706 58.4) scale(1.45) translate(-706 -58.4)">${schultuete(706, "#4f8fd0", "#cfe4f6", -12)}</g></g>`,
  `<g class="f f-kuerbisse">${kuerbis(545, 1.900, true)}${kuerbis(552.500, 1.250)}${kuerbis(568.500, 1.550, false)}${kuerbis(577, 2.100, true)}${kuerbis(697.500, 1.400)}${kuerbis(708, 2, true)}${kuerbis(716.500, 1.200)}</g>`,
  laternen, ostern, schneemann,
].join("");

// ---- Wasser (y = 0 ist der Horizont) ----
export const FEST_WASSER = [
  `<g class="f f-segelboot"><g transform="translate(548 4.2) scale(1.45) translate(-548 -4.2)"><g class="f-schaukel"><path fill="#fdfcf9" stroke="#8f9aa1" stroke-width=".2" d="M543 3.300h10.400l-1.500 1.900h-7.400Z"/><path stroke="#7d756a" stroke-width=".25" d="M548 3.300V-7"/><path fill="#fdfcf9" stroke="#b9c2c9" stroke-width=".15" d="M548.400-6.600V2.600h5.800Z"/><path fill="#e9506b" d="M547.600-5V2.600h-3.800Z"/></g><path class="s-spiegel" d="M544 5.900h8M546 6.800h4.600"/></g></g>`,
  `<g class="f f-schwaene"><g class="f-treib">${[[561, 3.400, 1.9], [570.500, 4.800, 1.5]].map(([x, y, g]) => `<path fill="#fdfdfd" stroke="#9fb0bb" stroke-width=".15" d="M${f(x - 1.700 * g)} ${y}q${f(.500 * g)} ${f(-1 * g)} ${f(2 * g)} ${f(-.800 * g)}q${f(1.200 * g)} ${f(.200 * g)} ${f(1.400 * g)} ${f(.800 * g)}q${f(-1.700 * g)} ${f(.700 * g)} ${f(-3.400 * g)} 0Z"/><path fill="none" stroke="#fdfdfd" stroke-width="${f(.5 * g)}" stroke-linecap="round" d="M${f(x + 1.400 * g)} ${f(y - .300 * g)}q${f(.900 * g)} ${f(-.800 * g)} ${f(.300 * g)} ${f(-1.500 * g)}q${f(-.400 * g)} ${f(-.500 * g)} ${f(.300 * g)} ${f(-.700 * g)}"/><path fill="#e8862c" d="M${f(x + 2.050 * g)} ${f(y - 2.600 * g)}l${f(.800 * g)} ${f(.250 * g)}l${f(-.800 * g)} ${f(.150 * g)}Z"/>`).join("")}</g></g>`,
  `<g class="f f-frachtschiff"><g class="f-treib2"><path fill="#55626e" d="M538 2.900h36.500l-1.300 2.300h-33.500Z"/><path fill="#a8432f" d="M538.700 4.300h34.900l-.5.900h-33.700Z"/><path fill="#c9704a" d="M542 1.300h5.600v1.600H542Z"/><path fill="#5f8fb5" d="M548 1.300h5.600v1.600H548Z"/><path fill="#d9b45a" d="M554 1.300h5.600v1.600H554Z"/><path fill="#7f9a78" d="M560 1.300h5.600v1.600H560Z"/><path fill="#fdfcf9" stroke="#8f9aa1" stroke-width=".15" d="M567.600.300h4.400v2.600h-4.400Z"/><path fill="#7f8f99" d="M568.300.800h3v.700h-3Z"/><path stroke="#7d756a" stroke-width=".2" d="M569.800.300v-1.500"/></g></g>`,
].join("");

const packe = t => t.replace(/[%#<>]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
// ---- Wimpelkette am oberen Bildrand (als gekachelter Hintergrund) ----
const wimpel = farben => {
  let t = `<path d='M0 3Q60 13 120 3Q180 13 240 3' fill='none' stroke='#6b6156' stroke-width='.8'/>`;
  for (let i = 0; i < 10; i++) { const u = (i + .5) / 5 % 1, x = (i + .5) * 24, y = 3 + 2 * u * (1 - u) * 10; t += `<path d='M${f(x - 6.500)} ${f(y - .300)}h13l-6.500 14Z' fill='${farben[i % farben.length]}'/>`; }
  return `url("data:image/svg+xml,${packe(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='26' viewBox='0 0 240 26'>${t}</svg>`)}")`;
};
const konfetti = (w, h, n, seed) => {
  const r = zufall(seed), farben = ["#d6243a", "#2c5aa8", "#f4c542", "#fdfcf9", "#3c9a5f"]; let t = "";
  for (let i = 0; i < n; i++) { const x = f(8 + r() * (w - 16)), y = f(8 + r() * (h - 16)), c = farben[Math.floor(r() * farben.length)], w0 = Math.round(r() * 180); t += r() < .5 ? `<rect x='${x}' y='${y}' width='5' height='2.600' fill='${c}' stroke='#000' stroke-opacity='.08' stroke-width='.3' transform='rotate(${w0} ${x} ${y})'/>` : `<circle cx='${x}' cy='${y}' r='2' fill='${c}' stroke='#000' stroke-opacity='.08' stroke-width='.3'/>`; }
  return `url("data:image/svg+xml,${packe(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${t}</svg>`)}")`;
};

export const FEST_BUEHNE = `<div class="f f-wimpel" aria-hidden="true"></div>`;

const NAMEN = ["regenbogen", "heissluftballon", "feuerwerk", "stern", "schlitten", "drachen", "luftballons", "herzen", "papierflieger", "flugzeug", "fledermaeuse", "schmetterlinge",
  "nikolaus", "lichterkette", "tannenbaum", "maibaum", "riesenrad", "fahne", "schultuete", "kuerbisse", "laternen", "ostern", "schneemann", "segelboot", "schwaene", "frachtschiff"];

export const FEST_CSS = `/* Besondere Tage und Überraschungen: unsichtbar, bis der Name in data-fest steht */
.f{display:none}
${NAMEN.map(n => `.intro[data-fest~="${n}"] .f-${n}`).join(",")}{display:block}
.f-h{position:absolute;left:var(--l);top:var(--t);width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx,0vw)) calc(var(--e,0) * -10vh);opacity:calc(1 - var(--p,0) * 1.8)}
@media (min-aspect-ratio:1/1){.f-h{left:var(--lb,var(--l));top:var(--tb,var(--t))}}
.f-h>svg{width:100%;height:auto;overflow:visible;animation:i-ein 1.2s ease 1.6s both}
.f-h>svg,.intro[data-fest] .f-h>svg{display:block}
.f-schweb{animation:f-schweb 6s ease-in-out infinite alternate}
.f-regenbogen{position:absolute;left:104%;bottom:39.45%;width:calc(var(--L) * 2.7);opacity:calc(.5 - var(--p,0) * 1.2);translate:0 calc(var(--e,0) * 30vh)}
.f-regenbogen svg{display:block;width:100%;height:auto;animation:i-ein 2.4s ease 1.8s both}
.f-funke{transform-box:fill-box;transform-origin:50% 50%;animation:f-funke 2.6s cubic-bezier(.1,.7,.2,1) infinite}
.f2 .f-funke{animation-delay:.9s}.f3 .f-funke{animation-delay:1.7s}
.f-blink{transform-box:fill-box;transform-origin:50% 50%;animation:f-blink 1.8s ease-in-out infinite alternate}
.f-schlitten.f-schlitten{left:50%;margin-left:calc(var(--L) * -.25)}
.f-schlitten>svg{animation:i-ein 1s ease 1.6s both,f-fahrt 16s linear 1.6s infinite}
.f-wind{transform-box:fill-box;transform-origin:50% 0;animation:f-wind 4.6s ease-in-out infinite alternate}
.f-steig{animation:f-steig 5.5s ease-in infinite}
.f-papierflieger>svg{animation:i-ein .6s ease 1.8s both,f-gleit 11s ease-in-out 1.8s infinite}
.f-papierflieger.p2>svg{animation:i-ein .6s ease 3s both,f-gleit 15s ease-in-out 3.4s infinite}
.f-flugzeug>svg{animation:i-ein 2s ease 1.6s both,f-zug 60s linear infinite}
.f-flatter{transform-box:fill-box;transform-origin:50% 50%;animation:f-flatter .32s ease-in-out infinite alternate}
.f-h>svg.f-gaukel{animation:i-ein 1s ease 1.8s both,f-gaukel 9s ease-in-out infinite alternate}
.f-flatter2{transform-box:fill-box;transform-origin:50% 40%;animation:f-flatter2 .28s ease-in-out infinite alternate}
.intro[data-fest~="fledermaeuse"] .i-vogel{display:none}
.intro[data-fest~="tauben"] .i-vogel path{fill:#fdfdfd;stroke:#8f9aa3;stroke-width:.7}
.f-lichterkette circle,.f-tannenbaum circle{animation:f-blink2 1.6s ease-in-out infinite alternate}
.f-baender{transform-box:fill-box;transform-origin:50% 0;animation:f-wind 3.4s ease-in-out infinite alternate}
.f-rad{transform-box:view-box;transform-origin:716px 41.5px;animation:i-drehen 48s linear infinite}
.f-glimm{animation:f-blink2 2.2s ease-in-out infinite alternate}
.f-wehen{transform-box:fill-box;transform-origin:0 50%;animation:f-wehen 1.7s ease-in-out infinite alternate}
.f-schaukel{transform-box:fill-box;transform-origin:50% 100%;animation:f-wind 3.8s ease-in-out infinite alternate}
.f-segelboot{animation:i-schiff 80s ease-in-out infinite alternate-reverse}
.f-treib{animation:f-treib 26s ease-in-out infinite alternate}
.f-treib2{animation:f-treib2 120s linear infinite alternate}
.f-segelboot .s-spiegel{fill:none;stroke:#fff;stroke-width:.5;opacity:.8}
.intro[data-fest~="frachtschiff"] .i-schiff{display:none}
.f-wimpel{position:absolute;left:0;right:0;top:0;height:26px;z-index:1;pointer-events:none;background-repeat:repeat-x;background-position:50% 0;opacity:calc(1 - var(--p,0) * 3);animation:f-herab .9s cubic-bezier(.2,.9,.3,1.2) 1.4s both}
.intro[data-fest~="wimpel-fastnacht"] .f-wimpel{display:block;background-image:${wimpel(["#d6243a", "#fdfcf9", "#2c5aa8", "#f4c542"])}}
.intro[data-fest~="wimpel-bunt"] .f-wimpel{display:block;background-image:${wimpel(BUNT)}}
.intro[data-fest~="wimpel-gelbweiss"] .f-wimpel{display:block;background-image:${wimpel(["#f4c542", "#fdfcf9"])}}
.intro[data-fest~="wimpel-wein"] .f-wimpel{display:block;background-image:${wimpel(["#8e2f4a", "#f3ead2", "#7f9a52"])}}
.intro.intro[data-fest~="konfetti"] .n3{display:block;background-image:${konfetti(260, 520, 16, 31)};--kx:260px;--ky:520px;--kr:0;--kd:6.5s;opacity:1}
.intro.intro[data-fest~="konfetti"] .n4{display:block;background-image:${konfetti(200, 400, 12, 37)};--kx:200px;--ky:400px;--kr:0;--kd:9s;opacity:.9}
.intro[data-fest~="konfetti"]{--wieg:18px}
@keyframes f-schweb{from{transform:translateY(-3%)}to{transform:translateY(3%)}}
@keyframes f-funke{0%{transform:scale(.05);opacity:0}8%{opacity:1}55%{opacity:1}100%{transform:scale(1);opacity:0}}
@keyframes f-blink{from{transform:scale(.86);opacity:.8}to{transform:scale(1.08);opacity:1}}
@keyframes f-blink2{from{opacity:.45}to{opacity:1}}
@keyframes f-fahrt{from{transform:translateX(60vw)}to{transform:translateX(-80vw)}}
@keyframes f-wind{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
@keyframes f-steig{0%{transform:translateY(40%) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-260%) scale(1.1);opacity:0}}
@keyframes f-gleit{0%{transform:translate(-20vw,0) rotate(6deg);opacity:0}6%{opacity:1}50%{transform:translate(45vw,-9vh) rotate(-10deg)}94%{opacity:1}100%{transform:translate(120vw,-3vh) rotate(4deg);opacity:0}}
@keyframes f-zug{from{transform:translateX(-30vw)}to{transform:translateX(70vw)}}
@keyframes f-flatter{from{transform:scaleX(1)}to{transform:scaleX(.25)}}
@keyframes f-flatter2{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
@keyframes f-gaukel{0%{transform:translate(0,0)}25%{transform:translate(160%,-90%)}50%{transform:translate(40%,-190%)}75%{transform:translate(-140%,-80%)}100%{transform:translate(60%,30%)}}
@keyframes f-wehen{from{transform:skewY(-5deg)}to{transform:skewY(5deg) scaleX(.94)}}
@keyframes f-treib{from{transform:translateX(-5px)}to{transform:translateX(7px)}}
@keyframes f-treib2{from{transform:translateX(4px)}to{transform:translateX(-52px)}}
@keyframes f-herab{from{transform:translateY(-110%)}}`;
