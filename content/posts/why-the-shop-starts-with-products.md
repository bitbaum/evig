---
title: "Warum der Shop jetzt mit Produkten startet"
excerpt: "Die Shop-Seite soll verkaufen, Vertrauen schaffen und Reparatur als sinnvolle Alternative sichtbar machen. Shopware bleibt ein Fallback, aber nicht der Standard."
author: "RevampIT Team"
category: "Produkt"
tags:
  - shop
  - design-system
  - reparatur
  - ssot
publishedAt: "2026-06-16"
published: true
---

Die Shop-Seite hatte ein falsches erstes Signal. Wer auf "Shop" klickt, erwartet Produkte, Suche, Kategorien und eine klare Kaufentscheidung. Stattdessen begann die Seite mit der Frage, welchen Kanal man nutzen möchte. Das machte unseren eigenen Shop, Shopware und das Ladenlokal gleich wichtig, obwohl sie nicht die gleiche Rolle haben.

Der neue Einstieg folgt einem einfachen Prinzip: Der primäre Pfad ist der Revamp-IT Shop. Er zeigt unser veröffentlichtes Inventar, bietet Suche und Kategorien und erklärt kurz, warum die Geräte vertrauenswürdig sind. Das Ladenlokal bleibt wichtig, aber als unterstützender Kaufpfad. Shopware bleibt sichtbar, aber als Fallback für ältere Einträge oder Übergangsfälle.

Aus Business-Sicht reduziert das Reibung. Der Shop soll nicht zuerst Organisationsgeschichte oder Kanallogik erklären, sondern Menschen zu geprüfter, bezahlbarer Hardware führen. Die vorhandenen Alternativen bleiben erreichbar, ohne den Hauptpfad zu verwässern.

Aus Design-Sicht war die wichtigste Korrektur die Hierarchie. Ein Button oder Abschnitt muss ein Ergebnis versprechen: Produkte ansehen, suchen, Reparatur anfragen, Techniker finden. Vage Kanalwahl und gleichwertige Ausweichpfade sind schwächer als ein klarer Standard mit transparenten Nebenwegen.

Aus Engineering-Sicht nutzt die Seite wieder die bestehenden Quellen: Inventar kommt aus dem Shop-Service, Reparatur führt zum bestehenden IT-Hilfe-Anfragefluss, Techniker und Werkstätten bleiben unter der kanonischen Route `/it-hilfe/techniker`. Die alte `/techniker`-Route ist nur noch ein Redirect. Damit bleibt die Reparatur-Logik an einer Stelle statt in mehreren konkurrierenden Oberflächen.

Die Reparatur-Anfrage ist bewusst direkt sichtbar: Wer kein neues Gerät kaufen muss, kann das Problem beschreiben. Die Anfrage bleibt im System und passende Techniker oder Werkstätten können reagieren. Das entspricht besser der Revamp-IT-Logik: kaufen, reparieren und weiterverwenden sind keine getrennten Welten, sondern ein gemeinsamer Kreislauf.
