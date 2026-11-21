/* Entwurf B „Bento“ */
(async () => {
  const { RESSORTS, esc } = E, wurzel = document.getElementById("e");
  await E.laden();
  const welle = `<svg viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V30C100 6 200 6 300 30S500 54 600 30S800 6 900 30S1100 54 1200 30V60Z"/></svg>`;
  wurzel.innerHTML = `<div class="b-welle">${welle}${welle}</div><div class="b-innen">
    <header class="b-kopf"><p class="b-gruss">Guten <i>Morgen.</i><small>${esc(E.datum({ weekday: "long", day: "numeric", month: "long" }))} · ${E.gesamt()} Meldungen in drei Ressorts</small></p>
      <nav class="b-wahl" aria-label="Ressorts"><span class="b-schieber"></span>${RESSORTS.map(r => `<button type="button" data-r="${r.id}" aria-pressed="false">${esc(r.kurz)}</button>`).join("")}</nav></header>
    <section class="b-raster" id="kacheln"></section></div>`;
  const raster = wurzel.querySelector("#kacheln"), schieber = wurzel.querySelector(".b-schieber");
  const unten = m => `<span class="unten"><span>${esc(E.quelle(m))}</span><span class="pfeil">→</span></span>`;
  // Kleines Bild aus den Formen des Logos: Sonne, Türme, Wasser – in den Farben des Ressorts
  const bild = `<svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle class="f1" cx="150" cy="200" r="118"/><path class="f2" d="M96 200V118l22-52 22 52v82ZM160 200V92l26-58 26 58v108Z"/><path class="f3" d="M0 200h300v100H0Z"/><path class="f4" d="M40 232h90v10H40ZM150 256h110v10H150Z"/></svg>`;

  function zeichne(id) {
    const t = E.teile(id), r = RESSORTS.find(x => x.id === id), her = E.herkunft(id), max = Math.max(1, ...her.map(h => h[1])), k = [];
    const auf = t.auf ? `<a class="k auf" data-ein href="${esc(t.auf.url)}"><span class="etikett">Aufmacher · ${esc(t.auf.thema)}</span><h2>${esc(t.auf.titel)}</h2><p>${esc(t.auf.kurz || "")}</p>${unten(t.auf)}</a>` : "";
    const zahl = `<div class="k zahl" data-ein><span class="etikett">${esc(r.lang)}</span><div class="zr"><div><span class="gross">${t.alle.length}</span><p>Meldungen heute</p></div>
      <div class="saeulen" role="img" aria-label="Herkunft der Meldungen">${her.map(([n, z]) => `<span style="--h:${(z / max).toFixed(2)}"><b>${z}<small>${n}</small></b></span>`).join("")}</div></div></div>`;
    const hoeren = `<div class="k hoeren" data-ein><span class="knopf">▶</span><h3>Anhören<br>in 3 Minuten</h3></div>`;
    const tag = `<div class="k tag" data-ein><h3>${esc(E.datum({ weekday: "long" }))}</h3><span class="gross">${E.tag().getDate()}.</span><h3>${esc(E.datum({ month: "long", year: "numeric" }))}</h3></div>`;
    const wichtig = t.wichtig.map((m, i) => `<a class="k wichtig${i === 1 ? " farbe" : ""}" data-ein href="${esc(m.url)}"><span class="etikett">${esc(m.thema)}</span><h2>${esc(m.titel)}</h2><p>${esc(m.kurz || "")}</p>${unten(m)}</a>`);
    const liste = t.kurz.length ? `<div class="k liste" data-ein><h3>Kurz <i>notiert</i></h3>${t.kurz.map(m => `<a href="${esc(m.url)}"><b>${esc(m.thema)}</b><span>${esc(m.titel)}</span><span>${esc(E.quelle(m))}</span></a>`).join("")}</div>` : "";
    const kunst = `<div class="k bild" data-ein>${bild}</div>`;
    // Die Anordnung wechselt je Ressort und Tag (drei Muster) – so sieht kein Morgen aus wie der andere
    const muster = (E.tag().getDate() + RESSORTS.indexOf(r)) % 3;
    if (muster === 0) k.push(auf, zahl, hoeren, tag, ...wichtig, liste, kunst);
    else if (muster === 1) k.push(zahl, auf, tag, hoeren, kunst, liste, ...wichtig);
    else k.push(auf, tag, hoeren, zahl, liste, kunst, ...wichtig);
    raster.innerHTML = k.join("");
    if (muster === 1) raster.querySelector(".zahl").style.gridRow = "span 1";
    E.zeigen(raster);
  }

  function schieben(id) {
    const b = wurzel.querySelector(`.b-wahl button[data-r="${id}"]`);
    schieber.style.left = b.offsetLeft + "px"; schieber.style.width = b.offsetWidth + "px";
  }
  let aktiv = "";
  async function wechsel(id) {
    if (id === aktiv) return;
    wurzel.querySelectorAll(".b-wahl button").forEach(b => b.setAttribute("aria-pressed", b.dataset.r === id));
    schieben(id);
    if (aktiv) {                                   // Kacheln sinken weg, die Farben laufen um, dann steigt die neue Ordnung auf
      raster.querySelectorAll(".k").forEach((el, i) => { el.style.transitionDelay = i * 28 + "ms"; el.classList.remove("da"); });
      E.wahl(id); await E.warte(560);
    } else E.wahl(id);
    aktiv = id; zeichne(id);
  }
  wurzel.querySelector(".b-wahl").addEventListener("click", e => { const b = e.target.closest("button"); if (b) wechsel(b.dataset.r); });
  addEventListener("resize", () => aktiv && schieben(aktiv));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => aktiv && schieben(aktiv));
  wechsel(E.start());
})();
