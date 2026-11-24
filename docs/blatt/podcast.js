/* Podcast-Seite „Zwischen den Zeilen“: Folgen aus daten/podcast.json, Spieler mit Tonspur, Kapiteln, Tempo und Quellen-Fenster.
   ?folge=<id> wählt eine Folge, ?t=<Sekunden> springt an eine Stelle. */
(() => {
  const wurzel = document.getElementById("pc");
  const buehne = document.getElementById("pc-buehne");
  const liste = document.getElementById("pc-liste");
  const fenster = document.getElementById("pc-fenster");
  const q = new URLSearchParams(location.search);
  const monat = new Date().getMonth() + 1;
  wurzel.dataset.zeit = monat >= 3 && monat <= 5 ? "fruehling" : monat >= 6 && monat <= 8 ? "sommer" : monat >= 9 && monat <= 11 ? "herbst" : "winter";

  const TEMPI = [0.75, 1, 1.25];
  const SPEICHER = "boniblatt.podcast.tempo";
  let tempo = 1;
  try { tempo = +(localStorage.getItem(SPEICHER) || 1); } catch (e) {}
  if (!TEMPI.includes(tempo)) tempo = 1;

  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const datumLang = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const datumKurz = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const heute = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const istNeu = (f) => { const t = (Date.parse(heute) - Date.parse(f.datum)) / 864e5; return t >= 0 && t <= 3; };
  const SPIEL = '<svg class="spiel" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';
  const PAUSE = '<svg class="pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>';
  const INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';
  const BUCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/><path d="M9 8h7M9 11.5h5"/></svg>';

  const audio = new Audio();
  audio.preload = "metadata";
  let folgen = [], aktiv = null, el = {}, ctx = null, analyser = null, daten = null, rafId = 0;

  // ---------- Darstellung ----------
  function balken(werte) {
    const breite = buehne.clientWidth || innerWidth;
    const n = breite < 520 ? 80 : breite < 900 ? 140 : werte.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = Math.floor((i * werte.length) / n), b = Math.max(a + 1, Math.floor(((i + 1) * werte.length) / n));
      let m = 0; for (let j = a; j < b; j++) m = Math.max(m, werte[j]);
      out.push(`<i style="--h:${m.toFixed(2)}"></i>`);
    }
    return out.join("");
  }
  function zeigeFolge(f, abspielen, start) {
    aktiv = f;
    const neu = istNeu(f);
    buehne.dataset.zustand = "aus";
    buehne.innerHTML = `<div class="pc-glut" aria-hidden="true"></div>
      <div class="pc-zeile"><span class="etikett">Folge ${f.nummer} · ${datumLang(f.datum)} · ${Math.round(f.dauer / 60)} Min.</span>${neu ? '<span class="etikett pc-neu">Neu</span>' : ""}
        <span class="pc-ki" title="Die Stimmen von Mira und Jonas sind KI-generiert (${esc(f.stimmen || "ElevenLabs")}). Die Inhalte sind recherchiert, Faktenstand ${esc(f.stand)}.">${INFO}KI-generiert</span></div>
      <h2><small>Zwischen den Zeilen</small>${esc(f.titel)}</h2>
      <p class="pc-text">${esc(f.beschreibung)}</p>
      <div class="pc-spieler">
        <button class="pc-knopf" type="button" aria-label="Abspielen">${SPIEL}${PAUSE}</button>
        <div class="pc-spur" role="slider" tabindex="0" aria-label="Stelle in der Folge" aria-valuemin="0" aria-valuemax="${f.dauer}" aria-valuenow="0" aria-valuetext="00:00">
          <div class="pc-balken hinten">${balken(f.welle)}</div><div class="pc-balken vorn">${balken(f.welle)}</div>
          <div class="pc-marken">${f.kapitel.slice(1).map((k) => `<i style="left:${(100 * k.t / f.dauer).toFixed(2)}%" title="${esc(k.titel)}"></i>`).join("")}</div>
          <span class="pc-zeiger">00:00</span>
        </div>
        <div class="pc-leiste"><span class="pc-zeit">00:00 / ${fmt(f.dauer)}</span><span class="pc-kapitel-jetzt">${esc(f.kapitel[0]?.titel || "")}</span>
          <div class="pc-tempo" role="group" aria-label="Abspieltempo">${TEMPI.map((t) => `<button type="button" data-t="${t}" aria-pressed="${t === tempo}">${String(t).replace(".", ",")}×</button>`).join("")}</div>
          <button class="pc-quellen-knopf" type="button">${BUCH}Quellen (${f.quellen.length})</button></div>
      </div>
      <nav class="pc-kapitel" aria-label="Kapitel">${f.kapitel.map((k, i) => `<button type="button" data-i="${i}"><b>${fmt(k.t)}</b><span>${esc(k.titel)}</span></button>`).join("")}</nav>`;
    el = {
      knopf: buehne.querySelector(".pc-knopf"), spur: buehne.querySelector(".pc-spur"), vorn: buehne.querySelector(".pc-balken.vorn"),
      zeit: buehne.querySelector(".pc-zeit"), kap: buehne.querySelector(".pc-kapitel-jetzt"), zeiger: buehne.querySelector(".pc-zeiger"),
      kapKnoepfe: [...buehne.querySelectorAll(".pc-kapitel button")],
    };
    audio.pause();
    audio.src = "podcast/" + f.datei + (f.fassung > 1 ? "?v=" + f.fassung : "");   // neue Fassung = neue Adresse, kein alter Cache
    audio.defaultPlaybackRate = audio.playbackRate = tempo;
    if (start) springe(start);
    binden();
    stand();
    liste.querySelectorAll(".pc-folge").forEach((k) => k.classList.toggle("laeuft", k.dataset.id === f.id));
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: f.titel, artist: "Zwischen den Zeilen – Boniblatt", album: `Folge ${f.nummer}`,
        artwork: [{ src: new URL("bilder/zeichen.svg", location.href).href, sizes: "512x512", type: "image/svg+xml" }] });
    }
    if (abspielen) spielen();
  }
  function zeigeListe() {
    liste.innerHTML = folgen.map((f, i) => `<article class="k da pc-folge" style="--i:${i}" data-id="${esc(f.id)}" tabindex="0" role="button" aria-label="Folge ${f.nummer} abspielen: ${esc(f.titel)}">
        <span class="pc-nr"><span>Folge ${f.nummer} · ${datumKurz(f.datum)}</span><span>${Math.round(f.dauer / 60)} Min.</span></span>
        <h4>${esc(f.titel)}</h4><p>${esc(f.beschreibung)}</p>
        <div class="unten"><span>${istNeu(f) ? "Neu · " : ""}Anhören</span><span class="pfeil">${SPIEL}</span></div></article>`).join("")
      + `<div class="k da pc-folge pc-bald" aria-hidden="true"><strong>Die nächste Folge</strong><p>erscheint in etwa zwei Wochen.</p></div>`;
    document.getElementById("pc-anzahl").textContent = folgen.length === 1 ? "1 Folge" : `${folgen.length} Folgen`;
    liste.querySelectorAll(".pc-folge[data-id]").forEach((k) => {
      const los = () => { const f = folgen.find((x) => x.id === k.dataset.id); if (f && f !== aktiv) zeigeFolge(f, true); else if (f) spielen(); buehne.scrollIntoView({ behavior: "smooth", block: "start" }); };
      k.addEventListener("click", los);
      k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); los(); } });
    });
  }

  // ---------- Abspielen ----------
  function pegelStart() {
    if (analyser || !window.AudioContext) return;
    try {
      ctx = new AudioContext();
      const quelle = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser(); analyser.fftSize = 1024; daten = new Float32Array(analyser.fftSize);
      quelle.connect(analyser); analyser.connect(ctx.destination);
    } catch (e) { analyser = null; }
  }
  function pegel() {
    if (analyser && !audio.paused) {
      analyser.getFloatTimeDomainData(daten);
      let s = 0; for (let i = 0; i < daten.length; i++) s += daten[i] * daten[i];
      buehne.style.setProperty("--pegel", Math.min(1, Math.sqrt(s / daten.length) * 4).toFixed(3));
    }
    rafId = audio.paused ? 0 : requestAnimationFrame(pegel);
  }
  function spielen() {
    pegelStart();
    if (ctx?.state === "suspended") ctx.resume();
    audio.playbackRate = tempo;
    audio.play().catch(() => {});
  }
  function springe(sek) {
    const d = audio.duration || aktiv?.dauer || 0;
    const ziel = Math.max(0, Math.min(d - 0.5, sek));
    if (audio.readyState >= 1) audio.currentTime = ziel;
    else audio.addEventListener("loadedmetadata", () => { audio.currentTime = ziel; }, { once: true });
    stand(ziel);
  }
  function stand(t = audio.currentTime) {
    if (!aktiv || !el.spur) return;
    const d = audio.duration || aktiv.dauer;
    el.vorn.style.setProperty("--fort", Math.min(1, t / d).toFixed(4));
    el.zeit.textContent = `${fmt(t)} / ${fmt(d)}`;
    el.spur.setAttribute("aria-valuenow", Math.round(t)); el.spur.setAttribute("aria-valuetext", fmt(t));
    let k = 0; aktiv.kapitel.forEach((x, i) => { if (t >= x.t - 0.2) k = i; });
    if (el.kapAktiv !== k) {
      el.kapAktiv = k; el.kap.textContent = aktiv.kapitel[k]?.titel || "";
      el.kapKnoepfe.forEach((b, i) => b.classList.toggle("jetzt", i === k));
    }
  }
  function binden() {
    el.knopf.addEventListener("click", () => (audio.paused ? spielen() : audio.pause()));
    const anteil = (e) => { const r = el.spur.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    let zieht = false;
    el.spur.addEventListener("pointerdown", (e) => { zieht = true; el.spur.setPointerCapture(e.pointerId); springe(anteil(e) * (audio.duration || aktiv.dauer)); });
    el.spur.addEventListener("pointermove", (e) => {
      const a = anteil(e), d = audio.duration || aktiv.dauer;
      el.zeiger.style.left = (a * 100).toFixed(2) + "%"; el.zeiger.textContent = fmt(a * d);
      if (zieht) springe(a * d);
    });
    el.spur.addEventListener("pointerup", () => { zieht = false; });
    el.spur.addEventListener("keydown", (e) => {
      const d = audio.duration || aktiv.dauer, t = audio.currentTime;
      const ziel = { ArrowLeft: t - 5, ArrowRight: t + 5, PageDown: t - 30, PageUp: t + 30, Home: 0, End: d - 1 }[e.key];
      if (ziel !== undefined) { e.preventDefault(); springe(ziel); }
    });
    buehne.querySelectorAll(".pc-tempo button").forEach((b) => b.addEventListener("click", () => {
      tempo = +b.dataset.t; audio.playbackRate = audio.defaultPlaybackRate = tempo;
      try { localStorage.setItem(SPEICHER, String(tempo)); } catch (e) {}
      buehne.querySelectorAll(".pc-tempo button").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.t === tempo)));
    }));
    el.kapKnoepfe.forEach((b) => b.addEventListener("click", () => { springe(aktiv.kapitel[+b.dataset.i].t); spielen(); }));
    buehne.querySelector(".pc-quellen-knopf").addEventListener("click", zeigeQuellen);
  }
  audio.addEventListener("timeupdate", () => stand());
  audio.addEventListener("seeked", () => stand());
  audio.addEventListener("playing", () => { buehne.dataset.zustand = "spielt"; el.knopf?.setAttribute("aria-label", "Pause"); if (!rafId) rafId = requestAnimationFrame(pegel); });
  audio.addEventListener("pause", () => { buehne.dataset.zustand = "pause"; el.knopf?.setAttribute("aria-label", "Weiter abspielen"); buehne.style.setProperty("--pegel", 0); });
  audio.addEventListener("ended", () => { buehne.dataset.zustand = "aus"; });
  audio.addEventListener("error", () => { if (aktiv) buehne.querySelector(".pc-text").textContent = "Die Folge konnte nicht geladen werden. Bitte später noch einmal versuchen."; });
  if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", spielen); ms.setActionHandler("pause", () => audio.pause());
    ms.setActionHandler("seekbackward", () => springe(audio.currentTime - 15));
    ms.setActionHandler("seekforward", () => springe(audio.currentTime + 30));
    try { ms.setActionHandler("seekto", (d) => springe(d.seekTime)); } catch (e) {}
  }
  addEventListener("keydown", (e) => {
    if (e.target !== document.body || fenster.open || !aktiv) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); audio.paused ? spielen() : audio.pause(); }
  });
  let warteResize = 0;
  addEventListener("resize", () => { clearTimeout(warteResize); warteResize = setTimeout(() => {
    if (!aktiv || !el.spur) return;
    buehne.querySelector(".pc-balken.hinten").innerHTML = el.vorn.innerHTML = balken(aktiv.welle);
  }, 200); });

  // ---------- Quellen ----------
  function zeigeQuellen() {
    const f = aktiv;
    const ql = document.getElementById("pc-qliste");
    document.getElementById("pc-fenster-titel").textContent = `Quellen zu Folge ${f.nummer}`;
    ql.innerHTML = f.kapitel.map((k, i) => {
      const bis = f.kapitel[i + 1]?.t ?? Infinity;
      const hier = f.quellen.filter((x) => x.t >= k.t - 0.5 && x.t < bis - 0.5);
      if (!hier.length) return "";
      return `<h4>${esc(k.titel)}</h4>` + hier.map((x) => {
        const eigen = /^eigene lesart/i.test(x.aussage);
        const aussage = eigen ? x.aussage.replace(/^eigene lesart:\s*/i, "") : x.aussage;
        return `<div class="pc-q"><button type="button" data-t="${x.t}" aria-label="Zur Stelle ${fmt(x.t)} springen">${fmt(x.t)}</button>
          <strong>${esc(aussage)}${eigen ? " <em>eigene Lesart</em>" : ""}</strong>
          <span>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.quelle)}</a>` : esc(x.quelle)} · gesagt von ${x.sprecher === "MIRA" ? "Mira" : "Jonas"}</span></div>`;
      }).join("");
    }).join("");
    ql.querySelectorAll("button[data-t]").forEach((b) => b.addEventListener("click", () => { fenster.close(); springe(+b.dataset.t - 0.4); spielen(); }));
    fenster.showModal();
    ql.scrollTop = 0;
  }
  fenster.querySelector(".pc-zu").addEventListener("click", () => fenster.close());
  fenster.addEventListener("click", (e) => { if (e.target === fenster) fenster.close(); });

  // ---------- Laden ----------
  fetch("daten/podcast.json", { cache: "no-cache" }).then((r) => r.json()).then((d) => {
    folgen = (d.folgen || []).slice().sort((a, b) => b.datum.localeCompare(a.datum) || b.nummer - a.nummer);
    if (!folgen.length) { buehne.querySelector(".pc-text").textContent = "Die erste Folge erscheint bald."; return; }
    zeigeListe();
    const wahl = folgen.find((f) => f.id === q.get("folge")) || folgen[0];
    zeigeFolge(wahl, false, +q.get("t") || 0);
  }).catch(() => { buehne.querySelector(".pc-text").textContent = "Die Folgen konnten nicht geladen werden."; });
})();
