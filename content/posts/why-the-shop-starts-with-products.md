---
title: "Warum der Shop der Marktplatz ist"
excerpt: "Shop bedeutet bei Revamp-IT ab jetzt Marktplatz: ein schneller Kaufpfad fuer gebrauchte Elektronik von Revamp-IT und anderen Anbieter:innen."
author: "RevampIT Team"
featuredImage: "/blog/shop-products.svg"
category: "Produkt"
tags:
  - shop
  - design-system
  - reparatur
  - ssot
publishedAt: "2026-06-16"
published: true
---

Die Shop-Frage hatte eine falsche Prämisse. Wir brauchen keine zweite Shop-Seite, die neben dem Marktplatz erklärt, wo man kaufen kann. Wer auf "Shop" klickt, will Produkte sehen, vergleichen und möglichst schnell zur Kaufentscheidung kommen. Deshalb ist der Online-Shop jetzt der Marktplatz.

Das reduziert kognitive Last. Es gibt einen kanonischen Ort fuer gebrauchte Elektronik: `/marketplace`. Alte `/shop`-URLs bleiben als Redirects erhalten, aber neue Navigation, Sitemap, Chatbot-Vorschlaege und interne Helfer zeigen auf den Marktplatz. Die Nutzer:innen landen direkt bei Suche, Filtern und Inseraten statt in einer Kanalauswahl.

Aus Business-Sicht ist das der richtige Default. Der Marktplatz kann Revamp-IT-Inserate und Inserate anderer Anbieter:innen zusammenfuehren. Revamp-IT-Angebote werden als solche markiert, wenn sie explizit so geflaggt sind oder von einer Staff-Adresse unter `@revamp-it.ch` beziehungsweise `@revampit.ch` stammen. So entsteht ein einfacher mentaler Markt: alles durchsuchen, Quelle erkennen, kaufen.

Aus Design-Sicht ist die Disziplin dieselbe wie bei unseren anderen gehärteten Oberflaechen: keine grossen Ausweichkarten, keine gleichwertigen Nebenpfade, keine unklaren CTA-Texte. Die erste Aufgabe ist Kaufen. Filtern, Suchen und Detailseiten muessen schnell sein und wenig erklaeren muessen.

Aus Engineering-Sicht entfernt die Entscheidung eine Fork. `/shop`, `/shop/search`, `/shop/category/...` und `/shop/product/...` sind Legacy-Eingaenge in den Marktplatz. Der Sitemap werden keine alten Shop-Produktseiten mehr hinzugefuegt. Die URL-Helfer erzeugen Marktplatz-URLs, damit neue Links nicht versehentlich die alte Architektur wiederbeleben.

Die andere grosse Nutzeraufgabe bleibt Reparatur und IT-Hilfe. Dort ist der kanonische Einstieg nicht ein neuer Parallelprozess, sondern `/it-hilfe/create` fuer Problem beschreiben und `/it-hilfe/techniker` fuer Techniker und Werkstaetten. Die Anfrage bleibt im System; Matching und Diagnose koennen darauf aufbauen.

Weil Payrexx noch nicht produktiv eingerichtet ist, darf die Plattform bis zum Zahlungsklick funktionieren, aber keine Fake-Zahlungen in Produktion erzeugen. Marketplace-Checkout, Terminzahlung und Workshop-Zahlung stoppen deshalb mit einer klaren Setup-Meldung, bevor sie Inventar, Termine oder Plaetze veraendern. Das ist ehrlicher und sicherer als ein Demo-Payment, das wie echt aussieht.
