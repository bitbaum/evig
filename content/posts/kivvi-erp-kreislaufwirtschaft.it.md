---
title: "Kivvi: l'ERP dell'economia circolare"
excerpt: "Gli ERP standard conoscono l'acquisto e le quantità — non le donazioni né i pezzi unici con stato e storia. Kivvi è l'ERP aperto costruito esattamente per questo."
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

Un furgone si ferma davanti al magazzino. Sul retro: 50 laptop donati da un'azienda che ha rinnovato il proprio parco. Ogni dispositivo è un pezzo unico — con il proprio stato, la propria storia, il proprio percorso attraverso riparazione e vendita. Per un'attività dell'economia circolare è un martedì mattina del tutto normale. Per un ERP di uso comune è un problema che non tenta nemmeno di risolvere.

![Pagina iniziale di Kivvi con il claim «Il sistema operativo dell'economia circolare»](/blog/showcase-kivvi-home.png)

*«50 laptop donati? Registrati in 30 secondi.» — Kivvi è costruito da zero per la quotidianità di chi ricondiziona e dei mercatini dell'usato.*

## Il problema: gli ERP standard pensano in termini di acquisto e quantità

Ogni sistema di gestione delle merci diffuso al mondo parte dallo stesso presupposto di base: acquisti una certa quantità di articoli identici, li immagazzini e li rivendi. 200 pezzi dell'articolo n. 4711, tutti uguali, tutti nuovi. Il prezzo d'acquisto è noto, il margine è calcolato, la quantità è la grandezza decisiva.

Un'attività dell'economia circolare funziona esattamente al contrario. La merce non arriva come ordine, ma come **donazione** o come **permuta**. Non è una quantità, ma un insieme di **pezzi unici** — ciascuno con il proprio grado di stato, da «come nuovo» a «per pezzi di ricambio». Ogni dispositivo ha una **storia di riparazione**: cosa è stato testato, cosa sostituito, chi ha cancellato i dati. E alla fine non conta solo il ricavo della vendita, ma anche l'**impatto** — quanti dispositivi sono stati salvati dalla discarica.

Queste differenze non sono cosmetiche. Riguardano il cuore stesso del modello di dati. Un sistema che tratta la «quantità» come grandezza centrale può al massimo agganciare un grado di stato come nota testuale da qualche parte — ma non può filtrare, calcolare o valutare in base a esso. Un sistema che intende l'entrata merci come un acquisto con fattura semplicemente non ha un campo per una donazione senza controvalore né un modello per la ricevuta di cui il donatore ha bisogno. La lacuna non si può colmare con la configurazione; risiede nei presupposti fondanti.

Nulla di tutto ciò rientra nei modelli di dati di SAP, Odoo o di una delle tante soluzioni per PMI. Non conoscono alcun grado di stato, alcuna ricevuta di donazione, alcun ciclo di vita di un singolo dispositivo. Chi gestisce un'attività di ricondizionamento, un mercatino dell'usato o un repair café aveva finora solo due opzioni: il datato **Kivitendo** basato su Perl con la sua zavorra legacy — oppure l'eterna fuga nei **fogli di calcolo**, dove ogni processo viene ricostruito a mano e i dati marciscono in decine di file non collegati.

## Cosa fa Kivvi in modo diverso

Kivvi ribalta il presupposto di base. Al centro non c'è l'acquisto, ma la **provenienza della merce e il singolo oggetto**. Donazione, stato, percorso di riparazione e impatto non sono campi aggiunti in un secondo momento — sono il fondamento del modello di dati.

![Login a schermo diviso con checklist di funzioni: inserimento rapido con IA, articoli singoli, ricevute di donazione, fatture QR, Open Source MIT](/blog/showcase-kivvi-login.png)

*Già al login Kivvi mostra ciò che conta: inserimento rapido con IA, gestione dei singoli articoli, ricevute di donazione, fatture QR svizzere — e Open Source con licenza MIT.*

Il risultato è un sistema che parla la lingua dell'economia circolare, invece di comprimerla in uno schema estraneo. Dove un ERP classico dovrebbe prima essere faticosamente piegato — con campi aggiuntivi, workaround e fogli di calcolo esterni a lato —, in Kivvi l'oggetto usato e unico è il caso normale. Ed è costruito per attività concrete, non per il commercio generico.

![«Per chi è Kivvi?» con i gruppi target ricondizionatori IT, mercatini dell'usato, repair café e negozi vintage](/blog/showcase-kivvi-fuer-wen.png)

*Kivvi si rivolge a ricondizionatori IT, mercatini dell'usato, repair café e negozi vintage — attività che lavorano con merce usata e unica.*

## Ciò che gli ERP standard non sanno fare — e Kivvi sì

![Panoramica «Ciò che gli ERP standard non sanno fare»](/blog/showcase-kivvi-sec1.png)

*La lacuna che Kivvi colma: tutto ciò che ha a che fare con merce donata, singola, riparata.*

Il modo migliore per capire Kivvi è un giro attraverso le sue aree centrali — ogni volta con la domanda: cosa fa e quale problema risolve?

### Accettazione merci e donazioni

**Cosa fa:** All'accettazione, ogni merce viene registrata con la sua provenienza (donazione o permuta) e un **grado di stato**. Per le donazioni si può emettere direttamente una **ricevuta di donazione**.

**Quale problema risolve:** Il grado di stato è l'informazione di base da cui poi dipende tutto — prezzo, necessità di riparazione, vendibilità. E la ricevuta di donazione, semplicemente non prevista negli ERP standard, è un documento di cui le attività di pubblica utilità hanno bisogno ogni giorno.

### Ciclo di vita del singolo articolo

**Cosa fa:** Ogni dispositivo è un record proprio che attraversa un ciclo di vita definito: **intake → testing → repair → ready → listed → sold**. Lo stato di ogni pezzo è visibile in qualsiasi momento.

**Quale problema risolve:** Invece di un'indicazione di quantità «200 pezzi», l'attività sa per ogni singolo oggetto a che punto si trova. Nessun dispositivo si perde nel processo, nessuna merce rimane bloccata inosservata nel limbo dei test.

### Riparazioni

**Cosa fa:** Gli ordini di riparazione vengono gestiti per dispositivo — incluso il **bonus di riparazione** e l'emissione di **certificati di cancellazione** per la distruzione dei dati conforme alla protezione dei dati.

**Quale problema risolve:** La storia di riparazione resta legata al dispositivo ed è tracciabile. Il certificato di cancellazione non è un optional nella vendita di hardware IT usato, ma una questione di fiducia e conformità.

### Vendita

**Cosa fa:** L'intero processo di vendita è rappresentato: **offerta → ordine → bolla di consegna → fattura → solleciti**.

**Quale problema risolve:** Dalla prima offerta all'ultimo sollecito di pagamento tutto scorre in un unico sistema, senza rottura di supporto. Nessuno strumento di fatturazione parallelo, nessun sollecito gestito a mano.

![Panoramica «Ciò che Kivvi sa fare»](/blog/showcase-kivvi-sec3.png)

*Dall'entrata merci alla contabilità: Kivvi copre l'intera catena in un unico sistema.*

### Contabilità svizzera

**Cosa fa:** Kivvi porta con sé un **piano dei conti PMI completo con 227 conti**, un **giornale immutabile** e la gestione dell'**IVA**.

**Quale problema risolve:** La contabilità non è un programma separato verso cui i dati devono essere esportati, ma parte integrante dell'ERP. Il giornale immutabile garantisce la sicurezza di revisione — una volta registrato, resta registrato.

### Banking

**Cosa fa:** Kivvi importa i file bancari **CAMT.053/054** e riconcilia automaticamente i pagamenti in entrata con le **fatture QR**.

**Quale problema risolve:** La riconciliazione dei pagamenti, altrimenti ore di lavoro manuale, avviene automaticamente. Le fatture pagate vengono riconosciute, le partite aperte restano aperte — senza che nessuno confronti riga per riga gli estratti conto con le fatture.

### Barra dei comandi IA

**Cosa fa:** Una barra dei comandi basata sull'IA comprende il linguaggio naturale e lo esegue tramite **47 strumenti verificati** — dall'inserimento rapido all'analisi.

**Quale problema risolve:** «50 laptop donati? Registrati in 30 secondi.» — invece di cliccare ogni campo singolarmente, si descrive il compito e Kivvi lo esegue. Poiché ciascuno dei 47 strumenti è verificato, ogni azione resta tracciabile e controllata.

## Aperto e connesso

Un ERP che rinchiude i propri dati è una trappola. Kivvi prende la strada opposta ed è costruito aperto fin dalle fondamenta.

Offre un'**API REST aperta (v1)** e **webhook firmati**, tramite cui altri sistemi vengono collegati in modo pulito e sicuro. Per il passaggio dal sistema legacy c'è un **import CSV Kivitendo** — esattamente l'interfaccia che si desidera, esattamente nel punto giusto: nel passaggio dal vecchio mondo Perl a quello nuovo.

Altrettanto importante è la licenza. Kivvi è **Open Source con licenza MIT**. Ciò significa: **nessun vendor lock-in**, **self-hosting** sulla propria infrastruttura e la certezza che i **dati restino in Svizzera**. Chi utilizza Kivvi possiede il proprio sistema — non il contrario. Proprio per le attività di pubblica utilità che lavorano con mezzi limitati e pianificano a lungo termine, questo è decisivo: non ci sono costi di licenza che esplodono con la crescita, né il rischio che un fornitore interrompa il prodotto e prenda in ostaggio i dati. Il codice sorgente è aperto, le interfacce sono documentate, l'attività resta in grado di agire.

## L'ordine di grandezza

Kivvi non è un prototipo, ma un sistema maturo. Qualche cifra per inquadrarlo:

| Indicatore | Valore |
|---|---|
| Documentazione | 133 pagine |
| Tabelle di database | 50 |
| Moduli di dominio | 63 |
| Strumenti IA | 47 |
| Commit | 616 |
| Licenza | MIT |

## Sotto il cofano

Tecnicamente Kivvi poggia su una base moderna e manutenibile. È costruito come **monorepo Next.js 14** in **TypeScript**, con **PostgreSQL** come database e **Drizzle** come ORM. Per tutti gli importi in denaro viene impiegato **decimal.js** — gli errori di arrotondamento su franchi e centesimi sono così esclusi. Kivvi genera le fatture QR svizzere con **SwissQRBill**, pulitamente conforme allo standard. Questa scelta non è fine a se stessa: fa sì che il sistema calcoli correttamente, resti manutenibile e possa crescere insieme all'attività.

## Conclusione

Gli ERP standard sono costruiti per un mondo in cui la merce viene acquistata in quantità e venduta identica. L'economia circolare vive in un altro mondo — il mondo della donazione, del pezzo unico con stato e storia, della riparazione e dell'impatto misurabile. Kivvi è il primo ERP che non tratta questo mondo come un caso speciale, ma come punto di partenza.

È aperto, è svizzero, ti appartiene. Chi vuole sapere che effetto fa trova Kivvi all'indirizzo **kivvi.orangecat.ch**.
