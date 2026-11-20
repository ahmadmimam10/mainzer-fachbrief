# Qualitätssicherung – Mainzer Boniblatt

Läuft alle 3 Tage als Cloud-Routine („Mainzer Boniblatt – Qualitätssicherung“). Ziel: Fehler finden und beheben,
bevor sie auf der Seite auffallen. **Keine Mails, keine Nachrichten nach außen** – alles wird in `daten/wartung.md`
dokumentiert. GitHub schreibt nur Protokolle; die Läufe schlagen nie „rot“ fehl.

## Prüfliste

1. `git pull --rebase origin main`
2. **Abrufprotokoll** `daten/laufprotokoll.json` (letzte 3 Tage): Läufe mit `"ergebnis": "fehler"`? Lücken über
   6 Stunden zwischen Läufen? Wiederkehrende Zeilen unter `auffaellig`?
3. **Quellenzustand** `daten/quellen-zustand.json`: alle Quellen mit `gestoert` oder `auffaellig` ansehen.
   Gestörte HTML- und Sonderquellen mit Schnappschuss in `daten/diagnose/` reparieren: Ursache im Schnappschuss
   finden, `quellen.json` anpassen (`muster`, `bereich`, `datumNach`, `urls`, `typ`) und offline testen mit
   `node werkzeuge/sammeln.mjs --probe --nur=<id> --datei=<schnappschuss>`, bis Titel, Links und Daten plausibel sind.
   Nicht reparierbar (Inhalte nur per JavaScript, Seite gesperrt, Angebot eingestellt): `"aktiv": false` und
   `"hinweis": "…"` setzen. Reine Netzaussetzer (z. B. Bundesrat sperrt GitHub zeitweise) nicht anfassen.
4. **Stille Ausfälle**: Quellen, die laut `trefferVerlauf` Treffer melden, aber seit über 14 Tagen keine neue Meldung
   in `daten/pool/` geliefert haben, obwohl sie sonst regelmäßig liefern. Prüfen, ob die Seite nur alte Meldungen
   zeigt oder das Datum falsch erkannt wird; reparieren wie unter 3.
5. **Ausgaben** der letzten 3 Werktage in `daten/ausgaben/`: Gibt es für jeden Werktag (Mo–Fr) eine? Samstags und sonntags erscheint bewusst keine. Haben alle Meldungen `url`,
   `quelle`, `titel`? Doppelte Meldungen über mehrere Tage? Auffällige Titel (Großbuchstaben, Datumsreste, Müll)?
   `node werkzeuge/redaktion.mjs bauen` muss fehlerfrei laufen.
6. **Gremien** `docs/daten/gremien.json`: `fehler`-Felder? Vergangene Sitzungen ohne Tagesordnung, die eine haben
   müssten? Sind die Notizen in `daten/gremien-notizen.json` für die letzten 7 Tage vollständig (Format laut
   REDAKTION.md)? Fehlende ergänzen.
7. **Webseite** `docs/index.html` nur bei einem klar belegten Fehler minimal korrigieren.
8. **Jährliche Terminpflege** (Intro-Motive der besonderen Tage): `node werkzeuge/termine-pruefen.mjs` ausführen.
   Meldet es fehlende Einträge für das **nächste Jahr** und ist es **Oktober oder später**, die Termine einmal ergänzen:
   - `FERIEN` in `werkzeuge/intro-feste.mjs`: Schulferien Rheinland-Pfalz (Oster-, Sommer-, Herbst-, Weihnachtsferien;
     erster und letzter Ferientag). Quelle: KMK-Ferienübersicht oder Bildungsministerium Rheinland-Pfalz (per `curl` abrufen), mit
     einer zweiten Quelle gegenprüfen.
   - `TERMINE` in derselben Datei: Johannisnacht und Weinmarkt Mainz (erster und letzter Festtag laut mainz.de bzw.
     mainzplus.com). Sind sie noch nicht veröffentlicht, nichts eintragen – dann gilt die Faustregel; im nächsten Lauf
     wieder prüfen.
   - Danach `node werkzeuge/intro-einbauen.mjs` (baut `docs/index.html` neu) und `node werkzeuge/termine-pruefen.mjs`
     erneut; den ausgegebenen Plan auf Plausibilität prüfen (z. B. Ostern Mi–Mo, Weihnachten ab den letzten zwei
     Arbeitstagen vor Heiligabend) und im Protokoll festhalten. Die Regeln selbst (wann ein Motiv erscheint) nicht ändern.

## Erlaubte Änderungen

`quellen.json`, `daten/wartung.md`, `daten/gremien-notizen.json`, `werkzeuge/*.mjs` (nur bei eindeutig belegtem
Parserfehler; danach `node --check <datei>` und Offline-Probe), `docs/index.html` (nur Punkt 7 und über `node werkzeuge/intro-einbauen.mjs` nach Punkt 8), `FERIEN`/`TERMINE` in
`werkzeuge/intro-feste.mjs` (nur Punkt 8) und `docs/daten/*`
(nur über `node werkzeuge/redaktion.mjs bauen`). Nichts löschen außer Diagnose-Schnappschüssen erledigter Fälle.

## Protokoll

In `daten/wartung.md` oben einen Eintrag ergänzen: Datum, „Qualitätsprüfung“, Befund je Prüfpunkt in einer Zeile,
Änderungen, offene Punkte. Auch ohne Befund kurz „Alles in Ordnung“ eintragen.

## Veröffentlichen

```bash
git add quellen.json daten werkzeuge docs
git commit -m "Qualitätsprüfung JJJJ-MM-TT"
git pull --rebase origin main && git push origin HEAD:main
```

Bei abgelehntem Push erneut `git pull --rebase origin main` und `git push origin HEAD:main`.
