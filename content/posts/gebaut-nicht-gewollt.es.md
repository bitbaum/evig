---
title: "Construida, no querida: la plataforma con la que evig sigue su camino de forma independiente"
excerpt: "Construí una plataforma que automatiza todo el recorrido, desde el aparato viejo donado hasta su nueva propietaria. Revamp-IT no quiso seguir ese camino y se queda con tres sistemas heredados separados. Aquí está la comparación honesta: lo que había, lo que construí y hacia dónde va."
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

Construí una plataforma que unifica y automatiza todo: desde el aparato viejo donado, pasando por el control de calidad, hasta el escaparate público, además de toda la operación interna. Revamp-IT decidió no acompañar ese camino y se queda con los sistemas existentes: un sitio web Joomla, una tienda Shopware separada y Kivitendo, un ERP escrito en Perl sin una interfaz real. Es la decisión de la asociación. Estoy convencido de que la vía automatizada es la mejor, y la sigo de forma independiente con **evig**.

Esta entrada es la comparación honesta. No una crítica gratuita, sino una puesta en paralelo: **lo que había**, **lo que construí** y **hacia dónde va.**

## Lo que había: tres sistemas que callan

A lo largo de los años, en Revamp-IT habían crecido tres sistemas heredados separados, cada uno con su propio propósito y sus propios datos:

- El **sitio web Joomla** en `revamp-it.ch`: la cara pública, pero estática y desconectada del resto.
- La **tienda Shopware** en `shop.revamp-it.ch`: la venta de aparatos reacondicionados, un universo propio.
- El **ERP Kivitendo**: contabilidad e inventario, escrito en Perl, aislado y sin una API utilizable.

Esos tres no se hablaban entre sí. Un aparato que se registraba, se probaba, se almacenaba y se vendía había que teclearlo de nuevo a mano en cada estación. Los datos viajaban de un silo a otro por copia, con todos los errores que trae la transferencia manual. Y como Kivitendo no tiene una interfaz real, todo intento de automatización termina en el mismo muro: se busca una API que sencillamente no existe, o se imita penosamente un navegador solo para conseguir meter y sacar datos.

Reparar nunca fue el problema. La organización detrás sí lo era.

## Lo que construí: una plataforma, pública e interna a la vez

En lugar de seguir sujetando tres sistemas heredados con cinta adhesiva, construí una única plataforma coherente. Cubre ambos mundos: el **lado público**, donde la comunidad navega, compra y busca ayuda, y el **lado interno**, donde se registran, se prueban y se publican los aparatos, se registra el tiempo y se coordina la operación. Ambos comparten la misma base de datos. Un aparato se registra **una sola vez** y viaja desde ahí automáticamente hasta el escaparate.

![Mercado con filtros, barra de CO₂ y anuncios](/blog/showcase-revampit-marketplace.png)
*El mercado: aparatos reacondicionados y anuncios privados en un solo escaparate, con filtros y una barra de CO₂ transparente.*

- **Mercado**: aparatos reacondicionados y comercio privado de igual a igual en un solo lugar. Un carrito, un pago, gestionado con Payrexx y una función de depósito en garantía.
- **Ayuda informática**: una red de dos caras que conecta las necesidades de reparación con las técnicas y los técnicos. Cada reparación es un aparato menos en la basura.
- **Servicios**: «Construye tu ordenador», instalación y asesoramiento de Linux, reciclaje conforme a las reglas del oficio.
- **Recepción de aparatos**: el registro asistido por IA capta las fotos y los datos clave y propone una categoría y datos; las categorías sujetas a control pasan por un control de calidad estructurado con lista de verificación y principio de los cuatro ojos; registro en masa e importación por CSV para grandes cantidades.
- **Registro de tiempos, equipos y Hirn**: saldo, informe y flujo de aprobación para la operación; una estructura de equipos que muestra quién trabaja en qué; y «Hirn», un asistente de IA basado en RAG que responde a partir del propio conocimiento de la organización.
- **Impacto de CO₂**: cada cifra con su derivación revelada (factores de ADEME, contrastados con Fraunhofer y la ZHAW), en una página de transparencia dedicada. Demostrado, no afirmado.

![Metodología de CO₂ en la página de transparencia](/blog/showcase-revampit-co2.png)
*Cada dato de CO₂ está ligado a una fuente abierta y el cálculo es público: verificable en lugar de greenwashing.*

## La comparación directa

| | Antes (Revamp-IT, sistemas heredados) | Ahora (la plataforma) |
|---|---|---|
| **Sistemas** | 3 separados (Joomla, Shopware, Kivitendo) | 1 aplicación coherente |
| **Entrada de datos** | a mano de nuevo en cada estación | registrada una vez, transmitida automáticamente |
| **Conexión con el ERP** | Kivitendo (Perl), sin una API real | Kivvi con sincronización por API REST (`syncToKivvi`) |
| **Venta y P2P** | separados o inexistentes | un mercado, un pago |
| **Búsqueda** | ninguna transversal | Meilisearch sobre todo el inventario |
| **Sostenibilidad** | afirmación | cada cifra con una fuente abierta |
| **Idiomas** | en esencia uno | 8 |
| **Interno (tiempo, equipos, conocimiento)** | disperso / manual | en la plataforma, con asistente de IA |

Más importante que cada tecnología por separado es el principio que hay detrás: **una única fuente de verdad** para cada información. Justo lo que les faltaba a los tres sistemas heredados.

## El orden de magnitud

De «tres sistemas que callan» ha surgido una plataforma de considerable profundidad (a julio de 2026):

| Indicador | Valor |
|---|---|
| Puntos de acceso de la API | más de 300 |
| Páginas | más de 220 |
| Módulos de administración | 33 |
| Tablas de base de datos | alrededor de 130 |
| Idiomas | 8 |
| Commits | más de 2'300 |

Bajo el capó: **Next.js 16** con **TypeScript**, los datos en **PostgreSQL** mediante el ORM **Drizzle** (tipos derivados directamente del esquema), inicio de sesión con **NextAuth v5**, búsqueda con **Meilisearch**, pagos con **Payrexx**, imágenes en **Cloudflare R2**. Una pila moderna y elegida a conciencia, no un ERP en Perl en el que toda automatización fracasa.

## Hacia dónde va

La plataforma no es el objetivo, sino el cimiento. evig da un paso más allá de la economía circular: hacia el **acceso a la inteligencia para todos**. Esta es la hoja de ruta:

- **IA asequible en hardware modesto.** Un portátil reacondicionado no solo es la opción más ecológica, sino la rampa de acceso más barata que existe a la inteligencia artificial. Investigamos y mostramos cómo una IA capaz funciona en aparatos de segunda vida.
- **La robótica como siguiente paso.** Inteligencia encarnada: robots que quitan trabajo real a una vida y devuelven tiempo. Los humanoides apenas se venden nuevos hoy y todavía no se usan; evig quiere ser el primer lugar en ofrecerlos como es debido: completos, probados, justificados para un fin real, y con el conocimiento para usarlos.
- **Nuevas formas de costearse la inteligencia.** Junto a la compra directa: micromecenazgo por suscripción y financiación comunitaria, fondos de suscripción compartidos (repartir los costes recurrentes de la IA en lugar de cargarlos solo), apoyo directo sin intermediarios.
- **Investigación llevada de forma abierta.** evig no solo vende y repara: investiga: IA asequible, robótica abierta, reparación, soberanía sobre las propias herramientas. Y publica lo que encuentra. El conocimiento en circulación es la misma idea que el hardware en circulación.

Esa es la diferencia entre «suficientemente bueno, como estaba» y «tan lejos como pueda llegar». Construí el cimiento porque quiero recorrer este camino: rápido, de forma independiente y más allá de Zúrich.

## Conclusión

Donde tres sistemas heredados corrían uno al lado del otro y los datos se llevaban a mano por encima de las zanjas, hoy se levanta una plataforma coherente y automatizada. Estaba ahí, funcionando y verificable. Revamp-IT eligió el camino conocido: es su pleno derecho, y el trabajo que realiza desde 2003 sigue siendo valioso. Yo elegí el otro: unificarlo todo, automatizar tanto como sea posible y orientar el cimiento hacia la era de la inteligencia.

evig sigue construyendo. Las mismas raíces, una meta más grande.
