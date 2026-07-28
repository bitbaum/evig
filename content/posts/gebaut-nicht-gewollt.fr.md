---
title: "Construite, pas voulue : la plateforme avec laquelle evig poursuit son chemin de façon indépendante"
excerpt: "J'ai construit une plateforme qui automatise tout le parcours, de l'appareil ancien donné jusqu'à sa nouvelle propriétaire. Revamp-IT n'a pas voulu emprunter ce chemin et reste sur trois anciens systèmes séparés. Voici la comparaison honnête — ce qui était, ce que j'ai construit, et où cela va."
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

J'ai construit une plateforme qui unifie et automatise tout — de l'appareil ancien donné, en passant par le contrôle qualité, jusqu'à la vitrine publique, ainsi que toute l'exploitation interne. Revamp-IT a décidé de ne pas emprunter ce chemin et reste sur les systèmes existants : un site Joomla, une boutique Shopware séparée, et Kivitendo, un ERP écrit en Perl sans véritable interface. C'est la décision de l'association. Je suis convaincu que la voie automatisée est la meilleure — et je la poursuis de façon indépendante avec **evig**.

Ce billet est la comparaison honnête. Non pas une attaque, mais une mise en parallèle : **ce qui était**, **ce que j'ai construit** et **où cela va.**

## Ce qui était : trois systèmes qui se taisent

Au fil des années, trois anciens systèmes séparés avaient poussé chez Revamp-IT, chacun avec sa propre finalité et ses propres données :

- Le **site Joomla** sur `revamp-it.ch` — le visage public, mais statique et coupé du reste.
- La **boutique Shopware** sur `shop.revamp-it.ch` — la vente d'appareils reconditionnés, un univers à part entière.
- L'**ERP Kivitendo** — comptabilité et stock, écrit en Perl, cloisonné et sans API utilisable.

Ces trois-là ne se parlaient pas. Un appareil enregistré, contrôlé, stocké puis vendu devait être ressaisi à la main à chaque étape. Les données passaient d'un silo à l'autre par recopie — avec toutes les erreurs qu'entraîne un transfert manuel. Et comme Kivitendo n'a pas de véritable interface, chaque tentative d'automatisation se heurte au même mur : on cherche une API qui n'existe tout simplement pas, ou l'on imite péniblement un navigateur juste pour parvenir à faire entrer et sortir des données.

Réparer n'a jamais été le problème. L'organisation derrière l'était.

## Ce que j'ai construit : une plateforme, publique et interne à la fois

Au lieu de continuer à maintenir trois anciens systèmes collés au ruban adhésif, j'ai construit une seule plateforme cohérente. Elle couvre les deux mondes — le **côté public**, où la communauté parcourt, achète et cherche de l'aide, et le **côté interne**, où les appareils sont enregistrés, contrôlés et publiés, le temps saisi et l'exploitation coordonnée. Les deux partagent la même base de données. Un appareil est enregistré **une seule fois** et voyage de là automatiquement jusqu'à la vitrine.

![Place de marché avec filtres, barre CO₂ et annonces](/blog/showcase-revampit-marketplace.png)
*La place de marché : appareils reconditionnés et annonces privées dans une seule vitrine, avec des filtres et une barre CO₂ transparente.*

- **Place de marché** — appareils reconditionnés et commerce privé de pair à pair en un seul endroit. Un panier, un paiement, réglé via Payrexx avec une fonction de séquestre.
- **Aide informatique** — un réseau à deux faces qui relie les besoins de réparation aux techniciennes et techniciens. Chaque réparation, c'est un appareil de moins au rebut.
- **Prestations** — «Construis ton ordinateur», installation et conseil Linux, recyclage dans les règles de l'art.
- **Réception des appareils** — l'enregistrement assisté par IA capte les photos et les données clés et propose une catégorie et des données ; les catégories soumises à contrôle passent par un contrôle qualité structuré avec liste de vérification et principe des quatre yeux ; enregistrement en masse et import CSV pour les quantités.
- **Saisie des temps, équipes et Hirn** — solde, rapport et circuit de validation pour l'exploitation ; une structure d'équipe qui montre qui travaille sur quoi ; et «Hirn», un assistant IA fondé sur RAG qui répond à partir du savoir propre de l'organisation.
- **Impact CO₂** — chaque chiffre avec sa dérivation divulguée (facteurs ADEME, recoupés avec Fraunhofer et la ZHAW), sur une page de transparence dédiée. Prouvé, pas affirmé.

![Méthodologie CO₂ sur la page de transparence](/blog/showcase-revampit-co2.png)
*Chaque donnée CO₂ est liée à une source ouverte et le calcul est public — vérifiable plutôt que du greenwashing.*

## La comparaison directe

| | Avant (Revamp-IT, anciens systèmes) | Maintenant (la plateforme) |
|---|---|---|
| **Systèmes** | 3 séparés (Joomla, Shopware, Kivitendo) | 1 application cohérente |
| **Saisie des données** | à la main à chaque étape | saisie une fois, transmise automatiquement |
| **Connexion ERP** | Kivitendo (Perl), pas de véritable API | Kivvi avec synchronisation via API REST (`syncToKivvi`) |
| **Vente & P2P** | séparés, voire inexistants | une place de marché, un paiement |
| **Recherche** | aucune transversale | Meilisearch sur tout le stock |
| **Durabilité** | affirmation | chaque chiffre avec une source ouverte |
| **Langues** | pour l'essentiel une | 8 |
| **Interne (temps, équipes, savoir)** | dispersé / manuel | dans la plateforme, avec assistant IA |

Plus important que chaque technologie prise isolément, c'est le principe qui la sous-tend : **une source unique de vérité** pour chaque information. Précisément ce qui manquait aux trois anciens systèmes.

## L'ordre de grandeur

De «trois systèmes qui se taisent» est née une plateforme d'une profondeur considérable (état juillet 2026) :

| Indicateur | Valeur |
|---|---|
| Points d'accès API | plus de 300 |
| Pages | plus de 220 |
| Modules d'administration | 33 |
| Tables de base de données | environ 130 |
| Langues | 8 |
| Commits | plus de 2'300 |

Sous le capot : **Next.js 16** avec **TypeScript**, les données dans **PostgreSQL** via l'ORM **Drizzle** (types dérivés directement du schéma), connexion avec **NextAuth v5**, recherche avec **Meilisearch**, paiements via **Payrexx**, images sur **Cloudflare R2**. Une pile moderne et choisie sciemment — pas un ERP en Perl sur lequel toute automatisation échoue.

## Où cela va

La plateforme n'est pas le but, mais le fondement. evig va un pas plus loin que l'économie circulaire — vers l'**accès à l'intelligence pour tous**. Voici la feuille de route :

- **Une IA abordable sur du matériel modeste.** Un ordinateur portable reconditionné n'est pas seulement le choix le plus vert, mais la rampe d'accès la moins chère qui soit à l'intelligence artificielle. Nous explorons et montrons comment une IA performante tourne sur des appareils de seconde vie.
- **La robotique comme étape suivante.** L'intelligence incarnée — des robots qui déchargent une vie d'un vrai travail et rendent du temps. Les humanoïdes ne se vendent guère neufs aujourd'hui et ne sont pas encore utilisés ; evig veut être le premier endroit à les proposer comme il faut : complets, contrôlés, justifiés pour un usage réel — et avec le savoir pour s'en servir.
- **De nouvelles manières de s'offrir l'intelligence.** À côté de l'achat direct : financement participatif par abonnement et financement communautaire, pools d'abonnements partagés (partager les coûts courants de l'IA au lieu de les porter seul), soutien direct sans intermédiaire.
- **Une recherche menée ouvertement.** evig ne se contente pas de vendre et de réparer — il enquête : IA abordable, robotique ouverte, réparation, souveraineté sur ses propres outils. Et il publie ce qu'il trouve. Le savoir en circulation, c'est la même idée que le matériel en circulation.

Voilà la différence entre «assez bon, comme c'était» et «aussi loin que cela peut aller». J'ai construit le fondement parce que je veux emprunter ce chemin — vite, de façon indépendante et au-delà de Zurich.

## Conclusion

Là où trois anciens systèmes tournaient côte à côte et où les données étaient portées à la main par-dessus les fossés se dresse aujourd'hui une plateforme cohérente et automatisée. Elle était là, fonctionnelle et vérifiable. Revamp-IT a choisi la voie connue — c'est son bon droit, et le travail qu'elle accomplit depuis 2003 reste précieux. J'ai choisi l'autre : tout unifier, automatiser autant que possible et orienter le fondement vers l'ère de l'intelligence.

evig continue de bâtir. Les mêmes racines, un objectif plus grand.
