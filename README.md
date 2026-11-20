# Mainzer Boniblatt

Der werktägliche Morgenüberblick für **Jugendhilfeplanung**, **Frühe Hilfen & Kinderschutz** und
**Quartiersmanagement** in Mainz – als Zeitungsseite im Netz:
**https://ahmadmimam10.github.io/mainzer-fachbrief/**

Direktlinks je Ressort: `#jugendhilfeplanung`, `#fruehe-hilfen`, `#quartiersmanagement`
(z. B. `https://ahmadmimam10.github.io/mainzer-fachbrief/#fruehe-hilfen`). Frühere Ausgaben über die Pfeile am Datum
unter der Suche (› älterer Tag, ‹ neuerer Tag), das Archiv-Symbol („Alle Ausgaben“) oder direkt per Adresse, z. B.
`…/mainzer-fachbrief/?ausgabe=2026-11-19#jugendhilfeplanung`.
Die Ausgaben vom 13.–19.11.2026 sind nachträglich aus dem Make/Notion-Archiv zusammengestellt (Rückblick).

Der Name kommt von den **Bonifaziustürmen** am Mainzer Hauptbahnhof; sie stehen auch im Stadtbild des Intros.
Die Webadresse heißt aus technischen Gründen weiter `…/mainzer-fachbrief/`.

**Eigene Ausgabe für eine andere Stadt:** Dieses Repository ist eine Vorlage – siehe [NEUE-STADT.md](NEUE-STADT.md).

Das Boniblatt ersetzt die früheren Make.com-Szenarien (Scraping/RSS → Notion → DeepSeek → E-Mail).
Keine amtliche Veröffentlichung der Stadt Mainz.

## So läuft es

| Schritt | Wer | Wann | Was |
|---|---|---|---|
| 1. Quellen abrufen | GitHub Actions (`.github/workflows/sammeln.yml`) | mehrmals täglich | `werkzeuge/sammeln.mjs` liest alle Quellen aus `quellen.json`, legt neue Meldungen im Pool ab (`daten/pool/`), aktualisiert Ratstermine und Quellenstatus |
| 2. Redaktion | Claude-Routine in der Cloud | werktags (Mo–Fr) 04:00 UTC (5 Uhr Winter-, 6 Uhr Sommerzeit); montags mit allen Meldungen seit Freitag | sichtet die offenen Kandidaten nach `REDAKTION.md`, wählt je Ressort höchstens 12 Meldungen, schreibt `daten/ausgaben/JJJJ-MM-TT.json` |
| 3. Veröffentlichen | GitHub Actions (`seite.yml`) → GitHub Pages | nach jeder Änderung | veröffentlicht den Ordner `docs/` |

Nichts davon läuft auf einem privaten Rechner.

**Voraussetzung für Schritt 2:** Die Claude-GitHub-App braucht Zugriff auf dieses Repository
(https://github.com/apps/claude/installations/select_target → Konto wählen → Repository `mainzer-fachbrief`
freigeben). Ohne diese Freigabe kann die Routine die Ausgabe nicht hochladen; die Seite zeigt dann weiter
die letzte Ausgabe.

## Ordner

- `quellen.json` – alle Quellen (RSS, Übersichtsseiten, Ratsinformationssystem, Landtag-Schnittstelle …)
- `REDAKTION.md` – die Redaktionsregeln (fachliche Profile der drei Ressorts, Auswahl- und Gewichtungsregeln)
- `werkzeuge/sammeln.mjs` – Quellenabruf · `werkzeuge/redaktion.mjs` – Kandidatenliste, Prüfung, Seitendaten
- `daten/` – Pool, bekannte Links, Ausgaben, Gremien-Notizen · `docs/` – die Webseite (`index.html`, `daten/*.json`, Schriften)
- `werkzeuge/intro-einbauen.mjs` – baut das Intro („Morgen über Mainz“) in `docs/index.html`; dazu
  `intro-feste.mjs` (besondere Tage, Ferien- und Festtermine), `intro-boni.mjs` (Bonifaziustürme und ihre kleinen
  Szenen), `wetter.mjs` (Wetterlage je Tag), `termine-pruefen.mjs` (Jahresplan und fehlende Termine)
- `routinen/` – Aufträge und Einstellungen der beiden Cloud-Routinen · `NEUE-STADT.md` – Übernahme für eine andere Stadt
- `docs/bilder/` – Logo (`logo-hell.svg`, `logo-dunkel.svg`), Favicon und die Icons (`icons/hell`, `icons/dunkel`)
- `daten/quellen-zustand.json` – Zustand je Quelle (`ok` / `auffaellig` / `gestoert`, Verlauf), `daten/diagnose/` –
  Rohmaterial auffälliger Quellen, `daten/wartung.md` – Protokoll der Reparaturen

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

**Gestörte Quelle:** Der Abruf lässt nur Kandidaten mit plausiblem Titel und erreichbarem Link in den Pool und führt
je Quelle einen Zustand. Ist eine Quelle seit über 2 Tagen `gestoert`, schlägt der Workflow „Quellen abrufen“ im
letzten Schritt fehl (GitHub schickt eine E-Mail). Die Morgenroutine repariert bis zu 3 Quellen
(`REDAKTION.md`, Abschnitt „Quellenpflege“). Von Hand:

```bash
node werkzeuge/sammeln.mjs --zustand                                         # Übersicht
node werkzeuge/sammeln.mjs --probe --nur=ism --datei=daten/diagnose/ism.html # Schnappschuss offline parsen
```

**Auswahlregeln ändern:** `REDAKTION.md` bearbeiten – die Routine liest die Datei jeden Morgen neu.

**Ausgabe von Hand nachholen:**

```bash
node werkzeuge/redaktion.mjs vorbereiten
# arbeit/kandidaten.md lesen, daten/ausgaben/JJJJ-MM-TT.json schreiben (Format siehe REDAKTION.md)
node werkzeuge/redaktion.mjs veroeffentlichen   # prüft, baut und lädt nur bei bestandener Prüfung hoch
```

**Lokal ansehen:**

```bash
python -m http.server 8765 --directory docs
```

Benötigt Node.js 20 oder neuer, keine weiteren Pakete.

## Das Intro

Bei jedem Aufruf der Ausgabe (nur im hellen Modus, nicht nach der Seite „Über das Boniblatt“) erscheint eine kurze
Szene über Mainz. Sie wechselt mit Jahreszeit und Wetter (13 Varianten), zeigt an besonderen Tagen kleine Motive und
in den Bonifaziustürmen Bürolichter und gelegentlich eine kleine Szene im 14. OG (Raucherbalkon, Sprechblasen,
Fensterputzer, Papierflieger). Zum Ausprobieren: `?intro`, `?wetter=winter-schnee`, `?fest=advent`,
`?boni=raucher,blase`, `?zeit=6` (Standbild nach 6 Sekunden).

### Besondere Tage – wann erscheinen die Motive?

Maßstab ist der Arbeitsalltag in der Verwaltung (TVöD, Stadt Mainz): frei sind Wochenende, Feiertage in
Rheinland-Pfalz, Heiligabend, Silvester und Rosenmontag; ein einzelner Arbeitstag zwischen zwei freien Tagen gilt als
Brückentag. Regeln in `werkzeuge/intro-feste.mjs`, Jahresplan mit `node werkzeuge/termine-pruefen.mjs 2027`.

| Anlass | Motiv erscheint |
|---|---|
| Neujahr | an den ersten zwei Arbeitstagen im Januar (davor sind die meisten im Urlaub) |
| Heilige Drei Könige, Valentinstag, Kindertag (1.6.), Weltkindertag, Halloween, Sankt Martin und 11.11., Tag der Kinderrechte, Nikolaus | am Tag selbst; fällt er aufs Wochenende, am Freitag davor |
| Fastnacht | Weiberfastnacht bis Fastnachtsdienstag |
| Ostern | Mittwoch und Donnerstag vor Karfreitag |
| 1. Mai, Muttertag, Himmelfahrt, Pfingsten, Fronleichnam, Tag der Deutschen Einheit | am letzten Arbeitstag davor (Brückentage übersprungen) |
| Johannisnacht | vom Donnerstag vor dem Fest bis zum Festmontag (Feuerwerk am Montag) |
| Weinmarkt | an beiden Festwochenenden ab Donnerstag |
| Ferienbeginn | an den letzten zwei Arbeitstagen vor den Schulferien |
| Schulanfang | an den ersten zwei Schultagen nach den Sommerferien |
| Advent | ab dem Freitag vor dem 1. Advent bis 23.12. |
| Weihnachten | an den letzten zwei Arbeitstagen vor Heiligabend bis 30.12. |

Schulferien und die Termine von Johannisnacht und Weinmarkt trägt die Qualitätssicherung einmal im Jahr für das
Folgejahr nach (QUALITAET.md, Punkt 8).

## Lizenzen

Schriften (SIL Open Font License 1.1): Source Serif 4 und Schibsted Grotesk – siehe
`docs/schriften/LIZENZ.md`. Alle Meldungen verlinken auf die Originalquellen; übernommen werden nur
Überschriften, Quellenname und Datum, die Kurztexte sind eigene Formulierungen.
