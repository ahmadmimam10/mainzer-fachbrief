/* Entwürfe B1 „Bento Druck“ und B2 „Bento Spiel“: gleiche Inhalte und Logik, das Aussehen kommt aus bb.css (.b1 / .b2) */
(async () => {
  const { esc } = E, q = E.q, wurzel = document.getElementById("e"), SPIEL = wurzel.classList.contains("b2");
  await E.laden();
  const [gremien, gNotizen] = await Promise.all(["daten/gremien.json", "daten/gremien-notizen.json"].map(u => fetch(u).then(r => r.json()).catch(() => null)));

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
    <div class="bb-skyline" aria-hidden="true">${["kirschgarten", "christuskirche", "holzturm", "dom", "staatstheater", "bonituerme", "bruecke"].map(m => motiv(m)).join("")}</div>
    <footer class="bb-fuss">
      <a class="f-bild" href="https://github.com/ahmadmimam10" target="_blank" rel="author noopener" aria-label="Ahmed Imam auf GitHub">
        <svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="f-kreis" d="M100 100m-76 0a76 76 0 1 1 152 0a76 76 0 1 1 -152 0"/></defs><text><textPath href="#f-kreis" textLength="470">Mainzer Boniblatt · ein Projekt von Ahmed Imam · </textPath></text></svg>
        <img src="bilder/ahmed-imam.jpg" alt="Ahmed Imam" width="120" height="120" loading="lazy"></a>
      <div class="f-wer"><p class="f-klein">Ein Projekt von</p><p class="f-name">Ahmed <i>Imam</i></p>
        <p class="f-links"><a href="https://github.com/ahmadmimam10" target="_blank" rel="author noopener">GitHub-Profil</a><a href="https://github.com/ahmadmimam10/mainzer-fachbrief" target="_blank" rel="noopener">Quellcode</a><a href="mailto:ahmadmimam10@gmail.com">ahmadmimam10@gmail.com</a></p></div>
      <div class="f-ueber"><strong>Über das <i>Boniblatt</i></strong><span>Testphase · automatisch zusammengestellt, redaktionell gewichtet</span><a class="f-mehr" href="ueber.html">So entsteht das Boniblatt <span aria-hidden="true">→</span></a></div>
    </footer></div>`;
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
    k.push(`<div class="k ohr" data-ein data-zustand="aus"><div class="h-glut" aria-hidden="true"></div><span class="etikett">Anhören · ${esc(b.reiter)}</span>
      <div class="h-buehne"><div class="h-scheibe" aria-hidden="true"><i></i>${motiv("kopfhoerer")}</div>
        <div class="h-kern"><div class="h-strahlen" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="--n:${i}"></i>`).join("")}</div><i class="h-ping"></i><i class="h-ping"></i><button type="button" class="h-knopf" aria-label="Abspielen"><svg class="h-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="spur" cx="60" cy="60" r="54"/><circle class="gang" cx="60" cy="60" r="54" pathLength="100"/></svg><span class="h-symbol"></span></button></div>
        <div class="h-wellen" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="--w:${(.2 + .8 * Math.abs(Math.sin(i * 1.9 + nr))).toFixed(2)};--i:${i}"></i>`).join("")}</div></div>
      <p class="h-satz">${text ? "Drei Minuten für die Ohren: die Ausgabe zum Hören." : "Für diese Ausgabe gibt es noch keine Hörfassung."}</p>
      <div class="h-leiste"><span class="h-zeit">0:00</span><span class="h-spur" role="slider" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></span><span class="h-dauer">–:––</span></div></div>`);
    k.push(wetterKachel());
    t.wichtig.forEach((m, i) => k.push(`<a class="k wichtig n${t.wichtig.length}${i === 1 ? " farbe" : ""}" data-ein href="${esc(m.url)}"><span class="etikett">${esc(m.thema)}</span><h2>${esc(m.titel)}</h2><p>${esc(m.kurz || "")}</p>${unten(m)}</a>`));
    if (t.kurz.length) k.push(`<div class="k liste" data-ein>${motiv(ORTE[(tagNr + nr * 4 + 5) % ORTE.length][0], "wz")}<h3>Kurz <i>notiert</i></h3>${t.kurz.map(m => `<a href="${esc(m.url)}"><b>${esc(m.thema)}</b><span>${esc(m.titel)}</span><span>${esc(E.quelle(m))}</span></a>`).join("")}</div>`);
    const tagK = `<div class="k tag" data-ein>${motiv(b.motive[1 + tagNr % 3])}<p><b>${E.tag().getDate()}.</b>${esc(E.datum({ month: "long" }))}<small>${esc(b.lang)}</small></p></div>`;
    const ort = ORTE[(tagNr + nr * 4) % ORTE.length];
    k.push(document.documentElement.dataset.entwurf === "b1" ? `<div class="bb-seite">${tagK}<div class="bb-frei" aria-hidden="true">${motiv(ort[0])}<small>${esc(ort[1] || "")}</small></div></div>` : tagK);
    const saal = gremienKachel(b); if (saal) k.push(saal);
    k.push(losKachel());
    raster.innerHTML = k.join("");
    // Fremde Seiten öffnen immer in einem neuen Tab
    raster.querySelectorAll('a[href^="http"]').forEach(l => { l.target = "_blank"; l.rel = "noopener"; });
    belegen();
    gremienBinden(b);
    hoerenBinden(b, text);
  }

  // ---- Anhören: echte Hörfassung, Fortschritt als Ring und Leiste, dazu läuft der gerade gesprochene Satz mit ----
  // ---- Gremien „Im Saal“: jeder Punkt im Halbrund ist ein Tagesordnungspunkt – antippen zeigt ihn, die Legende filtert ----
  const KERN_G = /^(Jugendhilfeausschuss|Sozialausschuss|Stadtrat)$/i;
  const ARTEN = [["vorlage", "Vorlagen", "Vorlage"], ["antrag", "Anträge", "Antrag"], ["anfrage", "Anfragen", "Anfrage"], ["bericht", "Berichte", "Bericht"], ["sonstiges", "Sonstiges", "Sonstiges"]];
  const STICHWORT = { "jugendhilfeplanung": /jugend|kinder|kita|krippe|schul|famil|erzieh|eingliederung|sgb|sozialraum/i, "fruehe-hilfen": /kinder|famil|kita|krippe|eltern|geburt|hebamm|schutz|frühe/i, "quartiersmanagement": /quartier|stadtteil|sozialraum|soziale|wohn|platz|bürgerhaus|treff|nachbar|beteiligung/i };
  const mittag = d => new Date(d + "T12:00:00");
  const kurzG = g => String(g).replace("Ortsbeirat Mainz-", "Ortsbeirat ").replace(" der Stadt Mainz", "").replace("Beirat für Migration und Integration", "Migrationsbeirat");
  let gSitzungen = [];
  function gremienKachel(b) {
    const alle = (gremien && gremien.sitzungen) || [], notiz = (gNotizen && gNotizen.notizen) || {};
    const naechste = alle.filter(s => s.datum >= heute && s.status !== "vergangen" && KERN_G.test(s.gremium || "")).sort((x, y) => (x.datum + (x.zeit || "")).localeCompare(y.datum + (y.zeit || "")))[0];
    const zuletzt = Object.entries(notiz).filter(([id, n]) => n.datum < heute && n.ressorts && n.ressorts[b.daten]).sort((x, y) => y[1].datum.localeCompare(x[1].datum)).slice(0, 4)
      .map(([id, n]) => ({ ...(alle.find(s => s.id === id) || {}), id, gremium: n.gremium, datum: n.datum, url: n.url }));
    gSitzungen = [...(naechste ? [naechste] : []), ...zuletzt].map(s => ({ ...s, text: ((notiz[s.id] || {}).ressorts || {})[b.daten] || "", gelesen: !!notiz[s.id], kommt: s.datum >= heute }));
    if (!gSitzungen.length) return "";
    return `<div class="k saal" data-ein><span class="etikett">Gremien · ${esc(b.reiter)}</span>
      <div class="s-kopf"><h3>Im <i>Saal</i></h3><div class="s-wahl" role="tablist">${gSitzungen.map((s, i) => `<button type="button" role="tab" aria-selected="${!i}" data-i="${i}">${s.kommt ? "<em>kommt</em>" : ""}${esc(kurzG(s.gremium))}<small>${esc(mittag(s.datum).toLocaleDateString("de-DE", { day: "numeric", month: "short" }))}</small></button>`).join("")}</div></div>
      <div class="s-buehne"><div class="s-text"></div><div class="s-rund"></div></div></div>`;
  }
  function gremienBinden(b) {
    const k = raster.querySelector(".saal"); if (!k) return;
    const text = k.querySelector(".s-text"), rund = k.querySelector(".s-rund"), stich = STICHWORT[b.daten] || /$^/;
    const zeige = nr => {
      const s = gSitzungen[nr], tops = s.tops || [], n = tops.length, tage = Math.round((mittag(s.datum) - mittag(heute)) / 864e5);
      k.querySelectorAll(".s-wahl button").forEach((x, i) => x.setAttribute("aria-selected", i === nr));
      const wann = tage === 0 ? "heute" : tage === 1 ? "morgen" : tage > 0 ? `in ${tage} Tagen` : tage === -1 ? "gestern" : `vor ${-tage} Tagen`;
      text.innerHTML = `<p class="s-wann"><b>${wann}</b><span>${esc(mittag(s.datum).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }))}${s.zeit ? " · " + esc(s.zeit) + " Uhr" : ""}</span></p>
        <h4>${esc(s.gremium)}</h4>${s.ort ? `<p class="s-ort">${esc(s.ort.split(",").slice(0, 2).join(","))}</p>` : ""}
        <p class="s-notiz">${s.text ? `<b>Darum geht’s:</b> ${esc(s.text)}` : s.gelesen ? "Für diesen Bereich ist nichts vermerkt." : "Die Tagesordnung ist noch nicht ausgewertet."}</p>
        <a class="s-link" href="${esc(s.url)}" target="_blank" rel="noopener">Zur Sitzung im Ratsinfo <span aria-hidden="true">→</span></a>`;
      if (!n) { rund.innerHTML = `<p class="s-leer">Die Tagesordnung ist noch nicht veröffentlicht.</p>`; return; }
      // Plätze: Reihen von innen nach außen, gleichmäßig auf den Bögen verteilt, von links nach rechts durchgezählt
      const reihen = n <= 9 ? 1 : n <= 24 ? 2 : n <= 48 ? 3 : n <= 80 ? 4 : 5, r1 = 176, r0 = reihen === 1 ? 150 : reihen === 2 ? 128 : reihen === 3 ? 104 : 86;
      const radien = Array.from({ length: reihen }, (_, i) => reihen === 1 ? r0 : r0 + (r1 - r0) * i / (reihen - 1)), sr = radien.reduce((x, y) => x + y, 0);
      const z = radien.map(r => Math.floor(n * r / sr)); let offen = n - z.reduce((x, y) => x + y, 0); for (let i = reihen - 1; offen > 0; i = (i - 1 + reihen) % reihen, offen--) z[i]++;
      const plaetze = []; radien.forEach((r, i) => { for (let j = 0; j < z[i]; j++) { const w = z[i] === 1 ? Math.PI / 2 : Math.PI * (1 - j / (z[i] - 1)); plaetze.push({ w, r, x: 200 + r * Math.cos(w), y: 196 - r * Math.sin(w) }); } });
      plaetze.sort((x, y) => y.w - x.w || x.r - y.r);
      const pr = Math.min(11, .42 * Math.min(Math.PI * radien[0] / Math.max(1, z[0] - 1), reihen > 1 ? (r1 - r0) / (reihen - 1) : 99));
      const art = x => ARTEN.find(a => a[0] === x.art) || ARTEN[4], treffer = tops.filter(x => stich.test(x.titel)).length;
      rund.removeAttribute("data-filter");
      rund.innerHTML = `<div class="s-halb"><svg viewBox="0 0 400 210" role="group" aria-label="Tagesordnung, ${n} Punkte">${tops.map((x, i) => `<circle class="s-p a-${art(x)[0]}${stich.test(x.titel) ? " s-treffer" : ""}" data-t="${i}" cx="${plaetze[i].x.toFixed(1)}" cy="${plaetze[i].y.toFixed(1)}" r="${pr.toFixed(1)}" style="--i:${i}" tabindex="0" role="button" aria-label="TOP ${esc(x.nr)}: ${esc(x.titel)}"/>`).join("")}</svg>
        <div class="s-mitte"><b>${n}</b><span>Punkte</span></div></div>
        <p class="s-top"><span>Jeder Punkt ist ein Tagesordnungspunkt – einfach antippen.</span></p>
        <div class="s-legende">${ARTEN.map(a => [a, tops.filter(x => art(x) === a).length]).filter(a => a[1]).map(([a, zahl]) => `<button type="button" data-art="${a[0]}" aria-pressed="false"><i class="a-${a[0]}"></i>${a[1]} <b>${zahl}</b></button>`).join("")}${treffer ? `<button type="button" data-art="treffer" aria-pressed="false"><i class="s-treffer"></i>Stichworte zum Bereich <b>${treffer}</b></button>` : ""}</div>`;
      const waehle = el => { const x = tops[el.dataset.t]; if (!x || el.classList.contains("s-an")) return;
        rund.querySelectorAll(".s-an").forEach(y => y.classList.remove("s-an")); el.classList.add("s-an");
        rund.querySelector(".s-mitte").innerHTML = `<span>TOP</span><b>${esc(x.nr)}</b>`;
        rund.querySelector(".s-top").innerHTML = `<b>${art(x)[2]}${x.ergebnis ? " · " + esc(x.ergebnis) : ""}</b>${esc(x.titel)}${x.url ? ` <a href="${esc(x.url)}" target="_blank" rel="noopener">öffnen →</a>` : ""}`; };
      rund.onpointerover = rund.onfocusin = e => { const el = e.target.closest(".s-p"); if (el) waehle(el); };
      rund.onclick = e => { const el = e.target.closest(".s-p"); if (el) return waehle(el);
        const l = e.target.closest("[data-art]"); if (!l) return; const an = rund.dataset.filter === l.dataset.art;
        rund.querySelectorAll("[data-art]").forEach(y => y.setAttribute("aria-pressed", !an && y === l)); if (an) rund.removeAttribute("data-filter"); else rund.dataset.filter = l.dataset.art; };
    };
    k.querySelector(".s-wahl").onclick = e => { const x = e.target.closest("button"); if (x) zeige(+x.dataset.i); };
    zeige(0);
  }

  const AUDIO_BASIS = /^(localhost|127\.)/.test(location.hostname) ? "https://boniblatt-mainz.de/" : "";
  let hoerIndex = null, audio = null, hoerCtx = null;
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
      const nr = grenzen.findIndex(g => g / summe >= p); if (nr !== gezeigt && saetze[nr]) { gezeigt = nr; satz.classList.remove("neu"); void satz.offsetWidth; satz.innerHTML = saetze[nr].split(" ").map(w => "<span>" + esc(w) + "</span>").join(" "); satz.classList.add("neu"); }
      // Wörter leuchten nach und nach auf (geschätzt aus der Textlänge)
      if (saetze[nr]) { const von = nr ? grenzen[nr - 1] : 0, anteil = (p * summe - von) / (grenzen[nr] - von), ges = saetze[nr].length; let z = 0;
        for (const w of satz.children) { const a = z / ges; z += w.textContent.length + 1; const kl = anteil >= z / ges ? "war" : anteil >= a ? "jetzt" : ""; if (w.className !== kl) w.className = kl; } } };
    // Pegel: die echten Frequenzen der Aufnahme (Web Audio); klappt das nicht, läuft eine ruhige Ersatzbewegung
    const strahlen = [...k.querySelectorAll(".h-strahlen i")], wellen = [...k.querySelectorAll(".h-wellen i")]; let analyser = null, bins = null, bild = 0, glatt = 0, versucht = false;
    const messen = () => { try { const AC = window.AudioContext || window.webkitAudioContext; hoerCtx = hoerCtx || new AC(); hoerCtx.resume(); const quelle = hoerCtx.createMediaElementSource(audio);
        analyser = hoerCtx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = .78; quelle.connect(analyser); analyser.connect(hoerCtx.destination); bins = new Uint8Array(analyser.frequencyBinCount); } catch (e) { analyser = null; } };
    const pegel = (i, ms) => analyser ? bins[2 + i % 28] / 255 : .35 + .3 * Math.sin(ms / 190 + i * 1.7) + .25 * Math.sin(ms / 83 + i * .6);
    const malen = ms => { let s = 0; strahlen.forEach((el, i) => { const v = Math.max(0, pegel(i < 20 ? i : 39 - i, ms)); s += v; el.style.setProperty("--s", v.toFixed(3)); });
      wellen.forEach((el, i) => el.style.setProperty("--w", Math.max(.06, pegel(Math.abs(i - 13), ms)).toFixed(3))); return s / 40; };
    const lauf = ms => { if (!audio || audio.paused || !k.isConnected) { bild = 0; return; }
      if (analyser) analyser.getByteFrequencyData(bins);
      glatt += (malen(ms) - glatt) * .25; k.style.setProperty("--pegel", glatt.toFixed(3)); stand(); bild = requestAnimationFrame(lauf); };
    if (q.has("hoerbild")) { // Standbild der laufenden Wiedergabe (für Bilder)
      k.dataset.zustand = "spielt"; malen(900); k.style.setProperty("--pegel", ".5"); gang.style.strokeDashoffset = 63; spur.firstElementChild.style.width = "37%"; k.querySelector(".h-zeit").textContent = "0:41";
      satz.innerHTML = (saetze[2] || saetze[0] || "").split(" ").map((w, i) => `<span class="${i < 5 ? "war" : i === 5 ? "jetzt" : ""}">${esc(w)}</span>`).join(" "); return; }
    hoerDaten.then(() => {
      const info = hoerIndex[b.daten]; if (!info || !k.isConnected) { k.dataset.zustand = "fehlt"; return; }
      k.querySelector(".h-dauer").textContent = uhr(info.sekunden);
      const starten = () => { if (!audio) { audio = new Audio(); audio.crossOrigin = "anonymous"; audio.src = AUDIO_BASIS + info.datei; k.dataset.zustand = "laedt";
          audio.addEventListener("timeupdate", stand); audio.addEventListener("playing", () => { k.dataset.zustand = "spielt"; knopf.setAttribute("aria-label", "Pause"); if (!versucht) { versucht = true; messen(); } if (!bild) bild = requestAnimationFrame(lauf); });
          audio.addEventListener("error", () => { k.dataset.zustand = "aus"; satz.textContent = "Die Hörfassung lädt gerade nicht."; });
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
