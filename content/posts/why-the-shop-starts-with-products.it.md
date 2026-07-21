---
title: "Perché lo shop è il marketplace"
excerpt: "Da Revamp-IT shop significa d'ora in poi marketplace: un percorso d'acquisto rapido per elettronica usata di Revamp-IT e di altri venditori."
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

La domanda sullo shop partiva da una premessa sbagliata. Non ci serve una seconda pagina shop che, accanto al marketplace, spieghi dove si può comprare. Chi clicca su "Shop" vuole vedere i prodotti, confrontarli e arrivare il più rapidamente possibile alla decisione d'acquisto. Per questo lo shop online è ora il marketplace.

Questo riduce il carico cognitivo. C'è un luogo canonico per l'elettronica usata: `/marketplace`. I vecchi URL `/shop` restano come redirect, ma la nuova navigazione, la sitemap, i suggerimenti del chatbot e gli helper interni puntano al marketplace. Gli utenti arrivano direttamente a ricerca, filtri e annunci, invece che a una scelta di canale.

Dal punto di vista del business è il default corretto. Il marketplace può riunire gli annunci di Revamp-IT e gli annunci di altri venditori. Le offerte di Revamp-IT vengono contrassegnate come tali quando sono esplicitamente flaggate in questo modo oppure provengono da un indirizzo staff sotto `@revamp-it.ch` ovvero `@revampit.ch`. Nasce così un mercato mentale semplice: cercare tutto, riconoscere la fonte, comprare.

Dal punto di vista del design la disciplina è la stessa delle nostre altre interfacce consolidate: nessuna grande scheda alternativa, nessun percorso secondario equivalente, nessun testo di CTA poco chiaro. Il primo compito è comprare. Filtri, ricerca e pagine di dettaglio devono essere rapidi e avere poco da spiegare.

Dal punto di vista dell'engineering la decisione elimina un fork. `/shop`, `/shop/search`, `/shop/category/...` e `/shop/product/...` sono ingressi legacy al marketplace. Alla sitemap non vengono più aggiunte vecchie pagine prodotto dello shop. Gli helper degli URL generano URL del marketplace, così che i nuovi link non rianimino per sbaglio la vecchia architettura.

L'altro grande compito degli utenti resta la riparazione e l'aiuto IT. Lì l'ingresso canonico non è un nuovo processo parallelo, ma `/it-hilfe/create` per descrivere il problema e `/it-hilfe/techniker` per tecnici e officine. La richiesta resta nel sistema; il matching e la diagnosi possono basarsi su di essa.

Poiché Payrexx non è ancora configurato in produzione, la piattaforma può funzionare fino al clic di pagamento, ma non deve generare pagamenti fittizi in produzione. Il checkout del marketplace, il pagamento degli appuntamenti e il pagamento dei workshop si fermano quindi con un chiaro messaggio di setup, prima di modificare inventario, appuntamenti o posti. Questo è più onesto e più sicuro di un pagamento demo che sembra reale.
