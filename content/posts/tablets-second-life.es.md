---
title: "La segunda vida de una tablet"
excerpt: "La mayoría de las tablets «rotas» no lo están en absoluto — solo se abandonó su software. Por qué merece la pena seguir usándolas, qué puede hacer todavía una tablet vieja y qué sistemas operativos de código abierto le regalan años."
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

Siempre es la misma historia. Una tablet de cinco años, pantalla intacta, la batería aún aguanta carga, acaba en el cajón — o peor, en la basura. El motivo casi nunca es un defecto. Es este: «Ya no recibe actualizaciones» o «Una app ya no funciona». No son muertes de hardware. Son muertes artificiales, y se pueden revertir.

En RevampIT vemos estos dispositivos a diario. Este artículo muestra por qué una tablet vieja casi siempre vale más que su precio de materiales — técnica, ecológica y prácticamente.

## El problema en cifras

En 2022, la humanidad generó un récord de **62 millones de toneladas** de basura electrónica — suficiente para llenar 1,55 millones de camiones de 40 toneladas, parachoques contra parachoques una vuelta al ecuador. Solo el **22,3 por ciento** de ello se recogió y recicló de forma documentada. El resto se quemó, se enterró o se envió fuera de la vista.

![Basura electrónica global de 2010 a 2030: 34, 62 y los 82 millones de toneladas previstos — solo el 22,3 por ciento de lo generado en 2022 se recicló.](/blog/tablets-ewaste.svg)

*La parte verde muestra la porción realmente reciclada en 2022. La barra discontinua es la previsión de la ONU para 2030. Fuente: UN Global E-waste Monitor 2024.*

Y la brecha crece: la basura electrónica aumenta **cinco veces más rápido** que el reciclaje documentado. Las tablets están justo en la zona de impacto — ligeras, pegadas, selladas y declaradas en silencio «demasiado viejas» en cuanto el fabricante deja de dar actualizaciones.

## Por qué las tablets «mueren» — y por qué eso suele ser una excusa

Una tablet es una pantalla, una batería, un módulo de radio y un system-on-chip. Nada de eso se desgasta con un uso normal en cinco años. Lo que se acaba es la **disposición del fabricante a mantener el software** — y ese es un problema que el software puede resolver. Los sospechosos habituales:

- **Fin de vida del software.** El fabricante deja de dar actualizaciones del sistema operativo y de seguridad, a menudo ya tres a cinco años después de la venta. Las apps entonces se niegan a funcionar en la versión antigua — aunque el chip todavía sea más que suficiente.
- **Bootloaders bloqueados.** El dispositivo solo admite el firmware (ahora congelado) del fabricante. No puedes rescatarlo tú mismo.
- **Una batería cansada.** Una celda de litio conserva aún alrededor del 80 por ciento de su capacidad tras unos 800 ciclos de carga. Es una pieza de recambio de unos 15 francos, no un dispositivo muerto.
- **Almacenamiento lleno, poca RAM.** Un sistema operativo de fábrica inflado se arrastra — un Linux ligero o un Android depurado devuelven gigabytes y megahercios.

> El punto clave: casi ninguna tablet del cajón está defectuosa. Su software la ha abandonado. Justo ahí entran la reparación y los sistemas operativos libres.

## El cálculo de CO₂

Aquí está la cifra que lo cambia todo. El propio informe medioambiental de Apple para el iPad mini indica una huella de ciclo de vida de unos **95 kg de CO₂e**. De ellos, **66 kg — es decir, aproximadamente el 69 por ciento — corresponden al tiempo antes de que el dispositivo se encienda siquiera**: extracción, refinado y fabricación. Los años de uso solo suponen 21 kg.

![Reparto de la huella de 95 kg de CO₂e de un iPad mini: 66 kg de fabricación, 21 kg de uso, 6 kg de transporte, 2 kg de reciclaje.](/blog/tablets-co2.svg)

*Fabricación (naranja) 66 kg · Uso (verde oscuro) 21 kg · Transporte (verde claro) 6 kg · Reciclaje (gris) 2 kg. La mayor parte de las emisiones es «gris» — fijada en la fábrica. Fuente: Apple, informe medioambiental iPad mini.*

Esta proporción es todo el argumento a favor de seguir usando el dispositivo. El reciclaje recupera una fracción de los materiales — pero paga de nuevo las emisiones de fabricación del dispositivo de reemplazo. **Mantener un dispositivo en funcionamiento es la acción climática más eficaz que se puede hacer con él.** Cada año adicional es una tablet que *no* se produce.

## Dale al dispositivo viejo una nueva tarea

No toda tablet necesita un cambio completo de sistema operativo para seguir siendo útil. Un dispositivo demasiado lento como acompañante diario suele ser perfecto como *dispositivo de un solo propósito* — atornillado a la pared, colocado en la cocina o integrado en el hogar. Unos cuantos roles probados:

- **Panel de pared para el hogar inteligente.** Montado junto a la puerta como dashboard permanente para luz, calefacción y cámaras (por ejemplo con Home Assistant).
- **Marco digital de fotos y arte.** Una galería rotatoria de fotos familiares o de arte generativo de código abierto en el pasillo.
- **Dispositivo de cocina y lectura.** Una pantalla de recetas limpiable y fija, o un lector de bajo brillo para libros y PDFs.
- **Monitor de seguridad y de bebé.** La cámara frontal más una app lo convierten en un monitor por WLAN para la puerta, el garaje o la habitación infantil.
- **Control de música y audio.** Un mando fijo para los altavoces de la casa o un puesto exclusivo de streaming y podcasts.
- **Dispositivo de aprendizaje e infantil.** Limitado a apps de aprendizaje, sin cuentas vinculadas — un primer ordenador con poco riesgo.

Muchos de estos roles funcionan mejor sobre un sistema operativo libre y depurado. De ahí viene precisamente la verdadera longevidad. Así que liberemos el software.

## Liberar el software: sistemas operativos de código abierto

Cuando el fabricante se retira, una comunidad independiente puede mantener la tablet actualizada y segura durante años — a menudo **más segura** que el sistema operativo de fábrica, porque el tracking y el lastre desaparecen de paso. Conviene conocer dos familias: las **ROMs basadas en Android** mantienen plena compatibilidad de hardware y de apps y eliminan la dependencia del fabricante. Las **distribuciones Linux reales** van más allá y convierten la tablet en un PC de bolsillo — más libertad, más esfuerzo, soporte de hardware más incompleto.

| Sistema | Base | Mejor para | Esfuerzo |
| --- | --- | --- | --- |
| **LineageOS** | Android · AOSP | Soporte de dispositivos más amplio, día a día fiable | Bajo |
| **/e/OS** | Android · desgoogleado | Privacidad sin perder comodidad | Bajo |
| **postmarketOS** | Linux · Alpine | Tablet Linux real, mayor vida útil | Alto |
| **Ubuntu Touch** | Linux · UBports | Linux limpio, similar a un teléfono | Medio |

**LineageOS** es la ROM de Android más conocida: devuelve a cientos de dispositivos años de actualizaciones de seguridad y mantiene plena compatibilidad de apps — el punto de entrada estándar para la mayoría de las tablets. **/e/OS** es un derivado completamente desgoogleado, con su propia tienda de apps y su propia nube, ideal para un segundo dispositivo o un dispositivo infantil. **postmarketOS** apunta a un **ciclo de vida de diez años** sobre un kernel Linux mainline y arranca en cientos de modelos — pero «soporte» va desde plenamente funcional hasta apenas arrancable, así que comprueba primero tu dispositivo exacto. **Ubuntu Touch**, de UBports, ofrece una interfaz ordenada y basada en gestos, y es muy estable en los dispositivos soportados.

> **Dos reservas honestas.** Los iPads son el caso difícil: el bootloader bloqueado de Apple suele impedir cualquier otro sistema operativo — la mejor segunda vida de un iPad viejo es como dispositivo de un solo propósito con su última versión soportada de iPadOS, o la donación para piezas de recambio. Y **DivestOS**, antes una popular ROM endurecida para dispositivos viejos, se **descontinuó en diciembre de 2024** — si una guía antigua lo recomienda, recurre en su lugar a LineageOS, GrapheneOS o CalyxOS.

## Así funciona un reflasheo

Instalar un sistema operativo propio sigue casi en toda tablet Android el mismo procedimiento. Cuesta una tarde, un cable USB y la disposición a leer con cuidado la página wiki del dispositivo concreto. Los grandes pasos:

1. **Comprobar primero la compatibilidad.** Busca tu modelo exacto en el wiki de dispositivos del proyecto. Si no aparece como soportado, párate aquí — elige otro sistema operativo o un rol de un solo propósito sin flasheo.
2. **Hacer copia de seguridad y desbloquear el bootloader.** Copia todo lo importante del dispositivo. Activa luego las opciones de desarrollador, activa el `OEM-Entsperrung` y desbloquea mediante `fastboot`. Esto borra el dispositivo — es lo que se busca.
3. **Flashear una recovery personalizada.** Instala un entorno de recovery como `TWRP` o la recovery de la ROM. Es la herramienta que a continuación instala el nuevo sistema.
4. **Instalar el sistema operativo (Google opcionalmente fuera).** Instala el paquete de la ROM. En las ROMs de Android puedes usar microG en lugar de los servicios de Google Play — más ligero y más privado.
5. **Cambiar la batería de paso.** Si la autonomía es débil, una celda nueva es la mejora más barata que existe. Lleva el dispositivo al Repair-Café si está pegado — para eso estamos.

> **Un riesgo, por honestidad:** el flasheo puede, en casos raros, dejar un dispositivo inservible («brickearlo») y hace caducar la mayoría de las garantías. En un dispositivo de cinco años sin soporte suele ser un cambio ligero — pero si no estás seguro, hazlo junto a alguien que ya lo haya hecho. Para eso existe una comunidad de reparación.

## Cuando ya no es posible seguir usándola

Si una tablet está realmente al final, tampoco pertenece a la basura: las baterías selladas son un riesgo de incendio, y los materiales son valiosos. Llévala a RevampIT — la reparamos para alguien que la necesite, recuperamos piezas de recambio de ella o la reciclamos de forma adecuada, tal como nunca lo fue el otro 77,7 por ciento.

**Los ordenadores usados se reparan y se transmiten — no se desechan.**

## Fuentes

- UNITAR & ITU — [Global E-waste Monitor 2024](https://ewastemonitor.info/the-global-e-waste-monitor-2024/) (62 Mt generadas, 22,3 % reciclado, brecha de crecimiento quíntuple, 82 Mt para 2030).
- Apple — [Umweltbericht iPad mini](https://www.apple.com/environment/) (95 kg CO₂e de ciclo de vida; 66 kg o el 69 % procedente de material y fabricación).
- [LineageOS](https://lineageos.org/), [/e/OS](https://e.foundation/), [postmarketOS](https://postmarketos.org/), [Ubuntu Touch (UBports)](https://ubports.com/) — páginas oficiales de los proyectos.
