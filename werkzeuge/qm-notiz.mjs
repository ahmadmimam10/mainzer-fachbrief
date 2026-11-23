#!/usr/bin/env node
/**
 * Notizen des Qualitätsmanagers prüfen (daten/qm-notizen.json) und seinen Monatsvorschlag aus den Leserstimmen
 * (daten/leser-vorschlag.json) – beides wird in docs/verwaltung.html angezeigt.
 *   node werkzeuge/qm-notiz.mjs pruefen     meldet Formatfehler; Exit-Code 2, wenn etwas nicht stimmt
 * Format und Regeln: QUALITAET.md, Abschnitt „Notizen“.
 */
import { readJson } from "./lib.mjs";
const BEREICHE = ["quelle", "abruf", "webseite", "ausgabe", "gremien", "system"], AUFWAND = ["klein", "mittel", "groß"], TAG = /^\d{4}-\d{2}-\d{2}$/, LINK = /https?:\/\//i;
const d = await readJson("daten/qm-notizen.json", null), f = [];
if (!d || typeof d !== "object") { console.error("daten/qm-notizen.json fehlt oder ist kein gültiges JSON."); process.exit(2); }
const text = (wert, min, max, wo) => { if (typeof wert !== "string" || wert.trim().length < min || wert.length > max) f.push(`${wo}: Text mit ${min}–${max} Zeichen erwartet`); };
if (!d.lauf || !TAG.test(d.lauf.datum || "")) f.push("lauf.datum fehlt (JJJJ-MM-TT)"); else { text(d.lauf.kurz, 20, 400, "lauf.kurz"); if (d.lauf.geprueft != null) text(d.lauf.geprueft, 3, 200, "lauf.geprueft"); if (!Array.isArray(d.lauf.erledigt) || d.lauf.erledigt.some(x => typeof x !== "string" || x.length > 240)) f.push("lauf.erledigt: Liste kurzer Sätze erwartet (darf leer sein)"); }
if (!Array.isArray(d.laeufe) || d.laeufe.length > 12) f.push("laeufe: Liste mit höchstens 12 Einträgen erwartet");
if (!Array.isArray(d.notizen)) f.push("notizen: Liste erwartet (darf leer sein)");
else {
  if (d.notizen.length > 20) f.push("höchstens 20 Notizen");
  const ids = new Set();
  d.notizen.forEach((n, i) => { const wo = `notizen[${i}]${n && n.id ? " (" + n.id + ")" : ""}`;
    if (!n || typeof n !== "object") return f.push(wo + ": Objekt erwartet");
    if (!/^[a-z0-9][a-z0-9-]{3,59}$/.test(n.id || "")) f.push(wo + ": id nur aus Kleinbuchstaben, Ziffern, Bindestrich (4–60 Zeichen)"); else if (ids.has(n.id)) f.push(wo + ": id doppelt"); else ids.add(n.id);
    if (!TAG.test(n.seit || "") || !TAG.test(n.zuletzt || "")) f.push(wo + ": seit und zuletzt als JJJJ-MM-TT");
    if (!BEREICHE.includes(n.bereich)) f.push(wo + ": bereich muss einer von " + BEREICHE.join(", ") + " sein");
    if (!AUFWAND.includes(n.aufwand)) f.push(wo + ": aufwand muss klein, mittel oder groß sein");
    if (typeof n.dringend !== "boolean") f.push(wo + ": dringend muss true oder false sein");
    text(n.titel, 12, 110, wo + ".titel"); text(n.lage, 40, 700, wo + ".lage"); text(n.vorschlag, 20, 700, wo + ".vorschlag"); if (n.versucht) text(n.versucht, 5, 500, wo + ".versucht");
    if (LINK.test(n.titel || "")) f.push(wo + ": kein Link im Titel"); });
}
// Monatsvorschlag aus den Leserstimmen (QUALITAET.md, Schritt 10a und „Monatsvorschlag“)
const v = await readJson("daten/leser-vorschlag.json", { vorschlaege: [] }), STATUS = ["offen", "umgesetzt", "teilweise", "abgelehnt", "verfallen"];
if (!v || !Array.isArray(v.vorschlaege) || v.vorschlaege.length > 24) f.push("leser-vorschlag.json: vorschlaege als Liste mit höchstens 24 Einträgen erwartet");
else {
  if (v.vorschlaege.filter(x => x && x.status === "offen").length > 1) f.push("leser-vorschlag.json: höchstens ein Vorschlag darf offen sein");
  v.vorschlaege.forEach((x, i) => { const wo = `leser-vorschlag.json vorschlaege[${i}]${x && x.id ? " (" + x.id + ")" : ""}`;
    if (!x || typeof x !== "object") return f.push(wo + ": Objekt erwartet");
    if (!/^leser-\d{4}-\d{2}$/.test(x.id || "") || !/^\d{4}-\d{2}$/.test(x.monat || "") || x.id !== "leser-" + x.monat) f.push(wo + ": id muss leser-JJJJ-MM sein und zu monat passen");
    if (x.erstellt != null && !TAG.test(x.erstellt)) f.push(wo + ": erstellt als JJJJ-MM-TT");
    if (!STATUS.includes(x.status)) f.push(wo + ": status muss einer von " + STATUS.join(", ") + " sein");
    text(x.lage, 20, 900, wo + ".lage");
    if (x.status !== "offen") text(x.umsetzung, 8, 600, wo + ".umsetzung");
    if (!Array.isArray(x.aenderungen) || x.aenderungen.length > 3) f.push(wo + ": aenderungen als Liste mit höchstens drei Einträgen");
    else x.aenderungen.forEach((a, k) => { const w2 = `${wo}.aenderungen[${k}]`;
      if (!a || !["Auswahlregeln", "Gewichtung"].includes(a.abschnitt)) f.push(w2 + ": abschnitt muss Auswahlregeln oder Gewichtung sein");
      text(a && a.nachher, 10, 600, w2 + ".nachher"); text(a && a.warum, 10, 400, w2 + ".warum"); if (a && a.vorher && a.vorher.length > 600) f.push(w2 + ".vorher: höchstens 600 Zeichen"); });
  });
}
if (f.length) { console.error(`daten/qm-notizen.json / daten/leser-vorschlag.json – ${f.length} Fehler:\n- ` + f.join("\n- ")); process.exit(2); }
console.log(`daten/qm-notizen.json in Ordnung: Lauf vom ${d.lauf.datum}, ${d.notizen.length} Notiz${d.notizen.length === 1 ? "" : "en"}. daten/leser-vorschlag.json in Ordnung: ${v.vorschlaege.length} Vorschläge.`);
