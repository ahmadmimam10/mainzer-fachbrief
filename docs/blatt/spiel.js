// Altpapier-Wurf – das Spiel unter der Fußleiste (nur am PC; bb.js lädt dieses Skript erst, wenn der Fuß in Sicht kommt).
// Der alte JHP-Newsletter fliegt als Papierknäuel vom Balkon des Boniturms in den Papierkorb. Mit jedem Treffer wird es
// schwerer: mehr Wind, kleinerer Korb, ab 12 Treffern Böen, ab 18 rollt der Korb. Drei Fehlwürfe beenden die Runde.
// Das Papier fliegt wie Papier: gemächlich, mit Luftwiderstand und im Bogen – ein gerader Schuss in den Korb geht nicht.
(() => {
  const LISTE_URL = "https://boniblatt-bestenliste.ahmadmimam10.workers.dev/";   // Adresse des Bestenlisten-Dienstes (cloudflare/bestenliste). Leer = Spiel ohne gemeinsame Bestenliste.
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
  const H = 430, BODEN = H - 44, KH = 68, R = 10, SCHULTER = { x: 246, y: 101 }, HAUT = "#e7bf99"; let W = 900;
  // Wurf: Schwerkraft, Luftwiderstand je Bild, Windwirkung, Tempo von–bis, Mausweg bis zur vollen Kraft, steilster Wurf nach unten, Reichweite des Korbs
  const K = { G: .2, LUFT: .988, WIND: .0085, V0: 3, V1: 7.5, WEG: 300, NEIG: .3, NAH: 380, WEIT: 700 };
  const zufall = (a, b) => a + Math.random() * (b - a);
  const BILDER = ["dom", "christuskirche", "staatstheater", "holzturm"].map(n => { const b = new Image(); b.src = "bilder/motive/" + n + ".webp"; return b; });
  const S = { zustand: "start", punkte: 0, leben: 3, serie: 0, best: 0, wind: 0, phase: 0, boeig: false, t: 0, start: 0, dauer: 0, name: "",
    korb: { x: 600, b: 84, v: 0 }, ball: null, maus: { x: 520, y: 20 }, schwung: 0, zuletztZiel: { x: .8, y: -.6, k: 8 }, muell: [], teile: [], schrift: [], k: K,
    blaetter: Array.from({ length: 12 }, () => ({ x: zufall(0, 1200), y: zufall(20, 330), v: zufall(-.2, .2), p: zufall(0, 99), a: zufall(0, 6), f: Math.random() < .5 })),
    wolken: [{ x: 380, y: 52, s: 1.1 }, { x: 760, y: 88, s: .8 }, { x: 1050, y: 40, s: 1 }] };

  if (new URLSearchParams(location.search).has("spieltest")) window.SPIELTEST = S;   // nur für die eigene Prüfung (werkzeuglos: ?spieltest)
  const mass = () => { const d = Math.min(2, devicePixelRatio || 1); W = Math.max(640, cv.clientWidth); cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); S.korb.x = Math.min(S.korb.x, W - 80, K.WEIT); };
  const windJetzt = () => S.boeig ? S.wind * (1 + .35 * Math.sin(S.t * .04 + S.phase)) : S.wind;
  const ziel = () => { const dx = Math.max(20, S.maus.x - SCHULTER.x), dy = Math.min(S.maus.y - SCHULTER.y, dx * K.NEIG), l = Math.hypot(dx, dy); return { x: dx / l, y: dy / l, k: K.V0 + Math.min(1, Math.max(0, (l - 40) / K.WEG)) * K.V1 }; };
  const hand = z => ({ x: SCHULTER.x + z.x * 24, y: SCHULTER.y + z.y * 24 });
  const anzeige = () => { const w = S.wind;
    elWind.innerHTML = Math.abs(w) < .05 ? "windstill" : `Wind <b>${Math.abs(w).toFixed(1).replace(".", ",")}</b> ${w > 0 ? "→" : "←"}${S.boeig ? " · böig" : ""}`;
    elLeben.innerHTML = [0, 1, 2].map(i => `<i${i < S.leben ? "" : ' class="weg"'}></i>`).join(""); elPunkte.textContent = S.punkte; };

  // ---- Ablauf ----
  const runde = () => { const n = S.punkte, m = Math.min(6.5, n * .3), weit = Math.min(W - 80, K.WEIT);
    S.wind = n === 0 ? 0 : +(zufall(.35, 1) * m * (Math.random() < .5 ? -1 : 1)).toFixed(1);
    S.boeig = n >= 12; S.phase = zufall(0, 6);
    S.korb.b = Math.max(50, 84 - n * 1.4);
    S.korb.x = n < 3 ? zufall(K.NAH + 40, Math.min(weit, K.NAH + 220)) : zufall(K.NAH, weit);
    S.korb.v = n >= 18 ? (Math.random() < .5 ? -1 : 1) * Math.min(1.4, .45 + (n - 18) * .05) : 0;
    S.ball = null; S.zustand = "ziel"; anzeige(); };
  const neu = () => { Object.assign(S, { punkte: 0, leben: 3, serie: 0, muell: [], teile: [], schrift: [], start: performance.now() }); tafel.hidden = true; runde(); };
  const werfen = () => { if (S.zustand !== "ziel") return; const z = ziel(), h = hand(z); S.ball = { x: h.x, y: h.y, vx: z.x * z.k, vy: z.y * z.k, a: 0, auf: 0 }; S.zuletztZiel = z; S.schwung = 16; S.zustand = "flug"; };
  const sagen = (x, y, t, l = 80) => S.schrift.push({ x: Math.max(120, Math.min(W - 120, x)), y, t, l, l0: l });
  const treffer = () => { const k = S.korb; S.punkte++; S.serie++; S.zustand = "pause"; S.ball = null;
    for (let i = 0; i < 14; i++) S.teile.push({ x: k.x, y: BODEN - KH, vx: zufall(-3, 3), vy: zufall(-6.5, -2), a: 0, va: zufall(-.3, .3), l: 55, f: i % 3 });
    let text = ["Abgelegt!", "Drin!", "Sauber!", "Volltreffer!"][S.punkte % 4];
    if (S.serie % 5 === 0 && S.leben < 3) { S.leben++; text = "Fünf in Folge – ein Fehlwurf gestrichen"; }
    else if (S.punkte === 12) text = "Achtung, jetzt wird es böig"; else if (S.punkte === 18) text = "Der Korb kommt ins Rollen";
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
    if (S.schwung > 0) S.schwung--;
    if (k.v && S.zustand !== "ende") { k.x += k.v; if (k.x < K.NAH || k.x > Math.min(W - 80, K.WEIT)) k.v *= -1; }
    for (const b of S.blaetter) { b.x += w * .9 + b.v; b.y += Math.sin((S.t + b.p) * .05) * .5 + .12; b.a += .03 + Math.abs(w) * .012; if (b.x > W + 20) b.x = -20; else if (b.x < -20) b.x = W + 20; if (b.y > BODEN - 4) b.y = zufall(20, 120); }
    for (const c of S.wolken) { c.x += w * .12 + .05; if (c.x > W + 130) c.x = -130; else if (c.x < -130) c.x = W + 130; }
    for (const t of S.teile) { t.vy += .25; t.x += t.vx + w * .05; t.y += t.vy; t.a += t.va; t.l--; } S.teile = S.teile.filter(t => t.l > 0);
    for (const s of S.schrift) { s.y -= .5; s.l--; } S.schrift = S.schrift.filter(s => s.l > 0);
    const b = S.ball; if (!b || S.zustand !== "flug") return;
    const y0 = b.y; b.vx += w * K.WIND; b.vy += K.G; b.vx *= K.LUFT; b.vy *= K.LUFT; b.x += b.vx; b.y += b.vy; b.a += b.vx * .05 + .02;
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
  const ECKEN = [1.02, .84, 1.08, .9, 1, .8, 1.06, .88, .98, .86, 1.07];
  const knaeuel = (x, y, a, r = R) => { const n = ECKEN.length, ecke = i => [Math.cos(i / n * 6.283) * r * ECKEN[i % n], Math.sin(i / n * 6.283) * r * ECKEN[i % n]];
    cx.save(); cx.translate(x, y); cx.rotate(a); cx.lineJoin = "round";
    cx.fillStyle = "#fffdf8"; cx.beginPath(); for (let i = 0; i < n; i++) cx[i ? "lineTo" : "moveTo"](...ecke(i)); cx.closePath(); cx.fill();
    cx.fillStyle = "rgba(31,28,24,.1)"; cx.beginPath(); cx.moveTo(...ecke(2)); cx.lineTo(...ecke(5)); cx.lineTo(r * .1, r * .15); cx.closePath(); cx.fill();
    cx.fillStyle = "rgba(31,28,24,.17)"; cx.beginPath(); cx.moveTo(...ecke(5)); cx.lineTo(...ecke(8)); cx.lineTo(-r * .15, r * .1); cx.closePath(); cx.fill();
    cx.strokeStyle = "#2c477c"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-r * .55, -r * .28); cx.lineTo(r * .3, -r * .52); cx.stroke();
    cx.strokeStyle = "rgba(31,28,24,.35)"; cx.lineWidth = .9; cx.beginPath(); cx.moveTo(...ecke(0)); cx.lineTo(r * .1, r * .15); cx.lineTo(...ecke(7)); cx.moveTo(r * .1, r * .15); cx.lineTo(...ecke(3)); cx.stroke();
    cx.strokeStyle = TINTE; cx.lineWidth = 1.4; cx.beginPath(); for (let i = 0; i < n; i++) cx[i ? "lineTo" : "moveTo"](...ecke(i)); cx.closePath(); cx.stroke(); cx.restore(); };
  // Figur auf dem Balkon: steht hinter dem Geländer, zielt mit dem Wurfarm und schwingt nach dem Wurf durch
  const figur = z => { const fx = 236, bw = (z.x > 0 ? Math.atan2(z.y, z.x) : -.6), nach = S.zustand === "ziel" || S.zustand === "start" ? 0 : .95 * (1 - S.schwung / 16), w = bw + nach, dx = Math.cos(w), dy = Math.sin(w);
    cx.lineCap = "round"; cx.lineJoin = "round";
    // Beine und Schuhe
    cx.fillStyle = "#2f3a4b"; cx.beginPath(); cx.roundRect(fx - 9.5, 128, 8.5, 40, 3.5); cx.roundRect(fx + 1, 128, 8.5, 40, 3.5); cx.fill();
    cx.fillStyle = TINTE; cx.beginPath(); cx.roundRect(fx - 10.5, 164.5, 13, 5.5, 2.7); cx.roundRect(fx, 164.5, 14, 5.5, 2.7); cx.fill();
    // hinterer Arm, locker an der Seite
    cx.strokeStyle = AKZ; cx.lineWidth = 7; cx.beginPath(); cx.moveTo(fx - 8, 103); cx.lineTo(fx - 12, 116); cx.stroke();
    cx.strokeStyle = HAUT; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(fx - 12.5, 118); cx.lineTo(fx - 11, 131); cx.stroke();
    // Rumpf: Hemd mit Kragen und Saum
    cx.fillStyle = AKZ; cx.beginPath(); cx.moveTo(fx - 11.5, 101); cx.quadraticCurveTo(fx, 92.5, fx + 11.5, 101); cx.lineTo(fx + 10, 132); cx.quadraticCurveTo(fx, 136, fx - 10, 132); cx.closePath(); cx.fill();
    cx.fillStyle = "rgba(0,0,0,.14)"; cx.beginPath(); cx.moveTo(fx - 11.5, 101); cx.quadraticCurveTo(fx - 9, 118, fx - 10, 132); cx.lineTo(fx - 5, 133.6); cx.quadraticCurveTo(fx - 5.5, 115, fx - 6.5, 98); cx.closePath(); cx.fill();
    cx.fillStyle = "#fffdf8"; cx.beginPath(); cx.moveTo(fx - 4, 95.5); cx.lineTo(fx + 1, 100.5); cx.lineTo(fx + 6, 95.5); cx.lineTo(fx + 4, 93.5); cx.lineTo(fx - 2, 93.5); cx.closePath(); cx.fill();
    // Hals, Kopf, Ohr, Haare, Gesicht (blickt zum Korb)
    cx.fillStyle = HAUT; cx.fillRect(fx - 2.5, 88, 6.5, 8); cx.beginPath(); cx.arc(fx + 1.5, 79, 10.6, 0, 7); cx.fill(); cx.beginPath(); cx.arc(fx + 12.2, 81.5, 1.7, 0, 7); cx.fill();
    cx.fillStyle = "#d9a983"; cx.beginPath(); cx.arc(fx - 4.5, 80.5, 2.6, 0, 7); cx.fill();
    cx.fillStyle = TINTE; cx.beginPath(); cx.arc(fx + 1.5, 77.5, 11.3, Math.PI * .98, Math.PI * 1.97); cx.quadraticCurveTo(fx + 9, 72.5, fx + 3, 71.8); cx.quadraticCurveTo(fx - 5, 71.5, fx - 6.2, 78.5); cx.quadraticCurveTo(fx - 8.6, 81.5, fx - 9.8, 79.8); cx.closePath(); cx.fill();
    cx.beginPath(); cx.arc(fx + 7.4, 79.6, 1.25, 0, 7); cx.fill();
    cx.strokeStyle = TINTE; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(fx + 5.2, 82.4, 3.6, .45, 1.3); cx.stroke(); cx.beginPath(); cx.moveTo(fx + 5.4, 76.4); cx.lineTo(fx + 9.4, 76.9); cx.stroke();
    // Wurfarm: Ärmel bis zum Ellbogen, Unterarm, Hand
    const el = { x: SCHULTER.x + dx * 11 - dy * 4, y: SCHULTER.y + dy * 11 + dx * 4 }, ha = { x: SCHULTER.x + dx * 21, y: SCHULTER.y + dy * 21 };
    cx.strokeStyle = AKZ; cx.lineWidth = 7.5; cx.beginPath(); cx.moveTo(SCHULTER.x - 2, SCHULTER.y + 1); cx.lineTo(el.x, el.y); cx.stroke();
    cx.strokeStyle = HAUT; cx.lineWidth = 5.2; cx.beginPath(); cx.moveTo(el.x, el.y); cx.lineTo(ha.x, ha.y); cx.stroke();
    cx.fillStyle = HAUT; cx.beginPath(); cx.arc(ha.x + dx * 1.5, ha.y + dy * 1.5, 3.7, 0, 7); cx.fill(); };
  // Papierkorb aus Drahtgitter: Rückwand, Papier darin, Rautengitter, Rand mit Glanz, bei Bedarf ein Rollbrett
  const korb = k => { const oben = BODEN - KH, kb = k.b / 2, ku = kb - 7, unten = BODEN - (k.v ? 9 : 2), form = () => { cx.beginPath(); cx.moveTo(k.x - kb, oben); cx.lineTo(k.x - ku, unten); cx.quadraticCurveTo(k.x, unten + 5, k.x + ku, unten); cx.lineTo(k.x + kb, oben); cx.closePath(); };
    cx.fillStyle = "rgba(31,28,24,.13)"; cx.beginPath(); cx.ellipse(k.x + 3, BODEN + 5, kb + 10, 5.5, 0, 0, 7); cx.fill();
    if (k.v) { cx.fillStyle = TINTE; cx.beginPath(); cx.roundRect(k.x - ku - 8, BODEN - 9, ku * 2 + 16, 4.5, 2); cx.fill(); for (const s of [-1, 1]) { cx.beginPath(); cx.arc(k.x + s * (ku + 1), BODEN - 3.6, 3.8, 0, 7); cx.fill(); } }
    // Innenraum: dunkle Rückwand, hinterer Rand
    form(); const g = cx.createLinearGradient(0, oben, 0, unten); g.addColorStop(0, "rgba(31,28,24,.3)"); g.addColorStop(1, "rgba(31,28,24,.08)"); cx.fillStyle = "#efe7d8"; cx.fill(); cx.fillStyle = g; cx.fill();
    cx.strokeStyle = AKZ; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(k.x, oben, kb, 6.5, 0, Math.PI, Math.PI * 2); cx.stroke(); cx.strokeStyle = "rgba(0,0,0,.28)"; cx.stroke();
    // was schon drin liegt
    cx.save(); form(); cx.clip(); const voll = Math.min(5, S.punkte); for (let i = 0; i < voll; i++) knaeuel(k.x + ((i * 37) % 5 - 2) / 2 * ku * .62, unten - 8 - Math.floor(i / 2) * 11, i * 1.7, 9); cx.restore();
    // Rautengitter über allem, dann Kanten
    cx.save(); form(); cx.clip(); cx.strokeStyle = "rgba(31,28,24,.72)"; cx.lineWidth = 1; cx.beginPath();
    for (let x = k.x - kb - KH; x < k.x + kb + KH; x += 9) { cx.moveTo(x, oben); cx.lineTo(x + KH * .62, BODEN); cx.moveTo(x, oben); cx.lineTo(x - KH * .62, BODEN); } cx.stroke(); cx.restore();
    cx.strokeStyle = TINTE; cx.lineWidth = 2.6; cx.lineJoin = "round"; cx.beginPath(); cx.moveTo(k.x - kb, oben); cx.lineTo(k.x - ku, unten); cx.quadraticCurveTo(k.x, unten + 5, k.x + ku, unten); cx.lineTo(k.x + kb, oben); cx.stroke();
    // vorderer Rand mit Glanzlicht
    cx.strokeStyle = AKZ; cx.lineWidth = 5.5; cx.beginPath(); cx.ellipse(k.x, oben, kb, 6.5, 0, 0, Math.PI); cx.stroke();
    cx.strokeStyle = "rgba(255,255,255,.5)"; cx.lineWidth = 1.6; cx.beginPath(); cx.ellipse(k.x, oben - .6, kb - 1, 6, 0, Math.PI * .58, Math.PI * .9); cx.stroke(); };
  const turm = (x, b, f) => { cx.fillStyle = f; cx.fillRect(x, -10, b, BODEN + 10);
    for (let i = 0, sx = x + 10; sx < x + b - 12; sx += 20, i++) for (let j = 0, sy = 8; sy < BODEN - 34; sy += 23, j++) { cx.fillStyle = (i * 7 + j * 13 + (x > 0 ? 3 : 0)) % 5 < 2 ? "#f0cf7a" : "rgba(255,255,255,.14)"; cx.fillRect(sx, sy, 11, 13); } };
  const zeichne = () => { const w = windJetzt(), k = S.korb;
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
    { const z = S.zustand === "ziel" || S.zustand === "start" ? ziel() : S.zuletztZiel, h = hand(z);
      cx.fillStyle = "rgba(255,255,255,.1)"; cx.fillRect(204, 78, 6, 92);                                    // Balkontür im Turm
      figur(z);
      cx.fillStyle = TINTE; cx.beginPath(); cx.roundRect(202, 170, 92, 8, 2); cx.fill(); cx.fillStyle = "#3b3630"; cx.fillRect(206, 178, 84, 4);
      cx.strokeStyle = TINTE; cx.lineWidth = 2; cx.lineCap = "butt"; cx.beginPath(); for (let x = 211; x <= 291; x += 10) { cx.moveTo(x, 143); cx.lineTo(x, 170); } cx.stroke();
      cx.lineWidth = 3.4; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(203, 142); cx.lineTo(293, 142); cx.stroke();
      if (S.zustand === "ziel") { let x = h.x, y = h.y, vx = z.x * z.k, vy = z.y * z.k; cx.fillStyle = TINTE;
        for (let i = 1; i <= 24; i++) { vy += K.G; vx *= K.LUFT; vy *= K.LUFT; x += vx; y += vy; if (i % 3 === 0) { cx.globalAlpha = .5 * (1 - i / 27); cx.beginPath(); cx.arc(x, y, 2.6, 0, 7); cx.fill(); } } cx.globalAlpha = 1; knaeuel(h.x + z.x * 5, h.y + z.y * 5, .4); } }
    // liegengebliebenes Papier
    for (const m of S.muell) knaeuel(m.x, BODEN - R + 1, m.a);
    // Papierkorb
    korb(k);
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
