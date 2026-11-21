/* Entwurf A „Druckbogen“ */
(async () => {
  const { RESSORTS, esc, gemischt } = E, wurzel = document.getElementById("e");
  await E.laden();
  const band = `${esc(E.datum({ weekday: "long" }))} <em>${esc(E.datum({ day: "numeric", month: "long" }))}</em><i>✺</i>${E.gesamt()} Meldungen<i>✺</i><em>frisch aus Mainz</em><i>✺</i>`;
  wurzel.innerHTML = `<div class="a-lauf" aria-hidden="true"><div>${band.repeat(4)}</div></div>
    <nav class="a-wahl" aria-label="Ressorts">${RESSORTS.map((r, i) => `<button type="button" data-r="${r.id}" aria-pressed="false"><small><span>0${i + 1}</span><span>${(E.ausgabe.ressorts[r.id] || []).length} Meldungen</span></small><strong>${esc(r.kurz === "Planung" ? "Jugendhilfe­planung" : r.kurz === "Quartier" ? "Quartiers­management" : "Frühe Hilfen")}</strong></button>`).join("")}</nav>
    <section class="a-raster" id="kacheln"></section>
    <p class="a-ende"><span>Mainzer Boniblatt · Entwurf A</span><span>Bis morgen.</span></p>`;
  const raster = wurzel.querySelector("#kacheln");
  const fuss = m => `<span class="k-fuss"><span>${esc(E.quelle(m))}</span><span>Lesen →</span></span>`;
  const kritzel = `<svg class="kritzel" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M30 58C12 30 58 8 112 9C168 10 198 32 188 58C178 86 118 94 68 88C26 83 6 62 26 40C40 26 70 18 96 17"/></svg>`;

  function zeichne(id) {
    const t = E.teile(id), r = RESSORTS.find(x => x.id === id), k = [];
    if (t.auf) k.push(`<a class="k auf" data-ein href="${esc(t.auf.url)}"><span class="marke-klein"><b>Aufmacher</b>${esc(t.auf.thema)}</span><h2>${gemischt(t.auf.titel, 2)}</h2><p>${esc(t.auf.kurz || "")}</p><span class="senk">Jetzt lesen &gt;&gt;&gt;&gt;&gt;&gt;&gt;</span>${fuss(t.auf)}</a>`);
    k.push(`<div class="k tag" data-ein><span class="marke-klein">Erscheint werktags.</span><span class="gross">${E.tag().getDate()}${kritzel}</span><h3>${esc(E.datum({ weekday: "long" }))},<br>${esc(E.datum({ month: "long", year: "numeric" }))}</h3></div>`);
    k.push(`<div class="k zahl" data-ein><svg class="siegel" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="a-kreis" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0"/></defs><text><textPath href="#a-kreis">HEUTE · GEPRÜFT · GEWICHTET · MAINZ ·</textPath></text></svg>
      <span class="marke-klein">${esc(r.lang)}</span><span class="gross">${t.alle.length}</span><h3>Meldungen heute</h3><p>1 Aufmacher · ${t.wichtig.length} wichtig · ${t.kurz.length} kurz notiert</p></div>`);
    t.wichtig.forEach((m, i) => k.push(`<a class="k wichtig ${["", "schwarz", "serif"][i % 3]}" data-ein href="${esc(m.url)}"><span class="marke-klein"><b>Wichtig</b>${esc(m.thema)}</span><h2>${gemischt(m.titel, i % 3 === 2 ? 3 : 2)}</h2><p>${esc(m.kurz || "")}</p>${fuss(m)}</a>`));
    if (t.kurz.length) k.push(`<div class="k titel" data-ein><h3>Kurz <b>notiert</b></h3><span>${t.kurz.length} Meldungen<br>zum Überfliegen</span></div>`);
    // Kurzmeldungen: jede Reihe füllt zwölf Spalten; Art und Breite wechseln, damit kein Tag wie der andere aussieht
    const muster = [["", "serif", "farbe", ""], ["breit serif", "", "schwarz"], ["", "farbe breit", "serif"]], versatz = E.tag().getDate() + id.length;
    const reihen = []; let rest = t.kurz.slice(), nr = 0;
    while (rest.length) { const m = muster[(nr++ + versatz) % 3]; reihen.push(rest.length >= m.length ? rest.splice(0, m.length).map((x, i) => [x, m[i]]) : rest.splice(0).map((x, i, alle) => [x, "r" + alle.length + (i % 2 ? " serif" : "")])); }
    reihen.flat().forEach(([m, art]) => k.push(`<a class="k kurz ${art}" data-ein href="${esc(m.url)}"><span class="marke-klein">${esc(m.thema)}</span><h2>${esc(m.titel)}</h2>${fuss(m)}</a>`));
    raster.innerHTML = k.join("");
    E.zeigen(raster);
  }

  let aktiv = "";
  async function wechsel(id) {
    if (id === aktiv) return;
    wurzel.querySelectorAll(".a-wahl button").forEach(b => b.setAttribute("aria-pressed", b.dataset.r === id));
    if (aktiv) {                                   // alte Felder klappen nach oben weg, die Leitfarbe läuft um
      raster.querySelectorAll(".k").forEach((el, i) => { el.style.setProperty("--i", Math.min(i, 12)); el.classList.add("raus"); });
      E.wahl(id); await E.warte(520);
    } else E.wahl(id);
    aktiv = id; zeichne(id);
  }
  wurzel.querySelector(".a-wahl").addEventListener("click", e => { const b = e.target.closest("button"); if (b) wechsel(b.dataset.r); });
  wechsel(E.start());
})();
