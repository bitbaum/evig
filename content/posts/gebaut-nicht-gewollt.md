---
title: "Gebaut, nicht gewollt: die Plattform, mit der evig eigenständig weitergeht"
excerpt: "Ich habe eine Plattform gebaut, die den ganzen Weg vom gespendeten Altgerät bis zur neuen Besitzerin automatisiert. Revamp-IT wollte diesen Weg nicht gehen und bleibt bei drei getrennten Alt-Systemen. Hier der ehrliche Vergleich — was war, was ich gebaut habe, und wohin es geht."
featuredImage: "/blog/showcase-revampit-home.png"
category: "Produkt"
tags:
  - plattform
  - evig
  - vergleich
  - roadmap
  - kreislaufwirtschaft
publishedAt: "2026-07-28"
published: true
audience: public
visibility: public
---

Ich habe eine Plattform gebaut, die alles vereint und automatisiert — vom gespendeten Altgerät über die Qualitätskontrolle bis ins öffentliche Schaufenster, dazu den ganzen internen Betrieb. Revamp-IT hat sich entschieden, diesen Weg nicht mitzugehen, und bleibt bei den bestehenden Systemen: einer Joomla-Website, einem separaten Shopware-Shop und Kivitendo, einem ERP in Perl ohne echte Schnittstelle. Das ist die Entscheidung des Vereins. Ich bin überzeugt, dass der automatisierte Weg der bessere ist — und gehe ihn mit **evig** eigenständig weiter.

Dieser Beitrag ist der ehrliche Vergleich. Kein Nachtreten, sondern ein Nebeneinander: **was war**, **was ich gebaut habe** und **wohin es geht.**

## Was war: drei Systeme, die schweigen

Über die Jahre waren bei Revamp-IT drei getrennte Alt-Systeme gewachsen, jedes mit eigenem Zweck und eigener Datenhaltung:

- Die **Joomla-Website** auf `revamp-it.ch` — das öffentliche Gesicht, aber statisch und vom Rest abgekoppelt.
- Der **Shopware-Shop** auf `shop.revamp-it.ch` — der Verkauf refurbishter Geräte, ein eigenes Universum.
- Das **Kivitendo-ERP** — Buchhaltung und Lager, in Perl geschrieben, abgeschottet und ohne brauchbare API.

Diese drei sprachen nicht miteinander. Ein Gerät, das erfasst, geprüft, eingelagert und verkauft wurde, musste an jeder Station von Hand neu eingetippt werden. Daten wanderten per Kopie über die Gräben — mit allen Fehlern, die manuelles Übertragen mit sich bringt. Und weil Kivitendo keine echte Schnittstelle hat, endet jeder Automatisierungsversuch an derselben Wand: Man sucht nach einer API, die es schlicht nicht gibt, oder ahmt mühsam einen Browser nach, um überhaupt Daten hinein- und herauszubekommen.

Das Reparieren war nie das Problem. Die Organisation dahinter war es.

## Was ich gebaut habe: eine Plattform, öffentlich und intern zugleich

Statt drei Alt-Systeme weiter mit Klebeband zusammenzuhalten, habe ich eine einzige, zusammenhängende Plattform gebaut. Sie deckt beide Welten ab — die **öffentliche Seite**, auf der die Community stöbert, kauft und Hilfe sucht, und die **interne Seite**, auf der Geräte erfasst, geprüft und publiziert werden, Zeit erfasst und der Betrieb koordiniert wird. Beide teilen dieselbe Datengrundlage. Ein Gerät wird **einmal** erfasst und wandert von dort automatisch bis ins Schaufenster.

![Marktplatz mit Filtern, CO₂-Leiste und Inseraten](/blog/showcase-revampit-marketplace.png)
*Der Marktplatz: refurbishte Geräte und private Inserate in einem Schaufenster, mit Filtern und transparenter CO₂-Leiste.*

- **Marktplatz** — refurbishte Geräte und privater Peer-to-Peer-Handel an einem Ort. Ein Warenkorb, ein Checkout, Zahlung über Payrexx mit Treuhand-Funktion.
- **IT-Hilfe** — ein zweiseitiges Netzwerk, das Reparaturbedarf mit Technikerinnen und Technikern verbindet. Jede Reparatur ist ein Gerät weniger im Abfall.
- **Dienstleistungen** — «Bau deinen Computer», Linux-Installation und -Beratung, fachgerechtes Recycling.
- **Geräte-Eingang** — KI-gestützte Erfassung nimmt Fotos und Eckdaten auf und schlägt Kategorie und Daten vor; prüfpflichtige Kategorien durchlaufen eine strukturierte Qualitätskontrolle mit Checkliste und Vier-Augen-Prinzip; Bulk-Erfassung und CSV-Import für Mengen.
- **Zeiterfassung, Teams und Hirn** — Saldo, Rapport und Freigabe-Ablauf für den Betrieb; eine Team-Struktur, die zeigt, wer woran arbeitet; und «Hirn», ein RAG-basierter KI-Assistent, der auf dem eigenen Wissen der Organisation antwortet.
- **CO₂-Wirkung** — jede Zahl mit offengelegter Herleitung (ADEME-Faktoren, abgeglichen mit Fraunhofer und ZHAW), auf einer eigenen Transparenz-Seite. Belegt, nicht behauptet.

![CO₂-Methodik auf der Transparenz-Seite](/blog/showcase-revampit-co2.png)
*Jede CO₂-Angabe ist an eine offene Quelle gebunden und die Rechnung öffentlich — überprüfbar statt Greenwashing.*

## Der direkte Vergleich

| | Vorher (Revamp-IT, Alt-Systeme) | Jetzt (die Plattform) |
|---|---|---|
| **Systeme** | 3 getrennte (Joomla, Shopware, Kivitendo) | 1 zusammenhängende App |
| **Dateneingabe** | an jeder Station von Hand neu | einmal erfasst, automatisch weitergereicht |
| **ERP-Anbindung** | Kivitendo (Perl), keine echte API | Kivvi mit REST-API-Sync (`syncToKivvi`) |
| **Verkauf & P2P** | getrennt bzw. gar nicht vorhanden | ein Marktplatz, ein Checkout |
| **Suche** | keine übergreifende | Meilisearch über den ganzen Bestand |
| **Nachhaltigkeit** | Behauptung | jede Zahl mit offener Quelle |
| **Sprachen** | im Wesentlichen eine | 8 |
| **Intern (Zeit, Teams, Wissen)** | verstreut / manuell | in der Plattform, mit KI-Assistent |

Wichtiger als jede einzelne Technologie ist das Prinzip dahinter: **eine einzige Quelle der Wahrheit** für jede Information. Genau das, was den drei Alt-Systemen gefehlt hat.

## Die Grössenordnung

Aus «drei Systeme, die schweigen» ist eine Plattform mit beträchtlicher Tiefe geworden (Stand Juli 2026):

| Kennzahl | Wert |
|---|---|
| API-Endpunkte | über 300 |
| Seiten | über 220 |
| Admin-Module | 33 |
| Datenbank-Tabellen | rund 130 |
| Sprachen | 8 |
| Commits | über 2'300 |

Unter der Haube: **Next.js 16** mit **TypeScript**, Daten in **PostgreSQL** über das ORM **Drizzle** (Typen direkt aus dem Schema), Anmeldung mit **NextAuth v5**, Suche mit **Meilisearch**, Zahlungen über **Payrexx**, Bilder auf **Cloudflare R2**. Ein moderner, bewusst gewählter Stack — kein Perl-ERP, an dem jede Automatisierung scheitert.

## Wohin es geht

Die Plattform ist nicht das Ziel, sondern das Fundament. evig geht von der Kreislaufwirtschaft einen Schritt weiter — zum **Zugang zu Intelligenz für alle**. Das ist die Roadmap:

- **Bezahlbare KI auf bescheidener Hardware.** Ein aufbereiteter Laptop ist nicht nur die grünere Wahl, sondern die günstigste Auffahrt zur künstlichen Intelligenz, die es gibt. Wir erforschen und zeigen, wie fähige KI auf Second-Life-Geräten läuft.
- **Robotik als nächster Schritt.** Verkörperte Intelligenz — Roboter, die echte Arbeit aus einem Leben nehmen und Zeit zurückgeben. Humanoide werden heute kaum neu verkauft und noch gar nicht gebraucht; evig will der erste Ort sein, der sie richtig anbietet: vollständig, geprüft, für einen echten Zweck belegt — und mit dem Wissen, sie zu nutzen.
- **Neue Wege, sich Intelligenz zu leisten.** Neben dem direkten Kauf: Subscription-Crowdfunding und gemeinschaftliche Finanzierung, geteilte Abo-Pools (die laufenden Kosten von KI teilen statt allein tragen), direkte Unterstützung ohne Zwischenhändler.
- **Forschung, offen geführt.** evig verkauft und repariert nicht nur — es untersucht: bezahlbare KI, offene Robotik, Reparatur, Souveränität über die eigenen Werkzeuge. Und veröffentlicht, was es findet. Wissen im Kreislauf ist dieselbe Idee wie Hardware im Kreislauf.

Das ist der Unterschied zwischen «gut genug, wie es war» und «so weit, wie es gehen kann». Ich habe das Fundament gebaut, weil ich diesen Weg gehen will — schnell, eigenständig und über Zürich hinaus.

## Fazit

Wo drei Alt-Systeme nebeneinanderher liefen und Daten von Hand über die Gräben getragen wurden, steht heute eine zusammenhängende, automatisierte Plattform. Sie war da, funktionierend und überprüfbar. Revamp-IT hat sich für den bekannten Weg entschieden — das ist ihr gutes Recht, und die Arbeit, die sie seit 2003 leisten, bleibt wertvoll. Ich habe mich für den anderen entschieden: alles zu vereinen, so viel wie möglich zu automatisieren und das Fundament auf das Zeitalter der Intelligenz auszurichten.

evig baut weiter. Dieselben Wurzeln, ein grösseres Ziel.
