---
title: "La seconde vie d'une tablette"
excerpt: "La plupart des tablettes « cassées » ne le sont pas du tout — c'est seulement leur logiciel qui a été abandonné. Pourquoi la réutilisation en vaut la peine, ce qu'une vieille tablette sait encore faire et quels systèmes d'exploitation open source lui offrent des années de vie."
author: "RevampIT Team"
category: "Nachhaltigkeit"
tags:
  - nachhaltigkeit
  - reparatur
  - open-source
  - tablets
  - e-waste
featuredImage: "/blog/tablets-hero.svg"
publishedAt: "2026-07-09"
published: true
---

C'est toujours la même histoire. Une tablette de cinq ans, écran intact, batterie qui tient encore la charge, finit dans un tiroir — ou pire, à la poubelle. La raison n'est presque jamais un défaut. Elle est : « Elle ne reçoit plus de mises à jour » ou « Une application ne fonctionne plus ». Ce ne sont pas des morts matérielles. Ce sont des morts artificielles, et on peut les inverser.

Chez RevampIT, nous voyons ces appareils tous les jours. Cet article montre pourquoi une vieille tablette vaut presque toujours plus que le prix de sa matière — techniquement, écologiquement et concrètement.

## Le problème en chiffres

En 2022, l'humanité a produit un record de **62 millions de tonnes** de déchets électroniques — de quoi remplir 1,55 million de camions de 40 tonnes, pare-chocs contre pare-chocs, une fois autour de l'équateur. Seuls **22,3 pour cent** ont été collectés et recyclés de manière documentée. Le reste a été brûlé, enfoui ou expédié hors de vue.

![Déchets électroniques mondiaux de 2010 à 2030 : 34, 62 et 82 millions de tonnes prévues — seuls 22,3 pour cent du volume de 2022 ont été recyclés.](/blog/tablets-ewaste.svg)

*La part verte montre la portion effectivement recyclée en 2022. La barre en pointillés est la prévision de l'ONU pour 2030. Source : UN Global E-waste Monitor 2024.*

Et l'écart se creuse : les déchets électroniques augmentent **cinq fois plus vite** que le recyclage documenté. Les tablettes se trouvent en plein dans la zone d'impact — légères, collées, scellées et déclarées « trop vieilles » en silence dès que le fabricant cesse les mises à jour.

## Pourquoi les tablettes « meurent » — et pourquoi c'est le plus souvent une excuse

Une tablette, c'est un écran, une batterie, un module radio et un system-on-chip. Rien de tout cela ne s'use en cinq ans dans un usage normal. Ce qui expire, c'est la **volonté du fabricant d'entretenir le logiciel** — et c'est un problème que le logiciel peut résoudre. Les suspects habituels :

- **Fin de vie logicielle.** Le fabricant cesse les mises à jour du système d'exploitation et de sécurité, souvent trois à cinq ans seulement après la vente. Les applications refusent alors de fonctionner sur l'ancienne version — alors que la puce suffit encore largement.
- **Bootloaders verrouillés.** L'appareil n'accepte que le firmware du fabricant (désormais figé). On ne peut pas le sauver soi-même.
- **Une batterie fatiguée.** Une cellule au lithium conserve encore environ 80 pour cent de sa capacité après quelque 800 cycles de charge. C'est une pièce de rechange à une quinzaine de francs, pas un appareil mort.
- **Mémoire pleine, peu de RAM.** Un système d'usine surchargé rampe — un Linux léger ou un Android allégé libère à nouveau des gigaoctets et des mégahertz.

> Le point essentiel : presque aucune tablette dans un tiroir n'est défectueuse. Elle a été abandonnée par son logiciel. C'est exactement là qu'interviennent la réparation et les systèmes d'exploitation libres.

## Le calcul du CO₂

Voici le chiffre qui renverse tout. Le rapport environnemental d'Apple pour l'iPad mini indique une empreinte de cycle de vie d'environ **95 kg CO₂e**. Sur ce total, **66 kg — soit environ 69 pour cent — reviennent à la période précédant même la première mise sous tension de l'appareil** : extraction, raffinage et fabrication. Les années d'utilisation ne représentent que 21 kg.

![Répartition de l'empreinte de 95 kg CO₂e d'un iPad mini : 66 kg fabrication, 21 kg utilisation, 6 kg transport, 2 kg recyclage.](/blog/tablets-co2.svg)

*Fabrication (orange) 66 kg · Utilisation (vert foncé) 21 kg · Transport (vert clair) 6 kg · Recyclage (gris) 2 kg. La plus grande partie des émissions est « grise » — fixée à l'usine. Source : Apple, rapport environnemental iPad mini.*

Ce rapport est tout l'argument en faveur de la réutilisation. Le recyclage récupère une fraction des matériaux — mais paie du même coup une seconde fois les émissions de fabrication de l'appareil de remplacement. **Garder un appareil en service est le geste climatique le plus efficace que l'on puisse poser avec lui.** Chaque année supplémentaire est une tablette qui n'est *pas* produite.

## Donne une nouvelle mission au vieil appareil

Toutes les tablettes n'ont pas besoin d'un changement complet de système d'exploitation pour rester utiles. Un appareil trop lent comme compagnon du quotidien est souvent parfait comme *appareil à usage unique* — vissé au mur, posé dans la cuisine ou intégré à la maison. Quelques rôles éprouvés :

- **Panneau mural domotique.** Monté près de la porte, comme tableau de bord permanent pour l'éclairage, le chauffage et les caméras (par exemple avec Home Assistant).
- **Cadre photo et cadre d'art numérique.** Une galerie tournante de photos de famille ou d'art génératif open source dans le couloir.
- **Appareil de cuisine et de lecture.** Un écran de recettes lavable et fixe, ou un liseur peu éblouissant pour les livres et les PDF.
- **Moniteur de sécurité et babyphone.** Caméra frontale plus application en font un moniteur Wi-Fi pour la porte, le garage ou la chambre d'enfant.
- **Commande de musique et d'audio.** Une télécommande fixe pour les haut-parleurs de la maison, ou un pupitre dédié au streaming et aux podcasts.
- **Appareil d'apprentissage et pour enfant.** Limité aux applications éducatives, sans comptes liés — un premier ordinateur à faible risque.

Beaucoup de ces rôles fonctionnent mieux sur un système d'exploitation libre et allégé. C'est justement de là que vient la vraie longévité. Alors libérons le logiciel.

## Libérer le logiciel : les systèmes d'exploitation open source

Quand le fabricant se retire, une communauté indépendante peut garder la tablette à jour et sécurisée pendant des années — souvent **plus sûre** que le système d'usine, car le pistage et le superflu disparaissent du même coup. Deux familles sont à connaître : les **ROM basées sur Android** conservent une compatibilité matérielle et logicielle complète et suppriment le verrouillage du fabricant. Les **véritables distributions Linux** vont plus loin et transforment la tablette en PC de poche — plus de liberté, plus d'efforts, un support matériel plus lacunaire.

| Système | Base | Idéal pour | Effort |
| --- | --- | --- | --- |
| **LineageOS** | Android · AOSP | Le support d'appareils le plus large, un quotidien fiable | Faible |
| **/e/OS** | Android · dégooglisé | La vie privée sans perte de confort | Faible |
| **postmarketOS** | Linux · Alpine | Vraie tablette Linux, durée de vie la plus longue | Élevé |
| **Ubuntu Touch** | Linux · UBports | Un Linux propre, proche du téléphone | Moyen |

**LineageOS** est la ROM Android la plus connue : elle redonne des années de mises à jour de sécurité à des centaines d'appareils et conserve une compatibilité applicative complète — le point d'entrée standard pour la plupart des tablettes. **/e/OS** est un dérivé entièrement dégooglisé avec son propre magasin d'applications et son propre cloud, idéal pour un appareil secondaire ou un appareil pour enfant. **postmarketOS** vise un **cycle de vie de dix ans** sur un noyau Linux mainline et démarre sur des centaines de modèles — mais le « support » va de pleinement fonctionnel à tout juste démarrable, alors vérifie d'abord ton appareil exact. **Ubuntu Touch** d'UBports offre une interface épurée, pilotée par les gestes, et est très stable sur les appareils pris en charge.

> **Deux réserves honnêtes.** Les iPad sont le cas difficile : le bootloader verrouillé d'Apple empêche en règle générale tout autre système d'exploitation — la meilleure seconde vie d'un vieil iPad est un appareil à usage unique sur sa dernière version d'iPadOS prise en charge, ou le don pour pièces détachées. Et **DivestOS**, autrefois une ROM durcie populaire pour les vieux appareils, a été **arrêté en décembre 2024** — si un ancien guide le recommande, tourne-toi plutôt vers LineageOS, GrapheneOS ou CalyxOS.

## Comment se déroule un reflashage

Installer son propre système d'exploitation suit presque le même déroulé sur toutes les tablettes Android. Cela coûte un après-midi, un câble USB et la volonté de lire attentivement la page wiki de l'appareil concerné. Les grandes étapes :

1. **Vérifier d'abord la compatibilité.** Cherche ton modèle exact dans le wiki des appareils du projet. S'il n'y figure pas comme pris en charge, arrête-toi ici — choisis un autre système ou un rôle à usage unique sans flash.
2. **Sauvegarder et déverrouiller le bootloader.** Copie tout ce qui est important depuis l'appareil. Active ensuite les options développeur, active le `déverrouillage OEM` et déverrouille via `fastboot`. Cela efface l'appareil — c'est voulu.
3. **Flasher un recovery personnalisé.** Installe un environnement de recovery comme `TWRP` ou le recovery de la ROM. C'est l'outil qui, ensuite, installe le nouveau système.
4. **Installer le système d'exploitation (Google optionnel, à omettre).** Installe le paquet de la ROM. Avec les ROM Android, tu peux utiliser microG à la place des services Google Play — plus léger et plus respectueux de la vie privée.
5. **Changer la batterie dans la foulée.** Si l'autonomie est faible, une cellule neuve est la mise à niveau la plus avantageuse qui soit. Apporte l'appareil au Repair Café s'il est collé — c'est justement pour ça que nous sommes là.

> **Un risque, par honnêteté :** flasher peut, dans de rares cas, rendre un appareil inutilisable (« bricker ») et fait tomber la plupart des garanties. Sur un appareil de cinq ans sans support, c'est le plus souvent un échange facile — mais si tu n'es pas sûr, fais-le avec quelqu'un qui l'a déjà fait. C'est précisément pour ça qu'il existe une communauté de réparation.

## Quand la réutilisation n'est plus possible

Si une tablette est vraiment en fin de vie, elle n'a malgré tout pas sa place à la poubelle : les batteries scellées sont un risque d'incendie, et les matériaux sont précieux. Apporte-la à RevampIT — nous la réparons pour quelqu'un qui en a besoin, en récupérons des pièces détachées ou la recyclons dans les règles de l'art, comme ne l'ont jamais été les 77,7 pour cent restants.

**Les ordinateurs d'occasion sont réparés et transmis — pas jetés.**

## Sources

- UNITAR & ITU — [Global E-waste Monitor 2024](https://ewastemonitor.info/the-global-e-waste-monitor-2024/) (62 Mt de volume, 22,3 % recyclés, croissance cinq fois plus rapide, 82 Mt d'ici 2030).
- Apple — [Rapport environnemental iPad mini](https://www.apple.com/environment/) (95 kg CO₂e sur le cycle de vie ; 66 kg soit 69 % issus des matériaux et de la fabrication).
- [LineageOS](https://lineageos.org/), [/e/OS](https://e.foundation/), [postmarketOS](https://postmarketos.org/), [Ubuntu Touch (UBports)](https://ubports.com/) — pages officielles des projets.
