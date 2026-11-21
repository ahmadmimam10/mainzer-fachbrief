/* Entwurf C „Morgenglas“ */
(async () => {
  const { RESSORTS, esc, gemischt } = E, wurzel = document.getElementById("e");
  await E.laden();
  const mappe = (r, i) => { const t = E.teile(r.id), quellen = new Set(t.alle.map(m => m.quelle)).size;
    return `<button type="button" class="c-mappe" data-r="${r.id}" aria-pressed="false" style="--nr:${i};--pos:${i}"><span class="c-lasche">0${i + 1} · ${esc(r.kurz)}</span>
      <span class="c-blatt"><span class="c-stempel">Heute neu</span>
        <span class="c-tabelle"><span>Ressort:</span><span>${esc(r.lang)}</span><span>Meldungen:</span><span>${t.alle.length}, davon ${t.wichtig.length} wichtig</span><span>Aufmacher:</span><span>${esc(t.auf ? t.auf.thema : "–")}</span><span>Quellen:</span><span>${quellen}</span></span>
        <strong>${esc(r.zwei[0])}<br>${esc(r.zwei[1])}</strong></span></button>`; };
  wurzel.innerHTML = `<div class="c-licht" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="c-innen">
    <p class="c-oben"><b>Guten Morgen, Mainz.</b><span>${esc(E.datum({ weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }))} · ${E.gesamt()} Meldungen</span></p>
    <nav class="c-mappen" aria-label="Ressorts">${RESSORTS.map(mappe).join("")}</nav>
    <section class="c-raster" id="kacheln"></section></div>`;
  const raster = wurzel.querySelector("#kacheln"), mappen = [...wurzel.querySelectorAll(".c-mappe")];
  const zeile = (links, rechts) => `<span class="zeile"><span>${esc(links)}</span><span>${esc(rechts)}</span></span>`;
  const wellen = Array.from({ length: 22 }, (_, i) => `<i style="--w:${(.25 + .75 * Math.abs(Math.sin(i * 1.7))).toFixed(2)}"></i>`).join("");

  function zeichne(id) {
    const t = E.teile(id), r = RESSORTS.find(x => x.id === id), k = [];
    if (t.auf) k.push(`<a class="k auf" data-ein href="${esc(t.auf.url)}">${zeile("Aufmacher / " + t.auf.thema, E.quelle(t.auf))}<h2>${gemischt(t.auf.titel, 2)}</h2><p>${esc(t.auf.kurz || "")}</p><span class="unten"><span class="pille">Weiterlesen →</span><span>${esc(E.datum({ day: "2-digit", month: "2-digit" }))}</span></span></a>`);
    k.push(`<div class="k datum" data-ein><i class="sonne"></i>${zeile(E.datum({ weekday: "long" }), "Ausgabe")}<b>${esc(E.datum({ day: "numeric" }))}. ${esc(E.datum({ month: "short" }).replace(".", ""))}<span>${E.tag().getFullYear()}</span></b></div>`);
    k.push(`<div class="k dunkel" data-ein>${zeile("Zum Hören", "3 Min")}<h3>${esc(r.kurz)} zum Anhören</h3><span class="wellen" aria-hidden="true">${wellen}</span><span class="unten"><span class="pille">▶ Abspielen</span><span>Vertont</span></span></div>`);
    t.wichtig.forEach(m => k.push(`<a class="k wichtig" data-ein href="${esc(m.url)}">${zeile("Wichtig / " + m.thema, "")}<h2>${esc(m.titel)}</h2><p>${esc(m.kurz || "")}</p><span class="unten"><span>${esc(E.quelle(m))}</span><span>→</span></span></a>`));
    if (t.kurz.length) k.push(`<div class="k ueber" data-ein><h3>Kurz notiert</h3><span>${t.kurz.length} Meldungen</span></div>`);
    t.kurz.forEach(m => k.push(`<a class="k kurz" data-ein href="${esc(m.url)}"><div>${zeile(m.thema, E.quelle(m))}<h2>${esc(m.titel)}</h2></div><span class="kreis">→</span></a>`));
    raster.innerHTML = k.join("");
    E.zeigen(raster);
  }

  // Mappen: die gewählte hebt sich aus dem Stapel und legt sich nach vorn; die anderen rücken nach hinten
  const stapeln = id => { const rest = mappen.filter(m => m.dataset.r !== id); mappen.forEach(m => { const vorn = m.dataset.r === id; m.setAttribute("aria-pressed", vorn); m.style.setProperty("--pos", vorn ? 0 : rest.indexOf(m) + 1); }); };
  let aktiv = "", laeuft = false;
  async function wechsel(id) {
    if (id === aktiv || laeuft) return;
    if (!aktiv) { stapeln(id); E.wahl(id); aktiv = id; zeichne(id); return; }
    laeuft = true;
    const m = mappen.find(x => x.dataset.r === id);
    raster.querySelectorAll(".k").forEach((el, i) => { el.style.transitionDelay = i * 22 + "ms"; el.classList.remove("da"); });
    m.classList.add("hebt"); E.wahl(id);
    await E.warte(380); stapeln(id); m.classList.remove("hebt");
    await E.warte(260); aktiv = id; zeichne(id); laeuft = false;
  }
  wurzel.querySelector(".c-mappen").addEventListener("click", e => { const b = e.target.closest(".c-mappe"); if (b) wechsel(b.dataset.r); });
  wechsel(E.start());
})();
