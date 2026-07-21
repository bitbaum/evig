---
title: "Alte Tablets als Arbeitsgeräte: Wie wir sie bei RevampIT selbst einsetzen"
excerpt: "Ein Tablet muss nicht zurück in den Alltag, um nützlich zu sein — es muss nur eine Aufgabe bekommen. Wir zeigen die konkreten Aufgaben aus unserem eigenen Betrieb: Erfassung am Geräte-Eingang, Stempeluhr für die Zeiterfassung, Prüf-Terminal im Lager, Info-Punkt im Laden. Und warum daraus ein Knowhow wird, das jeder Betrieb übernehmen kann."
category: "Nachhaltigkeit"
tags:
  - nachhaltigkeit
  - reparatur
  - open-source
  - tablets
  - kreislaufwirtschaft
featuredImage: "/blog/tablets-hero.svg"
publishedAt: "2026-07-20"
published: true
---

Im ersten Teil, [«Das zweite Leben eines Tablets»](/blog/tablets-second-life), haben wir das Grundsätzliche geklärt: Fast kein Tablet in der Schublade ist defekt. Es wurde von seiner Software im Stich gelassen — und lässt sich mit einem freien Betriebssystem und einer einzigen, fest zugewiesenen Aufgabe jahrelang weiter nutzen. «Gib dem alten Gerät eine neue Aufgabe», hiess es dort. Das war die Theorie.

Dieser Beitrag ist die Praxis. Denn bei RevampIT treffen zwei Dinge aufeinander, die zusammen selten sind: Wir **reparieren Tablets** — und wir **bauen die Software**, mit der ein Betrieb läuft. Geräte-Eingang, Zeiterfassung, Marktplatz, alles selbst entwickelt und quelloffen. Legt man beides übereinander, entsteht etwas Naheliegendes und trotzdem oft Übersehenes: Unsere eigenen aufbereiteten Tablets werden zu Arbeitsgeräten für unsere eigene Software. Zwei Ressourcen, die wir ohnehin im Haus haben, ergeben zusammen ein drittes — zu Kosten nahe null.

Hier sind die konkreten Aufgaben.

## Vier Terminals aus dem eigenen Betrieb

### 1. Das Erfassungs-Terminal am Geräte-Eingang

Jedes gespendete Gerät muss erfasst werden: Hersteller, Modell, Zustand, Fotos. Am Laptop ist das Tipparbeit. An einem an die Werkbank geschraubten Tablet ist es ein Handgriff.

Unser Geräte-Eingang kennt vier Eingabewege — **Text, Bild, Datei und Sprache** — und in allen füllt eine KI denselben Produktdatensatz aus. Auf dem Tablet heisst das: Die eingebaute Kamera fotografiert das eintreffende Gerät, oder man **spricht die Eckdaten einfach ein** («Lenovo ThinkPad, guter Zustand, 16 Gigabyte, kleine Kratzer am Deckel»), und der Datensatz steht. Danach druckt oder zeigt das System ein **QR-Geräteetikett**. Kein Wechsel zwischen Maus, Tastatur und Kamera — das Tablet *ist* die Kamera, das Mikrofon und der Bildschirm in einem, genau dort, wo das Gerät auf den Tisch kommt.

Ein aufbereitetes Tablet am Eingang ersetzt hier eine ganze Station aus Laptop, Webcam und Barcode-Drucker — und tut es mobiler und schneller.

### 2. Die Stempeluhr an der Wand

Das ist die Aufgabe mit der grössten Reichweite über uns hinaus. Unsere Zeiterfassung hat ein simples Herzstück: **«Schicht starten»** beim Kommen, **«Schicht beenden»** beim Gehen. Ein Klick, fertig. Genau dafür ist ein wandmontiertes Tablet am Eingang das ideale Gerät — eine **Stempeluhr**, die nichts anderes kann und nichts anderes können muss.

Man tippt beim Reinkommen, man tippt beim Rausgehen. Die Zeitkarte füllt sich von selbst, der Monatsrapport ebenso. Eine handelsübliche Stempeluhr kostet mehrere hundert Franken und kann genau das — ein altes Tablet im Kiosk-Modus kostet die Aufbereitung und leistet dasselbe, plus Notizen, Kategorien und einen Rapport, den niemand von Hand abtippen muss.

Und hier wird es interessant für andere: **Überall, wo Menschen häufig kommen und gehen, ist das dasselbe Gerät.** Das Restaurant, wo das Küchen- und Serviceteam pro Schicht ein- und ausstempelt. Die Werkstatt mit Stundenlohn. Der Laden mit Teilzeitschichten. Das Pflegeheim mit Wechseldiensten. Ein Tablet an der Wand, eine App, ein Fingertipp — die teure, proprietäre Stempeluhr wird überflüssig.

### 3. Das Prüf- und Lager-Terminal

Das QR-Etikett von Schritt 1 ist mehr als ein Aufkleber. Scannt man es mit der Tablet-Kamera, öffnet sich direkt die Pipeline-Ansicht des Geräts — Prüf-Checkliste, Status, Preis. Damit wird ein zweites, leichtes Tablet zur **mobilen Prüfstation**: Man geht mit ihm durchs Lager, scannt ein Gerät, hakt die bestandenen Tests ab, und die Änderung ist sofort im System. Kein Zettel, kein späteres Nacherfassen. Das Gerät und sein digitaler Zwilling bleiben im Gleichschritt.

### 4. Der Info- und Feedback-Punkt im Laden

Im Ladenlokal kann ein Tablet als **Info- und Feedback-Terminal** stehen: Es zeigt den aktuellen Marktplatz-Bestand als Selbstbedienungskatalog, nimmt Rückmeldungen der Kundschaft entgegen oder beantwortet über unseren KI-Assistenten «Hirn» häufige Fragen zu Reparatur, Öffnungszeiten und Angebot. Kundschaft, die auf ein Beratungsgespräch wartet, stöbert am Terminal — und sieht dabei genau die Geräte, die zwei Räume weiter aufbereitet wurden.

## Warum das alte Tablet dafür das richtige Gerät ist

Alle vier Rollen haben dasselbe Profil: eine einzige Aufgabe, fest an einem Ort, meist am Strom. Das ist exakt das Einsatzmuster, für das ein «zu langsames» Tablet perfekt ist — der müde Akku spielt keine Rolle, wenn das Gerät eingesteckt an der Wand hängt, und die Rechenleistung eines Fünfjährigen reicht für eine Web-Oberfläche mühelos.

Der technische Weg dorthin ist der aus dem ersten Teil: bei Bedarf ein schlankes, freies Betriebssystem wie **LineageOS** oder **/e/OS** aufspielen (vor allem, wenn das Gerät ins Netz soll), das Tablet dann per **Kiosk-Modus** auf genau die eine Anwendung sperren — auf Android die *Bildschirm-Fixierung* oder eine quelloffene Kiosk-App, auf dem iPad der *Geführte Zugriff*. Übrig bleibt ein Terminal, das jahrelang genau eine Sache tut und sich nicht zweckentfremden lässt.

Und die Ökobilanz ist eindeutig. Der grösste Teil des CO₂-Fussabdrucks eines Geräts entsteht in der Herstellung, bevor es überhaupt eingeschaltet wird — beim Tablet [je nach Modell und Methodik rund zwei Drittel bis über neun Zehntel](/transparenz/co2). Ein aufbereitetes Tablet als Terminal ersetzt eine eigens gekaufte Kiosk-Hardware und spart deren komplette Herstellungsemissionen ein. Gleichzeitig bleibt ein Gerät in Betrieb, das sonst in der 77,7-Prozent-Abfallmenge gelandet wäre. Kein Neukauf, kein Elektroschrott — der doppelte Gewinn aus dem ersten Teil, hier im Betrieb.

## Für deinen Betrieb: dieselbe Idee, dein Anwendungsfall

Man muss keine IT-Firma sein, um das zu nutzen. Die Faustregel ist einfach: **Überall, wo ein wiederkehrender Handgriff an einem festen Punkt passiert, kann ein altes Tablet ihn übernehmen.**

- **Restaurant und Gastro:** Stempeluhr fürs Team, Reservationsanzeige am Eingang, Bestell- oder Feedback-Tablet am Tisch.
- **Laden und Detailhandel:** Preisauskunft, Selbstbedienungskatalog, Kundenfeedback, eine einfache Kasse.
- **Werkstatt und Handwerk:** Zeit- und Auftragserfassung, Checklisten, Materialscanner.
- **Praxis und Pflege:** Selbst-Anmeldung am Empfang, Schichterfassung, Info-Tafel.
- **Schule, Bibliothek, Makerspace:** Katalog- und Ausleihstation, Anmeldeterminal, Lernstation.

Jede dieser Aufgaben läuft heute oft auf teurer Spezial-Hardware — oder gar nicht, weil sie sich «nicht lohnt». Ein aufbereitetes Tablet im Kiosk-Modus verschiebt diese Rechnung: Die Hardware ist fast geschenkt, die Software ist quelloffen und ohne Lizenzkosten, und das Ergebnis ist robuster als ein weiteres offenes Gerät, das jeder umkonfigurieren kann.

## Können wir daraus ein Knowhow machen?

Ja — und genau das ist der strategisch spannende Teil. Wir haben alle vier Zutaten bereits im Haus:

1. **Die Geräte.** Gespendete Tablets, die ohnehin bei uns landen.
2. **Die Aufbereitung.** Reparatur, Akkutausch und Reflash sind unser Kerngeschäft und unser Repair-Café.
3. **Das Kiosk-Knowhow.** Der Weg vom Altgerät zum gesperrten Einzweck-Terminal — dokumentiert im ersten Teil.
4. **Die Software.** Zunehmend unsere eigene Plattform, die die Aufgabe liefert.

Zusammengelegt ergibt das ein Angebot, das kaum ein anderer so bündeln kann: **ein schlüsselfertiges Terminal — aufbereitetes Tablet, Kiosk-Einrichtung und passende Anwendung — zu einem Bruchteil dessen, was kommerzielle Kiosk-Hardware kostet.** Ob als Gerät zum Mitnehmen, als Miete oder als Einrichtungs-Workshop, in dem ein Betrieb lernt, seine eigenen Spende-Tablets zu Terminals zu machen: Es ist eine Dienstleistung, die zu hundert Prozent auf unserer Mission liegt. Jedes Terminal ist ein Tablet weniger im Abfall und ein Kunde mehr, der auf offener, lokaler, tracker-freier Hardware arbeitet.

## Warum das für uns wichtig ist

**Es ist gelebte Mission, nicht nur verkaufte.** Jedes Terminal rettet ein konkretes Gerät aus dem Elektroschrott und vermeidet die Herstellung eines neuen. Das ist die Kreislaufwirtschaft, für die es uns gibt — nicht als Slogan, sondern als Werkbank.

**Es ist der glaubwürdigste Beweis, den wir führen können.** Ein Betrieb, der seinen eigenen Wareneingang, seine eigene Stempeluhr und sein eigenes Lager auf aufbereiteten Tablets und selbstgebauter, quelloffener Software betreibt, muss niemandem erklären, dass Weiternutzung funktioniert. Er zeigt es. «Wir verkaufen euch nicht die Idee — wir führen unseren eigenen Laden damit.»

**Es kostet uns fast nichts und öffnet eine neue Linie.** Hardware aus Spenden, Software aus dem eigenen Haus, Aufbereitung als bestehendes Handwerk: Der Grenzaufwand für ein weiteres Terminal ist gering, der Nutzen — Einnahmen, Kundennähe, Sichtbarkeit — ist es nicht.

**Und es ist teilbares Wissen.** Ein dokumentierter, lehrbarer Ablauf vom Altgerät zum Arbeitsgerät passt genau zu unserem offenen Selbstverständnis. Andere Vereine, Läden und Werkstätten sollen das nachbauen können — das ist kein Geschäftsgeheimnis, das ist der Punkt.

## So baust du eins

Der Ablauf ist kurz und folgt dem ersten Teil:

1. **Aufgabe wählen.** Eine, und nur eine — Stempeluhr, Erfassung, Katalog, Anmeldung.
2. **Gerät platzieren.** Dorthin, wo Strom ist. Fest verbaute Terminals bleiben eingesteckt, ein schwacher Akku ist dann kein Thema.
3. **Bei Netzbetrieb ein freies OS aufspielen.** LineageOS oder /e/OS, damit das Gerät ohne Herstellerbindung sicher aktuell bleibt.
4. **Auf die eine Anwendung sperren.** Kiosk-Modus einrichten — Bildschirm-Fixierung, Kiosk-App oder Geführter Zugriff. Danach zeigt das Tablet nur noch diese eine Oberfläche.
5. **Ins Gäste- oder IoT-WLAN hängen** und nicht gebrauchte Konten und Sensoren abschalten.

Bist du unsicher beim Reflash oder beim Akku: Bring das Gerät ins Repair-Café. Genau dafür sind wir da — und wenn du willst, richten wir das Terminal gleich mit ein.

## Wenn du mitmachen willst

Hast du alte Tablets, die ungenutzt herumliegen? [Spende sie](/get-involved/donate) — wir machen daraus Arbeitsgeräte für jemanden, der sie braucht. Betreibst du einen Laden, ein Restaurant oder eine Werkstatt und willst ein Terminal, das nicht die Welt kostet und nicht die Umwelt belastet? Melde dich. Und willst du es selbst bauen, folg dem Ablauf oben und dem [ersten Teil](/blog/tablets-second-life) — der ganze Weg ist offen dokumentiert.

**Gebrauchte Computer werden repariert und weitergegeben — nicht entsorgt. Manchmal ist das Beste, was ein altes Tablet tun kann, einfach *arbeiten*.**

## Quellen und weiterführend

- RevampIT — [«Das zweite Leben eines Tablets»](/blog/tablets-second-life): warum Tablets «sterben», freie Betriebssysteme und der Kiosk-Modus im Detail.
- RevampIT — [CO₂-Berechnung & Quellen](/transparenz/co2): unser offenes, quellenbasiertes Modell für den Herstellungs-Fussabdruck pro Gerätekategorie (Basis: offene Daten der ADEME).
- UNITAR & ITU — [Global E-waste Monitor 2024](https://ewastemonitor.info/the-global-e-waste-monitor-2024/): 62 Mt Elektroschrott, 22,3 % dokumentiert recycelt.
