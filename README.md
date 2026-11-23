# Mainzer Boniblatt

Der werktägliche Morgenüberblick für **Jugendhilfeplanung**, **Frühe Hilfen & Kinderschutz** und
**Quartiersmanagement** in Mainz – als Zeitungsseite im Netz:
**https://boniblatt-mainz.de/**

Direktlinks je Ressort: `#jugendhilfeplanung`, `#fruehe-hilfen`, `#quartiersmanagement`
(z. B. `https://boniblatt-mainz.de/#fruehe-hilfen`). Frühere Ausgaben über die Pfeile am Datum
unter der Suche (› älterer Tag, ‹ neuerer Tag), das Archiv-Symbol („Alle Ausgaben“) oder direkt per Adresse, z. B.
`https://boniblatt-mainz.de/?ausgabe=2026-11-19#jugendhilfeplanung`.
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
| 1b. Zwischenabruf | GitHub Actions (`sammeln.yml`, Lauf `zwischen`) | stündlich von 5 bis 23 Uhr | nur die Feed-Adressen, die sich schneller drehen als der volle Abruf (`"stuendlich"` in `quellen.json`, derzeit der Rheinland-Pfalz-Feed der Allgemeinen Zeitung); speichert nur, wenn es Neues gibt |
| 2. Redaktion | Claude-Routine in der Cloud | werktags (Mo–Fr) 04:00 UTC (5 Uhr Winter-, 6 Uhr Sommerzeit); montags mit allen Meldungen seit Freitag | sichtet die offenen Kandidaten nach `REDAKTION.md`, wählt je Ressort höchstens 12 Meldungen, schreibt `daten/ausgaben/JJJJ-MM-TT.json` |
| 3. Veröffentlichen | GitHub Actions (`seite.yml`) → GitHub Pages | nach jeder Änderung | veröffentlicht den Ordner `docs/` |
| 4. Qualitätsmanager | Claude-Routine in der Cloud | montags | arbeitet `QUALITAET.md` ab: prüft jede Quelle (Ampel aus `werkzeuge/quellen-kontrolle.mjs`, dazu acht Quellen von Hand gegen die echte Seite), repariert, was sicher geht, und legt Größeres als Notiz in `daten/qm-notizen.json` ab (Anzeige in der Verwaltung); Protokoll in `daten/wartung.md` |

Nichts davon läuft auf einem privaten Rechner.

**Warum nicht alles stündlich?** Der Abruf wurde am 22.11.2026 vermessen: Von 38 Feeds tauschte nur einer (Allgemeine
Zeitung, Rheinland-Pfalz) seine zehn Einträge in weniger als sechs Stunden aus; die Stadtteil-Feeds brauchen dafür Wochen.
Deshalb läuft der volle Abruf alle drei Stunden und nur dieser eine Feed stündlich. Der Abruf schreibt bei jedem Lauf mit,
wie viel je Feed neu war (`daten/abruf-takt.json`); die Qualitätssicherung stuft Feeds danach hoch oder zurück.

**Voraussetzung für Schritt 2:** Die Claude-GitHub-App braucht Zugriff auf dieses Repository
(https://github.com/apps/claude/installations/select_target → Konto wählen → Repository `mainzer-fachbrief`
freigeben). Ohne diese Freigabe kann die Routine die Ausgabe nicht hochladen; die Seite zeigt dann weiter
die letzte Ausgabe.

## Ordner

- `quellen.json` – alle Quellen (RSS, Übersichtsseiten, Ratsinformationssystem, Landtag-Schnittstelle …)
- `REDAKTION.md` – die Redaktionsregeln (fachliche Profile der drei Ressorts, Auswahl- und Gewichtungsregeln)
- `werkzeuge/sammeln.mjs` – Quellenabruf · `werkzeuge/redaktion.mjs` – Kandidatenliste, Prüfung, Seitendaten
- `daten/` – Pool, bekannte Links, Ausgaben, Gremien-Notizen · `docs/` – die Webseite (`index.html`, `daten/*.json`, Schriften)
- `docs/blatt/` – die Kachel-Ansicht der Hauptseite (`bb.js`, `bb.css`, `gemeinsam.js`, `schrift.css`; Motive in `docs/bilder/motive/`)
- Fundstück-Kalender: 261 Fundstücke, an jedem Werktag 2027 genau eines (Jahresplan in `werkzeuge/intro-funde.mjs`, `KALENDERJAHR`); `docs/kalender.html` zeigt das Jahr und deckt jeden Tag auf, sobald er da ist
- Altpapier-Wurf: Spiel unter der Fußleiste (nur am PC), `docs/blatt/spiel.js`, wird erst geladen, wenn der Fuß in Sicht kommt; die gemeinsame Bestenliste ist ein Cloudflare Worker mit KV-Speicher (`cloudflare/bestenliste/`, Adresse in `LISTE_URL` in spiel.js)
- Dienst bei Cloudflare (`cloudflare/bestenliste/`): Bestenliste, **anonyme Zählung** (`docs/blatt/zaehlung.js` meldet Aufrufe und Klicks;
  gespeichert wird nur „Tag, Art, Ziel, Anzahl“ in der D1-Datenbank `boniblatt-zaehlung` – keine Adresse, keine Kennung, kein Cookie)
  und die Schnittstelle der **Verwaltung**
- Verwaltung: `docs/verwaltung.html` (nicht verlinkt, mit Passwort) zeigt Besuche und meistgeklickte Meldungen nach Zeitraum,
  den Tokenverbrauch je Claude-Lauf (`daten/verbrauch.json`, geschrieben von `werkzeuge/verbrauch.mjs`), den
  DeepSeek-Vergleich (`daten/schatten.json`) und die Abläufe im Hintergrund. Das Passwort liegt nur als Secret
  `ADMIN_PASSWORT` im Cloudflare-Dienst. Geschützt sind damit die Besuchszahlen; Verbrauch und Vergleich liegen als
  Dateien in diesem Repository
- DeepSeek-Schattenlauf: `werkzeuge/schatten.mjs` über `.github/workflows/schatten.yml` (direkt nach jeder Morgenausgabe, 15 Ausgaben
  lang): DeepSeek Flash macht dieselbe Arbeit wie die Morgenredaktion – Auswahl mit Hörfassung, Gremien-Notizen und „Was geht?“
  mit eigener Websuche; veröffentlicht wird davon nichts. Braucht das
  Repository-Secret `DEEPSEEK_API_KEY`
- Abgleich Claude ↔ DeepSeek (bis 11.12.2026): drei Runden à fünf Ausgaben, Häkchen in der Verwaltung, nach jeder Runde ein
  einmaliger Cloud-Lauf, der die Prompts anpasst; Ablauf, Rundenberichte und Abschlussbericht in `ABGLEICH.md`.
- Stimmen: `werkzeuge/stimmen.mjs` über `.github/workflows/stimmen.yml` (nachts und mittags) holt die Häkchen aus dem Vergleich
  und die Leserstimmen „relevant ja/nein“ der Startseite vom Cloudflare-Dienst nach `daten/abgleich-stimmen.json` und
  `daten/leser-daumen.json`, dazu die Antworten auf Vorschläge des Qualitätsmanagers (`daten/qm-antworten.json`).
  Die Leserstimmen wertet der Qualitätsmanager monatlich aus (ab Januar 2027, `QUALITAET.md` Schritt 10a): Er schlägt in der
  Verwaltung („Leserstimmen“) Änderungen vor (`daten/leser-vorschlag.json`) und setzt im Folgemonat nur um, was dort mit „Ja“
  oder per Kommentar freigegeben wurde.
- Notion-Abgleich (Übergangszeit bis 6.12.2026): `werkzeuge/notion-abgleich.mjs` über `.github/workflows/notion-abgleich.yml`,
  täglich gegen 5 Uhr (Winterzeit). Prüft, ob jeder Artikel, den die alte Make.com-Automatisierung in den 24 Stunden bis zum
  nächtlichen vollen Abruf (Zeit aus `daten/laufprotokoll.json`, meist gegen 4:35 Uhr) in die Notion-Datenbank „AZ“ schrieb,
  auch im Pool oder unter den bekannten Links steht; fehlt einer, wird der Grund bestimmt (Rubrik nicht abgerufen, älter als
  drei Tage, Quelle fehlt, unklar). Jedes Fenster wird am nächsten Morgen noch einmal geprüft und ist dann endgültig. Ergebnis in `daten/notion-abgleich.json`, Anzeige in der Verwaltung. Braucht das
  Repository-Secret `NOTION_TOKEN` (Notion-Verbindung mit Lesezugriff auf „AZ“); prüft am 7.12. ein letztes Mal nach und schaltet sich dann selbst ab
- Werkstatt: `docs/ueber.html` erzählt, wie das Boniblatt entstanden ist (JHP-Newsletter mit Make.com, Notion, DeepSeek, Outlook) und zeigt das Startbild mit Umschaltern
- `werkzeuge/intro-einbauen.mjs` – baut das Intro („Morgen über Mainz“) in `docs/index.html`; dazu
  `intro-feste.mjs` (besondere Tage, Ferien- und Festtermine), `intro-boni.mjs` (Bonifaziustürme mit Balkon),
  `intro-funde.mjs` mit `funde/*.mjs` (die Fundstücke des Tages → `docs/intro-funde.js`), `wetter.mjs` (Wetterlage
  je Tag), `termine-pruefen.mjs` (Jahresplan und fehlende Termine)
- `routinen/` – Aufträge und Einstellungen der beiden Cloud-Routinen · `NEUE-STADT.md` – Übernahme für eine andere Stadt
- `docs/bilder/` – Logo (`logo-hell.svg`, `logo-dunkel.svg`), Favicon und die Icons (`icons/hell`, `icons/dunkel`)
- `daten/quellen-kontrolle.json` – Ampel je Quelle (liefert sie wirklich Aktuelles?), nach jedem Abruf neu berechnet;
  `daten/quellen-stichprobe.json` – Gegenproben des Qualitätsmanagers; `daten/diagnose/anfragen.json` – Seiten, die er
  sich von GitHub holen lässt (`werkzeuge/schnappschuss.mjs`)
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

Oder ohne lokalen Lauf: in `quellen.json` bei der Quelle `"grundstand": "JJJJ-MM-TT"` (morgen) setzen – bis zu diesem
Tag merkt der Abruf auf GitHub undatierte Meldungen der Quelle nur als bekannt.

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
Szene über Mainz. Sie wechselt mit Jahreszeit und Wetter (13 Varianten) und zeigt an besonderen Tagen kleine Motive.
In den Bonifaziustürmen gehen Bürolichter an und aus; am Balkon im 20. OG stehen je Aufruf zwei Kollegen beim Rauchen
oder drei Kolleginnen mit Kaffee. Zum Ausprobieren: `?intro`, `?wetter=winter-schnee`, `?fest=advent`,
`?boni=raucher` / `?boni=kaffee`, `?tag=2027-06-18` (ein anderer Tag), `?zeit=6` (Standbild nach 6 Sekunden).

### Fundstücke des Tages

Damit es jeden Tag etwas zu entdecken gibt, erscheinen in der Szene täglich zwei bis vier kleine Fundstücke – für alle
dieselben, jeden Tag andere: Leute und Tiere am Ufer, Boote auf dem Rhein, etwas am Himmel, auf den Dächern, an den
Türmen oder auf dem Zeitungsblatt selbst (rund 160 Stück, `node werkzeuge/intro-funde.mjs --liste`). Die Auswahl richtet
sich nach Jahreszeit, Wetter und Wochentag; jedes Stück hat seinen Platz, damit sich nichts überdeckt, und an Festtagen
bleibt der Platz den Festmotiven. Gewöhnliche Stücke kommen etwa alle sechs Wochen an die Reihe, besondere alle zwölf,
seltene zweimal im Jahr; einige nur an einem bestimmten Tag (1. April, Freitag der 13., Walpurgisnacht, Halloween).

- **Werbeflieger:** In etwa jeder dritten Ausgabe zieht ein kleines Flugzeug ein Banner mit einem Spruch des Tages über
  den Himmel. Ob er fliegt und was draufsteht, entscheidet die Morgenredaktion (Feld `flieger` der Ausgabe, Regeln in
  `REDAKTION.md`; `redaktion.mjs` schreibt daraus `docs/daten/flieger.js`). Ansehen: `?spruch=Guten%20Morgen`.
- Zeichnungen: `werkzeuge/funde/*.mjs` (je Ort eine Datei, gemeinsame Bausteine und Plätze in `hilfen.mjs`).
- Nach Änderungen: `node werkzeuge/intro-funde.mjs`, dann `node werkzeuge/intro-einbauen.mjs`.
- Ansehen: `?fund=angler,gummiente` zeigt bestimmte Stücke (`angler@ufer-r2` = an diesem Platz), `?fund=aus` keine.
  `node werkzeuge/intro-funde.mjs --plan=2027-03` zeigt, was an welchem Tag erscheint; `--nur=ufer-szenen --blatt=1`
  schreibt ein Prüfblatt mit allen Stücken einer Datei (`docs/_blatt-ufer-szenen.html`).

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
Folgejahr nach (QUALITAET.md, Schritt 10).

## Lizenzen

Schriften (SIL Open Font License 1.1): Source Serif 4 und Schibsted Grotesk – siehe
`docs/schriften/LIZENZ.md`. Alle Meldungen verlinken auf die Originalquellen; übernommen werden nur
Überschriften, Quellenname und Datum, die Kurztexte sind eigene Formulierungen.
