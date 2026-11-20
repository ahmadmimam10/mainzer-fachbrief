#!/usr/bin/env node
// Holt die Wettervorhersage für Mainz (Open-Meteo, ohne Konto und ohne Schlüssel) und schreibt je Tag eine Wetterlage
// nach docs/daten/wetter.js. Das Intro der Seite wählt danach seine Variante (Jahreszeit kommt aus dem Datum).
// Schlägt nie fehl: Ohne Antwort bleibt die vorhandene Datei stehen, das Intro zeigt dann „sonne“.
//   node werkzeuge/wetter.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ZIEL = "docs/daten/wetter.js";
const URL_ = "https://api.open-meteo.com/v1/forecast?latitude=50.0&longitude=8.27&daily=weather_code,snowfall_sum&timezone=Europe%2FBerlin&forecast_days=7";

// WMO-Wettercodes → vier Lagen. Schnee gilt nur, wenn auch wirklich Schnee fällt; im Intro gibt es ihn nur im Winter.
function lage(code, schnee) {
  if ([71, 73, 75, 77, 85, 86].includes(code) || schnee >= 0.5) return "schnee";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "regen";
  if (code === 3 || code === 45 || code === 48) return "bewoelkt";
  return "sonne";                                  // 0 klar, 1 überwiegend klar, 2 teils bewölkt
}

try {
  const res = await fetch(URL_, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const d = (await res.json()).daily;
  if (!Array.isArray(d?.time) || !d.time.length) throw new Error("keine Tageswerte");
  const tage = {};
  d.time.forEach((tag, i) => { if (/^\d{4}-\d{2}-\d{2}$/.test(tag)) tage[tag] = lage(Number(d.weather_code[i]), Number(d.snowfall_sum?.[i]) || 0); });
  const neu = `/* Wetterlage je Tag in Mainz (Quelle: Open-Meteo, CC BY 4.0) – erzeugt von werkzeuge/wetter.mjs */\nwindow.FACHBRIEF_WETTER=${JSON.stringify(tage)};\n`;
  let alt = ""; try { alt = readFileSync(ZIEL, "utf8"); } catch {}
  if (neu !== alt) writeFileSync(ZIEL, neu);
  console.log("Wetter Mainz:", Object.entries(tage).map(([t, l]) => `${t.slice(5)} ${l}`).join(", "));
} catch (e) {
  console.log("Wetter nicht abrufbar (" + e.message + ") – vorhandene Datei bleibt.");
}
