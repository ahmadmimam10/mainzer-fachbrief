// Gemeinsame Bausteine für die Fundstücke des Intros (siehe LIES-MICH.md in diesem Ordner).
// Einheiten: wie in der Szene – 128 = Breite des Logos, Bandmitte x = 640, das Logo steht über x 576…704.
// Stadt-, Hügel- und Uferband: 1280 × 60, der Horizont liegt bei y = 60. Wasser: 1280 × 50, der Horizont bei y = 0.

export const f = n => +n.toFixed(2);
export const kreis = (cx, cy, rx, ry = rx) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;
export const rechteck = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
export const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
export const FUSS = 58.4;                                   // Uferband: Oberkante der Kaimauer (hier stehen Leute und Dinge)
export const TINTE = "#3d3934";                             // dunkles Braungrau für Konturen, Schuhe, Tiere
export const BUNT = ["#e9506b", "#f4c542", "#6fb0e6", "#8ccf7e", "#f19a4a", "#b07cd8"];
export const HAUT = ["#e8c9a8", "#d9a982", "#f0d3b8", "#b9835c", "#e3b48f"];

// Hügelkanten (y im Band) – für alles, was auf einem Hügel steht
export const huegelFern = x => 60 - (15 + 6 * Math.sin(x / 120 + 1.4) + 4 * Math.sin(x / 53) + 2 * Math.sin(x / 23 + 2));
export const huegelNah = x => 60 - (9 + 6 * Math.sin(x / 95) + 4 * Math.sin(x / 41 + 1) + 3 * Math.sin(x / 170 + 2));

// Gruppe an einer Stelle, mit Maßstab; innen gelten eigene Einheiten (Ursprung = die Stelle)
export const am = (x, y, g, innen, kl = "", stil = "") => `<g transform="translate(${f(x)} ${f(y)}) scale(${g})">${kl ? `<g class="${kl}"${stil ? ` style="${stil}"` : ""}>${innen}</g>` : innen}</g>`;
// Gruppe, die sich um einen Punkt dreht (Punkt in den Einheiten, die an dieser Stelle gelten). Die Bewegung kommt aus der Klasse.
export const dreh = (kl, x, y, innen, stil = "") => `<g class="${kl}" style="transform-box:view-box;transform-origin:${f(x)}px ${f(y)}px;${stil}">${innen}</g>`;
// Fährt in d Sekunden von x = von bis x = bis durchs Bild und beginnt von vorn (v = Vorlauf in Sekunden, negativ = schon unterwegs).
// innen wird bei x = 0 gezeichnet.
export const fahrt = (innen, { von, bis, d, v = 0, y = 0 }) => `<g transform="translate(0 ${f(y)})"><g class="fu-fahrt" style="--a:${f(von)}px;--b:${f(bis)}px;--d:${d}s;--v:${v}s">${innen}</g></g>`;
// Geht zwischen von und bis hin und her und wendet an den Enden. innen wird bei x = 0 gezeichnet, Blick nach rechts.
export const hinher = (innen, { von, bis, d, v = 0, y = 0 }) => `<g transform="translate(0 ${f(y)})"><g class="fu-hinher" style="transform-box:view-box;transform-origin:0px 0px;--a:${f(von)}px;--b:${f(bis)}px;--d:${d}s;--v:${v}s">${innen}</g></g>`;

// Frei schwebendes Element im Himmel (eigenes kleines Bild). l, t = Lage in % der Logofläche (0/0 = linke obere Ecke des
// Logos, negativ = links davon bzw. darüber), g = Breite als Anteil der Logobreite, fx = Weg zur Seite beim Scrollen.
// Auf breiten Bildschirmen rückt es automatisch seitlich neben den Dom (dort fehlt über dem Logo die Höhe).
export const himmel = (l, t, g, vb, innen, { fx, kl = "", stil = "" } = {}) =>
  `<div class="fu-h${kl ? " " + kl : ""}" style="--l:${l}%;--t:${t}%;--lb:${l < 50 ? l - 58 : l + 58}%;--tb:${f(t * .42)}%;--g:${g};--fx:${fx || (l < 50 ? "-30vw" : "30vw")};${stil}"><svg viewBox="${vb}">${innen}</svg></div>`;

// Zieht quer über den Himmel und beginnt von vorn. t = Höhe in % der Logofläche (negativ = über dem Logo), g = Breite,
// d = Sekunden für eine Überquerung, nachLinks = Flugrichtung (die Zeichnung muss dann nach links schauen).
export const zug = (t, g, vb, innen, { d = 40, v = 0, nachLinks = false } = {}) => { const a = -(54 + g * 56), b = 54;
  return `<div class="fu-h" style="--l:50%;--lb:50%;--t:${t}%;--tb:${f(t * .42)}%;--g:${g};--fx:0vw"><div class="fu-zieh fu-weg" style="--von:${nachLinks ? b : f(a)}vw;--bis:${nachLinks ? f(a) : b}vw;--d:${d}s;--v:${v}s"><svg viewBox="${vb}">${innen}</svg></div></div>`; };

// Kleine Figur von der Seite: Füße bei (0, 0), etwa 5,4 Einheiten hoch (mit am(x, FUSS, 1.3, figur({...})) ≈ 7 hoch = Erwachsene).
// s = Blickrichtung (1 rechts, -1 links). kopf: kurz | lang | zopf | dutt | glatze | muetze | kappe | hut | helm | kapuze (hut = Farbe dafür).
// sitzen: Oberschenkel waagerecht nach vorn (Sitzfläche bei y = -1.75); beine = eigene Zeichnung statt der Beine.
// gehen: Beine und Arme schwingen (takt = Sekunden je Schritt). armV/armH = [x, y] der vorderen/hinteren Hand (sonst hängen die Arme).
// klV/klH = Klasse für den vorderen/hinteren Arm (dreht sich um die Schulter; was in der Hand liegt, dreht mit).
// vorn/hinten = eigene Zeichnung vor bzw. hinter der Figur (z. B. Tasche, Rucksack), inHand = Zeichnung an der vorderen Hand.
export function figur({ s = 1, mantel = "#6b7fa3", hose = "#4b5261", haut = HAUT[0], haar = "#4a3a2e", schuh = TINTE, kopf = "kurz", hut = "#d6243a", rock = false,
  gehen = false, takt = .5, armV, armH, vorn = "", hinten = "", inHand = "", schatten = true, sitzen = false, beine, klV = "", klH = "" } = {}) {
  const ky = -4.7, hx = s * .08, bein = (x, kl) => sitzen
    ? `<path fill="none" stroke="${rock ? haut : hose}" stroke-width="${rock ? .36 : .5}" stroke-linecap="round" stroke-linejoin="round" d="M${x} -2V-1.95H${f(x + s * 1.2)}V-.2"/><ellipse cx="${f(x + s * 1.36)}" cy="-.1" rx=".42" ry=".17" fill="${schuh}"/>`
    : dreh(kl, x, -2.05, `<path fill="none" stroke="${rock ? haut : hose}" stroke-width="${rock ? .36 : .5}" stroke-linecap="round" d="M${x} -2.05V-.2"/><ellipse cx="${f(x + s * .16)}" cy="-.1" rx=".42" ry=".17" fill="${schuh}"/>`);
  const hv = armV || [s * .62, -2.2], hh = armH || [-s * .5, -2.25];
  const arm = (von, bis, kl, dunkel, mit = "") => { const p = `<path fill="none" stroke="${mantel}" stroke-width=".46" stroke-linecap="round" d="M${f(von[0])} ${f(von[1])}L${f(bis[0])} ${f(bis[1])}"/>${dunkel ? `<path fill="none" stroke="#000" stroke-width=".46" stroke-linecap="round" opacity=".14" d="M${f(von[0])} ${f(von[1])}L${f(bis[0])} ${f(bis[1])}"/>` : ""}<circle cx="${f(bis[0])}" cy="${f(bis[1])}" r=".2" fill="${haut}"/>`; return kl ? dreh(kl, von[0], von[1], p + mit) : p + mit; };
  const haare = {
    kurz: `<circle cx="${f(-s * .1)}" cy="${f(ky - .1)}" r=".72" fill="${haar}"/>`,
    lang: `<circle cx="${f(-s * .1)}" cy="${f(ky - .1)}" r=".73" fill="${haar}"/><path fill="${haar}" d="M${f(-s * .1)} ${f(ky - .3)}L${f(-s * .8)} ${f(ky - .2)}Q${f(-s * 1.02)} ${f(ky + .8)} ${f(-s * .84)} ${f(ky + 1.5)}Q${f(-s * .4)} ${f(ky + 1.6)} ${f(-s * .28)} ${f(ky + 1.1)}Z"/>`,
    zopf: `<circle cx="${f(-s * .1)}" cy="${f(ky - .1)}" r=".71" fill="${haar}"/><path fill="none" stroke="${haar}" stroke-width=".36" stroke-linecap="round" d="M${f(-s * .7)} ${f(ky - .3)}Q${f(-s * 1.4)} ${f(ky - .1)} ${f(-s * 1.15)} ${f(ky + 1.1)}"/>`,
    dutt: `<circle cx="${f(-s * .1)}" cy="${f(ky - .08)}" r=".7" fill="${haar}"/><circle cx="${f(-s * .5)}" cy="${f(ky - .9)}" r=".36" fill="${haar}"/>`,
    glatze: ``,
    muetze: `<circle cx="${f(-s * .1)}" cy="${f(ky - .02)}" r=".66" fill="${haar}"/>`,
    kappe: `<circle cx="${f(-s * .1)}" cy="${f(ky - .02)}" r=".66" fill="${haar}"/>`,
    hut: `<circle cx="${f(-s * .1)}" cy="${f(ky - .02)}" r=".66" fill="${haar}"/>`,
    helm: ``, kapuze: `<circle cx="${f(-s * .12)}" cy="${f(ky - .04)}" r=".86" fill="${hut}"/>`,
  }[kopf];
  const deckel = {
    muetze: `<path fill="${hut}" d="M${f(hx - .72)} ${f(ky - .12)}a.72 .74 0 0 1 1.44 0Z"/><circle cx="${f(hx - s * .1)}" cy="${f(ky - .92)}" r=".24" fill="#fdfcf9"/>`,
    kappe: `<path fill="${hut}" d="M${f(hx - .7)} ${f(ky - .18)}a.7 .7 0 0 1 1.4 0Z"/><path fill="none" stroke="${hut}" stroke-width=".2" stroke-linecap="round" d="M${f(hx)} ${f(ky - .22)}h${f(s * 1.05)}"/>`,
    hut: `<path fill="${hut}" d="M${f(hx - .56)} ${f(ky - .3)}v-.62q.56 -.3 1.12 0v.62Z"/><path fill="none" stroke="${hut}" stroke-width=".2" stroke-linecap="round" d="M${f(hx - 1)} ${f(ky - .3)}h2"/>`,
    helm: `<path fill="${hut}" d="M${f(hx - .76)} ${f(ky - .1)}a.76 .8 0 0 1 1.52 0Z"/><path fill="none" stroke="${hut}" stroke-width=".18" stroke-linecap="round" d="M${f(hx - .8)} ${f(ky - .1)}h${f(1.6 + .25)}"/>`,
  }[kopf] || "";
  return (schatten ? `<ellipse cx="0" cy="0" rx="1.35" ry=".2" fill="#000" opacity=".12"/>` : "") + hinten
    + arm([-s * .34, -3.7], hh, gehen && !armH ? "fu-a2" : klH, true)
    + (beine !== undefined ? beine : bein(-.26, gehen ? "fu-b2" : "") + bein(.26, gehen ? "fu-b1" : ""))
    + (rock ? `<path fill="${mantel}" d="M-.7 -3.2L-1.02 -1.25H1.02L.7 -3.2Z"/>` : "")
    + `<path fill="${mantel}" d="M-.72 -1.95L-.66 -3.5Q-.66 -3.98 -.2 -3.98H.2Q.66 -3.98 .66 -3.5L.72 -1.95Z"/><path fill="#000" opacity=".1" d="M${f(-s * .1)} -3.98H${f(-s * .2)}Q${f(-s * .66)} -3.98 ${f(-s * .66)} -3.5L${f(-s * .72)} -1.95H${f(-s * .1)}Z"/>` + vorn
    + haare + `<circle cx="${f(hx)}" cy="${f(ky + .04)}" r=".64" fill="${haut}"/><circle cx="${f(hx + s * .34)}" cy="${f(ky - .02)}" r=".07" fill="${TINTE}"/>` + deckel
    + arm([s * .3, -3.7], hv, gehen && !armV ? "fu-a1" : klV, false, inHand);
}

// Kurzformen: Linie (ohne Füllung), Fläche, Ellipse
export const L = (d, farbe, w = .3, mehr = "") => `<path fill="none" stroke="${farbe}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" d="${d}"${mehr ? " " + mehr : ""}/>`;
export const F = (d, farbe, mehr = "") => `<path fill="${farbe}" d="${d}"${mehr ? " " + mehr : ""}/>`;
export const E = (cx, cy, rx, ry, farbe, mehr = "") => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${farbe}"${mehr ? " " + mehr : ""}/>`;
export const schatten = (rx, x = 0) => `<ellipse cx="${x}" cy="0" rx="${rx}" ry=".22" fill="#000" opacity=".12"/>`;
// Szene am Ufer: innen gilt y = 0 als Boden (Oberkante Kaimauer), x = 0 als Mitte des Platzes
export const amUfer = innen => `<g transform="translate(0 ${FUSS})">${innen}</g>`;

// Kleiner Vogel von der Seite (sitzt): Füße bei (0, 0), etwa 1,6 lang. s = Blickrichtung.
export const vogel = ({ s = 1, farbe = "#8a7460", bauch = "#d8c8b2", schnabel = "#e8a23c" } = {}) =>
  `<path fill="none" stroke="${TINTE}" stroke-width=".07" d="M-.1 0v-.3M.14 0v-.3"/><ellipse cx="0" cy="-.62" rx=".62" ry=".42" fill="${farbe}" transform="rotate(${-14 * s} 0 -.62)"/><ellipse cx="${f(s * .1)}" cy="-.5" rx=".36" ry=".26" fill="${bauch}"/><path fill="${farbe}" d="M${f(-s * .5)} -.6L${f(-s * 1.1)} -.42L${f(-s * .5)} -.36Z"/><circle cx="${f(s * .46)}" cy="-.98" r=".3" fill="${farbe}"/><path fill="${schnabel}" d="M${f(s * .7)} -1.04L${f(s * 1.02)} -.94L${f(s * .7)} -.86Z"/><circle cx="${f(s * .54)}" cy="-1.02" r=".05" fill="${TINTE}"/>`;

// Rad mit Speichen (dreht sich mit der Klasse fu-dreh; --d = Sekunden je Umdrehung)
export const rad = (x, y, r, { farbe = TINTE, d = 1.2, speichen = 6 } = {}) => dreh("fu-dreh", x, y,
  `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${farbe}" stroke-width="${f(r * .22)}"/><path fill="none" stroke="${farbe}" stroke-width="${f(r * .09)}" d="${Array.from({ length: speichen / 2 }, (_, i) => { const w = i * 2 * Math.PI / speichen, c = Math.cos(w) * r, t = Math.sin(w) * r; return `M${f(x - c)} ${f(y - t)}L${f(x + c)} ${f(y + t)}`; }).join("")}"/>`, `--d:${d}s`);

// Plätze: Zwei Fundstücke mit demselben Platz erscheinen nie am selben Tag. Welche Plätze ein Festmotiv (data-fest)
// schon belegt, steht hier – an solchen Tagen bleibt der Platz dem Fest.
// Platz "ufer-*" bzw. "wasser-*": Das Stück wird um x = 0 gezeichnet und bekommt jeden Tag einen der freien Plätze
// (Ufer: Mitte bei x 537, 562, 717 oder 743, höchstens 16 breit; Wasser: 548 oder 736). spiegeln: true = an manchen
// Tagen an der Bildmitte gespiegelt (für alles, was auf einer Seite hin- und hergeht).
//   Ufer    ufer-l1 (x 528…546) · ufer-l2 (550…574) · ufer-r1 (707…726) · ufer-r2 (732…753) · ufer-weg (alles, was die Promenade entlangzieht)
//   Wasser  wasser-l (520…574) · wasser-r (706…760; das Ausflugsschiff fährt bei x 715…742, y 0…6) · wasser-weg (was über den Rhein zieht)
//   Dächer  dach-l1 (Flachdächer 530…541) · dach-kuppel (Christuskirche 541…559) · dach-l2 (559…573) · dach-t (Kirchturm 699…706)
//           dach-r1 (Giebel 706…721) · dach-r2 (721…740) · dach-r3 (740…758)
//   Türme   turm-a-dach · turm-b-dach · turm-a-fenster · turm-b-fenster · turm-a-wand · turm-b-wand
//   Himmel  himmel-l · himmel-r · himmel-m (über dem Dom) · himmel-zug (was quer über den Himmel zieht)
//   Hügel   huegel-l · huegel-r · fern-l · fern-r
//   Blatt   titel · unter (Unterzeile) · rand-o, rand-ol, rand-or, rand-ul, rand-ur (Ränder und Ecken der Bühne) · logo-dom
export const BELEGT = {
  tannenbaum: ["ufer-l2", "turm-b-fenster"], maibaum: ["ufer-l2"], fahne: ["ufer-l2"], riesenrad: ["ufer-r2", "dach-r3"], schneemann: ["ufer-r1"],
  schultuete: ["ufer-l2", "ufer-r1"], kuerbisse: ["ufer-l1", "ufer-l2", "ufer-r1"], laternen: ["ufer-l1", "ufer-l2", "ufer-r1", "ufer-r2", "ufer-weg"],
  ostern: ["ufer-l1", "ufer-l2", "ufer-r1", "ufer-r2", "ufer-weg"], nikolaus: ["dach-kuppel"],
  segelboot: ["wasser-l"], schwaene: ["wasser-l"], frachtschiff: ["wasser-l", "wasser-weg"],
  heissluftballon: ["himmel-r"], regenbogen: ["himmel-r", "huegel-r"], feuerwerk: ["himmel-l", "himmel-r", "himmel-m"], stern: ["himmel-r"],
  schlitten: ["himmel-zug", "himmel-m"], drachen: ["himmel-l"], luftballons: ["himmel-r"], herzen: ["himmel-l", "himmel-r"],
  papierflieger: ["himmel-zug"], flugzeug: ["himmel-zug"], fledermaeuse: ["himmel-l", "himmel-r"], schmetterlinge: [],
  "wimpel-fastnacht": ["rand-o", "rand-ol", "rand-or"], "wimpel-bunt": ["rand-o", "rand-ol", "rand-or"], "wimpel-gelbweiss": ["rand-o", "rand-ol", "rand-or"], "wimpel-wein": ["rand-o", "rand-ol", "rand-or"],
};

// Fundstücke, die zu einem Festmotiv gehören: Sie erscheinen immer, wenn das Motiv zu sehen ist (Valentinstag: Herz im Turm).
export const MIT = { herzen: ["herzfenster"] };

// Gemeinsames CSS (wird immer mitgeladen). Eigene Bewegungen bringt jedes Fundstück in seinem css-Feld mit;
// @keyframes dort bitte fu-<name>-… nennen.
export const CSS_ALLE = `
.fu{animation:i-ein .9s ease 1.1s both}.fu-w{display:contents}
.fu-h{position:absolute;left:var(--l);top:var(--t);width:calc(var(--L) * var(--g));translate:calc(var(--e,0) * var(--fx,0vw)) calc(var(--e,0) * -10vh);opacity:calc(1 - var(--p,0) * 1.8)}
@media (min-aspect-ratio:1/1){.fu-h{left:var(--lb,var(--l));top:var(--tb,var(--t))}}
.fu-h>svg{display:block;width:100%;height:auto;overflow:visible;animation:i-ein 1.2s ease 1.2s both}
.fu-h svg{display:block;width:100%;height:auto;overflow:visible}
.fu-zieh{animation:fu-zieh var(--d,60s) linear var(--v,0s) infinite}.fu-zieh>svg,.fu-weg>svg{animation:i-ein 1.2s ease 1.2s both}
@keyframes fu-zieh{from{translate:var(--von) 0}to{translate:var(--bis) 0}}
.fu-wasser-r .i-schiff{display:none}
.fu-h.fu-spruch{--sp:clamp(2.1px,calc(var(--L) / 128),2.65px);width:calc(var(--n,120) * var(--sp))}
.fu-sp-flug{animation:fu-sp-flug 44s linear 1.6s infinite both}
@keyframes fu-sp-flug{0%{translate:calc(-50vw - 100% - 16px) 0}74%,100%{translate:calc(50vw + 16px) 0}}
.fu-sp-stoff{fill:#fdfcf9;stroke:#b9b1a3;stroke-width:.2}.fu-sp-seil{fill:none;stroke:#7a6a58;stroke-width:.15}
.fu-sp-tuch{transform-box:fill-box;transform-origin:100% 50%;animation:fu-sp-tuch 1.7s ease-in-out infinite alternate}
.fu-sp-tuch text{font:700 5px var(--sans,sans-serif);letter-spacing:.12px;fill:#181716}
@keyframes fu-sp-tuch{from{transform:skewY(-1.6deg)}to{transform:skewY(1.6deg)}}
.fu-b{position:absolute;z-index:2;pointer-events:none;opacity:calc(1 - var(--p,0) * 3);animation:i-ein .8s ease 2.2s both}
.fu-b>svg{display:block;width:100%;height:auto;overflow:visible}
.i-titel{position:relative}
.fu-t{position:absolute;left:var(--tl,50%);top:var(--tt,0);width:0;height:0;pointer-events:none;font-size:1em;letter-spacing:0;animation:i-ein .5s ease 3s both}
.fu-t>svg{position:absolute;overflow:visible}
.fu-u{position:absolute;pointer-events:none;animation:i-ein .5s ease 3.2s both}.fu-u>svg{display:block;width:100%;height:auto;overflow:visible}
.fu-logo{opacity:calc(1 - var(--p,0) * 5)}.fu-logo>svg{animation:i-ein .8s ease 2.6s both}
.fu-geht{animation:fu-tritt var(--takt,.5s) ease-in-out infinite alternate}
.fu-geht .fu-b1,.fu-geht .fu-a2{animation:fu-bein var(--takt,.5s) ease-in-out infinite alternate}
.fu-geht .fu-b2,.fu-geht .fu-a1{animation:fu-bein var(--takt,.5s) ease-in-out infinite alternate-reverse}
@keyframes fu-bein{from{rotate:-26deg}to{rotate:26deg}}
@keyframes fu-tritt{from{translate:0 0}to{translate:0 -.12px}}
.fu-fahrt{animation:fu-fahrt var(--d,40s) linear var(--v,0s) infinite,fu-blende var(--d,40s) linear var(--v,0s) infinite}
@keyframes fu-fahrt{from{translate:var(--a) 0}to{translate:var(--b) 0}}
@keyframes fu-blende{0%,100%{opacity:0}4%,96%{opacity:1}}
.fu-hinher{animation:fu-hinher var(--d,40s) linear var(--v,0s) infinite}
@keyframes fu-hinher{0%{translate:var(--a) 0;scale:1 1}49.6%{translate:var(--b) 0;scale:1 1}50%{translate:var(--b) 0;scale:-1 1}99.6%{translate:var(--a) 0;scale:-1 1}100%{translate:var(--a) 0;scale:1 1}}
.fu-wipp{animation:fu-wipp var(--d,2s) ease-in-out var(--v,0s) infinite alternate}
@keyframes fu-wipp{from{translate:0 0}to{translate:0 var(--h,-.3px)}}
.fu-pendel{animation:fu-pendel var(--d,3s) ease-in-out var(--v,0s) infinite alternate}
@keyframes fu-pendel{from{rotate:calc(var(--w,6deg) * -1)}to{rotate:var(--w,6deg)}}
.fu-dreh{animation:fu-dreh var(--d,6s) linear var(--v,0s) infinite}
@keyframes fu-dreh{to{rotate:360deg}}
.fu-blink{animation:fu-blink var(--d,1.6s) ease-in-out var(--v,0s) infinite alternate}
@keyframes fu-blink{from{opacity:.25}to{opacity:1}}
.fu-auf{animation:fu-auf var(--d,4s) ease-out var(--v,0s) infinite}
@keyframes fu-auf{0%{translate:0 0;opacity:0}15%{opacity:var(--o,.9)}100%{translate:var(--x,.6px) var(--h,-4px);opacity:0}}
.fu-flimmer,.fu-flimmer2{transform-box:fill-box;transform-origin:50% 50%;animation:fu-flimmer .11s linear infinite alternate}.fu-flimmer2{animation-name:fu-flimmer2}
@keyframes fu-flimmer{from{scale:1 1}to{scale:1 .18}}@keyframes fu-flimmer2{from{scale:1 1}to{scale:.22 1}}
.fu-schlag{transform-box:fill-box;transform-origin:50% 100%;animation:fu-schlag var(--d,.3s) ease-in-out var(--v,0s) infinite alternate}
@keyframes fu-schlag{from{scale:1 1}to{scale:1 -.55}}
.fu-pick{transform-box:fill-box;transform-origin:35% 100%;animation:fu-pick var(--d,3.4s) ease-in-out var(--v,0s) infinite}
@keyframes fu-pick{0%,58%,100%{rotate:0deg}66%{rotate:var(--w,30deg)}74%{rotate:4deg}82%{rotate:var(--w,30deg)}90%{rotate:0deg}}
.fu-huepf{animation:fu-huepf var(--d,3s) ease-out var(--v,0s) infinite}
@keyframes fu-huepf{0%,72%,100%{translate:0 0}81%{translate:var(--x,0px) var(--h,-1px)}90%{translate:0 0}}
.fu-wasser{transform-box:fill-box;transform-origin:50% 100%;animation:fu-wasser var(--d,3.2s) ease-in-out var(--v,0s) infinite alternate}
@keyframes fu-wasser{from{translate:0 -.12px;rotate:-1.6deg}to{translate:0 .12px;rotate:1.6deg}}
`;
