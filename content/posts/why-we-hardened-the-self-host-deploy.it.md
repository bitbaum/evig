---
title: "Perché rafforziamo il deploy self-host"
excerpt: "Coolify non è il prossimo passo sensato. Il passo migliore è un deploy riproducibile e verificabile sulla nostra infrastruttura Hetzner esistente."
author: "RevampIT Team"
featuredImage: "/blog/deploy-hardening.svg"
category: "Technik"
tags:
  - devops
  - hetzner
  - deployment
  - monitoring
  - ssot
publishedAt: "2026-06-16"
published: true
---

RevampIT gira attualmente come app self-host su Hetzner all'indirizzo `revampit.orangecat.ch`. Il dominio pubblico `revamp-it.ch` punta ancora al vecchio sito Joomla/Apache e non è quindi il target di produzione della nuova piattaforma.

La domanda ovvia era: ci serve Coolify, Dokploy o un altro livello Platform-as-a-Service? La nostra risposta per ora è no. Non perché tali strumenti siano cattivi, ma perché non risolvono il primo problema.

Il vero problema è più semplice: un deploy deve essere riproducibile, avere un chiaro quality gate, tornare indietro in caso di errore e rendere visibile quale versione è attualmente in esecuzione. Queste proprietà la nostra struttura esistente basata su Caddy, systemd e rsync può ottenerle direttamente, senza mettere una nuova control plane sullo stesso server di produzione.

Per questo rafforziamo prima il percorso esistente. Lo script di deploy continua a costruire un artefatto standalone di Next.js, lo copia sul server Hetzner e riavvia il servizio. La novità è che prima dell'attivazione viene conservata una release precedente. Se il servizio non si attiva o `/api/health` non restituisce uno stato positivo, viene eseguito automaticamente il rollback.

In aggiunta c'è un endpoint `/api/version`. Mostra la versione dell'app, il Git-SHA e l'ora di build. È piccolo, ma importante: gli operatori e il monitoring hanno bisogno di una risposta univoca alla domanda su cosa sia realmente live.

Un dettaglio è stato decisivo: i file di runtime come `.env` e `launch.sh` non appartengono al repository Git, ma devono essere presenti in ogni release attivata. Per questo lo script di deploy preleva questi file localmente sul server dalla directory app corrente, prima di avviare una nuova release.

Anche Meilisearch fa di nuovo parte del quadro operativo. L'app poteva ripiegare senza Meilisearch sulla ricerca SQL, ma `/api/health` risultava così solo `degraded`. Sul server Hetzner Meilisearch gira quindi come servizio Docker solo su localhost con una chiave locale al server.

Il workflow di deploy su GitHub riceve inoltre un gate più chiaro: lint e typecheck vengono eseguiti prima del deploy di produzione. Il deploy locale via push resta pratico, ma non deve essere la verità unica di lungo periodo. Lo stato obiettivo è: GitHub costruisce, verifica e fa il deploy; i deploy locali restano uno strumento manuale per casi eccezionali.

Cosa può arrivare più avanti: se gestiremo molte app, ambienti clienti o deploy self-service, una control plane potrà avere senso. Allora valuteremo con lucidità Coolify, Dokploy o Kamal. Fino ad allora vale: meno piattaforma, più disciplina operativa affidabile.
