# Kivitendo Auftragserfassung — schöneres UI (tablet-tauglich, gut leserlich)

Hoi, hier das Mockup + CSS.

> **Alles in einem Link (zum Teilen):** über die RevampIT-Seite unter `/d/<link>`.
> Dort siehst du die Live-Vorschau, kannst die Dateien herunterladen, den Code
> ansehen, Fragen zum Code stellen und direkt Feedback geben. Nichts installieren
> — einfach öffnen. Die Dateien unten sind dieselben zum lokalen Bearbeiten.

## Was drin ist
- **`mockup.html`** — einfach im Browser öffnen. Zeigt das Ziel-Aussehen
  (grosse Schrift, ruhige Kontraste, Touch-Ziele ≥ 44px, Positions-Tabelle mit
  fixiertem Kopf und Zeilenstreifen). Läuft eigenständig, nichts installieren.
- **`kivitendo-intake.css`** — die produktive Datei, die du in Kivi einbindest.
  Sie fügt **nur Aussehen** hinzu und lässt die Kivitendo-Struktur unangetastet.

## Einbinden (Update-sicher)
Nicht in `main.css` reinschreiben (wird bei Updates überschrieben). Stattdessen
eine eigene Datei laden, **nach** der main.css — z.B. eine
`css/kivitendo/revamp-intake.css` und im Layout-Template referenzieren. So
überlebt es Kivitendo-Updates.

## Die Positions-Tabelle (`#row_table_id`)
Wie du sagst: die füllt Kivi, an der Struktur können wir nichts ändern. Das CSS
stylt sie darum nur um — grössere Zellen, fixierte Kopfzeile beim Scrollen,
Zeilenstreifen, rechtsbündige Zahlen, waagrechtes Scrollen auf dem Tablet statt
Abschneiden. Kein Eingriff in die von Kivi generierten Felder.

## Zeilen: hinzufügen, löschen, umsortieren (aktualisiert)
Wichtig: alle diese Steuerelemente liefert **Kivitendo selbst** — das CSS
entfernt nichts, es macht sie nur gross genug fürs Tablet:
- **Hinzufügen:** über die zentrale Eingabezeile *über* der Liste
  (`#input_row_table_id`) — Artikel erfassen, die neue Zeile wird unten angehängt.
- **Löschen:** der «X»-Knopf pro Zeile (ein `<button>`, den Kivi rendert). Er war
  im ersten Mockup nicht eingezeichnet — deshalb sah es aus, als fehle er. Er ist da.
- **Umsortieren:** das Zieh-Symbol `img.dragdrop` (updown.png) links in der Zeile.
- **Details auf-/zuklappen:** die `expand` / `row-icon`-Symbole.

Im Mockup sind diese Elemente jetzt eingezeichnet (Eingabezeile oben, **↕** zum
Ziehen, **✕** zum Löschen), damit du siehst, wie sie nach dem Restyling aussehen.
Im CSS gibt es dafür neu **Abschnitt 8 «Zeilen-Steuerelemente»**.

## Bitte kurz prüfen (2 Min mit F12)
Ich sehe eure Live-DOM nicht. Alle unsicheren Stellen sind im CSS mit
`⚠ PRÜFEN` markiert (Kopf-Wrapper, Summen-Container, die Zahlen-Klasse, sowie die
neuen Zeilen-Steuerelemente: `img.dragdrop`, `img.row-icon`/`.expand`, der
«X»-Löschknopf und `#input_row_table_id`). Wenn ein Block nicht greift: mit den
Entwicklertools (F12) den echten Klassen- oder ID-Namen ablesen und im CSS
ersetzen. `#row_table_id` ist ja bestätigt.

## Feintuning
Ganz oben im CSS gibt es einen `:root`-Block mit Stellschrauben
(Schriftgrösse, Farben, Abstände). Wenn's noch grösser sein soll: `--ri-text`
hochsetzen — oder testweise `class="ri-xl"` an den `<body>` hängen (+2px überall).

Gruss George
