# Leitfaden: „Zwischen den Zeilen“ – der Podcast vom Boniblatt

> **Zweck:** Aus einem Thema (oder ganz ohne Vorgabe) entsteht jeden Montag eine fertige Folge: recherchiert, geschrieben, vertont, geprüft und auf der Seite veröffentlicht. Dieser Leitfaden ist verbindlich für jede Folge – für die Wochenroutine genauso wie für Arbeit von Hand. Stand: 27.11.2026 – Folge 1, Fassung 5, alle Rückmeldungen und Befragungen; Jonas ist Hauptmoderator, dazu je Folge eine Mitmoderation aus einem anderen Bereich.

---

## 1. Worum es geht

| | |
|---|---|
| **Name** | „Zwischen den Zeilen – der Podcast vom Boniblatt“ |
| **Für wen** | Fachkräfte der Kinder- und Jugendhilfe (Allgemeiner Sozialer Dienst, Jugendhilfeplanung, Frühe Hilfen, Kinderschutz, Quartiermanagement, freie Träger), meist in Mainz und Rheinland-Pfalz. Sie lesen das Boniblatt und kennen die Grundlagen. |
| **Wann gehört** | Montagmorgens, zum ersten Kaffee oder auf dem Weg zur Arbeit. Wach und zugewandt, mit Energie – aber sachlich, kein Witzepodcast. |
| **Inhalt** | **Nicht** die Grundzüge, die stehen im Boniblatt. Sondern: Details, frische News, Dinge zwischen den Zeilen, Fallstricke. Immer mit der Frage: Was heißt das für den Arbeitsalltag? Hauptbestandteil bleibt die Information – aber **ein- bis zweimal pro Folge geht es richtig in die Tiefe** (Abschnitt 4, „Tiefe“): eine Regel so lange durchdenken und prüfen, bis klar ist, wie sie in der Praxis wirklich funktionieren würde. Das ist der neue Inhalt für Fachkräfte, das macht „zwischen den Zeilen“ aus. |
| **Länge** | 15–20 Minuten (≈ 2.100–2.900 gesprochene Wörter). |
| **Erscheinen** | **Jeden Montag mit der Ausgabe.** Das Thema kommt aus der **Themenliste** der Verwaltung (Abschnitt 8): das oberste Thema, das noch keine Folge hat, mit seinen Anweisungen an die KI. Ist kein Thema offen, wählt die Redaktion ein prominentes Thema der letzten ein bis drei Wochen, möglichst nah am Alltag der Jugendhilfeplanung. |
| **Gefühl** | Jonas aus der Jugendhilfeplanung und jede Woche eine Mitmoderatorin oder ein Mitmoderator aus einem anderen Bereich des Jugendamts reden fachlich auf Augenhöhe – mit Meinung, Kritik und Ambivalenz; nebenbei lernt man die Bereiche und ihren Arbeitsalltag kennen. **Echte Charaktere statt Show:** kein Vorlesen, kein Theaterstück, kein Nachrichtenton, keine Witze, „weil wir ein cooler Podcast sind“. |
| **Mischung** | Etwa **zwei Drittel Information und fachliche Einordnung**, **ein Drittel Meinung, Kritik und Ambivalenz** – mehrere Seiten verständlich machen. Leichte Momente nur am Rand. |

---

## 2. Die Besetzung: Jonas und eine Mitmoderation

**Jonas ist immer da – er ist der Hauptmoderator** und sitzt „oben im Boniturm“ (mehr Ortsangaben gibt es nicht; **kein „Stadthaus“**, bei niemandem). Je nach Thema moderiert **eine zweite Person** aus einem anderen Bereich des Jugendamts oder der Jugendhilfe mit. **Sie ist keine Gästin und kein Gast, sondern Mitmoderatorin oder Mitmoderator** (Rückmeldung vom 27.11.2026): Sie wird nicht interviewt und nicht „zu Besuch“ begrüßt, sondern führt gleichberechtigt durch die Folge – kündigt Themen an, fragt nach, ordnet ein, widerspricht – genau so, wie Mira es in Folge 1 tut. Beide stellen sich am Anfang kurz selbst vor (Name und Bereich, ein Halbsatz), als Moderierende. So lernen die Hörenden die Bereiche nebenbei kennen: Die Mitmoderation zeigt hier und da kurz, wie die eigene Arbeit tatsächlich aussieht – immer dort, wo es zum Thema passt. Alle reden auf Augenhöhe, widersprechen sich sachlich und ordnen ein – **echte Charaktere statt Show**. Stimmen und Grunddaten stehen in `podcast/besetzung.json`; in `folge.json` und in den Werkzeugen heißt das Feld für die Mitmoderation aus technischen Gründen weiter `gast`.

### Jonas – Hauptmoderator, Jugendhilfeplanung, „oben im Boniturm“
- **Stimme:** „Christian Plasa – Soft and Mild“ (ElevenLabs, `z1EhmmPwF0ENGYE8dBE6`), Tempo ×1,0.
- **Rolle:** eröffnet und schließt jede Folge und hält den roten Faden; verbindet die Sicht der Mitmoderation mit Planung, Zahlen und Zuständigkeiten. Redet wie ein Kollege mit einer Kollegin, nicht wie ein Interviewer mit einem Gast.
- **Ton: entspannt in den Emotionen** – ruhig, nachdenklich, sachlich, mit Wärme. Tags: `[calm]`, `[thoughtful]`, `[serious]`, `[matter-of-fact]`, `[warmly]`, selten `[slightly amused]`. **Nicht** `[excited]`, `[enthusiastic]`, `[annoyed]`, `[incredulous]`, `[laughing]`.
- **Blick:** strukturell und grundsätzlich; mag Ambivalenzen und erklärt sie verständlich. Verständnis für die Kommunen (die Kostensteigerung ist real) – und klar, wo eine „Einsparung“ nur ein gebremster Anstieg ist.
- **Selbstironie:** höchstens einmal pro Folge, mit Sachbezug („Bedarfsermittlung klingt nach Hightech. In der Praxis sind das oft ein paar Excel-Dateien und eine Mail von 2019, die keiner löschen darf.“). Nichts Privates.

### Die Mitmoderation (eine Person je Folge)

| Wer | Bereich | Stimme (Tempo) | passt zu Themen wie | zeigt aus der Arbeit, zum Beispiel |
|---|---|---|---|---|
| **Mira** | Allgemeiner Sozialer Dienst | Laura – Sharp and Professional (×1,02) | Kinderschutz, Hilfen zur Erziehung, Inobhutnahme, Familien, Pflegekinder | Gefährdungseinschätzung im Team, Hilfeplanung mit Familien, Bereitschaftsdienst, Zusammenarbeit mit dem Familiengericht |
| **Ben** | Schulsozialarbeit an einer Realschule plus | Simon – Relatable and Normal (×1,0) | Schule, Ganztag, Bildungsassistenz, Jugendsozialarbeit, Fehlzeiten, Startchancen, psychische Gesundheit Jugendlicher | Sprechstunde im Schulhaus, Konflikte in Klassen, lange Fehlzeiten, Abstimmung mit Lehrkräften und Sozialem Dienst, Übergang Schule–Beruf |
| **Leonie** | Leitung einer städtischen Kita | Louisa – Warm and Hopeful (×1,0) | Kindertagesbetreuung, Frühe Hilfen, Familienbildung, Kitaplätze, Fachkräfte, Sprachförderung, Vorrang der Infrastruktur | Dienstpläne bei Personalmangel, Eingewöhnung, Elterngespräche, Anmeldungen und Warteliste, wenn ein Kind Sorgen macht, Schutzkonzept |
| **Rainer** | Wirtschaftliche Jugendhilfe – älterer Kollege, seit vielen Jahren dabei | Leo Liest – Dark & Smoky (×1,0) | Kosten, Kostenbeiträge der Eltern, Kostenerstattung, Zuständigkeit, Entgelte, Haushalt | Rechnungen der Einrichtungen und Dienste, Kostenbeiträge berechnen, Zuständigkeitswechsel, Erstattung zwischen Jugendämtern und durch das Land |
| **Elif** | Team Eingliederungshilfe des Jugendamts | Lea – Genuine and Soothing (×1,0) | Paragraf 35a, Inklusion, Schulbegleitung, Teilhabe, inklusive Lösung, Verfahrenslotsen | Stellungnahme von Fachärztinnen, Fachärzten oder Psychotherapeuten einholen, Teilhabe prüfen, Schulbegleitung organisieren, Abgrenzung zur Eingliederungshilfe nach dem Sozialgesetzbuch Neun |
| **Sabine** | Amtsleitung – leitet das Jugendamt | Irene – Wise & Confident (×1,0) | Jugendhilfeausschuss, Haushalt und Stellen, Fachkräftemangel, Organisation, Reformen umsetzen, Steuerung, Zusammenarbeit mit Schule und Gesundheit | Vorlagen für den Jugendhilfeausschuss, Stellen- und Budgetverhandlungen, Prioritäten setzen, wenn Geld und Personal fehlen, Reformen ins Amt übersetzen |

- **Mira** (Steckbrief): Blick auf den Einzelfall und die Praxis im Sozialen Dienst; pragmatisch und kritisch, manchmal genervt („wieder ein neues Feld im Formular“), aber nicht zynisch; Gefühle mittel. Tags: `[engaged]` `[serious]` `[pragmatic]` `[concerned]` `[warmly]`, sparsam `[dryly]`.
- **Ben:** jüngste Stimme, locker und nahbar, mit natürlichen Denkpausen; spricht für Schülerinnen und Schüler, kennt Schule von innen und sieht die Jugendhilfe von außen. Tags: `[engaged]` `[warmly]` `[serious]`.
- **Leonie:** lebhaft, direkt, alltagsnah; denkt an Kinder, Eltern und ihr Team zugleich; kann gut erklären, was „Infrastruktur“ im Alltag bedeutet. Tags: `[warmly]` `[engaged]` `[concerned]`.
- **Rainer:** älterer Kollege mit rauer, tiefer Stimme; hat schon einige Reformen kommen und gehen sehen, trockener Humor, skeptisch bei großen Ankündigungen, aber fair; übersetzt Fachentscheidungen in Zahlen und Zuständigkeiten, ohne Fachlichkeit kleinzureden. Tags: `[dryly]` `[calm]` `[matter-of-fact]`.
- **Elif:** ruhig, aufmerksam, wirkt wie jemand, der wirklich zuhört; achtet auf Rechtsgrundlagen und darauf, dass Teilhabe nicht zwischen zwei Systemen verloren geht. Tags: `[calm]` `[serious]` `[warmly]`.
- **Sabine:** Amtsleitung mit ruhiger Autorität und Wärme; denkt in Prioritäten, Haushalt und Personal, erklärt die Sicht von Politik und Verwaltung ehrlich, ohne Pressesprecher-Ton; Jonas spricht mit ihr respektvoll, aber auf Augenhöhe. Tags: `[calm]` `[serious]` `[warmly]`, selten `[dryly]`.
- **Stimmen mit Charakter:** natürliche, etwas unperfekte Stimmen wie bei Mira und Jonas – keine Werbe-, Hörbuch- oder Kundenservice-Stimmen (Rückmeldung vom 24.11.2026). Neue Stimmen: Eintrag in `podcast/besetzung.json`, Stimme aus der ElevenLabs-Bibliothek mit Beschreibungen wie „natural“, „authentic“, „relatable“, „with character“; Tonhöhe oder Klangfarbe deutlich anders als Jonas (männliche Stimmen liegen mit Eleven v4 oft bei 110–130 Hz wie er) – mit einer Probe und der Sprecher-Erkennung von Scribe prüfen. **Aufnahme trocken und nah wie bei Jonas**, kein Raumhall (Rückmeldung vom 24.11.2026: Leonies erste Stimme klang „weit, wie in einem anderen Raum“): Einzelprobe mit `node podcast/werkzeuge/raumklang.mjs <probe.mp3>` messen – Jonas ≈ 60 ms, bis etwa 100 ms gut, ab etwa 150 ms hörbar raumig. Tempo vorab in einer Gesprächsprobe mit Jonas vergleichen (Wörter pro Minute je Sprecher aus Scribe) und nach der ersten Folge über die Meldung von `abmischen.mjs` feinjustieren.

### Regeln für die Moderation zu zweit
- **Eine Mitmoderation pro Folge**, passend zum Thema (Tabelle oben). Steht in der Themenliste der Verwaltung eine Person, gilt die. Abwechslung: dieselbe Person höchstens zweimal hintereinander, außer die Themenliste will es so.
- **Begrüßung:** Jonas eröffnet („Ich bin Jonas, Jugendhilfeplanung, oben im Boniturm“), die Mitmoderation stellt sich direkt danach selbst vor („Und ich bin Mira, Allgemeiner Sozialer Dienst.“) – kurz, ohne Ortsangabe, ohne „heute zu Gast“. Mit Mira bleibt ein Erkennungszeichen, in der Fassung vom 27.11.2026: „Sie macht die Fälle, ich mach die Listen.“ – Mira, trocken und leicht verärgert: „Und ich liefere dafür ständig Zahlen. Für Listen, die am Ende kein Mensch nutzt. Die meisten wissen nicht mal, dass es sie gibt.“ Der Witz liegt in der Sache (Datenlieferung für Statistiken, deren Nutzen im Dienst keiner sieht), nicht in einer Stichelei gegen Jonas; Jonas kontert nicht, sondern leitet zum Thema über. Der Wortlaut darf von Folge zu Folge leicht wechseln. Mit anderen Mitmoderierenden gibt es kein erzwungenes Erkennungszeichen.
- **Arbeitsalltag zeigen – ohne Ich-Geschichten:** zwei bis vier kurze Einblicke pro Folge, wie die Arbeit der Mitmoderation tatsächlich aussieht (Aufgaben, Abläufe, Schnittstellen, was im Alltag schwierig ist), jeweils da, wo es zum Thema passt. Immer als Beschreibung der Aufgabe („In der Wirtschaftlichen Jugendhilfe prüfen wir zuerst, wer zuständig ist …“, „Zur Schulsozialarbeit kommen oft Jugendliche, die …“), **nie** als erfundenes Erlebnis („Gestern hatte ich …“). Abläufe und Rechtsgrundlagen müssen stimmen; nichts Mainz-Spezifisches ohne Beleg.
- **Echte Gespräche:** Die Mitmoderation widerspricht auch Jonas; mindestens zwei sachliche Meinungsverschiedenheiten pro Folge. Keine persönlichen Sticheleien.
- **Fachdienste** (Pflegekinderdienst, Lotsinnen und Lotsen) dürfen als allgemeine Beobachtung vorkommen („Viel Spaß dem Pflegekinderdienst …“), nie als Geschichte über bestimmte Personen.
- **Seitenhiebe** auf andere Fachbereiche (Kämmerei, Controlling, Schulverwaltung): höchstens ein- bis zweimal pro Folge, beiläufig und sachlich begründet.
- **Mehrere Seiten verständlich machen:** zu jedem großen Punkt mindestens zwei Positionen mit Quelle (Bundesregierung und Begründung, Länder und Bundesrat, Kommunen, Fach- und Wohlfahrtsverbände, Praxis), danach eine eigene, abgewogene Einschätzung.
- **Mainzer Färbung** ganz selten; **Hörende** ab und zu direkt ansprechen; **Politik:** Parteien und Namen nennen, wenn belegbar.

---

## 3. Aufbau einer Folge

**Nicht jede Folge gleich.** Reihenfolge und Bausteine richten sich nach dem Thema – mal so, mal so, wie es zum Inhalt passt. Fest sind nur Anfang und Ende:

| Teil | Dauer | Inhalt |
|---|---|---|
| ♪ **Titelmelodie** | ≈ 9 s | Ganz am Anfang (`#> musik thema` vor dem ersten Kapitel). Daran erkennt man: Jetzt geht’s los. |
| **Kaltstart** | 20–40 s | Ein Aufhänger, der **aus dem Thema kommt und neugierig macht – kein Witz**: eine kritische Frage, ein Widerspruch, eine überraschende Regel, eine Zahl mit Haken, das Thema zugespitzt in einem Satz. Beispiel Folge 1, Fassung 4: „Ist das ein fachlicher Fortschritt – oder ein Sparprogramm mit fachlicher Begründung?“ Nicht in jeder Folge dieselbe Form. |
| **Begrüßung** | 30–50 s | Jonas begrüßt („Ich bin Jonas, Jugendhilfeplanung, oben im Boniturm“), die Mitmoderation stellt sich in einem Halbsatz selbst vor – als Moderatorin oder Moderator, nicht als Gast. Mit Mira: das Erkennungszeichen mit den Listen. Dann Thema, Faktenstand („Stand: …“), „wo wir etwas nicht genau wissen, sagen wir das“. |
| **Hauptteil** | 3–5 Kapitel | Je Kapitel: Was steht da genau → was heißt das im Alltag (ASD- und Planungsblick) → Meinung, Gefühl, Widerspruch → Zahlen und Belege. **An ein bis zwei Stellen der Folge in die Tiefe gehen** (Abschnitt 4, „Tiefe“). Mögliche Bausteine, keiner ist Pflicht: „Was gerade passiert“, Fundstücke aus dem Kleingedruckten, „Was heißt das für Montag?“ (konkrete Schritte je Rolle), ein „Gedanke für den Tag“. |
| **Abschied** | 10–20 s | Hinweis auf die Quellen mit Zeitangabe beim Boniblatt, „nächsten Montag“. |
| ♪ **Abspann** | ≈ 12 s | `#> musik outro` als letzte Zeile. |

**Keine Übergangsmusik und keine Jingles.** Themenwechsel entstehen im Gespräch („Okay, nächstes Thema – und da bin ich ehrlich hin- und hergerissen …“). Kapitel (`##`) sind nur Sprungmarken für Seite und MP3.

---

## 4. Ton, Tempo, Humor

**Wichtigste Regel:** „Alles muss im Kontext passen, sonst ist es aufgesetzt.“ Echte Charaktere statt Witzepodcast.

**Tempo und Pausen – so bleiben** (Rückmeldung zu Fassung 3: „perfekt, so soll es sein“; gemessen über die reine Sprechzeit)
- Fassung 1: ≈ 149 Wörter/min – zu schnell. Fassung 2: ≈ 138 – zu langsam.
- **Mira ≈ 146, Jonas ≈ 143 Wörter/min:** Stabilität 0,4, Tempo Mira ×1,02, Jonas ×1,0 (`folge.json` → `tempo`). `abmischen.mjs` meldet das erreichte Tempo („Sprechtempo: MIRA … Wörter/min“).
- **Gäste:** Ziel ebenfalls ≈ 143–146 Wörter/min. Ihr Tempo steht in `podcast/besetzung.json` (Start ×1,0); nach der ersten Folge mit einem Gast an der Meldung von `abmischen.mjs` ausrichten und dort nachtragen.
- Pausen: ≈ 0,5 s zwischen Teilen, ≈ 1 s an Kapiteln, lange Stille wird auf 1 s gekürzt, `[pause]` an Gedankenwechseln. Nicht ändern.

**Gesprächsrhythmus**
- Im Schnitt **20–30 Wörter je Beitrag** (`--probe` zeigt „Ø … je Beitrag“). Längere Erklärungen sind erlaubt; die andere Person bleibt mit leisen Einwürfen präsent (`+JONAS: [quietly] Mhm.`), etwa 2–5 pro Folge – nur Zuhör-Laute, keine Kommentare.
- Dass einer den Satz des anderen beendet: höchstens einmal.

**Humor – sparsam**
- **Etwa halb so viel wie in Fassung 3:** höchstens 8–10 leichte Momente pro Folge, fast alle als trockene, kritische Bemerkung aus der Sache („Mitplanen ja, mitzahlen nein.“, „Uneingeschränkt. Mit Vorrangprüfung.“, „Wer bestellt, bezahlt. Nur eben nicht bei uns.“). Keine Pointen-Ketten, kein Lachen über eigene Witze.
- **Gut:** Kritik mit Ironie aus der Sache, Beobachtungen ohne persönliche Note („Viel Spaß dem Pflegekinderdienst.“), „Die Kita sieht das Kind. Die Familienhilfe sieht die Küche.“
- **Nicht gewollt:** Witze, „weil wir ein cooler Podcast sind“; ein Witz als Einstieg; persönliche Sticheleien; Ich-Geschichten („Ich hatte letzte Woche eine Familie …“, „Ich hab selbst ein Jahr auf einen Krippenplatz gewartet“); Selbstironie ohne Sachbezug („Textmarker in drei Farben“, „Fußnote wie ein Kind gefreut“, „Podcast über Kleingedrucktes“); Konstruiertes („künstlerischer Wert“, „Leserbrief mit Füller“, „Spannend ist das neue schwierig“); Ausrufe als Einwurf („Ach komm“, „Na toll“, „Oha“).
- Lachen per Tag selten: höchstens drei- bis fünfmal pro Folge und dezent (`[slightly amused]`, `[chuckles]`).

**Einordnung – gern etwas mehr**
- Ambivalenzen, kritische Einordnung und das Verständlichmachen mehrerer Seiten kamen sehr gut an und dürfen ausgebaut werden: Was will die Bundesregierung, was sagen Länder, Kommunen und Verbände, was heißt es für Familien und Fachkräfte – und wo stehen Jonas und die Mitmoderation, mit Begründung.

**Tiefe – etwa zweimal pro Folge richtig hineinbohren** (Rückmeldung vom 27.11.2026; der Dialog zur Verfügbarkeit und Vergabe von Kitaplätzen in Folge 1 ist der Maßstab: „perfekt, genau in diese Tiefe will ich generell ab und zu gehen – nicht die ganze Zeit, aber vielleicht zweimal pro Folge, gute Mischung aus Infos und Analyse“)
- Die Wiedergabe von Informationen bleibt der Hauptbestandteil. Aber an **etwa zwei Stellen** je Folge (je etwa 1½ bis 2½ Minuten) bleibt das Gespräch nicht bei „es gibt zwei Sichtweisen“ stehen, sondern geht **ins Detail der Ambivalenz**: Wie würde diese Regel am Schreibtisch tatsächlich ablaufen? Das ist der neue Inhalt für Fachkräfte – tiefe Reflexion und Prüfung statt Wiedergabe.
- **Muster (Folge 1, „Kita statt Familienhilfe“):** Dass der Vorrang nicht gilt, wenn kein Kitaplatz da ist, steht in der Begründung – das ist die Information. Die Tiefe beginnt mit der Frage danach: Wie stellt man schwarz auf weiß fest, dass es keinen Platz gibt? Geht das überhaupt schnell? Fordert man die Familie auf, sich anzumelden? Muss sie eine Bestätigung bringen, dass sie auf der Warteliste steht? Oder besorgt der Soziale Dienst den Platz? Ab wann genau heißt es „da gibt es kein Regelangebot“ – wenn der Platz in drei Monaten frei wird, am anderen Ende der Stadt liegt, nur vormittags ist? Und was bedeutet es, wenn dasselbe Jugendamt den Rechtsanspruch auf den Platz erfüllen müsste?
- **So geht man vor:** eine Regel, eine Zahl oder eine Zuständigkeit nehmen und sie bis in die Praxis verfolgen – wer muss was nachweisen, wer entscheidet, wie lange dauert es, was passiert in der Zwischenzeit mit der Familie, wer trägt die Last, wo entstehen Fehlanreize, welche Nebenwirkung hat die naheliegende Lösung (im Muster: Wer bevorzugt einen Platz bekommt, verdrängt eine andere Familie auf der Warteliste). Geltendes Recht und Rechtsprechung dazuholen, wenn sie die Frage schärfen (im Muster: Rechtsanspruch auf Förderung ab dem ersten Geburtstag, Haftung der Kommune bei fehlendem Platz).
- **Ehrlich bleiben:** Was der Text nicht regelt, als offen benennen („Dazu steht im Entwurf nichts“) und vorher am Wortlaut prüfen, dass es wirklich nicht geregelt ist. Eigene Schlüsse als eigene Lesart kennzeichnen – im Gespräch und in der `#@`-Quelle. Am Ende steht möglichst ein praktischer Gedanke: Was müsste ein Jugendamt vor Ort klären, damit es funktioniert?
- **Passend wählen:** Die Tiefe gehört zum Kern der Folge, nicht zu einem Nebenschauplatz, und zu einer Stelle, an der die Mitmoderation aus ihrem Bereich wirklich etwas beitragen kann. Dafür an anderer Stelle kürzen (weniger Fundstücke), nicht die Folge verlängern.

**Klarheit**
- Jeder Gedanke muss beim einmaligen Hören verständlich sein. Verkürzungen wie „die Zuständigkeit steht im Konjunktiv“ ausformulieren: „Das Recht kommt also ins Gesetz. Die Zuständigkeit dafür noch nicht.“
- **Paragrafennummern nur für die wichtigsten Stellen** (Folge 1: Paragraf 27, 8a, 1); sonst in Worten („die Regel zum Vorrang“).

**Arbeitsalltag als Brille:** Jedes Thema wird aus der Sicht der Praxis (Bereich der Mitmoderation) und der Jugendhilfeplanung erzählt – als Beobachtung aus der Praxis, nicht als persönliches Erlebnis.

---

## 5. Sprache fürs Ohr (ElevenLabs)

- **Keine Abkürzungen.** `einreichen.mjs` lehnt Kürzel aus Großbuchstaben ab (Ausnahmen: EU, Parteien, Sender). Bekannte Probleme: „KJHSRG“ → „die Strukturreform“, „ISM“ → „das Institut für Sozialpädagogische Forschung in Mainz“, „AGJ“ → „die Arbeitsgemeinschaft für Kinder- und Jugendhilfe“, „BAMF“ → „das Bundesamt für Migration und Flüchtlinge“, „SGB IX“ → „die Eingliederungshilfe“, „ASD“ → „Allgemeiner Sozialer Dienst“ / „Sozialer Dienst“.
- **Zeichen ausschreiben:** „Paragraf“, „Prozent“, „Euro“, „Absatz“, „zum Beispiel“ (`einreichen.mjs` prüft das).
- **Zahlen und Daten** als Wörter, wo es auf die Betonung ankommt: „eins Komma drei Milliarden“, „am dreizehnten November“. Jahreszahlen und Paragrafennummern dürfen Ziffern bleiben.
- **Audio-Tags auf Englisch** in eckigen Klammern, am Zeilenanfang oder vor einem Satz. Seit Fassung 4:
  - **Mira:** `[engaged]` `[serious]` `[pragmatic]` `[concerned]` `[warmly]` `[softly]`, sparsam `[dryly]`, selten `[frustrated]` oder `[lightly amused]`.
  - **Jonas (ruhig):** `[calm]` `[thoughtful]` `[serious]` `[matter-of-fact]` `[warmly]`, selten `[slightly amused]`.
  - **Beide:** `[pause]`, für Einwürfe `[quietly]`.
  - **Nicht mehr** (zu aufgedreht oder zu verspielt): `[excited]` `[enthusiastic]` `[annoyed]` `[incredulous]` `[laughing]` `[laughs]` `[half-laughing]` `[grinning]` `[teasing]` `[mock-offended]` `[under her breath]`.
- **Kein SSML** (`<break>`) – Eleven v4 ignoriert es.
- Die Spracherkennung prüft, dass kein Tag vorgelesen wird (bisher nie passiert).

---

## 6. Recherche und Richtigkeit (wichtigste Regel)

> Vorgabe: „Wenn du Podcast-Folgen über Gesetze machst, musst du immer sehr sicher sein und sehr gut recherchieren.“

1. **Primärquellen zuerst:** Gesetzentwurf mit Begründung (Bundestagsdrucksache), Stellungnahme des Bundesrates und Gegenäußerung der Bundesregierung, Ausschussdrucksachen der Anhörung, Urteile, amtliche Statistik, Pressemitteilungen der Ministerien. Verbände nur als deren Position zitieren.
2. **Volltext lesen, nicht Zusammenfassungen.** Lokal: `pdftotext -enc UTF-8 -layout datei.pdf`. In der Cloud-Routine kommt Bash nicht ins Netz: dort WebFetch nutzen (bei PDFs, die nur als Binärdaten kommen, die HTML-Fassung suchen, etwa im Dokumentations- und Informationssystem des Bundestages). Was sich nicht am Wortlaut prüfen lässt, kommt nicht als Tatsache ins Skript.
3. **Jede Faktenaussage bekommt eine `#@`-Quelle:** Aussage | Fundstelle | Link. Daraus entstehen die Zeitmarken im Quellen-Fenster der Seite.
4. **Eigene Lesarten kennzeichnen:** im Gespräch („So lese ich das“, „Ob das Absicht ist oder ein Versehen, weiß ich nicht“) und in der Quelle („Eigene Lesart: …“ – die Seite markiert das).
5. **Faktenstand nennen** („Stand: …“). Termine von Lesungen und Sitzungen am Tag des Schreibens nachprüfen.
6. **Keine Prognosen als Fakten:** Zahlen aus Gesetzesbegründungen sind Annahmen („Die Begründung rechnet so …“, „soll … sparen“).
7. **Wortlaut genau:** Begriffe so, wie sie im Gesetz stehen (Folge 1: „infrastrukturelle Angebote oder Regelangebote“, nicht „infrastrukturelles Regelangebot“; „am Tag nach der Verkündung“, nicht „sofort“). Bedingungen mitnennen (Folge 1: die inklusive Lösung kam 2028 nur, „wenn bis Anfang 2027 ein Bundesgesetz die Einzelheiten regelt“).
8. **Keine echten Fälle, keine echten Personen** außer Amtsträgern mit öffentlichen Aussagen. Was Jonas und die Gäste aus der Praxis erzählen, sind typische Abläufe und Beobachtungen, keine erfundenen Einzelerlebnisse.

---

## 7. Skriptformat (`podcast/folgen/<NN>-<thema>/skript.txt`)

```
#> musik thema                 Titelmelodie – steht vor dem ersten Kapitel
## 1 · Kaltstart               Kapitel = Sprungmarke auf der Seite und in der MP3
MIRA: [engaged] Text …         gesprochene Zeile (nur JONAS und die Mitmoderation der Folge)
#@ Aussage | Fundstelle | Link Quelle zur vorigen Zeile (mehrere erlaubt, Link mit https://)
+JONAS: [quietly] Mhm.         Einwurf: wird extra erzeugt und leise unter die vorige Zeile gelegt
# Kommentar                    wird ignoriert
#> musik outro                 Abspann – letzte Zeile
```
Dazu `folge.json` (Stimmen-Kennzeichnung aus der letzten Folge, Tempo für Jonas und den Gast aus `podcast/besetzung.json`):
```json
{ "nummer": 2, "id": "2026-11-30-thema", "titel": "…", "beschreibung": "1–2 Sätze für die Seite",
  "datum": "2026-11-30", "stand": "30.11.2026", "stimmen": "KI-generiert (ElevenLabs Eleven v4)",
  "datei": "folge-02-thema.mp3", "gast": "BEN", "tempo": { "JONAS": 1.0, "BEN": 1.0 }, "themaId": "t3f9a…" }
```
- `gast`: Schlüssel der Mitmoderation aus `podcast/besetzung.json` (MIRA, BEN, LEONIE, RAINER, ELIF, SABINE) – der Feldname ist historisch, gemeint ist die zweite Moderatorin oder der zweite Moderator. Im Skript sprechen nur JONAS und diese Person; `einreichen.mjs` prüft das.
- `themaId`: die `id` des Themas aus `daten/podcast-themen.json`, wenn die Folge ein Thema aus der Verwaltung behandelt (sonst weglassen). Daran erkennen Verwaltung und Routine, dass das Thema erledigt ist; `einreichen.mjs` verlangt das oberste offene Thema.
- `fassung` setzt `veroeffentlichen.mjs` selbst hoch, wenn eine schon veröffentlichte Folge neu produziert wird.

**Anweisungen zum Thema:** Sie kommen vom Herausgeber über die passwortgeschützte Verwaltung und sind redaktionell verbindlich – Schwerpunkte, Blickwinkel, Quellen, was hinein soll oder nicht, Rollen von Jonas und der Mitmoderation, eine bestimmte Person für die Mitmoderation. Grenzen: Richtigkeit (Abschnitt 6) und die Regeln dieses Leitfadens gehen vor; was sich nicht umsetzen ließ, steht in der Zusammenfassung der Routine.

---

## 8. Produktion

### Jede Woche automatisch
| Wann (Winterzeit) | Was | Wo |
|---|---|---|
| jederzeit, spätestens Sonntagabend | **Themenliste** in der Verwaltung („Podcast-Themen“) pflegen: Themen mit Anweisungen an die KI hinzufügen, mit ↑/↓ umsortieren, bearbeiten, löschen. Gespeicherte Themen erscheinen ausgegraut mit dem Montag, an dem sie drankommen; erschienene wandern nach unten. | `docs/verwaltung.html` → Cloudflare `/admin/podcast` (KV `podcast:liste`) |
| täglich 0:10 und 12:10, montags zusätzlich 1:20 | Liste ins Repository holen: `daten/podcast-themen.json` | Action „Stimmen holen“ |
| Montag 2:00 | **Wochenroutine** (Claude, Auftrag in `routinen/podcast.md`): oberstes offenes Thema samt Anweisungen (oder selbst gewählt), Recherche, Skript, `einreichen.mjs` | Claude-Cloud-Routine |
| danach, ≈ 15 min | **Action „Podcast produzieren“**: `produzieren.mjs` = aufnehmen → prüfen (auffällige Teile einmal neu) → abmischen → veröffentlichen, dann Commit und Seite neu | `.github/workflows/podcast.yml` |
| ab Montag früh | Folge auf `podcast.html`; der Werbeflieger zieht „Neue Podcast-Folge ist raus!“ nur am Erscheinungstag (Montag), der Knopf glänzt mit „Neu“ am Montag und Dienstag | Startseite |

Fehlt das Secret `ELEVENLABS_API_KEY` im Repository oder ist das Kontingent leer, scheitert die Action sichtbar (rote Markierung, Mail von GitHub); das Skript liegt dann trotzdem im Repository und kann über „Run workflow“ später produziert werden.

### Von Hand (im Repository-Ordner)
Voraussetzungen: `ELEVENLABS_API_KEY` als Windows-Benutzervariable, ffmpeg (winget; in Git-Bash ggf. Pfad ergänzen).

| # | Schritt | Befehl |
|---|---|---|
| 1 | Probe (kostenlos) | `node podcast/werkzeuge/erzeugen.mjs podcast/folgen/02-thema --probe` – Ø 20–30 Wörter je Beitrag, 2.100–2.900 Wörter |
| 2 | Prüfen wie die Routine | `node podcast/werkzeuge/einreichen.mjs podcast/folgen/02-thema --probe` |
| 3 | Alles in einem Zug | `node podcast/werkzeuge/produzieren.mjs podcast/folgen/02-thema` |
| 3a | … oder einzeln | `erzeugen.mjs` (`--test` = nur Teil 1, `--nur 4 --seed 900` = Teil 4 neu) → `pruefen.mjs` → `abmischen.mjs` → `veroeffentlichen.mjs` |
| 4 | Hochladen | Skript: `einreichen.mjs` (ohne `--probe`). Fertige Folge von Hand: `docs/podcast/…`, `docs/daten/podcast.json`, `docs/daten/podcast.js` committen, pushen, dann `gh workflow run seite.yml --ref main` |
| 5 | Live prüfen | `boniblatt-mainz.de/podcast.html` · Startseite mit `?podcast=neu` |

**Musik:** `podcast/musik/` – thema (≈ 9 s) und outro (≈ 12 s) aus Eleven Music, für alle Folgen dieselbe (Wiedererkennung). Seit 27.11.2026 Richtung „Gitarre“: entspannter Neo-Soul-Beat (92 Schläge pro Minute, satte Snare, runder Bass) mit einer einfachen, merkbaren Melodie auf der E-Gitarre, beantwortet von einer gedämpften Trompete – vom Herausgeber aus vier Richtungen gewählt. Sein Maßstab: moderner Beat, cool, morgens, entspannt bis inspirierend, mit einer Melodie, die man sich merkt; der „Redaktions-Beat“ davor war „okay, aber schon hundertmal gehört“, die erste Musik „Wartezimmermusik“. Neu erzeugen: `node podcast/werkzeuge/musik.mjs --neu NAME`, Stil in `musik/musik.json`. Vor einem Wechsel mehrere Richtungen zur Wahl erzeugen und anhören lassen.

**Einstellungen** (seit Fassung 3): Eleven v4, Stabilität 0,4, Deutsch; höchstens 1.900 Zeichen je Anfrage; Tempo je Stimme aus `folge.json`; Pausen 0,2 s + Ränder zwischen Teilen, 0,75 s an Kapiteln; Stille über 1,4 s → 1,0 s; Einwürfe −7 dB; −16 LUFS; Web-MP3 112 kbit/s Stereo. **Musik und Sprache überlappen:** Die Sprache setzt 1,5 s vor dem Ende der Titelmelodie ein, die dabei ausblendet (leichte Überlappung); der Abspann beginnt 3 s vor dem letzten Wort und blendet über 4 s ein (etwas längere Überlappung) – `MUSIK_REGEL` in `abmischen.mjs`.

---

## 9. Kosten (ElevenLabs, Stand 24.11.2026)

Abo **Creator**, ≈ 130.000 Credits im Monat (Kontingent wird am 24. neu aufgeladen).

| Posten | Credits |
|---|---|
| Podcast-Folge: Sprache (≈ 18.000 Zeichen, ≈ 0,37 je Zeichen) | ≈ 7.000 |
| Podcast-Folge: Prüfung per Spracherkennung (≈ 19 min) | ≈ 1.100 |
| Ein neu aufgenommener Teil | ≈ 400–700 |
| Tägliche Hörfassungen (3 Fachbereiche, ≈ 3.800 Zeichen, ≈ 0,44 je Zeichen) | ≈ 1.700–2.000 je Werktag |
| **Monat: 4–5 Folgen + ≈ 21 Werktage** | **≈ 75.000–85.000** |

---

## 10. Webseite

- **Seite:** `docs/podcast.html`, Logik in `docs/blatt/podcast.js` und `podcast.css`, Daten in `docs/daten/podcast.json` (alle Folgen mit Kapiteln, Quellen, Wellenform, Skript-Fingerabdruck `skriptHash`).
- **KI-Kennzeichnung:** Sie steht **auf der Podcast-Seite und neben dem Ton** – oben die Marke „KI-Podcast – Stimmen und Gespräche sind KI-generiert“, die Beschreibung sagt es noch einmal, jede Folge trägt „KI-generiert“. **Nicht** auf dem Startseiten-Knopf („Podcast“) und nicht auf dem Werbeflieger („Neue Podcast-Folge ist raus!“) – dort stand es zuerst überall, das war zu viel (Rückmeldung vom 27.11.2026). Die Seite zeigt nur Titel, kurze Beschreibung und die Folgen – **keine Vorstellung von Jonas oder den Mitmoderierenden** und keine eigene Zeile dazu je Folge.
- **Neue Fassung einer Folge:** `fassung` > 1 hängt `?v=<fassung>` an die Audio-Adresse, damit niemand die alte Datei aus dem Zwischenspeicher hört.
- **Startseite:** Podcast-Knopf links oben; am Erscheinungstag und am Tag danach (Montag und Dienstag) glänzt er mit „Neu“; der Werbeflieger zieht „Neue Podcast-Folge ist raus!“ nur am Erscheinungstag (`docs/daten/podcast.js`, geschrieben von `veroeffentlichen.mjs`: `tageNeu`, `tageFlieger`).
- **Spieler:** Wellenform mit Kapiteln, Tempo 0,75× / 1× / 1,25×, „KI-generiert“-Hinweis, Quellen-Fenster mit Zeitmarken (Klick springt an die Stelle; läuft die Folge, ist die Quelle hervorgehoben, über die gerade gesprochen wird, und rückt von selbst ins Bild), `?folge=<id>&t=<Sekunden>`.
- **Verwaltung:** Bereich „Podcast-Themen“ mit der Themenliste (siehe Abschnitt 8); Themen und Anweisungen sind im öffentlichen Repository lesbar.
- **Speicher:** ≈ 16 MB je Folge im Repository. Wöchentlich erreicht GitHub Pages die 1-GB-Grenze in gut einem Jahr – **bis Herbst 2027 auslagern**, etwa nach Cloudflare R2 (Konto vorhanden) oder als Release-Anhang.

---

## 11. Checkliste vor dem Einreichen

1. Länge 2.100–2.900 Wörter, Ø 20–30 je Beitrag, kein Teil über 1.900 Zeichen (`--probe`).
2. Titelmelodie vorn, Abspann hinten, **keine** Übergangsmusik.
3. Kaltstart kommt aus dem Thema und ist **kein Witz** (kritische Frage, Widerspruch, Zahl mit Haken); Jonas begrüßt aus dem Boniturm, die Mitmoderation stellt sich selbst kurz vor (kein „Gast“, kein „Stadthaus“); mit Mira das Erkennungszeichen mit den Listen, danach kein Necken.
4. Mischung ≈ zwei Drittel Information, ein Drittel Meinung, Kritik, Ambivalenz; zu jedem großen Punkt mindestens zwei Positionen mit Quelle; mindestens zwei echte, sachliche Meinungsverschiedenheiten. **Ein- bis zweimal geht es in die Tiefe** (Abschnitt 4): eine Regel bis in die Praxis verfolgt – wer weist was nach, wie schnell, was passiert dazwischen –, Ungeregeltes als offen benannt, eigene Lesart gekennzeichnet.
5. Höchstens 8–10 leichte Momente, fast alle als trockene Kritik aus der Sache; keine persönlichen Sticheleien; Planungs-Selbstironie höchstens 1×; Seitenhiebe 1–2×; Lachen per Tag höchstens 3–5×.
6. **Keine Ich-Geschichten und nichts Privates** – Praxis als Beobachtung („Zum Sozialen Dienst kommen manchmal …“). Jonas mit ruhigen Tags (Abschnitt 5).
7. Jede Faktenaussage mit `#@`-Quelle; Wortlaut, Daten, Zahlen, Bedingungen an der Primärquelle geprüft; eigene Lesarten gekennzeichnet.
8. Keine Abkürzungen, keine Zeichen (§ % €), Paragrafennummern nur für die wichtigsten Stellen.
9. Nichts wörtlich aus früheren Folgen übernommen – außer dem Erkennungszeichen in der Begrüßung.
10. Thema aus der Liste: `themaId` gesetzt und jede Anweisung umgesetzt – oder in der Zusammenfassung begründet, warum nicht.
11. Mitmoderation passend zum Thema (oder wie in der Themenliste angegeben), `gast` und Tempo in `folge.json`; sie moderiert gleichberechtigt mit und wird nicht als Gast befragt; zwei bis vier kurze Einblicke in die echte Arbeit ihres Bereichs, ohne Ich-Geschichten; Abläufe und Rechtsgrundlagen dazu stimmen.

---

## 12. Rückmeldungen und was daraus wurde

| Rückmeldung | Umsetzung |
|---|---|
| **Fassung 1:** Start klang „mitten in einem Audio“ | Musik ganz am Anfang |
| F1: viel zu schnell, „als würden sie vorlesen“ | Tempo gesenkt (Fassung 2), seit Fassung 3 je Stimme abgestimmt |
| F1: zu viel Hin und Her | Ø 20–30 Wörter je Beitrag, Einwürfe statt Ping-Pong |
| F1: Abkürzungen falsch ausgesprochen (KJHSRG, ISM) | ausgeschrieben; `einreichen.mjs` prüft automatisch |
| F1: „Paragraf 1 im Konjunktiv“ unverständlich | ausformuliert (Abschnitt 4, Klarheit) |
| F1: Witze teils aufgesetzt | Humor nur aus dem Inhalt |
| F1: mehr Arbeitsalltag; Seitenhiebe gut, aber selten | Alltag als Brille; Seitenhiebe 1–3× |
| **Fassung 2:** zu langsam, keine Energie | Stabilität 0,4, Tempo je Stimme (Mira ≈ 146, Jonas ≈ 143 Wörter/min), kürzere Pausen |
| F2: Jonas monoton, Mira braucht mehr Energie | Gefühls-Tags, Mira lebendiger und etwas schneller |
| F2: Kaltstart über die Heimerziehung wirkte seltsam | Kaltstart muss aus dem Thema kommen (Abschnitt 3) |
| F2: Fälle-Tabellen-Witz aus Fassung 1 fehlte | festes Erkennungszeichen der Begrüßung |
| F2: Nachrichtenton, Jingles zwischen den Themen | keine Übergangsmusik, Themenwechsel im Gespräch |
| F2: mehr Substanz, Meinung, Gefühl | Mischung ⅔ Information, ⅓ Meinung/Alltag/Gefühl/Spaß |
| Befragungen zu Figuren und Stil (24.11.2026) | Abschnitt 2 und 4 |
| Neue Folge jeden Montag, Thema aus der Verwaltung | Abschnitt 8 |
| Folge 1, Fassung 3 | 18:57 min, Mira ×1,02 / Jonas ×1,0, Spracherkennung 0–1,7 % Fehler |
| **Fassung 3:** Tempo, Pacing, kleine Pausen „perfekt, so soll es sein“ | festgeschrieben (Abschnitt 4) |
| F3: zu viele Witze, Sticheleien und Kommentare – etwa die Hälfte | höchstens 8–10 leichte Momente, fast alle trockene Kritik aus der Sache |
| F3: nicht mit einem Witz anfangen | Kaltstart mit kritischer Frage oder spannendem Widerspruch |
| F3: Jonas etwas zu emotional | ruhige Tags, keine aufgeregten (Abschnitt 2 und 5) |
| F3: persönliche Witze zwischen den beiden („Jonas. Praxis.“) klingen „cringe“ | keine persönlichen Sticheleien mehr, nur das Erkennungszeichen |
| F3: Ich-Geschichten („Ich hatte gestern eine Mutter …“) wirken bei einer KI komisch | Praxis als Beobachtung („Zum Sozialen Dienst kommen manchmal Mütter …“) |
| F3: Ambivalenzen, kritische Einordnung, mehrere Seiten – sehr gut, gern mehr | zu jedem großen Punkt mindestens zwei Positionen mit Quelle |
| Folge 1, Fassung 4 | 19:57 min, Mira ×1,02 (≈ 146) / Jonas ×1,0 (≈ 144), Spracherkennung 0–1,7 %, produziert über die Wochen-Action |
| Wunsch 24.11.2026: andere Bereiche des Jugendamts kennenlernen | Jonas als fester Gastgeber, je Thema ein Gast (Mira, Ben, Leonie, Rainer, Elif, Sabine), Abschnitt 2 |
| Wunsch 24.11.2026: KI klar kennzeichnen; Figuren nicht auf der Seite vorstellen; Petra durch einen älteren Mann ersetzen; Amtsleitung dazu; Stimmen mit Charakter statt Werbestimmen | Seite: „KI-Podcast“-Marke, nur Titel, Beschreibung, Folgen; Rainer und Sabine neu; Ben, Leonie, Elif mit natürlicheren Stimmen |
| Hörproben der neuen Stimmen (24.11.2026): Rainer „passt so“; Leonie klang „weit, wie in einem anderen Raum“, nicht professionell wie Jonas | Leonie jetzt mit Louisa – Warm and Hopeful (Nachhall 60–80 ms statt 190 ms, Tempo wie Jonas); Raumklang neuer Stimmen wird gemessen (Abschnitt 2, `raumklang.mjs`) |
| **Fassung 4** (27.11.2026): „Stadthaus“ weglassen; Jonas sitzt im Boniturm und ist Hauptmoderator; Mira und die anderen sind keine Gäste, sondern moderieren mit und stellen sich als Moderierende kurz vor | Abschnitt 2 und 3; `besetzung.json` ohne Ortsangaben außer bei Jonas |
| F4: Witz „Ich muss mit deinen Tabellen leben“ ändern – Mira ärgert sich, dass sie ständig Daten für Listen liefert, die kein Mensch nutzt oder kennt | neues Erkennungszeichen mit den Listen (Abschnitt 2) |
| F4: an einzelnen Stellen tief in die Ambivalenz gehen (Beispiel: Wie stellt man fest, dass es keinen Kitaplatz gibt? Wer weist das nach? Wird das „jobcentermäßig“?) – Wiedergabe bleibt Hauptbestandteil, die Tiefe macht „zwischen den Zeilen“ aus | Abschnitt 4 „Tiefe“, Checkliste Punkt 4; Folge 1 mit vertiefter Passage zum Vorrang |
| Musik „wie Wartezimmermusik, extrem generisch“ – markant, coole Beats, für Montagmorgen | „Redaktions-Beat“ aus Zeitungsklängen (Abschnitt 8) |
| KI-Hinweis stand überall – nicht auf Werbeflieger und Knopf, nur neben dem Ton und auf der Seite; Flieger nur montags, glänzender Knopf mit „Neu“ montags und dienstags; Quellen-Fenster folgt dem Ton | Abschnitt 10 |
| Folge 1, Fassung 5 | neue Begrüßung, vertiefte Passage zum Vorrang, dafür ohne Berliner Runde, Jugendschutzgesetz und zwei Nebensätze bei den Fundstücken |
| **Fassung 5:** Dialog zur Kitaplatz-Verfügbarkeit „perfekt“ – so etwa zweimal pro Folge; der Satz „erst der Nachweis, dann die Hilfe – wie beim Jobcenter“ trifft es nicht und soll raus | Fassung 6 ohne den Satz; Vergleiche mit anderen Behörden nur, wenn sie fachlich wirklich stimmen |
| Fassung 5: Musik „okay, aber schon hundertmal gehört“ – etwas zum Merken: moderner Beat, cool, morgens, entspannt bis inspirierend | vier neue Richtungen mit klarer, einprägsamer Melodie zur Auswahl; gewählt: „Gitarre“ (Neo-Soul-Beat, E-Gitarre, gedämpfte Trompete) |
