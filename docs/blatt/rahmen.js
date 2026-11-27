/* Rahmen für Ausgabe, Podcast und Werkstatt – wird im <head> geladen.
   1. Seitenwechsel: Die drei Seiten liegen nebeneinander (Podcast ← Ausgabe → Werkstatt). Ein Klick auf eine der anderen
      schiebt deren Bild von der passenden Seite über das Fenster (Wellenkante wie überall auf der Seite); auf der neuen Seite
      zieht das Blatt weiter bzw. löst sich auf, und der Inhalt kommt ruhig von derselben Seite herein.
   2. Turmfenster im Logo: Etwa die Hälfte der Fenster des Boniturms leuchtet, der Rest ist dunkelgrau. Alle paar Sekunden
      geht irgendwo ein Licht an oder aus – im Startbild genauso wie im kleinen Logo der Kopfzeile (gleicher Stand).
   Ohne Bewegung (prefers-reduced-motion) gibt es keinen Seitenwechsel-Effekt; die Fenster stehen dann still. */
(() => {
  const d = document, wurzel = d.documentElement;
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const monat = new Date().getMonth() + 1;
  const zeit = monat >= 3 && monat <= 5 ? "fruehling" : monat >= 6 && monat <= 8 ? "sommer" : monat >= 9 && monat <= 11 ? "herbst" : "winter";
  // Farben wie in der Werkstatt (ueber.html) und in den Kacheln (bb.css)
  const FARBEN = { herbst: ["#a8472b", "#dba63f", "#5f6f43", "#6a3e58"], winter: ["#2e4a66", "#c0533e", "#4d6b5c", "#b9a0b4"], fruehling: ["#4f8a5b", "#e98aa8", "#5aa3c9", "#7a4f8f"], sommer: ["#2456c9", "#f25c3a", "#f0b320", "#2fa37e"] }[zeit];

  const stil = d.createElement("style");
  stil.textContent = `
.ug{position:fixed;inset:0;z-index:2147483000;overflow:hidden;contain:strict;--ug-grund:#1b1917}
.ug-blatt{position:absolute;top:0;bottom:0;left:0;width:calc(100vw + 220px);display:flex;will-change:transform,opacity}
.ug-kanten{position:relative;flex:none;width:110px;overflow:hidden}
.ug-kanten svg{position:absolute;left:0;top:0;width:100%;height:200%;fill:var(--ug-grund);animation:ug-kante 11s linear infinite}
.ug-kanten svg+svg{left:-22px;opacity:.5;animation-duration:17s;animation-direction:reverse}
.ug-kanten.rechts{transform:scaleX(-1)}
.ug-flaeche{position:relative;flex:1;margin:0 -1px;background:var(--ug-grund);overflow:hidden}
.ug-k{position:absolute;width:74vmax;aspect-ratio:1;border-radius:50%;animation:ug-drift 9s ease-in-out infinite alternate}
.ug-k:nth-child(1){left:-22vmax;top:-28vmax;background:radial-gradient(closest-side,var(--k1),transparent)}
.ug-k:nth-child(2){right:-26vmax;top:-6vmax;background:radial-gradient(closest-side,var(--k4),transparent);animation-delay:-3s}
.ug-k:nth-child(3){left:14vmax;bottom:-42vmax;background:radial-gradient(closest-side,var(--k2),transparent);animation-delay:-5s}
.ug-k:nth-child(4){right:-2vmax;bottom:-40vmax;width:52vmax;background:radial-gradient(closest-side,var(--k3),transparent);animation-delay:-1.5s}
.ug-podcast{--ug-grund:#1f1c18}.ug-podcast .ug-k{opacity:.5}
.ug-ton{position:absolute;left:8%;right:8%;top:50%;height:min(30vh,220px);display:flex;align-items:center;gap:clamp(2px,.45vw,6px);translate:0 -50%}
.ug-ton i{flex:1;height:calc(var(--h) * 100%);min-height:4px;border-radius:99px;background:#fbf5e9;opacity:.9;animation:ug-takt 1.15s ease-in-out calc(var(--i) * -.09s) infinite alternate}
.ug-ton i:nth-child(7n+3){background:var(--k2)}
.ug-ausgabe{--ug-grund:#f6f4ef}
.ug-ausgabe .ug-flaeche::before{content:"";position:absolute;left:50%;top:62%;width:min(64vmin,520px);aspect-ratio:2;translate:-50% -100%;border-radius:999px 999px 0 0;background:#cf073d;animation:ug-sonne 1.5s cubic-bezier(.2,.7,.2,1) both}
.ug-ausgabe .ug-flaeche::after{content:"";position:absolute;left:50%;top:62%;bottom:0;width:min(150vmin,1300px);translate:-50% 0;background:linear-gradient(#dfe5e7,#f6f4ef 62%);-webkit-mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}
@keyframes ug-kante{to{transform:translateY(-50%)}}
@keyframes ug-drift{to{transform:translate(5vmax,-4vmax) scale(1.14)}}
@keyframes ug-takt{from{transform:scaleY(.45)}to{transform:scaleY(1)}}
@keyframes ug-sonne{from{translate:-50% -72%}}
.ug-kommt{animation:ug-kommt 1.15s cubic-bezier(.16,.84,.3,1) both}
@keyframes ug-kommt{from{opacity:0;translate:var(--ug-x,60px) 0}}
.logo-rahmen{position:relative;display:inline-block;flex:none;line-height:0;vertical-align:baseline}.logo-rahmen>img{display:block}
.logo-licht{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.logo-licht rect{fill:#57524d;opacity:0;transition:opacity 2.6s ease}
.logo-licht rect.aus{opacity:1}.logo-licht.sofort rect{transition:none}`;
  d.head.appendChild(stil);

  // ---------- 1. Seitenwechsel ----------
  const ORT = { podcast: -1, ausgabe: 0, werkstatt: 1 }, MERK = "boniblatt.wechsel";
  const seiteVon = pfad => /\/ueber\.html$/.test(pfad) ? "werkstatt" : /\/podcast\.html$/.test(pfad) ? "podcast" : /\/(index\.html)?$/.test(pfad) ? "ausgabe" : "";
  const hier = seiteVon(location.pathname);
  const KANTE = '<svg viewBox="0 0 60 1200" preserveAspectRatio="none"><path d="M60 0H30C6 100 6 200 30 300S54 500 30 600S6 800 30 900S54 1100 30 1200H60Z"/></svg>';
  const inhalt = ziel => ziel === "ausgabe" ? "" : "<i class=\"ug-k\"></i>".repeat(4) + (ziel === "podcast"
    ? `<div class="ug-ton">${Array.from({ length: innerWidth < 700 ? 34 : 64 }, (_, i) => `<i style="--i:${i};--h:${(.16 + .84 * Math.abs(Math.sin(i * .37) * Math.sin(i * .13 + 1.2))).toFixed(2)}"></i>`).join("")}</div>` : "");
  function blatt(ziel, von) {
    const u = d.createElement("div"); u.className = "ug ug-" + ziel; u.dataset.von = von; u.setAttribute("aria-hidden", "true");
    FARBEN.forEach((f, i) => u.style.setProperty("--k" + (i + 1), f));
    u.innerHTML = `<div class="ug-blatt"><div class="ug-kanten">${KANTE}${KANTE}</div><div class="ug-flaeche">${inhalt(ziel)}</div><div class="ug-kanten rechts">${KANTE}${KANTE}</div></div>`;
    return u;
  }
  // Lage des Blatts: draußen auf der Seite, von der es kommt · deckend · draußen auf der anderen Seite
  const AUSSEN = { rechts: "translateX(100vw)", links: "translateX(calc(-100vw - 220px))" }, DECKT = "translateX(-110px)";
  let laeuft = false;
  function gehe(adresse, ziel) {
    const von = ORT[ziel] > ORT[hier] ? "rechts" : "links", u = blatt(ziel, von);
    laeuft = true; wurzel.appendChild(u);
    try { sessionStorage.setItem(MERK, JSON.stringify({ ziel, von, t: Date.now() })); } catch (e) { /* ohne Speicher kommt die neue Seite ohne Auflösung */ }
    const a = u.firstChild.animate([{ transform: AUSSEN[von] }, { transform: DECKT }], { duration: innerWidth < 700 ? 820 : 1050, easing: "cubic-bezier(.62,0,.2,1)", fill: "forwards" });
    const los = () => { location.href = adresse; };
    a.finished.then(los, los);
    setTimeout(() => { u.remove(); laeuft = false; }, 5000);        // klappt das Laden nicht, bleibt nichts verdeckt
  }
  if (!ruhig && hier) {
    d.addEventListener("click", e => {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const l = e.target.closest && e.target.closest("a[href]"); if (!l || l.target === "_blank" || l.hasAttribute("download")) return;
      let u; try { u = new URL(l.href, location.href); } catch (f) { return; }
      if (u.origin !== location.origin) return;
      const ziel = seiteVon(u.pathname); if (!ziel || ziel === hier) return;
      e.preventDefault(); if (!laeuft) gehe(u.href, ziel);
    });
    addEventListener("pageshow", e => { if (e.persisted) { d.querySelectorAll(".ug").forEach(x => x.remove()); laeuft = false; } });   // zurück über den Verlauf: nichts bleibt verdeckt
    // Ankunft: Das Blatt deckt die neue Seite vom ersten Bild an. Ist sie da, zieht es weiter (oder löst sich auf, wenn dahinter
    // dasselbe Bild steht wie in der Werkstatt), und der Inhalt kommt von derselben Seite herein.
    let merk = null; try { merk = JSON.parse(sessionStorage.getItem(MERK) || "null"); sessionStorage.removeItem(MERK); } catch (e) { /* kein Speicher */ }
    if (merk && merk.ziel === hier && Date.now() - merk.t < 6000 && AUSSEN[merk.von]) {
      const u = blatt(hier, merk.von), b = u.firstChild; b.style.transform = DECKT; wurzel.appendChild(u);
      const bereit = Promise.race([new Promise(r => setTimeout(r, 1400)), Promise.all([new Promise(r => d.readyState !== "loading" ? r() : d.addEventListener("DOMContentLoaded", r, { once: true })), d.fonts ? d.fonts.ready : 0])]);
      bereit.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        const rein = d.querySelector(hier === "werkstatt" ? "#held .innen" : hier === "podcast" ? "#pc .bb-innen" : "#e-nix");
        if (rein) { rein.style.setProperty("--ug-x", merk.von === "rechts" ? "70px" : "-70px"); rein.classList.add("ug-kommt"); rein.addEventListener("animationend", ev => { if (ev.target === rein) rein.classList.remove("ug-kommt"); }); }
        const a = hier === "werkstatt"
          ? b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: "ease", fill: "forwards" })
          : b.animate([{ transform: DECKT }, { transform: AUSSEN[merk.von === "rechts" ? "links" : "rechts"] }], { duration: innerWidth < 700 ? 820 : 1050, easing: "cubic-bezier(.5,0,.15,1)", fill: "forwards" });
        const weg = () => u.remove(); a.finished.then(weg, weg); setTimeout(weg, 2500);
      })));
    }
  }

  // ---------- 2. Turmfenster ----------
  const REIHEN = 11, N = REIHEN * 3, an = Array.from({ length: N }, () => Math.random() < .5), maler = [];
  const nummer = (x, y) => Math.round((y - 69) / 63.4) * 3 + Math.round((x - 801) / 46);       // Lage im Logo (1250er-Fläche) → Fenster 0…32
  const melden = fn => { maler.push(fn); an.forEach((z, i) => fn(i, z, true)); };
  function kopfLogo(bild) {
    let r = bild.parentNode; if (!r.classList.contains("logo-rahmen")) { r = d.createElement("span"); r.className = "logo-rahmen"; bild.replaceWith(r); r.appendChild(bild); }
    if (r.querySelector(".logo-licht")) return;
    r.insertAdjacentHTML("beforeend", `<svg class="logo-licht sofort" viewBox="0 0 128 128" aria-hidden="true"><g transform="translate(1.662 -1.801) scale(.100375)">${Array.from({ length: N }, (_, i) => `<rect x="${800.2 + i % 3 * 46}" y="${(68.2 + Math.floor(i / 3) * 63.4).toFixed(1)}" width="35.6" height="39.6"/>`).join("")}</g></svg>`);
    const licht = r.lastChild, scheiben = [...licht.querySelectorAll("rect")];
    melden((i, z) => scheiben[i].classList.toggle("aus", !z));
    requestAnimationFrame(() => requestAnimationFrame(() => licht.classList.remove("sofort")));
  }
  function start() {
    d.querySelectorAll('img[src$="zeichen.svg"]').forEach(kopfLogo);
    // Startbild: dieselben Fenster als einzelne Pfade (Klassen in werkzeuge/intro-einbauen.mjs)
    const pfade = {}; d.querySelectorAll("#intro .i-l.i-fenster path").forEach(p => { const m = /M([0-9.]+) ([0-9.]+)h34/.exec(p.getAttribute("d") || ""); if (m) pfade[nummer(+m[1], +m[2])] = p; });
    if (Object.keys(pfade).length) melden((i, z, sofort) => { const p = pfade[i]; if (!p || !p.isConnected) return; p.classList.remove("aus", "an", "dunkel"); if (sofort) { if (!z) p.classList.add("aus"); } else p.classList.add(z ? "an" : "dunkel"); });
    if (ruhig || !maler.length) return;
    const tick = () => {
      if (!d.hidden) { const hell = an.filter(Boolean).length, wahl = an.map((_, i) => i).filter(i => hell > N / 2 + 2 ? an[i] : hell < N / 2 - 2 ? !an[i] : true), i = wahl[Math.floor(Math.random() * wahl.length)];
        an[i] = !an[i]; maler.forEach(f => f(i, an[i], false)); }
      setTimeout(tick, 1500 + Math.random() * 2600);
    };
    setTimeout(tick, 5200);       // erst, wenn das Startbild seinen Auftakt gespielt hat
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start); else start();
})();
