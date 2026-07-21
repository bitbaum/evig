---
title: "SSOT: Warum wir unsere Website wartbarer machen"
excerpt: "Wir haben die technische Grundlage der Website weiter konsolidiert: weniger Hardcoding, klarere Verantwortlichkeiten, bessere Checks und ein strengerer Ship-Prozess."
featuredImage: "/blog/ssot-quality-gate.svg"
category: "Engineering"
tags:
  - SSOT
  - Maintainability
  - Design System
  - Engineering
publishedAt: "2026-05-07"
published: true
---

Eine nachhaltige Website ist nicht nur eine Website, die über Nachhaltigkeit spricht. Sie muss auch technisch so gebaut sein, dass sie lange gepflegt, erweitert und überprüft werden kann. Genau daran haben wir weitergearbeitet.

Im Zentrum stand ein Prinzip: **Single Source of Truth**, kurz SSOT. Jede wichtige Information soll genau eine verlässliche Quelle haben. Farben, Statusanzeigen, Organisationsdaten, Texte, Datenbankstrukturen und Qualitätsprozesse dürfen nicht an vielen Stellen leicht unterschiedlich kopiert werden. Sonst wird jede Änderung riskanter, langsamer und teurer.

## Was wir verbessert haben

Wir haben neue Compliance-Checks ergänzt, die automatisch prüfen, ob zentrale Regeln eingehalten werden. Dazu gehören ein SSOT-Audit und ein i18n-Audit für Übersetzungen. Der SSOT-Check verhindert nun unter anderem, dass Datenbanktabellen in API-Routen erzeugt werden oder alte `hardcoded-content`-Muster wieder auftauchen.

Auch der Ship-Prozess wurde verschärft. Statt Warnungen zu ignorieren oder erst nach dem Build zu prüfen, läuft der Qualitätsweg jetzt klarer: TypeScript, Linting, Compliance, Tests und Production Build. Das macht Fehler früher sichtbar und stärkt die Verlässlichkeit vor Releases.

Im Designsystem wurden mehrere harte Farbangaben in zentrale UI-Konfigurationen verschoben. App-eigene Farben für Open-Graph-Bilder, Feedback-Overlays, Fehlerseiten, Kategorie-Formulare, Factsheets, Hero-Muster und Kundenprofile liegen nun an benannten Stellen. Das reduziert versteckte Abhängigkeiten und macht spätere Anpassungen gezielter.

Ein weiterer Punkt war die Trennung von Inhalt und Konfiguration. Ein Service-Badge wie "Bald" gehört nicht fest in eine technische Service-Konfiguration, sondern in die Übersetzungen. Solche kleinen Verschiebungen zahlen auf Dauer stark auf Wartbarkeit ein.

## Warum das wichtig ist

Hardcoding ist oft bequem, aber es erzeugt Schulden. Eine Farbe hier, ein deutscher Text dort, eine Statusklasse in einer Domain-Datei, ein Datenbank-Statement in einer API-Route: Jede einzelne Stelle wirkt harmlos. Zusammen führen sie aber zu einem System, das schwer zu verstehen und schwer sicher zu ändern ist.

SSOT ist deshalb kein Selbstzweck. Es hilft uns, schneller und genauer zu arbeiten:

- Änderungen passieren an einer Stelle statt an vielen.
- Designentscheidungen bleiben konsistent.
- Übersetzungen werden messbar.
- Datenbankstruktur bleibt in Migrationen und Schema-Dateien.
- Reviews können sich auf Verhalten konzentrieren statt auf Sucharbeit.

## Was noch offen ist

Die Richtung ist klar, aber die Arbeit ist nicht abgeschlossen. Als Nächstes wollen wir die vorhandene Übersetzungs-Schuld abbauen. Der neue i18n-Check verhindert bereits neue fehlende Keys, aber einige bestehende Lücken sind noch als Baseline dokumentiert.

Ausserdem sollten Domain-Konfigurationen weiter von UI-Texten getrennt werden. Statuswerte wie `active`, `sold` oder `reserved` sind Domänendaten. Die deutschen Labels und die visuelle Darstellung sollten sauber über Übersetzungen und UI-Mapping kommen.

Auch das Designsystem verdient noch eine tiefere Konsolidierung. Es gibt bereits gute zentrale Bausteine, aber einige ältere Token-Schichten überschneiden sich. Ziel ist eine klare Architektur: primitive Tokens, semantische Tokens, Komponentenvarianten und bereichsspezifische Mappings.

## Unser Standard

Wartbarkeit ist für uns ein Qualitätsmerkmal. Sie entscheidet darüber, ob eine Plattform nur heute funktioniert oder auch in einem Jahr noch sicher weiterentwickelt werden kann.

SSOT, Separation of Concerns und DRY-Code sind dafür keine abstrakten Begriffe. Sie sind konkrete Arbeitsregeln: weniger Kopien, klarere Grenzen, bessere Automatisierung und ein System, das Änderungen nicht unnötig schwer macht.

Genau daran bauen wir weiter.
