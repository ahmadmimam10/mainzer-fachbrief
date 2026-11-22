// Kleiner Dienst des Boniblatts – ein Cloudflare Worker mit einem KV-Speicher (Bindung LISTE) und einer D1-Datenbank (Bindung DB).
//
// Bestenliste für den Altpapier-Wurf (docs/blatt/spiel.js)
//   GET  /  → { liste: [{ n: Name, p: Punkte }, …] }   die besten 20
//   POST /  → { name, punkte, dauer }                  trägt ein (je Name zählt der beste Wert)
//   Gespeichert werden nur Name, Punktzahl und Tag des Eintrags. Für die Bremse gegen Dauerfeuer liegt ein
//   gekürzter Fingerabdruck der Adresse für 60 Sekunden im Speicher – sonst nichts.
//
// Anonyme Zählung (docs/blatt/zaehlung.js)
//   POST /z → { a: "aufruf" | "klick" | "aktion", z: Ziel, t: Titel, g: "handy" | "pc" }
//   Es wird nur hochgezählt: Tag, Art, Ziel, Anzahl. Keine Adresse, keine Kennung, kein Cookie, keine Uhrzeit –
//   aus den Zahlen lässt sich kein einzelner Besuch und keine Person ablesen.
//
// Verwaltung (docs/verwaltung.html) – nur mit dem Passwort aus dem Secret ADMIN_PASSWORT (Kopfzeile „Authorization: Bearer …“)
//   GET /admin/statistik?von=JJJJ-MM-TT&bis=JJJJ-MM-TT → Aufrufe und Klicks je Tag, Seiten, Geräte, Aktionen, meistgeklickte Links
//   GET /admin/merk → { aus: [Kennungen] } · POST /admin/merk { id, aus: true|false } – welche Notizen des Qualitätsmanagers ausgeblendet sind
//   Nach acht falschen Versuchen ist die Anmeldung für 15 Minuten gesperrt.
const ERLAUBT = ["https://boniblatt-mainz.de", "https://www.boniblatt-mainz.de", "http://localhost:8766", "http://127.0.0.1:8766"];
const SCHLUESSEL = "bestenliste", BEHALTEN = 50, ZEIGEN = 20, MAX_PUNKTE = 400;
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,11}$/u;
// Teilwort-Sperre nur für Eindeutiges (sonst träfe es Namen wie „Nazim“ oder „Lars Ch.“); der Rest nur als ganzer Name.
const SPERRE = /(hitler|siegheil|fick|fotze|hure|nutte|wichs|schlampe|penis|porn|nigg|kanak|schwuchtel|spast|missgeburt|fuck|bitch|cunt)|^(nazis?|arsch|sex|heil)$/i;
const SEITEN = ["start", "werkstatt", "kalender"], AKTION = /^[a-z][a-z0-9:-]{1,39}$/, TAG = /^\d{4}-\d{2}-\d{2}$/;
const FEHL_MAX = 8, FEHL_SPERRE = 900;

const antwort = (daten, status, kopf) => new Response(JSON.stringify(daten), { status, headers: kopf });
const lesen = async env => { try { const l = JSON.parse((await env.LISTE.get(SCHLUESSEL)) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
const oeffentlich = l => l.slice(0, ZEIGEN).map(e => ({ n: e.n, p: e.p }));
const heute = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
const hash = async s => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const gleich = async (a, b) => { const x = await hash(a), y = await hash(b); let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]; return d === 0; };

// Bremse der Zählung: nur im Arbeitsspeicher dieser Instanz, wird nie gespeichert
const takt = new Map();
function zuViel(ip) {
  const jetzt = Date.now(), e = takt.get(ip);
  if (takt.size > 5000) takt.clear();
  if (!e || jetzt - e.t > 60000) { takt.set(ip, { t: jetzt, n: 1 }); return false; }
  return ++e.n > 40;
}

async function zaehlen(anfrage, env, herkunft, text) {
  let d; try { d = JSON.parse(text); } catch { return; }
  if (!d || typeof d !== "object" || zuViel(anfrage.headers.get("CF-Connecting-IP") || "?")) return;
  // Aufrufe von der lokalen Vorschau landen unter dem Tag „test“ und tauchen in keiner Auswertung auf
  const tag = herkunft.startsWith("http://") ? "test" : heute();
  const plus = (art, ziel) => env.DB.prepare("INSERT INTO zaehlung (tag, art, ziel, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT(tag, art, ziel) DO UPDATE SET n = n + 1").bind(tag, art, ziel);
  const sql = [];
  if (d.a === "aufruf" && SEITEN.includes(d.z)) {
    sql.push(plus("aufruf", d.z));
    if (d.g === "handy" || d.g === "pc") sql.push(plus("geraet", d.g));
  } else if (d.a === "klick" && typeof d.z === "string") {
    let u; try { u = new URL(d.z); } catch { return; }
    if (!/^https?:$/.test(u.protocol) || d.z.length > 400) return;
    u.hash = "";
    const ziel = u.href, titel = String(d.t ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
    sql.push(plus("klick", ziel));
    if (titel) sql.push(env.DB.prepare("INSERT OR IGNORE INTO titel (ziel, titel) VALUES (?1, ?2)").bind(ziel, titel));
  } else if (d.a === "aktion" && typeof d.z === "string" && AKTION.test(d.z)) {
    sql.push(plus("aktion", d.z));
  }
  if (sql.length) await env.DB.batch(sql);
}

async function verwaltung(anfrage, env, url, kopf) {
  if (anfrage.method !== "GET" && !(anfrage.method === "POST" && url.pathname === "/admin/merk")) return antwort({ fehler: "Nicht erlaubt." }, 405, kopf);
  if (!env.ADMIN_PASSWORT) return antwort({ fehler: "Es ist noch kein Passwort hinterlegt (Secret ADMIN_PASSWORT)." }, 503, kopf);
  const fehl = Number(await env.LISTE.get("adminfehl")) || 0;
  if (fehl >= FEHL_MAX) return antwort({ fehler: "Zu viele falsche Versuche. In 15 Minuten geht es wieder." }, 429, kopf);
  let angabe = (anfrage.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  try { angabe = decodeURIComponent(angabe); } catch { angabe = ""; }   // die Seite schickt es URL-kodiert, weil Kopfzeilen keine Umlaute vertragen
  if (!angabe || !(await gleich(angabe, env.ADMIN_PASSWORT))) {
    await env.LISTE.put("adminfehl", String(fehl + 1), { expirationTtl: FEHL_SPERRE });
    return antwort({ fehler: "Das Passwort stimmt nicht." }, 401, kopf);
  }
  if (url.pathname === "/admin/merk") {
    let aus = []; try { const l = JSON.parse((await env.LISTE.get("merk")) || "[]"); if (Array.isArray(l)) aus = l; } catch { /* leer */ }
    if (anfrage.method === "POST") {
      let d; try { d = await anfrage.json(); } catch { return antwort({ fehler: "Die Angaben waren nicht lesbar." }, 400, kopf); }
      const id = String(d.id ?? "");
      if (!/^[a-z0-9][a-z0-9-]{3,59}$/.test(id)) return antwort({ fehler: "Unbekannte Notiz." }, 400, kopf);
      aus = aus.filter(x => x !== id); if (d.aus) aus.push(id);
      aus = aus.slice(-200); await env.LISTE.put("merk", JSON.stringify(aus));
    }
    return antwort({ aus }, 200, kopf);
  }
  if (url.pathname !== "/admin/statistik") return antwort({ fehler: "Unbekannt." }, 404, kopf);

  const bis = TAG.test(url.searchParams.get("bis") || "") ? url.searchParams.get("bis") : heute();
  const von = TAG.test(url.searchParams.get("von") || "") ? url.searchParams.get("von") : new Date(Date.parse(bis) - 29 * 864e5).toISOString().slice(0, 10);
  const wo = "tag BETWEEN ?1 AND ?2";
  const [tage, summen, top, erste] = await env.DB.batch([
    env.DB.prepare(`SELECT tag, art, SUM(n) AS n FROM zaehlung WHERE ${wo} AND art IN ('aufruf', 'klick') GROUP BY tag, art ORDER BY tag`).bind(von, bis),
    env.DB.prepare(`SELECT art, ziel, SUM(n) AS n FROM zaehlung WHERE ${wo} AND art IN ('aufruf', 'geraet', 'aktion') GROUP BY art, ziel ORDER BY n DESC`).bind(von, bis),
    env.DB.prepare(`SELECT z.ziel, t.titel, SUM(z.n) AS n FROM zaehlung z LEFT JOIN titel t ON t.ziel = z.ziel WHERE ${wo} AND z.art = 'klick' GROUP BY z.ziel ORDER BY n DESC LIMIT 30`).bind(von, bis),
    env.DB.prepare("SELECT MIN(tag) AS tag FROM zaehlung WHERE tag != 'test'"),
  ]);
  const jeTag = {};
  for (const z of tage.results) (jeTag[z.tag] ||= { tag: z.tag, aufrufe: 0, klicks: 0 })[z.art === "aufruf" ? "aufrufe" : "klicks"] = z.n;
  const gruppe = art => Object.fromEntries(summen.results.filter(z => z.art === art).map(z => [z.ziel, z.n]));
  return antwort({ von, bis, seit: erste.results[0]?.tag || null, tage: Object.values(jeTag), seiten: gruppe("aufruf"), geraete: gruppe("geraet"), aktionen: gruppe("aktion"),
    top: top.results.map(z => ({ ziel: z.ziel, titel: z.titel || "", n: z.n })) }, 200, kopf);
}

export default {
  async fetch(anfrage, env, ctx) {
    const herkunft = anfrage.headers.get("Origin") || "", url = new URL(anfrage.url);
    const kopf = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin",
      "Access-Control-Allow-Origin": ERLAUBT.includes(herkunft) ? herkunft : ERLAUBT[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" };
    if (anfrage.method === "OPTIONS") return new Response(null, { status: 204, headers: kopf });

    if (url.pathname === "/z") {
      if (anfrage.method === "POST" && ERLAUBT.includes(herkunft)) {
        const text = (await anfrage.text()).slice(0, 2000);   // erst lesen, dann antworten – gezählt wird danach im Hintergrund
        ctx.waitUntil(zaehlen(anfrage, env, herkunft, text).catch(() => {}));
      }
      return new Response(null, { status: 204, headers: kopf });
    }
    if (url.pathname.startsWith("/admin/")) return verwaltung(anfrage, env, url, kopf);
    if (url.pathname !== "/") return antwort({ fehler: "Unbekannt." }, 404, kopf);

    if (anfrage.method === "GET") return antwort({ liste: oeffentlich(await lesen(env)) }, 200, kopf);
    if (anfrage.method !== "POST") return antwort({ fehler: "Nicht erlaubt." }, 405, kopf);
    if (!ERLAUBT.includes(herkunft)) return antwort({ fehler: "Einträge gehen nur von der Seite des Boniblatts aus." }, 403, kopf);

    let d; try { d = await anfrage.json(); } catch { return antwort({ fehler: "Die Angaben waren nicht lesbar." }, 400, kopf); }
    const name = String(d.name ?? "").normalize("NFC").replace(/\s+/g, " ").trim(), punkte = Number(d.punkte), dauer = Number(d.dauer);
    if (!NAME.test(name)) return antwort({ fehler: "Bitte 2 bis 12 Zeichen: Buchstaben, Ziffern, Leerzeichen, Punkt oder Strich." }, 400, kopf);
    if (SPERRE.test(name.replace(/[ ._-]/g, ""))) return antwort({ fehler: "Diesen Namen nehmen wir nicht auf." }, 400, kopf);
    // Plausibel? Ganze Zahl im Rahmen, und jeder Treffer braucht mindestens anderthalb Sekunden.
    if (!Number.isInteger(punkte) || punkte < 1 || punkte > MAX_PUNKTE || !(dauer >= punkte * 1.5) || dauer > 7200) return antwort({ fehler: "Dieses Ergebnis kann nicht stimmen." }, 400, kopf);

    // Bremse: je Adresse ein Eintrag pro Minute
    const spur = "r:" + [...(await hash((anfrage.headers.get("CF-Connecting-IP") || "?") + "|boniblatt"))].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
    if (await env.LISTE.get(spur)) return antwort({ fehler: "Kurz durchatmen – in einer Minute geht der nächste Eintrag." }, 429, kopf);
    await env.LISTE.put(spur, "1", { expirationTtl: 60 });

    const liste = await lesen(env), klein = name.toLowerCase(), alt = liste.find(e => e.n.toLowerCase() === klein);
    if (alt) { if (punkte > alt.p) { alt.p = punkte; alt.z = new Date().toISOString().slice(0, 10); } }
    else liste.push({ n: name, p: punkte, z: new Date().toISOString().slice(0, 10) });
    liste.sort((a, b) => b.p - a.p || (a.z < b.z ? -1 : a.z > b.z ? 1 : 0));
    const neu = liste.slice(0, BEHALTEN);
    await env.LISTE.put(SCHLUESSEL, JSON.stringify(neu));
    const stelle = neu.findIndex(e => e.n.toLowerCase() === klein);
    return antwort({ liste: oeffentlich(neu), name: stelle >= 0 ? neu[stelle].n : name, platz: stelle >= 0 ? stelle + 1 : 0 }, 200, kopf);
  },
};
