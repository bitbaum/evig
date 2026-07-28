---
title: "Costruita, non voluta: la piattaforma con cui evig prosegue in modo indipendente"
excerpt: "Ho costruito una piattaforma che automatizza l'intero percorso, dall'apparecchio usato donato fino alla sua nuova proprietaria. Revamp-IT non ha voluto percorrere questa strada e resta con tre sistemi legacy separati. Ecco il confronto onesto: com'era, cosa ho costruito e dove sta andando."
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

Ho costruito una piattaforma che unifica e automatizza tutto: dall'apparecchio usato donato, passando per il controllo qualità, fino alla vetrina pubblica, oltre a tutta l'operatività interna. Revamp-IT ha deciso di non percorrere questa strada e resta con i sistemi esistenti: un sito Joomla, un negozio Shopware separato e Kivitendo, un ERP scritto in Perl senza una vera interfaccia. È la decisione dell'associazione. Sono convinto che la via automatizzata sia la migliore, e la proseguo in modo indipendente con **evig**.

Questo articolo è il confronto onesto. Non un attacco, ma un affiancamento: **com'era**, **cosa ho costruito** e **dove sta andando.**

## Com'era: tre sistemi che tacciono

Nel corso degli anni, in Revamp-IT erano cresciuti tre sistemi legacy separati, ognuno con il proprio scopo e i propri dati:

- Il **sito Joomla** su `revamp-it.ch` — il volto pubblico, ma statico e scollegato dal resto.
- Il **negozio Shopware** su `shop.revamp-it.ch` — la vendita di apparecchi ricondizionati, un universo a sé.
- L'**ERP Kivitendo** — contabilità e magazzino, scritto in Perl, isolato e senza un'API utilizzabile.

Questi tre non si parlavano. Un apparecchio registrato, controllato, messo a magazzino e venduto doveva essere ridigitato a mano a ogni stazione. I dati passavano da un silo all'altro per copia, con tutti gli errori che comporta il trasferimento manuale. E poiché Kivitendo non ha una vera interfaccia, ogni tentativo di automazione finisce contro lo stesso muro: si cerca un'API che semplicemente non esiste, oppure si imita faticosamente un browser solo per riuscire a far entrare e uscire i dati.

Riparare non è mai stato il problema. Lo era l'organizzazione dietro.

## Cosa ho costruito: una piattaforma, pubblica e interna al tempo stesso

Invece di continuare a tenere insieme tre sistemi legacy con il nastro adesivo, ho costruito un'unica piattaforma coerente. Copre entrambi i mondi: il **lato pubblico**, dove la comunità sfoglia, acquista e cerca aiuto, e il **lato interno**, dove gli apparecchi vengono registrati, controllati e pubblicati, il tempo viene rilevato e l'operatività coordinata. Entrambi condividono la stessa base di dati. Un apparecchio viene registrato **una sola volta** e da lì viaggia automaticamente fino alla vetrina.

![Marketplace con filtri, barra CO₂ e annunci](/blog/showcase-revampit-marketplace.png)
*Il marketplace: apparecchi ricondizionati e annunci privati in un'unica vetrina, con filtri e una barra CO₂ trasparente.*

- **Marketplace** — apparecchi ricondizionati e commercio privato peer-to-peer in un unico luogo. Un carrello, un checkout, pagamento tramite Payrexx con funzione di deposito a garanzia.
- **Aiuto informatico** — una rete a due lati che collega le esigenze di riparazione con le tecniche e i tecnici. Ogni riparazione è un apparecchio in meno tra i rifiuti.
- **Servizi** — «Costruisci il tuo computer», installazione e consulenza Linux, riciclaggio a regola d'arte.
- **Accettazione apparecchi** — la registrazione assistita dall'IA acquisisce foto e dati essenziali e propone una categoria e i dati; le categorie soggette a controllo passano per un controllo qualità strutturato con lista di verifica e principio dei quattro occhi; registrazione in blocco e importazione CSV per le grandi quantità.
- **Rilevazione tempi, team e Hirn** — saldo, rapporto e flusso di approvazione per l'operatività; una struttura di team che mostra chi lavora su cosa; e «Hirn», un assistente IA basato su RAG che risponde a partire dalla conoscenza propria dell'organizzazione.
- **Impatto CO₂** — ogni cifra con la sua derivazione resa nota (fattori ADEME, verificati con Fraunhofer e la ZHAW), su una pagina di trasparenza dedicata. Dimostrato, non affermato.

![Metodologia CO₂ sulla pagina di trasparenza](/blog/showcase-revampit-co2.png)
*Ogni dato di CO₂ è legato a una fonte aperta e il calcolo è pubblico — verificabile invece del greenwashing.*

## Il confronto diretto

| | Prima (Revamp-IT, sistemi legacy) | Ora (la piattaforma) |
|---|---|---|
| **Sistemi** | 3 separati (Joomla, Shopware, Kivitendo) | 1 applicazione coerente |
| **Inserimento dati** | a mano di nuovo a ogni stazione | registrato una volta, trasmesso automaticamente |
| **Collegamento ERP** | Kivitendo (Perl), nessuna vera API | Kivvi con sincronizzazione via API REST (`syncToKivvi`) |
| **Vendita & P2P** | separati o del tutto assenti | un marketplace, un checkout |
| **Ricerca** | nessuna trasversale | Meilisearch su tutto il magazzino |
| **Sostenibilità** | affermazione | ogni cifra con una fonte aperta |
| **Lingue** | in sostanza una | 8 |
| **Interno (tempo, team, conoscenza)** | sparso / manuale | nella piattaforma, con assistente IA |

Più importante di ogni singola tecnologia è il principio che vi sta dietro: **un'unica fonte di verità** per ogni informazione. Esattamente ciò che mancava ai tre sistemi legacy.

## L'ordine di grandezza

Da «tre sistemi che tacciono» è nata una piattaforma di notevole profondità (situazione a luglio 2026):

| Indicatore | Valore |
|---|---|
| Endpoint API | oltre 300 |
| Pagine | oltre 220 |
| Moduli di amministrazione | 33 |
| Tabelle di database | circa 130 |
| Lingue | 8 |
| Commit | oltre 2'300 |

Sotto il cofano: **Next.js 16** con **TypeScript**, i dati in **PostgreSQL** tramite l'ORM **Drizzle** (tipi derivati direttamente dallo schema), accesso con **NextAuth v5**, ricerca con **Meilisearch**, pagamenti tramite **Payrexx**, immagini su **Cloudflare R2**. Uno stack moderno e scelto consapevolmente, non un ERP in Perl su cui ogni automazione fallisce.

## Dove sta andando

La piattaforma non è il traguardo, ma il fondamento. evig va un passo oltre l'economia circolare: verso l'**accesso all'intelligenza per tutti**. Ecco la roadmap:

- **IA accessibile su hardware modesto.** Un portatile ricondizionato non è solo la scelta più verde, ma la rampa d'accesso più economica che esista all'intelligenza artificiale. Esploriamo e mostriamo come un'IA capace giri su apparecchi di seconda vita.
- **La robotica come passo successivo.** Intelligenza incarnata: robot che tolgono lavoro reale a una vita e restituiscono tempo. Gli umanoidi oggi si vendono a malapena nuovi e non sono ancora usati; evig vuole essere il primo luogo a offrirli come si deve: completi, controllati, giustificati per uno scopo reale, e con la conoscenza per usarli.
- **Nuovi modi per permettersi l'intelligenza.** Accanto all'acquisto diretto: crowdfunding in abbonamento e finanziamento comunitario, pool di abbonamenti condivisi (dividere i costi correnti dell'IA invece di sostenerli da soli), sostegno diretto senza intermediari.
- **Ricerca condotta apertamente.** evig non si limita a vendere e riparare: indaga: IA accessibile, robotica aperta, riparazione, sovranità sui propri strumenti. E pubblica ciò che trova. La conoscenza in circolo è la stessa idea dell'hardware in circolo.

Questa è la differenza tra «abbastanza buono, com'era» e «fin dove può arrivare». Ho costruito il fondamento perché voglio percorrere questa strada: veloce, in modo indipendente e oltre Zurigo.

## Conclusione

Dove tre sistemi legacy giravano l'uno accanto all'altro e i dati venivano portati a mano oltre i fossati, oggi sorge una piattaforma coerente e automatizzata. C'era, funzionante e verificabile. Revamp-IT ha scelto la via nota: è un suo pieno diritto, e il lavoro che svolge dal 2003 resta prezioso. Io ho scelto l'altra: unificare tutto, automatizzare il più possibile e orientare il fondamento all'era dell'intelligenza.

evig continua a costruire. Le stesse radici, un obiettivo più grande.
