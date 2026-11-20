// Die Bonifaziustürme im Stadtbild des Intros (daher der Name „Boniblatt“): zwei Bürotürme am Hauptbahnhof, von der
// Rheinseite aus rechts neben dem Dom. Gezeichnet in Logo-Einheiten des Stadtbands (Breite 1280, Höhe 60, Horizont unten).
// Am 20. OG von Turm A (vier Etagen unter der obersten) hängt immer der Balkon. Darauf steht je Aufruf
//   raucher  zwei Kollegen: Sie ziehen abwechselnd an der Zigarette, die Glut leuchtet auf, sie blasen den Rauch aus
//   kaffee   drei Kolleginnen in der Kaffeepause: Sie nippen reihum, erzählen mit der freien Hand, nicken und lachen
// (gezielt mit ?boni=raucher bzw. ?boni=kaffee, ?boni=aus = leerer Balkon). Weitere Szenen kommen als Fundstück des Tages:
//   putzer   Fensterputzer-Gondel, die langsam an Turm B herabfährt
//   flieger  ein Papierflieger segelt aus dem 20. OG
// Immer dabei: Bürolichter, die nach und nach an- und ausgehen, rote Flugwarnleuchten; im Advent ein Lichterbaum aus Fenstern.

const f = n => +n.toFixed(2);
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const rechteck = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const SOCKEL = 57.5;                               // Oberkante Erdgeschoss; darunter verdecken die Häuser der Stadt die Türme
const KRONE = 1.5;                                 // geschlossenes Band unter der Dachkante

// Ein Turm: Vorderseite (im Licht) mit Fensterbändern zwischen Brüstungen, schmale Seitenfläche (im Schatten), Dachkrone.
// kern = geschlossener Treppenhausstreifen in der Mitte der Vorderseite.
function turm({ x, w, s, oben, geschosse, spalten, kern = 0, r }) {
  const fh = (SOCKEL - oben - KRONE) / geschosse, m = .45, g = .16, luecken = spalten - 1 - (kern ? 1 : 0);
  const cw = (w - 2 * m - kern - luecken * g) / spalten, gh = fh * .56;
  const t = { x, w, s, oben, fh, cw, gh, glas: "", schatten: "", bank: "", glasSeite: "", schattenSeite: "", jalousie: "", schlitz: "", zellen: [] };
  const sx = [];
  for (let c = 0, cx = x + m; c < spalten; c++) { sx.push(cx); cx += cw + (kern && c === spalten / 2 - 1 ? kern : g); }
  for (let n = 1; n <= geschosse; n++) {
    const y = SOCKEL - n * fh + fh * .24;                                  // Fensterband im Geschoss n (1 = 1. OG)
    for (let c = 0; c < spalten; c++) {
      const z = r(); t.zellen.push({ n, c, x: sx[c], y, z });
      t.glas += rechteck(sx[c], y, cw, gh); t.schatten += rechteck(sx[c], y, cw, .13);
      if (z > .34 && z < .47) t.jalousie += rechteck(sx[c], y + .13, cw, gh * (.3 + (z - .34) * 3));
    }
    t.bank += rechteck(x + m, y + gh, w - 2 * m, .1);
    if (kern) t.schlitz += rechteck(x + w / 2 - .13, y + gh * .15, .26, gh * .7);
    const b = (s - .75) / 2;
    t.glasSeite += rechteck(x + w + .3, y, b, gh) + rechteck(x + w + .45 + b, y, b, gh);
    t.schattenSeite += rechteck(x + w + .3, y, s - .6, .13);
  }
  return t;
}

const r = zufall(41);
const A = turm({ x: 707, w: 11, s: 2.8, oben: 8.6, geschosse: 24, spalten: 6, kern: .9, r });
const BT = turm({ x: 724.2, w: 9.4, s: 2.5, oben: 14.4, geschosse: 21, spalten: 5, r });
const zelle = (t, n, c) => t.zellen.find(z => z.n === n && z.c === c);

// Fassade eines Turms: Flächen, Glas mit Himmelsverlauf und Spiegelung, Brüstungslinien, Jalousien, Kanten, Dachkrone
function fassade(t, id) {
  const { x, w, s, oben } = t, re = x + w, lamellen = (() => { let d = ""; for (let lx = x + .6; lx < re - .3; lx += .62) d += `M${f(lx)} ${f(oben + .45)}v${f(KRONE - .65)}`; return d; })();
  return `<defs><clipPath id="${id}"><path d="${t.glas}"/></clipPath></defs>`
    + `<path fill="url(#bt-vorn)" d="${rechteck(x, oben, w, 60 - oben)}"/><path fill="url(#bt-seite)" d="${rechteck(re, oben, s, 60 - oben)}"/>`
    + (t.schlitz ? `<path fill="#cbc4b8" d="${rechteck(x + w / 2 - .45, oben + KRONE, .9, SOCKEL - oben - KRONE)}"/><path fill="#9aa7ae" d="${t.schlitz}"/>` : "")
    + `<path fill="url(#bt-glas)" d="${t.glas}"/><path fill="url(#bt-glas2)" d="${t.glasSeite}"/>`
    + `<g clip-path="url(#${id})"><path fill="#fff" opacity=".2" d="M${x} ${f(oben + 15)}L${re} ${f(oben + 4)}V${f(oben + 11)}L${x} ${f(oben + 22)}ZM${x} ${f(oben + 27)}L${re} ${f(oben + 16)}V${f(oben + 18.5)}L${x} ${f(oben + 29.5)}Z"/></g>`
    + `<path fill="#d8dcdb" d="${t.jalousie}"/><path fill="#75858f" opacity=".75" d="${t.schatten}"/><path fill="#6b7880" opacity=".7" d="${t.schattenSeite}"/><path fill="#ebe6de" d="${t.bank}"/>`
    + `<path fill="#f1ede6" opacity=".7" d="${rechteck(x, oben, .22, 60 - oben)}"/><path fill="#a39b8f" d="${rechteck(re - .07, oben, .14, 60 - oben)}"/>`
    // Dachkrone: Band mit feinen Lamellen, darüber eine helle, leicht überstehende Abdeckung
    + `<path fill="#dcd6cc" d="${rechteck(x, oben, w, KRONE)}"/><path fill="#b9b1a5" d="${rechteck(re, oben, s, KRONE)}"/>`
    + `<path fill="none" stroke="#c5bdb1" stroke-width=".08" d="${lamellen}"/><path fill="#a9a195" opacity=".8" d="${rechteck(x, oben + KRONE - .12, w + s, .12)}"/>`
    + `<path fill="#ece8e0" d="${rechteck(x - .2, oben - .08, w + .2, .36)}"/><path fill="#cfc8bd" d="${rechteck(re, oben - .08, s + .2, .36)}"/>`;
}

// Bürolichter: einige brennen schon, andere gehen nacheinander an, wenige wieder aus, ein paar flackern im Takt
function lichter(t, schonAn = .06) {
  let fest = "", mehr = "", einzeln = "";
  for (const z of t.zellen) {
    const d = rechteck(z.x, z.y + .13, t.cw, t.gh - .13);
    if (z.z < schonAn) fest += d;
    else if (z.z < .15) einzeln += `<path class="bt-an" style="--v:${f(2.2 + r() * 13)}s" d="${d}"/>`;
    else if (z.z < .18) einzeln += `<path class="bt-aus" style="--v:${f(5 + r() * 12)}s" d="${d}"/>`;
    else if (z.z < .2) einzeln += `<path class="bt-flack" style="--v:${f(r() * 8)}s;--d:${f(11 + r() * 14)}s" d="${d}"/>`;
    else if (z.z < .32) mehr += d;
  }
  return `<g class="bt-licht"><path d="${fest}"/><path class="bt-mehr" d="${mehr}"/>${einzeln}</g>`;
}

// Lichterbaum im Advent: Fenster von Turm B bilden einen Baum mit Stern
const BAUM = (() => {
  const reihen = { 20: [2], 19: [2], 18: [1, 2, 3], 17: [1, 2, 3], 16: [0, 1, 2, 3, 4], 15: [0, 1, 2, 3, 4], 14: [2], 13: [2] };
  let d = "", stern = "";
  for (const z of BT.zellen) if (reihen[z.n]?.includes(z.c)) { const k = rechteck(z.x, z.y + .13, BT.cw, BT.gh - .13); if (z.n === 20) stern += k; else d += k; }
  return `<g class="bt-baum"><path fill="#ffd77a" d="${stern}"/><path fill="#9fd08a" d="${d}"/></g>`;
})();

// ---- Dachaufbauten: Geländer, Technikgeschoss mit Lüftungslamellen, Aufzugsüberfahrt, Antennenmast, Flugwarnleuchten ----
const gelaender = (x1, x2, y) => { let d = `M${f(x1)} ${f(y - .72)}H${f(x2)}M${f(x1)} ${f(y - .36)}H${f(x2)}`; for (let x = x1; x <= x2 + .01; x += (x2 - x1) / Math.round((x2 - x1) / 1.5)) d += `M${f(x)} ${f(y - .72)}V${f(y - .08)}`; return d; };
const kasten = (x, y, w, h, s, lam = 0) => `<path fill="#cdc6ba" d="${rechteck(x, y, w, h)}"/><path fill="#b1a99d" d="${rechteck(x + w, y, s, h)}"/><path fill="#e3ded5" d="${rechteck(x - .08, y - .06, w + .08, .24)}"/><path fill="#c2baae" d="${rechteck(x + w, y - .06, s + .08, .24)}"/>`
  + (lam ? `<path fill="none" stroke="#a79f93" stroke-width=".09" d="${Array.from({ length: lam }, (_, i) => `M${f(x + .5)} ${f(y + .55 + i * .34)}h${f(w * .42)}M${f(x + w * .58)} ${f(y + .55 + i * .34)}h${f(w * .42 - .5)}`).join("")}"/>` : "");
const ax = A.x, ao = A.oben - .08, bx = BT.x, bo = BT.oben - .08, MAST = ax + 4.6;
const DACH = `<path fill="none" stroke="#91897d" stroke-width=".07" d="${gelaender(ax + .3, ax + A.w + A.s - .3, ao)}${gelaender(bx + .3, bx + BT.w + BT.s - .3, bo)}"/>`
  + kasten(ax + 2.3, ao - 2.5, 5.4, 2.5, 1.3, 4) + kasten(ax + 9.2, ao - 1.5, 1.6, 1.5, .7)
  // Antennenmast mit Querträgern, Richtfunkschüssel und Abspannung
  + `<path fill="none" stroke="#a69e92" stroke-width=".05" d="M${MAST} ${f(ao - 6.1)}L${f(ax + 2.5)} ${f(ao - 2.5)}M${MAST} ${f(ao - 6.1)}L${f(ax + 7.5)} ${f(ao - 2.5)}"/>`
  + `<path fill="none" stroke="#877f74" stroke-width=".2" stroke-linecap="round" d="M${MAST} ${f(ao - 2.5)}V${f(ao - 7.1)}"/>`
  + `<path fill="none" stroke="#877f74" stroke-width=".11" stroke-linecap="round" d="M${f(MAST - .95)} ${f(ao - 4.5)}h1.9M${f(MAST - .6)} ${f(ao - 5.5)}h1.2M${f(MAST - .95)} ${f(ao - 4.5)}v-.5M${f(MAST + .95)} ${f(ao - 4.5)}v-.5M${f(MAST - .6)} ${f(ao - 5.5)}v-.38M${f(MAST + .6)} ${f(ao - 5.5)}v-.38"/>`
  + `<ellipse cx="${f(MAST - .5)}" cy="${f(ao - 3.5)}" rx=".3" ry=".44" fill="#e6e1d8" stroke="#8f877b" stroke-width=".07"/><path stroke="#8f877b" stroke-width=".07" d="M${f(MAST - .2)} ${f(ao - 3.5)}h.2"/>`
  + kasten(bx + 1.9, bo - 1.9, 4.6, 1.9, 1.1, 3) + kasten(bx + 7.3, bo - 1.05, 1.5, 1.05, .6)
  + `<path fill="none" stroke="#877f74" stroke-width=".13" stroke-linecap="round" d="M${f(bx + 3.1)} ${f(bo - 1.9)}v-2.3M${f(bx + 2.65)} ${f(bo - 3.4)}h.9"/>`
  + `<g class="bt-warn"><circle class="bt-hof" cx="${MAST}" cy="${f(ao - 7.3)}" r="1.05"/><circle cx="${MAST}" cy="${f(ao - 7.3)}" r=".36"/>`
  + `<circle class="bt-hof" cx="${f(bx + 3.1)}" cy="${f(bo - 4.35)}" r=".85"/><circle cx="${f(bx + 3.1)}" cy="${f(bo - 4.35)}" r=".3"/>`
  + `<circle cx="${f(ax + .35)}" cy="${f(ao - .86)}" r=".2"/><circle cx="${f(ax + A.w + A.s - .35)}" cy="${f(ao - .86)}" r=".2"/><circle cx="${f(bx + BT.w + BT.s - .35)}" cy="${f(bo - .86)}" r=".2"/></g>`
  + `<path class="bt-schnee" d="${[[ax - .2, ao, A.w + A.s + .4], [ax + 2.2, ao - 2.56, 6.8], [bx - .2, bo, BT.w + BT.s + .4], [bx + 1.8, bo - 1.96, 5.9]].map(([x, y, w]) => `M${f(x)} ${f(y + .12)}q${f(w / 2)} ${f(-.62)} ${f(w)} 0v.2h${f(-w)}Z`).join("")}"/>`;

// Flachbau zwischen den Türmen (schaut nur zwischen den Häusern der Stadt hervor)
const FLACHBAU = `<path fill="#cfc8bd" d="${rechteck(703.5, 53.4, 36, 6.6)}"/><path fill="#e6e1d8" d="${rechteck(703.3, 53.25, 36.4, .3)}"/><path fill="#97a5ad" d="${rechteck(704.2, 54.5, 34.6, .9)}${rechteck(704.2, 56.4, 34.6, .9)}"/>`;

// ---- Raucherbalkon im 20. OG von Turm A (vier Etagen unter der obersten), an der linken Gebäudekante ----
const ETAGE = 20, BODEN = SOCKEL - (ETAGE - 1) * A.fh, BL = 702;                   // Fußboden und linke Kante des Balkons
const TUER = zelle(A, ETAGE, 0);
const TAKT = 8, PAUSE = 10;                                                         // Sekunden je Zug an der Zigarette / je Schluck Kaffee
// Eine kleine Figur am Geländer (k = Größe). ding: "zig" = Zigarette, "becher" = Kaffeebecher.
// Ruhehaltung: Unterarm schräg nach vorn unten, die Hand liegt am Handlauf. Beim Zug bzw. Schluck dreht der Unterarm
// nach oben (Hand vor dem Mund); Zigarette bzw. Becher drehen gegenläufig, damit sie richtig zum Gesicht stehen.
function mensch({ x, s, k = 1, mantel, arm, hose, haar, haut = "#e8bf9b", schal, frisur = "kurz", bart, rock, ding = "zig", band = "#c8102e", v, d }) {
  const y = BODEN, X = a => x + s * a * k, N = a => x + a * k, Y = b => y - b * k, b = n => f(n * k);
  const S = [X(.14), Y(1.76)], E = [X(.38), Y(1.42)];                                // Schulter, Ellbogen
  const hand = [E[0] + s * .386 * k, E[1] + .46 * k], spitze = [hand[0] + s * .17 * k, hand[1] - .2 * k], mund = [X(.3), Y(2.07)];
  const kx = X(.04), ky = Y(2.2), st = `--s:${s};--v:${v}s`, kaffee = ding === "becher";
  const bx = hand[0] + s * .03 * k, bo = hand[1] - .33 * k;                          // Becher: Mitte und Oberkante
  const haare = {
    kurz: `<circle cx="${f(kx - s * .05 * k)}" cy="${f(ky - .05 * k)}" r="${b(.28)}" fill="${haar}"/>`,
    // leichte Locken: ein Kranz kleiner Kringel über Stirn, Scheitel und Hinterkopf
    locken: `<circle cx="${f(kx - s * .04 * k)}" cy="${f(ky - .03 * k)}" r="${b(.25)}" fill="${haar}"/><path fill="${haar}" d="${[-58, -30, -2, 26, 54, 82, 108].map((a, i) => { const w = a * Math.PI / 180, r = (i % 2 ? .125 : .11) * k, cx = kx - s * Math.sin(w) * .225 * k, cy = ky - .02 * k - Math.cos(w) * .235 * k; return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`; }).join("")}"/>`,
    // lange Haare, die über den Rücken fallen
    lang: `<circle cx="${f(kx - s * .05 * k)}" cy="${f(ky - .05 * k)}" r="${b(.285)}" fill="${haar}"/><path fill="${haar}" d="M${f(kx - s * .02 * k)} ${f(ky - .1 * k)}L${f(kx - s * .31 * k)} ${f(ky - .1 * k)}Q${f(kx - s * .4 * k)} ${f(ky + .3 * k)} ${f(kx - s * .33 * k)} ${f(ky + .62 * k)}Q${f(kx - s * .16 * k)} ${f(ky + .66 * k)} ${f(kx - s * .1 * k)} ${f(ky + .5 * k)}Z"/>`,
    // Pferdeschwanz mit Haargummi
    zopf: `<circle cx="${f(kx - s * .05 * k)}" cy="${f(ky - .05 * k)}" r="${b(.275)}" fill="${haar}"/><path class="bt-zopf" style="transform-origin:${f(kx - s * .28 * k)}px ${f(ky - .14 * k)}px" fill="none" stroke="${haar}" stroke-width="${b(.15)}" stroke-linecap="round" d="M${f(kx - s * .28 * k)} ${f(ky - .14 * k)}Q${f(kx - s * .56 * k)} ${f(ky - .08 * k)} ${f(kx - s * .46 * k)} ${f(ky + .44 * k)}"/><circle cx="${f(kx - s * .33 * k)}" cy="${f(ky - .13 * k)}" r="${b(.06)}" fill="${band}"/>`,
    // Dutt
    dutt: `<circle cx="${f(kx - s * .05 * k)}" cy="${f(ky - .04 * k)}" r="${b(.27)}" fill="${haar}"/><circle cx="${f(kx - s * .2 * k)}" cy="${f(ky - .36 * k)}" r="${b(.15)}" fill="${haar}"/>`,
  }[frisur];
  const beinB = rock ? .15 : .23, saum = rock ? .62 : .9, weit = rock ? .44 : .35;
  return {
    figur: `<g class="bt-m${kaffee ? " bt-m2" : ""}" style="transform-origin:${f(x)}px ${f(y)}px;--d:${d}s;--v:${v}s">`
    // hinterer Arm (bei den Kaffeetrinkerinnen gestikuliert er)
    + `<path${kaffee ? ` class="bt-geste" style="transform-origin:${f(X(-.2))}px ${f(Y(1.74))}px;${st};--g:${-62 * s}deg"` : ""} fill="none" stroke="${arm}" stroke-width="${b(.2)}" stroke-linecap="round" opacity=".85" d="M${f(X(-.2))} ${f(Y(1.74))}L${f(X(-.3))} ${f(Y(1.12))}"/>`
    + `<path fill="${hose}" d="${rechteck(N(-.27) + (rock ? .05 * k : 0), Y(1.05), beinB * k, 1.05 * k)}${rechteck(N(.04) + (rock ? .03 * k : 0), Y(1.05), beinB * k, 1.05 * k)}"/>`
    + `<path fill="#2c2825" d="${rechteck(N(-.29) + s * .05 * k, Y(.11), .3 * k, .11 * k)}${rechteck(N(.02) + s * .05 * k, Y(.11), .3 * k, .11 * k)}"/>`
    + `<path fill="${mantel}" d="M${f(N(-weit))} ${f(Y(saum))}L${f(N(-.3))} ${f(Y(1.7))}Q${f(N(-.3))} ${f(Y(1.93))} ${f(N(-.08))} ${f(Y(1.93))}H${f(N(.08))}Q${f(N(.3))} ${f(Y(1.93))} ${f(N(.3))} ${f(Y(1.7))}L${f(N(weit))} ${f(Y(saum))}Z"/>`
    + `<path fill="${arm}" opacity=".55" d="${rechteck(X(.19) - .03 * k, Y(1.75), .06 * k, .82 * k)}"/>`
    // Dienstausweis am Band
    + `<path fill="none" stroke="#f4efe6" stroke-width="${b(.035)}" d="M${f(X(-.1))} ${f(Y(1.9))}L${f(X(.02))} ${f(Y(1.5))}L${f(X(.12))} ${f(Y(1.9))}"/><path fill="#fbf8f2" d="${rechteck(X(.02) - .06 * k, Y(1.5), .12 * k, .16 * k)}"/>`
    + `<path fill="${schal}" d="${rechteck(N(-.19), Y(1.99), .38 * k, .15 * k)}"/>`
    + `<g class="${kaffee ? "bt-kopf2" : "bt-kopf"}" style="transform-origin:${f(x)}px ${f(Y(1.95))}px;${st};--k:${(kaffee ? -8 : -11) * s}deg">` + haare
    + `<circle cx="${f(kx + s * .045 * k)}" cy="${f(ky + .04 * k)}" r="${b(.235)}" fill="${haut}"/>`
    + (bart ? `<path fill="none" stroke="${haar}" stroke-width="${b(.1)}" stroke-linecap="round" opacity=".9" d="M${f(kx + s * .045 * k - s * .19 * k)} ${f(ky + .1 * k)}A${b(.2)} ${b(.2)} 0 0 ${s > 0 ? 0 : 1} ${f(kx + s * .045 * k + s * .16 * k)} ${f(ky + .17 * k)}"/>` : "")
    + `<circle cx="${f(kx + s * .15 * k)}" cy="${f(ky + .01 * k)}" r="${b(.028)}" fill="#2e2622"/></g>`
    + `<path fill="none" stroke="${arm}" stroke-width="${b(.21)}" stroke-linecap="round" d="M${f(S[0])} ${f(S[1])}L${f(E[0])} ${f(E[1])}"/>`
    + `<g class="${kaffee ? "bt-arm2" : "bt-arm"}" style="transform-origin:${f(E[0])}px ${f(E[1])}px;${st};--w:${(kaffee ? -105 : -138) * s}deg">`
    + (kaffee
      // Becher mit Deckel und farbiger Manschette
      ? `<g class="bt-bech" style="transform-origin:${f(hand[0])}px ${f(hand[1])}px;${st};--w:${55 * s}deg"><path fill="#fbf8f2" d="M${f(bx - .115 * k)} ${f(bo)}h${b(.23)}l${b(-.03)} ${b(.37)}h${b(-.17)}Z"/><path fill="${band}" d="${rechteck(bx - .105 * k, bo + .13 * k, .21 * k, .12 * k)}"/><path fill="#5f564c" d="${rechteck(bx - .13 * k, bo - .04 * k, .26 * k, .06 * k)}"/></g>`
      : `<g class="bt-zig" style="transform-origin:${f(hand[0])}px ${f(hand[1])}px;${st};--w:${178 * s}deg"><path fill="none" stroke="#fbf7ef" stroke-width="${b(.075)}" d="M${f(hand[0])} ${f(hand[1])}L${f(spitze[0])} ${f(spitze[1])}"/>`
        + `<circle class="bt-glut" style="--v:${v}s" cx="${f(spitze[0])}" cy="${f(spitze[1])}" r="${b(.07)}"/></g>`)
    + `<path fill="none" stroke="${arm}" stroke-width="${b(.2)}" stroke-linecap="round" d="M${f(E[0])} ${f(E[1])}L${f(hand[0] - s * .05 * k)} ${f(hand[1] - .06 * k)}"/>`
    + `<circle cx="${f(hand[0])}" cy="${f(hand[1])}" r="${b(.105)}" fill="${haut}"/></g></g>`,
    // Rauch: feiner Faden von der Zigarette (solange die Hand unten ist) und drei Wölkchen beim Ausatmen.
    // Kaffee: Dampf über dem Becher, solange er am Geländer steht.
    rauch: kaffee ? `<path class="bt-dampf" style="--v:${v}s" d="M${f(bx)} ${f(bo - .1 * k)}c.16-.2-.14-.4 0-.62s.14-.36-.02-.6"/>`
      : `<path class="bt-faden" style="--v:${v}s" d="M${f(spitze[0])} ${f(spitze[1] - .07)}c.2-.28-.18-.56 0-.86s.18-.5-.02-.84"/>`
      + [0, 1, 2].map(i => `<circle class="bt-hauch" style="--s:${s};--v:${f(v + i * .28)}s" cx="${f(mund[0])}" cy="${f(mund[1])}" r="${f(.15 + i * .03)}"/>`).join("") };
}
// Zwei Kollegen beim Rauchen: links der Herausgeber (dunkle, leicht lockige Haare, kurzer Bart, dunkles Hemd), rechts ein Kollege
const M1 = mensch({ x: 703.4, s: 1, mantel: "#343a48", arm: "#444b5c", hose: "#4b5261", haar: "#2a211c", haut: "#d9a982", schal: "#4a5163", frisur: "locken", bart: true, v: 0, d: 5.3 });
const M2 = mensch({ x: 706.15, s: -1, mantel: "#b4513d", arm: "#c7624c", hose: "#4a4038", haar: "#7a5638", schal: "#efe9dd", v: -4, d: 6.4 });
// Drei Kolleginnen in der Kaffeepause: Sie nippen reihum am Becher, erzählen mit der freien Hand, nicken und lachen
const F1 = mensch({ x: 702.95, s: 1, k: .95, ding: "becher", mantel: "#d9a441", arm: "#e6b657", hose: "#3f3a44", haar: "#3b2a22", schal: "#f3ece0", frisur: "lang", rock: true, band: "#c8102e", v: 0, d: 5.6 });
const F2 = mensch({ x: 704.84, s: -1, k: .97, ding: "becher", mantel: "#2f7f86", arm: "#41979e", hose: "#3f4654", haar: "#d2a95c", schal: "#e9e2d4", frisur: "zopf", band: "#f19a4a", v: -3.6, d: 6.2 });
const F3 = mensch({ x: 706.2, s: -1, k: .93, ding: "becher", mantel: "#a8456b", arm: "#bd5c82", hose: "#4a4038", haar: "#8a4a2e", haut: "#e3b48f", schal: "#f6dfe6", frisur: "dutt", rock: true, band: "#2f7f86", v: -6.9, d: 5.1 });
// Der Balkon selbst ist immer da; darauf stehen je Aufruf die Raucher oder die Kaffeerunde.
const BALKON = `<g class="bt-balkon">`
  + `<path class="bt-tuer" d="${rechteck(TUER.x, TUER.y + .13, A.cw, A.gh - .13)}"/>`
  + `<path fill="#aaa296" d="M707 ${f(BODEN + .3)}V${f(BODEN + 1.55)}L${f(BL + 1.6)} ${f(BODEN + .3)}Z"/><path fill="#c9c2b6" d="${rechteck(BL, BODEN, 707 - BL, .3)}"/><path fill="#e9e4dc" d="${rechteck(BL, BODEN, 707 - BL, .09)}"/>`
  // Standaschenbecher links
  + `<path fill="none" stroke="#6f675d" stroke-width=".09" d="M${f(BL + .42)} ${f(BODEN)}v-.78"/><path fill="#7d756a" d="${rechteck(BL + .25, BODEN - .92, .34, .16)}"/>`
  + `<g class="bt-raucher">${M1.figur}${M2.figur}</g><g class="bt-kaffee">${F1.figur}${F2.figur}${F3.figur}</g>`
  // Glasbrüstung mit Handlauf und Pfosten (vor den Beinen)
  + `<path fill="#c3d2d8" opacity=".42" d="${rechteck(BL + .05, BODEN - .98, 707 - BL - .05, .98)}"/><path fill="#fff" opacity=".35" d="M${f(BL + .7)} ${f(BODEN - .98)}h.5l-.55 .98h-.5ZM${f(BL + 3.6)} ${f(BODEN - .98)}h.28l-.55 .98h-.28Z"/>`
  + `<path fill="none" stroke="#6f675d" stroke-width=".11" stroke-linecap="round" d="M${f(BL)} ${f(BODEN - 1.03)}H707"/><path fill="none" stroke="#7d756a" stroke-width=".08" d="M${f(BL + .05)} ${f(BODEN - 1.03)}V${f(BODEN)}M${f(BL + 1.7)} ${f(BODEN - 1.03)}V${f(BODEN)}M${f(BL + 3.35)} ${f(BODEN - 1.03)}V${f(BODEN)}"/>`
  + `<g class="bt-raucher">${M1.rauch}${M2.rauch}</g><g class="bt-kaffee">${F1.rauch}${F2.rauch}${F3.rauch}</g></g>`;

// ---- Fensterputzer an Turm B: Seile (wachsen mit) und Gondel mit Person, die wischt ----
const GY = BT.oben + 2.6, S1 = bx + 1.2, S2 = bx + 8.2, FAHRT = 24;
const PUTZER = `<g class="bt-putzer"><path class="bt-seil" fill="none" stroke="#7d756b" stroke-width=".09" d="M${S1} ${f(BT.oben)}V${GY}M${S2} ${f(BT.oben)}V${GY}"/>`
  + `<g class="bt-gondel"><path fill="#3f6fa3" d="M${f(bx + 4.4)} ${f(GY + .12)}v-.75q.3-.22 .6 0v.75Z"/><circle cx="${f(bx + 4.7)}" cy="${f(GY - .86)}" r=".25" fill="#e8bf9b"/><path fill="#f0c53f" d="M${f(bx + 4.42)} ${f(GY - .9)}a.28 .28 0 0 1 .56 0h.1v.07h-.76v-.07Z"/>`
  + `<g class="bt-wisch" style="transform-origin:${f(bx + 4.95)}px ${f(GY - .5)}px"><path fill="none" stroke="#3f6fa3" stroke-width=".16" stroke-linecap="round" d="M${f(bx + 4.95)} ${f(GY - .5)}l.6-.5"/><path fill="none" stroke="#5d564d" stroke-width=".09" stroke-linecap="round" d="M${f(bx + 5.45)} ${f(GY - 1.15)}l.25 .3"/></g>`
  + `<path fill="#8fb6d9" d="${rechteck(bx + 3.5, GY - .3, .36, .42)}"/>`
  + `<path fill="#e3a33c" d="${rechteck(S1 - .5, GY + .12, S2 - S1 + 1, .6)}"/><path fill="#f3c467" d="${rechteck(S1 - .5, GY + .12, S2 - S1 + 1, .13)}"/>`
  + `<path fill="none" stroke="#9a6e2a" stroke-width=".09" d="M${f(S1 - .45)} ${f(GY - .42)}H${f(S2 + .45)}M${f(S1 - .45)} ${f(GY - .42)}V${f(GY + .12)}M${f(S2 + .45)} ${f(GY - .42)}V${f(GY + .12)}M${f((S1 + S2) / 2)} ${f(GY - .42)}V${f(GY + .12)}"/></g></g>`;

// ---- Papierflieger aus dem 20. OG ----
const FENSTER = zelle(A, ETAGE, 5);
const FLIEGER = `<g transform="translate(${f(FENSTER.x + 1)} ${f(FENSTER.y + .4)}) scale(1.8)"><g class="bt-flieger"><path fill="#fffdf8" stroke="#8c847a" stroke-width=".05" stroke-linejoin="round" d="M-.5 -.12L.78 0L-.5 .3L-.26 .03Z"/><path fill="#d9d2c6" d="M-.5 .3L-.26 .03L-.08 .2Z"/></g></g>`;

// In das Stadtband, hinter die Häuser der Stadt gezeichnet (die Häuser stehen davor und verdecken den Fuß)
export const BONI_SVG = `<g class="bt" aria-hidden="true"><defs>`
  + `<linearGradient id="bt-vorn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dad4ca"/><stop offset="1" stop-color="#cdc6bb"/></linearGradient>`
  + `<linearGradient id="bt-seite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfb7ab"/><stop offset="1" stop-color="#b5ada1"/></linearGradient>`
  + `<linearGradient id="bt-glas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aebdc5"/><stop offset=".6" stop-color="#96a5ae"/><stop offset="1" stop-color="#8f9da5"/></linearGradient>`
  + `<linearGradient id="bt-glas2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d9ba3"/><stop offset="1" stop-color="#78858d"/></linearGradient>`
  + `<linearGradient id="bt-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`
  + FLACHBAU + fassade(A, "bt-ka") + fassade(BT, "bt-kb")
  + `<g class="bt-a">${lichter(A)}</g><g class="bt-b">${lichter(BT)}</g>${BAUM}`
  + DACH + BALKON + PUTZER + FLIEGER + `</g>`;

export const BONI_CSS = `
.bt-licht{fill:#f7da97}.bt-baum,.bt-raucher,.bt-kaffee,.bt-putzer,.bt-flieger,.bt-schnee{display:none}
.intro:not([data-wetter="sonne"]) .bt-mehr{fill:#f3d892}.intro[data-wetter="sonne"] .bt-mehr{display:none}
.bt-an{animation:bt-an .5s ease var(--v) both}.bt-aus{animation:bt-an .5s ease var(--v) reverse both}
.bt-flack{animation:bt-flack var(--d) steps(1,end) var(--v) infinite}
@keyframes bt-an{from{opacity:0}to{opacity:1}}
@keyframes bt-flack{0%,44%{opacity:0}45%,88%{opacity:1}89%,100%{opacity:0}}
.bt-warn{fill:#e8463c;animation:bt-warn 2.6s ease-in-out infinite}.bt-hof{opacity:.22}
@keyframes bt-warn{0%,100%{opacity:.25}10%,24%{opacity:1}34%{opacity:.25}}
.intro[data-wetter="schnee"] .bt-schnee{display:inline;fill:#fbfcfe}
.intro[data-fest~="tannenbaum"] .bt-baum{display:inline;animation:bt-an .8s ease 2.4s both}
.intro[data-fest~="tannenbaum"] .bt-b .bt-licht{display:none}
.intro[data-boni~="raucher"] .bt-raucher,.intro[data-boni~="kaffee"] .bt-kaffee{display:inline}
.bt-tuer{fill:#ffe2a0}
.bt-m,.bt-kopf,.bt-kopf2,.bt-arm,.bt-arm2,.bt-zig,.bt-bech,.bt-geste,.bt-zopf,.bt-wisch{transform-box:view-box}
.bt-m{animation:bt-wiegen var(--d) ease-in-out infinite alternate}
@keyframes bt-wiegen{from{rotate:-1.4deg}to{rotate:1.7deg}}
.bt-arm,.bt-zig{animation:bt-zug ${TAKT}s cubic-bezier(.45,0,.3,1) var(--v) infinite}
@keyframes bt-zug{0%,8%{rotate:0deg}19%,31%{rotate:var(--w)}43%,66%{rotate:0deg}69%{rotate:calc(var(--w) * -.05)}71%{rotate:0deg}73%{rotate:calc(var(--w) * -.04)}76%,100%{rotate:0deg}}
.bt-kopf{animation:bt-kopf ${TAKT}s ease-in-out var(--v) infinite}
@keyframes bt-kopf{0%,40%{rotate:0deg}48%,60%{rotate:var(--k)}70%,82%{rotate:0deg}86%{rotate:calc(var(--k) * -.5)}90%{rotate:0deg}94%{rotate:calc(var(--k) * -.4)}98%,100%{rotate:0deg}}
.bt-glut{fill:#ee5f28;transform-box:fill-box;transform-origin:50% 50%;animation:bt-glut ${TAKT}s ease-in-out var(--v) infinite}
@keyframes bt-glut{0%,19%{scale:1;fill:#ee5f28}23%,29%{scale:1.6;fill:#ffb53d}37%,100%{scale:1;fill:#ee5f28}}
.bt-faden{fill:none;stroke:url(#bt-fg);stroke-width:.08;stroke-linecap:round;stroke-dasharray:.46 .26;animation:bt-faden 1.9s linear infinite,bt-fadenweg ${TAKT}s linear var(--v) infinite}
@keyframes bt-faden{to{stroke-dashoffset:-1.44}}
@keyframes bt-fadenweg{0%,6%{opacity:1}9%,43%{opacity:0}50%,100%{opacity:1}}
.bt-hauch{fill:#fdfcfa;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:bt-hauch ${TAKT}s ease-out var(--v) infinite}
@keyframes bt-hauch{0%,47%{opacity:0;translate:0 0;scale:.3}50%{opacity:.85;translate:calc(var(--s) * .15px) -.15px;scale:.6}
  63%{opacity:.55;translate:calc(var(--s) * .55px) -1.3px;scale:1.8}78%{opacity:.25;translate:calc(var(--s) * .4px + .7px) -2.6px;scale:2.7}90%,100%{opacity:0;translate:calc(var(--s) * .3px + 1.6px) -3.7px;scale:3.3}}
/* Kaffeerunde: Schluck (Arm hoch, Becher kippt, Kopf leicht zurück), danach erzählen, nicken, lachen */
.bt-m2{animation:bt-wiegen var(--d) ease-in-out infinite alternate,bt-lachen ${PAUSE}s ease-in-out var(--v) infinite}
@keyframes bt-lachen{0%,70%{translate:0 0}72%{translate:0 -.07px}74%{translate:0 0}76%{translate:0 -.06px}78%{translate:0 0}80%{translate:0 -.04px}82%,100%{translate:0 0}}
.bt-arm2,.bt-bech{animation:bt-schluck ${PAUSE}s cubic-bezier(.45,0,.3,1) var(--v) infinite}
@keyframes bt-schluck{0%,5%{rotate:0deg}15%,19%{rotate:calc(var(--w) * .93)}22%,27%{rotate:var(--w)}39%,100%{rotate:0deg}}
.bt-kopf2{animation:bt-kopf2 ${PAUSE}s ease-in-out var(--v) infinite}
@keyframes bt-kopf2{0%,17%{rotate:0deg}22%,27%{rotate:var(--k)}35%,50%{rotate:0deg}54%{rotate:calc(var(--k) * -.7)}58%{rotate:0deg}62%{rotate:calc(var(--k) * -.6)}66%,70%{rotate:0deg}75%,80%{rotate:calc(var(--k) * .8)}86%,100%{rotate:0deg}}
.bt-geste{animation:bt-geste ${PAUSE}s ease-in-out var(--v) infinite}
@keyframes bt-geste{0%,42%{rotate:0deg}48%{rotate:var(--g)}52%{rotate:calc(var(--g) * .6)}56%{rotate:var(--g)}60%{rotate:calc(var(--g) * .7)}64%{rotate:calc(var(--g) * .95)}72%,100%{rotate:0deg}}
.bt-zopf{animation:bt-zopf 3.1s ease-in-out infinite alternate}
@keyframes bt-zopf{from{rotate:-7deg}to{rotate:8deg}}
.bt-dampf{fill:none;stroke:url(#bt-fg);stroke-width:.09;stroke-linecap:round;stroke-dasharray:.3 .2;animation:bt-faden 2.3s linear infinite,bt-dampfweg ${PAUSE}s linear var(--v) infinite}
@keyframes bt-dampfweg{0%,4%{opacity:.9}7%,40%{opacity:0}47%,100%{opacity:.9}}
.intro[data-boni~="putzer"] .bt-putzer{display:inline;animation:bt-an .6s ease 3s both}
.bt-gondel{animation:bt-gondel 80s ease-in-out 3s infinite alternate both}
.bt-seil{transform-box:fill-box;transform-origin:50% 0;animation:bt-seil 80s ease-in-out 3s infinite alternate both}
@keyframes bt-gondel{from{translate:0 0}to{translate:0 ${FAHRT}px}}
@keyframes bt-seil{from{scale:1 1}to{scale:1 ${f((FAHRT + GY - BT.oben) / (GY - BT.oben))}}}
.bt-wisch{animation:bt-wisch .9s ease-in-out infinite alternate}
@keyframes bt-wisch{from{rotate:-30deg}to{rotate:28deg}}
.intro[data-boni~="flieger"] .bt-flieger{display:inline;animation:bt-flieger 16s linear 4.4s infinite both}
@keyframes bt-flieger{0%{opacity:0;translate:0 0;rotate:-8deg}2%{opacity:1}14%{translate:7px 1.2px;rotate:6deg}28%{translate:14px 3.8px;rotate:-7deg}
  42%{translate:21px 7.8px;rotate:9deg}54%{translate:27px 12.5px;rotate:14deg;opacity:1}60%,100%{translate:30px 15px;rotate:16deg;opacity:0}}
`;

// Läuft im Browser: Auf dem Balkon stehen je Aufruf die Raucher oder die Kaffeerunde (?boni=raucher / ?boni=kaffee,
// ?boni=aus = niemand). Weitere Szenen an den Türmen (putzer, flieger) kommen über die Fundstücke des Tages dazu.
export function boniSzene(intro, q) {
  const teile = q.has("boni") ? q.get("boni").split(",") : [];
  if (!teile.some(t => t === "raucher" || t === "kaffee" || t === "aus")) teile.push(Math.random() < .5 ? "raucher" : "kaffee");
  intro.dataset.boni = teile.join(" ");
}

// Maße der Türme für die Fundstücke (werkzeuge/funde/tuerme.mjs)
export { A, BT, zelle, SOCKEL, KRONE, BODEN, BL, ETAGE, MAST, rechteck };
