# Redaktionsanleitung – Mainzer Boniblatt

Diese Datei ist die verbindliche Arbeitsanweisung für die werktägliche Morgenausgabe. Sie ersetzt die drei
DeepSeek-Prompts aus den früheren Make-Szenarien (Jugendhilfeplanung, Frühe Hilfen, Quartiersmanagement)
und übernimmt deren fachliche Kriterien.

Ziel: Fachkräfte öffnen morgens eine Seite und erkennen in einer Minute, **was heute wichtig ist, worum es
geht und woher es stammt**. Lieber eine strenge, treffsichere Auswahl als eine lange Liste.

## Erscheinungsweise

- Das Boniblatt erscheint **werktags (Montag bis Freitag)**. Samstags und sonntags gibt es keine Ausgabe.
- Die **Montagsausgabe** umfasst alle offenen Kandidaten seit der Freitagsausgabe (Freitag, Samstag, Sonntag).
  Die Höchstgrenzen bleiben gleich (12 je Ressort, ein Aufmacher, höchstens 3 wichtig) – die Auswahl wird also
  strenger, nicht länger.
- Die Hörfassungen erwähnen montags kurz, dass die Ausgabe auch die Meldungen vom Wochenende enthält; freitags
  verabschieden sie sich ins Wochenende („bis Montag“).

---

## Ablauf (werktags)

1. `git pull --rebase` (aktuellen Stand holen).
2. `node werkzeuge/redaktion.mjs vorbereiten`
   Das Skript schreibt alle noch nicht gesichteten Kandidaten nach `arbeit/kandidaten.md`
   (gruppiert nach Mainz / Rheinland-Pfalz / Bund / Fachwelt und nach Quelle, jeweils mit `[id]`).
3. `arbeit/kandidaten.md` **vollständig** lesen.
4. Die Ausgabe als `daten/ausgaben/JJJJ-MM-TT.json` (heutiges Datum, Europe/Berlin) schreiben, Format unten.
   Nur `id`s aus der Kandidatenliste verwenden. Links, Quellen und Daten ergänzt das Skript selbst.
   Zum Schluss je Ressort die **Hörfassung** (`ressorts.<id>.hoerfassung`) aus dessen ausgewählten Meldungen schreiben
   (Abschnitt „Hörfassung“ unten).
   Danach die **Gremien-Notizen** ergänzen und die Vorschau der nächsten Sitzung pflegen (Abschnitt „Gremien-Notizen“ unten).
   Zuletzt entscheiden, ob heute der **Werbeflieger** fliegt, und gegebenenfalls den Spruch eintragen (Feld `flieger`,
   Abschnitt „Werbeflieger“ unten).
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
  Ein neuer Kandidat darf den Aufmacher nur ablösen, wenn er klar wichtiger ist. Die Hörfassung eines Ressorts dann
  anpassen, wenn sich dort Aufmacher oder wichtige Meldungen geändert haben.

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
Nicht aufnehmen: reine Gastronomie-, Laden- und Geschäftsmeldungen (Eröffnungen, Pächter- oder Wirtswechsel,
Speisekarten, Angebote) – auch nicht aus den vier Stadtteilen. Ausnahme: Die Meldung berührt erkennbar die
Quartiersentwicklung, etwa Leerstand, Nahversorgung, Treffpunkte im Stadtteil oder geförderte Projekte.

---

## Auswahlregeln

- **Höchstens 12 Meldungen je Ressort.** Lieber 5 starke als 12 mittelmäßige. Mindestens: Jugendhilfeplanung 1,
  Frühe Hilfen 1, Quartiersmanagement 3 – aber nur, wenn es passende Kandidaten gibt. Nichts erzwingen.
- **Allgemeine Zeitung (Mainz)** ist eine wichtige Quelle – aber nur bei echtem fachlichen Bezug. Nicht
  „irgendetwas“ aus der AZ nehmen, nur weil sie wichtig ist. Gleiches gilt für Spiegel und SWR.
- **JAdigital**: Taucht ein JAdigital-Newsletter auf, immer in Jugendhilfeplanung und Frühe Hilfen aufnehmen
  (Stufe `kurz`).
- **Ratsinformationssystem**: Sitzungstermine (Stadtrat, Jugendhilfeausschuss, Ortsbeiräte) nicht als Meldung
  aufnehmen – die Seite zeigt die nächste Sitzung automatisch im Kasten „Gremien“. Was in den Sitzungen für die
  Ressorts wichtig ist, steht in den **Gremien-Notizen** (Abschnitt unten).
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
- `icon` – optional, empfohlen: kleines Themen-Icon neben der Dachzeile. Nach dem **Thema der Dachzeile** wählen,
  nicht nach Nebenaspekten. Fehlt `icon`, leitet die Seite es per Schlagwort aus dem Thema ab. Nur diese IDs:

  | `icon` | Bedeutung – verwenden bei |
  |---|---|
  | `jugendhilfeplanung` | Kinder- und Jugendhilfe allgemein: SGB VIII, Jugendhilfeplanung, Hilfen zur Erziehung, Heimerziehung, Jugendarbeit, Jugendpolitik, Beteiligung junger Menschen |
  | `fruehe-hilfen` | Frühe Hilfen (0–3 Jahre), Schwangerschaft und Geburt, Familienhebammen, Gesundheit im Säuglings- und Kleinkindalter |
  | `kinderschutz` | Kinderschutz, Schutzkonzepte, Kindeswohlgefährdung, (sexualisierte) Gewalt, Aufarbeitung, Kinder- und Jugendmedienschutz |
  | `familie` | Familie und Familienpolitik, Eltern, Familienbildung, Familienzentren, Familienleistungen (Unterhaltsvorschuss, Elterngeld, Kindergeld) |
  | `kita` | Kindertagesbetreuung: Kita, Krippe, Kindertagespflege, Kita-Fachkräfte, Kita-Gesetze |
  | `schule` | Schule und Bildung: Startchancen, Ganztag, Schulbau, Schulwege, Übergang Kita–Schule |
  | `quartier` | Quartiersmanagement, Soziale Stadt / Sozialer Zusammenhalt, Städtebauförderung, Stadtteile und ihre Projekte |
  | `sozialraum` | Sozialraum und Stadtentwicklung: Sozialraumanalyse, Planung, Wohnen, Verkehr, Grün- und Freiflächen |
  | `gremien` | Stadtrat, Ausschüsse, Ortsbeiräte, Parlamente und Regierungen: Beschlüsse, Anträge, Anfragen |
  | `haushalt` | Haushalt und Finanzen: Etats, Förderprogramme, Zuschüsse, Kosten |
  | `zahl-des-tages` | Statistik, Daten, Monitoring, Prognosen |
  | `quellen` | Studien, Berichte, Fachpublikationen, Newsletter, Handreichungen |
  | `termine` | Veranstaltungen, Fachtage, Fortbildungen, Fristen |

## „Wusstest du schon?“ – abgeschafft

Den Kasten „Wusstest du schon?“ (früher „Zahl des Tages“) gibt es seit dem 20.11.2026 nicht mehr. Die Felder
`wusstest` und `zahl` **nicht mehr schreiben**; stehen sie noch in einer Datei, werden sie beim Abschließen entfernt.

## Hörfassung („Anhören“) – je Ressort

Teil jeder Ausgabe: **je Ressort** ein Sprechtext im Feld `hoerfassung` neben `meldungen`
(`ressorts.<id>.hoerfassung`). Beim Veröffentlichen spricht eine Azure-Stimme jeden Text als MP3 ein; die Seite spielt
sie über den Knopf „Anhören“ oben auf dem Bogen. Fehlt die MP3, liest die Sprachausgabe des Browsers den Text vor.
Optional, aber werktags für jedes Ressort mit Meldungen schreiben; Ressorts ohne Meldungen bekommen keine Hörfassung.
Das frühere Feld `hoerfassung` auf oberster Ebene (ein Text für alle Ressorts) gilt nur noch für alte Ausgaben.

- **Länge:** höchstens 3 Minuten Sprechzeit, also etwa **250–400 Wörter**. `pruefen` verlangt 900–2800 Zeichen je Text.
- **Jeder Text steht für sich** – wer nur ein Ressort hört, versteht alles ohne die anderen:
  1. ein einziger kurzer Einstiegssatz mit Datum und Ressort („Guten Morgen, hier ist das Mainzer Boniblatt für die
     Jugendhilfeplanung am Freitag, 20. November.“) – danach sofort zur ersten Meldung,
  2. der Aufmacher,
  3. die wichtigen Meldungen,
  4. ein bis drei Punkte aus „Kurz notiert“,
  5. ein Schluss von höchstens zwei kurzen Sätzen („Alle Meldungen und Quellen finden Sie auf der Seite. Bis morgen.“).
  Montags kurz erwähnen, dass die Ausgabe auch das Wochenende umfasst; freitags ins Wochenende verabschieden
  („bis Montag“).
- **Stil: kompakt und zur Sache.** Lebendig formuliert, aber ohne Füllsätze – jeder Satz trägt eine Information.
  Spielerisch heißt hier: anschauliche Verben, gute Übergänge, mal eine pointierte Zuspitzung einer Zahl; keine Gags.
  Die Hörfassung läuft jeden Werktag – wiederkehrende Sprüche nerven schnell.
- **Keine Floskeln:** nicht „Kaffee bereit?“, „Dann legen wir los“, „Schön, dass Sie reinhören“, „Schnappen Sie
  sich …“, „Bleiben Sie dran“; keine rhetorischen Fragen an die Hörer, keine Wetter- oder Wochentagswitze. Einstieg
  und Schluss knapp halten und nicht jeden Tag wortgleich formulieren.
- **Ernste Themen** – Gewalt, Missbrauch, Todesfälle, Armut – sachlich und ohne lockeren Übergang.
- **Nur Fakten aus den ausgewählten Meldungen dieses Ressorts** (Titel, Kurztext). Nichts
  erfinden, nichts ergänzen, keine eigenen Wertungen, keine Gremien-Notizen, keine Kandidaten, die nicht in der
  Ausgabe stehen. Zahlen genau wie in der Meldung.
- **Für das Ohr schreiben:** kurze Sätze (höchstens etwa 25 Wörter), keine Klammern, keine Aufzählungszeichen,
  kein Markdown, keine Emojis. Absätze durch eine Leerzeile trennen (`\n\n` im JSON), etwa einer je Abschnitt.
- **Keine Links**, keine Adressen, keine IDs, keine Quellenangaben in Klammern (`pruefen` lehnt Links ab).
- **Abkürzungen und Zeichen ausschreiben:** „Millionen Euro“ statt „Mio. €“, „Milliarden“ statt „Mrd.“,
  „Paragraf 8a“ statt „§ 8a“, „Prozent“ statt „%“, „zum Beispiel“ statt „z. B.“, „Rheinland-Pfalz“ statt „RLP“,
  „Nationales Zentrum Frühe Hilfen“ statt „NZFH“, „Deutsches Jugendinstitut“ statt „DJI“,
  „Sozialgesetzbuch Acht“ statt „SGB VIII“. Gängige, buchstabiert gesprochene Kürzel wie EU, OECD oder SWR dürfen
  bleiben. Daten ohne Jahreszahl, wenn klar („am Samstag“, „im Januar“).

## Werbeflieger – der Spruch des Tages

Im Intro der Seite zieht an manchen Tagen ein kleines Flugzeug ein Banner über den Himmel. Ob es heute fliegt und was
auf dem Banner steht, entscheidest du beim Schreiben der Ausgabe: Feld `flieger` ganz oben in der Ausgabe (neben
`datum`). Kein Flug = Feld weglassen.

**Wie oft:** etwa in jeder dritten Ausgabe. `arbeit/kandidaten.md` nennt ganz oben die Lage für heute (Wochentag,
Jahreszeit, Wetter in Mainz, besondere Tage, letzte Flüge) und eine Empfehlung. Nie in zwei Ausgaben hintereinander –
das lehnt die Prüfung ab. Fällt dir nichts wirklich Gutes ein, bleibt der Flieger am Boden: lieber einen Tag später
als ein schwacher Spruch.

**Der Spruch:** eine Zeile, höchstens 34 Zeichen (besser bis 28), trocken und leicht selbstironisch – der Humor von
Leuten, die in Jugendamt, Sozialplanung und Quartiersarbeit arbeiten und über ihren eigenen Alltag schmunzeln.
Woran er anknüpfen kann, in dieser Reihenfolge der Vorliebe:

1. eine Meldung der heutigen Ausgabe (Gesetz, Förderprogramm, Statistik, Sitzung),
2. das Fach allgemein: Jugendhilfe, Jugendhilfeplanung, Frühe Hilfen, Quartiersmanagement, Soziale Stadt bzw. Sozialer
   Zusammenhalt (Abkürzungen, Fristen, Fallzahlen, Bedarfsplanung, Verfügungsfonds, Gremien, Fördermittelabruf),
3. Wetter, Wochentag oder ein besonderer Tag (steht in der Lage).

**Regeln**

- Gelacht wird über Verwaltung, Fachsprache, Fristen, Geld, Sitzungen und das Wetter – **nie** über Kinder, Jugendliche,
  Familien, Betroffene, einzelne Personen, Parteien oder Träger.
- Nichts Zynisches zu Kinderschutzfällen, Gewalt, Armut oder Tod. Ist die Hauptmeldung des Tages schwer, fliegt er nicht.
- Keine Behauptungen, die jemand für eine Nachricht halten könnte (keine erfundenen Zahlen, Beschlüsse oder Termine).
- Keine Links, Hashtags oder Emojis; normale Groß- und Kleinschreibung. Abkürzungen des Fachs sind willkommen
  (HzE, JHA, SGB VIII, KJSG, ISEK, QM, ASD).
- Jeder Spruch nur einmal – die Prüfung vergleicht mit den früheren.

**Beispiele** (nur zur Orientierung, nicht übernehmen)

| Anlass | Spruch |
|---|---|
| Meldung: Gesetzentwurf | `KJSG-Reform incoming` |
| Meldung: Kosten der Hilfen zur Erziehung | `Wie viel kostet HzE? Ja.` |
| Meldung: Kita-Bedarfsplan | `Bedarfsplanung: Bedarf ja, Plan folgt` |
| Meldung: Fachkräftemangel | `Fachkräfte gesucht. Überall.` |
| Meldung: Förderprogramm läuft aus | `Fördermittel bis 31.12. abrufen!` |
| Fach: Sitzungswoche | `JHA tagt. Kaffee steht bereit.` |
| Fach: Statistik | `Sozialraumdaten: Es ist kompliziert` |
| Fach: Quartiersarbeit | `Verfügungsfonds: Ist noch was da?` |
| Fach: Programmname | `Soziale Stadt heißt jetzt anders` |
| Fach: Beteiligung | `Beteiligung! Bitte alle mitmachen` |
| Wetter: Regen | `Regen. Die Akten bleiben trocken.` |
| Wetter: Sonne | `Sonne satt – Sitzung trotzdem` |
| Wetter: Schnee | `Schnee! Hausbesuch mit Schlitten` |
| Montag | `Montag. Kaffee ist Fachstandard.` |
| Freitag | `Freitag ab eins … Sie wissen schon` |
| Brückentag | `Brückentag: Wer ist eigentlich da?` |
| Advent | `Noch drei Sitzungen bis Weihnachten` |
| Fastnacht | `Helau! Auch im Jugendhilfeausschuss` |

## „Was geht?“ – Termine der nächsten 7 Tage

Unten auf der Seite steht eine Reihe kleiner Karten mit dem, was vom Erscheinungstag an in den nächsten 7 Tagen los ist –
ausdrücklich auch für Feierabend und Wochenende gedacht. Das Feld `termine` der Ausgabe ist eine Liste mit 8 bis 14
Terminen, jeder mit seinem Tag. Die Seite zeigt daraus immer nur, was noch nicht vorbei ist. Gibt es nichts Belegtes,
fehlt das Feld; die Kachel erscheint dann nicht.

**Fußball – nur diese vier Mannschaften:** FC Barcelona, Real Madrid, die spanische und die ägyptische
Nationalmannschaft (Männer). Ihre Pflicht- und Länderspiele der 7 Tage eintragen; die Seite zeigt je Mannschaft nur das
nächste Spiel, damit es nicht zu viel wird. Keine anderen Vereine, auch nicht Mainz 05, und keine weiteren
Champions-League-Spiele. Der Mannschaftsname muss im `titel` genau so stehen: „FC Barcelona“, „Real Madrid“, „Spanien“,
„Ägypten“. Anstoß immer in deutscher Zeit (Europe/Berlin); `ort` nennt den Wettbewerb.

**Dazu aus dem Rhein-Main-Gebiet** – Mainz zuerst, dann Wiesbaden, Frankfurt, Ingelheim und Umgebung: Feste, Märkte,
Konzerte, Kino- und Theaterabende mit breitem Publikum, Neueröffnungen, Angebote
für Familien. Nichts Nischiges, keine abseitigen Kunst-Veranstaltungen, keine Werbung, keine Dauerangebote ohne Anlass.

**Spiele-Neuheiten** (`art: "spiel"`): große Videospiel-Veröffentlichungen der 7 Tage – nur Titel, über die breit berichtet
wird (große Reihen, viel erwartete Neuheiten), höchstens zwei je Ausgabe. `tag` ist der Erscheinungstag, `titel` der Name
des Spiels, `ort` die Plattformen („PC, PS5, Xbox“), `url` die Seite des Herstellers oder ein seriöser Bericht. Keine
Erweiterungen, Betas, Mobilspiele oder Nischentitel.

**Tipps, wenn wenig los ist** (`art: "restaurant"` oder `"ausflug"`): Kommen weniger als acht belegte Termine zusammen,
füllen ein bis drei Tipps aus der Region auf – Restaurants mit besonderem Konzept, außergewöhnlicher Küche oder Aussicht,
oder eine besondere Unternehmung. Nur Orte, die es nachweislich gibt und die geöffnet haben (Quelle: eigene Seite des
Hauses oder ein seriöser Bericht), keine Ketten, keine Werbung. `tag` ist der Erscheinungstag, `wann` bleibt leer,
`ort` nennt Stadt und Lage; die Seite schreibt statt des Tages „Tipp“ und zeigt den Tipp eine Woche lang.

Nur Termine mit verlässlicher Quelle (Veranstalter, Stadt, Verein, Verband, seriöse Medien) – nichts erfinden und nichts
aus dem Gedächtnis schreiben. Lässt sich ein Termin nicht belegen, bleibt er weg.

| Feld | Inhalt |
| --- | --- |
| `art` | bestimmt das Bild: `fussball`, `sport`, `markt`, `flohmarkt`, `fest`, `musik`, `party`, `kino`, `theater`, `ausstellung`, `neu` (Neueröffnung), `familie`, `wein`, `essen`, `fastnacht`, `spiel` (Videospiel-Neuheit), `restaurant` und `ausflug` (Tipps) |
| `tag` | Datum des Termins, `JJJJ-MM-TT`, vom Erscheinungstag bis 7 Tage danach |
| `wann` | kurz, höchstens 16 Zeichen: „21 Uhr“, „ab 16 Uhr“; ganztägig: leer |
| `titel` | 4–52 Zeichen: „Real Madrid – FC Barcelona“, „Weihnachtsmarkt eröffnet“ |
| `ort` | 2–34 Zeichen: „La Liga“, „Champions League“, „Mainz, Domplätze“ |
| `url` | die Quelle (https://…) |

## Gremien-Notizen (Ratsinformationssystem)

`docs/daten/gremien.json` enthält die Sitzungen der Mainzer Gremien (letzte 14 Tage, nächste 60 Tage) mit
Tagesordnungspunkten (`tops`: `titel`, `ergebnis`, `art`). Daraus entsteht in `daten/gremien-notizen.json` je Sitzung
eine Notiz **je Ressort**. Die Seite zeigt im Kasten „Gremien“ unter „Das kommt“ alle Sitzungen der nächsten 7 Tage mit einem
Thema für das gewählte Ressort und unter „Das war“ alle der letzten Woche (Jugendhilfeausschuss, Sozialausschuss und
Stadtrat 14 Tage) – ohne Obergrenze, die drei Kern-Gremien zuerst.

```json
{ "notizen": {
  "5137": { "gremium": "Jugendhilfeausschuss", "datum": "2026-11-10", "url": "https://bi.mainz.de/si0057.php?__ksinr=5137",
    "ressorts": {
      "jugendhilfeplanung": "Teilhaushalt Jugend 2027, 2,4 Mio. € Mehrbedarf HzE/§ 35a und Campus-Modell beschlossen; Kita-Schutzkonzept zurückgestellt.",
      "fruehe-hilfen": "Familienzentren/Campus-Modell beschlossen; Rahmenschutzkonzept für städtische Kitas zurückgestellt." } },
  "4961": { "gremium": "Stadtrat", "datum": "2026-11-25", "url": "https://bi.mainz.de/si0057.php?__ksinr=4961", "vorschau": true,
    "ressorts": { "jugendhilfeplanung": "Haushalt 2027, 2,4 Mio. € Mehrbedarf HzE/§ 35a, Krippe Pusteblume, Sozialraumanalyse." } },
  "5189": { "gremium": "Werkausschuss der Stadtreinigung Mainz", "datum": "2026-11-13", "url": "https://bi.mainz.de/si0057.php?__ksinr=5189",
    "ressorts": {} }
} }
```
- Schlüssel ist die `id` der Sitzung; `gremium`, `datum` und `url` aus `gremien.json` übernehmen.
- `ressorts`: einen Schlüssel (`jugendhilfeplanung`, `fruehe-hilfen`, `quartiersmanagement`) **nur**, wenn die Sitzung
  einen echten Bezug zu diesem Ressort hat (Profile oben). Hat sie für kein Ressort etwas: `"ressorts": {}` – so ist
  erkennbar, dass sie gesichtet wurde.
- Text je Ressort **eine kurze Zeile** (Richtwert 60–120 Zeichen, höchstens 160): die relevanten Punkte als Stichworte
  und, falls vorhanden, das Ergebnis („beschlossen“, „zurückgestellt“, „zur Kenntnis genommen“). Nur aus Titeln und
  Ergebnissen, nichts erfinden. Formalien, Personalien und Punkte ohne Ressortbezug weglassen.
- `ergebnis` (nur bei vergangenen Sitzungen mit veröffentlichtem Ergebnis, nie bei `vorschau`): je Ressort eine Liste mit
  ein bis zwei festen Wörtern – `beschlossen`, `einstimmig`, `mehrheitlich`, `abgelehnt`, `vertagt`, `zurückgestellt`,
  `zur Kenntnis`. Beispiel: `"ergebnis": { "jugendhilfeplanung": ["beschlossen", "zurückgestellt"] }`. Die Seite zeigt
  daraus die Marken am Eintrag. Nur setzen, wenn das Ergebnis in `gremien.json` (`tops[].ergebnis`) eindeutig so steht;
  im Zweifel weglassen – dann liest die Seite es vorsichtig aus dem Text oder zeigt nichts.
- Maßstab: **Jugendhilfeplanung** – Jugendhilfeausschuss, Haushalt der Jugendhilfe, Kita-Bedarfsplanung und
  Kita-Plätze, Schule und Bildung, Sozialraumanalyse, Integration und anderes mit städtischer Tragweite.
  **Frühe Hilfen** – Kinderschutz, Schutzkonzepte, Frühe Hilfen, Familienbildung und Familienzentren.
  **Quartiersmanagement** – die vier Stadtteile Lerchenberg, Neustadt, Mombach, Hartenberg-Münchfeld (auch ihre
  Ortsbeiräte), Soziale Stadt / Sozialer Zusammenhalt, Städtebauförderung, Sozialraumanalyse. Ortsbeiräte anderer
  Stadtteile nur bei ausdrücklichem Bezug.
- `vorschau: true` – die Notiz beruht nur auf der Tagesordnung (kommende Sitzung oder noch keine Ergebnisse
  veröffentlicht). Dann ohne Ergebnis formulieren („auf der Tagesordnung“, „Anfragen zu …“).

**Werktags**, nach der Ausgabe:
1. **Neue vergangene Sitzungen:** Jede vergangene Sitzung in `gremien.json` mit Tagesordnung (`tops`), die noch keine
   Notiz hat, bekommt eine. Sitzungen ohne `tops` überspringen.
2. **Ergebnisse nachtragen:** Notizen mit `vorschau: true`, deren Sitzung vorbei ist und für die jetzt Ergebnisse
   (`ergebnis`) vorliegen, neu schreiben und `vorschau` entfernen.
3. **Vorschau der nächsten Sitzung:** Die nächste kommende Sitzung von Jugendhilfeausschuss, Sozialausschuss oder
   Stadtrat (wer zuerst tagt) bekommt eine Notiz mit `vorschau: true`, **sobald ihre Tagesordnung steht** (`tops` nicht
   leer); ändert sich die Tagesordnung, die Vorschau anpassen. Ohne Punkte für ein Ressort schreibt die Seite
   „Keine Punkte mit Bezug zu …“.
4. Notizen ohne `vorschau` nicht mehr ändern. `veroeffentlichen` prüft die Datei (Format, Ressorts, höchstens
   160 Zeichen) und lädt sie hoch; die Seite zeigt vergangene Sitzungen der letzten 21 Tage und die kommenden.

## Format von `daten/ausgaben/JJJJ-MM-TT.json`

```json
{
  "datum": "2026-11-23",
  "flieger": "Wie viel kostet HzE? Ja.",
  "termine": [
    { "art": "fussball", "tag": "2026-11-25", "wann": "21 Uhr", "titel": "Real Madrid – FC Barcelona", "ort": "La Liga", "url": "https://…" },
    { "art": "markt", "tag": "2026-11-26", "wann": "ab 16 Uhr", "titel": "Feierabendmarkt", "ort": "Mainz, Altstadt", "url": "https://…" }
  ],
  "ressorts": {
    "jugendhilfeplanung": { "meldungen": [
      { "id": "4b8006a55f", "stufe": "aufmacher", "thema": "Haushalt 2027", "icon": "haushalt",
        "titel": "Bund kürzt den Familienetat deutlich",
        "kurz": "Der Etat des Bundesfamilienministeriums sinkt 2027 auf 15,93 Milliarden Euro – mit Folgen für Programme der Kinder- und Jugendhilfe." },
      { "id": "045f39dc49", "stufe": "wichtig", "thema": "Startchancen", "icon": "schule", "titel": "…", "kurz": "…" },
      { "id": "883477e153", "stufe": "kurz", "thema": "Frühe Hilfen", "icon": "fruehe-hilfen", "titel": "…" }
    ],
      "hoerfassung": "Guten Morgen und willkommen beim Mainzer Boniblatt für Montag, den 23. November 2026 – heute in der Jugendhilfeplanung, mit allem, was seit Freitag passiert ist. …\n\n…" },
    "fruehe-hilfen": { "meldungen": [] },
    "quartiersmanagement": { "meldungen": [] }
  }
}
```

`flieger` ist freiwillig (etwa jede dritte Ausgabe, siehe „Werbeflieger“) – sonst die Zeile weglassen.
Die Felder `gesichtet`, `erstellt`, Links, Quellen und Daten ergänzt `redaktion.mjs abschliessen` selbst.
