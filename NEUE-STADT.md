# Das Boniblatt für eine andere Stadt übernehmen

Dieses Repository ist als **Vorlage** angelegt: Wer eine eigene Fachzeitung für eine andere Stadt oder andere Themen
möchte, legt sich eine Kopie an und lässt die Anpassung von Claude (Claude Code) erledigen. Diese Datei ist die
Arbeitsanleitung dafür – für Menschen und für Claude.

## 1. Kopie anlegen (Mensch, ca. 5 Minuten)

1. Auf GitHub oben rechts **„Use this template“ → „Create a new repository“**, Name z. B. `kasseler-fachblatt`,
   Sichtbarkeit **Public** (GitHub Pages ist für öffentliche Repositorys kostenlos).
2. Im neuen Repository: **Settings → Pages → Source: „GitHub Actions“**.
3. **Settings → Actions → General → Workflow permissions: „Read and write permissions“**.
4. Claude-GitHub-App für das neue Repository freigeben:
   https://github.com/apps/claude/installations/select_target
5. Optional (Hörfassungen zum Anhören): Azure-Speech-Schlüssel als **Secrets** `AZURE_SPEECH_KEY` und
   `AZURE_SPEECH_REGION` eintragen (Settings → Secrets and variables → Actions). Schlüssel nie in einen Chat
   kopieren. Ohne Schlüssel erscheint die Seite einfach ohne Audio.
6. Repository klonen und darin Claude Code starten, dann den Auftrag aus Abschnitt 2 einfügen.

## 2. Auftrag an Claude (zum Einfügen)

```text
Lies NEUE-STADT.md, README.md, REDAKTION.md und QUALITAET.md vollständig. Passe diese Kopie des „Mainzer
Boniblatts“ an für: Stadt <STADT>, Bundesland <LAND>, Name der Zeitung <NAME>, Themen/Ressorts <RESSORTS>,
Wahrzeichen für Logo und Intro <WAHRZEICHEN>. Arbeite die Liste in NEUE-STADT.md, Abschnitt 3, Punkt für Punkt ab,
frag mich bei echten Entscheidungen (Name, Ressorts, Quellen, Gestaltung) nach und zeig mir die Seite lokal, bevor
du etwas veröffentlichst. Lege danach die zwei Cloud-Routinen nach routinen/*.md an.
```

## 3. Anpassungsliste (Claude)

**a) Alte Daten entfernen** – die Kopie startet ohne Mainzer Inhalte:

```bash
git rm -r -q daten/ausgaben daten/pool daten/gesehen.json daten/laufprotokoll.json daten/quellen-zustand.json daten/gremien-notizen.json
git rm -r -q --ignore-unmatch daten/diagnose docs/daten/gremien.json docs/daten/termine.json
printf '# Wartungsprotokoll\n\nNeueste Einträge oben.\n' > daten/wartung.md
```

Die Werkzeuge legen fehlende Dateien beim ersten Lauf selbst wieder an. Danach `node werkzeuge/redaktion.mjs bauen`
(erzeugt `docs/daten/*` neu) und die Startseite lokal prüfen.

**b) Inhalt und Quellen**

| Datei | Was anpassen |
|---|---|
| `quellen.json` | Alle Quellen der neuen Stadt, des Landes und der Fachwelt (RSS oder Übersichtsseiten mit `muster`). Jede Quelle mit `node werkzeuge/sammeln.mjs --probe --nur=<id>` testen, neue Übersichtsseiten mit `--grundstand` anlegen. |
| `werkzeuge/gremien.mjs`, Quelle `ratsinfo` | Ratsinformationssystem der Stadt (das Mainzer ist SessionNet unter bi.mainz.de; ALLRIS und andere Systeme brauchen einen eigenen Leser). Gremien-Filter in `quellen.json` → `ratsinfo.gremien`. |
| `REDAKTION.md` | Ressorts mit Fachprofilen, Stadt- und Landesbezug, Rubriken (`mainz/land/bund/fach` in `werkzeuge/redaktion.mjs`), Ton der Hörfassungen. |
| `werkzeuge/lib.mjs` | `UA` (Name und Repository-Adresse des Abrufs), Regel für Stadt-Domains in der Link-Bereinigung. |
| `werkzeuge/wetter.mjs` | Koordinaten der Stadt in der Open-Meteo-Adresse (`latitude`, `longitude`). |

**c) Name, Logo und Seite**

| Datei | Was anpassen |
|---|---|
| `docs/bilder/logo-hell.svg`, `logo-dunkel.svg`, `favicon-*.svg`, `docs/bilder/intro/*.svg` | Bildzeichen (hier: Sonne, Dom, Zeitung) und Schriftzug. Der Schriftzug ist Times New Roman Bold, in Pfade umgewandelt (Maßstab 0,88, Höhe der Großbuchstaben 72,8). |
| `docs/index.html`, `docs/ueber.html` | Titel, Beschreibung, Texte über die Zeitung, Kontakt im Fuß, Bildbreite der Logos (`width`). |
| `werkzeuge/intro-einbauen.mjs` | Titel und Untertitel im Intro (`buchstaben(…)`, `i-unter`), Stadtsilhouette (`STADT`/`FERN` → `marken`), Fluss/Ufer; danach `node werkzeuge/intro-einbauen.mjs`. Ist das Seitenverhältnis des Logos anders, auch `inset(0 0 0 14.2%)` (Anteil des Bildzeichens an der Logobreite). |
| `werkzeuge/intro-boni.mjs` | Die Bonifaziustürme mit ihren kleinen Szenen sind Mainz-spezifisch: durch ein eigenes Wahrzeichen ersetzen oder die Einbindung (`BONI_*`, `boniSzene`) in `intro-einbauen.mjs` entfernen. |
| `README.md`, `QUALITAET.md`, `REDAKTION.md`, `werkzeuge/*.mjs` (Kopfkommentare), `.github/workflows/*.yml` (`git config user.name`) | Namen und Adressen. |

**d) Besondere Tage** (`werkzeuge/intro-feste.mjs`)

- `freiTage` in `festeFuer()`: gesetzliche Feiertage des Bundeslands (z. B. Reformationstag, Buß- und Bettag,
  Mariä Himmelfahrt) und örtliche Regelungen (Mainz: Rosenmontag dienstfrei).
- `FERIEN`: Schulferien des Bundeslands; `TERMINE`: örtliche Feste mit wechselndem Datum.
- Örtliche Anlässe in `liste` ersetzen (Mainz: Fastnacht, Johannisnacht, Weinmarkt, Elfter Elfter).
- Prüfen mit `node werkzeuge/termine-pruefen.mjs` (zeigt den Jahresplan).

**e) Routinen anlegen** – Texte und Einstellungen stehen in `routinen/morgenausgabe.md` und
`routinen/qualitaetssicherung.md`. Name, Repository und Webadresse ersetzen; Zeitplan in UTC; keine Konnektoren.

**f) Prüfen und veröffentlichen**

```bash
python -m http.server 8765 --directory docs      # http://localhost:8765/?intro
node werkzeuge/redaktion.mjs vorbereiten         # erster Probelauf der Redaktion
```

Erst wenn Seite, Intro (`?wetter=winter-schnee`, `?fest=advent`, `?boni=raucher`) und ein Probelauf stimmen:
committen und pushen. Der Workflow „Seite“ veröffentlicht `docs/` auf GitHub Pages.

## Was Kosten verursacht

GitHub (öffentliches Repository, Actions, Pages) und Open-Meteo sind kostenlos. Die Routinen laufen über das
Claude-Abonnement. Azure Speech ist bis 500 000 Zeichen im Monat kostenlos (Stufe F0).
