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

  const motiv = (name, kl = "") => { const u = "bilder/motive/" + (name.includes(".") ? name : name + ".webp"); return `<span class="st ${kl}" style="-webkit-mask-image:url(${u});mask-image:url(${u})" aria-hidden="true"></span>`; };
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
  const wetterGross = (t, i) => `${wetterBild(t.lage)}<p><b>${t.max}°</b><span>${i ? new Date(t.tag + "T12:00").toLocaleDateString("de-DE", { weekday: "long" }) : "heute"} ${WORT[t.lage] || ""}, nachts ${t.min}°${t.regen >= 30 ? ` · Regen ${t.regen} %` : ""}</span></p>`;
  function wetterKachel() {
    const w = (window.BONIBLATT_WETTER7 || []).slice(0, 7); if (!w.length) return "";
    const lo = Math.min(...w.map(t => t.min)), hi = Math.max(...w.map(t => t.max)), sp = Math.max(1, hi - lo), h = w[0];
    return `<div class="k wetter" data-ein><span class="etikett">Wetter in Mainz · Tag antippen</span>
      <div class="w-heute">${wetterGross(h, 0)}</div>
      <div class="w-woche">${w.map((t, i) => `<button type="button" class="w-tag${i ? "" : " heute"}" data-i="${i}" style="--i:${i}" aria-label="Wetter ${i ? new Date(t.tag + "T12:00").toLocaleDateString("de-DE", { weekday: "long" }) : "heute"}"><span>${i ? new Date(t.tag + "T12:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "") : "Heute"}</span>${wetterBild(t.lage)}
        <i class="w-saeule"><i style="--von:${((t.min - lo) / sp).toFixed(3)};--bis:${((t.max - lo) / sp).toFixed(3)}"></i></i><b>${t.max}°</b><small>${t.min}°</small></button>`).join("")}</div></div>`;
  }

  // ---- „Was geht heute ab?“ – vorerst mit Beispielen; später sucht die Redaktion echte Termine ----
  const BEISPIELE = [["marktstand", "ab 16 Uhr", "Feierabendmarkt", "Mainz, Altstadt"], ["musik", "20 Uhr", "Offene Bühne", "Mainz, Neustadt"], ["ausstellung", "bis 18 Uhr", "Neue Ausstellung eröffnet", "Wiesbaden"],
    ["wein", "ab 17 Uhr", "Weinstand am Rheinufer", "Mainz"], ["flohmarkt", "Samstag", "Flohmarkt am Fluss", "Frankfurt"], ["film", "21 Uhr", "Kurzfilmabend", "Ingelheim"]];
  const LOS_BILD = { fussball: "fussball", sport: "laufschuh", markt: "marktstand", flohmarkt: "flohmarkt", fest: "riesenrad", musik: "musik", party: "disko", kino: "film", theater: "theater", ausstellung: "ausstellung", neu: "luftballons", familie: "spielplatz", wein: "wein", essen: "brezel", fastnacht: "narrenkappe", spiel: "gamepad.svg", restaurant: "besteck.svg", ausflug: "weinberg", spielzeug: "baukloetze", verein: "haende", entdecken: "stadtplan" };
  const losKachel = () => { const neu = E.daten.ausgaben[0] || {}, iso = n => new Date(mittag(heute).getTime() + n * 864e5).toLocaleDateString("sv-SE"), bis = iso(7);
    // Fußball: nur FC Barcelona, Real Madrid, Spanien und Ägypten – und je Mannschaft nur das nächste Spiel
    const MANNSCHAFTEN = [/Real Madrid/i, /Barcelona|Barça/i, /Spanien/i, /Ägypten/i], gezeigt = new Set();
    // Tipps (Restaurant, Ausflug, Spielzeug, Verein, Entdecken) haben keinen festen Tag: Sie bleiben eine Woche stehen und kommen nach den Terminen
    const TIPP = new Set(["restaurant", "ausflug", "spielzeug", "verein", "entdecken"]), vor7 = iso(-7);
    const echt = (Array.isArray(neu.termine) ? neu.termine : []).filter(x => x.tag <= bis && x.tag >= (TIPP.has(x.art) ? vor7 : heute)).sort((x, y) => TIPP.has(x.art) - TIPP.has(y.art) || x.tag.localeCompare(y.tag)).filter(x => { if (x.art !== "fussball") return true;
      const wer = MANNSCHAFTEN.map((m, i) => m.test(x.titel) ? i : -1).filter(i => i >= 0); if (!wer.length || wer.every(i => gezeigt.has(i))) return false; wer.forEach(i => gezeigt.add(i)); return true; });
    const liste = echt.length ? echt.map(x => [LOS_BILD[x.art] || "riesenrad", TIPP.has(x.art) ? "" : x.tag, x.wann, x.titel, x.ort, x.url]) : q.has("beispiele") ? BEISPIELE.map((x, i) => [x[0], iso(i), x[1], x[2], x[3]]) : null; if (!liste) return "";
    const tagWort = d => { const z = tageBis(d); return z === 0 ? "Heute" : z === 1 ? "Morgen" : mittag(d).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "") + " " + mittag(d).getDate() + "."; };
    return `<div class="k los" data-ein><div class="los-kopf"><h3>Was <i>geht?</i></h3><span class="etikett">Die nächsten 7 Tage · Fußball, Spiele, Mainz &amp; Rhein-Main${echt.length ? "" : " · Beispiele"}</span></div>
    <div class="los-reihe">${liste.map(([m, tag, wann, was, wo, url], i) => { const innen = `${motiv(m)}<b>${tag ? esc(tagWort(tag)) : "Tipp"}${wann ? " · " + esc(wann) : ""}</b><strong${/\S{16,}/.test(was) ? ' class="eng"' : ""}>${esc(was)}</strong><small>${esc(wo)}</small>`;
      return /^https?:/.test(url || "") ? `<a class="los-karte f${i % 5}" href="${esc(url)}">${innen}</a>` : `<div class="los-karte f${i % 5}">${innen}</div>`; }).join("")}</div></div>`; };

  // ---- Bild des Tages: ein Mainzer Motiv, jeden Tag ein anderes ----
  const ORTE = [["dom", "Der Dom"], ["christuskirche", "Christuskirche"], ["gutenberg", "Gutenberg"], ["bruecke", "Theodor-Heuss-Brücke"], ["holzturm", "Holzturm"], ["fastnachtsbrunnen", "Fastnachtsbrunnen"], ["schloss", "Kurfürstliches Schloss"],
    ["staatstheater", "Staatstheater"], ["kirschgarten", "Kirschgarten"], ["hafenkran", "Zollhafen"], ["strassenbahn", "Linie 51"], ["neustadt", "Neustadt"], ["weinberg", "Weinberge"], ["schiff", "Auf dem Rhein"], ["bonituerme", "Bonifaziustürme"]];

  // Neben dem Gruß steht blass ein Mainzer Wahrzeichen, jeden Tag ein anderes – nur Bauwerke, die man sofort erkennt (keine Brücke, Bahn, Weinberge)
  const WAHRZEICHEN = ["dom", "gutenberg", "holzturm", "christuskirche", "fastnachtsbrunnen", "schloss", "bonituerme", "staatstheater"];
  // ---- Gerüst ----
  const welle = `<svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V30C100 6 200 6 300 30S500 54 600 30S800 6 900 30S1100 54 1200 30V60Z"/></svg>`;
  const stunde = new Date().getHours(), gruss = stunde >= 4 && stunde < 11 ? "Morgen" : stunde >= 11 && stunde < 17 ? "Tag" : "Abend";
  wurzel.innerHTML = `<div class="bb-welle">${welle}${welle}</div><div class="bb-nieder" aria-hidden="true"></div><div class="bb-innen">
    <header class="bb-oben">${motiv(WAHRZEICHEN[tagNr % WAHRZEICHEN.length], "wz kopfwz")}<p class="bb-gruss">Guten <i>${gruss}.</i></p><div class="bb-ausgaben"></div>
      <nav class="bb-reiter" aria-label="Bereiche"><i class="r-pille" aria-hidden="true"></i>${BEREICHE.map((b, i) => `<button type="button" data-r="${b.id}" aria-pressed="false" style="--nr:${i}">${motiv(b.motive[0])}<span>${esc(b.reiter)}</span></button>`).join("")}</nav></header>
    <section class="bb-raster" id="kacheln"></section>
    
    <footer class="bb-fuss"><div class="bb-skyline" aria-hidden="true">${["kirschgarten", "christuskirche", "holzturm", "dom", "staatstheater", "bonituerme", "bruecke"].map(m => motiv(m)).join("")}</div>
      <a class="f-bild" href="https://github.com/ahmadmimam10" target="_blank" rel="author noopener" aria-label="Ahmed Imam auf GitHub">
        <svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="f-kreis" d="M100 100m-76 0a76 76 0 1 1 152 0a76 76 0 1 1 -152 0"/></defs><text><textPath href="#f-kreis" textLength="470">Mainzer Boniblatt · ein Projekt von Ahmed Imam · </textPath></text></svg>
        <img src="bilder/ahmed-imam.jpg" alt="Ahmed Imam" width="120" height="120" loading="lazy"></a>
      <div class="f-wer"><p class="f-klein">Ein Projekt von</p><p class="f-name">Ahmed <i>Imam</i></p>
        <p class="f-links"><a href="https://www.linkedin.com/in/ahmadmimam10/" target="_blank" rel="author noopener">LinkedIn</a><a href="https://github.com/ahmadmimam10" target="_blank" rel="author noopener">GitHub-Profil</a><a href="https://github.com/ahmadmimam10/mainzer-fachbrief" target="_blank" rel="noopener">Quellcode</a><a href="mailto:ahmadmimam10@gmail.com">ahmadmimam10@gmail.com</a></p></div>
      <div class="f-ueber"><strong>Über das <i>Boniblatt</i></strong><span>Testphase · automatisch zusammengestellt, redaktionell gewichtet</span><span class="f-modell">Aufbau: Claude Fable 5.2 (high) · Redaktion: Claude Sonnet 5.5</span><a class="f-mehr" href="ueber.html">Werkstatt und Geschichte <span aria-hidden="true">→</span></a><a class="f-mehr" href="kalender.html">Fundstück-Kalender 2027 <span aria-hidden="true">→</span></a><a class="f-mehr" href="verwaltung.html">Verwaltung <span aria-hidden="true">→</span></a></div>
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
  if (art) { nieder.dataset.art = art; const n = art === "regen" ? 22 : art === "schnee" ? 20 : 4;
    nieder.innerHTML = Array.from({ length: n }, (_, i) => { const d = art === "regen" ? 1.3 + i % 5 * .22 : art === "schnee" ? 11 + i % 6 * 1.6 : 12 + i % 5 * 2.3;
      return `<i style="--x:${(i * 37 + 11) % 104 - 2}%;--nd:${d.toFixed(1)}s;--v:${(-(i * 1.9) % d).toFixed(1)}s;--g:${art === "regen" ? 26 + i % 4 * 9 : art === "schnee" ? 4 + i % 4 * 2 : 15 + i % 4 * 4};--r:${art === "laub" || art === "bluete" ? 200 + i * 40 : 0}deg">${teilchen(i)}</i>`; }).join(""); }
  // Liegenbleiben: Blätter und Blüten in den Ecken, Tropfen auf der Fläche, Schnee auf der Oberkante mancher Kacheln
  function belegen() {
    if (!art) return;
    raster.querySelectorAll(".k:not(.stapel)").forEach((el, i) => {
      if (art === "schnee") { if (i % 2 === 0) { el.classList.add("verschneit"); el.style.setProperty("--sx", 7 + i * 17 % 30 + "%"); el.style.setProperty("--sb", 38 + i * 13 % 24 + "%"); } return; }
      if (art === "regen" ? i % 3 === 1 : i % 3) return;
      el.insertAdjacentHTML("beforeend", Array.from({ length: art === "regen" ? 5 : 1 }, (_, j) => { const z = (i * 31 + j * 47 + 13) % 100, regen = art === "regen";
        return `<i class="bb-lieg ${art}" style="left:${regen ? 5 + z * .88 : j ? 54 + z % 22 : 72 + z % 22}%;top:${regen ? 8 + z * 53 % 82 : j ? 91 + z % 4 : 2 + z % 7}%;--r:${z * 7 % 360}deg;--g:${regen ? 5 + z % 6 : art === "bluete" ? 13 + z % 7 : 20 + z % 11}">${teilchen(i + j)}</i>`; }).join(""));
    });
  }
  const TEIL_BILD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
  const teilen = m => `<span class="teil" role="button" tabindex="0" aria-label="Meldung teilen" title="Teilen" data-t="${esc(m.titel)}" data-u="${esc(m.url)}">${TEIL_BILD}</span>`;
  // Leserstimmen „relevant ja/nein“: ein Klick zählt anonym je Monat und Meldung (Dienst cloudflare/bestenliste, /d); ein zweiter nimmt sie zurück.
  // Die eigene Wahl merkt sich nur der Browser. Der Qualitätsmanager wertet die Stimmen monatlich aus (QUALITAET.md).
  const DAUMEN_URL = "https://boniblatt-bestenliste.ahmadmimam10.workers.dev/d", DAUMEN_KEY = "boniblatt-daumen";
  const meineDaumen = (() => { try { return JSON.parse(localStorage.getItem(DAUMEN_KEY) || "{}") || {}; } catch { return {}; } })();
  const DAUMEN_BILD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10.5V20H4.5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1zM7 10.5l4-7.2a2 2 0 0 1 3.7 1.4L14 9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>';
  const daumen = (m, frage) => m.id ? `<span class="daumen" data-id="${esc(m.id)}" data-w="${meineDaumen[m.id] || 0}" role="group" aria-label="Ist diese Meldung relevant?">${frage ? '<span class="d-frage">relevant?</span>' : ""}<span class="d" data-d="1" role="button" tabindex="0" aria-label="Relevant" title="Relevant">${DAUMEN_BILD}</span><span class="d runter" data-d="-1" role="button" tabindex="0" aria-label="Nicht relevant" title="Nicht relevant">${DAUMEN_BILD}</span></span>` : "";
  const stimme = d => { const g = d.closest(".daumen"), id = g.dataset.id, alt = Number(g.dataset.w) || 0, w = alt === Number(d.dataset.d) ? 0 : Number(d.dataset.d);
    wurzel.querySelectorAll(".daumen").forEach(x => { if (x.dataset.id === id) x.dataset.w = w; });
    if (w) meineDaumen[id] = w; else delete meineDaumen[id];
    try { localStorage.setItem(DAUMEN_KEY, JSON.stringify(meineDaumen)); } catch { /* ohne Speicher bleibt es bei diesem Besuch */ }
    try { const body = JSON.stringify({ id, w, alt }); if (!(navigator.sendBeacon && navigator.sendBeacon(DAUMEN_URL, body))) fetch(DAUMEN_URL, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {}); } catch { /* Abstimmen darf nie stören */ } };
  const unten = m => `<span class="unten"><span>${esc(E.quelle(m))}</span>${daumen(m, true)}${teilen(m)}<span class="pfeil">→</span></span>`;

  function zeichne(id) {
    const b = bereich(id), t = E.teile(b.daten), nr = BEREICHE.indexOf(b), k = [];
    const text = ((E.ausgabe.hoerfassungen || {})[b.daten] || "").trim();
    // Leerfälle und Überfülle: Ohne Aufmacher rückt die erste wichtige Meldung nach oben. Mehr als vier wichtige wandern in „Kurz notiert“,
    // dort klappen sich Meldungen ab der elften ein. Gibt es gar nichts Wichtiges oder gar nichts, sagt das eine ruhige Kachel an gleicher Stelle.
    const auf = t.auf || t.wichtig[0] || null, wichtig = t.wichtig.filter(m => m !== auf), kurz = [...wichtig.splice(4), ...t.kurz];
    if (auf) k.push(`<a class="k auf" data-ein href="${esc(auf.url)}">${motiv(b.motive[0], "gross")}<span class="etikett">Aufmacher · ${esc(auf.thema)}</span><h2>${esc(auf.titel)}</h2><p>${esc(auf.kurz || "")}</p>${unten(auf)}</a>`);
    else k.push(`<div class="k auf leer" data-ein>${motiv(b.motive[1] || b.motive[0], "gross")}<span class="etikett">${esc(b.reiter)}</span><h2>${kurz.length ? "Heute nichts Dringendes" : "Heute nichts Neues"}</h2>
      <p>${kurz.length ? `Für diesen Bereich gab es keine Meldung, die nach oben gehört – weiter unten ${kurz.length === 1 ? "steht eine kurze Meldung" : "stehen " + kurz.length + " kurze Meldungen"}.` : "Alle Quellen wurden abgerufen, für diesen Bereich war nichts Passendes dabei. Frühere Ausgaben findest du im Archiv."}</p>
      <span class="unten"><button type="button" class="leer-archiv">Archiv &amp; Suche öffnen</button></span></div>`);
    k.push(`<div class="k ohr" data-ein data-zustand="aus"><div class="h-glut" aria-hidden="true"></div><span class="h-kopf"><span class="etikett">Anhören · ${esc(b.reiter)}</span><span class="h-ki" title="Die Stimme ist künstlich erzeugt">KI-generiert</span></span>
      <div class="h-buehne"><div class="h-scheibe" aria-hidden="true"><i></i>${motiv("kopfhoerer")}</div>
        <button type="button" class="h-knopf" aria-label="Abspielen"><svg class="h-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="spur" cx="60" cy="60" r="54"/><circle class="gang" cx="60" cy="60" r="54" pathLength="100"/></svg><span class="h-symbol"></span></button>
        <div class="h-wellen" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="--w:${(.2 + .8 * Math.abs(Math.sin(i * 1.9 + nr))).toFixed(2)};--i:${i}"></i>`).join("")}</div></div>
      <p class="h-satz">${text ? "Drei Minuten für die Ohren: die Ausgabe zum Hören." : "Für diese Ausgabe gibt es noch keine Hörfassung."}</p>
      <div class="h-leiste"><span class="h-zeit">0:00</span><span class="h-spur" role="slider" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></span><span class="h-dauer">–:––</span><button type="button" class="h-tempo" aria-label="Wiedergabetempo ändern" title="Wiedergabetempo">1×</button></div></div>`);
    k.push(wetterKachel());
    wichtig.forEach((m, i) => k.push(`<a class="k wichtig n${wichtig.length === 4 ? 2 : wichtig.length}${i === 1 ? " farbe" : ""}" data-ein href="${esc(m.url)}"><span class="etikett">${esc(m.thema)}</span><h2>${esc(m.titel)}</h2><p>${esc(m.kurz || "")}</p>${unten(m)}</a>`));
    if (kurz.length) k.push(`<div class="k liste" data-ein>${motiv(ORTE[(tagNr + nr * 4 + 5) % ORTE.length][0], "wz")}<h3>Kurz <i>notiert</i></h3>${kurz.map((m, i) => `<a href="${esc(m.url)}"${i >= 10 ? ' class="spaeter"' : ""}><b>${esc(m.thema)}</b><span class="ti">${esc(m.titel)}</span><span class="qu">${esc(E.quelle(m))}</span><span class="werkzeug">${daumen(m)}${teilen(m)}</span></a>`).join("")}${kurz.length > 10 ? `<button type="button" class="liste-mehr">Alle ${kurz.length} Meldungen zeigen</button>` : ""}</div>`);
    const gk = gremienKachel(b); if (gk) k.push(gk);
    const lk = losKachel(); if (lk) k.push(lk);
    raster.innerHTML = k.join("");
    // Fremde Seiten öffnen immer in einem neuen Tab
    raster.querySelectorAll('a[href^="http"]').forEach(l => { l.target = "_blank"; l.rel = "noopener"; });
    belegen();
    hoerenBinden(b, text);
  }

  // ---- Anhören: echte Hörfassung, Fortschritt als Ring und Leiste, dazu läuft der gerade gesprochene Satz mit ----
  // ---- Gremien: Was kommt in der nächsten Woche, was war in der letzten – nur Sitzungen mit einem Thema für den Bereich; ein Klick führt ins Ratsinfo ----
  const KERN_G = /^(Jugendhilfeausschuss|Sozialausschuss|Stadtrat)$/i, mittag = d => new Date(d + "T12:00:00"), tageBis = d => Math.round((mittag(d) - mittag(heute)) / 864e5);
  function gremienKachel(b) {
    const alle = (gremien && gremien.sitzungen) || [], roh = (gNotizen && gNotizen.notizen) || {};
    const notiz = Object.entries(roh).map(([id, n]) => ({ id, ...n, zeit: (alle.find(s => s.id === id) || {}).zeit, text: (n.ressorts || {})[b.daten], erg: (n.ergebnis || {})[b.daten] })).filter(n => n.text && n.datum);
    if (!alle.length && !notiz.length) return "";
    // Rang: Jugendhilfeausschuss, Sozialausschuss und Stadtrat zuerst, danach nach Datum – alles wird gezeigt, ohne Obergrenze
    const rang = n => KERN_G.test(n.gremium || "") ? 0 : 1;
    const kommt = notiz.filter(n => n.datum >= heute && tageBis(n.datum) <= 7).sort((x, y) => rang(x) - rang(y) || x.datum.localeCompare(y.datum));
    // „war“: die letzten 7 Tage, Jugendhilfeausschuss, Sozialausschuss und Stadtrat bis 14 Tage zurück
    const war = notiz.filter(n => n.datum < heute && tageBis(n.datum) >= (KERN_G.test(n.gremium || "") ? -14 : -7)).sort((x, y) => rang(x) - rang(y) || y.datum.localeCompare(x.datum));
    const naechste = alle.filter(s => s.datum >= heute && s.status !== "vergangen" && KERN_G.test(s.gremium || "") && !kommt.some(n => n.id === s.id)).sort((x, y) => (x.datum + (x.zeit || "")).localeCompare(y.datum + (y.zeit || "")))[0];
    const wann = d => { const z = tageBis(d); return z === 0 ? "heute" : z === 1 ? "morgen" : z > 0 ? `in ${z} Tagen` : z === -1 ? "gestern" : `vor ${-z} Tagen`; };
    const eintrag = (n, kl) => { const d = mittag(n.datum); return `<a class="g-eintrag${kl ? " " + kl : ""}" href="${esc(n.url)}" target="_blank" rel="noopener"><span class="g-text"><em>${esc(d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }))} · ${wann(n.datum)}${n.zeit && n.datum >= heute ? " · " + esc(n.zeit) + " Uhr" : ""}</em><strong>${esc(n.gremium)}</strong><span>${esc(n.text)}</span></span><span class="g-pfeil" aria-hidden="true">↗</span></a>`; };
    // Ergebnis einer Sitzung: Steht es ausdrücklich in der Notiz (Feld „ergebnis“ je Bereich), gilt das. Sonst wird es vorsichtig aus dem Wortlaut gelesen:
    // satzweise, nie bei Verneinung („nicht beschlossen“, „kein Beschluss“) und nie, wenn der Satz nur etwas ankündigt („soll“, „geplant“, „Tagesordnung“).
    const MARKEN = { beschlossen: "ja", einstimmig: "ja", mehrheitlich: "ja", abgelehnt: "nein", vertagt: "halt", "zurückgestellt": "halt", "zur Kenntnis": "info" };
    const STEMPEL = [[/abgelehnt/i, "abgelehnt"], [/zurückgestellt/i, "zurückgestellt"], [/vertagt|verschoben/i, "vertagt"], [/einstimmig/i, "einstimmig"], [/mehrheitlich/i, "mehrheitlich"], [/beschlossen|zugestimmt|angenommen/i, "beschlossen"], [/zur Kenntnis/i, "zur Kenntnis"]];
    const NEIN = /(^|[^a-zäöüß])(nicht|kein|keine|keinen|keiner|keinem|weder|noch nicht)([^a-zäöüß]|$)/i, OFFEN = /(^|[^a-zäöüß])(soll|sollen|sollte|geplant|vorgesehen|voraussichtlich|Tagesordnung|beantragt|Entwurf)([^a-zäöüß]|$)/i;
    const lesen = s => { const gefunden = []; for (const satz of String(s).split(/[.;!?]+/)) for (const [r, wort] of STEMPEL) { const m = r.exec(satz); if (!m || gefunden.includes(wort) || OFFEN.test(satz)) continue;
        if (!NEIN.test(satz.slice(0, m.index).split(/[,:–]/).pop())) gefunden.push(wort); } return gefunden; };
    const stempel = n => { const l = (Array.isArray(n.erg) ? n.erg.filter(x => MARKEN[x]) : lesen(n.text)).filter((x, i, alle) => !(x === "beschlossen" && alle.some(y => y === "einstimmig" || y === "mehrheitlich"))).slice(0, 2);
      return l.length ? `<span class="g-stempelzeile">${l.map(x => `<i class="g-stempel ${MARKEN[x]}">${x}</i>`).join("")}</span>` : ""; };
    const zeile = (n, j, kl) => eintrag(n, kl).replace('class="g-eintrag', `style="--j:${j}" class="g-eintrag`).replace("</span><span class=\"g-pfeil\"", (n.datum < heute ? stempel(n) : "") + "</span><span class=\"g-pfeil\"");
    const leer = s => `<p class="g-leer">${s}</p>`;
    const links = kommt.length ? kommt.map((n, j) => zeile(n, j)).join("") : leer("In den nächsten 7 Tagen steht kein Thema für den Bereich an.") + (naechste ? zeile({ ...naechste, text: roh[naechste.id] ? "Bisher kein Thema für den Bereich vermerkt." : "Die Tagesordnung ist noch nicht ausgewertet." }, 1, "blass") : "");
    const rechts = war.length ? war.map((n, j) => zeile(n, j + 1)).join("") : leer("In der letzten Woche gab es kein Thema für den Bereich.");
    // Sind die beiden Seiten sehr ungleich lang, stehen sie untereinander und die längere läuft zweispaltig – so bleibt keine halbe Kachel leer
    const nl = Math.max(1, kommt.length), nr = Math.max(1, war.length), stapel = Math.max(nl, nr) >= 3 && Math.abs(nl - nr) >= 2;
    return `<div class="k rat" data-ein><div class="rat-kopf"><span class="rat-zeichen"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 4 16.5V20h40v-3.5L24 5Z"/><path d="M8 23h5.5v13H8zM17 23h5.5v13H17zM25.5 23H31v13h-5.5zM34.5 23H40v13h-5.5z"/><path d="M5 38.5h38V43H5z"/></svg></span><div><h3>Mainzer <i>Gremien</i></h3><p>Aus dem Ratsinformationssystem der Stadt · ${esc(b.reiter)}</p></div><a class="rat-info" href="https://bi.mainz.de/si0046.php" target="_blank" rel="noopener">Ratsinfo öffnen ↗</a></div>
      <div class="rat-spalten${stapel ? " gestapelt" : ""}"><section class="rat-kommt${stapel && nl > nr ? " lang" : ""}"><h4>Das <i>kommt</i><small>nächste 7 Tage</small></h4><div class="rat-liste">${links}</div></section>
      <section class="rat-war${stapel && nr > nl ? " lang" : ""}"><h4>Das <i>war</i><small>letzte Woche</small></h4><div class="rat-liste">${rechts}</div></section></div></div>`;
  }

  const AUDIO_BASIS = /^(localhost|127\.)/.test(location.hostname) ? "https://boniblatt-mainz.de/" : "";
  let hoerIndex = null, audio = null, hoerCtx = null, tempo = 1;
  const hoerDaten = fetch(AUDIO_BASIS + "daten/audio.json").then(r => r.json()).then(d => { hoerIndex = d.ausgaben || {}; }).catch(() => { hoerIndex = {}; });
  const uhr = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  function hoerenBinden(b, text) {
    if (audio) { audio.pause(); audio = null; }
    const k = raster.querySelector(".ohr"), knopf = k.querySelector(".h-knopf"), gang = k.querySelector(".gang"), spur = k.querySelector(".h-spur"), satz = k.querySelector(".h-satz");
    const tKnopf = k.querySelector(".h-tempo"), tZeig = () => { tKnopf.textContent = String(tempo).replace(".", ",") + "×"; tKnopf.classList.toggle("an", tempo !== 1); if (audio) audio.defaultPlaybackRate = audio.playbackRate = tempo; };
    tZeig(); tKnopf.addEventListener("click", () => { tempo = tempo === 1 ? 1.25 : tempo === 1.25 ? 1.5 : 1; tZeig(); });
    // Welcher Satz gerade gesprochen wird: am besten aus den Satzzeiten der Aufnahme (audio.json → marken, je Satz Beginn und Ende in
    // Sekunden, geschrieben von werkzeuge/vertonen.mjs). Fehlen sie (ältere Aufnahmen), wird aus der Textlänge geschätzt – mit etwas
    // Gewicht für die Pause am Satzende und für Zahlen, die länger gesprochen werden, als sie geschrieben sind.
    const saetze = text.split(/(?<=[.!?…])\s+/).filter(Boolean); let summe = 0; const grenzen = saetze.map(s => (summe += s.length + 7 + 3 * (s.match(/[0-9]/g) || []).length)); let gezeigt = -1, marken = null;
    const zeigen = w => esc(w.replace(/Quartiersmanage/g, "Quartiermanage"));
    const stand = () => { if (!audio || !audio.duration) return; const p = audio.currentTime / audio.duration;
      gang.style.strokeDashoffset = 100 - p * 100; spur.firstElementChild.style.width = p * 100 + "%"; spur.setAttribute("aria-valuenow", Math.round(p * 100));
      k.style.setProperty("--p", p.toFixed(4)); k.querySelector(".h-zeit").textContent = uhr(audio.currentTime);
      let nr = 0, anteil = 0;
      if (marken) { const jetzt = audio.currentTime; for (let i = 0; i < marken.length; i++) if (marken[i][0] <= jetzt + .08) nr = i; anteil = (jetzt - marken[nr][0]) / Math.max(.3, marken[nr][1] - marken[nr][0]); }
      else { nr = grenzen.findIndex(g => g / summe >= p); if (saetze[nr]) anteil = (p * summe - (nr ? grenzen[nr - 1] : 0)) / saetze[nr].length; }
      if (nr !== gezeigt && saetze[nr]) { gezeigt = nr; satz.classList.remove("neu"); void satz.offsetWidth; satz.innerHTML = saetze[nr].split(" ").map(w => "<span>" + zeigen(w) + "</span>").join(" "); satz.classList.add("neu"); }
      // Wörter leuchten nach und nach auf (innerhalb des Satzes nach der Textlänge verteilt)
      if (saetze[nr]) { const ges = saetze[nr].length; let z = 0;
        for (const w of satz.children) { const a = z / ges; z += w.textContent.length + 1; const kl = anteil >= z / ges ? "war" : anteil >= a ? "jetzt" : ""; if (w.className !== kl) w.className = kl; } } };
    // Pegel: die echten Frequenzen der Aufnahme (Web Audio); klappt das nicht, läuft eine ruhige Ersatzbewegung
    const strahlen = [...k.querySelectorAll(".h-strahlen i")], wellen = [...k.querySelectorAll(".h-wellen i")]; let analyser = null, bins = null, bild = 0, glatt = 0, versucht = false;
    const messen = () => { try { const AC = window.AudioContext || window.webkitAudioContext; hoerCtx = hoerCtx || new AC(); hoerCtx.resume(); const quelle = hoerCtx.createMediaElementSource(audio);
        analyser = hoerCtx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = .9; quelle.connect(analyser); analyser.connect(hoerCtx.destination); bins = new Uint8Array(analyser.frequencyBinCount); } catch (e) { analyser = null; } };
    const pegel = (i, ms) => analyser ? bins[2 + i % 28] / 255 : .35 + .3 * Math.sin(ms / 190 + i * 1.7) + .25 * Math.sin(ms / 83 + i * .6);
    const malen = ms => { let s = 0; wellen.forEach((el, i) => { const v = Math.max(0, pegel(Math.abs(i - 13), ms)); s += v; el.style.setProperty("--w", (.14 + v * .62).toFixed(3)); }); return s / wellen.length; };
    const lauf = ms => { if (!audio || audio.paused || !k.isConnected) { bild = 0; return; }
      if (analyser) analyser.getByteFrequencyData(bins);
      glatt += (malen(ms) - glatt) * .25; k.style.setProperty("--pegel", glatt.toFixed(3)); stand(); bild = requestAnimationFrame(lauf); };
    if (q.has("hoerbild")) { // Standbild der laufenden Wiedergabe (für Bilder)
      k.dataset.zustand = "spielt"; malen(900); k.style.setProperty("--pegel", ".5"); gang.style.strokeDashoffset = 63; spur.firstElementChild.style.width = "37%"; k.querySelector(".h-zeit").textContent = "0:41";
      satz.innerHTML = (saetze[2] || saetze[0] || "").split(" ").map((w, i) => `<span class="${i < 5 ? "war" : i === 5 ? "jetzt" : ""}">${esc(w)}</span>`).join(" "); return; }
    hoerDaten.then(() => {
      const info = (hoerIndex[E.ausgabe.datum] || {})[b.daten]; if (!info || !k.isConnected) { k.dataset.zustand = "fehlt"; return; }
      if (Array.isArray(info.marken) && info.marken.length === saetze.length) marken = info.marken;
      k.querySelector(".h-dauer").textContent = uhr(info.sekunden);
      const starten = () => { if (!audio) { audio = new Audio(); audio.crossOrigin = "anonymous"; audio.src = AUDIO_BASIS + info.datei; audio.defaultPlaybackRate = audio.playbackRate = tempo; k.dataset.zustand = "laedt";
          audio.addEventListener("timeupdate", stand); audio.addEventListener("playing", () => { audio.playbackRate = tempo; k.dataset.zustand = "spielt"; knopf.setAttribute("aria-label", "Pause"); if (!versucht) { versucht = true; messen(); } if (!bild) bild = requestAnimationFrame(lauf); });
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
  // Bildmotive vorab laden und entschlüsseln (je Bereich einmal), damit beim Wechsel nichts nachlädt
  const geladen = new Map(), motivLaden = name => { const u = "bilder/motive/" + (name.includes(".") ? name : name + ".webp"); if (!geladen.has(u)) { const b = new Image(); b.src = u; geladen.set(u, (b.decode ? b.decode() : Promise.resolve()).catch(() => {})); } return geladen.get(u); };
  const motiveBereit = b => Promise.all(b.motive.slice(0, 2).map(motivLaden));
  (window.requestIdleCallback || (f => setTimeout(f, 2500)))(() => BEREICHE.forEach(motiveBereit));
  let aktiv = "", laeuft = false;
  async function wechsel(id, sofort) {
    if (id === aktiv || laeuft) return;
    const b = bereich(id), nr = BEREICHE.indexOf(b);
    wurzel.querySelectorAll(".bb-reiter button").forEach(x => x.setAttribute("aria-pressed", x.dataset.r === b.id));
    pilleSetzen(true);
    const setzen = () => { history.replaceState(null, "", "#" + b.id); wurzel.dataset.r = b.id; wurzel.dataset.n = nr % 5; };
    if (!aktiv || q.has("still") || sofort) { setzen(); aktiv = b.id; zeichne(b.id); E.zeigen(raster); return; }
    laeuft = true;
    raster.querySelectorAll(".k").forEach((el, i) => { el.style.setProperty("--i", i); el.style.setProperty("--dx", zufall(-60, 60) + "vw"); el.style.setProperty("--dy", zufall(30, 90) + "vh"); el.style.setProperty("--dr", zufall(-70, 70) + "deg"); });
    raster.classList.add("raus"); setzen();
    await E.warte(SPIEL ? 760 : 640);
    raster.classList.remove("raus"); raster.classList.add("bereit"); aktiv = b.id; zeichne(b.id);
    raster.querySelectorAll(".k").forEach((el, i) => { el.classList.add("da"); el.style.setProperty("--i", i); el.style.setProperty("--dx", zufall(-30, 30) + "vw"); el.style.setProperty("--dr", zufall(-40, 40) + "deg"); });
    // Erst wenn der Browser die neuen Kacheln fertig gezeichnet hat (zwei Bilder später, Motive geladen), beginnt die Drehung:
    // So fällt die Rechenarbeit nicht mitten in die Bewegung – das ließ die erste Karte auf langsamen Rechnern hängen.
    await Promise.race([motiveBereit(b), E.warte(700)]);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    raster.classList.remove("bereit"); raster.classList.add("rein");
    await E.warte(1500); raster.classList.remove("rein"); laeuft = false;
  }
  // ---- Wetter: ein Tag antippen zeigt ihn groß ----
  raster.addEventListener("click", e => { const x = e.target.closest(".w-tag"); if (!x) return; const w = (window.BONIBLATT_WETTER7 || [])[+x.dataset.i]; if (!w) return;
    raster.querySelectorAll(".w-tag").forEach(y => y.classList.toggle("heute", y === x)); const g = raster.querySelector(".w-heute"); g.innerHTML = wetterGross(w, +x.dataset.i); g.classList.remove("neu"); void g.offsetWidth; g.classList.add("neu"); });

  // ---- Reiter: die farbige Pille wandert zum gewählten Bereich ----
  function pilleSetzen(wechsel) { const x = wurzel.querySelector('.bb-reiter button[aria-pressed="true"]'), pi = wurzel.querySelector(".r-pille"); if (!x || !pi) return;
    const l = x.offsetLeft, r = pi.parentNode.clientWidth - l - x.offsetWidth, nachRechts = l > (parseFloat(pi.style.left) || 0);
    pi.style.setProperty("--tl", nachRechts ? ".68s" : ".4s"); pi.style.setProperty("--tr", nachRechts ? ".4s" : ".68s");   // die vordere Kante läuft voraus, die hintere zieht nach
    pi.style.left = l + "px"; pi.style.right = r + "px"; pi.style.top = x.offsetTop + "px"; pi.style.height = x.offsetHeight + "px"; pi.style.opacity = 1;
    if (wechsel === true) { pi.classList.remove("zieht"); void pi.offsetWidth; pi.classList.add("zieht"); } }
  addEventListener("resize", () => pilleSetzen()); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => pilleSetzen());

  // ---- Ausgaben: kleine Karten neben dem Titel wie eine Hand Spielkarten – die gezeigte steht heraus; daneben Archiv und Suche ----
  const ausgabenZeigen = () => { const alle = E.daten.ausgaben, pos = alle.indexOf(E.ausgabe), aelter = pos >= 0 ? alle[pos + 1] : null, neuer = pos > 0 ? alle[pos - 1] : pos < 0 ? alle[0] : null;
    wurzel.querySelector(".bb-ausgaben").innerHTML = `<span class="au-nav"><button type="button" class="au-pfeil" data-d="${aelter ? aelter.datum : ""}" aria-label="Ältere Ausgabe" title="Ältere Ausgabe"${aelter ? "" : " disabled"}>←</button>
      <span class="au-jetzt"><b>${esc(E.datum({ weekday: "long", day: "numeric", month: "long" }))}</b></span>
      <button type="button" class="au-pfeil" data-d="${neuer ? neuer.datum : ""}" aria-label="Neuere Ausgabe" title="Neuere Ausgabe"${neuer ? "" : " disabled"}>→</button></span>
      <button type="button" class="au-archiv"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>Archiv &amp; Suche</button>
      <a class="au-archiv au-album" href="kalender.html"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>Fundstück-Kalender</a>`; };
  async function ausgabeWechseln(datum, eigene) {
    if (laeuft || datum === E.ausgabe.datum) return; laeuft = true;
    E.setze(datum, eigene);
    const u = new URL(location.href); if (E.ausgabe === E.daten.ausgaben[0]) u.searchParams.delete("ausgabe"); else u.searchParams.set("ausgabe", E.ausgabe.datum); history.replaceState(null, "", u);
    ausgabenZeigen();
    if (!q.has("still")) { raster.classList.add("blatt"); await E.warte(240); }
    zeichne(aktiv); raster.classList.remove("blatt"); raster.classList.add("sanft"); E.zeigen(raster);
    setTimeout(() => raster.querySelectorAll(".k").forEach(el => el.classList.add("da")), 40); setTimeout(() => raster.classList.remove("sanft"), 1100); laeuft = false;
  }
  // ---- Archiv und Suche: alle Ausgaben und eine Suche über alle Meldungen (docs/daten/archiv.json) ----
  let archiv = null;
  const STUFEN = { a: "aufmacher", w: "wichtig", k: "kurz" }, alsMeldung = e => Object.fromEntries(archiv.felder.map((f, i) => [f, e[i]]));
  const ausArchiv = datum => { if (E.daten.ausgaben.some(x => x.datum === datum)) return null; const res = {};
    archiv.eintraege.map(alsMeldung).filter(m => m.ausgabe === datum).forEach(m => (res[m.ressort] = res[m.ressort] || []).push({ ...m, stufe: STUFEN[m.stufe] || m.stufe }));
    return { datum, ressorts: res, hoerfassungen: {} }; };
  function archivSuchen() { const dlg = wurzel.querySelector(".bb-archiv"); if (!dlg || !archiv) return;
    const woerter = dlg.querySelector(".ar-feld").value.toLowerCase().split(" ").filter(Boolean), name = id => (BEREICHE.find(b => b.daten === id) || {}).reiter || id;
    dlg.querySelector(".ar-tage").innerHTML = "<b>Alle Ausgaben</b>" + archiv.ausgaben.map(x => `<button type="button" data-d="${x.datum}"${x.datum === E.ausgabe.datum ? ' aria-current="true"' : ""}>${esc(new Date(x.datum + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }))}</button>`).join("");
    const tr = dlg.querySelector(".ar-treffer");
    if (!woerter.length) { tr.innerHTML = `<p class="ar-leer">${archiv.eintraege.length} Meldungen aus ${archiv.ausgaben.length} Ausgaben. Ein Wort eintippen – oder oben eine Ausgabe wählen.</p>`; return; }
    const fund = archiv.eintraege.map(alsMeldung).filter(m => { const text = [m.thema, m.titel, m.kurz, E.quelle(m), name(m.ressort)].join(" ").toLowerCase(); return woerter.every(w => text.includes(w)); });
    tr.innerHTML = `<p class="ar-leer">${fund.length ? fund.length + " Treffer" : "Nichts gefunden."}</p>` + fund.slice(0, 60).map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener"><b>${esc(new Date(m.ausgabe + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" }))} · ${esc(name(m.ressort))}${m.thema ? " · " + esc(m.thema) : ""}</b><span>${esc(m.titel)}</span><small>${esc(E.quelle(m))}</small></a>`).join(""); }
  async function archivOeffnen() {
    let dlg = wurzel.querySelector(".bb-archiv");
    if (!dlg) { wurzel.insertAdjacentHTML("beforeend", `<dialog class="bb-archiv" aria-label="Archiv und Suche"><form method="dialog"><button class="ar-zu" aria-label="Schließen">×</button></form>
        <h3>Archiv <i>&amp; Suche</i></h3><input type="search" class="ar-feld" placeholder="Suchen: Thema, Titel, Quelle …" aria-label="Suchbegriff"><div class="ar-tage"></div><div class="ar-treffer"></div></dialog>`);
      dlg = wurzel.querySelector(".bb-archiv"); dlg.querySelector(".ar-feld").addEventListener("input", archivSuchen);
      dlg.addEventListener("click", e => { if (e.target === dlg) return dlg.close(); const x = e.target.closest(".ar-tage [data-d]"); if (x) { dlg.close(); ausgabeWechseln(x.dataset.d, ausArchiv(x.dataset.d)); } }); }
    dlg.showModal();
    if (!archiv) archiv = await fetch("daten/archiv.json").then(r => r.json()).catch(() => ({ felder: [], ausgaben: [], eintraege: [] }));
    archivSuchen();
  }
  wurzel.querySelector(".bb-ausgaben").addEventListener("click", e => { const x = e.target.closest(".au-pfeil"); if (x) { if (x.dataset.d) ausgabeWechseln(x.dataset.d); return; } if (e.target.closest("button.au-archiv")) archivOeffnen(); });
  addEventListener("pageshow", e => { if (e.persisted) document.querySelectorAll("dialog[open]").forEach(d => d.close()); });   // zurück aus dem Browser-Verlauf: kein Fenster offen lassen
  ausgabenZeigen();
  // Teilen: ein kleines Menü am Knopf – Link kopieren, per Mail weiterleiten, und wo es das gibt, das Teilen-Fenster des Geräts
  const tm = document.createElement("div"); tm.className = "teil-menue"; tm.hidden = true; tm.setAttribute("role", "menu"); wurzel.appendChild(tm); let tmVon = null;
  const tmZu = () => { tm.hidden = true; tmVon = null; };
  const tmAuf = el => { if (tmVon === el) return tmZu(); tmVon = el; const titel = el.dataset.t, url = el.dataset.u, mail = "mailto:?subject=" + encodeURIComponent(titel) + "&body=" + encodeURIComponent(titel + "\n" + url + "\n\nGefunden im Mainzer Boniblatt – https://boniblatt-mainz.de/");
    tm.innerHTML = `<button type="button" data-a="kopie" role="menuitem">Link kopieren</button><a href="${esc(mail)}" role="menuitem">Per Mail weiterleiten</a>${navigator.share ? '<button type="button" data-a="mehr" role="menuitem">Weitere Wege …</button>' : ""}`;
    tm.hidden = false; const r = el.getBoundingClientRect(), b = tm.offsetWidth, h = tm.offsetHeight; tm.style.left = Math.max(8, Math.min(innerWidth - b - 8, r.right - b)) + "px"; tm.style.top = (r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8) + "px"; };
  tm.addEventListener("click", async e => { const x = e.target.closest("[data-a]"); if (!x || !tmVon) { if (e.target.closest("a")) tmZu(); return; } const titel = tmVon.dataset.t, url = tmVon.dataset.u;
    if (x.dataset.a === "kopie") { try { await navigator.clipboard.writeText(url); x.textContent = "Kopiert ✓"; } catch (f) { x.textContent = "Kopieren ging nicht"; } setTimeout(tmZu, 900); }
    else { tmZu(); navigator.share({ title: titel, text: titel, url }).catch(() => {}); } });
  wurzel.addEventListener("click", e => { const d = e.target.closest(".daumen .d"); if (d) { e.preventDefault(); e.stopPropagation(); return stimme(d); }
    const x = e.target.closest(".teil"); if (x) { e.preventDefault(); e.stopPropagation(); return tmAuf(x); } if (!e.target.closest(".teil-menue")) tmZu();
    if (e.target.closest(".leer-archiv")) return archivOeffnen();
    const m = e.target.closest(".liste-mehr"); if (m) { m.closest(".liste").classList.add("offen"); m.remove(); } });
  wurzel.addEventListener("keydown", e => { const d = e.target.closest && e.target.closest(".daumen .d"); if (d && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); return stimme(d); }
    const x = e.target.closest && e.target.closest(".teil"); if (x && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tmAuf(x); } if (e.key === "Escape") tmZu(); });
  addEventListener("scroll", () => { if (!tm.hidden) tmZu(); }, { passive: true });
  // Altpapier-Wurf unter der Fußleiste – nur am PC; das Skript lädt erst, wenn der Fuß in Sicht kommt
  if (matchMedia("(min-width:1000px) and (hover:hover) and (pointer:fine)").matches) { const sp = document.createElement("section"); sp.id = "spiel"; sp.className = "bb-spiel"; sp.setAttribute("aria-label", "Spiel: Altpapier-Wurf");
    // Das Spiel liegt versteckt weiter unten: Von der Fußzeile führt eine dünne Linie hinab, unterwegs meldet sich jemand.
    const weg = document.createElement("div"); weg.className = "sp-weg"; weg.setAttribute("aria-hidden", "true"); weg.innerHTML = '<i></i><span>pst …</span><i></i><span>Hey, ist dir ein bisschen langweilig?</span><i></i>';
    // Schwelle davor, bewusst unauffällig: Ein gutes Stück unter der Fußzeile bleibt ein kleines Schloss stehen, während man weiterscrollt.
    // Sein Ring füllt sich langsam (über gut eine Bildschirmhöhe), die kurze Naht darüber gibt ein wenig nach; ist der Ring voll, geht der Bügel
    // auf – hier ist etwas versteckt. Kein Eingriff ins Scrollen: Die Schwelle ist ein Stück Extraweg. Alle Werte laufen weich nach
    // (kein Springen beim Mausrad), und nichts berührt die Fußzeile.
    const schwelle = document.createElement("div"); schwelle.className = "sp-schwelle"; schwelle.setAttribute("aria-hidden", "true");
    schwelle.innerHTML = '<div class="sp-halt"><svg class="sp-naht" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 6Q100 6 200 6"/></svg>'
      + '<div class="sp-schloss"><svg viewBox="0 0 40 40"><circle class="spur" cx="20" cy="20" r="17"/><circle class="gang" cx="20" cy="20" r="17" pathLength="100"/><path class="buegel" d="M16 19v-3a4 4 0 0 1 8 0v3"/><rect class="kasten" x="14" y="19" width="12" height="9" rx="2"/></svg><span>weiter scrollen</span></div></div>';
    wurzel.querySelector(".bb-fuss").after(schwelle, weg, sp);
    { const halt = schwelle.firstChild, naht = schwelle.querySelector(".sp-naht path"), gang = schwelle.querySelector(".gang"), schloss = schwelle.querySelector(".sp-schloss"), wort = schloss.querySelector("span");
      let soll = 0, ist = 0, laeuft2 = 0, offen = false, nah = false;
      // Fortschritt 0…1 über die Strecke, auf der das Schloss steht; das erste Fünftel ist Anlauf (das Schloss erscheint nur)
      const messen = () => { const r = schwelle.getBoundingClientRect(), h = innerHeight, vor = parseFloat(getComputedStyle(schwelle).paddingTop) || 0, strecke = r.height - vor - halt.offsetHeight;
        soll = Math.min(1, Math.max(0, (h * .5 - (r.top + vor)) / Math.max(1, strecke))); };
      const malen = () => { const f = Math.min(1, Math.max(0, (ist - .2) / .8)), e = f * f * (3 - 2 * f), tief = e * 22;
        naht.setAttribute("d", "M0 6Q100 " + (6 + tief * 2).toFixed(2) + " 200 6"); schloss.style.translate = "0 " + tief.toFixed(2) + "px"; schloss.style.opacity = Math.min(1, ist / .16).toFixed(3); gang.style.strokeDashoffset = (100 - f * 100).toFixed(2); };
      const schritt = () => { laeuft2 = 0; if (offen) return; messen(); ist += (soll - ist) * .09; if (Math.abs(soll - ist) < .0015) ist = soll; malen();
        if (ist >= 1) { offen = true; schwelle.classList.add("offen"); wort.textContent = "entdeckt"; return; }
        if (ist !== soll && nah) laeuft2 = requestAnimationFrame(schritt); };
      const los = () => { if (!laeuft2 && !offen && nah) laeuft2 = requestAnimationFrame(schritt); };
      new IntersectionObserver(es => { nah = es[0].isIntersecting; los(); }, { rootMargin: "10% 0px" }).observe(schwelle);
      addEventListener("scroll", los, { passive: true }); addEventListener("resize", los); }
    const zeig = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("da"); zeig.unobserve(e.target); } }), { rootMargin: "0px 0px -3% 0px" }); [...weg.children].forEach(x => zeig.observe(x));
    new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect(); const s = document.createElement("script"); s.src = "blatt/spiel.js?v=21"; document.body.appendChild(s); }, { rootMargin: "400px" }).observe(sp); }
  wurzel.querySelector(".bb-reiter").addEventListener("click", e => { const x = e.target.closest("button"); if (x) wechsel(x.dataset.r); });
  let h = location.hash.slice(1);
  // Wahl im Startbild (Knöpfe unter dem Titel): sofort auf den Bereich einstellen – die Kacheln liegen dann noch unter dem Bildrand
  document.addEventListener("boni-bereich", e => { if (!BEREICHE.some(b => b.id === e.detail)) return; h = e.detail; if (aktiv) wechsel(e.detail, true); });
  // Solange das Startbild seinen Auftakt spielt, wartet der Aufbau der Kacheln: Beides zugleich ließ die Bewegung auf langsamen Geräten stottern.
  const intro = document.getElementById("intro");
  if (intro && !intro.hidden && scrollY < 40) await Promise.race([new Promise(r => setTimeout(r, 3600)), ...["scroll", "pointerdown", "keydown", "wheel", "touchstart"].map(n => new Promise(r => addEventListener(n, r, { once: true, passive: true })))]);
  if (BEREICHE.some(b => b.id === window.BONI_START)) h = window.BONI_START;
  wechsel(BEREICHE.some(b => b.id === h) ? h : BEREICHE[0].id);
})();
