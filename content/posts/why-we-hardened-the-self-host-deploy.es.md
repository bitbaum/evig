---
title: "Por qué endurecemos el despliegue self-host"
excerpt: "Coolify no es el siguiente paso sensato. El paso mejor es un despliegue reproducible y verificable sobre nuestra infraestructura Hetzner existente."
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

RevampIT funciona actualmente como app self-host en Hetzner bajo `revampit.orangecat.ch`. El dominio público `revamp-it.ch` todavía apunta a la vieja página Joomla/Apache y por eso no es el objetivo de producción de la nueva plataforma.

La pregunta obvia era: ¿necesitamos Coolify, Dokploy u otra capa Platform-as-a-Service? Nuestra respuesta por ahora es no. No porque esas herramientas sean malas, sino porque no resuelven el primer problema.

El problema real es más simple: un despliegue debe ser reproducible, tener un quality gate claro, poder revertir en caso de error y hacer visible qué versión está corriendo. Estas propiedades puede obtenerlas directamente nuestra estructura existente de Caddy, systemd y rsync, sin poner un nuevo control plane sobre el mismo servidor de producción.

Por eso endurecemos primero el camino existente. El script de despliegue sigue construyendo un artefacto standalone de Next.js, lo copia al servidor Hetzner y reinicia el servicio. Lo nuevo es que, antes de activar, se conserva un release anterior. Si el servicio no se activa o `/api/health` no devuelve un estado correcto, se revierte automáticamente.

Además hay un endpoint `/api/version`. Muestra la versión de la app, el SHA de Git y la hora del build. Es pequeño, pero importante: la operación y el monitoreo necesitan una respuesta inequívoca a la pregunta de qué está realmente en producción.

Un detalle fue decisivo: los archivos de runtime como `.env` y `launch.sh` no pertenecen al repositorio de Git, pero deben estar presentes en cada release activado. Por eso el script de despliegue toma estos archivos localmente en el servidor desde el directorio actual de la app, antes de arrancar un nuevo release.

También Meilisearch vuelve a formar parte del cuadro operativo. La app podía recurrir a la búsqueda SQL sin Meilisearch, pero por eso `/api/health` quedaba solo como `degraded`. Por eso en el servidor Hetzner, Meilisearch corre como servicio Docker solo en localhost con una clave local del servidor.

El workflow de despliegue de GitHub obtiene además un gate más claro: lint y typecheck corren antes del despliegue de producción. El despliegue push local sigue siendo práctico, pero no debe ser a largo plazo la única verdad. El estado objetivo es: GitHub construye, verifica y despliega; los despliegues locales quedan como herramienta manual para casos excepcionales.

Lo que puede venir más adelante: si operamos muchas apps, entornos de clientes o despliegues self-service, un control plane puede tener sentido. Entonces evaluaremos con serenidad Coolify, Dokploy o Kamal. Hasta entonces vale: menos plataforma, más disciplina operativa fiable.
