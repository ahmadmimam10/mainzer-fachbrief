/* Rahmen für Ausgabe, Podcast und Werkstatt – wird im <head> geladen.
   1. Seitenwechsel, bewusst dezent: Zum Podcast und zurück zur Ausgabe blendet die Seite kurz ins Papier aus und die neue wieder ein.
      Zur Werkstatt breitet sich vom angeklickten Knopf ihre dunkle Fläche mit den weichen Farbflecken aus (wie Tinte auf Papier) –
      dasselbe Bild, mit dem die Werkstatt beginnt; dort löst sich die Fläche auf und der Titel steigt herein.
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
.ug{position:fixed;inset:0;z-index:2147483000;overflow:hidden;contain:strict;background:var(--ug-grund,#f6f4ef);will-change:opacity,clip-path}
.ug-tinte{--ug-grund:#1b1917}
.ug-k{position:absolute;width:54vmax;aspect-ratio:1;border-radius:50%;opacity:0;animation:ug-fleck 1s ease .2s forwards}
.ug-da .ug-k{opacity:.95;animation:none}
.ug-k:nth-child(1){left:-14vmax;top:-18vmax;background:radial-gradient(closest-side,var(--k1) 22%,transparent)}
.ug-k:nth-child(2){right:-18vmax;top:4vmax;background:radial-gradient(closest-side,var(--k4) 22%,transparent)}
.ug-k:nth-child(3){left:22vmax;bottom:-30vmax;background:radial-gradient(closest-side,var(--k2) 22%,transparent)}
.ug-k:nth-child(4){right:6vmax;bottom:-26vmax;width:36vmax;background:radial-gradient(closest-side,var(--k3) 22%,transparent)}
@keyframes ug-fleck{to{opacity:.95}}
.ug-kommt{animation:ug-kommt .95s cubic-bezier(.16,.84,.3,1) both}
@keyframes ug-kommt{from{opacity:0;translate:0 14px}}
.logo-rahmen{position:relative;display:inline-block;flex:none;line-height:0;vertical-align:baseline}.logo-rahmen>img{display:block}
.logo-licht{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.logo-licht rect{fill:#57524d;opacity:0;transition:opacity 2.6s ease}
.logo-licht rect.aus{opacity:1}.logo-licht.sofort rect{transition:none}`;
  d.head.appendChild(stil);

  // ---------- 1. Seitenwechsel ----------
  const MERK = "boniblatt.wechsel";
  const seiteVon = pfad => /\/ueber\.html$/.test(pfad) ? "werkstatt" : /\/podcast\.html$/.test(pfad) ? "podcast" : /\/(index\.html)?$/.test(pfad) ? "ausgabe" : "";
  const hier = seiteVon(location.pathname);
  const papier = () => wurzel.dataset.thema === "dunkel" ? "#141312" : "#f6f4ef";
  function flaeche(ziel, da) {
    const u = d.createElement("div"); u.className = "ug" + (ziel === "werkstatt" ? " ug-tinte" : "") + (da ? " ug-da" : ""); u.setAttribute("aria-hidden", "true");
    if (ziel === "werkstatt") { FARBEN.forEach((f, i) => u.style.setProperty("--k" + (i + 1), f)); u.innerHTML = "<i class=\"ug-k\"></i>".repeat(4); }
    else u.style.setProperty("--ug-grund", papier());
    return u;
  }
  let laeuft = false;
  function gehe(adresse, ziel, x, y) {
    const u = flaeche(ziel, false); laeuft = true; wurzel.appendChild(u);
    try { sessionStorage.setItem(MERK, JSON.stringify({ ziel, t: Date.now() })); } catch (e) { /* ohne Speicher kommt die neue Seite ohne Auflösung */ }
    // Werkstatt: Die dunkle Fläche wächst als Kreis vom Knopf aus bis über die fernste Ecke. Sonst: kurze Blende ins Papier.
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 24;
    const a = ziel === "werkstatt"
      ? u.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }], { duration: 900, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" })
      : u.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out", fill: "forwards" });
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
      e.preventDefault(); if (laeuft) return;
      const k = l.getBoundingClientRect();
      gehe(u.href, ziel, e.clientX || k.left + k.width / 2, e.clientY || k.top + k.height / 2);
    });
    addEventListener("pageshow", e => { if (e.persisted) { d.querySelectorAll(".ug").forEach(x => x.remove()); laeuft = false; } });   // zurück über den Verlauf: nichts bleibt verdeckt
    // Ankunft: Die Fläche deckt die neue Seite vom ersten Bild an und löst sich auf, sobald sie da ist; der Inhalt steigt ein kleines Stück herein.
    let merk = null; try { merk = JSON.parse(sessionStorage.getItem(MERK) || "null"); sessionStorage.removeItem(MERK); } catch (e) { /* kein Speicher */ }
    if (merk && merk.ziel === hier && Date.now() - merk.t < 6000) {
      const u = flaeche(hier, true); wurzel.appendChild(u);
      const bereit = Promise.race([new Promise(r => setTimeout(r, 1400)), Promise.all([new Promise(r => d.readyState !== "loading" ? r() : d.addEventListener("DOMContentLoaded", r, { once: true })), d.fonts ? d.fonts.ready : 0])]);
      bereit.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        const rein = d.querySelector(hier === "werkstatt" ? "#held .innen" : hier === "podcast" ? "#pc .bb-innen" : "#e-nix");
        if (rein) { rein.classList.add("ug-kommt"); rein.addEventListener("animationend", ev => { if (ev.target === rein) rein.classList.remove("ug-kommt"); }); }
        const a = u.animate([{ opacity: 1 }, { opacity: 0 }], { duration: hier === "werkstatt" ? 850 : 420, easing: "ease", fill: "forwards" });
        const weg = () => u.remove(); a.finished.then(weg, weg); setTimeout(weg, 2000);
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
