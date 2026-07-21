---
title: "Entrée des appareils : une photo au lieu de quinze minutes"
excerpt: "Enregistrer un appareil d'occasion, c'était autrefois un tableur, un export CSV et une chaîne de transmissions manuelles jusque dans Kivitendo — et pourtant la boutique n'affichait toujours rien. Comment nous en avons fait un flux qui met un appareil dans le système en quelques secondes, comment les systèmes se parlent via des API, et quelle brique manque encore."
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

Chaque appareil qui reçoit une seconde vie chez Revamp-IT doit d'abord entrer *dans le système*. Cela paraît anodin. Ça ne l'était pas. C'est précisément à cette étape discrète — l'enregistrement — que l'atelier a perdu le plus de temps pendant des années, et c'est là que la valeur ajoutée est la plus faible : un ordinateur portable ne s'améliore pas parce que quelqu'un tape ses caractéristiques. Cette histoire raconte comment nous avons transformé quinze minutes de travail manuel en une saisie qui prend quelques secondes — et ce qui se cache derrière, techniquement.

## Le problème : l'enregistrement était une corvée

Au commencement était un tableur. Pour enregistrer un appareil, on faisait ceci, dans l'ordre : **peser** l'appareil, prendre ses **dimensions** au mètre-ruban, faire une **photo**, puis **assembler à coups de recherches Google** les spécifications et un prix plausible — numéro de modèle, CPU, RAM, prix de vente, tout tapé à la main dans un tableur privé (copié-collé, la plupart du temps).

Ensuite commençait la chaîne de transmissions. Heinz fusionnait les différents tableaux en un **tableau maître** et l'exportait en **CSV**. Cem téléversait ce CSV dans **Kivitendo**, notre ERP basé sur Perl et notre livre de référence comptable. Et même là, l'appareil n'était visible nulle part : dans la boutique, il **n'apparaissait pas automatiquement** — c'était encore une étape séparée et manuelle.

![L'ancien flux d'enregistrement : peser, mesurer, photographier et chercher les specs sur Google alimentaient un tableur privé, que Heinz fusionnait en un tableau maître, exportait en CSV et transmettait à Cem, qui le téléversait dans Kivitendo ; rien n'apparaissait automatiquement dans la boutique — 5 à 15 minutes de pur travail manuel par appareil.](/blog/geraete-eingang-alt.svg)

Cinq à quinze minutes de pur travail manuel — **par appareil**, réparties sur plusieurs personnes. Le résultat était prévisible : en principe, toute l'équipe aurait dû faire l'enregistrement, mais seuls quelques-uns le faisaient. Non par mauvaise volonté, mais parce que la barrière était trop haute. Un processus que personne n'aime faire devient le goulet d'étranglement — et une pile d'appareils non enregistrés grandit dans l'entrepôt.

## La vision : ramener l'enregistrement pratiquement à zéro

L'objectif était volontairement radical : réduire de **99,9 %** le temps nécessaire pour faire entrer un produit dans le système. Pas « un peu plus vite », mais un tout autre ordre de grandeur.

Le raisonnement : la photo d'un appareil contient déjà presque tout ce que nous devons savoir — fabricant, modèle, souvent même l'état. Un nom écrit à la main (« Lenovo ThinkPad T450 i5 ») tout autant. Avec une IA qui transforme cette matière brute en champs structurés, et avec des systèmes soigneusement construits qui **se parlent via des API**, un seul geste devrait suffire : photographier ou taper — et l'appareil atterrit là où il doit être. Lié à un emplacement de stockage dans la base de données, ou publié directement comme annonce dans la boutique.

## Comment cela fonctionne aujourd'hui

![Le nouveau parcours : un nom, une photo, une phrase dictée ou une ligne CSV vont à l'extraction par IA (Qwen Vision, Groq, Whisper), qui renvoie des champs structurés avec catégorie et niveau de confiance ; une unique fonction createErfassungProduct écrit l'enregistrement et le route vers le stockage, le contrôle qualité ou la place de marché, tout en synchronisant en parallèle vers Kivvi.](/blog/geraete-eingang-neu.svg)

### Une entrée, quatre canaux

Le `Geräte-Eingang` (l'entrée des appareils, `erfassung` dans le code) présente une interface volontairement sobre avec quatre canaux de saisie : **texte**, **photo**, **fichier** (CSV/Excel) et **voix**. La décision de conception qui la sous-tend compte — ce sont des *canaux*, pas quatre workflows distincts. Quelle que soit la manière dont les données arrivent, elles convergent vers le même enregistrement produit.

Le canal texte est astucieux : il détecte automatiquement si une ligne correspond à un seul appareil ou à une liste entière. Une ligne va vers `/api/admin/erfassung/text`, plusieurs lignes vers `/api/admin/erfassung/bulk-text` — on peut donc coller d'un coup toute une palette d'appareils et récupérer un tableau de vérification groupé. Les fichiers CSV et Excel passent par `bulk-upload`, la voix par `voice`.

### La cascade d'IA

Le cœur se trouve dans `src/lib/erfassung/ai-extraction.ts`. `extractProductFromText` envoie le texte à travers une **cascade de repli** de trois fournisseurs (`callWithFallback`) : **Groq** d'abord (`llama-3.3-70b-versatile`), puis **OpenRouter**, puis un **Ollama** local. Si tout échoue, un analyseur regex (`fastParseProductText`) sert de dernier filet — l'enregistrement n'échoue jamais complètement, il devient seulement moins précis.

Pour les photos, c'est `extractProductFromImage` qui prend le relais. Une petite histoire venue de la salle des machines mérite d'être racontée ici : Groq a retiré son ancien modèle de vision (Llama 4 Scout) — les requêtes revenaient soudain en `404 model_not_found`, et l'analyse de photos était morte en production. Le remplaçant aujourd'hui est **`qwen/qwen3.6-27b`**, le seul modèle Groq capable de traiter les images actuellement disponible. Mais Qwen3 est un modèle de *raisonnement* : il réfléchit à voix haute dans un bloc `<think>…</think>` avant de répondre. Un analyseur naïf du type « prends le premier `{…}` » pêchait aussitôt un JSON d'exemple dans ce bloc de réflexion et échouait. Le correctif est une petite fonction sans éclat, `extractJsonObject`, qui retire les blocs de raisonnement et les délimiteurs de code `json` avant que le JSON ne soit lu. La voix, quant à elle, est transcrite avec le `whisper-large-v3-turbo` de Groq puis passe par la même extraction de texte.

Deux choses rendent le résultat utilisable plutôt que simplement impressionnant. Premièrement, la **confiance par champ** : chaque champ extrait porte un niveau de certitude ; le formulaire de vérification met en évidence uniquement les champs qui nécessitent réellement un second regard (un état que le texte n'a jamais mentionné, par exemple), au lieu de tapisser chaque valeur d'un pourcentage. Deuxièmement, la **catégorisation** : `detectCategory` est une table de motifs ordonnée qui se projette sur les codes de catégorie existants. L'ordre est intentionnel — les motifs des accessoires, imprimantes, moniteurs et réseau correspondent *avant* les marques d'ordinateurs portables, et les composants internes *en dernier*, de sorte qu'un nom d'appareil l'emporte toujours. Ainsi « Dockingstation Lenovo ThinkPad » est correctement classée en *Réseau* et non comme un ordinateur portable.

Dans l'interface, cela donne ceci : on tape une phrase, et quelques secondes plus tard un formulaire rempli apparaît — fabricant, modèle, une courte description rédigée, la catégorie. Un seul champ ici porte une petite indication orange « Prüfen » (vérifier) : l'*état*, parce que le texte n'en a jamais nommé un. Tout le reste est silencieux. C'est là le point crucial — l'IA ne crie pas « sûr à 95 % » dans chaque ligne, elle pointe discrètement la seule chose qu'un humain devrait confirmer.

![L'étape de vérification dans l'interface : à partir de la phrase tapée, l'IA a rempli un formulaire propre — fabricant Lenovo, modèle ThinkPad T480, catégorie Laptops, une description rédigée, état Bon. Seul le champ état porte une indication orange « vérifier », car le texte n'a jamais nommé d'état.](/blog/geraete-eingang-review.svg)

### Une source unique de vérité pour les écritures

Aussi différents que soient les canaux, l'écriture se fait à un seul et unique endroit : `createErfassungProduct()` dans `src/lib/erfassung/create-product.ts`. Cette fonction est la *source unique de vérité* pour « un appareil naît ». En une seule transaction, elle attribue un numéro d'article lisible par un humain (`I-YYMMDD-NNNN`), écrit l'enregistrement d'extraction (`ai_extracted_products`), crée l'entrée d'inventaire (`inventory_items`, avec emplacement, boîte et quantité), lie les profils clients, téléverse l'image vers **R2** (stockage objet) et l'associe — et publie éventuellement une annonce dans la foulée.

Parce que tout passe par cette unique fonction, les mêmes invariants s'appliquent partout. C'est aussi la raison pour laquelle nous avons pu plus tard migrer **197 produits de l'ancienne boutique Shopware** en une seule passe (voir plus bas) : l'import appelle exactement `createErfassungProduct`, au lieu d'inventer une seconde manière d'écrire, subtilement différente.

### Le portail qualité

Après la vérification vient la seule véritable décision opérationnelle : *où ensuite ?* Les `CAPTURE_DESTINATIONS` — qualité, inventaire, pièces, recyclage ou « boutique non testé » — se projettent sur des niveaux (tiers) d'enregistrement. Un appareil d'une catégorie soumise à contrôle que l'on veut publier directement est intercepté par un portail de sécurité et atterrit à la place comme brouillon dans le pipeline de reconditionnement avec une checklist de contrôle qualité — sauf si quelqu'un prend une décision explicitement consignée de « publier sans contrôle ». Le fait qu'une catégorie soit soumise à contrôle n'est pas maintenu séparément mais *dérivé de la checklist elle-même* : soumis à contrôle signifie qu'il existe un point de test ou de sécurité obligatoire pour cette classe d'appareils.

### Vers la place de marché

Lorsqu'un appareil est publié, `publishRevampitListing` en fait une annonce active (drapeau `is_revampit`), reprend l'image R2 dans les images de l'annonce et indexe l'entrée dans **Meilisearch** pour la recherche. Le passage de « enregistré » à « visible dans la boutique » est ainsi un appel d'API, pas une deuxième personne avec un deuxième formulaire.

### Le test de résistance : 197 produits de l'ancienne boutique

La meilleure confirmation que le flux tient a été la migration du catalogue. L'ancienne boutique Shopware n'avait pas d'API utilisable — mais des métadonnées Open Graph propres pour chaque page produit. Un petit scraper a parcouru la liste `/Alles/`, a extrait nom, marque, prix, description et URL d'image, et un endpoint de migration ponctuel a créé **chacun des 197 produits comme brouillon** — via `createErfassungProduct`, avec l'image téléchargée côté serveur et ré-hébergée vers R2. Les catégories ont été déduites via `detectCategory`, les doublons évités grâce au numéro Shopware enregistré (idempotent, répétable à volonté). Ce qui aurait pris des jours à la main a été l'affaire de quelques minutes.

Et parce que la migration passait par la même fonction que n'importe quel enregistrement unitaire, les brouillons ont ensuite pu être publiés en une seconde passe — chacun devient une annonce active, l'image R2 voyageant automatiquement avec. **11 annonces visibles sont devenues 208**, chacune avec image, prix et catégorie. L'ancienne boutique n'a pas simplement été recopiée, elle a été *transférée*.

![La place de marché après la migration : 11 annonces sont devenues 208 offres actives — chaque carte avec image produit, titre, prix et badge d'état, alimentée depuis l'ancien catalogue Shopware.](/blog/geraete-eingang-marktplatz.svg)

## Trois principes qui portent le tout

Avant d'en venir aux systèmes voisins, il vaut la peine de regarder trois décisions qui font la différence entre « fonctionne dans la démo » et « tient en production » — et qui reviennent partout dans le code.

**Une source unique de vérité pour les écritures.** Que ce soit photo, voix, CSV, enregistrement unitaire ou migration de masse : l'écriture se fait exclusivement à travers `createErfassungProduct`. Il y aurait eu mille tentations de construire « rapidement un deuxième chemin légèrement différent » pour la migration. C'est précisément ce que nous n'avons *pas* fait — et c'est pourquoi les numéros d'article, la gestion des images, le portail QC et les invariants d'inventaire s'appliquent de la même façon à tous les chemins. Un bug se corrige à un seul endroit, pas à cinq.

**La certitude, pas les pourcentages.** L'IA fournit un niveau de confiance pour chaque champ — mais l'écran n'affiche aucun pourcentage. Il affiche une indication « vérifier » uniquement là où la certitude passe sous un seuil. Un nombre comme « 73 % » n'est pas une consigne d'action pour la personne à l'établi ; « regarde ici à nouveau » en est une. Une bonne automatisation réduit les décisions, elle ne les multiplie pas.

**L'idempotence partout où ça sort.** Chaque synchronisation vers Kivvi porte une clé d'idempotence ; chaque enregistrement migré porte son numéro Shopware ; chaque passe de publication saute ce qui a déjà une annonce. Cela ressemble à des détails, mais c'est la raison pour laquelle nous pouvons répéter migrations, synchronisations et réindexations *à volonté*, sans doublons ni crainte. La répétabilité n'est pas un luxe — c'est la condition pour pouvoir réparer un système en cours de fonctionnement.

## Des systèmes qui se parlent

L'enregistrement n'est que la moitié du travail. Un appareil doit aussi arriver là où vivent le stock et la comptabilité. Et c'est là que cela devient architecturalement intéressant, parce que deux mondes très différents en dépendent.

![Architecture d'intégration : l'entrée des appareils écrit localement inventory_items et synchronise vers le haut vers Kivvi via son API REST prête à l'emploi avec un jeton bearer et une clé d'idempotence, et reçoit en retour des webhooks de statut ; le chemin vers le Kivitendo hérité en Perl passe par une couche de traduction Node séparée qui imite un navigateur.](/blog/geraete-eingang-integration.svg)

### Kivvi : une membrane propre

**Kivvi** est l'ERP cloud suisse et moderne (TypeScript, Drizzle/Postgres) vers lequel nous synchronisons les appareils. Il nous facilite la tâche parce qu'il offre exactement ce dont un partenaire d'intégration a besoin : une API REST versionnée sous `/api/v1/`. Notre `syncToKivvi` (`src/lib/kivvi/client.ts`) fait un `POST /api/v1/inventory-items` avec un jeton bearer (`kv_…`) conservé côté serveur sous forme de hachage SHA-256.

Trois propriétés sont ici décisives — et dans le code de Kivvi elles sont même nommées explicitement pour Revamp-IT :

- **Idempotence.** L'appel porte une `Idempotency-Key` ; un double envoi ne crée pas de doublon. C'est précisément pour cela que nous pouvons réessayer sans souci.
- **Non bloquant, après le commit.** La synchronisation est de type « fire-and-forget » : elle démarre *après* la transaction de base de données de l'enregistrement et ne bloque jamais la saisie. Ensuite, nous réécrivons `kivvi_inventory_item_id` et `kivvi_sync_status` sur l'entrée d'inventaire. Si Kivvi n'est pas configuré (pas de `KIVVI_API_URL`), le client renvoie proprement `{ success: false }` au lieu de lever une exception — en dev, tout simplement pas de synchronisation.
- **Bidirectionnel.** Kivvi renvoie des webhooks signés (`inventory_item.status_changed`, etc.). Lorsqu'un appareil y est vendu, nous l'apprenons — sans interrogation périodique.

Une petite mais importante étape de traduction : le vocabulaire d'état de RevampIT est mappé sur l'enum de Kivvi (`new → like_new`, `defect → parts_only`, inconnu → `untested`). Sans ce mappage, la validation de Kivvi rejette l'enregistrement avec un HTTP 400. De petits contrats, tenus clairement.

### Kivitendo : un traducteur, pas un second cerveau

L'autre voisin est **Kivitendo** — un ERP MVC en Perl, notre livre de référence conforme à la loi, que nous conservons *délibérément*. Le hic : Kivitendo n'a **pas d'API**. Son « interface » est la *Vue* — des formulaires HTML pour les humains —, et le contrôleur est couplé à ces formulaires. Chaque requête est un POST de champs de formulaire plats vers `controller.pl?action=Part/save`, que Kivitendo réassemble en une structure globale, `$::form`.

Une écriture y suit le schéma **charger → superposer → enregistrer**, toujours sur l'objet *entier*. Cela a une conséquence perfide : les scalaires sont conservés lorsqu'on les omet — mais **les collections (prix, fournisseurs) sont supprimées-et-réécrites**. Envoyez un sous-ensemble, et vous perdez le reste. On ne peut donc pas « juste changer un champ » sans avoir d'abord chargé l'état complet.

Comment relie-t-on un système moderne à cela ? Non pas en reconstruisant la logique de Kivitendo, mais avec une fine **couche de traduction** — un service Node qui imite un navigateur. Son unique flux : `recevoir → charger (SELECT) → mapper vers l'intérieur → fusionner → envoyer comme POST $::form → mapper vers l'extérieur → renvoyer`. La couche **n'écrit jamais de SQL** elle-même ; l'écriture se fait exclusivement à travers le contrôleur propre de Kivitendo, afin que sa validation, son historique et sa transaction restent à un seul et *unique* endroit. Le principe directeur : **la logique métier vit dans Kivitendo — nous sommes un traducteur, pas un second cerveau.**

Le point élégant : les mappages nécessaires par entité (quel champ externe s'appelle comment en interne, quelles clés de formulaire, quelles variables personnalisées) sont **générés par de petits LLM locaux** — extraits de l'ORM et des contrôleurs Perl de Kivitendo, vérifiés par aller-retour contre un POST de formulaire *réel, capturé*. Un mappage est correct si et seulement s'il reproduit, paramètre par paramètre, un POST que Kivitendo a accepté. Rien n'est deviné. Cette pièce est encore expérimentale (l'entité `Part` tient ; elle n'a pas encore été durcie contre une instance en direct), mais la voie est claire : un contrat propre et versionné à l'extérieur, la vérité inchangée de Kivitendo à l'intérieur.

La réserve honnête : une grande partie de tout cela est *déduite* de quelques captures et de la lecture du code source, pas *observée* dans des conditions contrôlées. Ce qui est le moins confirmé est justement le plus important — comment Kivitendo signale le succès par rapport à l'échec (une redirection portant `&id=…` contre une réponse 200 avec un corps d'erreur). Cela devrait être vérifié en premier contre une instance en fonctionnement. Une architecture honnête nomme ses hypothèses ouvertes.

## La brique manquante : stockage et logistique

Et voici la partie qui n'est pas encore terminée — nommée à dessein, parce que c'est le travail prévu pour parachever le produit.

![Le milieu manquant : l'enregistrement aujourd'hui inscrit un appareil unique avec un numéro d'article et un pointeur vers l'emplacement et la boîte ; entre lui et les entrepôts, niveaux de stock et registre de mouvements prêts à l'emploi de Kivvi se trouve la gestion de stockage et de logistique absente — véritables mouvements de stock, préparation de commandes, multi-entrepôts, transferts.](/blog/geraete-eingang-lager.svg)

Aujourd'hui, l'entrée des appareils est essentiellement un **registre d'unités individuelles avec une checklist QC et un pointeur « où est-il »**. Il existe une table épurée `storage_locations` (nom, type : stockage principal / boutique / stockage secondaire / possession de membre / …), et l'entrée d'inventaire porte un `storage_location_id`, un `box_id` libre et un champ hérité `location`. Cela répond à : *« quelle étagère contient ce seul appareil ? »*

Ce qui **manque**, c'est tout ce qui va au-delà — et c'est, honnêtement, la véritable *gestion* de stock :

- **Aucun registre de mouvements de stock.** Les compteurs `quantity_reserved`/`quantity_sold` existent comme colonnes mais ne sont écrits nulle part. Il n'y a pas d'écritures d'entrée/sortie, pas d'historique de mouvements.
- **Pas de multi-entrepôts, pas de transferts.** Une liste d'emplacements plate, aucune hiérarchie, aucun stock par entrepôt.
- **Pas de préparation de commandes, pas de réception de marchandises, pas de réapprovisionnement.** Bref : pas de gestion d'entrepôt, juste un « où est quoi ».

La bonne nouvelle : le point d'accostage existe déjà. **Kivvi apporte précisément les primitives de stock qui nous manquent** — `warehouses`, `stockLevels` (stock par produit et par entrepôt) et un registre `stockMovements` en append-only avec des quantités signées. Mais à une granularité **comptable**, pas **opérationnelle** : Kivvi connaît les entrepôts comme un nom et une adresse, mais pas de casiers, pas de routes de prélèvement, pas de transporteur. Un futur module de stockage RevampIT a donc deux options propres — soit piloter directement le `warehouseId` + `location` de Kivvi, soit modéliser lui-même la couche opérationnelle (casiers, mouvements, préparation de commandes) et faire tourner Kivvi comme le *livre de référence du stock* derrière. Grâce aux webhooks bidirectionnels, les deux côtés restent synchronisés.

Et Kivitendo ? En principe, le stock pourrait y être reflété aussi — via la même couche de traduction esquissée plus haut. Kivitendo possède un concept d'entrepôt/stock dans son modèle ; un mouvement de stock serait alors une entité de plus empruntant le même chemin : charger, fusionner, envoyer comme POST `$::form` au contrôleur approprié. Le plus gros effort ne réside pas dans le concept mais dans le soin — le stock est pertinent sur le plan comptable, et la sémantique « les collections sont remplacées » de Kivitendo exige que l'on envoie toujours l'état complet. Pour un livre de référence, c'est exactement cette prudence qui s'impose.

## Perspectives

L'enregistrement est résolu : à partir d'une photo ou d'un nom écrit à la main apparaît en quelques secondes un enregistrement propre, catégorisé, illustré — localisé dans le stockage ou publié dans la boutique, et synchronisé vers Kivvi. La barrière qui faisait que presque personne n'enregistrait a disparu.

Ce qui reste, c'est son pendant physique : **savoir où se trouve chaque appareil, et comptabiliser chaque mouvement proprement.** C'est la prochaine brique — le pont entre notre registre d'unités individuelles et le registre de stock de Kivvi, et, là où c'est nécessaire, jusque dans Kivitendo. Une fois qu'elle sera en place, la boucle se referme : du geste qui enregistre un appareil jusqu'à l'étagère depuis laquelle il est vendu — sans que quiconque ait à tenir un tableur entre les deux.
