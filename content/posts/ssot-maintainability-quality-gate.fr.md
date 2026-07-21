---
title: "SSOT : pourquoi nous rendons notre site plus facile à maintenir"
excerpt: "Nous avons continué à consolider les fondations techniques du site : moins de valeurs codées en dur, des responsabilités plus claires, de meilleurs contrôles et un processus de mise en production plus strict."
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

Un site durable n'est pas seulement un site qui parle de durabilité. Il doit aussi être conçu techniquement de manière à pouvoir être entretenu, étendu et vérifié longtemps. C'est précisément ce sur quoi nous avons continué à travailler.

Un principe était au centre : **Single Source of Truth**, en abrégé SSOT. Chaque information importante doit avoir exactement une source fiable. Les couleurs, les indicateurs de statut, les données de l'organisation, les textes, les structures de base de données et les processus qualité ne doivent pas être copiés à de nombreux endroits, avec de légères variations. Sinon, chaque modification devient plus risquée, plus lente et plus coûteuse.

## Ce que nous avons amélioré

Nous avons ajouté de nouveaux contrôles de conformité qui vérifient automatiquement si les règles centrales sont respectées. Cela inclut un audit SSOT et un audit i18n pour les traductions. Le contrôle SSOT empêche désormais, entre autres, que des tables de base de données soient créées dans les routes API ou que d'anciens schémas `hardcoded-content` réapparaissent.

Le processus de mise en production a lui aussi été renforcé. Au lieu d'ignorer les avertissements ou de ne vérifier qu'après le build, le parcours qualité se déroule maintenant de façon plus claire : TypeScript, linting, conformité, tests et build de production. Cela rend les erreurs visibles plus tôt et renforce la fiabilité avant les mises en production.

Dans le système de design, plusieurs valeurs de couleur codées en dur ont été déplacées vers des configurations d'interface centralisées. Les couleurs propres à l'application pour les images Open Graph, les surcouches de retour, les pages d'erreur, les formulaires de catégories, les fiches techniques, les motifs de hero et les profils clients se trouvent désormais à des endroits nommés. Cela réduit les dépendances cachées et rend les ajustements ultérieurs plus ciblés.

Un autre point concernait la séparation entre contenu et configuration. Un badge de service comme « Bientôt » n'a pas sa place directement dans une configuration technique de service, mais dans les traductions. Ces petits déplacements paient énormément en matière de maintenabilité sur le long terme.

## Pourquoi c'est important

Coder en dur est souvent pratique, mais cela crée de la dette. Une couleur ici, un texte allemand là, une classe de statut dans un fichier de domaine, une instruction de base de données dans une route API : chaque endroit paraît anodin pris isolément. Ensemble, ils mènent pourtant à un système difficile à comprendre et difficile à modifier en toute sécurité.

Le SSOT n'est donc pas une fin en soi. Il nous aide à travailler plus vite et plus précisément :

- Les modifications se font à un seul endroit plutôt qu'à plusieurs.
- Les décisions de design restent cohérentes.
- Les traductions deviennent mesurables.
- La structure de la base de données reste dans les migrations et les fichiers de schéma.
- Les revues peuvent se concentrer sur le comportement plutôt que sur du travail de recherche.

## Ce qui reste à faire

La direction est claire, mais le travail n'est pas terminé. La prochaine étape sera de réduire la dette de traduction existante. Le nouveau contrôle i18n empêche déjà de nouvelles clés manquantes, mais certaines lacunes existantes sont encore documentées comme baseline.

Par ailleurs, les configurations de domaine devraient être davantage séparées des textes d'interface. Des valeurs de statut comme `active`, `sold` ou `reserved` sont des données de domaine. Les libellés en allemand et la représentation visuelle devraient venir proprement des traductions et du mapping d'interface.

Le système de design mérite lui aussi une consolidation plus profonde. Il existe déjà de bons composants centraux, mais certaines anciennes couches de tokens se chevauchent. L'objectif est une architecture claire : tokens primitifs, tokens sémantiques, variantes de composants et mappings spécifiques à chaque domaine.

## Notre standard

La maintenabilité est pour nous un critère de qualité. Elle détermine si une plateforme ne fonctionne qu'aujourd'hui ou si elle pourra encore être développée en toute sécurité dans un an.

SSOT, séparation des responsabilités et code DRY ne sont pas pour cela des concepts abstraits. Ce sont des règles de travail concrètes : moins de copies, des limites plus claires, une meilleure automatisation et un système qui ne rend pas les changements inutilement difficiles.

C'est précisément ce que nous continuons à construire.
