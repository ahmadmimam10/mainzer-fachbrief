// Altpapier-Wurf – das Spiel unter der Fußleiste (nur am PC; bb.js lädt dieses Skript erst, wenn der Fuß in Sicht kommt).
// Der alte JHP-Newsletter fliegt als Papierknäuel vom Balkon des Boniturms in den Papierkorb. Mit jedem Treffer wird es
// schwerer: mehr Wind, kleinerer Korb, ab 8 Treffern Böen, ab 12 rollt der Korb. Drei Fehlwürfe beenden die Runde.
(() => {
  const LISTE_URL = "";   // Adresse des Bestenlisten-Dienstes (cloudflare/bestenliste). Leer = Spiel ohne gemeinsame Bestenliste.
  const wurzel = document.getElementById("spiel"); if (!wurzel || wurzel.dataset.an) return; wurzel.dataset.an = "1";
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  wurzel.innerHTML = `
    <div class="sp-kopf"><div><strong>Altpapier-<i>Wurf</i></strong><span>Der alte Newsletter muss weg: zielen, klicken, treffen. Drei Fehlwürfe, dann ist Feierabend.</span></div>
      <div class="sp-stand"><span class="sp-wind"></span><span class="sp-leben" aria-label="Verbleibende Fehlwürfe"></span><b class="sp-punkte" aria-label="Treffer">0</b></div></div>
    <div class="sp-feld"><canvas aria-label="Spielfeld: Boniturm mit Balkon, Windsack und Papierkorb"></canvas><div class="sp-tafel"></div></div>
    <aside class="sp-liste"><strong>Bestenliste</strong><ol></ol><p></p></aside>`;
  const $ = s => wurzel.querySelector(s), cv = $("canvas"), cx = cv.getContext("2d"), tafel = $(".sp-tafel");
  const elWind = $(".sp-wind"), elLeben = $(".sp-leben"), elPunkte = $(".sp-punkte"), elListe = $(".sp-liste ol"), elHinweis = $(".sp-liste p");
  const stil = getComputedStyle(wurzel), farbe = (n, ers) => (stil.getPropertyValue(n) || "").trim() || ers;
  const TINTE = "#1f1c18", AKZ = farbe("--ra", "#a8472b"), AKZ2 = farbe("--rb", "#dba63f");
  const H = 430, BODEN = H - 44, KH = 66, G = .3, R = 9, SCHULTER = { x: 226, y: 116 }; let W = 900;
  const zufall = (a, b) => a + Math.random() * (b - a);
  const BILDER = ["dom", "christuskirche", "staatstheater", "holzturm"].map(n => { const b = new Image(); b.src = "bilder/motive/" + n + ".webp"; return b; });
  const S = { zustand: "start", punkte: 0, leben: 3, serie: 0, best: 0, wind: 0, phase: 0, boeig: false, t: 0, start: 0, dauer: 0, name: "",
    korb: { x: 620, b: 80, v: 0 }, ball: null, maus: { x: 520, y: 40 }, muell: [], teile: [], schrift: [],
    blaetter: Array.from({ length: 12 }, () => ({ x: zufall(0, 1200), y: zufall(20, 330), v: zufall(-.2, .2), p: zufall(0, 99), a: zufall(0, 6), f: Math.random() < .5 })),
    wolken: [{ x: 380, y: 52, s: 1.1 }, { x: 760, y: 88, s: .8 }, { x: 1050, y: 40, s: 1 }] };

  if (new URLSearchParams(location.search).has("spieltest")) window.SPIELTEST = S;   // nur für die eigene Prüfung (werkzeuglos: ?spieltest)
  const mass = () => { const d = Math.min(2, devicePixelRatio || 1); W = Math.max(640, cv.clientWidth); cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); S.korb.x = Math.min(S.korb.x, W - 80); };
  const windJetzt = () => S.boeig ? S.wind * (1 + .4 * Math.sin(S.t * .045 + S.phase)) : S.wind;
  const ziel = () => { const dx = Math.max(14, S.maus.x - SCHULTER.x), dy = S.maus.y - SCHULTER.y, l = Math.hypot(dx, dy); return { x: dx / l, y: dy / l, k: 5 + Math.min(1, l / 340) * 13.5 }; };
  const hand = z => ({ x: SCHULTER.x + z.x * 19, y: SCHULTER.y + z.y * 19 });
  const anzeige = () => { const w = S.wind;
    elWind.innerHTML = Math.abs(w) < .05 ? "windstill" : `Wind <b>${Math.abs(w).toFixed(1).replace(".", ",")}</b> ${w > 0 ? "→" : "←"}${S.boeig ? " · böig" : ""}`;
    elLeben.innerHTML = [0, 1, 2].map(i => `<i${i < S.leben ? "" : ' class="weg"'}></i>`).join(""); elPunkte.textContent = S.punkte; };

  // ---- Ablauf ----
  const runde = () => { const n = S.punkte, m = Math.min(8, .6 + n * .5);
    S.wind = n === 0 ? 0 : +(zufall(.35, 1) * m * (Math.random() < .5 ? -1 : 1)).toFixed(1);
    S.boeig = n >= 8; S.phase = zufall(0, 6);
    S.korb.b = Math.max(46, 80 - n * 2.4);
    S.korb.x = n < 2 ? zufall(W * .5, W * .68) : zufall(W * .44, W - 80);
    S.korb.v = n >= 12 ? (Math.random() < .5 ? -1 : 1) * Math.min(1.9, .6 + (n - 12) * .09) : 0;
    S.ball = null; S.zustand = "ziel"; anzeige(); };
  const neu = () => { Object.assign(S, { punkte: 0, leben: 3, serie: 0, muell: [], teile: [], schrift: [], start: performance.now() }); tafel.hidden = true; runde(); };
  const werfen = () => { if (S.zustand !== "ziel") return; const z = ziel(), h = hand(z); S.ball = { x: h.x, y: h.y, vx: z.x * z.k, vy: z.y * z.k, a: 0, auf: 0 }; S.zustand = "flug"; };
  const sagen = (x, y, t, l = 80) => S.schrift.push({ x: Math.max(120, Math.min(W - 120, x)), y, t, l, l0: l });
  const treffer = () => { const k = S.korb; S.punkte++; S.serie++; S.zustand = "pause"; S.ball = null;
    for (let i = 0; i < 14; i++) S.teile.push({ x: k.x, y: BODEN - KH, vx: zufall(-3, 3), vy: zufall(-6.5, -2), a: 0, va: zufall(-.3, .3), l: 55, f: i % 3 });
    let text = ["Abgelegt!", "Drin!", "Sauber!", "Volltreffer!"][S.punkte % 4];
    if (S.serie % 5 === 0 && S.leben < 3) { S.leben++; text = "Fünf in Folge – ein Fehlwurf gestrichen"; }
    else if (S.punkte === 8) text = "Achtung, jetzt wird es böig"; else if (S.punkte === 12) text = "Der Korb kommt ins Rollen";
    sagen(k.x, BODEN - KH - 26, text, 90); anzeige(); setTimeout(runde, 750); };
  const daneben = weg => { const b = S.ball; S.leben--; S.serie = 0; S.zustand = "pause"; S.ball = null;
    if (!weg && b) { S.muell.push({ x: b.x, a: b.a }); if (S.muell.length > 8) S.muell.shift(); sagen(b.x, BODEN - 34, "Daneben", 60); } else sagen(W / 2, 80, "Weit daneben", 60);
    anzeige(); setTimeout(S.leben > 0 ? runde : ende, 750); };
  const ende = () => { S.zustand = "ende"; S.dauer = Math.round((performance.now() - S.start) / 1000); const vorher = S.best; S.best = Math.max(S.best, S.punkte);
    tafel.hidden = false;
    tafel.innerHTML = `<b>Feierabend.</b><p><strong>${S.punkte}</strong> Treffer${vorher > S.punkte ? ` · dein Bestwert bisher: ${vorher}` : S.punkte > 0 && vorher > 0 ? " · neuer Bestwert" : ""}</p>`
      + (LISTE_URL && S.punkte > 0 ? `<form class="sp-form"><input name="n" maxlength="12" minlength="2" required placeholder="Dein Name" autocomplete="off" aria-label="Name für die Bestenliste" value="${esc(S.name)}"><button>Eintragen</button></form><small class="sp-meld"></small>` : "")
      + `<button type="button" class="sp-los">Nochmal</button>`; };

  const schritt = () => { S.t++; const w = windJetzt(), k = S.korb, oben = BODEN - KH;
    if (k.v && S.zustand !== "ende") { k.x += k.v; if (k.x < W * .44 || k.x > W - 80) k.v *= -1; }
    for (const b of S.blaetter) { b.x += w * .9 + b.v; b.y += Math.sin((S.t + b.p) * .05) * .5 + .12; b.a += .03 + Math.abs(w) * .012; if (b.x > W + 20) b.x = -20; else if (b.x < -20) b.x = W + 20; if (b.y > BODEN - 4) b.y = zufall(20, 120); }
    for (const c of S.wolken) { c.x += w * .12 + .05; if (c.x > W + 130) c.x = -130; else if (c.x < -130) c.x = W + 130; }
    for (const t of S.teile) { t.vy += .25; t.x += t.vx + w * .05; t.y += t.vy; t.a += t.va; t.l--; } S.teile = S.teile.filter(t => t.l > 0);
    for (const s of S.schrift) { s.y -= .5; s.l--; } S.schrift = S.schrift.filter(s => s.l > 0);
    const b = S.ball; if (!b || S.zustand !== "flug") return;
    const y0 = b.y; b.vx += w * .0105; b.vy += G; b.vx *= .997; b.x += b.vx; b.y += b.vy; b.a += b.vx * .06;
    // Treffer: von oben durch die Öffnung
    if (y0 <= oben && b.y > oben && b.vy > 0 && Math.abs(b.x - k.x) < k.b / 2 - 3) return treffer();
    // Rand des Korbs: abprallen
    for (const s of [-1, 1]) { const rx = k.x + s * k.b / 2, dx = b.x - rx, dy = b.y - oben, d = Math.hypot(dx, dy);
      if (d < R + 3 && d > 0) { const nx = dx / d, ny = dy / d, p = b.vx * nx + b.vy * ny; if (p < 0) { b.vx -= 1.55 * p * nx; b.vy -= 1.55 * p * ny; } b.x = rx + nx * (R + 3); b.y = oben + ny * (R + 3); } }
    // Korbwand von außen (der Korb wird nach unten etwas schmaler)
    if (b.y > oben + 3 && b.y < BODEN) { const halb = k.b / 2 - (b.y - oben) / KH * 7, dx = b.x - k.x; if (Math.abs(dx) < halb + R) { const s = Math.sign(dx) || 1; b.x = k.x + s * (halb + R); b.vx = Math.abs(b.vx) * .4 * s; } }
    if (b.y > BODEN - R) { b.y = BODEN - R; b.vy *= -.36; b.vx *= .7; b.auf++; if (b.auf >= 3 || Math.abs(b.vy) < 1.1) return daneben(); }
    if (b.x > W + 60 || b.x < -60) daneben(true);
  };

  // ---- Zeichnen ----
  const knaeuel = (x, y, a, r = R) => { cx.save(); cx.translate(x, y); cx.rotate(a); cx.fillStyle = "#fff"; cx.strokeStyle = TINTE; cx.lineWidth = 1.4; cx.lineJoin = "round"; cx.beginPath();
    for (let i = 0; i < 9; i++) { const w = i / 9 * 6.283, rr = r * (i % 2 ? .82 : 1.06); cx[i ? "lineTo" : "moveTo"](Math.cos(w) * rr, Math.sin(w) * rr); } cx.closePath(); cx.fill(); cx.stroke();
    cx.strokeStyle = "#2c477c"; cx.lineWidth = 1.7; cx.beginPath(); cx.moveTo(-r * .5, -r * .2); cx.lineTo(r * .4, -r * .45); cx.stroke();
    cx.strokeStyle = "rgba(31,28,24,.4)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(-r * .4, r * .25); cx.lineTo(r * .5, r * .1); cx.stroke(); cx.restore(); };
  const turm = (x, b, f) => { cx.fillStyle = f; cx.fillRect(x, -10, b, BODEN + 10);
    for (let i = 0, sx = x + 10; sx < x + b - 12; sx += 20, i++) for (let j = 0, sy = 8; sy < BODEN - 34; sy += 23, j++) { cx.fillStyle = (i * 7 + j * 13 + (x > 0 ? 3 : 0)) % 5 < 2 ? "#f0cf7a" : "rgba(255,255,255,.14)"; cx.fillRect(sx, sy, 11, 13); } };
  const zeichne = () => { const w = windJetzt(), k = S.korb, oben = BODEN - KH, kb = k.b / 2, ku = kb - 7, rad = k.v ? 7 : 0;
    cx.clearRect(0, 0, W, H); cx.lineCap = "round";
    const g = cx.createLinearGradient(0, 0, 0, BODEN); g.addColorStop(0, "#dbe8ef"); g.addColorStop(1, "#f7efe0"); cx.fillStyle = g; cx.fillRect(0, 0, W, BODEN);
    cx.fillStyle = "rgba(255,255,255,.9)"; for (const c of S.wolken) { cx.beginPath(); cx.ellipse(c.x, c.y, 46 * c.s, 15 * c.s, 0, 0, 7); cx.ellipse(c.x - 24 * c.s, c.y + 6 * c.s, 30 * c.s, 12 * c.s, 0, 0, 7); cx.ellipse(c.x + 28 * c.s, c.y + 7 * c.s, 26 * c.s, 10 * c.s, 0, 0, 7); cx.fill(); }
    // ferne Stadt: die Motive der Seite als blasser Schattenriss
    cx.globalAlpha = .12; let sx = W * .38; for (const b of BILDER) if (b.complete && b.naturalWidth) { const h = 124, br = h * b.naturalWidth / b.naturalHeight; cx.drawImage(b, sx, BODEN - h, br, h); sx += br + 46; } cx.globalAlpha = 1;
    // Boden
    cx.fillStyle = "#ddd3c1"; cx.fillRect(0, BODEN, W, H - BODEN); cx.strokeStyle = "rgba(31,28,24,.13)"; cx.lineWidth = 1; cx.beginPath(); for (let x = 30; x < W + 30; x += 46) { cx.moveTo(x, BODEN + 3); cx.lineTo(x - 16, H); } cx.stroke();
    cx.fillStyle = TINTE; cx.fillRect(0, BODEN, W, 3);
    // Windsack
    { const px = Math.max(300, W * .36), py = BODEN - 168, staerke = Math.min(1, Math.abs(w) / 6), win = (1 - staerke) * 1.35, s = w < 0 ? -1 : 1, lang = 46 + staerke * 12, flat = Math.sin(S.t * .18) * .06 * (1 + staerke * 2);
      cx.strokeStyle = TINTE; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(px, BODEN); cx.lineTo(px, py); cx.stroke();
      cx.save(); cx.translate(px, py + 8); cx.scale(s, 1); cx.rotate(win + flat);
      for (let i = 0; i < 4; i++) { const a = i / 4, e = (i + 1) / 4; cx.fillStyle = i % 2 ? "#fff" : AKZ; cx.beginPath(); cx.moveTo(a * lang, -9 + a * 5); cx.lineTo(e * lang, -9 + e * 5); cx.lineTo(e * lang, 9 - e * 5); cx.lineTo(a * lang, 9 - a * 5); cx.closePath(); cx.fill(); }
      cx.strokeStyle = TINTE; cx.lineWidth = 1.3; cx.beginPath(); cx.moveTo(0, -9); cx.lineTo(lang, -4); cx.lineTo(lang, 4); cx.lineTo(0, 9); cx.closePath(); cx.stroke(); cx.restore(); }
    // Blätter im Wind
    for (const b of S.blaetter) { cx.save(); cx.translate(b.x, b.y); cx.rotate(b.a); cx.fillStyle = b.f ? AKZ2 : AKZ; cx.globalAlpha = .75; cx.beginPath(); cx.ellipse(0, 0, 5.5, 2.6, 0, 0, 7); cx.fill(); cx.restore(); } cx.globalAlpha = 1;
    // Bonitürme mit Balkon und Figur
    turm(-52, 104, "#3b3630"); turm(64, 140, TINTE);
    cx.fillStyle = TINTE; cx.fillRect(204, 150, 62, 7); cx.strokeStyle = TINTE; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(204, 130); cx.lineTo(266, 130); for (let x = 212; x <= 266; x += 9) { cx.moveTo(x, 130); cx.lineTo(x, 150); } cx.stroke();
    { const z = S.zustand === "ziel" || S.zustand === "start" ? ziel() : { x: .8, y: -.6 }, h = hand(z);
      cx.fillStyle = AKZ; cx.beginPath(); cx.roundRect(213, 108, 17, 42, 6); cx.fill();
      cx.fillStyle = "#e9c6a0"; cx.beginPath(); cx.arc(221.5, 98, 8.5, 0, 7); cx.fill(); cx.fillStyle = TINTE; cx.beginPath(); cx.arc(221.5, 95, 8.6, 3.3, 6.2); cx.fill();
      cx.strokeStyle = AKZ; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(SCHULTER.x - 2, SCHULTER.y); cx.lineTo(h.x - z.x * 4, h.y - z.y * 4); cx.stroke();
      if (S.zustand === "ziel") { let x = h.x, y = h.y, vx = z.x * z.k, vy = z.y * z.k; cx.fillStyle = TINTE;
        for (let i = 1; i <= 30; i++) { vy += G; x += vx; y += vy; if (i % 3 === 0) { cx.globalAlpha = .55 * (1 - i / 34); cx.beginPath(); cx.arc(x, y, 2.6, 0, 7); cx.fill(); } } cx.globalAlpha = 1; knaeuel(h.x, h.y, 0); } }
    // liegengebliebenes Papier
    for (const m of S.muell) knaeuel(m.x, BODEN - R + 1, m.a);
    // Papierkorb
    cx.fillStyle = "rgba(31,28,24,.1)"; cx.beginPath(); cx.ellipse(k.x, BODEN + 5, kb + 8, 5, 0, 0, 7); cx.fill();
    cx.fillStyle = "rgba(255,255,255,.55)"; cx.beginPath(); cx.moveTo(k.x - kb, oben); cx.lineTo(k.x - ku, BODEN - rad); cx.lineTo(k.x + ku, BODEN - rad); cx.lineTo(k.x + kb, oben); cx.closePath(); cx.fill();
    cx.strokeStyle = TINTE; cx.lineWidth = 1.1; cx.beginPath(); for (let i = -3; i <= 3; i++) { cx.moveTo(k.x + i / 3 * kb, oben); cx.lineTo(k.x + i / 3 * ku, BODEN - rad); } for (let j = 1; j < 4; j++) { const y = oben + j * 16, h = kb - (y - oben) / KH * 7; cx.moveTo(k.x - h, y); cx.lineTo(k.x + h, y); } cx.stroke();
    cx.lineWidth = 3; cx.beginPath(); cx.moveTo(k.x - kb, oben); cx.lineTo(k.x - ku, BODEN - rad); cx.lineTo(k.x + ku, BODEN - rad); cx.lineTo(k.x + kb, oben); cx.stroke();
    cx.strokeStyle = AKZ; cx.lineWidth = 4.5; cx.beginPath(); cx.ellipse(k.x, oben, kb + 1, 4.5, 0, 0, 7); cx.stroke();
    if (rad) { cx.fillStyle = TINTE; for (const s of [-1, 1]) { cx.beginPath(); cx.arc(k.x + s * (ku - 5), BODEN - 5, 5.5, 0, 7); cx.fill(); } }
    // Flug, Schnipsel, Texte
    if (S.ball) knaeuel(S.ball.x, S.ball.y, S.ball.a);
    for (const t of S.teile) { cx.save(); cx.translate(t.x, t.y); cx.rotate(t.a); cx.globalAlpha = Math.min(1, t.l / 20); cx.fillStyle = ["#fff", AKZ2, "#2c477c"][t.f]; cx.fillRect(-4, -2.5, 8, 5); cx.restore(); }
    cx.textAlign = "center"; cx.font = '600 17px "Bricolage Grotesque", system-ui, sans-serif';
    for (const s of S.schrift) { cx.globalAlpha = Math.min(1, s.l / 18); cx.lineWidth = 5; cx.strokeStyle = "rgba(251,245,233,.9)"; cx.strokeText(s.t, s.x, s.y); cx.fillStyle = TINTE; cx.fillText(s.t, s.x, s.y); } cx.globalAlpha = 1;
  };

  // ---- Schleife: läuft nur, solange das Spiel zu sehen ist ----
  let sichtbar = false, laeuft = false, zuletzt = 0, rest = 0;
  const bild = jetzt => { if (!sichtbar) { laeuft = false; return; } rest += Math.min(60, jetzt - zuletzt); zuletzt = jetzt; while (rest >= 16.67) { schritt(); rest -= 16.67; } zeichne(); requestAnimationFrame(bild); };
  new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; if (sichtbar && !laeuft) { laeuft = true; zuletzt = performance.now(); mass(); requestAnimationFrame(bild); } }).observe(wurzel);
  addEventListener("resize", () => { if (sichtbar) mass(); });
  cv.addEventListener("pointermove", e => { const b = cv.getBoundingClientRect(); S.maus.x = e.clientX - b.left; S.maus.y = e.clientY - b.top; });
  cv.addEventListener("pointerdown", e => { const b = cv.getBoundingClientRect(); S.maus.x = e.clientX - b.left; S.maus.y = e.clientY - b.top; werfen(); });

  // ---- Bestenliste ----
  const listeZeigen = (l, ich) => { elListe.innerHTML = (l || []).slice(0, 10).map((e, i) => `<li${ich && e.n === ich ? ' class="ich"' : ""}><span>${i + 1}</span><b>${esc(e.n)}</b><em>${+e.p || 0}</em></li>`).join(""); elHinweis.textContent = l && l.length ? "" : "Noch niemand eingetragen – der erste Platz ist frei."; };
  if (LISTE_URL) fetch(LISTE_URL).then(r => r.json()).then(d => listeZeigen(d.liste)).catch(() => { elHinweis.textContent = "Die Bestenliste ist gerade nicht erreichbar."; });
  else elHinweis.textContent = "Die gemeinsame Bestenliste wird gerade eingerichtet.";
  tafel.addEventListener("click", e => { if (e.target.closest(".sp-los")) neu(); });
  tafel.addEventListener("submit", async e => { e.preventDefault(); const f = e.target, knopf = f.querySelector("button"), meld = tafel.querySelector(".sp-meld"); S.name = f.n.value.trim(); knopf.disabled = true;
    try { const r = await fetch(LISTE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: S.name, punkte: S.punkte, dauer: S.dauer }) }), d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.fehler || "Das hat gerade nicht geklappt."); listeZeigen(d.liste, d.name); f.remove(); meld.textContent = d.platz ? `Eingetragen – Platz ${d.platz}.` : "Eingetragen."; }
    catch (x) { meld.textContent = x.message; knopf.disabled = false; } });

  tafel.innerHTML = `<b>Bereit?</b><p>Maus bewegen zum Zielen, klicken zum Werfen. Der Windsack zeigt, wohin es das Papier trägt.</p><button type="button" class="sp-los">Los geht's</button>`;
  anzeige();
})();
