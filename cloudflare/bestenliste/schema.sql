-- Anonyme Zählung des Boniblatts (D1-Datenbank „boniblatt-zaehlung“). Einmal einspielen:
--   npx wrangler d1 execute boniblatt-zaehlung --remote --file schema.sql
-- Es gibt nur Zähler je Tag – keine Adressen, keine Kennungen, keine Uhrzeiten.
CREATE TABLE IF NOT EXISTS zaehlung (tag TEXT NOT NULL, art TEXT NOT NULL, ziel TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, art, ziel));
CREATE TABLE IF NOT EXISTS titel (ziel TEXT PRIMARY KEY, titel TEXT NOT NULL);
-- Leserstimmen „relevant ja/nein“ (docs/blatt/daumen.js): je Monat und Meldung zwei Zahlen – sonst nichts.
CREATE TABLE IF NOT EXISTS daumen (monat TEXT NOT NULL, id TEXT NOT NULL, hoch INTEGER NOT NULL DEFAULT 0, runter INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (monat, id));
