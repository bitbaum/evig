---
title: "Kivvi: das ERP der Kreislaufwirtschaft"
excerpt: "Standard-ERPs kennen Einkauf und Mengen — nicht Spenden und Einzelstücke mit Zustand und Geschichte. Kivvi ist das offene ERP, das genau dafür gebaut ist."
featuredImage: "/blog/showcase-kivvi-home.png"
category: "Produkt"
tags:
  - kivvi
  - erp
  - kreislaufwirtschaft
  - open-source
  - kivitendo
publishedAt: "2026-07-21"
published: true
---

Ein Lieferwagen hält vor dem Lager. Hinten drin: 50 gespendete Laptops von einer Firma, die ihre Flotte erneuert hat. Jedes Gerät ist ein Einzelstück — mit eigenem Zustand, eigener Vorgeschichte, eigenem Weg durch Reparatur und Verkauf. Für einen Kreislaufbetrieb ist das der ganz normale Dienstagmorgen. Für ein handelsübliches ERP ist es ein Problem, das es gar nicht erst zu lösen versucht.

![Kivvi Startseite mit dem Claim «Das Betriebssystem der Kreislaufwirtschaft»](/blog/showcase-kivvi-home.png)

*«50 gespendete Laptops? In 30 Sekunden erfasst.» — Kivvi ist von Grund auf für den Alltag von Refurbishern und Brockenhäusern gebaut.*

## Das Problem: Standard-ERPs denken in Einkauf und Mengen

Jedes gängige Warenwirtschaftssystem der Welt geht von derselben Grundannahme aus: Du kaufst eine bestimmte Menge identischer Artikel ein, lagerst sie, und verkaufst sie wieder. 200 Stück Artikel-Nr. 4711, alle gleich, alle neu. Der Einkaufspreis ist bekannt, die Marge ist kalkuliert, die Menge ist die entscheidende Grösse.

Ein Kreislaufbetrieb funktioniert genau umgekehrt. Die Ware kommt nicht als Bestellung herein, sondern als **Spende** oder als **Trade-in**. Sie ist keine Menge, sondern eine Sammlung von **Einzelstücken** — jedes mit einem eigenen Zustandsgrad, von «wie neu» bis «für Ersatzteile». Jedes Gerät hat eine **Reparatur-Geschichte**: Was wurde getestet, was ausgetauscht, wer hat die Daten gelöscht. Und am Ende zählt nicht nur der Verkaufserlös, sondern auch die **Wirkung** — wie viele Geräte vor der Deponie bewahrt wurden.

Diese Unterschiede sind nicht kosmetisch. Sie betreffen den Kern des Datenmodells. Ein System, das «Menge» als zentrale Grösse behandelt, kann einen Zustandsgrad höchstens als Textnotiz irgendwo anhängen — aber nicht danach filtern, kalkulieren oder auswerten. Ein System, das den Wareneingang als Einkauf mit Rechnung versteht, hat schlicht kein Feld für eine Spende ohne Gegenwert und keine Vorlage für die Quittung, die der Spender braucht. Die Lücke lässt sich nicht durch Konfiguration schliessen; sie sitzt in den Grundannahmen.

Nichts davon passt in die Datenmodelle von SAP, Odoo oder einer der vielen KMU-Lösungen. Sie kennen keinen Zustandsgrad, keine Spendenquittung, keinen Lebenszyklus eines einzelnen Geräts. Wer einen Refurbishing-Betrieb, ein Brockenhaus oder ein Repair Café führt, hatte deshalb bisher nur zwei Optionen: das betagte **Kivitendo** auf Perl-Basis mit seinem Legacy-Ballast — oder die ewige Flucht in **Tabellenkalkulationen**, wo jeder Prozess neu von Hand gebaut wird und die Daten in Dutzenden nicht verbundenen Dateien verrotten.

## Was Kivvi anders macht

Kivvi kehrt die Grundannahme um. Nicht der Einkauf steht im Zentrum, sondern die **Herkunft der Ware und das einzelne Objekt**. Spende, Zustand, Reparaturweg und Wirkung sind keine nachträglich angeflanschten Felder — sie sind das Fundament des Datenmodells.

![Split-Screen-Login mit Feature-Checkliste: KI-Schnelleingabe, Einzelartikel, Spendenquittungen, QR-Rechnungen, Open Source MIT](/blog/showcase-kivvi-login.png)

*Schon beim Login zeigt Kivvi, worauf es ankommt: KI-Schnelleingabe, Einzelartikel-Verwaltung, Spendenquittungen, Schweizer QR-Rechnungen — und Open Source unter MIT-Lizenz.*

Das Ergebnis ist ein System, das die Sprache der Kreislaufwirtschaft spricht, statt sie in ein fremdes Schema zu pressen. Wo ein klassisches ERP erst mühsam umgebogen werden müsste — mit Zusatzfeldern, Workarounds und externen Tabellen daneben —, ist bei Kivvi der gebrauchte, einzigartige Gegenstand der Normalfall. Und es ist für konkrete Betriebe gebaut, nicht für den generischen Handel.

![«Für wen ist Kivvi?» mit den Zielgruppen IT-Refurbisher, Brockenhäuser, Repair Cafés und Vintage-Shops](/blog/showcase-kivvi-fuer-wen.png)

*Kivvi richtet sich an IT-Refurbisher, Brockenhäuser, Repair Cafés und Vintage-Shops — Betriebe, die mit gebrauchter, einzigartiger Ware arbeiten.*

## Was Standard-ERPs nicht können — und Kivvi schon

![Übersicht «Was Standard-ERPs nicht können»](/blog/showcase-kivvi-sec1.png)

*Die Lücke, die Kivvi schliesst: alles, was mit gespendeter, einzelner, reparierter Ware zu tun hat.*

Der beste Weg, Kivvi zu verstehen, ist ein Rundgang durch seine Kernbereiche — jeweils mit der Frage: Was tut es, und welches Problem löst es?

### Warenannahme und Spenden

**Was es tut:** Bei der Annahme wird jede Ware mit ihrer Herkunft (Spende oder Trade-in) und einem **Zustandsgrad** erfasst. Für Spenden lässt sich direkt eine **Spendenquittung** ausstellen.

**Welches Problem es löst:** Der Zustandsgrad ist die Grundinformation, an der später alles hängt — Preis, Reparaturbedarf, Verkaufsfähigkeit. Und die Spendenquittung, in Standard-ERPs schlicht nicht vorgesehen, ist für gemeinnützige Betriebe ein täglich benötigtes Dokument.

### Einzelartikel-Lebenszyklus

**Was es tut:** Jedes Gerät ist ein eigener Datensatz, der einen definierten Lebenszyklus durchläuft: **intake → testing → repair → ready → listed → sold**. Der Status jedes Stücks ist jederzeit sichtbar.

**Welches Problem es löst:** Statt einer Mengenangabe «200 Stück» weiss der Betrieb für jedes einzelne Objekt, wo es steht. Kein Gerät geht im Prozess verloren, keine Ware bleibt unbemerkt im Testlimbo hängen.

### Reparaturen

**Was es tut:** Reparaturaufträge werden pro Gerät geführt — inklusive **Reparaturbonus** und der Ausstellung von **Löschzertifikaten** für die datenschutzkonforme Datenvernichtung.

**Welches Problem es löst:** Die Reparatur-Geschichte bleibt am Gerät haften und ist nachvollziehbar. Das Löschzertifikat ist beim Verkauf gebrauchter IT-Hardware kein Nice-to-have, sondern eine Vertrauens- und Compliance-Frage.

### Verkauf

**Was es tut:** Der komplette Verkaufsprozess ist abgebildet: **Offerte → Auftrag → Lieferschein → Rechnung → Mahnwesen**.

**Welches Problem es löst:** Vom ersten Angebot bis zur letzten Zahlungserinnerung läuft alles in einem System, ohne Medienbruch. Kein paralleles Fakturierungstool, keine von Hand nachgeführten Mahnungen.

![Übersicht «Was Kivvi kann»](/blog/showcase-kivvi-sec3.png)

*Vom Wareneingang bis zur Buchhaltung: Kivvi deckt die gesamte Kette in einem System ab.*

### Schweizer Buchhaltung

**Was es tut:** Kivvi bringt einen vollständigen **KMU-Kontenrahmen mit 227 Konten** mit, ein **unveränderliches Journal** und die **MWST**-Behandlung.

**Welches Problem es löst:** Die Buchhaltung ist nicht ein separates Programm, an das Daten exportiert werden müssen, sondern integraler Teil des ERP. Das unveränderliche Journal sorgt für Revisionssicherheit — einmal gebucht, bleibt gebucht.

### Banking

**Was es tut:** Kivvi liest **CAMT.053/054**-Bankdateien ein und gleicht Zahlungseingänge automatisch mit den **QR-Rechnungen** ab.

**Welches Problem es löst:** Der Zahlungsabgleich, sonst stundenlange Handarbeit, geschieht automatisch. Bezahlte Rechnungen werden erkannt, offene Posten bleiben offen — ohne dass jemand Kontoauszüge Zeile für Zeile mit Rechnungen vergleicht.

### KI-Befehlsleiste

**Was es tut:** Eine KI-gestützte Befehlsleiste versteht natürliche Sprache und führt sie über **47 auditierte Werkzeuge** aus — von der Schnellerfassung bis zur Auswertung.

**Welches Problem es löst:** «50 gespendete Laptops? In 30 Sekunden erfasst.» — statt jedes Feld einzeln zu klicken, beschreibt man die Aufgabe, und Kivvi erledigt sie. Weil jedes der 47 Werkzeuge auditiert ist, bleibt jede Aktion nachvollziehbar und kontrolliert.

## Offen und verbunden

Ein ERP, das seine Daten einsperrt, ist eine Falle. Kivvi geht den entgegengesetzten Weg und ist von Grund auf offen gebaut.

Es bietet eine **offene REST-API (v1)** und **signierte Webhooks**, über die andere Systeme sauber und sicher angebunden werden. Für den Umstieg vom Legacy-System gibt es einen **Kivitendo-CSV-Import** — genau die Schnittstelle, die man sich wünscht, an genau der richtigen Stelle: beim Übergang von der alten Perl-Welt in die neue.

Genauso wichtig ist die Lizenz. Kivvi ist **Open Source unter MIT-Lizenz**. Das bedeutet: **kein Vendor Lock-in**, **Self-Hosting** auf eigener Infrastruktur, und die Gewissheit, dass die **Daten in der Schweiz** bleiben. Wer Kivvi einsetzt, besitzt sein System — nicht umgekehrt. Gerade für gemeinnützige Betriebe, die mit knappen Mitteln arbeiten und langfristig planen, ist das entscheidend: Es gibt keine Lizenzkosten, die mit dem Wachstum explodieren, und kein Risiko, dass ein Anbieter das Produkt einstellt und die Daten in Geiselhaft nimmt. Der Quellcode liegt offen, die Schnittstellen sind dokumentiert, der Betrieb bleibt handlungsfähig.

## Die Grössenordnung

Kivvi ist kein Prototyp, sondern ein ausgewachsenes System. Ein paar Zahlen zur Einordnung:

| Kennzahl | Wert |
|---|---|
| Dokumentation | 133 Seiten |
| Datenbank-Tabellen | 50 |
| Domain-Module | 63 |
| KI-Werkzeuge | 47 |
| Commits | 616 |
| Lizenz | MIT |

## Unter der Haube

Technisch steht Kivvi auf einem modernen, wartbaren Fundament. Es ist als **Next.js-14-Monorepo** in **TypeScript** gebaut, mit **PostgreSQL** als Datenbank und **Drizzle** als ORM. Für alle Geldbeträge kommt **decimal.js** zum Einsatz — Rundungsfehler bei Franken und Rappen sind damit ausgeschlossen. Die Schweizer QR-Rechnungen erzeugt Kivvi mit **SwissQRBill**, sauber standardkonform. Diese Wahl ist kein Selbstzweck: Sie sorgt dafür, dass das System korrekt rechnet, wartbar bleibt und mit dem Betrieb mitwachsen kann.

## Fazit

Standard-ERPs sind für eine Welt gebaut, in der Ware in Mengen eingekauft und identisch verkauft wird. Die Kreislaufwirtschaft lebt in einer anderen Welt — der Welt der Spende, des Einzelstücks mit Zustand und Geschichte, der Reparatur und der messbaren Wirkung. Kivvi ist das erste ERP, das diese Welt nicht als Sonderfall behandelt, sondern als Ausgangspunkt.

Es ist offen, es ist schweizerisch, es gehört dir. Wer wissen will, wie sich das anfühlt, findet Kivvi unter **kivvi.orangecat.ch**.
