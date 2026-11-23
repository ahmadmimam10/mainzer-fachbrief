/* Anonyme Zählung: Wie oft wird das Blatt aufgerufen, welche Meldungen werden angeklickt?
   Gesendet wird nur „Aufruf Startseite“, „Klick auf diese Adresse“ oder „Hörfassung gestartet“ – ohne Cookie, ohne Kennung,
   ohne gespeicherte Adresse. Der Dienst zählt je Tag hoch (cloudflare/bestenliste/worker.js); auswerten lässt es sich in
   verwaltung.html. Wer im Browser „Nicht verfolgen“ eingestellt hat, wird nicht gezählt. */
(() => {
  const ZIEL = "https://boniblatt-bestenliste.ahmadmimam10.workers.dev/z";
  const q = new URLSearchParams(location.search);
  const lokal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  if (lokal && !q.has("zaehltest")) return;                  // Vorschau am eigenen Rechner zählt nicht
  if (q.has("still") || window.top !== window) return;        // Bilder und die eingebettete Vorschau in der Werkstatt auch nicht
  const seite = (document.currentScript && document.currentScript.dataset.seite) || "start";
  const sende = (a, z, t) => {
    try {
      const d = JSON.stringify({ a, z, t, g: matchMedia("(max-width: 760px)").matches ? "handy" : "pc" });
      if (!(navigator.sendBeacon && navigator.sendBeacon(ZIEL, d))) fetch(ZIEL, { method: "POST", body: d, keepalive: true, mode: "no-cors" }).catch(() => {});
    } catch { /* Zählen darf nie stören */ }
  };
  const einmal = new Set();
  const aktion = z => { if (!einmal.has(z)) { einmal.add(z); sende("aktion", z); } };   // je Seitenaufruf höchstens einmal

  sende("aufruf", seite);

  const klick = e => {
    const el = e.target instanceof Element ? e.target : null; if (!el) return;
    if (el.closest(".daumen")) { if (el.closest(".daumen .d")) aktion("daumen"); return; }   // Abstimmen ist kein Klick auf die Meldung
    if (el.closest(".teil, .teil-menue")) { if (el.closest(".teil-menue [data-a]")) aktion("teilen"); return; }
    const a = el.closest("a[href]");
    if (a) {
      let u; try { u = new URL(a.href); } catch { return; }
      if (!/^https?:$/.test(u.protocol) || u.host === location.host) return;
      const k = a.querySelector("h2, h3") || a.querySelector(":scope > span:not(.qu):not(.etikett)") || a;
      return sende("klick", u.href, (k.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160));
    }
    if (el.closest("button.au-archiv")) return aktion("archiv");
    const r = el.closest(".bb-reiter button[data-r]"); if (r) return aktion("ressort-" + r.dataset.r);
    if (el.closest(".bb-spiel canvas")) return aktion("spiel");
  };
  addEventListener("click", klick, true);
  addEventListener("auxclick", e => { if (e.button === 1) klick(e); }, true);   // Mittelklick öffnet im neuen Tab
  addEventListener("play", e => { if (e.target instanceof HTMLMediaElement) aktion("ton"); }, true);
})();
