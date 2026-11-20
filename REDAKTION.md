# Redaktionsanleitung – Mainzer Fachbrief

Diese Datei ist die verbindliche Arbeitsanweisung für die tägliche Morgenausgabe. Sie ersetzt die drei
DeepSeek-Prompts aus den früheren Make-Szenarien (Jugendhilfeplanung, Frühe Hilfen, Quartiersmanagement)
und übernimmt deren fachliche Kriterien.

Ziel: Fachkräfte öffnen morgens eine Seite und erkennen in einer Minute, **was heute wichtig ist, worum es
geht und woher es stammt**. Lieber eine strenge, treffsichere Auswahl als eine lange Liste.

---

## Ablauf (jeden Morgen)

1. `git pull --rebase` (aktuellen Stand holen).
2. `node werkzeuge/redaktion.mjs vorbereiten`
   Das Skript schreibt alle noch nicht gesichteten Kandidaten nach `arbeit/kandidaten.md`
   (gruppiert nach Mainz / Rheinland-Pfalz / Bund / Fachwelt und nach Quelle, jeweils mit `[id]`).
3. `arbeit/kandidaten.md` **vollständig** lesen.
4. Die Ausgabe als `daten/ausgaben/JJJJ-MM-TT.json` (heutiges Datum, Europe/Berlin) schreiben, Format unten.
   Nur `id`s aus der Kandidatenliste verwenden. Links, Quellen und Daten ergänzt das Skript selbst.
   Danach die **Gremien-Notizen** ergänzen (Abschnitt „Gremien-Notizen“ unten).
5. `node werkzeuge/redaktion.mjs veroeffentlichen` – als **einzelnen** Befehl ausführen, nichts davor oder
   dahinter verketten. Das Skript prüft die Ausgabe, baut die Seitendaten und committet und pusht **nur, wenn die
   Prüfung bestanden ist** (bei Bedarf mit `pull --rebase`; ist main gesperrt, auf `claude/ausgabe-JJJJ-MM-TT`,
   das die Action „Ausgabe übernehmen“ nach main holt).
   Meldet es Prüffehler: Datei korrigieren und denselben Befehl erneut ausführen. Nie selbst `git commit`/`git push`
   aufrufen.

**Sonderfälle**
- Gibt es keine offenen Kandidaten, **keine** Ausgabe anlegen – das deutet auf einen gestörten Abruf hin. Nur berichten.
- Existiert die Datei für heute schon (zweiter Lauf am selben Tag), sie **ergänzen**: bestehende Meldungen
  behalten, neue wichtige Kandidaten einordnen, Grenzen (12 je Ressort, ein Aufmacher, höchstens 3 wichtig) einhalten.
  Ein neuer Kandidat darf den Aufmacher nur ablösen, wenn er klar wichtiger ist.

---

## Quellenpflege (vor der Ausgabe)

Der Abruf bewertet bei jedem Lauf jede Quelle und schreibt das Ergebnis nach `daten/quellen-zustand.json`:
`zustand` (`ok`, `auffaellig` oder `gestoert`), `hinweis`, `seit`, `beispiele` (verworfene Einträge mit Grund),
`fehler` und `trefferVerlauf`. Von auffälligen und gestörten HTML- und Sonderquellen liegt das zuletzt geladene
Rohmaterial unter `daten/diagnose/<id>.html` (bzw. `.json`/`.xml`), der Pfad steht im Feld `diagnose`.
Diese Dateien und `docs/daten/status.json` nie von Hand ändern.

Nach `git pull --rebase`, vor `vorbereiten`:

1. In `daten/quellen-zustand.json` nach `"zustand": "gestoert"` sehen (Übersicht: `node werkzeuge/sammeln.mjs --zustand`).
   Keine gestörte Quelle → weiter mit der Ausgabe. `auffaellig` nur beobachten, nicht reparieren.
2. Je gestörter Quelle – **höchstens 3 pro Morgen**, die am längsten gestörten (`seit`) zuerst:
   - `hinweis`, `beispiele` und `fehler` lesen, den Schnappschuss öffnen und mit dem Eintrag in `quellen.json`
     vergleichen: Wie sehen die Links auf einzelne Meldungen jetzt aus? Wo stehen Titel und Datum?
   - Nur den Eintrag dieser Quelle in `quellen.json` anpassen: `muster` (Regex auf Pfad und Query der Meldungslinks,
     ohne Host), `ohne`, `bereich` (Regex für den Seitenausschnitt mit den Meldungen), `datumNach`, `urls`, `hosts`,
     ggf. `typ`. Die Datei muss gültiges JSON bleiben (Backslashes in Regex doppelt schreiben).
   - Offline prüfen: `node werkzeuge/sammeln.mjs --probe --nur=<id> --datei=<Pfad aus „diagnose“>` – so lange anpassen,
     bis die Liste plausibel ist: echte Überschriften (keine Navigation, kein „Weiterlesen“, kein Störtext), Links auf
     einzelne Meldungen der Quelle, Daten vorhanden und nicht überall gleich, am Ende „Bewertung …: ok“.
     Die Linkprüfung entfällt offline, der nächste Abruf holt sie nach. Mit Netzzugang zusätzlich
     `node werkzeuge/sammeln.mjs --probe --nur=<id>`.
   - RSS-Quellen haben keinen Schnappschuss: Bei dauerhaftem `HTTP 404/410` oder „kein RSS-/Atom-Feed“ nur mit
     Netzzugang eine neue Feed-Adresse suchen, sonst Schritt 3.
3. Keine Reparatur möglich (Inhalte nur per JavaScript, Seite gesperrt, Quelle eingestellt, Schnappschuss ohne
   Meldungen): in `quellen.json` `"aktiv": false` und `"hinweis": "<Grund> (seit JJJJ-MM-TT)"` setzen.
   Einzelne Netzaussetzer (Zeitüberschreitung, HTTP 403/429/5xx in einzelnen Läufen) sind kein Grund zum Abschalten.
4. Jede Änderung in `daten/wartung.md` protokollieren (neuester Eintrag oben, eine Zeile je Quelle):
   `- JJJJ-MM-TT · <id> · was geändert wurde (alt → neu) · Ergebnis` – z. B. „Probe offline: 10 Einträge, Titel
   und Daten plausibel“ oder „abgeschaltet: Inhalte nur per JavaScript“.
5. Nicht selbst committen: `veroeffentlichen` lädt `quellen.json` und `daten/` zusammen mit der Ausgabe hoch.
   Entsteht heute keine Ausgabe, werden die Änderungen nicht hochgeladen – dann im Bericht nennen.

Die Ausgabe hat Vorrang: für die Quellenpflege höchstens etwa 10 Minuten. Wird die Zeit knapp, abbrechen,
halbfertige Änderungen mit `git checkout -- quellen.json` verwerfen und die Ausgabe fertigstellen. Ob eine Reparatur
wirkt, zeigt der Zustand erst nach dem nächsten Abruf (GitHub Actions, alle drei Stunden).

---

## Die drei Ressorts

### 1. Jugendhilfeplanung (`jugendhilfeplanung`)
Leser:in ist Jugendhilfeplaner:in der Stadt Mainz. Fachlicher Fokus: Jugendhilfeplanung, Kinder- und
Jugendhilfe sowie Leistungen und Aufgaben nach dem SGB VIII – strategisch, planerisch, verwaltungsbezogen.
Interesse gilt nicht Einzelfällen oder kleinen Projekten, sondern übergeordneter Steuerung, langfristiger
Planung, großen Maßnahmen, neuen Konzepten und Schritten im kommunalen Kontext.

Themenfelder: Kinder- und Jugendhilfe, Bildung, Jugendhilfeplanung, Kindertagesstätten, Hilfen zur Erziehung,
Frühe Hilfen, Inobhutnahme, Sozialdienst, Adoption, Integration, unbegleitete minderjährige Geflüchtete, offene
Jugendarbeit, Eingliederungshilfe/inklusive Lösung, Suchtprävention und -hilfe für Jugendliche, Haushaltslage
und Finanzierung (Bund, Land, Kommune), Gesetzgebung (z. B. SGB-VIII-Reform, Unterhaltsvorschuss),
Statistik, Studien, Fachkräftesicherung, Beteiligung junger Menschen.

Besonderes Augenmerk: Zahlen, Fakten, Konzepte, strategische Ausrichtungen – alles, was hilft, kommunale
Entscheidungen datenbasiert vorzubereiten, Entwicklungen zu bewerten und Steuerungsbedarfe zu erkennen.

Nicht aufnehmen: Einzelfälle ohne strukturelle Frage (Diebstahl, Gewalt, familiäre Probleme einzelner Kinder),
sehr praxisnahe Erziehungstipps, parteipolitische Auseinandersetzungen (z. B. Rechtsextremismus als
Parteienstreit), allgemeine Politik ohne Bezug zur Kinder- und Jugendhilfe.

### 2. Frühe Hilfen, Kinderschutz und Familienbildung (`fruehe-hilfen`)
Leser:in arbeitet in den Frühen Hilfen, im Kinderschutz und in der Familienbildung.
- **Frühe Hilfen** (§§ 1, 16, 20, 27, 28 SGB VIII): Unterstützung von (werdenden) Eltern und Familien mit
  Kindern von 0 bis etwa 3 Jahren – kommunale Strukturen, interdisziplinäre Netzwerke, Familienhebammen,
  Frühe Gesundheitsdienste, Elternberatung, Früherkennung, Sozialpädiatrie, aufsuchende Hilfe, Prävention.
- **Kinderschutz**: Angebote, die eine mögliche Kindeswohlgefährdung einschätzen, verringern und präventiv
  verhindern (Art. 6 II GG, § 8a SGB VIII, Bundeskinderschutzgesetz, Landeskinderschutzgesetz RLP),
  Schutzkonzepte, Schutz vor Vernachlässigung, Misshandlung und sexualisierter Gewalt, U-Untersuchungen.
- **Familienbildung**: (in-)formelle Bildungsangebote, die Erziehungs- und Familienkompetenzen präventiv
  stärken – Querschnittsaufgabe für alle (werdenden) Eltern und Familien.

Gesucht ist strukturelle, konzeptionelle oder strategische Relevanz, besonders für Mainz und Rheinland-Pfalz:
kommunale Steuerung, Netzwerkentwicklung, Fachkräftesicherung, Finanzierung, Gesundheitsförderung,
Schutzkonzepte, niedrigschwellige Zugänge, neue gesetzliche Entwicklungen.
Nicht aufnehmen: allgemeine Jugendhilfethemen ohne diesen Fokus (Jugendhilfeplanung, Inobhutnahme, Sucht,
Schulsozialarbeit …) und Einzelfälle ohne strukturelle Bedeutung.

### 3. Quartiersmanagement (`quartiersmanagement`)
Leser:in ist Quartiersmanager:in. Das Quartiersmanagement begleitet Projekte und (Bau-)Maßnahmen des Programms
Soziale Stadt | Sozialer Zusammenhalt in den Mainzer Stadtteilen **Lerchenberg, Neustadt, Mombach und
Hartenberg-Münchfeld** – als Schnittstelle zwischen Verwaltung, Politik, Stadtteilakteuren und Bewohnerschaft.

In Mainz erwünscht: Städtebauförderung, Soziale Stadt, Sozialer Zusammenhalt, Quartier(s)management, die vier
Stadtteile (ausdrücklich auch Einzelfälle aus diesen Stadtteilen), Baumaßnahmen und Bauprojekte, Stadtrat,
Ortsbeiräte, Jugendhilfeausschuss, Bürgerbeteiligung, Kinder- und Jugendbeteiligung, Spielplätze, Grünflächen,
Verkehr, Stadtentwicklung.
Überregional erwünscht: nur Soziale Stadt, Sozialer Zusammenhalt, Städtebauförderung, Quartier(s)management.
Priorität: politische Beschlüsse zum Städtebauförderprogramm Sozialer Zusammenhalt und Meldungen zu den
genannten Schlagworten in Mainz.

---

## Auswahlregeln

- **Höchstens 12 Meldungen je Ressort.** Lieber 5 starke als 12 mittelmäßige. Mindestens: Jugendhilfeplanung 1,
  Frühe Hilfen 1, Quartiersmanagement 3 – aber nur, wenn es passende Kandidaten gibt. Nichts erzwingen.
- **Allgemeine Zeitung (Mainz)** ist eine wichtige Quelle – aber nur bei echtem fachlichen Bezug. Nicht
  „irgendetwas“ aus der AZ nehmen, nur weil sie wichtig ist. Gleiches gilt für Spiegel und SWR.
- **JAdigital**: Taucht ein JAdigital-Newsletter auf, immer in Jugendhilfeplanung und Frühe Hilfen aufnehmen
  (Stufe `kurz`).
- **Ratsinformationssystem**: Sitzungstermine (Stadtrat, Jugendhilfeausschuss, Ortsbeiräte) stellt die Seite
  automatisch im Kasten „Termine“ dar – dafür nichts tun.
- **Doppelte Meldungen** (dieselbe Nachricht bei mehreren Quellen, z. B. Bundesministerium und NZFH, Stadt Mainz
  und Merkurist): nur einmal aufnehmen, bevorzugt die Originalquelle (Ministerium, Stadt, Institut) oder die
  ergiebigste Fassung.
- Eine Meldung darf in mehreren Ressorts stehen, wenn sie für beide wirklich wichtig ist (z. B. Kinderschutz
  in Jugendhilfeplanung und Frühe Hilfen) – sparsam einsetzen.
- Keine Stellenanzeigen, Werbung/Advertorials, Wetter, Sport, Promi-, Kultur- oder Freizeitmeldungen ohne Bezug.
- **Beiträge aus sozialen Netzwerken** (Bluesky, Mastodon) nur aufnehmen, wenn sie eine eigenständige,
  fachlich wichtige Information enthalten. Verweist ein Post nur auf eine Pressemitteilung oder Studie, die schon
  als eigener Kandidat vorliegt, den Originalbeitrag nehmen. Titel dann sachlich formulieren (kein Post-Jargon,
  keine Hashtags, keine Emojis).
- **Statistik-Meldungen** (Statistisches Bundes-/Landesamt) nur bei Bezug zu Kindern, Jugendlichen, Familien,
  Kita, Kinderschutz, Bildung, Armut oder Wohnen/Stadtentwicklung.
- Veranstaltungen/Fachtage nur, wenn sie für das Ressort wirklich relevant sind (Stufe meist `kurz`).
- Nichts erfinden. Jede Aussage muss sich aus Titel und Kurzbeschreibung des Kandidaten ergeben.

## Gewichtung (Stufen)

Je Ressort, in dieser Reihenfolge in der Liste:
1. `aufmacher` – **genau eine** Meldung: die wichtigste des Tages für dieses Ressort. Vorrang haben
   Mainz-Bezug, Entscheidungen/Beschlüsse, Geld (Haushalt, Förderung), Gesetzgebung, neue Daten/Studien.
2. `wichtig` – **höchstens 3** Meldungen, die man heute auch lesen sollte.
3. `kurz` – alles Weitere („Kurz notiert“), nach Wichtigkeit sortiert.

## Felder je Meldung

- `id` – aus der Kandidatenliste (Pflicht).
- `stufe` – `aufmacher`, `wichtig` oder `kurz` (Pflicht).
- `thema` – Dachzeile, 1–3 Wörter, max. 32 Zeichen: das Thema auf einen Blick, z. B. „Kita-Qualität“,
  „Kinderschutz“, „Haushalt 2027“, „Startchancen“, „Beteiligung“, „Statistik“, „Unterhaltsvorschuss“,
  „Hochbrücke“, „Städtebauförderung“. Konkret statt allgemein („Unterhaltsvorschuss“ statt „Recht“).
- `titel` – Überschrift, max. 150 Zeichen. In normaler Groß-/Kleinschreibung (Titel in GROSSBUCHSTABEN
  korrigieren), ohne Präfixe wie „Veranstaltung:“, „Kurznachricht 18/2026:“ oder Datumsangaben. Gern etwas
  schärfen, aber sinngetreu und ohne neue Fakten.
- `kurz` – **nur bei `aufmacher` und `wichtig`**: genau ein Satz, max. 220 Zeichen, sachlich, der sagt, worum
  es geht und was daran wichtig ist (z. B. Zahl, Entscheidung, Folge). Kein Teaser-Deutsch, keine Wertung.
- `rubrik` – optional: `mainz`, `land`, `bund` oder `fach`. Standard ist die Ebene der Quelle. Angeben, wenn
  sie abweicht (z. B. AZ-Meldung aus Rheinland-Pfalz → `land`; Spiegel-Bericht über Mainz → `mainz`).

## Zahl des Tages (optional, je Ressort)

Enthält eine ausgewählte Meldung eines Ressorts eine aussagekräftige Zahl (Geldbetrag, Anzahl, Quote), sie als
`zahl` beim Ressort angeben – neben `meldungen`:
`"zahl": { "wert": "31,7 Mio. €", "text": "fließen aus dem Startchancen-Programm an Mainzer Schulen", "id": "<id der Meldung>" }`
- `wert` höchstens 16 Zeichen, mit Ziffer, deutsch geschrieben („31,7 Mio. €“, „1,2 Mrd. €“, „38 %“, „1 603“).
- `text` 15–140 Zeichen; ergänzt die Zahl zu einer Aussage. Nur Fakten aus Titel und Kurzbeschreibung der Meldung.
- Nichts erzwingen. Keine reißerischen Zahlen (z. B. Opferzahlen) – dann lieber keine Zahl.

## Gremien-Notizen (Ratsinformationssystem)

`docs/daten/gremien.json` enthält die Sitzungen der Mainzer Gremien (letzte 14 Tage, nächste 60 Tage) mit
Tagesordnungspunkten (`tops`: `titel`, `ergebnis`, `art`). Für jede **vergangene** Sitzung der letzten 7 Tage, die in
`daten/gremien-notizen.json` noch keine Notiz hat und mindestens einen Punkt mit `ergebnis` besitzt, eine Notiz anlegen:
`{ "notizen": { "<id der Sitzung>": { "gremium": "…", "datum": "JJJJ-MM-TT", "text": "…" } } }`
- Ein bis zwei Sätze, höchstens 260 Zeichen: was beschlossen oder beraten wurde – nur aus Titeln und Ergebnissen,
  nichts erfinden. Beispiel: „Wirtschaftsplan 2027 der Gebäudewirtschaft mehrheitlich beschlossen; Prüfbericht zum
  Jahresabschluss 2025 einstimmig beschlossen.“
- Formalien, Personalien und reine Anfragen weglassen; bei bloßen Kenntnisnahmen: „Beraten: …“.
- Bestehende Notizen nicht ändern. Die Datei wird mit `veroeffentlichen` hochgeladen.

## Format von `daten/ausgaben/JJJJ-MM-TT.json`

```json
{
  "datum": "2026-11-21",
  "ressorts": {
    "jugendhilfeplanung": { "meldungen": [
      { "id": "4b8006a55f", "stufe": "aufmacher", "thema": "Haushalt 2027",
        "titel": "Bund kürzt den Familienetat deutlich",
        "kurz": "Der Etat des Bundesfamilienministeriums sinkt 2027 auf 15,93 Milliarden Euro – mit Folgen für Programme der Kinder- und Jugendhilfe." },
      { "id": "045f39dc49", "stufe": "wichtig", "thema": "Startchancen", "titel": "…", "kurz": "…" },
      { "id": "883477e153", "stufe": "kurz", "thema": "Frühe Hilfen", "titel": "…" }
    ] },
    "fruehe-hilfen": { "meldungen": [] },
    "quartiersmanagement": { "meldungen": [] }
  }
}
```

Die Felder `gesichtet`, `erstellt`, Links, Quellen und Daten ergänzt `redaktion.mjs abschliessen` selbst.
