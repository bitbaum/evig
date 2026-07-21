---
title: "Pourquoi la boutique, c'est le marché"
excerpt: "Chez Revamp-IT, « boutique » signifie désormais marché : un parcours d'achat rapide pour de l'électronique d'occasion de Revamp-IT et d'autres vendeuses et vendeurs."
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

La question de la boutique partait d'une fausse prémisse. Nous n'avons pas besoin d'une deuxième page de boutique qui, à côté du marché, explique où l'on peut acheter. Quand on clique sur « Boutique », on veut voir des produits, les comparer et arriver le plus vite possible à une décision d'achat. C'est pourquoi la boutique en ligne, c'est maintenant le marché.

Cela réduit la charge cognitive. Il y a un endroit canonique pour l'électronique d'occasion : `/marketplace`. Les anciennes URL `/shop` sont conservées sous forme de redirections, mais la nouvelle navigation, le sitemap, les suggestions du chatbot et les assistants internes pointent vers le marché. Les utilisatrices et utilisateurs atterrissent directement sur la recherche, les filtres et les annonces plutôt que sur un choix de canal.

Du point de vue business, c'est le bon comportement par défaut. Le marché peut réunir les annonces de Revamp-IT et celles d'autres vendeuses et vendeurs. Les offres de Revamp-IT sont marquées comme telles lorsqu'elles sont explicitement signalées ainsi ou lorsqu'elles proviennent d'une adresse du personnel sous `@revamp-it.ch` ou `@revampit.ch`. On obtient ainsi un marché mental simple : tout parcourir, reconnaître la source, acheter.

Du point de vue du design, la discipline est la même que pour nos autres interfaces durcies : pas de grandes cartes de contournement, pas de chemins secondaires équivalents, pas de textes de CTA flous. La première tâche, c'est acheter. Filtrer, chercher et les pages de détail doivent être rapides et demander peu d'explications.

Du point de vue de l'ingénierie, la décision supprime une bifurcation. `/shop`, `/shop/search`, `/shop/category/...` et `/shop/product/...` sont des entrées héritées vers le marché. Aucune ancienne page produit de la boutique n'est plus ajoutée au sitemap. Les assistants d'URL génèrent des URL de marché, afin que de nouveaux liens ne ressuscitent pas accidentellement l'ancienne architecture.

L'autre grande tâche des utilisateurs reste la réparation et l'aide informatique. Là, l'entrée canonique n'est pas un nouveau processus parallèle, mais `/it-hilfe/create` pour décrire un problème et `/it-hilfe/techniker` pour les techniciens et les ateliers. La demande reste dans le système ; le matching et le diagnostic peuvent s'appuyer dessus.

Comme Payrexx n'est pas encore configuré en production, la plateforme peut fonctionner jusqu'au clic de paiement, mais ne doit pas générer de faux paiements en production. Le paiement du marché, le paiement de rendez-vous et le paiement d'atelier s'arrêtent donc avec un message de configuration clair, avant de modifier l'inventaire, les rendez-vous ou les places. C'est plus honnête et plus sûr qu'un paiement de démonstration qui a l'air réel.
