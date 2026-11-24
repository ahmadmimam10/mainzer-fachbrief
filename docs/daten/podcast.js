/* Boniblatt-Podcast: neueste Folge – erzeugt von Podcast/werkzeuge/veroeffentlichen.mjs.
   3 Tage nach dem Erscheinen fliegt der Werbeflieger mit „Neue Podcast-Folge ist raus!“ und der Podcast-Knopf glänzt.
   Vorschau: ?podcast=neu */
window.BONIBLATT_PODCAST = {"neueste":{"id":"2026-11-24-strukturreform","nummer":1,"titel":"Das Kleingedruckte der Strukturreform","datum":"2026-11-24"},"tageNeu":3};
(function () {
  var p = window.BONIBLATT_PODCAST, n = p && p.neueste;
  if (!n) return;
  var q = new URLSearchParams(location.search);
  var heute = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(q.get("tag") || "") ? q.get("tag") : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  var tage = (Date.parse(heute) - Date.parse(n.datum)) / 864e5;
  p.istNeu = q.get("podcast") === "neu" || (tage >= 0 && tage <= (p.tageNeu || 3));
  if (p.istNeu && !q.has("spruch")) (window.BONIBLATT_FLIEGER = window.BONIBLATT_FLIEGER || {})[heute] = "Neue Podcast-Folge ist raus!";
})();
