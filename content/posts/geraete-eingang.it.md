---
title: "Geräte-Eingang: una foto invece di quindici minuti"
excerpt: "Un tempo registrare un dispositivo usato significava un foglio di calcolo, un export CSV e una catena di passaggi di mano fino dentro Kivitendo — e nel negozio non compariva comunque nulla. Come abbiamo trasformato tutto questo in un flusso che richiede pochi secondi, come i sistemi dialogano tra loro tramite API, e quale tassello manca ancora."
author: "RevampIT Team"
featuredImage: "/blog/geraete-eingang-hero.svg"
category: "Technik"
tags:
  - geraete-eingang
  - ki
  - erfassung
  - kivvi
  - kivitendo
  - architektur
  - automatisierung
publishedAt: "2026-07-21"
published: true
---

Ogni dispositivo che ottiene una seconda vita da Revamp-IT deve prima *entrare nel sistema*. Sembra banale. Non lo era. Proprio in questo punto poco appariscente — la registrazione — l'officina ha perso per anni più tempo di ogni altra fase, ed è qui che il valore aggiunto è minimo: un laptop non diventa migliore solo perché qualcuno ne digita i dati. Questa è la storia di come abbiamo trasformato quindici minuti di lavoro manuale in una registrazione che richiede pochi secondi — e di che cosa c'è dietro, dal punto di vista tecnico.

## Il problema: registrare era una scocciatura

All'inizio c'era un foglio di calcolo. Per registrare un dispositivo, si faceva quanto segue, nell'ordine: **pesarlo**, prenderne le **dimensioni** con il metro a nastro, scattare una **foto**, e poi **cercare insieme su Google** le specifiche e un prezzo plausibile — numero di modello, CPU, RAM, prezzo di vendita, tutto digitato a mano in un foglio di calcolo privato (per lo più copiato e incollato).

Poi cominciava la catena dei passaggi di mano. Heinz univa i singoli fogli in un'unica **tabella riepilogativa** e la esportava come **CSV**. Cem caricava quel CSV in **Kivitendo**, il nostro ERP basato su Perl e libro contabile di riferimento. E anche così il dispositivo non era visibile da nessuna parte: nel negozio **non** compariva automaticamente — era l'ennesimo passaggio separato e manuale.

![Il vecchio flusso di registrazione: pesare, misurare, fotografare e cercare le specifiche su Google confluivano in un foglio di calcolo privato, che Heinz univa in una tabella riepilogativa, esportava come CSV e consegnava a Cem, che lo caricava in Kivitendo; nel negozio non compariva nulla automaticamente — da 5 a 15 minuti di puro lavoro manuale per dispositivo.](/blog/geraete-eingang-alt.svg)

Da cinque a quindici minuti di puro lavoro manuale — **per dispositivo**, distribuiti su più persone. L'esito era prevedibile: in teoria tutti nel team avrebbero dovuto registrare, ma solo in pochi lo facevano. Non per cattiva volontà, ma perché la barriera era troppo alta. Un processo che nessuno svolge volentieri diventa il collo di bottiglia — e nel magazzino cresce una montagna di dispositivi non registrati.

## La visione: portare la registrazione praticamente a zero

L'obiettivo era formulato deliberatamente in modo radicale: ridurre il tempo necessario per far entrare un prodotto nel sistema del **99,9 %**. Non «un po' più veloce», ma un altro ordine di grandezza.

Il ragionamento: la foto di un dispositivo contiene già quasi tutto ciò che dobbiamo sapere — produttore, modello, spesso persino le condizioni. Un nome scritto a mano («Lenovo ThinkPad T450 i5») altrettanto. Con un'IA che trasforma questo materiale grezzo in campi strutturati, e con sistemi costruiti con cura che **dialogano tra loro tramite API**, dovrebbe bastare un solo gesto: fotografare o digitare — e il dispositivo finisce dove deve stare. Collegato a un'ubicazione di magazzino nel database, oppure pubblicato direttamente come annuncio nel negozio.

## Come funziona oggi

![Il nuovo percorso: un nome, una foto, una frase pronunciata o una riga CSV vanno all'estrazione IA (Qwen Vision, Groq, Whisper), che restituisce campi strutturati con categoria e confidenza; un'unica funzione createErfassungProduct scrive il record e si dirama verso magazzino, controllo qualità o marketplace, mentre in parallelo avviene la sincronizzazione verso Kivvi.](/blog/geraete-eingang-neu.svg)

### Un ingresso, quattro canali

Il `Geräte-Eingang` (l'accettazione dei dispositivi, `erfassung` nel codice) ha un'interfaccia volutamente semplice con quattro canali di input: **testo**, **foto**, **file** (CSV/Excel) e **voce**. La decisione di progettazione che c'è dietro conta — questi sono *canali*, non quattro flussi di lavoro separati. Comunque arrivino i dati, convergono nello stesso record di prodotto.

Il canale testuale è astuto: rileva automaticamente se una riga è un singolo dispositivo o un'intera lista. Una riga va a `/api/admin/erfassung/text`, più righe a `/api/admin/erfassung/bulk-text` — così puoi incollare un intero pallet di dispositivi in una volta sola e ricevere in cambio una tabella di verifica collettiva. I file CSV ed Excel passano per `bulk-upload`, la voce per `voice`.

### La cascata IA

Il cuore risiede in `src/lib/erfassung/ai-extraction.ts`. `extractProductFromText` invia il testo attraverso una **cascata di fallback** di tre provider (`callWithFallback`): prima **Groq** (`llama-3.3-70b-versatile`), poi **OpenRouter**, poi un **Ollama** locale. Se tutto fallisce, un parser regex (`fastParseProductText`) è l'ultima rete di salvataggio — la registrazione non fallisce mai in modo netto, diventa solo meno precisa.

Per le foto subentra `extractProductFromImage`. Qui vale la pena raccontare una piccola storia dalla sala macchine: Groq ha ritirato il suo precedente modello di visione (Llama 4 Scout) — le richieste tornavano improvvisamente come `404 model_not_found`, e in produzione l'analisi delle foto era morta. Il sostituto oggi è **`qwen/qwen3.6-27b`**, l'unico modello Groq attualmente disponibile capace di elaborare immagini. Ma Qwen3 è un modello di *reasoning*: ragiona ad alta voce in un blocco `<think>…</think>` prima di rispondere. Un parser ingenuo che «prende il primo `{…}`» pescava puntualmente il JSON di esempio da quel blocco di ragionamento e falliva. La soluzione è una funzione piccola e poco spettacolare, `extractJsonObject`, che rimuove i blocchi di reasoning e i delimitatori di codice `json` prima che il JSON venga letto. La voce, a sua volta, viene trascritta con `whisper-large-v3-turbo` di Groq e passa poi attraverso la stessa estrazione dal testo.

Due cose rendono il risultato utilizzabile e non solo impressionante. Primo, la **confidenza per campo**: ogni campo estratto porta con sé una certezza; il modulo di verifica evidenzia solo i campi che hanno davvero bisogno di una seconda occhiata (ad esempio una condizione che il testo non ha mai indicato), invece di tappezzare ogni valore con una percentuale. Secondo, la **categorizzazione**: `detectCategory` è una tabella ordinata di pattern che si mappa sui codici di categoria esistenti. L'ordine è intenzionale — i pattern di accessori, stampanti, monitor e rete corrispondono *prima* delle marche di laptop, e i componenti interni *per ultimi*, così che un nome di dispositivo vinca sempre. In questo modo «Dockingstation Lenovo ThinkPad» viene correttamente classificato come *Rete* e non come laptop.

Nell'interfaccia appare così: digiti una frase, e pochi secondi dopo compare un modulo compilato — produttore, modello, una breve descrizione formulata per esteso, la categoria. Esattamente un campo qui porta un piccolo suggerimento arancione «Prüfen» (verificare): la *condizione*, perché il testo non ne ha mai indicata una. Tutto il resto è silenzioso. È questo il punto cruciale — l'IA non urla «sicuro al 95 %» in ogni riga, indica silenziosamente l'unica cosa che una persona dovrebbe confermare.

![Il passaggio di verifica nell'interfaccia: dalla frase digitata l'IA ha compilato un modulo pulito — produttore Lenovo, modello ThinkPad T480, categoria Laptop, una descrizione formulata per esteso, condizione Buono. Solo il campo della condizione porta un suggerimento arancione «verificare», perché il testo non ha mai indicato una condizione.](/blog/geraete-eingang-review.svg)

### Un'unica fonte di verità per le scritture

Per quanto diversi siano i canali, la scrittura avviene in un solo punto: `createErfassungProduct()` in `src/lib/erfassung/create-product.ts`. Questa funzione è la *single source of truth* per «un dispositivo viene creato». In un'unica transazione assegna un numero d'inventario leggibile dall'uomo (`I-YYMMDD-NNNN`), scrive il record di estrazione (`ai_extracted_products`), crea la voce d'inventario (`inventory_items`, con ubicazione, scatola e quantità), collega i profili dei clienti, carica l'immagine su **R2** (object storage) e la collega — e, opzionalmente, pubblica subito un annuncio.

Poiché tutto passa per quest'unica funzione, valgono ovunque gli stessi invarianti. È anche il motivo per cui in seguito abbiamo potuto migrare **197 prodotti dal vecchio negozio Shopware** in un colpo solo (più avanti i dettagli): l'import chiama esattamente `createErfassungProduct`, invece di inventare un secondo modo di scrivere leggermente diverso.

### Il varco della qualità

Dopo la verifica arriva l'unica vera decisione operativa: *dove va adesso?* Le `CAPTURE_DESTINATIONS` — qualità, inventario, ricambi, riciclo o «negozio non testato» — si mappano sui livelli di accettazione. Un dispositivo di una categoria soggetta a verifica che si vuole pubblicare direttamente viene intercettato da un varco di sicurezza e finisce invece come bozza nella pipeline di ricondizionamento con una checklist QC — a meno che qualcuno non prenda una decisione, esplicitamente registrata, di «pubblicare senza verifica». Se una categoria richieda o meno una verifica non viene gestito separatamente, ma *derivato dalla checklist stessa*: soggetta a verifica è quella che ha una voce di test o di sicurezza obbligatoria per quella classe di dispositivi.

### Verso il marketplace

Quando un dispositivo viene pubblicato, `publishRevampitListing` lo trasforma in un annuncio attivo (flag `is_revampit`), trasferisce l'immagine R2 nelle immagini dell'annuncio e indicizza la voce in **Meilisearch** per la ricerca. Il passaggio da «registrato» a «visibile nel negozio» è quindi una chiamata API, non una seconda persona con un secondo modulo.

### Il test di stress: 197 prodotti dal vecchio negozio

La migliore conferma che il flusso regge è stata la migrazione del catalogo. Il vecchio negozio Shopware non aveva un'API utilizzabile — ma metadati Open Graph puliti per ogni pagina prodotto. Un piccolo scraper percorreva la lista `/Alles/`, estraeva nome, marca, prezzo, descrizione e URL dell'immagine, e un endpoint di migrazione una tantum creava **ciascuno dei 197 prodotti come bozza** — tramite `createErfassungProduct`, con l'immagine scaricata lato server e ri-ospitata su R2. Le categorie venivano dedotte tramite `detectCategory`, i duplicati impediti tramite il numero Shopware memorizzato (idempotente, ripetibile a piacere). Ciò che a mano avrebbe richiesto giorni è stato questione di minuti.

E poiché la migrazione passava per la stessa funzione di qualsiasi singola registrazione, le bozze potevano poi essere pubblicate in una seconda passata — ciascuna diventa un annuncio attivo, con l'immagine R2 che viaggia automaticamente con essa. **11 annunci visibili sono diventati 208**, ciascuno con immagine, prezzo e categoria. Il vecchio negozio non è stato solo ridigitato, è stato *trasferito*.

![Il marketplace dopo la migrazione: da 11 annunci a 208 offerte attive — ogni scheda con immagine del prodotto, titolo, prezzo e badge di condizione, alimentata dal vecchio catalogo Shopware.](/blog/geraete-eingang-marktplatz.svg)

## Tre principi che lo sostengono

Prima di passare ai sistemi vicini, vale la pena guardare a tre decisioni che fanno la differenza tra «funziona nella demo» e «regge in produzione» — e che ricorrono in tutto il codice.

**Un'unica fonte di verità per le scritture.** Che si tratti di foto, voce, CSV, registrazione singola o migrazione di massa: la scrittura avviene esclusivamente tramite `createErfassungProduct`. Ci sarebbero state mille tentazioni di costruire «un rapido secondo percorso, leggermente diverso» per la migrazione. È esattamente ciò che *non* abbiamo fatto — ed è per questo che numeri d'inventario, gestione delle immagini, varco QC e invarianti d'inventario valgono allo stesso modo per ogni percorso. Un bug si corregge in un punto, non in cinque.

**Certezza, non percentuali.** L'IA fornisce una confidenza per ogni campo — ma lo schermo non mostra percentuali. Mostra un suggerimento «verificare» solo dove la certezza scende sotto una soglia. Un numero come «73 %» non è un'istruzione operativa per la persona al banco; «guarda di nuovo qui» lo è. Una buona automazione riduce le decisioni, non le moltiplica.

**Idempotenza ovunque i dati escano.** Ogni sincronizzazione verso Kivvi porta una chiave di idempotenza; ogni record migrato porta il suo numero Shopware; ogni esecuzione di pubblicazione salta ciò che ha già un annuncio. Sembrano dettagli minori, ma sono il motivo per cui possiamo ripetere migrazioni, sincronizzazioni e reindicizzazioni *a piacere*, senza duplicati né timori. La ripetibilità non è un lusso — è la precondizione per poter riparare un sistema mentre è in funzione.

## Sistemi che dialogano tra loro

Registrare è solo metà del lavoro. Un dispositivo deve anche arrivare dove vivono la giacenza e la contabilità. Ed è qui che diventa architettonicamente interessante, perché a questo si agganciano due mondi molto diversi.

![Architettura di integrazione: l'accettazione dei dispositivi scrive localmente inventory_items e sincronizza verso l'alto a Kivvi tramite la sua API REST già pronta con bearer token e chiave di idempotenza, ricevendo in cambio webhook di stato; il percorso verso il Kivitendo legacy in Perl passa per un livello di traduzione Node separato che imita un browser.](/blog/geraete-eingang-integration.svg)

### Kivvi: una membrana pulita

**Kivvi** è il moderno ERP svizzero in cloud (TypeScript, Drizzle/Postgres) verso cui sincronizziamo i dispositivi. Ci rende le cose facili perché offre esattamente ciò di cui ha bisogno un partner di integrazione: un'API REST versionata sotto `/api/v1/`. Il nostro `syncToKivvi` (`src/lib/kivvi/client.ts`) esegue un `POST /api/v1/inventory-items` con un bearer token (`kv_…`) conservato lato server come hash SHA-256.

Qui tre proprietà sono decisive — e nel codice di Kivvi sono persino nominate per Revamp-IT:

- **Idempotenza.** La chiamata porta una `Idempotency-Key`; un doppio push non crea alcun duplicato. È proprio per questo che possiamo riprovare senza preoccupazioni.
- **Non bloccante, dopo il commit.** La sincronizzazione è fire-and-forget: parte *dopo* la transazione di database della registrazione e non blocca mai l'accettazione. In seguito riscriviamo `kivvi_inventory_item_id` e `kivvi_sync_status` sulla voce d'inventario. Se Kivvi non è configurato (nessun `KIVVI_API_URL`), il client restituisce in modo pulito `{ success: false }` invece di sollevare un'eccezione — in dev, semplicemente nessuna sincronizzazione.
- **Bidirezionale.** Kivvi rimanda indietro webhook firmati (`inventory_item.status_changed`, ecc.). Quando un dispositivo viene venduto lì, lo veniamo a sapere — senza polling.

Un piccolo ma importante passaggio di traduzione: il vocabolario delle condizioni di RevampIT viene mappato sull'enum di Kivvi (`new → like_new`, `defect → parts_only`, ignoto → `untested`). Senza questa mappatura la validazione di Kivvi rifiuta il record con HTTP 400. Piccoli contratti, mantenuti con chiarezza.

### Kivitendo: un traduttore, non un secondo cervello

L'altro vicino è **Kivitendo** — un ERP MVC in Perl, il nostro libro contabile conforme alla legge, che deliberatamente *manteniamo*. Il rovescio della medaglia: Kivitendo **non ha API**. La sua «interfaccia» è la *View* — moduli HTML per esseri umani — e il controller è accoppiato a quei moduli. Ogni richiesta è un POST di campi di modulo piatti a `controller.pl?action=Part/save`, che Kivitendo riassembla in un'unica struttura globale, `$::form`.

Una scrittura lì segue il pattern **carica → sovrapponi → salva**, sempre sull'*intero* oggetto. Ciò ha una conseguenza insidiosa: gli scalari vengono conservati se omessi — ma **le collezioni (prezzi, fornitori) sono elimina-e-riscrivi**. Invia un sottoinsieme, e perdi il resto. Non puoi quindi «cambiare semplicemente un campo» senza aver prima caricato lo stato completo.

Come si collega un sistema moderno a tutto questo? Non ricostruendo la logica di Kivitendo, ma con un sottile **livello di traduzione** — un servizio Node che imita un browser. Il suo unico flusso: `ricevi → carica (SELECT) → mappa verso l'interno → unisci → invia come POST $::form → mappa verso l'esterno → restituisci`. Il livello **non scrive mai SQL** in proprio; la scrittura avviene esclusivamente attraverso il controller di Kivitendo, così che la sua validazione, la sua cronologia e la sua transazione restino in un solo *unico* punto. Il principio guida: **la logica di business vive in Kivitendo — noi siamo un traduttore, non un secondo cervello.**

La parte elegante: le mappature necessarie per ogni entità (quale campo esterno si chiama come internamente, quali chiavi di modulo, quali variabili personalizzate) vengono **generate da piccoli LLM locali** — estratte dall'ORM Perl e dai controller di Kivitendo, verificate con round-trip contro un POST di modulo *reale e catturato*. Una mappatura è corretta se e solo se riproduce, parametro per parametro, un POST che Kivitendo ha accettato. Nulla è indovinato. Questo pezzo è ancora sperimentale (l'entità `Part` regge; non è ancora stata irrobustita contro un'istanza live), ma il percorso è chiaro: un contratto pulito e versionato all'esterno, la verità immutata di Kivitendo all'interno.

L'avvertenza onesta: molto di tutto ciò è *dedotto* da poche catture e dalla lettura del sorgente, non *osservato* in condizioni controllate. La cosa meno confermata è, guarda caso, la più importante — come Kivitendo segnala il successo rispetto al fallimento (un reindirizzamento che porta `&id=…` rispetto a una risposta 200 con un corpo d'errore). Questo va verificato per primo contro un'istanza in funzione. Un'architettura onesta dichiara le proprie assunzioni aperte.

## Il tassello mancante: magazzino e logistica

E qui arriva la parte che non è ancora finita — nominata di proposito, perché è il lavoro pianificato per completare il prodotto.

![Il centro mancante: l'accettazione oggi registra un singolo dispositivo con un numero d'inventario e un puntatore a ubicazione e scatola; tra questa e i magazzini, i livelli di giacenza e il registro dei movimenti già pronti di Kivvi manca la gestione di magazzino e logistica — movimenti di giacenza reali, prelievo, multi-magazzino, trasferimenti.](/blog/geraete-eingang-lager.svg)

Oggi l'accettazione dei dispositivi è in sostanza un **registro di singoli pezzi con checklist QC e un puntatore "dove si trova"**. C'è una tabella snella `storage_locations` (nome, tipo: magazzino principale / negozio / magazzino secondario / possesso del socio / …), e la voce d'inventario porta uno `storage_location_id`, un `box_id` libero e un campo `location` di tipo legacy. Ciò risponde alla domanda: *«quale scaffale contiene questo singolo dispositivo?»*

Ciò che **manca** è tutto ciò che va oltre — e questo, onestamente, è la vera *gestione* di magazzino:

- **Nessun registro dei movimenti di giacenza.** I contatori `quantity_reserved`/`quantity_sold` esistono come colonne ma non vengono scritti da nessuna parte. Non ci sono registrazioni di entrata/uscita, nessuna cronologia dei movimenti.
- **Nessun multi-magazzino, nessun trasferimento.** Una lista piatta di ubicazioni, nessuna gerarchia, nessuna giacenza per magazzino.
- **Nessun prelievo, nessuna entrata merci, nessun rifornimento.** In breve: nessuna gestione di magazzino, solo un «dove si trova cosa».

La buona notizia: il punto di aggancio esiste già. **Kivvi porta esattamente le primitive di giacenza che ci mancano** — `warehouses`, `stockLevels` (giacenza per prodotto e magazzino) e un registro append-only `stockMovements` con quantità dotate di segno. Anche se a granularità **contabile**, non **operativa**: Kivvi conosce i magazzini come nome e indirizzo, ma nessuno scomparto, nessun percorso di prelievo, nessun corriere. Un futuro modulo di magazzino RevampIT ha quindi due opzioni pulite — o pilotare direttamente il `warehouseId` + `location` di Kivvi, oppure modellare da sé il livello operativo (scomparti, movimenti, prelievo) e mantenere Kivvi come *libro di riferimento delle giacenze* dietro di esso. Grazie ai webhook bidirezionali, entrambi i lati restano sincronizzati.

E Kivitendo? In linea di principio anche il magazzino potrebbe esservi rispecchiato — tramite lo stesso livello di traduzione abbozzato sopra. Kivitendo ha un concetto di magazzino/giacenza nel suo modello; un movimento di giacenza sarebbe allora un'ulteriore entità che prende lo stesso percorso: carica, unisci, invia come POST `$::form` al controller appropriato. Lo sforzo maggiore non risiede nel concetto ma nella cura — la giacenza è rilevante dal punto di vista contabile, e la semantica «le collezioni vengono sostituite» di Kivitendo richiede di inviare sempre lo stato completo. Per un libro di riferimento, esattamente questa prudenza è appropriata.

## Prospettiva

La registrazione è risolta: da una foto o da un nome scritto a mano nasce in pochi secondi un record pulito, categorizzato e illustrato — collocato in magazzino o pubblicato nel negozio, e sincronizzato verso Kivvi. La barriera che faceva sì che quasi nessuno registrasse è sparita.

Ciò che resta è il suo contraltare fisico: **sapere dove si trova ogni dispositivo, e registrare in modo pulito ogni movimento.** È questo il prossimo tassello — il ponte tra il nostro registro di singoli pezzi e il registro delle giacenze di Kivvi, e, dove serve, fino dentro Kivitendo. Quando sarà in piedi, il cerchio si chiude: dal gesto che registra un dispositivo fino allo scaffale da cui viene venduto — senza che nel mezzo qualcuno debba tenere un foglio di calcolo.
