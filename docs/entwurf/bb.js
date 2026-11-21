/* Entwürfe B1 „Bento Druck“ und B2 „Bento Spiel“: gleiche Inhalte und Logik, das Aussehen kommt aus bb.css (.b1 / .b2) */
(async () => {
  const { esc } = E, q = E.q, wurzel = document.getElementById("e"), SPIEL = wurzel.classList.contains("b2");
  await E.laden();

  // ---- Bereiche. Neue Bereiche einfach anhängen: Reiter, Farbrollen und Kacheln richten sich nach der Liste. ----
  // daten = Schlüssel in der Ausgabe, reiter = kurzer Name im Reiter, lang = voller Name, motive = Bildmotive (docs/bilder/motive)
  const BEREICHE = [
    { id: "jugendhilfeplanung", daten: "jugendhilfeplanung", reiter: "Jugendhilfeplanung", lang: "Jugendhilfeplanung", motive: ["stadtplan", "klemmbrett", "jugendliche", "runder-tisch"] },
    { id: "fruehe-hilfen", daten: "fruehe-hilfen", reiter: "Fachstelle", lang: "Fachstelle Frühe Hilfen, Kinderschutz und Familienbildung", motive: ["haende", "kinderwagen", "storch", "baukloetze"] },
    { id: "quartiersmanagement", daten: "quartiersmanagement", reiter: "Quartiermanagement", lang: "Quartiermanagement", motive: ["parkbank", "treff", "spielplatz", "wohnblock"] },
  ];
  if (q.has("mehr")) BEREICHE.push(                // nur zum Ausprobieren: So sähe es mit zwei weiteren Bereichen aus
    { id: "bereich-4", daten: "jugendhilfeplanung", reiter: "Vierter Bereich", lang: "Vierter Bereich (Platzhalter)", motive: ["megafon", "zeitung", "kaffee", "fahrrad"] },
    { id: "bereich-5", daten: "quartiersmanagement", reiter: "Fünfter Bereich", lang: "Fünfter Bereich (Platzhalter)", motive: ["neustadt", "marktstand", "strassenbahn", "schiff"] });
  const bereich = id => BEREICHE.find(b => b.id === id) || BEREICHE[0];

  // ---- Jahreszeit bestimmt die Farbwelt (?farbe=sommer zum Ansehen) ----
  const monat = E.tag().getMonth() + 1;
  const ZEITEN = ["fruehling", "sommer", "herbst", "winter"], ausWetter = (q.get("wetter") || "").split("-").find(x => ZEITEN.includes(x));
  const zeit = ZEITEN.includes(q.get("farbe")) ? q.get("farbe") : ausWetter ? ausWetter : monat >= 3 && monat <= 5 ? "fruehling" : monat >= 6 && monat <= 8 ? "sommer" : monat >= 9 && monat <= 11 ? "herbst" : "winter";
  wurzel.dataset.zeit = zeit;

  const motiv = (name, kl = "") => `<span class="st ${kl}" style="-webkit-mask-image:url(bilder/motive/${name}.png);mask-image:url(bilder/motive/${name}.png)" aria-hidden="true"></span>`;
  const tagNr = Math.floor(E.tag() / 864e5);

  // ---- Wetter: sieben Tage, gezeichnet und bewegt ----
  const wetterBild = lage => {
    const wolke = `<path class="w-wolke" d="M13 36a7.5 7.5 0 0 1 .8-15a10.5 10.5 0 0 1 20-2.4a8.7 8.7 0 0 1 2.2 17.4Z"/>`;
    const sonne = (x, y, r) => `<g class="w-sonne" style="transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="${r}"/><path d="${[0, 45, 90, 135, 180, 225, 270, 315].map(w => { const a = w * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return `M${(x + c * (r + 3)).toFixed(1)} ${(y + s * (r + 3)).toFixed(1)}L${(x + c * (r + 7)).toFixed(1)} ${(y + s * (r + 7)).toFixed(1)}`; }).join("")}"/></g>`;
    const fall = (kl, form) => [16, 24, 32].map((x, i) => `<g class="${kl}" style="animation-delay:${-i * .37}s">${form(x)}</g>`).join("");
    return `<svg class="w-bild w-${lage}" viewBox="0 0 48 48" aria-hidden="true">` + (
      lage === "sonne" ? sonne(24, 24, 9)
      : lage === "regen" ? wolke + fall("w-tropfen", x => `<path d="M${x} 38l-2 6"/>`)
      : lage === "schnee" ? wolke + fall("w-flocke", x => `<circle cx="${x}" cy="40" r="1.7"/>`)
      : sonne(33, 15, 6) + wolke) + `</svg>`;
  };
  const WORT = { sonne: "sonnig", bewoelkt: "bewölkt", regen: "Regen", schnee: "Schnee" };
  function wetterKachel() {
    const w = (window.BONIBLATT_WETTER7 || []).slice(0, 7); if (!w.length) return "";
    const lo = Math.min(...w.map(t => t.min)), hi = Math.max(...w.map(t => t.max)), sp = Math.max(1, hi - lo), h = w[0];
    return `<div class="k wetter" data-ein><span class="etikett">Wetter in Mainz · 7 Tage</span>
      <div class="w-heute">${wetterBild(h.lage)}<p><b>${h.max}°</b><span>heute ${WORT[h.lage] || ""}, nachts ${h.min}°${h.regen >= 30 ? ` · Regen ${h.regen} %` : ""}</span></p></div>
      <div class="w-woche">${w.map((t, i) => `<div class="w-tag${i ? "" : " heute"}" style="--i:${i}"><span>${i ? new Date(t.tag + "T12:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "") : "Heute"}</span>${wetterBild(t.lage)}
        <i class="w-saeule"><i style="--von:${((t.min - lo) / sp).toFixed(3)};--bis:${((t.max - lo) / sp).toFixed(3)}"></i></i><b>${t.max}°</b><small>${t.min}°</small></div>`).join("")}</div></div>`;
  }

  // ---- „Was geht heute ab?“ – vorerst mit Beispielen; später sucht die Redaktion echte Termine ----
  const BEISPIELE = [["marktstand", "ab 16 Uhr", "Feierabendmarkt", "Mainz, Altstadt"], ["musik", "20 Uhr", "Offene Bühne", "Mainz, Neustadt"], ["ausstellung", "bis 18 Uhr", "Neue Ausstellung eröffnet", "Wiesbaden"],
    ["wein", "ab 17 Uhr", "Weinstand am Rheinufer", "Mainz"], ["flohmarkt", "Samstag", "Flohmarkt am Fluss", "Frankfurt"], ["film", "21 Uhr", "Kurzfilmabend", "Ingelheim"]];
  const losKachel = () => `<div class="k los" data-ein><div class="los-kopf"><h3>Was geht <i>heute ab?</i></h3><span class="etikett">Mainz &amp; Rhein-Main · Beispiele, noch nicht echt</span></div>
    <div class="los-reihe">${BEISPIELE.map(([m, wann, was, wo], i) => `<div class="los-karte f${i % 5}">${motiv(m)}<b>${wann}</b><strong>${was}</strong><small>${wo}</small></div>`).join("")}</div></div>`;

  // ---- Bild des Tages: ein Mainzer Motiv, jeden Tag ein anderes ----
  const ORTE = [["dom", "Der Dom"], ["christuskirche", "Christuskirche"], ["gutenberg", "Gutenberg"], ["bruecke", "Theodor-Heuss-Brücke"], ["holzturm", "Holzturm"], ["fastnachtsbrunnen", "Fastnachtsbrunnen"], ["schloss", "Kurfürstliches Schloss"],
    ["staatstheater", "Staatstheater"], ["kirschgarten", "Kirschgarten"], ["hafenkran", "Zollhafen"], ["strassenbahn", "Linie 51"], ["neustadt", "Neustadt"], ["weinberg", "Weinberge"], ["schiff", "Auf dem Rhein"], ["bonituerme", "Bonifaziustürme"]];

  // ---- Gerüst ----
  const welle = `<svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V30C100 6 200 6 300 30S500 54 600 30S800 6 900 30S1100 54 1200 30V60Z"/></svg>`;
  wurzel.innerHTML = `<div class="bb-welle">${welle}${welle}</div><div class="bb-nieder" aria-hidden="true"></div><div class="bb-innen">
    <header class="bb-oben">${motiv(ORTE[(tagNr + 9) % ORTE.length][0], "wz kopfwz")}<p class="bb-gruss">Guten <i>Morgen.</i><small>${esc(E.datum({ weekday: "long", day: "numeric", month: "long" }))}</small></p>
      <nav class="bb-reiter" aria-label="Bereiche">${BEREICHE.map((b, i) => `<button type="button" data-r="${b.id}" aria-pressed="false" style="--nr:${i}">${motiv(b.motive[0])}<span>${esc(b.reiter)}</span></button>`).join("")}</nav></header>
    <section class="bb-raster" id="kacheln"></section>
    <div class="bb-skyline" aria-hidden="true">${["kirschgarten", "christuskirche", "holzturm", "dom", "staatstheater", "bonituerme", "bruecke"].map(m => motiv(m)).join("")}</div></div>`;
  const raster = wurzel.querySelector("#kacheln");

  // ---- Wetter und Jahreszeit laufen unten dezent weiter: wenige fallende Teilchen, ein paar bleiben auf den Kacheln liegen ----
  const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  let lage = (window.FACHBRIEF_WETTER || {})[q.get("tag") || heute] || "sonne";
  (q.get("wetter") || "").split("-").forEach(x => { if (["sonne", "bewoelkt", "regen", "schnee"].includes(x)) lage = x; });
  if (lage === "schnee" && zeit !== "winter") lage = "regen";
  const art = lage === "regen" ? "regen" : lage === "schnee" ? "schnee" : zeit === "herbst" ? "laub" : zeit === "fruehling" ? "bluete" : "";
  const BLATT = "M0 0C1.4 -3.4 5.4 -4.4 9 -2.8C8.4 .8 5.6 3.6 1.8 3.4L-1.6 5L.2 2.4C-.4 1.6 -.4 .8 0 0Z", BLUETE = "M0 0q1.6 -2.6 4.6 0q-3 2.6 -4.6 0Z";
  const LAUB = ["#d98a3d", "#c9642f", "#e0b04a", "#b5532e"], ROSA = ["#f6bfd0", "#fbdde6", "#f2a8bf"];
  const teilchen = i => art === "laub" ? `<svg viewBox="-2 -5 12 11"><path fill="${LAUB[i % 4]}" d="${BLATT}"/></svg>` : art === "bluete" ? `<svg viewBox="-.5 -2.2 5.6 4.4"><path fill="${ROSA[i % 3]}" d="${BLUETE}"/></svg>` : "";
  const nieder = wurzel.querySelector(".bb-nieder");
  if (art) { nieder.dataset.art = art; const n = art === "regen" ? 22 : art === "schnee" ? 20 : 8;
    nieder.innerHTML = Array.from({ length: n }, (_, i) => { const d = art === "regen" ? 1.3 + i % 5 * .22 : art === "schnee" ? 11 + i % 6 * 1.6 : 12 + i % 5 * 2.3;
      return `<i style="--x:${(i * 37 + 11) % 104 - 2}%;--nd:${d.toFixed(1)}s;--v:${(-(i * 1.9) % d).toFixed(1)}s;--g:${art === "regen" ? 26 + i % 4 * 9 : art === "schnee" ? 4 + i % 4 * 2 : 15 + i % 4 * 4};--r:${art === "laub" || art === "bluete" ? 200 + i * 40 : 0}deg">${teilchen(i)}</i>`; }).join(""); }
  // Liegenbleiben: Blätter und Blüten in den Ecken, Tropfen auf der Fläche, Schnee auf der Oberkante mancher Kacheln
  function belegen() {
    if (!art) return;
    raster.querySelectorAll(".k").forEach((el, i) => {
      if (art === "schnee") { if (i % 2 === 0) { el.classList.add("verschneit"); el.style.setProperty("--sx", 7 + i * 17 % 30 + "%"); el.style.setProperty("--sb", 38 + i * 13 % 24 + "%"); } return; }
      if (i % 3 === 1) return;
      el.insertAdjacentHTML("beforeend", Array.from({ length: art === "regen" ? 5 : el.matches("a") ? 2 : 1 }, (_, j) => { const z = (i * 31 + j * 47 + 13) % 100, regen = art === "regen";
        return `<i class="bb-lieg ${art}" style="left:${regen ? 5 + z * .88 : j ? 54 + z % 22 : 72 + z % 22}%;top:${regen ? 8 + z * 53 % 82 : j ? 91 + z % 4 : 2 + z % 7}%;--r:${z * 7 % 360}deg;--g:${regen ? 5 + z % 6 : art === "bluete" ? 13 + z % 7 : 20 + z % 11}">${teilchen(i + j)}</i>`; }).join(""));
    });
  }
  const unten = m => `<span class="unten"><span>${esc(E.quelle(m))}</span><span class="pfeil">→</span></span>`;

  function zeichne(id) {
    const b = bereich(id), t = E.teile(b.daten), nr = BEREICHE.indexOf(b), k = [];
    const text = ((E.ausgabe.hoerfassungen || {})[b.daten] || "").trim();
    if (t.auf) k.push(`<a class="k auf" data-ein href="${esc(t.auf.url)}">${motiv(b.motive[0], "gross")}<span class="etikett">Aufmacher · ${esc(t.auf.thema)}</span><h2>${esc(t.auf.titel)}</h2><p>${esc(t.auf.kurz || "")}</p>${unten(t.auf)}</a>`);
    k.push(`<div class="k ohr" data-ein data-zustand="aus"><span class="etikett">Anhören · ${esc(b.reiter)}</span>
      <div class="h-buehne"><div class="h-scheibe" aria-hidden="true"><i></i>${motiv("kopfhoerer")}</div>
        <button type="button" class="h-knopf" aria-label="Abspielen"><svg class="h-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="spur" cx="60" cy="60" r="54"/><circle class="gang" cx="60" cy="60" r="54" pathLength="100"/></svg><span class="h-symbol"></span></button>
        <div class="h-wellen" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="--w:${(.2 + .8 * Math.abs(Math.sin(i * 1.9 + nr))).toFixed(2)};--i:${i}"></i>`).join("")}</div></div>
      <p class="h-satz">${text ? "Drei Minuten für die Ohren: die Ausgabe zum Hören." : "Für diese Ausgabe gibt es noch keine Hörfassung."}</p>
      <div class="h-leiste"><span class="h-zeit">0:00</span><span class="h-spur" role="slider" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></span><span class="h-dauer">–:––</span></div></div>`);
    k.push(wetterKachel());
    t.wichtig.forEach((m, i) => k.push(`<a class="k wichtig n${t.wichtig.length}${i === 1 ? " farbe" : ""}" data-ein href="${esc(m.url)}"><span class="etikett">${esc(m.thema)}</span><h2>${esc(m.titel)}</h2><p>${esc(m.kurz || "")}</p>${unten(m)}</a>`));
    if (t.kurz.length) k.push(`<div class="k liste" data-ein>${motiv(ORTE[(tagNr + nr * 4 + 5) % ORTE.length][0], "wz")}<h3>Kurz <i>notiert</i></h3>${t.kurz.map(m => `<a href="${esc(m.url)}"><b>${esc(m.thema)}</b><span>${esc(m.titel)}</span><span>${esc(E.quelle(m))}</span></a>`).join("")}</div>`);
    const tagK = `<div class="k tag" data-ein>${motiv(b.motive[1 + tagNr % 3])}<p><b>${E.tag().getDate()}.</b>${esc(E.datum({ month: "long" }))}<small>${esc(b.lang)}</small></p></div>`;
    const ort = ORTE[(tagNr + nr * 4) % ORTE.length];
    k.push(document.documentElement.dataset.entwurf === "b1" ? `<div class="bb-seite">${tagK}<div class="bb-frei" aria-hidden="true">${motiv(ort[0])}<small>${esc(ort[1] || "")}</small></div></div>` : tagK);
    k.push(losKachel());
    raster.innerHTML = k.join("");
    // Fremde Seiten öffnen immer in einem neuen Tab
    raster.querySelectorAll('a[href^="http"]').forEach(l => { l.target = "_blank"; l.rel = "noopener"; });
    belegen();
    hoerenBinden(b, text);
  }

  // ---- Anhören: echte Hörfassung, Fortschritt als Ring und Leiste, dazu läuft der gerade gesprochene Satz mit ----
  const AUDIO_BASIS = /^(localhost|127\.)/.test(location.hostname) ? "https://boniblatt-mainz.de/" : "";
  let hoerIndex = null, audio = null;
  const hoerDaten = fetch(AUDIO_BASIS + "daten/audio.json").then(r => r.json()).then(d => { hoerIndex = (d.ausgaben || {})[E.ausgabe.datum] || {}; }).catch(() => { hoerIndex = {}; });
  const uhr = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  function hoerenBinden(b, text) {
    if (audio) { audio.pause(); audio = null; }
    const k = raster.querySelector(".ohr"), knopf = k.querySelector(".h-knopf"), gang = k.querySelector(".gang"), spur = k.querySelector(".h-spur"), satz = k.querySelector(".h-satz");
    // Sätze mit ihrem Anteil am Text: daraus wird geschätzt, welcher gerade gesprochen wird
    const saetze = text.split(/(?<=[.!?…])\s+/).filter(Boolean); let summe = 0; const grenzen = saetze.map(s => (summe += s.length + 1)); let gezeigt = -1;
    const stand = () => { if (!audio || !audio.duration) return; const p = audio.currentTime / audio.duration;
      gang.style.strokeDashoffset = 100 - p * 100; spur.firstElementChild.style.width = p * 100 + "%"; spur.setAttribute("aria-valuenow", Math.round(p * 100));
      k.style.setProperty("--p", p.toFixed(4)); k.querySelector(".h-zeit").textContent = uhr(audio.currentTime);
      const nr = grenzen.findIndex(g => g / summe >= p); if (nr !== gezeigt && saetze[nr]) { gezeigt = nr; satz.classList.remove("neu"); void satz.offsetWidth; satz.textContent = saetze[nr]; satz.classList.add("neu"); } };
    hoerDaten.then(() => {
      const info = hoerIndex[b.daten]; if (!info || !k.isConnected) { k.dataset.zustand = "fehlt"; return; }
      k.querySelector(".h-dauer").textContent = uhr(info.sekunden);
      const starten = () => { if (!audio) { audio = new Audio(AUDIO_BASIS + info.datei); k.dataset.zustand = "laedt";
          audio.addEventListener("timeupdate", stand); audio.addEventListener("playing", () => { k.dataset.zustand = "spielt"; knopf.setAttribute("aria-label", "Pause"); });
          audio.addEventListener("pause", () => { if (k.dataset.zustand !== "aus") k.dataset.zustand = "pause"; knopf.setAttribute("aria-label", "Weiter"); });
          audio.addEventListener("ended", () => { k.dataset.zustand = "aus"; gang.style.strokeDashoffset = 100; spur.firstElementChild.style.width = "0"; gezeigt = -1; satz.textContent = "Das war’s für heute. Bis morgen."; knopf.setAttribute("aria-label", "Abspielen"); }); }
        if (audio.paused) audio.play().catch(() => { k.dataset.zustand = "aus"; }); else audio.pause(); };
      knopf.addEventListener("click", starten);
      spur.addEventListener("click", e => { if (!audio) starten(); const r = spur.getBoundingClientRect(), p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); const setze = () => { audio.currentTime = p * audio.duration; stand(); }; if (audio.duration) setze(); else audio.addEventListener("loadedmetadata", setze, { once: true }); });
      spur.addEventListener("keydown", e => { if (!audio || !audio.duration) return; if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 10); });
    });
  }

  // ---- Bereichswechsel: Kacheln gehen (B1 klappen weg, B2 fliegen davon), die Farbrollen laufen um, die neuen kommen ----
  const zufall = (a, b) => (a + Math.random() * (b - a)).toFixed(1);
  let aktiv = "", laeuft = false;
  async function wechsel(id) {
    if (id === aktiv || laeuft) return;
    const b = bereich(id), nr = BEREICHE.indexOf(b);
    wurzel.querySelectorAll(".bb-reiter button").forEach(x => x.setAttribute("aria-pressed", x.dataset.r === b.id));
    const setzen = () => { history.replaceState(null, "", "#" + b.id); wurzel.dataset.r = b.id; wurzel.dataset.n = nr % 5; };
    if (!aktiv || q.has("still")) { setzen(); aktiv = b.id; zeichne(b.id); E.zeigen(raster); return; }
    laeuft = true;
    raster.querySelectorAll(".k").forEach((el, i) => { el.style.setProperty("--i", i); el.style.setProperty("--dx", zufall(-60, 60) + "vw"); el.style.setProperty("--dy", zufall(30, 90) + "vh"); el.style.setProperty("--dr", zufall(-70, 70) + "deg"); });
    raster.classList.add("raus"); setzen();
    await E.warte(SPIEL ? 760 : 640);
    raster.classList.remove("raus"); aktiv = b.id; zeichne(b.id);
    raster.querySelectorAll(".k").forEach((el, i) => { el.classList.add("da"); el.style.setProperty("--i", i); el.style.setProperty("--dx", zufall(-30, 30) + "vw"); el.style.setProperty("--dr", zufall(-40, 40) + "deg"); });
    raster.classList.add("rein");
    await E.warte(1500); raster.classList.remove("rein"); laeuft = false;
  }
  wurzel.querySelector(".bb-reiter").addEventListener("click", e => { const x = e.target.closest("button"); if (x) wechsel(x.dataset.r); });
  const h = location.hash.slice(1);
  wechsel(BEREICHE.some(b => b.id === h) ? h : BEREICHE[0].id);
})();
