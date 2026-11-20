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
const FUNKEL = "M0 -1.6L.42 -.42L1.6 0L.42 .42L0 1.6L-.42 .42L-1.6 0L-.42 -.42Z";   // vierzackiger Funkelstern
const am = (x, y, mass, innen, kl = "") => `<g transform="translate(${x} ${y}) scale(${mass})">${kl ? `<g class="${kl}">${innen}</g>` : innen}</g>`;

// ---- Himmel: frei schwebende Elemente. Lage in % der Logofläche; auf breiten Bildschirmen rücken sie seitlich neben
//      den Dom (--lb/--tb), weil dort über dem Logo die Höhe fehlt ----
const himmel = (name, l, t, g, fx, innen, vb) => `<div class="f f-h f-${name}" style="--l:${l}%;--t:${t}%;--lb:${l < 50 ? l - 58 : l + 58}%;--tb:${f(t * .42)}%;--g:${g};--fx:${fx}"><svg viewBox="${vb}">${innen}</svg></div>`;

// Heißluftballon: Hülle aus Bahnen, Bauchbinde, Glanzlicht, Brenner mit Flamme, geflochtener Korb
const HUELLE = "M15 1C6.5 1 1.5 7.2 1.5 14c0 6.4 5 11.6 9.4 17.2h8.2C23.5 25.6 28.5 20.4 28.5 14 28.5 7.2 23.5 1 15 1Z";
const HEISSLUFT = `<defs><clipPath id="f-hb"><path d="${HUELLE}"/></clipPath></defs><g class="f-schweb"><g clip-path="url(#f-hb)"><path fill="#d8463f" d="M0 0h30v32H0Z"/><ellipse cx="15" cy="14" rx="10.2" ry="14.6" fill="#f6ead2"/><ellipse cx="15" cy="14" rx="6.6" ry="14.6" fill="#ee8a3c"/><ellipse cx="15" cy="14" rx="3" ry="14.6" fill="#f6ead2"/><path fill="#2f6f8f" opacity=".9" d="M0 13.4Q15 18.6 30 13.4v2.9Q15 21.5 0 16.300Z"/><path fill="#f4c542" d="M0 16.300Q15 21.500 30 16.300v1Q15 22.500 0 17.300Z"/><ellipse cx="9" cy="8.500" rx="3.200" ry="5.600" fill="#fff" opacity=".22" transform="rotate(18 9 8.500)"/></g><path fill="none" stroke="#7a6a58" stroke-width=".35" d="M11 31.200l1.500 5M19 31.200l-1.500 5M13.600 31.200l.400 5M16.400 31.200l-.400 5"/><path class="f-flamme" fill="#f6a23c" d="M15 31.800c.900 1 .900 2.100 0 3.200c-.900-1.100-.900-2.200 0-3.200Z"/><path fill="#a37a4f" d="M12 36.200h6v4.200a1.100 1.100 0 0 1-1.100 1.100h-3.800a1.100 1.100 0 0 1-1.100-1.100Z"/><path fill="none" stroke="#7d5c3a" stroke-width=".3" d="M12 37.400h6M12 38.800h6M13.500 36.200v5.200M15 36.200v5.300M16.500 36.200v5.200"/><path fill="#7d5c3a" d="M11.700 35.900h6.600v.800h-6.600Z"/></g>`;

const REGENBOGEN = ["#e98a8a", "#f0b97a", "#f1dd86", "#a9d49a", "#93bfe3", "#b5a2dd"].map((c, i) => `<circle cx="100" cy="100" r="${f(96 - i * 3.1)}" fill="none" stroke="${c}" stroke-width="3.2"/>`).join("");

// Feuerwerk: aufsteigende Rakete, dann gebogene Leuchtspuren, die leicht absinken, mit Funkelsternen an den Enden
const feuerwerk = (farbe, hell, zweit) => {
  let spur = "", sterne = "", innen = "";
  for (let i = 0; i < 14; i++) {
    const w = i * 2 * Math.PI / 14 - Math.PI / 2, r1 = i % 2 ? 15.5 : 19, c = Math.cos(w), s = Math.sin(w);
    const ex = c * r1, ey = s * r1 + 2.6 + (s > 0 ? 1.4 : 0);
    spur += `<path d="M${f(c * 4)} ${f(s * 4)}Q${f(c * 12)} ${f(s * 12 + .4)} ${f(ex)} ${f(ey)}" stroke="${farbe}" stroke-width=".55" opacity=".55"/><path d="M${f(c * 10.500)} ${f(s * 10.500 + .5)}Q${f(c * 13.500)} ${f(s * 13.500 + .900)} ${f(ex)} ${f(ey)}" stroke="${i % 2 ? hell : farbe}" stroke-width=".95"/>`;
    sterne += `<path class="f-glitzer" style="animation-delay:${f(-i * .13)}s" fill="${i % 3 ? hell : "#fff"}" transform="translate(${f(ex)} ${f(ey)}) scale(${i % 2 ? .7 : 1})" d="${FUNKEL}"/>`;
  }
  for (let i = 0; i < 9; i++) { const w = i * 2 * Math.PI / 9, c = Math.cos(w), s = Math.sin(w); innen += `M${f(c * 5)} ${f(s * 5)}L${f(c * 8.200)} ${f(s * 8.200 + .5)}`; }
  return `<path class="f-rakete" d="M0 30V20" stroke="${hell}" stroke-width=".7" stroke-linecap="round"/><g class="f-funke" fill="none" stroke-linecap="round">${spur}<path d="${innen}" stroke="${zweit}" stroke-width=".7"/>${sterne}<circle r="1.300" fill="#fff"/></g>`;
};

// Stern mit Schweif (Dreikönig, Weihnachten)
const STERN = `<defs><linearGradient id="f-schweif" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="#f6d77a" stop-opacity=".8"/><stop offset="1" stop-color="#f6d77a" stop-opacity="0"/></linearGradient></defs><path fill="url(#f-schweif)" d="M13 10.500C26 12 38 15.500 50 21C37.500 18.800 25.500 16.800 13 14.800Z"/>${[[24, 12.300, .55], [33, 15.600, .7], [42, 18.200, .45]].map(([x, y, g], i) => `<path class="f-glitzer" style="animation-delay:${-i * .5}s" fill="#fff3c4" transform="translate(${x} ${y}) scale(${g})" d="${FUNKEL}"/>`).join("")}<g class="f-blink"><circle cx="12" cy="12.600" r="6.500" fill="#f8e08e" opacity=".3"/><path fill="#f4c542" d="M12 1.200l1.700 6.900 5.300-3.300-3.300 5.300 6.900 1.700-6.900 1.700 3.300 5.300-5.300-3.300L12 23.800l-1.700-6.300-5.300 3.300 3.300-5.300-6.900-1.700 6.900-1.700-3.300-5.300 5.300 3.300Z"/><path fill="#fff6d0" d="M12 7.600l1.300 3.700 3.700 1.300-3.700 1.300-1.300 3.700-1.300-3.700-3.700-1.300 3.700-1.300Z"/></g>`;

// Schlitten mit zwei Rentieren (Blick nach links, in Flugrichtung); das vordere hat eine rote Nase
const rentier = rot => `<g class="f-galopp"><ellipse rx="5" ry="2.250" transform="rotate(-6)"/><path d="M-3.200 -1.900L-6.300 -5.700L-4.500 -6.500L-1.500 -1.100ZM-3.600 1L-7.800 4.300L-7.200 5L-2.200 2.200ZM-2.400 1.600L-5.400 5.900L-4.600 6.300L-1 2.200ZM3.400 1L8 4.100L7.400 4.900L2.200 2.200ZM4.200 .200L9.600 2.100L9.400 3L3.600 1.600ZM4.700 -1.300l1.900 -1.100l-.6 1.900ZM-5.500 -7.200l1.700 -1.300l-.2 1.700Z"/><ellipse cx="-6.700" cy="-6.300" rx="2" ry="1.250" transform="rotate(20 -6.700 -6.300)"/><path fill="none" stroke-width=".5" stroke-linecap="round" d="M-5.900 -7.300q-.6 -2.400 .8 -4.200M-5.600 -9.400l-1.600 -1M-5.400 -10.400l1.400 -1.200M-5 -7.400q.9 -2 2.600 -2.800M-3.600 -9.500l.2 -1.600M-4.300 -9l1.500 .3"/>${rot ? `<circle cx="-8.600" cy="-5.700" r=".65" fill="#e2332f" stroke="none"/>` : ""}</g>`;
const SCHLITTEN = `<g class="f-huepf"><g fill="#3d3934" stroke="#3d3934" stroke-width=".25" stroke-linejoin="round">${am(12, 14, 1, rentier(true))}${am(32, 13, 1, rentier(false))}</g><path fill="none" stroke="#7a6a58" stroke-width=".3" d="M50.500 13.500Q43 11 36 12.500M32.500 12Q24 10.500 16 13"/>`
  + `<g transform="translate(50 11)"><path fill="#9a744c" d="M11.400 4Q10.800 -2.200 13.800 -2.400Q16.600 -2.200 15.400 4Z"/><path fill="#d6243a" d="M5.800 4L6.800 -1.400H11L12 4Z"/><path fill="#fff" d="M8.500 -1.400h.9V4h-.9ZM5.900 3.200h6v.8h-6Z"/><circle cx="8.700" cy="-3" r="1.500" fill="#e8c9a8"/><path fill="#fff" d="M7.300 -2.700q1.400 2.200 2.900 0q-.3 2.100 -1.450 2.100T7.300 -2.700Z"/><path fill="#d6243a" d="M7.200 -3.600Q7.600 -6.200 10.600 -6.600Q9.800 -5.200 10.300 -3.600Z"/><path fill="#fff" d="M7 -3.900h3.500v.75H7Z"/><circle cx="10.800" cy="-6.700" r=".6" fill="#fff"/>`
  + `<path fill="#8e2f2a" d="M2 6Q-1.500 6 -1.500 2.500Q-1.500 -.5 1.500 -1.500L2.200 0Q.6 .6 .6 2.500Q.6 4 2 4H12V-1Q14 -1.600 15 -3.400L16.500 -2.600Q15.800 1 15.400 6Z"/><path fill="none" stroke="#f4c542" stroke-width=".35" d="M1.200 5H15.300"/><path fill="none" stroke="#3d3934" stroke-width=".7" stroke-linecap="round" d="M-2 9Q-4.600 9 -4.600 6.600M-2 9H16Q17.800 9 18.200 7.400M3 6v3M13 6v3"/></g></g>`;

const DRACHEN = `<g class="f-wind"><path fill="#e9506b" d="M15 2l9 11h-9Z"/><path fill="#f4c542" d="M15 2 6 13h9Z"/><path fill="#6fb0e6" d="M6 13l9 15V13Z"/><path fill="#f19a4a" d="M24 13l-9 15V13Z"/><path fill="#fff" opacity=".25" d="M15 2l9 11h-4.500Z"/><path fill="none" stroke="#6b6156" stroke-width=".4" d="M15 2v26M6 13h18"/><g class="f-schwanz"><path fill="none" stroke="#6b6156" stroke-width=".4" d="M15 28c-3 4 3 7-.5 11s2.500 6.500-1.500 10"/><path fill="#6fb0e6" d="M12.600 33l3.600 1.400-3.400 1.800ZM17 40.600l-3.700 1.200 3.500 2Z"/><path fill="#e9506b" d="M15.400 33l-2.200 1.400 2.400 1.600ZM12 47.200l3.600.700-2.900 2.300Z"/><path fill="#f4c542" d="M14.200 40.800l2.300 1.200-2.100 1.700Z"/></g></g>`;

const LUFTBALLONS = (() => {
  const b = [[12, 11, 0], [22, 7.5, 1], [31, 13, 2], [17, 20, 3], [26.5, 22, 4]];
  return `<g class="f-schweb"><path fill="none" stroke="#857d70" stroke-width=".3" d="${b.map(([x, y]) => `M${x} ${y + 6.900}Q${f((x + 21.500) / 2 + (x < 21 ? -1.5 : 1.5))} ${f(y + 22)} 21.500 56`).join("")}"/>${b.map(([x, y, c], i) => `<g class="f-wackel" style="animation-delay:${-i * .7}s"><path fill="${BUNT[c]}" d="${kreis(x, y, 5, 6.2)}M${x - .9} ${y + 6}h1.800l.5 1.500h-2.800Z"/><path fill="#000" opacity=".1" d="M${x + 1.5} ${y - 5.600}a5 6.200 0 0 1 0 11.600a6.500 6.200 0 0 0 0-11.600Z"/><ellipse cx="${x - 1.7}" cy="${y - 2.3}" rx="1.100" ry="1.800" fill="#fff" opacity=".5" transform="rotate(-24 ${x - 1.7} ${y - 2.3})"/></g>`).join("")}</g>`;
})();

const HERZ = "M6 10.400C1.200 6.600 0 4.600 0 3 0 1.300 1.300 0 3 0c1.200 0 2.300.700 3 1.800C6.700.700 7.800 0 9 0c1.700 0 3 1.300 3 3 0 1.600-1.200 3.600-6 7.400Z";
const FLIEGER = `<path fill="#fdfcf9" stroke="#8f9aa3" stroke-width=".4" stroke-linejoin="round" d="M0 5.200 24 0 14.500 12l-3.200-4.600Z"/><path fill="#d5dbe0" d="M11.300 7.400 14.500 12l1.400-6.500Z"/><path fill="none" stroke="#8f9aa3" stroke-width=".35" d="M24 0 11.300 7.400"/>`;
const FLUGZEUG = `<defs><linearGradient id="f-streif" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs><path fill="url(#f-streif)" d="M0 2.100h70v.700H0ZM0 3.200h70v.700H0Z"/><path fill="#8f9aa3" d="M70 2.300h7.200c1.400 0 2.400.300 2.800.700-.400.400-1.400.700-2.800.700H70ZM73.400 2.400l-2.600-2.200h1.500l3.600 2.200ZM73.400 3.600l-2.600 2.200h1.500l3.600-2.200ZM70.300 2.400l-.9-1h.8l1.200 1Z"/>`;
const FALTER = (farbe, punkt) => `<g class="f-flatter"><path fill="${farbe}" d="M6 5C4 1 1 .5.6 2.600.3 4.400 2.600 5.400 6 5ZM6 5c-2.600.4-4.400 1.600-3.800 3.200C2.800 9.600 5 8.600 6 5ZM6 5C8 1 11 .5 11.400 2.600 11.700 4.400 9.400 5.400 6 5ZM6 5c2.600.4 4.400 1.600 3.800 3.200C9.200 9.600 7 8.600 6 5Z"/><path fill="${punkt}" d="${kreis(2.6, 2.9, .75)}${kreis(9.4, 2.9, .75)}${kreis(3.6, 7.4, .5)}${kreis(8.4, 7.4, .5)}"/><path fill="none" stroke="#4a443d" stroke-width=".5" stroke-linecap="round" d="M6 3.200v4.400M6 3.200l-1-1.700M6 3.200l1-1.700"/></g>`;
const FLEDER = `<path fill="#3d3934" d="M16 5.200l1-2 .800 1.600c2.600-1.600 6.200-2 9.800-.600 1.800.700 3.200 1.800 4.400 3.200-1.600-.600-3-.500-4 .500-1.200-1-2.600-1-3.600.200-1-1.100-2.400-1.200-3.400-.100-.900 1-1.600 2.300-2 3.800l-1 1.400-1-1.400c-.400-1.500-1.100-2.800-2-3.800-1-1.100-2.400-1-3.400.100-1-1.200-2.400-1.200-3.600-.200-1-1-2.400-1.100-4-.500 1.200-1.400 2.600-2.500 4.400-3.200 3.600-1.400 7.200-1 9.800.600l.800-1.600Z"/><path fill="#f4c542" d="${kreis(15.3, 5.9, .32)}${kreis(16.7, 5.9, .32)}"/>`;

export const FEST_HIMMEL = [
  `<div class="f f-regenbogen"><svg viewBox="0 0 200 100">${REGENBOGEN}</svg></div>`,
  himmel("heissluftballon", 108, -76, .2, "34vw", HEISSLUFT, "0 0 30 43"),
  himmel("feuerwerk", -36, -42, .5, "-30vw", feuerwerk("#f4c542", "#fff3c4", "#f19a4a"), "-24 -24 48 56"),
  himmel("feuerwerk f2", 88, -64, .46, "30vw", feuerwerk("#e9506b", "#ffd0d6", "#f4c542"), "-24 -24 48 56"),
  himmel("feuerwerk f3", 27, -72, .34, "0vw", feuerwerk("#6fb0e6", "#e1f0fb", "#b07cd8"), "-24 -24 48 56"),
  himmel("stern", 84, -60, .36, "26vw", STERN, "0 0 52 26"),
  `<div class="f f-h f-schlitten" style="--t:-58%;--tb:-25%;--g:.62;--fx:0vw"><svg viewBox="0 0 70 24">${SCHLITTEN}</svg></div>`,
  himmel("drachen", -24, -66, .16, "-30vw", DRACHEN, "0 0 30 52"),
  himmel("luftballons", 106, -62, .22, "32vw", LUFTBALLONS, "0 0 43 57"),
  ...[[-30, -22, .1, 0], [-8, -56, .07, 1.4], [104, -44, .09, .7], [122, -10, .07, 2.1], [58, -72, .06, 2.8]].map(([l, t, g, v], i) =>
    himmel("herzen", l, t, g, (l < 50 ? "-" : "") + "24vw", `<g class="f-steig" style="animation-delay:${v}s"><path fill="${i % 2 ? "#f29bb0" : "#e9506b"}" d="${HERZ}"/><ellipse cx="3" cy="2.600" rx="1.100" ry="1.600" fill="#fff" opacity=".4" transform="rotate(-28 3 2.600)"/></g>`, "0 0 12 11")),
  `<div class="f f-h f-papierflieger" style="--l:-46%;--t:-18%;--tb:-8%;--g:.15;--fx:0vw"><svg viewBox="0 0 24 12">${FLIEGER}</svg></div>`,
  `<div class="f f-h f-papierflieger p2" style="--l:-70%;--t:-46%;--tb:-20%;--g:.1;--fx:0vw"><svg viewBox="0 0 24 12">${FLIEGER}</svg></div>`,
  `<div class="f f-h f-flugzeug" style="--l:-20%;--t:-66%;--lb:-90%;--tb:-30%;--g:.62;--fx:0vw"><svg viewBox="0 0 80 6">${FLUGZEUG}</svg></div>`,
  ...[[-26, -6, .2], [98, -22, .17], [118, 8, .13], [8, -42, .12]].map(([l, t, g], i) => himmel("fledermaeuse", l, t, g, (l < 50 ? "-" : "") + "40vw", `<g class="f-flatter2" style="animation-delay:${-i * .09}s">${FLEDER}</g>`, "0 0 32 14")),
].join("\n      ");

// vor der Stadt, hinter dem Logo
export const FEST_VORN = [[-24, 40, "#f19a4a", "#fff3c4"], [108, 43, "#f4c542", "#e9506b"], [127, 35, "#7fb4e6", "#fff"], [-4, 47, "#e9506b", "#f4c542"]]
  .map(([l, t, c, p], i) => `<div class="f f-h f-schmetterlinge" style="--l:${l}%;--t:${t}%;--g:.075;--fx:${l < 50 ? "-" : ""}30vw"><svg viewBox="0 0 12 10" class="f-gaukel" style="animation-delay:${-i * 1.7}s">${FALTER(c, p)}</svg></div>`).join("\n      ");

// ---- Stadtband: Nikolausmütze auf der Kuppel der Christuskirche (Kuppelmitte x = 550, Laterne bis y ≈ 27.5) ----
export const FEST_STADT = `<g class="f f-nikolaus"><path fill="#d6243a" d="M547.700 27.900Q548.800 22.300 552.900 21.900Q551.500 24.300 552.300 27.900Z"/><path fill="#b91d31" d="M550.600 23Q551.400 25 551.200 27.900h1.100Q551.500 24.300 552.900 21.900Q551.600 22.100 550.600 23Z"/><path fill="#fff" d="M547.200 27.500h5.600a.650 .650 0 0 1 0 1.300h-5.600a.650 .650 0 0 1 0-1.300Z"/><circle class="f-bommel" cx="553.100" cy="21.800" r=".900" fill="#fff"/></g>`;

// ---- Uferband ----
const lichterkette = (() => {
  let schnur = "", birnen = "";
  const farben = ["#f6cf6a", "#f4a25a", "#fff1c2", "#f6cf6a"];
  for (let x = 14 + 27 * 12; x < 950; x += 27) {
    schnur += `M${x + .65} 54.200q13.500 3.600 27 0`;
    for (let i = 1; i <= 5; i++) { const t = i / 6, bx = x + .65 + 27 * t, by = 54.2 + 2 * t * (1 - t) * 3.6 + .5; birnen += `<circle cx="${f(bx)}" cy="${f(by)}" r="1.500" fill="${farben[i % 4]}" opacity=".22"/><circle class="f-birne" cx="${f(bx)}" cy="${f(by)}" r=".8" fill="${farben[i % 4]}" style="animation-delay:${f(-((x + i * 7) % 23) / 10)}s"/>`; }
  }
  return `<g class="f f-lichterkette"><path fill="none" stroke="#6b6156" stroke-width=".26" d="${schnur}"/>${birnen}</g>`;
})();

// Tannenbaum: vier Stufen mit geschwungenem Saum, Lichterschweif, Kugeln mit Glanz, Stern mit Schein, zwei Geschenke
const tannenbaum = (() => {
  const stufe = (oben, unten, w, farbe) => `<path fill="${farbe}" d="M0 ${oben}L${w} ${unten}${`q${f(-w / 4)} 1.300 ${f(-w / 2)} 0`.repeat(4)}Z"/>`;
  const kugeln = [[-1.2, -15.6, 0], [1.8, -12, 1], [-2.6, -10.4, 2], [3.4, -7.4, 3], [-.6, -7, 1], [-4.4, -5.6, 0], [5.2, -3.6, 2], [1.4, -3, 0], [-2.8, -2.4, 3], [-6.4, -2.6, 1]];
  const farben = ["#e9506b", "#f4c542", "#8ec5f0", "#fdfcf9"];
  return `<g class="f f-tannenbaum" transform="translate(556 ${FUSS}) scale(1.02)"><ellipse cx="0" cy="0" rx="9" ry=".7" fill="#000" opacity=".1"/><path fill="#7a5a3c" d="M-.9 -2.600h1.800V0H-.9Z"/>`
    + stufe(-13, -2.6, 9.6, "#356f49") + stufe(-16.6, -6.6, 7.8, "#3f7a52") + stufe(-19.6, -10.6, 6, "#47875c") + stufe(-22, -14.6, 4.2, "#52946a")
    + `<path fill="#000" opacity=".12" d="M0 -22L4.200 -14.600q-1.050 1.300 -2.100 0L7.800 -6.600q-1.950 1.300 -3.900 0L9.600 -2.600q-2.400 1.300 -4.800 0q-2.400 1.300 -4.800 0Z"/>`
    + `<path fill="none" stroke="#f6d77a" stroke-width=".3" stroke-linecap="round" d="M-2.600 -16.200Q.4 -14.400 3 -16.600M-4.600 -11Q.6 -8.200 5.400 -11.600M-6.400 -6.200Q.8 -3 7.400 -6.800"/>`
    + kugeln.map(([x, y, c], i) => `<circle class="f-birne" cx="${x}" cy="${y}" r=".62" fill="${farben[c]}" style="animation-delay:${-i * .37}s"/><circle cx="${f(x - .2)}" cy="${f(y - .2)}" r=".2" fill="#fff" opacity=".8"/>`).join("")
    + `<circle class="f-glimm" cx="0" cy="-23.200" r="3.200" fill="#f8e08e" opacity=".35"/><path class="f-blink" fill="#f4c542" d="M0 -26l.75 1.700 1.850 .2-1.400 1.250.4 1.850L0 -21.900l-1.600 .900.4-1.850-1.400-1.250 1.850-.2Z"/>`
    + `<path fill="#d6243a" d="M5.400 -2.200h3.200V0H5.400Z"/><path fill="#f4c542" d="M6.750 -2.200h.5V0h-.5ZM5.400 -1.350h3.200v.45H5.400Z"/><path fill="#4f8fd0" d="M-8.600 -1.700h2.600V0h-2.600Z"/><path fill="#fdfcf9" d="M-7.500 -1.700h.45V0h-.45Z"/></g>`;
})();

// Maibaum: Birkenstamm mit Krone, Kranz mit Blüten, bunte Bänder im Wind
const maibaum = `<g class="f f-maibaum" transform="translate(556 ${FUSS})"><ellipse cx="0" cy="0" rx="3" ry=".4" fill="#000" opacity=".1"/><path fill="#f1ede4" stroke="#b9b1a3" stroke-width=".12" d="M-.5 -27h1V0h-1Z"/><path fill="none" stroke="#6b6156" stroke-width=".22" stroke-linecap="round" d="M-.5 -4h.6M.5 -8h-.5M-.5 -12.500h.7M.5 -17h-.6M-.5 -20.500h.5"/><g class="f-krone"><path fill="#6fa55f" d="${kreis(0, -29.4, 2.2)}${kreis(-1.8, -27.6, 1.6)}${kreis(1.9, -27.8, 1.5)}"/><path fill="#93c57f" d="${kreis(-.6, -30.2, 1.1)}${kreis(1.6, -28.4, .7)}"/></g><ellipse cx="0" cy="-21.500" rx="4.600" ry="1.400" fill="none" stroke="#4f8f4c" stroke-width="1.100"/><path fill="#fdfcf9" d="${kreis(-4.4, -21.3, .45)}${kreis(4.4, -21.3, .45)}${kreis(0, -20.200, .45)}"/><path fill="#e9506b" d="${kreis(-2.4, -20.500, .45)}${kreis(2.4, -20.500, .45)}"/><g class="f-baender" fill="none" stroke-width=".65" stroke-linecap="round"><path stroke="#e9506b" d="M-4.200 -21q-1.800 4.600.200 8.600q1.200 2.600-.400 4.600"/><path stroke="#6fb0e6" d="M-2.200 -20.300q-1 4.400.400 8.200q.800 2.400-.200 4.400"/><path stroke="#f4c542" d="M2.200 -20.300q1 4.400-.400 8.200q-.800 2.400.200 4.400"/><path stroke="#fdfcf9" d="M4.200 -21q1.800 4.600-.200 8.600q-1.200 2.600.400 4.600"/><path stroke="#8ccf7e" d="M0 -20.100q.6 4.200-.300 8q-.5 2.200.3 4.200"/></g></g>`;

// Riesenrad mit Lichtern am Kranz und Kassenhäuschen
const riesenrad = (() => {
  const cx = 716, cy = 41.5, r = 13.5; let sp = "", go = "", li = "";
  for (let i = 0; i < 12; i++) {
    const w = i * Math.PI / 6, x = cx + Math.cos(w) * r, y = cy + Math.sin(w) * r, w2 = w + Math.PI / 12;
    sp += `M${cx} ${cy}L${f(x)} ${f(y)}`;
    go += `<circle cx="${f(x)}" cy="${f(y)}" r="1.450" fill="${["#e9506b", "#f4c542", "#6fb0e6", "#fdfcf9"][i % 4]}" stroke="#6b6156" stroke-width=".2"/><circle cx="${f(x - .4)}" cy="${f(y - .4)}" r=".4" fill="#fff" opacity=".6"/>`;
    li += `<circle class="f-birne" cx="${f(cx + Math.cos(w2) * r)}" cy="${f(cy + Math.sin(w2) * r)}" r=".42" fill="#f6cf6a" style="animation-delay:${f(-i * .14)}s"/>`;
  }
  return `<g class="f f-riesenrad"><path fill="none" stroke="#857d70" stroke-width=".8" stroke-linecap="round" d="M${cx} ${cy}L${cx - 6.5} ${FUSS}M${cx} ${cy}L${cx + 6.5} ${FUSS}M${cx - 8} ${FUSS}h16"/><g class="f-rad"><path fill="none" stroke="#8a8276" stroke-width=".4" d="${sp}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#6f675c" stroke-width=".8"/><circle cx="${cx}" cy="${cy}" r="${r - 2.3}" fill="none" stroke="#9c9488" stroke-width=".3"/>${li}${go}</g><circle cx="${cx}" cy="${cy}" r="1.500" fill="#c8102e"/><circle cx="${cx}" cy="${cy}" r=".55" fill="#f4c542"/><path fill="#fdfcf9" stroke="#857d70" stroke-width=".15" d="M${cx + 8.6} ${FUSS - 3.4}h4v3.400h-4Z"/><path fill="#d6243a" d="M${cx + 8.1} ${FUSS - 3.4}l2.500-1.700 2.500 1.700Z"/><path fill="#7f8f99" d="M${cx + 9.5} ${FUSS - 2.6}h2.200v1.200h-2.200Z"/></g>`;
})();

const schultuete = (x, farbe, dunkel, kraus, neig) => `<g transform="translate(${x} ${FUSS}) scale(1.45) rotate(${neig})"><path fill="${farbe}" d="M0 0l-3.300-11.600h6.600Z"/><path fill="${dunkel}" d="M0 0l1.300-11.600h2Z"/><path fill="none" stroke="#fff" stroke-width=".35" opacity=".85" d="M-2.200 -8l1.100.800 1.100-.800 1.100.800 1.100-.800M-1.300 -4.600l.7.500.6-.5.7.5.6-.5"/><path fill="#fff" opacity=".9" d="${kreis(-1.6, -9.8, .35)}${kreis(.3, -6.200, .32)}${kreis(1.700, -10, .3)}${kreis(-.2, -2.600, .26)}"/><path fill="${kraus}" d="${kreis(-2.2, -12.3, 1.5)}${kreis(0, -13, 1.8)}${kreis(2.2, -12.3, 1.5)}${kreis(-1, -13.800, 1.1)}${kreis(1.2, -13.900, 1)}"/><path fill="#f4c542" d="M-3.400 -11.900h6.800v.800h-6.800ZM3 -11.500l1.900-1.100v2.200ZM3 -11.500l1.700 1.900-1.900-.600Z"/></g>`;

// Kürbisse mit Rippen, Glanz, Stiel und Ranke; die großen als Laternen mit glimmendem Gesicht
const kuerbis = (x, g, gesicht) => am(x, FUSS, g, `<ellipse cx="0" cy="0" rx="2.200" ry=".3" fill="#000" opacity=".12"/><path fill="#d9741f" d="${kreis(-1, -1.25, 1.1, 1.25)}${kreis(1, -1.25, 1.1, 1.25)}"/><path fill="#e8862c" d="${kreis(0, -1.25, 1.25, 1.32)}"/><path fill="#f4a04a" opacity=".7" d="${kreis(-.35, -1.6, .35, .7)}"/><path fill="none" stroke="#c96a1e" stroke-width=".14" d="M-.75 -2.300q-.5 1.050 0 2.100M.75 -2.300q.5 1.050 0 2.100"/><path fill="#6f8f4e" d="M-.25 -2.500q.1 -.7 .7 -.9l.2 .4q-.4 .2 -.4 .6Z"/><path fill="none" stroke="#6f8f4e" stroke-width=".13" stroke-linecap="round" d="M.4 -3.200q.9 -.4 1.300 .2q.3 .5 -.2 .6"/>`
  + (gesicht ? `<path class="f-glimm" fill="#ffe27a" d="M-1 -1.500l.45-.65.45.65ZM.1 -1.500l.45-.65.45.65ZM-.95 -.95h1.900l-.35.6-.3-.3-.3.300-.3-.3-.3.300Z"/>` : ""));

// Laternenumzug: Kinder mit Mütze, Schal und Laterne am Stab; jedes wippt leicht im Gehen, die Laternen pendeln und glimmen
const laternen = (() => {
  const r = zufall(41), maentel = ["#6b7fa3", "#a35d5d", "#5f8a6e", "#8a6b4f", "#7a6a9a", "#c08a3e"], muetzen = ["#d6243a", "#f4c542", "#3f7a52", "#4f8fd0", "#e9506b"], lichter = ["#f6b44a", "#ee7b52", "#f3d36a", "#f29a8a"];
  const kind = (x, g, i) => {
    const s = r() < .5 ? -1 : 1, mantel = maentel[i % maentel.length], muetze = muetzen[(i * 2 + 1) % muetzen.length], licht = lichter[i % lichter.length], rund = r() < .55;
    const lat = rund
      ? `<path fill="${licht}" stroke="#a8693a" stroke-width=".08" d="${kreis(0, 1.8, 1.15, 1.3)}"/><path fill="none" stroke="#fff" stroke-width=".1" opacity=".5" d="M-.5 .6q-.5 1.200 0 2.400M.5 .6q.5 1.200 0 2.400"/><path fill="#6b4a2c" d="M-.5 .35h1v.3h-1ZM-.5 2.950h1v.3h-1Z"/>`
      : `<path fill="${licht}" stroke="#a8693a" stroke-width=".08" d="M-.95 .6h1.900l.3 1.200-.3 1.200h-1.900l-.3-1.200Z"/><path fill="none" stroke="#a8693a" stroke-width=".08" d="M-.3 .6v2.400M.3 .6v2.400"/><path fill="#6b4a2c" d="M-.95 .35h1.900v.3h-1.900ZM-.95 2.950h1.900v.3h-1.900Z"/>`;
    return `<g class="f-kind" style="animation-delay:${f(-r() * 1.2)}s">` + am(x, FUSS, g,
      `<ellipse cx="0" cy="0" rx="1.500" ry=".22" fill="#000" opacity=".14"/><path fill="#3d3934" d="${kreis(-.5, -.05, .5, .2)}${kreis(.55, -.05, .5, .2)}"/><path fill="${mantel}" d="M-1.150 -.1Q-1.250 -2.300 -.65 -3.100h1.300Q1.250 -2.300 1.150 -.1Z"/><path fill="#000" opacity=".12" d="M.2 -3.100h.45Q1.250 -2.300 1.150 -.1H.5Z"/><circle cx="0" cy="-3.850" r=".85" fill="#e8c9a8"/><path fill="${muetze}" d="M-.9 -4.050a.9 .9 0 0 1 1.800 0Z"/><circle cx="0" cy="-5" r=".3" fill="#fdfcf9"/><path fill="none" stroke="${muetze}" stroke-width=".34" stroke-linecap="round" d="M-.6 -3.050h1.200M${s * .5} -3.050l${s * .25} .9"/><path fill="none" stroke="${mantel}" stroke-width=".42" stroke-linecap="round" d="M${s * .5} -2.500L${s * 1.5} -3.500"/><path fill="none" stroke="#7a6a58" stroke-width=".14" stroke-linecap="round" d="M${s * 1.3} -3.200L${s * 2.7} -5.700"/><g transform="translate(${s * 2.7} -5.700)"><g class="f-pendel"><path stroke="#7a6a58" stroke-width=".1" d="M0 0v.4"/><circle class="f-glimm" cx="0" cy="1.800" r="2.700" fill="${licht}" opacity=".24"/>${lat}<ellipse cx="0" cy="1.900" rx=".42" ry=".7" fill="#fff6d0" opacity=".8"/></g></g>`) + `</g>`;
  };
  return `<g class="f f-laternen">${[528, 539, 550, 561, 572, 583, 694, 705, 716, 727, 738, 749].map((x, i) => kind(x + r() * 2, 1.2 + r() * .5, i)).join("")}</g>`;
})();

// Ostern: gemusterte Eier zwischen Grasbüscheln, ein sitzender Hase mit zuckenden Ohren
const ostern = (() => {
  const r = zufall(77), EI = "M0 -1.900C1.100 -1.900 1.500 -.6 1.500 .3C1.500 1.300 .8 1.900 0 1.900C-.8 1.900 -1.500 1.300 -1.500 .3C-1.500 -.6 -1.100 -1.900 0 -1.900Z";
  const muster = [`<path fill="none" stroke="#fff" stroke-width=".3" d="M-1.450 .1Q0 .9 1.450 .1"/><path fill="none" stroke="#fff" stroke-width=".22" opacity=".8" d="M-1.200 -.8l.6.5.6-.5.6.5.6-.5"/>`,
    `<path fill="#fff" opacity=".9" d="${kreis(-.6, -.6, .28)}${kreis(.6, -.3, .28)}${kreis(-.2, .7, .28)}${kreis(.7, 1, .22)}"/>`,
    `<path fill="none" stroke="#fff" stroke-width=".3" d="M-1.400 -.5h2.800M-1.500 .6h3"/><path fill="#fff" opacity=".85" d="${kreis(0, .05, .22)}"/>`];
  let eier = "", gras = "";
  for (const x of [528, 536, 544, 566, 574, 582, 590, 690, 698, 722, 730, 738, 747, 755]) {
    const ex = x + r() * 2, c = BUNT[Math.floor(r() * BUNT.length)];
    eier += `<g transform="translate(${f(ex)} ${f(FUSS - 1.5)}) rotate(${Math.round(r() * 30 - 15)}) scale(${f(.85 + r() * .3)})"><path fill="${c}" d="${EI}"/>${muster[Math.floor(r() * 3)]}<ellipse cx="-.55" cy="-.9" rx=".3" ry=".55" fill="#fff" opacity=".4" transform="rotate(-20 -.55 -.9)"/></g>`;
    gras += `M${f(ex - 1.8)} ${FUSS}q.2 -1.200 -.3 -1.900M${f(ex - 1.3)} ${FUSS}q.3 -1 .9 -1.500M${f(ex + 1.5)} ${FUSS}q-.1 -1.100 .5 -1.800`;
  }
  const hase = `<g class="f-hoppel"><ellipse cx="0" cy="0" rx="3.600" ry=".4" fill="#000" opacity=".12"/><circle cx="3.300" cy="-1.600" r=".8" fill="#fdfcf9"/><ellipse cx="1" cy="-1.900" rx="2.400" ry="1.900" fill="#c4a98a"/><ellipse cx="-.8" cy="-2.600" rx="1.600" ry="2.100" fill="#c4a98a" transform="rotate(-12 -.8 -2.600)"/><ellipse cx="-1.200" cy="-2" rx=".9" ry="1.300" fill="#dcc7ad"/><ellipse cx="1.600" cy="-.3" rx="1.500" ry=".42" fill="#b3977a"/><ellipse cx="-2" cy="-.35" rx=".9" ry=".4" fill="#b3977a"/><g class="f-ohren"><ellipse cx="-.9" cy="-7.300" rx=".42" ry="1.700" fill="#b3977a" transform="rotate(20 -.9 -7.300)"/><ellipse cx="-1.700" cy="-7.500" rx=".45" ry="1.750" fill="#c4a98a" transform="rotate(6 -1.700 -7.500)"/><ellipse cx="-1.700" cy="-7.400" rx=".2" ry="1.200" fill="#eab8bf" transform="rotate(6 -1.700 -7.400)"/></g><ellipse cx="-2" cy="-5.200" rx="1.350" ry="1.100" fill="#c4a98a"/><circle cx="-2.500" cy="-5.400" r=".22" fill="#3d3934"/><circle cx="-3.300" cy="-5" r=".18" fill="#d98a94"/><path fill="none" stroke="#8a7460" stroke-width=".08" d="M-3.200 -4.800l-.9 .1M-3.200 -4.700l-.8 .4"/></g>`;
  return `<g class="f f-ostern">${eier}<path fill="none" stroke="#6fa55f" stroke-width=".22" stroke-linecap="round" d="${gras}"/>${am(710, FUSS, 1.5, hase)}</g>`;
})();

const schneemann = `<g class="f f-schneemann" transform="translate(708 ${FUSS}) scale(1.55)"><ellipse cx="0" cy="0" rx="3" ry=".35" fill="#7f93a6" opacity=".25"/><g fill="#fdfdfd" stroke="#b3c0cc" stroke-width=".16"><circle cx="0" cy="-2.100" r="2.300"/><circle cx="0" cy="-5.400" r="1.700"/><circle cx="0" cy="-7.900" r="1.250"/></g><path fill="#c9d6e2" opacity=".55" d="M1.100 -4.100a2.300 2.300 0 0 1 0 4a3.200 2.300 0 0 0 0-4ZM.8 -6.900a1.700 1.700 0 0 1 0 3a2.400 1.700 0 0 0 0-3ZM.6 -9a1.250 1.250 0 0 1 0 2.200a1.800 1.250 0 0 0 0-2.200Z"/><path fill="#3d3934" d="M-1.500 -9h3v.45h-3ZM-1 -11.100h2v2.100h-2Z"/><path fill="#d6243a" d="M-1 -9.550h2v.5h-2Z"/><path fill="#e8862c" d="M0 -7.900l2.100.4-2.100.35Z"/><path fill="none" stroke="#d6243a" stroke-width=".55" stroke-linecap="round" d="M-1.150 -6.800Q0 -6.300 1.150 -6.800"/><path class="f-schal" fill="none" stroke="#d6243a" stroke-width=".5" stroke-linecap="round" d="M.9 -6.700l.6 1.700"/><path fill="none" stroke="#7a6a58" stroke-width=".22" stroke-linecap="round" d="M-1.600 -5.600l-2.300-1.300M-3.300 -6.550l-.2-.8M-3.300 -6.550l-.8.1M1.600 -5.600l2.300-1.400M3.300 -6.600l.2-.8M3.300 -6.600l.8.1"/><path fill="#3d3934" d="${kreis(-.45, -8.150, .16)}${kreis(.45, -8.150, .16)}${kreis(0, -5.900, .18)}${kreis(0, -4.900, .18)}${kreis(0, -2.900, .2)}${kreis(0, -1.600, .2)}"/><path fill="none" stroke="#3d3934" stroke-width=".12" stroke-linecap="round" d="M-.5 -7.350q.5 .35 1 0"/></g>`;

const fahne = `<g class="f f-fahne"><ellipse cx="556" cy="${FUSS}" rx="2" ry=".3" fill="#000" opacity=".1"/><path fill="#b9b1a3" d="M555.700 37h.6v21.400h-.6Z"/><circle cx="556" cy="36.800" r=".5" fill="#f4c542"/><g class="f-wehen"><path fill="#1c1b1a" d="M556.300 37.800q2.400-.9 4.800 0t4.800 0v1.900q-2.400.9-4.800 0t-4.800 0Z"/><path fill="#d6243a" d="M556.300 39.700q2.400-.9 4.800 0t4.800 0v1.900q-2.400.9-4.800 0t-4.800 0Z"/><path fill="#f4c542" d="M556.300 41.600q2.400-.9 4.800 0t4.800 0v1.900q-2.400.9-4.800 0t-4.800 0Z"/><path fill="#000" opacity=".12" d="M558.700 37.350q1.200 .3 2.400 .45v5.700q-1.200 -.15 -2.400 -.45ZM563.500 38.250q1.200 0 2.400 -.45v5.700q-1.200 .45 -2.400 .45Z"/></g></g>`;

export const FEST_UFER = [
  lichterkette, tannenbaum, maibaum, riesenrad, fahne,
  `<g class="f f-schultuete">${schultuete(561, "#e9506b", "#c93a57", "#f8c7d2", 14)}${schultuete(706, "#4f8fd0", "#3a76b5", "#cfe4f6", -12)}</g>`,
  `<g class="f f-kuerbisse">${kuerbis(545, 1.9, true)}${kuerbis(552.5, 1.25)}${kuerbis(568.5, 1.55, false)}${kuerbis(577, 2.1, true)}${kuerbis(697.5, 1.4)}${kuerbis(708, 2, true)}${kuerbis(716.5, 1.2)}</g>`,
  laternen, ostern, schneemann,
].join("");

// ---- Wasser (y = 0 ist der Horizont) ----
const schwan = (x, y, g, grau) => am(x, y, g, `<path stroke="#fff" stroke-width=".35" opacity=".7" d="M-2.600 .9h5M-1.400 1.700h2.800"/><path fill="${grau ? "#b9b4ac" : "#fdfdfd"}" stroke="#9fb0bb" stroke-width=".12" d="M-3 0C-3.400 -1 -2.600 -1.900 -1 -2C-.2 -2.600 1 -2.400 1.600 -1.600C2.400 -1.400 3 -.8 3 0ZM-3 0L-4 -1.600L-2.400 -1.200Z"/><path fill="none" stroke="#c9d3db" stroke-width=".18" d="M-1.900 -.6Q0 -1.900 1.900 -.6"/><path fill="none" stroke="#9fb0bb" stroke-width=".95" stroke-linecap="round" d="M2.200 -.9C3.600 -1.200 3.900 -2.400 3.200 -3.300C2.700 -3.900 2.800 -4.600 3.500 -4.700"/><path fill="none" stroke="${grau ? "#b9b4ac" : "#fdfdfd"}" stroke-width=".7" stroke-linecap="round" d="M2.200 -.9C3.600 -1.200 3.900 -2.400 3.200 -3.300C2.700 -3.900 2.800 -4.600 3.500 -4.700"/><circle cx="3.700" cy="-4.650" r=".58" fill="${grau ? "#b9b4ac" : "#fdfdfd"}" stroke="#9fb0bb" stroke-width=".1"/><path fill="#e8862c" d="M4.150 -4.800l1.250 .45l-1.250 .3Z"/><circle cx="3.950" cy="-4.800" r=".13" fill="#3d3934"/>`, "f-wiege");
export const FEST_WASSER = [
  `<g class="f f-segelboot"><g transform="translate(548 4.200) scale(1.45) translate(-548 -4.200)"><g class="f-schaukel"><path fill="#fdfcf9" stroke="#8f9aa1" stroke-width=".2" d="M543 3.300h10.400l-1.500 1.900h-7.400Z"/><path fill="#c8102e" d="M543.400 3.900h9.500l-.3.400h-8.900Z"/><path stroke="#7d756a" stroke-width=".25" d="M548 3.300V-7"/><path fill="#fdfcf9" stroke="#b9c2c9" stroke-width=".15" d="M548.400 -6.600Q551.600 -2.600 554.200 2.600h-5.800Z"/><path fill="#e9506b" d="M547.600 -5Q545.400 -1.600 543.800 2.600h3.800Z"/><path fill="#d6243a" d="M548 -7l1.800.5-1.800.6Z"/></g><path class="s-spiegel" d="M544 5.900h8M546 6.800h4.600"/></g></g>`,
  `<g class="f f-schwaene"><g class="f-treib">${schwan(560, 3.6, 1.35)}${schwan(570, 5, 1.05)}${schwan(576.5, 5.6, .55, true)}</g></g>`,
  `<g class="f f-frachtschiff"><g class="f-treib2"><path stroke="#fff" stroke-width=".4" opacity=".6" d="M540 6h30M546 6.900h18"/><path fill="#55626e" d="M538 2.900h36.500l-1.300 2.300h-33.500Z"/><path fill="#a8432f" d="M538.700 4.300h34.900l-.5.900h-33.700Z"/><path fill="#c9704a" d="M542 1.300h5.600v1.600H542Z"/><path fill="#5f8fb5" d="M548 1.300h5.600v1.600H548ZM551 -.3h5.600v1.600H551Z"/><path fill="#d9b45a" d="M554 1.300h5.600v1.600H554Z"/><path fill="#7f9a78" d="M560 1.300h5.600v1.600H560Z"/><path fill="none" stroke="#000" stroke-width=".08" opacity=".25" d="M543.900 1.300v1.600M545.800 1.300v1.600M549.900 1.300v1.600M551.800 1.300v1.600M555.900 1.300v1.600M557.800 1.300v1.600M561.900 1.300v1.600M563.800 1.300v1.600"/><path fill="#fdfcf9" stroke="#8f9aa1" stroke-width=".15" d="M567.600 .3h4.400v2.600h-4.400Z"/><path fill="#7f8f99" d="M568.300 .8h3v.7h-3Z"/><path stroke="#7d756a" stroke-width=".2" d="M569.800 .3v-1.500"/><path fill="#d6243a" d="M569.800 -1.200l1.300.3-1.300.4Z"/></g></g>`,
].join("");

// ---- Wimpelkette und Luftschlangen am oberen Bildrand (als gekachelter Hintergrund) ----
const packe = t => t.replace(/[%#<>]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const wimpel = farben => {
  let t = `<path d='M0 3Q60 13 120 3Q180 13 240 3' fill='none' stroke='#6b6156' stroke-width='.8'/>`;
  for (let i = 0; i < 10; i++) { const u = (i + .5) / 5 % 1, x = (i + .5) * 24, y = 3 + 2 * u * (1 - u) * 10; t += `<path d='M${f(x - 6.5)} ${f(y - .3)}h13l-6.500 14Z' fill='${farben[i % farben.length]}'/><path d='M${f(x)} ${f(y - .3)}h6.500l-6.500 14Z' fill='#000' opacity='.1'/>`; }
  return `url("data:image/svg+xml,${packe(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='26' viewBox='0 0 240 26'>${t}</svg>`)}")`;
};
const konfetti = (w, h, n, seed) => {
  const r = zufall(seed), farben = ["#d6243a", "#2c5aa8", "#f4c542", "#fdfcf9", "#3c9a5f"]; let t = "";
  for (let i = 0; i < n; i++) {
    const x = f(10 + r() * (w - 20)), y = f(10 + r() * (h - 20)), c = farben[Math.floor(r() * farben.length)], w0 = Math.round(r() * 180), art = r();
    t += art < .4 ? `<rect x='${x}' y='${y}' width='5' height='2.600' fill='${c}' stroke='#000' stroke-opacity='.08' stroke-width='.3' transform='rotate(${w0} ${x} ${y})'/>`
      : art < .75 ? `<circle cx='${x}' cy='${y}' r='2' fill='${c}' stroke='#000' stroke-opacity='.08' stroke-width='.3'/>`
      : `<path d='M0 0q2 -3 4 0t4 0t4 0' fill='none' stroke='${c}' stroke-width='1.200' stroke-linecap='round' transform='translate(${x} ${y}) rotate(${w0})'/>`;
  }
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
.f-ufer-el,.f-tannenbaum,.f-maibaum,.f-riesenrad,.f-fahne,.f-schultuete,.f-kuerbisse,.f-laternen,.f-ostern,.f-schneemann,.f-lichterkette,.f-nikolaus{animation:i-ein 1s ease 1.3s both}
.f-schweb{transform-box:fill-box;transform-origin:50% 0;animation:f-schweb 7s ease-in-out infinite alternate}
.f-wackel{transform-box:fill-box;transform-origin:50% 100%;animation:f-wackel 3.4s ease-in-out infinite alternate}
.f-flamme{transform-box:fill-box;transform-origin:50% 100%;animation:f-flamme .5s ease-in-out infinite alternate}
.f-regenbogen{position:absolute;left:104%;bottom:39.45%;width:calc(var(--L) * 2.7);opacity:calc(.5 - var(--p,0) * 1.2);translate:0 calc(var(--e,0) * 30vh)}
.f-regenbogen svg{display:block;width:100%;height:auto;animation:f-bogen 2.6s ease 1.6s both}
.f-funke{transform-box:view-box;transform-origin:0 0;animation:f-funke 3s cubic-bezier(.12,.72,.2,1) infinite}
.f-rakete{animation:f-rakete 3s ease-out infinite}
.f2 .f-funke,.f2 .f-rakete{animation-delay:1s}.f3 .f-funke,.f3 .f-rakete{animation-delay:2s}
.f-glitzer{transform-box:fill-box;transform-origin:50% 50%;animation:f-glitzer .9s ease-in-out infinite alternate}
.f-blink{transform-box:fill-box;transform-origin:50% 50%;animation:f-blink 1.8s ease-in-out infinite alternate}
.f-schlitten.f-schlitten{left:50%;margin-left:calc(var(--L) * -.31)}
.f-schlitten>svg{animation:i-ein 1s ease 1.6s both,f-fahrt 18s linear 1.6s infinite}
.f-huepf{transform-box:fill-box;transform-origin:50% 50%;animation:f-huepf 1.5s ease-in-out infinite alternate}
.f-galopp{transform-box:fill-box;transform-origin:50% 50%;animation:f-galopp .75s ease-in-out infinite alternate}
.f-wind{transform-box:fill-box;transform-origin:50% 55%;animation:f-wind 4.6s ease-in-out infinite alternate}
.f-schwanz{transform-box:fill-box;transform-origin:50% 0;animation:f-wind 1.7s ease-in-out infinite alternate-reverse}
.f-steig{animation:f-steig 5.5s ease-in infinite}
.f-papierflieger>svg{animation:i-ein .6s ease 1.8s both,f-gleit 11s ease-in-out 1.8s infinite}
.f-papierflieger.p2>svg{animation:i-ein .6s ease 3s both,f-gleit 15s ease-in-out 3.4s infinite}
.f-flugzeug>svg{animation:i-ein 2s ease 1.6s both,f-zug 60s linear infinite}
.f-flatter{transform-box:fill-box;transform-origin:50% 50%;animation:f-flatter .3s ease-in-out infinite alternate}
.f-h>svg.f-gaukel{animation:i-ein 1s ease 1.8s both,f-gaukel 11s ease-in-out infinite alternate}
.f-flatter2{transform-box:fill-box;transform-origin:50% 40%;animation:f-flatter2 .24s ease-in-out infinite alternate}
.f-fledermaeuse>svg{animation:i-ein 1s ease 1.6s both,f-zickzack 7s ease-in-out infinite alternate}
.intro[data-fest~="fledermaeuse"] .i-vogel{display:none}
.intro[data-fest~="tauben"] .i-vogel path{fill:#fdfdfd;stroke:#8f9aa3;stroke-width:.7}
.f-birne{animation:f-blink2 1.6s ease-in-out infinite alternate}
.f-bommel{transform-box:fill-box;transform-origin:0 100%;animation:f-wind 2.6s ease-in-out infinite alternate}
.f-baender{transform-box:fill-box;transform-origin:50% 0;animation:f-wind 2.8s ease-in-out infinite alternate}
.f-krone{transform-box:fill-box;transform-origin:50% 100%;animation:f-wind 5s ease-in-out infinite alternate}
.f-rad{transform-box:view-box;transform-origin:716px 41.5px;animation:i-drehen 48s linear infinite}
.f-glimm{animation:f-blink2 2.2s ease-in-out infinite alternate}
.f-wehen{transform-box:fill-box;transform-origin:0 50%;animation:f-wehen 1.7s ease-in-out infinite alternate}
.f-kind{animation:f-wippen .62s ease-in-out infinite alternate}
.f-pendel{transform-box:fill-box;transform-origin:50% 0;animation:f-pendel 1.24s ease-in-out infinite alternate}
.f-hoppel{animation:f-hoppel 6s ease-in-out infinite}
.f-ohren{transform-box:fill-box;transform-origin:50% 100%;animation:f-ohren 6s ease-in-out infinite}
.f-schal{transform-box:fill-box;transform-origin:0 0;animation:f-wind 2.2s ease-in-out infinite alternate}
.f-schaukel{transform-box:fill-box;transform-origin:50% 100%;animation:f-wind 3.8s ease-in-out infinite alternate}
.f-segelboot{animation:i-schiff 80s ease-in-out infinite alternate-reverse}
.f-segelboot .s-spiegel{fill:none;stroke:#fff;stroke-width:.5;opacity:.8}
.f-treib{animation:f-treib 26s ease-in-out infinite alternate}
.f-wiege{animation:f-wiege 3.2s ease-in-out infinite alternate}
.f-treib2{animation:f-treib2 120s linear infinite alternate}
.intro[data-fest~="frachtschiff"] .i-schiff{display:none}
.f-wimpel{position:absolute;left:0;right:0;top:0;height:26px;z-index:1;pointer-events:none;background-repeat:repeat-x;background-position:50% 0;opacity:calc(1 - var(--p,0) * 3);transform-origin:50% 0;animation:f-herab .9s cubic-bezier(.2,.9,.3,1.2) 1.4s both,f-flattern 2.6s ease-in-out 2.4s infinite alternate}
.intro[data-fest~="wimpel-fastnacht"] .f-wimpel{display:block;background-image:${wimpel(["#d6243a", "#fdfcf9", "#2c5aa8", "#f4c542"])}}
.intro[data-fest~="wimpel-bunt"] .f-wimpel{display:block;background-image:${wimpel(BUNT)}}
.intro[data-fest~="wimpel-gelbweiss"] .f-wimpel{display:block;background-image:${wimpel(["#f4c542", "#fdfcf9"])}}
.intro[data-fest~="wimpel-wein"] .f-wimpel{display:block;background-image:${wimpel(["#8e2f4a", "#f3ead2", "#7f9a52"])}}
.intro.intro[data-fest~="konfetti"] .n3{display:block;background-image:${konfetti(260, 520, 15, 31)};--kx:260px;--ky:520px;--kr:0;--kd:7s;opacity:1}
.intro.intro[data-fest~="konfetti"] .n4{display:block;background-image:${konfetti(200, 400, 11, 37)};--kx:200px;--ky:400px;--kr:0;--kd:10s;opacity:.9}
.intro[data-fest~="konfetti"]{--wieg:18px}
@keyframes f-schweb{from{transform:translateY(-2.5%) rotate(-1.5deg)}to{transform:translateY(2.5%) rotate(1.5deg)}}
@keyframes f-wackel{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes f-flamme{from{transform:scaleY(.7)}to{transform:scaleY(1.25)}}
@keyframes f-bogen{from{opacity:0;clip-path:inset(0 100% 0 0)}to{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes f-rakete{0%{transform:translateY(0);opacity:0}3%{opacity:.9}11%{transform:translateY(-22px);opacity:.9}13%,100%{transform:translateY(-24px);opacity:0}}
@keyframes f-funke{0%,11%{transform:scale(.04);opacity:0}13%{opacity:1}55%{opacity:1}100%{transform:translateY(3px) scale(1);opacity:0}}
@keyframes f-glitzer{from{transform:scale(.4);opacity:.5}to{transform:scale(1.15);opacity:1}}
@keyframes f-blink{from{transform:scale(.88);opacity:.82}to{transform:scale(1.08);opacity:1}}
@keyframes f-blink2{from{opacity:.4}to{opacity:1}}
@keyframes f-fahrt{from{transform:translateX(60vw)}to{transform:translateX(-80vw)}}
@keyframes f-huepf{from{transform:translateY(-7%) rotate(-2.5deg)}to{transform:translateY(7%) rotate(2deg)}}
@keyframes f-galopp{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}
@keyframes f-wind{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
@keyframes f-steig{0%{transform:translateY(40%) scale(.6);opacity:0}15%{opacity:1}100%{transform:translate(18%,-260%) scale(1.1);opacity:0}}
@keyframes f-gleit{0%{transform:translate(-20vw,0) rotate(6deg);opacity:0}6%{opacity:1}30%{transform:translate(20vw,-3vh) rotate(-8deg)}50%{transform:translate(45vw,-9vh) rotate(-12deg)}70%{transform:translate(78vw,-5vh) rotate(8deg)}94%{opacity:1}100%{transform:translate(120vw,-3vh) rotate(4deg);opacity:0}}
@keyframes f-zug{from{transform:translateX(-30vw)}to{transform:translateX(70vw)}}
@keyframes f-flatter{from{transform:scaleX(1)}to{transform:scaleX(.22)}}
@keyframes f-flatter2{from{transform:scaleY(1)}to{transform:scaleY(.4)}}
@keyframes f-gaukel{0%{transform:translate(0,0)}20%{transform:translate(140%,-110%)}40%{transform:translate(60%,-220%)}60%{transform:translate(-120%,-140%)}80%{transform:translate(-40%,-30%)}100%{transform:translate(90%,20%)}}
@keyframes f-zickzack{0%{transform:translate(0,0)}25%{transform:translate(60%,-50%)}50%{transform:translate(-30%,-90%)}75%{transform:translate(-90%,-20%)}100%{transform:translate(40%,40%)}}
@keyframes f-wehen{from{transform:skewY(-5deg)}to{transform:skewY(5deg) scaleX(.94)}}
@keyframes f-wippen{from{transform:translateY(0)}to{transform:translateY(-.45px)}}
@keyframes f-pendel{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
@keyframes f-hoppel{0%,62%,78%,100%{transform:translateY(0)}68%{transform:translateY(-1.3px)}73%{transform:translateY(-.2px)}}
@keyframes f-ohren{0%,30%,44%,100%{transform:rotate(0)}34%{transform:rotate(-9deg)}39%{transform:rotate(5deg)}}
@keyframes f-treib{from{transform:translateX(-5px)}to{transform:translateX(7px)}}
@keyframes f-wiege{from{transform:translateY(-.12px) rotate(-1.5deg)}to{transform:translateY(.12px) rotate(1.5deg)}}
@keyframes f-treib2{from{transform:translateX(4px)}to{transform:translateX(-52px)}}
@keyframes f-herab{from{transform:translateY(-110%)}}
@keyframes f-flattern{from{transform:scaleY(1)}to{transform:scaleY(1.1)}}`;
