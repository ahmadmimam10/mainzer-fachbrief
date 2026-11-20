// Die Bonifaziustürme im Stadtbild des Intros (daher der Name „Boniblatt“): zwei Bürotürme am Hauptbahnhof, von der
// Rheinseite aus rechts neben dem Dom. Gezeichnet in Logo-Einheiten des Stadtbands (Breite 1280, Höhe 60, Horizont unten).
// Dazu kleine Szenen im 14. OG – zufällig je Aufruf, gezielt mit ?boni=raucher,blase,putzer,flieger (oder ?boni=aus):
//   raucher  zwei Kolleg:innen auf dem Balkon im 14. OG, mit Glut und Rauchkringeln
//   blase    Sprechblasen aus einem Fenster im 14. OG (passend zu Wochentag, Wetter und besonderem Tag)
//   putzer   Fensterputzer-Gondel, die langsam an Turm B herabfährt
//   flieger  ein Papierflieger segelt aus dem 14. OG
// Immer dabei: Bürolichter, die nach und nach an- und ausgehen, rote Flugwarnleuchten; im Advent ein Lichterbaum aus Fenstern.

const f = n => +n.toFixed(2);
const zufall = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const rechteck = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const SOCKEL = 57.5;                               // Oberkante Erdgeschoss; darunter verdecken die Häuser der Stadt die Türme

// Ein Turm: Vorderseite (im Licht), schmale Seitenfläche (im Schatten), Attika, Technikgeschoss, Fensterbänder je Geschoss
function turm({ x, w, s, oben, geschosse, spalten, r }) {
  const y0 = oben + 1.1, fh = (SOCKEL - y0) / geschosse, m = .42, g = .2, cw = (w - 2 * m - (spalten - 1) * g) / spalten, gh = fh * .58;
  const t = { koerper: rechteck(x, oben, w, 60 - oben), seite: rechteck(x + w, oben, s, 60 - oben), attika: rechteck(x, oben, w, .55),
    glas: "", glasSeite: "", zellen: [], fh, cw, gh };
  for (let n = 1; n <= geschosse; n++) {
    const y = SOCKEL - n * fh + fh * .2;                                  // Fensterband im Geschoss n (1 = 1. OG)
    for (let c = 0; c < spalten; c++) {
      const cx = x + m + c * (cw + g);
      t.glas += rechteck(cx, y, cw, gh); t.zellen.push({ n, c, x: cx, y, z: r() });
    }
    t.glasSeite += rechteck(x + w + .32, y, s - .62, gh);
  }
  return t;
}

const r = zufall(41);
const A = turm({ x: 708.5, w: 8.8, s: 2.3, oben: 14, geschosse: 24, spalten: 6, r });
const BT = turm({ x: 722.2, w: 7.8, s: 2.1, oben: 19, geschosse: 21, spalten: 5, r });

// Bürolichter: einige brennen schon, andere gehen nacheinander an, wenige wieder aus, ein paar flackern im Takt
function lichter(t, schonAn = .06) {
  let fest = "", mehr = "", einzeln = "";
  for (const z of t.zellen) {
    const d = rechteck(z.x, z.y, t.cw, t.gh);
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
  for (const z of BT.zellen) if (reihen[z.n]?.includes(z.c)) (z.n === 20 ? (stern += rechteck(z.x, z.y, BT.cw, BT.gh)) : (d += rechteck(z.x, z.y, BT.cw, BT.gh)));
  return `<g class="bt-baum"><path fill="#ffd77a" d="${stern}"/><path fill="#9fd08a" d="${d}"/></g>`;
})();

// 14. OG: Fenster für die Sprechblase (Turm B, rechts) und der Balkon an der linken Kante von Turm A
const BONI = BT.zellen.find(z => z.n === 14 && z.c === 4), A14 = A.zellen.find(z => z.n === 14 && z.c === 5);
const BODEN14 = SOCKEL - 13 * A.fh;                                        // Fußboden 14. OG
const BALKON = `<g class="bt-balkon"><path fill="#b9b1a5" d="${rechteck(705.4, BODEN14 - .1, 3.1, .42)}"/><path fill="none" stroke="#857c71" stroke-width=".13" d="M705.5 ${f(BODEN14 - 1.05)}H708.5M705.55 ${f(BODEN14 - 1.05)}V${f(BODEN14 - .1)}M706.55 ${f(BODEN14 - 1.05)}V${f(BODEN14 - .1)}M707.55 ${f(BODEN14 - 1.05)}V${f(BODEN14 - .1)}"/></g>`;
const mensch = (x, mantel, haar, kl, extra = "") => `<g class="${kl}"><path fill="${mantel}" d="M${f(x - .36)} ${f(BODEN14 - .1)}L${f(x - .3)} ${f(BODEN14 - 1.35)}Q${f(x)} ${f(BODEN14 - 1.62)} ${f(x + .3)} ${f(BODEN14 - 1.35)}L${f(x + .36)} ${f(BODEN14 - .1)}Z"/>`
  + `<circle cx="${f(x)}" cy="${f(BODEN14 - 1.86)}" r=".3" fill="#e4b994"/><path fill="${haar}" d="M${f(x - .31)} ${f(BODEN14 - 1.86)}a.31 .31 0 0 1 .62 0q-.3-.14-.62 0Z"/>${extra}</g>`;
const glutX = 706.62, glutY = f(BODEN14 - 1.72);
const RAUCHER = `<g class="bt-raucher">`
  + mensch(706.2, "#4f6b8a", "#3b3029", "bt-m1", `<path fill="none" stroke="#4f6b8a" stroke-width=".2" stroke-linecap="round" d="M706.4 ${f(BODEN14 - 1.25)}L${glutX - .1} ${f(BODEN14 - 1.62)}"/><path stroke="#f3eee6" stroke-width=".09" d="M${glutX - .12} ${glutY}h.2"/><circle class="bt-glut" cx="${f(glutX + .1)}" cy="${glutY}" r=".09" fill="#ff7a32"/>`)
  + mensch(707.55, "#b5533e", "#c9a46a", "bt-m2")
  + [0, 1, 2].map(i => `<circle class="bt-rauch" style="--v:${i * 1.15}s" cx="${f(glutX + .15)}" cy="${f(glutY - .2)}" r=".32"/>`).join("")
  + `</g>`;

// Fensterputzer an Turm B: Seile (wachsen mit) und Gondel mit Person, die wischt
const GY = 21.1;
const PUTZER = `<g class="bt-putzer"><path class="bt-seil" fill="none" stroke="#7d756b" stroke-width=".1" d="M723.4 19.2V${GY}M729.2 19.2V${GY}"/>`
  + `<g class="bt-gondel"><circle cx="726.2" cy="${f(GY - .62)}" r=".27" fill="#e4b994"/><path fill="#e8c14a" d="M725.92 ${f(GY - .74)}a.28 .28 0 0 1 .56 0Z"/><path fill="#3f6fa3" d="${rechteck(725.95, GY - .35, .5, .5)}"/>`
  + `<path class="bt-wisch" fill="none" stroke="#3f6fa3" stroke-width=".15" stroke-linecap="round" d="M726.4 ${f(GY - .25)}l.55-.5"/>`
  + `<path fill="#e3a33c" d="${rechteck(722.9, GY + .12, 6.8, .62)}"/><path fill="none" stroke="#9a6e2a" stroke-width=".1" d="M722.95 ${f(GY - .3)}H729.65M722.95 ${f(GY - .3)}V${f(GY + .12)}M729.65 ${f(GY - .3)}V${f(GY + .12)}"/></g></g>`;

// Papierflieger aus dem 14. OG
const FLIEGER = `<g transform="translate(${f(A14.x + 1)} ${f(A14.y + .4)}) scale(1.7)"><g class="bt-flieger"><path fill="#fffdf8" stroke="#8c847a" stroke-width=".05" d="M-.5 -.1L.75 0L-.5 .28L-.28 .02Z"/><path fill="#d9d2c6" d="M-.5 .28L-.28 .02L-.1 .19Z"/></g></g>`;

// Dachaufbauten: Technikgeschoss, Antenne, Flugwarnleuchten; Schnee auf den Dächern nur bei Schnee
const DACH = `<path fill="#c6beb2" d="${rechteck(710.6, 11.9, 5.2, 2.1)}"/><path fill="#aea699" d="${rechteck(715.8, 11.9, 1.1, 2.1)}"/><path fill="#b1a99d" d="${rechteck(710.6, 11.9, 5.2, .35)}"/>`
  + `<path fill="none" stroke="#8b8378" stroke-width=".18" d="M713.2 11.9V6.6M712.4 9.4h1.6"/>`
  + `<path fill="#c6beb2" d="${rechteck(723.6, 17.4, 4.4, 1.6)}"/><path fill="#aea699" d="${rechteck(728, 17.4, .9, 1.6)}"/>`
  + `<g class="bt-warn"><circle cx="713.2" cy="6.45" r=".42"/><circle cx="723.75" cy="17.2" r=".32"/><circle cx="728.7" cy="17.2" r=".32"/></g>`
  + `<path class="bt-schnee" d="M710.4 12q2.7-.5 5.6 0v.3h-5.6ZM708.4 14.05q4.4-.45 11.1 0v.3h-11.1ZM723.4 17.45q2.6-.4 5.6 0v.25h-5.6ZM722.1 19.05q4.9-.42 10 0v.3h-10Z"/>`;

// In das Stadtband, vor den Häusern der Stadt gezeichnet (die Häuser stehen davor und verdecken den Fuß)
export const BONI_SVG = `<g class="bt" aria-hidden="true">`
  + `<path fill="#d4cdc2" d="${A.koerper}"/><path fill="#bcb4a8" d="${A.seite}"/><path fill="#ded8ce" d="${A.attika}"/>`
  + `<path fill="#d1cabf" d="${BT.koerper}"/><path fill="#b8b0a4" d="${BT.seite}"/><path fill="#dbd5cb" d="${BT.attika}"/>`
  + `<path fill="#9eabb2" d="${A.glas}${BT.glas}"/><path fill="#8a969c" d="${A.glasSeite}${BT.glasSeite}"/>`
  + `<path fill="#e9e4dc" opacity=".55" d="${rechteck(708.5, 14, .3, 46)}${rechteck(722.2, 19, .3, 41)}"/>`
  + `<g class="bt-a">${lichter(A)}</g><g class="bt-b">${lichter(BT)}</g>${BAUM}`
  + `<path class="bt-boni" d="${rechteck(BONI.x, BONI.y, BT.cw, BT.gh)}"/>`
  + DACH + BALKON + RAUCHER + PUTZER + FLIEGER + `</g>`;

// Sprechblase (HTML im Stadtband, damit die Schrift auch auf dem Handy lesbar bleibt); sie zeigt auf das Fenster im 14. OG
// Normal steht sie rechts neben Turm B im freien Himmel; ist dort zu wenig Platz (Handy), sitzt sie über dem Turm.
const pz = x => f(x / 1280 * 100) + "%", unten = f((60 - BONI.y - BT.gh / 2) / 60 * 100);
export const BONI_HTML = `<div class="bt-blase" style="--l1:${pz(722.2 + 7.8 + 2.1)};--l2:${pz(BONI.x + BT.cw / 2)};bottom:${unten}%" aria-hidden="true"><span></span></div>`;

export const BONI_CSS = `
.bt-licht{fill:#f7da97}.bt-baum,.bt-raucher,.bt-putzer,.bt-flieger,.bt-boni,.bt-schnee{display:none}
.intro:not([data-wetter="sonne"]) .bt-mehr{fill:#f3d892}.intro[data-wetter="sonne"] .bt-mehr{display:none}
.bt-an{animation:bt-an .5s ease var(--v) both}.bt-aus{animation:bt-an .5s ease var(--v) reverse both}
.bt-flack{animation:bt-flack var(--d) steps(1,end) var(--v) infinite}
@keyframes bt-an{from{opacity:0}to{opacity:1}}
@keyframes bt-flack{0%,44%{opacity:0}45%,88%{opacity:1}89%,100%{opacity:0}}
.bt-warn{fill:#e8463c;animation:bt-warn 2.6s ease-in-out infinite}
@keyframes bt-warn{0%,100%{opacity:.25}10%,24%{opacity:1}34%{opacity:.25}}
.intro[data-wetter="schnee"] .bt-schnee{display:inline;fill:#fbfcfe}
.intro[data-fest~="tannenbaum"] .bt-baum{display:inline;animation:bt-an .8s ease 2.4s both}
.intro[data-fest~="tannenbaum"] .bt-b .bt-licht{display:none}
.intro[data-boni~="blase"] .bt-boni{display:inline;fill:#ffe3a3;animation:bt-an .4s ease 4s both}
.intro[data-boni~="raucher"] .bt-raucher{display:inline;animation:bt-an .6s ease 3.4s both}
.bt-m2{transform-box:fill-box;transform-origin:50% 100%;animation:bt-plausch 3.8s ease-in-out infinite alternate}
@keyframes bt-plausch{from{rotate:-3deg}to{rotate:4deg}}
.bt-glut{animation:bt-glut 3.45s ease-in-out infinite}
@keyframes bt-glut{0%,100%{opacity:.55}12%{opacity:1;fill:#ffb347}30%{opacity:.6}}
.bt-rauch{fill:#fbfaf7;transform-box:fill-box;transform-origin:50% 50%;animation:bt-rauch 3.45s ease-out var(--v) infinite}
@keyframes bt-rauch{0%{opacity:0;translate:0 0;scale:.35}15%{opacity:.9}100%{opacity:0;translate:2px -4.6px;scale:2.3}}
.intro[data-boni~="putzer"] .bt-putzer{display:inline;animation:bt-an .6s ease 3s both}
.bt-gondel{animation:bt-gondel 80s ease-in-out 3s infinite alternate both}
.bt-seil{transform-box:fill-box;transform-origin:50% 0;animation:bt-seil 80s ease-in-out 3s infinite alternate both}
@keyframes bt-gondel{from{translate:0 0}to{translate:0 22px}}
@keyframes bt-seil{from{scale:1 1}to{scale:1 ${f((22 + 21.1 - 19.2) / (21.1 - 19.2))}}}
.bt-wisch{transform-box:fill-box;transform-origin:0 100%;animation:bt-wisch .9s ease-in-out infinite alternate}
@keyframes bt-wisch{from{rotate:-35deg}to{rotate:25deg}}
.intro[data-boni~="flieger"] .bt-flieger{display:inline;animation:bt-flieger 16s linear 4.4s infinite both}
@keyframes bt-flieger{0%{opacity:0;translate:0 0;rotate:-8deg}2%{opacity:1}14%{translate:7px 1.2px;rotate:6deg}28%{translate:14px 3.8px;rotate:-7deg}
  42%{translate:21px 7.8px;rotate:9deg}54%{translate:27px 12.5px;rotate:14deg;opacity:1}60%,100%{translate:30px 15px;rotate:16deg;opacity:0}}
.bt-blase{position:absolute;z-index:2;left:var(--l1);translate:7px 6px;transform-origin:0 calc(100% - 6px);
  padding:.32em .62em .36em;border-radius:.85em;background:#fffdf8;color:#2b2723;font:600 11.5px/1.25 var(--sans);white-space:nowrap;
  box-shadow:0 1px 2px rgba(60,45,30,.18),0 3px 10px rgba(60,45,30,.12);opacity:0;scale:.5;transition:opacity .25s ease,scale .35s cubic-bezier(.3,1.5,.5,1);pointer-events:none}
.bt-blase::after{content:"";position:absolute;left:-6px;bottom:6px;width:8px;height:7px;background:#fffdf8;clip-path:polygon(100% 0,100% 100%,0 100%)}
.bt-blase.eng{left:var(--l2);translate:calc(-11px + var(--verschub,0px)) -12px;transform-origin:calc(11px - var(--verschub,0px)) 100%}
.bt-blase.eng::after{left:calc(11px - var(--verschub,0px) - 4px);bottom:-5px;height:8px;clip-path:polygon(0 0,100% 0,0 100%)}
.bt-blase.zeigen{opacity:calc(1 - var(--p,0) * 8);scale:1}
@media (max-width:600px){.bt-blase{font-size:10px}}
`;

// Läuft im Browser: wählt die Szenen und spielt die Sprechblasen ab
export function boniSzene(intro, q, zeit, wetter, elemente, still) {
  let szenen;
  if (q.has("boni")) szenen = q.get("boni").split(",");
  else {
    const z = Math.random();
    szenen = [z < .3 ? "raucher" : z < .5 ? "putzer" : z < .65 ? "flieger" : ""];
    if (Math.random() < .65) szenen.push("blase");
  }
  intro.dataset.boni = szenen.join(" ").trim();
  const blase = intro.querySelector(".bt-blase");
  if (!blase || !szenen.includes("blase")) return;
  const hat = n => elemente.includes(n), tag = new Date().getDay(), eigene = [];
  if (tag === 1) eigene.push("Montag. Erst mal Kaffee.");
  if (tag === 3) eigene.push("Bergfest!");
  if (tag === 5) eigene.push("Fast Wochenende!");
  if (wetter === "regen") eigene.push("Schirm vergessen …");
  if (wetter === "schnee") eigene.push("Schnee! Wer baut mit?");
  if (wetter === "bewoelkt") eigene.push("Grau in grau heute.");
  if (wetter === "sonne" && zeit === "sommer") eigene.push("Eis nach Feierabend?");
  if (hat("tannenbaum")) eigene.push("Wer hat Plätzchen?");
  if (hat("nikolaus")) eigene.push("Stiefel geputzt?");
  if (hat("wimpel-fastnacht")) eigene.push("Helau!");
  if (hat("ostern")) eigene.push("Frohe Ostern!");
  if (hat("kuerbisse")) eigene.push("Süßes oder Saures!");
  if (hat("laternen")) eigene.push("Heute ist Sankt Martin.");
  if (hat("riesenrad")) eigene.push("Johannisnacht!");
  if (hat("wimpel-wein")) eigene.push("Schoppen am Weinmarkt?");
  if (hat("papierflieger")) eigene.push("Ab in die Ferien!");
  if (hat("feuerwerk")) eigene.push("Frohes Neues!");
  if (hat("schultuete")) eigene.push("Viel Glück, Erstis!");
  if (hat("fahne")) eigene.push("Langes Wochenende!");
  const allgemein = ["Erst mal Kaffee.", "Mahlzeit!", "Wer hat die Akte?", "Drucker streikt.", "Noch ein Termin …", "Läuft!",
    "Kurz Pause?", "Wo ist der Locher?", "Kuchen in der Küche!", "Schöner Domblick heute.", "Protokoll? Mach ich.",
    "Gleich Teamrunde!", "Fristen, Fristen …", "Wer hat Kaffee gekocht?", "Ausschuss um 17 Uhr!"];
  const mischen = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const liste = mischen(eigene).slice(0, 2).concat(mischen(allgemein)).slice(0, 3);
  const text = blase.firstElementChild;
  const zeigen = i => {
    if (!intro.isConnected || i >= liste.length) return;
    text.textContent = liste[i]; blase.style.removeProperty("--verschub"); blase.classList.remove("eng");
    const rand = innerWidth - 10, rechts = () => blase.getBoundingClientRect().left + blase.offsetWidth;
    if (rechts() > rand) { blase.classList.add("eng"); if (rechts() > rand) blase.style.setProperty("--verschub", Math.round(rand - rechts()) + "px"); }
    blase.classList.add("zeigen");
    if (still) return;
    setTimeout(() => { blase.classList.remove("zeigen"); setTimeout(() => zeigen(i + 1), 5600); }, 3600);
  };
  if (still) addEventListener("load", () => zeigen(0)); else setTimeout(() => zeigen(0), 4400);
}
