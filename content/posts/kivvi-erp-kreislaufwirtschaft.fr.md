---
title: "Kivvi : l'ERP de l'économie circulaire"
excerpt: "Les ERP standard connaissent l'achat et les quantités — pas les dons ni les pièces uniques avec état et histoire. Kivvi est l'ERP ouvert conçu précisément pour cela."
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

Une camionnette s'arrête devant l'entrepôt. À l'arrière : 50 ordinateurs portables offerts par une entreprise qui a renouvelé son parc. Chaque appareil est une pièce unique — avec son propre état, sa propre histoire, son propre parcours à travers la réparation et la vente. Pour une structure de l'économie circulaire, c'est un mardi matin tout à fait ordinaire. Pour un ERP du commerce, c'est un problème qu'il n'essaie même pas de résoudre.

![Page d'accueil de Kivvi avec le slogan « Le système d'exploitation de l'économie circulaire »](/blog/showcase-kivvi-home.png)

*« 50 ordinateurs portables offerts ? Enregistrés en 30 secondes. » — Kivvi est conçu de fond en comble pour le quotidien des reconditionneurs et des brocantes.*

## Le problème : les ERP standard pensent en achat et en quantités

Chaque système de gestion des marchandises courant dans le monde part de la même hypothèse de base : tu achètes une certaine quantité d'articles identiques, tu les stockes, puis tu les revends. 200 unités de l'article no 4711, tous pareils, tous neufs. Le prix d'achat est connu, la marge est calculée, la quantité est la grandeur décisive.

Une structure de l'économie circulaire fonctionne exactement à l'inverse. La marchandise n'arrive pas comme une commande, mais comme un **don** ou comme une **reprise**. Elle n'est pas une quantité, mais une collection de **pièces uniques** — chacune avec son propre degré d'état, de « comme neuf » à « pour pièces détachées ». Chaque appareil a une **histoire de réparation** : ce qui a été testé, ce qui a été remplacé, qui a effacé les données. Et au bout du compte, ce qui compte n'est pas seulement le produit de la vente, mais aussi l'**impact** — combien d'appareils ont été sauvés de la décharge.

Ces différences ne sont pas cosmétiques. Elles touchent le cœur même du modèle de données. Un système qui traite la « quantité » comme grandeur centrale peut tout au plus accrocher un degré d'état sous forme de note textuelle quelque part — mais il ne peut ni filtrer, ni calculer, ni analyser selon ce critère. Un système qui comprend l'entrée de marchandises comme un achat avec facture n'a tout simplement pas de champ pour un don sans contrepartie, ni de modèle pour le reçu dont le donateur a besoin. La lacune ne peut pas être comblée par la configuration ; elle réside dans les hypothèses fondatrices.

Rien de tout cela n'entre dans les modèles de données de SAP, d'Odoo ou de l'une des nombreuses solutions pour PME. Ils ne connaissent pas de degré d'état, pas de reçu de don, pas de cycle de vie d'un appareil individuel. Quiconque dirige une entreprise de reconditionnement, une brocante ou un repair café n'avait donc jusqu'ici que deux options : le vénérable **Kivitendo** basé sur Perl avec son fardeau hérité — ou la fuite éternelle dans les **tableurs**, où chaque processus est reconstruit à la main et où les données pourrissent dans des dizaines de fichiers non reliés.

## Ce que Kivvi fait autrement

Kivvi renverse l'hypothèse de base. Ce n'est pas l'achat qui est au centre, mais la **provenance de la marchandise et l'objet individuel**. Don, état, parcours de réparation et impact ne sont pas des champs rajoutés après coup — ils sont le fondement du modèle de données.

![Connexion en écran partagé avec liste de fonctionnalités : saisie rapide par IA, articles individuels, reçus de don, factures QR, Open Source MIT](/blog/showcase-kivvi-login.png)

*Dès la connexion, Kivvi montre l'essentiel : saisie rapide par IA, gestion des articles individuels, reçus de don, factures QR suisses — et Open Source sous licence MIT.*

Le résultat est un système qui parle la langue de l'économie circulaire, au lieu de la comprimer dans un schéma étranger. Là où un ERP classique devrait d'abord être péniblement détourné — avec des champs supplémentaires, des contournements et des tableurs externes à côté —, chez Kivvi l'objet usagé et unique est le cas normal. Et il est conçu pour des structures concrètes, non pour le commerce générique.

![« Pour qui Kivvi est-il conçu ? » avec les publics cibles reconditionneurs informatiques, brocantes, repair cafés et boutiques vintage](/blog/showcase-kivvi-fuer-wen.png)

*Kivvi s'adresse aux reconditionneurs informatiques, aux brocantes, aux repair cafés et aux boutiques vintage — des structures qui travaillent avec de la marchandise usagée et unique.*

## Ce que les ERP standard ne peuvent pas faire — et Kivvi si

![Aperçu « Ce que les ERP standard ne peuvent pas faire »](/blog/showcase-kivvi-sec1.png)

*La lacune que Kivvi comble : tout ce qui touche à la marchandise offerte, individuelle et réparée.*

La meilleure façon de comprendre Kivvi est un tour d'horizon de ses domaines centraux — à chaque fois avec la question : que fait-il, et quel problème résout-il ?

### Réception des marchandises et dons

**Ce qu'il fait :** À la réception, chaque marchandise est enregistrée avec sa provenance (don ou reprise) et un **degré d'état**. Pour les dons, un **reçu de don** peut être établi directement.

**Le problème qu'il résout :** Le degré d'état est l'information de base dont tout dépend ensuite — prix, besoin de réparation, aptitude à la vente. Et le reçu de don, tout simplement non prévu dans les ERP standard, est un document dont les structures d'utilité publique ont besoin au quotidien.

### Cycle de vie de l'article individuel

**Ce qu'il fait :** Chaque appareil est un enregistrement propre qui traverse un cycle de vie défini : **intake → testing → repair → ready → listed → sold**. Le statut de chaque pièce est visible à tout moment.

**Le problème qu'il résout :** Au lieu d'une indication de quantité « 200 unités », la structure sait, pour chaque objet individuel, où il en est. Aucun appareil ne se perd dans le processus, aucune marchandise ne reste bloquée sans qu'on le remarque dans les limbes des tests.

### Réparations

**Ce qu'il fait :** Les ordres de réparation sont tenus par appareil — y compris le **bonus de réparation** et l'émission de **certificats d'effacement** pour la destruction des données conforme à la protection des données.

**Le problème qu'il résout :** L'histoire de réparation reste attachée à l'appareil et est traçable. Le certificat d'effacement n'est pas un « bon à avoir » lors de la vente de matériel informatique usagé, mais une question de confiance et de conformité.

### Vente

**Ce qu'il fait :** L'ensemble du processus de vente est représenté : **offre → commande → bon de livraison → facture → rappels**.

**Le problème qu'il résout :** De la première offre au dernier rappel de paiement, tout se déroule dans un seul système, sans rupture de support. Pas d'outil de facturation parallèle, pas de rappels tenus à la main.

![Aperçu « Ce que Kivvi peut faire »](/blog/showcase-kivvi-sec3.png)

*De l'entrée des marchandises à la comptabilité : Kivvi couvre toute la chaîne dans un seul système.*

### Comptabilité suisse

**Ce qu'il fait :** Kivvi apporte un **plan comptable PME complet avec 227 comptes**, un **journal inaltérable** et le traitement de la **TVA**.

**Le problème qu'il résout :** La comptabilité n'est pas un programme séparé vers lequel les données doivent être exportées, mais une partie intégrante de l'ERP. Le journal inaltérable garantit la sécurité de révision — une fois comptabilisé, cela reste comptabilisé.

### Banque

**Ce qu'il fait :** Kivvi importe les fichiers bancaires **CAMT.053/054** et rapproche automatiquement les paiements entrants des **factures QR**.

**Le problème qu'il résout :** Le rapprochement des paiements, sinon des heures de travail manuel, se fait automatiquement. Les factures payées sont reconnues, les postes ouverts restent ouverts — sans que personne ne compare ligne par ligne les relevés de compte avec les factures.

### Barre de commande IA

**Ce qu'il fait :** Une barre de commande assistée par IA comprend le langage naturel et l'exécute au moyen de **47 outils audités** — de la saisie rapide à l'analyse.

**Le problème qu'il résout :** « 50 ordinateurs portables offerts ? Enregistrés en 30 secondes. » — au lieu de cliquer chaque champ individuellement, on décrit la tâche, et Kivvi l'exécute. Parce que chacun des 47 outils est audité, chaque action reste traçable et contrôlée.

## Ouvert et connecté

Un ERP qui enferme ses données est un piège. Kivvi prend le chemin inverse et est conçu ouvert de fond en comble.

Il offre une **API REST ouverte (v1)** et des **webhooks signés**, par lesquels d'autres systèmes se connectent proprement et en toute sécurité. Pour le passage depuis un système hérité, il existe un **import CSV Kivitendo** — exactement l'interface qu'on souhaite, exactement au bon endroit : lors du passage de l'ancien monde Perl vers le nouveau.

Tout aussi importante est la licence. Kivvi est **Open Source sous licence MIT**. Cela signifie : **pas de dépendance à un fournisseur**, **hébergement autonome** sur sa propre infrastructure, et la certitude que les **données restent en Suisse**. Quiconque utilise Kivvi possède son système — et non l'inverse. Précisément pour les structures d'utilité publique qui travaillent avec des moyens limités et planifient à long terme, c'est décisif : il n'y a pas de coûts de licence qui explosent avec la croissance, ni de risque qu'un fournisseur arrête le produit et prenne les données en otage. Le code source est ouvert, les interfaces sont documentées, la structure reste capable d'agir.

## L'ordre de grandeur

Kivvi n'est pas un prototype, mais un système à part entière. Quelques chiffres pour situer :

| Indicateur | Valeur |
|---|---|
| Documentation | 133 pages |
| Tables de base de données | 50 |
| Modules de domaine | 63 |
| Outils IA | 47 |
| Commits | 616 |
| Licence | MIT |

## Sous le capot

Techniquement, Kivvi repose sur un fondement moderne et maintenable. Il est construit comme un **monorepo Next.js 14** en **TypeScript**, avec **PostgreSQL** comme base de données et **Drizzle** comme ORM. Pour tous les montants monétaires, **decimal.js** est utilisé — les erreurs d'arrondi sur les francs et les centimes sont ainsi exclues. Kivvi génère les factures QR suisses avec **SwissQRBill**, proprement conforme à la norme. Ce choix n'est pas une fin en soi : il fait que le système calcule correctement, reste maintenable et peut grandir avec la structure.

## Conclusion

Les ERP standard sont conçus pour un monde où la marchandise est achetée en quantités et vendue à l'identique. L'économie circulaire vit dans un autre monde — le monde du don, de la pièce unique avec état et histoire, de la réparation et de l'impact mesurable. Kivvi est le premier ERP qui ne traite pas ce monde comme un cas particulier, mais comme un point de départ.

Il est ouvert, il est suisse, il t'appartient. Qui veut savoir ce que cela fait trouvera Kivvi à l'adresse **kivvi.orangecat.ch**.
