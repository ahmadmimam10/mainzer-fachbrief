// Gemeinsame Hilfsfunktionen für Abruf und Redaktion des Mainzer Fachbriefs.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TZ = "Europe/Berlin";
export const UA = "Mozilla/5.0 (compatible; MainzerFachbrief/1.0; +https://github.com/ahmadmimam10/mainzer-fachbrief)";

const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ensp: " ", emsp: " ", thinsp: " ",
  ndash: "–", mdash: "—", shy: "", hellip: "…", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘",
  rsquo: "’", sbquo: "‚", laquo: "«", raquo: "»", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä",
  Ouml: "Ö", Uuml: "Ü", szlig: "ß", eacute: "é", egrave: "è", agrave: "à", aacute: "á", ccedil: "ç",
  euro: "€", sect: "§", middot: "·", bull: "•", zwnj: "", zwj: "", lrm: "", rlm: "", copy: "©", reg: "®",
};

/** HTML/XML-Fragment in schlichten Text verwandeln (Tags weg, Entities aufgelöst, Leerraum normalisiert). */
export function text(input = "") {
  return String(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
        return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
      }
      return ENT[e] ?? ENT[e.toLowerCase()] ?? m;
    })
    .replace(/[\u00ad\u200b-\u200f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
}

export function berlinDay(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function berlinTime(d = new Date()) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
}

export function dayOffset(day, n) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const MONATE = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];

/** Datum aus RSS-, ISO- oder deutscher Schreibweise als YYYY-MM-DD (Berliner Tag). */
export function parseDate(raw) {
  const s = text(raw);
  if (!s) return "";
  if (/\d{1,2}:\d{2}/.test(s) && (/[a-z]{3},?\s+\d{1,2}\s+[a-z]{3}\s+\d{4}/i.test(s) || /\d{4}-\d{2}-\d{2}T/.test(s))) {
    const d = new Date(s);
    if (!Number.isNaN(+d)) return berlinDay(d);
  }
  // Bluesky-Form ohne Wochentag: „20 Nov 2026 09:00 +0000“
  const bsky = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{1,2}:\d{2})(?::\d{2})?\s*([+-]\d{4}|Z|GMT|UTC)?/);
  if (bsky) {
    const d = new Date(`${bsky[2]} ${bsky[1]}, ${bsky[3]} ${bsky[4]} ${bsky[5] && bsky[5] !== "Z" ? bsky[5] : "+0000"}`);
    if (!Number.isNaN(+d)) return berlinDay(d);
  }
  let m = s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/\b(\d{1,2})\.\s?(\d{1,2})\.\s?(20\d{2})\b/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.toLowerCase().match(/\b(\d{1,2})\.\s*(januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+(20\d{2})\b/);
  if (m) {
    const i = MONATE.indexOf(m[2] === "maerz" ? "märz" : m[2]);
    return `${m[3]}-${String(i + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  m = s.toLowerCase().match(/\b(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+(\d{1,2}),\s*(20\d{2})\b/);
  if (m) return `${m[3]}-${String(MONATE.indexOf(m[1]) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  if (/^[a-z]{3},?\s+\d{1,2}\s+[a-z]{3}\s+\d{4}/i.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(+d)) return berlinDay(d);
  }
  return "";
}

/** Link säubern: absolute URL, ohne Tracking-Parameter und Anker. */
export function cleanUrl(href, base) {
  try {
    const u = new URL(text(href), base);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return "";
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|pk_|mc_|wt_|at_|fbclid|gclid|ref$)/i.test(k)) u.searchParams.delete(k);
      if (k === "p" && /(^|\.)mainz\.de$/.test(u.hostname)) u.searchParams.delete(k);
    }
    u.hash = "";
    return u.href;
  } catch {
    return "";
  }
}

/** Vergleichsschlüssel einer URL (ohne www, ohne Schrägstrich am Ende, Kleinschreibung). */
export function urlKey(url) {
  const u = new URL(url);
  return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "") + u.search).toLowerCase();
}

export function idOf(url) {
  return createHash("sha1").update(urlKey(url)).digest("hex").slice(0, 10);
}

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, file), "utf8"));
  } catch (error) {
    if (fallback !== undefined && (error.code === "ENOENT")) return fallback;
    throw error;
  }
}

export async function writeJson(file, data, pretty = true) {
  const full = path.join(ROOT, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(data, null, pretty ? 1 : 0) + "\n", "utf8");
}

/** Text auf eine Länge kürzen, an Wortgrenze, mit Auslassungszeichen. */
export function cut(s, n) {
  if (!s || s.length <= n) return s || "";
  return s.slice(0, n).replace(/\s+\S*$/, "").replace(/[,;:–-]+$/, "") + " …";
}
