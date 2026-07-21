---
title: "Pourquoi nous durcissons le déploiement auto-hébergé"
excerpt: "Coolify n'est pas la prochaine étape sensée. La meilleure étape, c'est un déploiement reproductible et vérifiable sur notre infrastructure Hetzner existante."
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

RevampIT tourne actuellement comme application auto-hébergée sur Hetzner à l'adresse `revampit.orangecat.ch`. Le domaine public `revamp-it.ch` pointe encore vers l'ancien site Joomla/Apache et n'est donc pas la cible de production de la nouvelle plateforme.

La question évidente était : avons-nous besoin de Coolify, Dokploy ou d'une autre couche Platform-as-a-Service ? Notre réponse pour l'instant est non. Non pas parce que ces outils sont mauvais, mais parce qu'ils ne résolvent pas le premier problème.

Le vrai problème est plus simple : un déploiement doit être reproductible, avoir un quality gate clair, revenir en arrière en cas d'erreur et rendre visible quelle version tourne actuellement. Ces propriétés, notre structure existante à base de Caddy, systemd et rsync peut les obtenir directement, sans poser une nouvelle control plane sur le même serveur de production.

C'est pourquoi nous durcissons d'abord le chemin existant. Le script de déploiement construit toujours un artefact standalone Next.js, le copie sur le serveur Hetzner et redémarre le service. La nouveauté, c'est qu'une version précédente est conservée avant l'activation. Si le service ne devient pas actif ou si `/api/health` ne renvoie pas un statut de succès, un retour en arrière automatique est déclenché.

Il existe en plus un point d'accès `/api/version`. Il affiche la version de l'application, le SHA Git et l'heure de build. C'est petit, mais important : l'exploitation et le monitoring ont besoin d'une réponse univoque à la question de ce qui tourne réellement en production.

Un détail était décisif : les fichiers d'exécution comme `.env` et `launch.sh` n'ont pas leur place dans le dépôt Git, mais doivent être présents dans chaque version activée. Le script de déploiement reprend donc ces fichiers localement sur le serveur, depuis le répertoire actuel de l'application, avant de démarrer une nouvelle version.

Meilisearch fait aussi à nouveau partie du tableau d'exploitation. L'application pouvait se rabattre sur la recherche SQL sans Meilisearch, mais `/api/health` était de ce fait seulement en état `degraded`. Sur le serveur Hetzner, Meilisearch tourne donc comme service Docker accessible uniquement en localhost, avec une clé locale au serveur.

Le workflow de déploiement GitHub reçoit par ailleurs un gate plus clair : le lint et le typecheck s'exécutent avant le déploiement en production. Le déploiement local par push reste pratique, mais ne doit pas être la seule source de vérité à long terme. L'état cible est : GitHub construit, vérifie et déploie ; les déploiements locaux restent un outil manuel pour les cas exceptionnels.

Ce qui pourra venir plus tard : si nous exploitons de nombreuses applications, environnements clients ou déploiements en libre-service, une control plane pourra devenir pertinente. Nous examinerons alors sobrement Coolify, Dokploy ou Kamal. D'ici là, la règle est : moins de plateforme, plus de discipline d'exploitation fiable.
