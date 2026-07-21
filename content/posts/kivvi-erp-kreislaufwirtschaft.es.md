---
title: "Kivvi: el ERP de la economía circular"
excerpt: "Los ERP estándar conocen la compra y las cantidades — no las donaciones ni las piezas únicas con estado e historia. Kivvi es el ERP abierto construido precisamente para eso."
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

Una furgoneta se detiene frente al almacén. En la parte trasera: 50 portátiles donados por una empresa que ha renovado su flota. Cada dispositivo es una pieza única — con su propio estado, su propia historia, su propio recorrido a través de la reparación y la venta. Para una operación de economía circular es un martes por la mañana totalmente normal. Para un ERP comercial es un problema que ni siquiera intenta resolver.

![Página de inicio de Kivvi con el lema «El sistema operativo de la economía circular»](/blog/showcase-kivvi-home.png)

*«¿50 portátiles donados? Registrados en 30 segundos.» — Kivvi está construido desde cero para el día a día de quienes reacondicionan y de las tiendas de segunda mano.*

## El problema: los ERP estándar piensan en compra y cantidades

Todo sistema de gestión de mercancías habitual en el mundo parte del mismo supuesto básico: compras una determinada cantidad de artículos idénticos, los almacenas y los vuelves a vender. 200 unidades del artículo n.º 4711, todas iguales, todas nuevas. El precio de compra es conocido, el margen está calculado, la cantidad es la magnitud decisiva.

Una operación de economía circular funciona exactamente al revés. La mercancía no llega como un pedido, sino como una **donación** o como una **entrega a cambio**. No es una cantidad, sino una colección de **piezas únicas** — cada una con su propio grado de estado, desde «como nuevo» hasta «para piezas de repuesto». Cada dispositivo tiene una **historia de reparación**: qué se probó, qué se sustituyó, quién borró los datos. Y al final no cuenta solo el ingreso por la venta, sino también el **impacto** — cuántos dispositivos se salvaron del vertedero.

Estas diferencias no son cosméticas. Afectan el núcleo mismo del modelo de datos. Un sistema que trata la «cantidad» como magnitud central puede, como mucho, adjuntar un grado de estado como nota de texto en algún sitio — pero no filtrar, calcular ni analizar según él. Un sistema que entiende la entrada de mercancías como una compra con factura simplemente no tiene un campo para una donación sin contraprestación ni una plantilla para el recibo que necesita el donante. La brecha no se puede cerrar mediante configuración; reside en los supuestos fundacionales.

Nada de esto encaja en los modelos de datos de SAP, Odoo o de cualquiera de las muchas soluciones para pymes. No conocen ningún grado de estado, ningún recibo de donación, ningún ciclo de vida de un dispositivo individual. Quien dirige una operación de reacondicionamiento, una tienda de segunda mano o un repair café tenía por ello hasta ahora solo dos opciones: el veterano **Kivitendo** basado en Perl con su lastre heredado — o la eterna huida a las **hojas de cálculo**, donde cada proceso se reconstruye a mano y los datos se pudren en decenas de archivos no conectados.

## Lo que Kivvi hace de otra manera

Kivvi invierte el supuesto básico. En el centro no está la compra, sino la **procedencia de la mercancía y el objeto individual**. Donación, estado, recorrido de reparación e impacto no son campos añadidos a posteriori — son el fundamento del modelo de datos.

![Inicio de sesión en pantalla dividida con lista de funciones: entrada rápida con IA, artículos individuales, recibos de donación, facturas QR, Open Source MIT](/blog/showcase-kivvi-login.png)

*Ya en el inicio de sesión Kivvi muestra lo que importa: entrada rápida con IA, gestión de artículos individuales, recibos de donación, facturas QR suizas — y Open Source bajo licencia MIT.*

El resultado es un sistema que habla el idioma de la economía circular, en lugar de comprimirla en un esquema ajeno. Donde un ERP clásico tendría primero que ser forzado con esfuerzo — con campos adicionales, apaños y hojas de cálculo externas al lado —, en Kivvi el objeto usado y único es el caso normal. Y está construido para operaciones concretas, no para el comercio genérico.

![«¿Para quién es Kivvi?» con los grupos objetivo reacondicionadores de TI, tiendas de segunda mano, repair cafés y tiendas vintage](/blog/showcase-kivvi-fuer-wen.png)

*Kivvi se dirige a reacondicionadores de TI, tiendas de segunda mano, repair cafés y tiendas vintage — operaciones que trabajan con mercancía usada y única.*

## Lo que los ERP estándar no pueden hacer — y Kivvi sí

![Resumen «Lo que los ERP estándar no pueden hacer»](/blog/showcase-kivvi-sec1.png)

*La brecha que Kivvi cierra: todo lo que tiene que ver con mercancía donada, individual, reparada.*

La mejor manera de entender Kivvi es un recorrido por sus áreas centrales — cada vez con la pregunta: ¿qué hace y qué problema resuelve?

### Recepción de mercancías y donaciones

**Qué hace:** En la recepción, cada mercancía se registra con su procedencia (donación o entrega a cambio) y un **grado de estado**. Para las donaciones se puede emitir directamente un **recibo de donación**.

**Qué problema resuelve:** El grado de estado es la información básica de la que depende luego todo — precio, necesidad de reparación, aptitud para la venta. Y el recibo de donación, sencillamente no previsto en los ERP estándar, es un documento que las operaciones de utilidad pública necesitan a diario.

### Ciclo de vida del artículo individual

**Qué hace:** Cada dispositivo es un registro propio que recorre un ciclo de vida definido: **intake → testing → repair → ready → listed → sold**. El estado de cada pieza es visible en todo momento.

**Qué problema resuelve:** En lugar de una indicación de cantidad de «200 unidades», la operación sabe, para cada objeto individual, en qué punto se encuentra. Ningún dispositivo se pierde en el proceso, ninguna mercancía queda atascada sin que se note en el limbo de las pruebas.

### Reparaciones

**Qué hace:** Las órdenes de reparación se llevan por dispositivo — incluido el **bono de reparación** y la emisión de **certificados de borrado** para la destrucción de datos conforme a la protección de datos.

**Qué problema resuelve:** La historia de reparación queda ligada al dispositivo y es trazable. El certificado de borrado no es un «bueno tenerlo» al vender hardware de TI usado, sino una cuestión de confianza y cumplimiento.

### Venta

**Qué hace:** Todo el proceso de venta está representado: **oferta → pedido → albarán → factura → gestión de recordatorios**.

**Qué problema resuelve:** Desde la primera oferta hasta el último recordatorio de pago, todo transcurre en un solo sistema, sin ruptura de soporte. Ninguna herramienta de facturación paralela, ningún recordatorio llevado a mano.

![Resumen «Lo que Kivvi puede hacer»](/blog/showcase-kivvi-sec3.png)

*De la entrada de mercancías a la contabilidad: Kivvi cubre toda la cadena en un solo sistema.*

### Contabilidad suiza

**Qué hace:** Kivvi trae consigo un **plan de cuentas para pymes completo con 227 cuentas**, un **diario inalterable** y el tratamiento del **IVA**.

**Qué problema resuelve:** La contabilidad no es un programa separado al que haya que exportar datos, sino parte integrante del ERP. El diario inalterable garantiza la seguridad de revisión — una vez contabilizado, queda contabilizado.

### Banca

**Qué hace:** Kivvi lee los archivos bancarios **CAMT.053/054** y concilia automáticamente los pagos entrantes con las **facturas QR**.

**Qué problema resuelve:** La conciliación de pagos, de otro modo horas de trabajo manual, ocurre automáticamente. Las facturas pagadas se reconocen, las partidas abiertas quedan abiertas — sin que nadie compare línea por línea los extractos de cuenta con las facturas.

### Barra de comandos IA

**Qué hace:** Una barra de comandos impulsada por IA comprende el lenguaje natural y lo ejecuta mediante **47 herramientas auditadas** — desde la entrada rápida hasta el análisis.

**Qué problema resuelve:** «¿50 portátiles donados? Registrados en 30 segundos.» — en lugar de hacer clic en cada campo individualmente, se describe la tarea y Kivvi la ejecuta. Como cada una de las 47 herramientas está auditada, cada acción sigue siendo trazable y controlada.

## Abierto y conectado

Un ERP que encierra sus datos es una trampa. Kivvi va por el camino contrario y está construido abierto desde los cimientos.

Ofrece una **API REST abierta (v1)** y **webhooks firmados**, a través de los cuales otros sistemas se conectan de forma limpia y segura. Para el cambio desde el sistema heredado hay una **importación CSV de Kivitendo** — exactamente la interfaz que uno desea, exactamente en el lugar correcto: en el paso del viejo mundo Perl al nuevo.

Igual de importante es la licencia. Kivvi es **Open Source bajo licencia MIT**. Eso significa: **ningún vendor lock-in**, **autoalojamiento** en la propia infraestructura y la certeza de que los **datos permanecen en Suiza**. Quien usa Kivvi posee su sistema — no al revés. Precisamente para las operaciones de utilidad pública que trabajan con medios ajustados y planifican a largo plazo, esto es decisivo: no hay costes de licencia que exploten con el crecimiento, ni el riesgo de que un proveedor discontinúe el producto y tome los datos como rehenes. El código fuente está abierto, las interfaces están documentadas, la operación sigue siendo capaz de actuar.

## El orden de magnitud

Kivvi no es un prototipo, sino un sistema plenamente desarrollado. Algunas cifras para situarlo:

| Indicador | Valor |
|---|---|
| Documentación | 133 páginas |
| Tablas de base de datos | 50 |
| Módulos de dominio | 63 |
| Herramientas IA | 47 |
| Commits | 616 |
| Licencia | MIT |

## Bajo el capó

Técnicamente, Kivvi se apoya en una base moderna y mantenible. Está construido como **monorepo de Next.js 14** en **TypeScript**, con **PostgreSQL** como base de datos y **Drizzle** como ORM. Para todos los importes monetarios se emplea **decimal.js** — los errores de redondeo con francos y céntimos quedan así excluidos. Kivvi genera las facturas QR suizas con **SwissQRBill**, limpiamente conforme al estándar. Esta elección no es un fin en sí mismo: hace que el sistema calcule correctamente, siga siendo mantenible y pueda crecer junto con la operación.

## Conclusión

Los ERP estándar están construidos para un mundo en el que la mercancía se compra en cantidades y se vende idéntica. La economía circular vive en otro mundo — el mundo de la donación, de la pieza única con estado e historia, de la reparación y del impacto medible. Kivvi es el primer ERP que no trata este mundo como un caso especial, sino como punto de partida.

Es abierto, es suizo, te pertenece. Quien quiera saber cómo se siente eso encontrará Kivvi en **kivvi.orangecat.ch**.
