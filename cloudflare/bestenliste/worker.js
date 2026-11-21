// Bestenliste für den Altpapier-Wurf (docs/blatt/spiel.js) – ein Cloudflare Worker mit einem KV-Speicher (Bindung LISTE).
//   GET  /  → { liste: [{ n: Name, p: Punkte }, …] }   die besten 20
//   POST /  → { name, punkte, dauer }                  trägt ein (je Name zählt der beste Wert)
// Gespeichert werden nur Name, Punktzahl und Tag des Eintrags. Für die Bremse gegen Dauerfeuer liegt ein
// gekürzter Fingerabdruck der Adresse für 60 Sekunden im Speicher – sonst nichts.
const ERLAUBT = ["https://boniblatt-mainz.de", "https://www.boniblatt-mainz.de", "http://localhost:8766", "http://127.0.0.1:8766"];
const SCHLUESSEL = "bestenliste", BEHALTEN = 50, ZEIGEN = 20, MAX_PUNKTE = 400;
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,11}$/u;
// Teilwort-Sperre nur für Eindeutiges (sonst träfe es Namen wie „Nazim“ oder „Lars Ch.“); der Rest nur als ganzer Name.
const SPERRE = /(hitler|siegheil|fick|fotze|hure|nutte|wichs|schlampe|penis|porn|nigg|kanak|schwuchtel|spast|missgeburt|fuck|bitch|cunt)|^(nazis?|arsch|sex|heil)$/i;

const antwort = (daten, status, kopf) => new Response(JSON.stringify(daten), { status, headers: kopf });
const lesen = async env => { try { const l = JSON.parse((await env.LISTE.get(SCHLUESSEL)) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
const oeffentlich = l => l.slice(0, ZEIGEN).map(e => ({ n: e.n, p: e.p }));

export default {
  async fetch(anfrage, env) {
    const herkunft = anfrage.headers.get("Origin") || "";
    const kopf = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin",
      "Access-Control-Allow-Origin": ERLAUBT.includes(herkunft) ? herkunft : ERLAUBT[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" };
    if (anfrage.method === "OPTIONS") return new Response(null, { status: 204, headers: kopf });
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
    const roh = new TextEncoder().encode((anfrage.headers.get("CF-Connecting-IP") || "?") + "|boniblatt");
    const spur = "r:" + [...new Uint8Array(await crypto.subtle.digest("SHA-256", roh))].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
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
