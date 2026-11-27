/* Boniblatt-Podcast: neueste Folge – erzeugt von Podcast/werkzeuge/veroeffentlichen.mjs.
   Am Tag des Erscheinens fliegt der Werbeflieger mit „Neue Podcast-Folge ist raus!“; der Podcast-Knopf glänzt an diesem und am nächsten Tag.
   Vorschau: ?podcast=neu */
window.BONIBLATT_PODCAST = {"neueste":{"id":"2026-11-24-strukturreform","nummer":1,"titel":"Das Kleingedruckte der Strukturreform","datum":"2026-11-24"},"tageNeu":1,"tageFlieger":0};
(function () {
  var p = window.BONIBLATT_PODCAST, n = p && p.neueste;
  if (!n) return;
  var q = new URLSearchParams(location.search);
  var heute = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(q.get("tag") || "") ? q.get("tag") : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  var tage = (Date.parse(heute) - Date.parse(n.datum)) / 864e5;
  var probe = q.get("podcast") === "neu";
  p.istNeu = probe || (tage >= 0 && tage <= (p.tageNeu == null ? 1 : p.tageNeu));          // Knopf glänzt mit „Neu“: Tag des Erscheinens und der Tag danach
  p.fliegt = probe || (tage >= 0 && tage <= (p.tageFlieger || 0));                       // Werbeflieger: nur am Tag des Erscheinens
  if (p.fliegt && !q.has("spruch")) (window.BONIBLATT_FLIEGER = window.BONIBLATT_FLIEGER || {})[heute] = "Neue Podcast-Folge ist raus!";
})();
