---
title: "SSOT: por qué hacemos nuestra web más mantenible"
excerpt: "Hemos seguido consolidando la base técnica de la web: menos hardcoding, responsabilidades más claras, mejores verificaciones y un proceso de despliegue más estricto."
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

Una web sostenible no es solo una web que habla de sostenibilidad. También debe estar construida técnicamente de forma que pueda mantenerse, ampliarse y revisarse durante mucho tiempo. En eso precisamente hemos seguido trabajando.

En el centro había un principio: **Single Source of Truth**, abreviado SSOT. Cada información importante debe tener exactamente una fuente fiable. Los colores, los indicadores de estado, los datos de la organización, los textos, las estructuras de la base de datos y los procesos de calidad no deben copiarse en muchos sitios con ligeras diferencias. De lo contrario, cada cambio se vuelve más arriesgado, más lento y más caro.

## Qué hemos mejorado

Hemos añadido nuevas verificaciones de compliance que comprueban automáticamente si se respetan las reglas centrales. Entre ellas hay una auditoría SSOT y una auditoría i18n para las traducciones. La verificación SSOT ahora impide, entre otras cosas, que se creen tablas de base de datos en las rutas de API o que reaparezcan viejos patrones de `hardcoded-content`.

También se ha endurecido el proceso de despliegue. En lugar de ignorar advertencias o comprobar solo después del build, el camino de calidad ahora es más claro: TypeScript, linting, compliance, tests y production build. Esto hace que los errores sean visibles antes y refuerza la fiabilidad antes de los releases.

En el sistema de diseño, varias definiciones de color fijas se han trasladado a configuraciones centrales de UI. Los colores propios de la app para imágenes Open-Graph, overlays de feedback, páginas de error, formularios de categoría, factsheets, patrones de hero y perfiles de cliente están ahora en lugares con nombre. Esto reduce las dependencias ocultas y hace que los ajustes posteriores sean más precisos.

Otro punto fue la separación entre contenido y configuración. Una insignia de servicio como "Pronto" no debe estar fija en una configuración técnica de servicio, sino en las traducciones. Estos pequeños desplazamientos aportan mucho a la mantenibilidad a largo plazo.

## Por qué esto es importante

El hardcoding suele ser cómodo, pero genera deuda. Un color aquí, un texto en alemán allá, una clase de estado en un archivo de dominio, una sentencia de base de datos en una ruta de API: cada punto individual parece inofensivo. Pero juntos conducen a un sistema difícil de entender y difícil de cambiar con seguridad.

Por eso SSOT no es un fin en sí mismo. Nos ayuda a trabajar más rápido y con más precisión:

- Los cambios ocurren en un solo sitio en lugar de en muchos.
- Las decisiones de diseño se mantienen coherentes.
- Las traducciones se vuelven medibles.
- La estructura de la base de datos permanece en las migraciones y los archivos de esquema.
- Las revisiones pueden centrarse en el comportamiento en lugar de en la búsqueda.

## Qué queda pendiente

La dirección está clara, pero el trabajo no ha terminado. Lo siguiente que queremos es reducir la deuda de traducción existente. La nueva verificación i18n ya impide nuevas claves faltantes, pero algunas lagunas existentes siguen documentadas como baseline.

Además, las configuraciones de dominio deberían separarse aún más de los textos de UI. Valores de estado como `active`, `sold` o `reserved` son datos de dominio. Las etiquetas en alemán y la representación visual deberían provenir limpiamente de las traducciones y del mapping de UI.

El sistema de diseño también merece todavía una consolidación más profunda. Ya hay buenos bloques centrales, pero algunas capas de tokens más antiguas se solapan. El objetivo es una arquitectura clara: tokens primitivos, tokens semánticos, variantes de componentes y mappings específicos por área.

## Nuestro estándar

La mantenibilidad es para nosotros un criterio de calidad. Decide si una plataforma solo funciona hoy o si dentro de un año también podrá seguir desarrollándose con seguridad.

SSOT, separation of concerns y código DRY no son para ello conceptos abstractos. Son reglas de trabajo concretas: menos copias, límites más claros, mejor automatización y un sistema que no dificulta los cambios innecesariamente.

En eso precisamente seguimos construyendo.
