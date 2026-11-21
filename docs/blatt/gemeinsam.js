/* Entwürfe für den Nachrichtenteil: gemeinsame Teile – Daten laden, kleine Helfer, Einblenden beim Scrollen */
const E = (() => {
  const RESSORTS = [
    { id: "jugendhilfeplanung", lang: "Jugendhilfeplanung", kurz: "Planung", zwei: ["Jugendhilfe-", "planung"] },
    { id: "fruehe-hilfen", lang: "Frühe Hilfen & Kinderschutz", kurz: "Frühe Hilfen", zwei: ["Frühe Hilfen &", "Kinderschutz"] },
    { id: "quartiersmanagement", lang: "Quartiersmanagement", kurz: "Quartier", zwei: ["Quartiers-", "management"] },
  ];
  const q = new URLSearchParams(location.search);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let daten, ausgabe;
  async function laden() {
    daten = await (await fetch("daten/ausgaben.json")).json();
    ausgabe = daten.ausgaben.find(a => a.datum === q.get("ausgabe")) || daten.ausgaben[0];
    return ausgabe;
  }
  const tag = () => new Date(ausgabe.datum + "T12:00:00");
  const datum = opt => tag().toLocaleDateString("de-DE", opt);
  const quelle = m => { const s = daten.quellen[m.quelle] || {}; return s.kurz || s.name || m.quelle; };
  const teile = id => { const l = ausgabe.ressorts[id] || []; return { alle: l, auf: l.find(m => m.stufe === "aufmacher"), wichtig: l.filter(m => m.stufe === "wichtig"), kurz: l.filter(m => m.stufe === "kurz") }; };
  // Woher kommen die Meldungen? [Name, Anzahl]
  const herkunft = id => [["mainz", "Mainz"], ["land", "Land"], ["bund", "Bund"], ["fach", "Fachwelt"]].map(([k, n]) => [n, (ausgabe.ressorts[id] || []).filter(m => m.rubrik === k).length]);
  const start = () => { const h = location.hash.slice(1); return RESSORTS.some(r => r.id === h) ? h : RESSORTS[0].id; };
  const gesamt = () => RESSORTS.reduce((n, r) => n + (ausgabe.ressorts[r.id] || []).length, 0);
  // Die ersten n Wörter eines Titels in <em> – für den Wechsel zwischen zwei Schriften in einer Überschrift
  const gemischt = (text, n = 2) => { const w = String(text).split(" "); return "<em>" + esc(w.slice(0, n).join(" ")) + "</em> " + esc(w.slice(n).join(" ")); };
  // Einblenden: Alles mit data-ein bekommt die Klasse „da“, sobald es ins Bild kommt (--i staffelt die Verzögerung)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  // ?still zeigt alles sofort und ohne Bewegung (für Bilder)
  const still = q.has("still");
  if (still) document.documentElement.classList.add("e-still");
  const zeigen = wurzel => wurzel.querySelectorAll("[data-ein]").forEach((el, i) => { el.style.setProperty("--i", i % 9); if (still) el.classList.add("da"); else io.observe(el); });
  const wahl = (id, ohneSprung) => { history.replaceState(null, "", "#" + id); document.getElementById("e").dataset.r = id; };
  const warte = ms => new Promise(r => setTimeout(r, ms));
  return { RESSORTS, q, esc, laden, tag, datum, quelle, teile, herkunft, start, gesamt, gemischt, zeigen, wahl, warte, get ausgabe() { return ausgabe; }, get daten() { return daten; }, setze(d) { const a = daten.ausgaben.find(x => x.datum === d); if (a) ausgabe = a; return ausgabe; } };
})();
