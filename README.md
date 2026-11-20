# Mainzer Fachbrief

Der tägliche Morgenüberblick für **Jugendhilfeplanung**, **Frühe Hilfen & Kinderschutz** und
**Quartiersmanagement** in Mainz – als Zeitungsseite im Netz:
**https://ahmadmimam10.github.io/mainzer-fachbrief/**

Direktlinks je Ressort: `#jugendhilfeplanung`, `#fruehe-hilfen`, `#quartiersmanagement`
(z. B. `https://ahmadmimam10.github.io/mainzer-fachbrief/#fruehe-hilfen`).

Der Fachbrief ersetzt die früheren Make.com-Szenarien (Scraping/RSS → Notion → DeepSeek → E-Mail).
Keine amtliche Veröffentlichung der Stadt Mainz.

## So läuft es

| Schritt | Wer | Wann | Was |
|---|---|---|---|
| 1. Quellen abrufen | GitHub Actions (`.github/workflows/sammeln.yml`) | mehrmals täglich | `werkzeuge/sammeln.mjs` liest alle Quellen aus `quellen.json`, legt neue Meldungen im Pool ab (`daten/pool/`), aktualisiert Ratstermine und Quellenstatus |
| 2. Redaktion | Claude-Routine in der Cloud | täglich 04:00 UTC (5 Uhr Winter-, 6 Uhr Sommerzeit) | sichtet die offenen Kandidaten nach `REDAKTION.md`, wählt je Ressort höchstens 12 Meldungen, schreibt `daten/ausgaben/JJJJ-MM-TT.json` |
| 3. Veröffentlichen | GitHub Actions (`seite.yml`) → GitHub Pages | nach jeder Änderung | veröffentlicht den Ordner `docs/` |

Nichts davon läuft auf einem privaten Rechner.

## Ordner

- `quellen.json` – alle Quellen (RSS, Übersichtsseiten, Ratsinformationssystem, Landtag-Schnittstelle …)
- `REDAKTION.md` – die Redaktionsregeln (fachliche Profile der drei Ressorts, Auswahl- und Gewichtungsregeln)
- `werkzeuge/sammeln.mjs` – Quellenabruf · `werkzeuge/redaktion.mjs` – Kandidatenliste, Prüfung, Seitendaten
- `daten/` – Pool, bekannte Links, Ausgaben · `docs/` – die Webseite (`index.html`, `daten/*.json`, Schriften)

## Häufige Änderungen

**Quelle hinzufügen oder anpassen:** Eintrag in `quellen.json` (Typ `rss` oder `html` mit `muster` für die
Artikel-Links). Testen ohne zu speichern:

```bash
node werkzeuge/sammeln.mjs --probe --nur=quellen-id
```

Bei einer neuen Übersichtsseite einmal den Grundstand setzen, damit alte Meldungen nicht als neu gelten:

```bash
node werkzeuge/sammeln.mjs --grundstand --nur=quellen-id
```

**Auswahlregeln ändern:** `REDAKTION.md` bearbeiten – die Routine liest die Datei jeden Morgen neu.

**Ausgabe von Hand nachholen:**

```bash
node werkzeuge/redaktion.mjs vorbereiten
# arbeit/kandidaten.md lesen, daten/ausgaben/JJJJ-MM-TT.json schreiben (Format siehe REDAKTION.md)
node werkzeuge/redaktion.mjs abschliessen
```

**Lokal ansehen:**

```bash
python -m http.server 8765 --directory docs
```

Benötigt Node.js 20 oder neuer, keine weiteren Pakete.

## Lizenzen

Schriften (SIL Open Font License 1.1): UnifrakturMaguntia, Newsreader, Schibsted Grotesk – siehe
`docs/schriften/LIZENZ.md`. Alle Meldungen verlinken auf die Originalquellen; übernommen werden nur
Überschriften, Quellenname und Datum, die Kurztexte sind eigene Formulierungen.
