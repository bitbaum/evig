---
title: "SSOT: perché rendiamo il nostro sito più manutenibile"
excerpt: "Abbiamo consolidato ulteriormente la base tecnica del sito: meno hardcoding, responsabilità più chiare, controlli migliori e un processo di rilascio più rigoroso."
author: "Revamp-IT Team"
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

Un sito sostenibile non è solo un sito che parla di sostenibilità. Deve anche essere costruito tecnicamente in modo da poter essere mantenuto, esteso e verificato a lungo. È proprio su questo che abbiamo continuato a lavorare.

Al centro c'era un principio: **Single Source of Truth**, in breve SSOT. Ogni informazione importante deve avere esattamente una fonte affidabile. Colori, indicazioni di stato, dati dell'organizzazione, testi, strutture del database e processi di qualità non devono essere copiati in molti punti in versioni leggermente diverse. Altrimenti ogni modifica diventa più rischiosa, più lenta e più costosa.

## Cosa abbiamo migliorato

Abbiamo aggiunto nuovi controlli di compliance che verificano automaticamente se le regole centrali vengono rispettate. Tra questi ci sono un audit SSOT e un audit i18n per le traduzioni. Il controllo SSOT ora impedisce, tra le altre cose, che le tabelle del database vengano create nelle route API o che vecchi pattern `hardcoded-content` riaffiorino.

Anche il processo di rilascio è stato reso più rigoroso. Invece di ignorare gli avvisi o di verificare solo dopo la build, il percorso di qualità ora è più chiaro: TypeScript, linting, compliance, test e production build. Questo rende gli errori visibili prima e rafforza l'affidabilità prima dei rilasci.

Nel design system diverse indicazioni di colore hardcoded sono state spostate in configurazioni UI centrali. I colori propri dell'app per immagini Open-Graph, overlay di feedback, pagine di errore, moduli di categoria, factsheet, pattern hero e profili cliente si trovano ora in punti nominati. Questo riduce le dipendenze nascoste e rende gli adeguamenti futuri più mirati.

Un altro punto è stata la separazione tra contenuto e configurazione. Un badge di servizio come "Presto" non appartiene in modo fisso a una configurazione tecnica del servizio, ma alle traduzioni. Piccoli spostamenti di questo tipo ripagano molto in termini di manutenibilità nel lungo periodo.

## Perché è importante

L'hardcoding è spesso comodo, ma genera debito. Un colore qui, un testo tedesco lì, una classe di stato in un file di dominio, uno statement di database in una route API: ogni singolo punto sembra innocuo. Insieme però portano a un sistema difficile da capire e difficile da modificare in sicurezza.

Per questo SSOT non è fine a sé stesso. Ci aiuta a lavorare più velocemente e con maggiore precisione:

- Le modifiche avvengono in un punto solo invece che in molti.
- Le decisioni di design restano coerenti.
- Le traduzioni diventano misurabili.
- La struttura del database resta nelle migrazioni e nei file di schema.
- Le review possono concentrarsi sul comportamento invece che sulla ricerca.

## Cosa resta ancora aperto

La direzione è chiara, ma il lavoro non è concluso. Come prossimo passo vogliamo ridurre il debito di traduzione esistente. Il nuovo controllo i18n impedisce già nuovi key mancanti, ma alcune lacune esistenti sono ancora documentate come baseline.

Inoltre le configurazioni di dominio dovrebbero essere ulteriormente separate dai testi UI. Valori di stato come `active`, `sold` o `reserved` sono dati di dominio. Le etichette tedesche e la rappresentazione visiva dovrebbero provenire in modo pulito dalle traduzioni e dal mapping UI.

Anche il design system merita ancora un consolidamento più profondo. Esistono già buoni componenti centrali, ma alcuni livelli di token più vecchi si sovrappongono. L'obiettivo è un'architettura chiara: token primitivi, token semantici, varianti di componente e mapping specifici per area.

## Il nostro standard

Per noi la manutenibilità è un criterio di qualità. Decide se una piattaforma funziona solo oggi oppure se può essere sviluppata in sicurezza anche fra un anno.

SSOT, separation of concerns e codice DRY non sono per questo concetti astratti. Sono regole di lavoro concrete: meno copie, confini più chiari, migliore automazione e un sistema che non rende le modifiche inutilmente difficili.

È proprio su questo che continuiamo a costruire.
