---
title: "Geräte-Eingang: ein Foto statt fünfzehn Minuten"
excerpt: "Früher war das Erfassen eines gebrauchten Geräts eine Tabellenkalkulation, ein CSV-Export und eine Kette von Handübergaben bis in Kivitendo — und im Shop erschien trotzdem nichts. Wie wir daraus einen Ablauf gemacht haben, der ein Gerät in Sekunden ins System bringt, wie die Systeme über APIs miteinander reden, und welcher Baustein noch fehlt."
author: "RevampIT Team"
featuredImage: "/blog/geraete-eingang-hero.svg"
category: "Technik"
tags:
  - geraete-eingang
  - ki
  - erfassung
  - kivvi
  - kivitendo
  - architektur
  - automatisierung
publishedAt: "2026-07-21"
published: true
---

Jedes Gerät, das bei Revamp-IT ein zweites Leben bekommt, muss zuerst *ins System*. Klingt banal. War es nicht. Genau an dieser unscheinbaren Stelle — dem Erfassen — verlor die Werkstatt über Jahre am meisten Zeit, und genau hier ist am wenigsten Wertschöpfung: Ein Laptop wird nicht besser, nur weil jemand seine Daten abtippt. Diese Geschichte handelt davon, wie wir aus fünfzehn Minuten Handarbeit eine Aufnahme in Sekunden gemacht haben — und was technisch dahintersteckt.

## Das Problem: erfassen war eine Zumutung

Am Anfang war eine Tabelle. Wer ein Gerät aufnehmen wollte, tat der Reihe nach Folgendes: das Gerät **wiegen**, mit dem Messband die **Grösse** nehmen, ein **Foto** schiessen, und dann die Spezifikationen und einen plausiblen Preis **zusammengoogeln** — Modellnummer, CPU, RAM, Verkaufspreis, alles von Hand in ein privates Spreadsheet getippt (kopiert und eingefügt, meistens).

Danach begann die Übergabekette. Heinz führte die einzelnen Tabellen zu einer **Sammeltabelle** zusammen und exportierte sie als **CSV**. Cem lud diese CSV in **Kivitendo** hoch, unser Perl-basiertes ERP und buchhalterisches Buch der Wahrheit. Und selbst dann war das Gerät nirgends sichtbar: Im Shop erschien es **nicht automatisch** — das war nochmals ein separater, manueller Schritt.

![Der alte Erfassungs-Workflow: wiegen, messen, fotografieren, Specs googeln flossen in ein privates Spreadsheet, das Heinz zu einer Sammeltabelle zusammenführte, als CSV exportierte und an Cem übergab, der es in Kivitendo hochlud; im Shop erschien nichts automatisch — 5 bis 15 Minuten reine Handarbeit pro Gerät.](/blog/geraete-eingang-alt.svg)

Fünf bis fünfzehn Minuten reine Handarbeit — **pro Gerät**, verteilt über mehrere Personen. Das Ergebnis war absehbar: Eigentlich hätten alle im Team erfassen sollen, aber nur wenige taten es. Nicht aus Unwillen, sondern weil die Hürde zu hoch war. Ein Ablauf, den niemand gern macht, wird zum Flaschenhals — und ein Berg unerfasster Geräte wächst im Lager.

## Die Vision: die Erfassung praktisch auf null bringen

Die Zielsetzung war bewusst radikal formuliert: die Zeit, die es braucht, um ein Produkt ins System zu bekommen, um **99,9 %** senken. Nicht «etwas schneller», sondern eine andere Grössenordnung.

Der Gedanke dahinter: Ein Foto eines Geräts enthält bereits fast alles, was wir wissen müssen — Hersteller, Modell, oft sogar der Zustand. Ein hingeschriebener Name («Lenovo ThinkPad T450 i5») ebenso. Mit KI, die aus diesem Rohmaterial strukturierte Felder macht, und mit sorgfältig gebauten Systemen, die über **APIs miteinander sprechen**, sollte eine einzige Geste genügen: fotografieren oder tippen — und das Gerät landet dort, wo es hingehört. In der Datenbank mit einem Lagerplatz verknüpft, oder direkt als Inserat im Shop veröffentlicht.

## Wie es heute funktioniert

![Der neue Pfad: ein Name, ein Foto, ein Satz oder eine CSV-Zeile gehen an die KI-Extraktion (Qwen-Vision, Groq, Whisper), die strukturierte Felder mit Kategorie und Konfidenz liefert; eine einzige Funktion createErfassungProduct schreibt den Datensatz und verzweigt zu Lager, Prüfung oder Marktplatz, während parallel nach Kivvi synchronisiert wird.](/blog/geraete-eingang-neu.svg)

### Ein Eingang, vier Kanäle

Der `Geräte-Eingang` (im Code `erfassung`) hat eine bewusst schlichte Oberfläche mit vier Eingabekanälen: **Text**, **Foto**, **Datei** (CSV/Excel) und **Sprache**. Wichtig ist die Designentscheidung dahinter — es sind *Kanäle*, kein je eigener Ablauf. Egal, wie die Daten hereinkommen, sie münden in denselben Produktdatensatz.

Der Textkanal ist dabei clever: Er erkennt automatisch, ob eine Zeile ein einzelnes Gerät ist oder eine ganze Liste. Eine Zeile geht an `/api/admin/erfassung/text`, mehrere Zeilen an `/api/admin/erfassung/bulk-text` — man kann also eine ganze Palette Geräte auf einmal einfügen und bekommt eine Sammel-Prüftabelle zurück. CSV- und Excel-Dateien laufen über `bulk-upload`, Sprache über `voice`.

### Die KI-Kaskade

Das Herz sitzt in `src/lib/erfassung/ai-extraction.ts`. `extractProductFromText` schickt den Text an eine **Fallback-Kaskade** aus drei Anbietern (`callWithFallback`): **Groq** zuerst (`llama-3.3-70b-versatile`), dann **OpenRouter**, dann ein lokales **Ollama**. Fällt alles aus, greift ein Regex-Parser (`fastParseProductText`) als letztes Netz — die Erfassung schlägt nie hart fehl, sie wird nur ungenauer.

Für Fotos ist `extractProductFromImage` zuständig. Hier lohnt eine kleine Geschichte aus dem Maschinenraum: Groq hat sein bisheriges Vision-Modell (Llama 4 Scout) stillgelegt — die Anfragen kamen plötzlich als `404 model_not_found` zurück, und die Foto-Analyse war auf Produktion tot. Der Ersatz ist heute **`qwen/qwen3.6-27b`**, das einzige aktuell verfügbare bildfähige Groq-Modell. Qwen3 ist aber ein *Reasoning*-Modell: Es denkt in einem `<think>…</think>`-Block laut nach, bevor es antwortet. Ein naiver «nimm das erste `{…}`»-Parser fischte prompt Beispiel-JSON aus diesem Denk-Block heraus und scheiterte. Die Lösung ist eine kleine, unspektakuläre Funktion, `extractJsonObject`, die die Reasoning-Blöcke und die `json`-Codezäune entfernt, bevor das JSON gelesen wird. Sprache wiederum wird mit Groqs `whisper-large-v3-turbo` transkribiert und geht dann durch dieselbe Text-Extraktion.

Zwei Dinge machen das Ergebnis brauchbar statt nur beeindruckend. Erstens **Konfidenz pro Feld**: Jedes extrahierte Feld trägt eine Sicherheit; das Prüfformular hebt nur die Felder hervor, die wirklich einen zweiten Blick brauchen (etwa einen Zustand, den der Text nie genannt hat), statt jeden Wert mit einer Prozentzahl zuzupflastern. Zweitens die **Kategorisierung**: `detectCategory` ist eine geordnete Muster-Tabelle, die auf die bestehenden Kategorie-Codes abbildet. Die Reihenfolge ist Absicht — Zubehör-, Drucker-, Monitor- und Netzwerk-Muster greifen *vor* den Laptop-Marken, und interne Bauteile *zuletzt*, damit ein Gerätename immer gewinnt. So wird «Dockingstation Lenovo ThinkPad» korrekt als *Netzwerk* eingeordnet und nicht als Laptop.

### Eine einzige Schreib-Quelle

So unterschiedlich die Kanäle sind — geschrieben wird an genau einer Stelle: `createErfassungProduct()` in `src/lib/erfassung/create-product.ts`. Diese Funktion ist die *Single Source of Truth* für «ein Gerät entsteht». In einer Transaktion vergibt sie eine menschenlesbare Item-Nummer (`I-YYMMDD-NNNN`), schreibt den Extraktions-Datensatz (`ai_extracted_products`), legt den Inventar-Eintrag an (`inventory_items` mit Standort, Box und Menge), verknüpft Kundenprofile, lädt das Bild nach **R2** (Objektspeicher) hoch und verlinkt es — und veröffentlicht optional gleich ein Inserat.

Weil alles durch diese eine Funktion läuft, gelten überall dieselben Invarianten. Das ist auch der Grund, warum wir später **197 Produkte aus dem alten Shopware-Shop** in einem Rutsch migrieren konnten (dazu unten mehr): Der Import ruft genau `createErfassungProduct` auf, statt eine zweite, subtil andere Schreibvariante zu erfinden.

### Das Qualitätstor

Nach dem Prüfen kommt die einzige echte betriebliche Entscheidung: *wohin als Nächstes?* Die `CAPTURE_DESTINATIONS` — Qualität, Inventar, Teile, Recycling oder «Shop ungeprüft» — bilden auf Aufnahme-Stufen (Tiers) ab. Ein Gerät einer prüfpflichtigen Kategorie, das man direkt publizieren will, wird von einem Sicherheitstor abgefangen und landet stattdessen als Entwurf in der Aufbereitungs-Pipeline mit einer QC-Checkliste — es sei denn, jemand trifft eine ausdrücklich protokollierte «ohne Prüfung publizieren»-Entscheidung. Ob eine Kategorie prüfpflichtig ist, wird nicht separat gepflegt, sondern *aus der Checkliste selbst abgeleitet*: prüfpflichtig ist, was eine erforderliche Test- oder Sicherheitsposition für diese Geräteklasse hat.

### Auf den Marktplatz

Wird ein Gerät publiziert, macht `publishRevampitListing` daraus ein aktives Inserat (`is_revampit`-Flag), übernimmt das R2-Bild in die Inserats-Bilder und indexiert den Eintrag in **Meilisearch** für die Suche. Der Übergang von «erfasst» zu «im Shop sichtbar» ist damit ein API-Aufruf, kein zweiter Mensch mit einem zweiten Formular.

### Der Belastungstest: 197 Produkte aus dem alten Shop

Die beste Bestätigung, dass der Ablauf trägt, war die Katalog-Migration. Der alte Shopware-Shop hatte kein brauchbares API — aber saubere Open-Graph-Metadaten pro Produktseite. Ein kleiner Scraper lief die `/Alles/`-Liste ab, zog Name, Marke, Preis, Beschreibung und Bild-URL, und ein einmaliger Migrations-Endpunkt legte **jedes der 197 Produkte als Entwurf** an — über `createErfassungProduct`, mit serverseitig heruntergeladenem und nach R2 umgehängtem Bild. Kategorien wurden per `detectCategory` erschlossen, Dubletten über die gespeicherte Shopware-Nummer verhindert (idempotent, beliebig wiederholbar). Was per Hand Tage gedauert hätte, war so eine Sache von Minuten — genau der Punkt.

## Systeme, die miteinander reden

Erfassen ist nur die halbe Miete. Ein Gerät muss auch dort ankommen, wo Bestand und Buchhaltung leben. Und hier wird es architektonisch interessant, weil zwei sehr unterschiedliche Welten dranhängen.

![Integrations-Architektur: der Geräte-Eingang schreibt lokal inventory_items und synchronisiert nach oben zu Kivvi über dessen fertige REST-API mit Bearer-Token und Idempotency-Key und erhält Status-Webhooks zurück; zum Perl-Legacy Kivitendo führt der Weg über eine separate Node-Übersetzungsschicht, die einen Browser nachahmt.](/blog/geraete-eingang-integration.svg)

### Kivvi: eine saubere Membran

**Kivvi** ist das moderne, Schweizer Cloud-ERP (TypeScript, Drizzle/Postgres), an das wir Geräte synchronisieren. Es macht uns die Sache leicht, weil es genau das anbietet, was ein Integrationspartner braucht: ein versioniertes REST-API unter `/api/v1/`. Unser `syncToKivvi` (`src/lib/kivvi/client.ts`) macht ein `POST /api/v1/inventory-items` mit einem Bearer-Token (`kv_…`), das serverseitig als SHA-256-Hash liegt.

Drei Eigenschaften sind hier entscheidend und im Kivvi-Code sogar namentlich auf Revamp-IT gemünzt:

- **Idempotenz.** Der Aufruf trägt einen `Idempotency-Key`; ein doppelter Push erzeugt keine Dublette. Genau deshalb dürfen wir sorglos wiederholen.
- **Nicht-blockierend, nach dem Commit.** Der Sync ist «fire-and-forget»: Er läuft *nach* der Datenbank-Transaktion des Erfassens los und blockiert die Aufnahme nie. Danach schreiben wir `kivvi_inventory_item_id` und `kivvi_sync_status` auf den Inventar-Eintrag zurück. Ist Kivvi nicht konfiguriert (kein `KIVVI_API_URL`), gibt der Client sauber `{ success: false }` zurück, statt zu werfen — im Dev-Betrieb schlicht kein Sync.
- **Bidirektional.** Kivvi sendet signierte Webhooks zurück (`inventory_item.status_changed` etc.). Wird ein Gerät dort verkauft, erfahren wir es — ohne zu pollen.

Ein kleiner, aber wichtiger Übersetzungsschritt: RevampITs Zustands-Vokabular wird auf Kivvis Enum gemappt (`new → like_new`, `defect → parts_only`, Unbekanntes → `untested`). Ohne dieses Mapping weist Kivvis Validierung den Datensatz mit HTTP 400 ab. Kleine Verträge, klar eingehalten.

### Kivitendo: ein Übersetzer, kein zweites Gehirn

Der andere Nachbar ist **Kivitendo** — ein Perl-MVC-ERP, unser gesetzeskonformes Buch der Wahrheit, das wir bewusst *behalten*. Der Haken: Kivitendo hat **kein API**. Seine «Schnittstelle» ist die *View* — HTML-Formulare für Menschen —, und der Controller ist an diese Formulare gekoppelt. Jede Anfrage ist ein POST flacher Formularfelder an `controller.pl?action=Part/save`, die Kivitendo zu einer globalen Struktur `$::form` zusammensetzt.

Ein Schreibvorgang funktioniert dort nach dem Muster **laden → überlagern → speichern**, immer am *ganzen* Objekt. Das hat eine tückische Konsequenz: Skalare bleiben erhalten, wenn man sie weglässt — aber **Sammlungen (Preise, Lieferanten) werden gelöscht-und-neu-geschrieben**. Wer eine Teilmenge schickt, verliert den Rest. Man kann also gar nicht «nur ein Feld ändern», ohne zuvor den vollständigen Zustand geladen zu haben.

Wie schliesst man ein modernes System daran an? Nicht, indem man Kivitendos Logik nachbaut, sondern mit einer schmalen **Übersetzungsschicht** — einem Node-Dienst, der einen Browser nachahmt. Sein einziger Ablauf: `empfangen → laden (SELECT) → nach innen mappen → mergen → als $::form-POST absenden → nach aussen mappen → zurückgeben`. Die Schicht schreibt **nie selbst SQL**; geschrieben wird ausschliesslich durch Kivitendos eigenen Controller, damit dessen Validierung, Historie und Transaktion an genau *einer* Stelle bleiben. Das Leitprinzip: **die Geschäftslogik lebt in Kivitendo — wir sind ein Übersetzer, kein zweites Gehirn.**

Das Bestechende daran: Die pro-Entität nötigen Mappings (welches externe Feld heisst intern wie, welche Formularschlüssel, welche Custom-Variables) werden **von kleinen, lokalen LLMs generiert** — extrahiert aus Kivitendos Perl-ORM und -Controllern, gegen einen *echten, mitgeschnittenen* Formular-POST rundgeprüft. Ein Mapping gilt genau dann als korrekt, wenn es einen von Kivitendo akzeptierten POST parametergenau reproduziert. Nichts wird geraten. Dieses Teil ist noch experimentell (die Entität `Part` steht, gegen eine Live-Instanz ist es noch nicht gehärtet), aber der Weg ist klar: ein sauberer, versionierter Vertrag aussen, Kivitendos unveränderte Wahrheit innen.

Der ehrliche Zusatz: Vieles daran ist aus wenigen Mitschnitten und dem Lesen der Quelle *abgeleitet*, nicht unter kontrollierten Bedingungen *beobachtet*. Das am wenigsten Bestätigte ist ausgerechnet das Wichtigste — wie Kivitendo Erfolg von Fehlschlag signalisiert (eine Weiterleitung mit `&id=…` gegen eine 200-Antwort mit Fehler-Body). Das gehört als Erstes gegen eine laufende Instanz verifiziert. Ehrliche Architektur nennt ihre offenen Annahmen.

## Der fehlende Baustein: Lager und Logistik

Und hier kommt der Teil, der noch nicht fertig ist — bewusst so benannt, weil es die geplante Arbeit ist, das Produkt rundzumachen.

![Die fehlende Mitte: die Erfassung registriert heute ein einzelnes Gerät mit Item-Nummer und einem Zeiger auf Standort und Box; dazwischen fehlt die Lager- und Logistikverwaltung mit Bestandsbewegungen, Kommissionierung und Mehrlager; rechts steht Kivvi bereit mit Lagern, Beständen und einem Bewegungs-Ledger.](/blog/geraete-eingang-lager.svg)

Heute ist der Geräte-Eingang im Kern ein **Einzelstück-Register mit QC-Checkliste und einem Zeiger «wo liegt es»**. Es gibt eine schlanke Tabelle `storage_locations` (Name, Art: Hauptlager/Shop/Zweitlager/Mitglieds-Besitz/…), und der Inventar-Eintrag trägt einen `storage_location_id`, ein freies `box_id` und ein Alt-Feld `location`. Damit lässt sich beantworten: *«Welches Regal hält dieses eine Gerät?»*

Was **fehlt**, ist alles darüber hinaus — und das ist ehrlicherweise die eigentliche Lager*verwaltung*:

- **Kein Bestandsbewegungs-Ledger.** Die Zähler `quantity_reserved`/`quantity_sold` existieren als Spalten, werden aber nirgends geschrieben. Es gibt keine Ein-/Aus-Buchungen, keine Bewegungshistorie.
- **Kein Mehrlager, keine Umlagerungen.** Eine flache Standort-Liste, keine Hierarchie, kein Bestand pro Lager.
- **Keine Kommissionierung, kein Wareneingang, kein Nachschub.** Kurz: kein Warehouse-Management, nur ein «wo liegt was».

Die gute Nachricht: Der Andockpunkt existiert bereits. **Kivvi bringt genau die Bestands-Primitive mit, die uns fehlen** — `warehouses`, `stockLevels` (Bestand je Produkt und Lager) und ein append-only `stockMovements`-Ledger mit vorzeichenbehafteter Menge. Allerdings auf **buchhalterischer**, nicht auf **operativer** Granularität: Kivvi kennt Lager als Name und Adresse, aber keine Fächer, keine Pick-Routen, keinen Versanddienstleister. Ein zukünftiges RevampIT-Lagermodul hat damit zwei saubere Optionen — entweder Kivvis `warehouseId` + `location` direkt bespielen, oder die operative Ebene (Fächer, Bewegungen, Kommissionierung) selbst modellieren und Kivvi als *Bestands-Buch der Wahrheit* dahinter führen. Dank der bidirektionalen Webhooks bleiben beide Seiten synchron.

Und Kivitendo? Auch das Lager liesse sich prinzipiell dorthin spiegeln — über dieselbe Übersetzungsschicht, die wir oben skizziert haben. Kivitendo hat einen Lager-/Bestands-Begriff in seinem Model; eine Bestandsbewegung wäre dann eine weitere Entität, die den gleichen Pfad nimmt: laden, mergen, als `$::form`-POST an den passenden Controller. Der grössere Aufwand liegt nicht im Konzept, sondern in der Sorgfalt — Bestand ist buchungsrelevant, und Kivitendos «Sammlungen werden ersetzt»-Semantik verlangt, dass man immer den vollständigen Zustand mitschickt. Für ein Buch der Wahrheit ist genau diese Vorsicht angebracht.

## Ausblick

Die Erfassung ist gelöst: Aus einem Foto oder einem hingeschriebenen Namen wird in Sekunden ein sauberer, kategorisierter, bebildeter Datensatz — im Lager verortet oder im Shop veröffentlicht, und nach Kivvi synchronisiert. Die Hürde, die dafür sorgte, dass kaum jemand erfasste, ist weg.

Was bleibt, ist das physische Gegenstück: **zu wissen, wo jedes Gerät liegt, und jede Bewegung sauber zu verbuchen.** Das ist der nächste Baustein — die Brücke zwischen unserem Einzelstück-Register und Kivvis Bestands-Ledger, und, wo nötig, bis in Kivitendo hinein. Wenn er steht, schliesst sich der Kreis: von der Geste, die ein Gerät aufnimmt, bis zu dem Regal, aus dem es verkauft wird — ohne dass dazwischen jemand eine Tabelle pflegen muss.
