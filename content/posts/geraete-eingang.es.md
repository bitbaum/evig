---
title: "Recepción de dispositivos: una foto en lugar de quince minutos"
excerpt: "Antes, registrar un dispositivo usado significaba una hoja de cálculo, una exportación CSV y una cadena de entregas manuales hasta llegar a Kivitendo — y aun así la tienda no mostraba nada. Cómo convertimos eso en un flujo que registra un dispositivo en segundos, cómo los sistemas se comunican entre sí mediante APIs, y qué pieza sigue faltando."
author: "RevampIT Team"
featuredImage: "/blog/geraete-eingang-hero.svg"
category: "Technik"
tags:
  - geraete-eingang
  - ki
  - erfassung
  - kivvi
  - kivitendo
  - architektur
  - automatisierung
publishedAt: "2026-07-21"
published: true
---

Cada dispositivo que recibe una segunda vida en Revamp-IT primero tiene que entrar *en el sistema*. Suena trivial. No lo era. Justo en este paso discreto — el registro — es donde el taller perdió más tiempo durante años, y es donde hay menos valor que aportar: un portátil no mejora porque alguien teclee sus especificaciones. Esta es la historia de cómo convertimos quince minutos de trabajo manual en un registro que tarda segundos — y qué hay debajo, técnicamente.

## El problema: registrar era una lata

Al principio había una hoja de cálculo. Para registrar un dispositivo, hacías lo siguiente, en orden: **pesarlo**, tomar sus **dimensiones** con una cinta métrica, hacerle una **foto**, y luego **buscar juntando en Google** las especificaciones y un precio plausible — número de modelo, CPU, RAM, precio de venta, todo tecleado a mano en una hoja de cálculo privada (copiado y pegado, la mayoría de las veces).

Entonces empezaba la cadena de entregas. Heinz fusionaba las hojas individuales en una **hoja maestra** y la exportaba como **CSV**. Cem subía ese CSV a **Kivitendo**, nuestro ERP basado en Perl y libro contable de referencia. E incluso entonces el dispositivo no era visible en ninguna parte: **no** aparecía en la tienda automáticamente — eso era, una vez más, un paso separado y manual.

![El antiguo flujo de registro: pesar, medir, fotografiar y buscar especificaciones en Google fluían hacia una hoja de cálculo privada, que Heinz fusionaba en una hoja maestra, exportaba como CSV y entregaba a Cem, que la subía a Kivitendo; nada aparecía en la tienda automáticamente — de 5 a 15 minutos de puro trabajo manual por dispositivo.](/blog/geraete-eingang-alt.svg)

De cinco a quince minutos de puro trabajo manual — **por dispositivo**, repartidos entre varias personas. El resultado era predecible: se suponía que todo el equipo debía registrar, pero solo unos pocos lo hacían. No por mala voluntad, sino porque la barrera era demasiado alta. Un proceso que nadie disfruta se convierte en el cuello de botella — y un montón de dispositivos sin registrar crece en el almacén.

## La visión: llevar el registro prácticamente a cero

El objetivo era deliberadamente radical: reducir el tiempo que se tarda en meter un producto en el sistema en un **99,9 %**. No «un poco más rápido» — otro orden de magnitud.

El razonamiento: la foto de un dispositivo ya contiene casi todo lo que necesitamos saber — fabricante, modelo, a menudo incluso el estado. Un nombre escrito («Lenovo ThinkPad T450 i5») igualmente. Con IA que convierte esta materia prima en campos estructurados, y con sistemas cuidadosamente construidos que **se comunican entre sí mediante APIs**, un solo gesto debería bastar: fotografiar o teclear — y el dispositivo aterriza donde le corresponde. Vinculado a una ubicación de almacenamiento en la base de datos, o publicado directamente como anuncio en la tienda.

## Cómo funciona hoy

![El nuevo camino: un nombre, una foto, una frase hablada o una fila CSV van a la extracción por IA (Qwen Vision, Groq, Whisper), que devuelve campos estructurados con categoría y confianza; una única función createErfassungProduct escribe el registro y se ramifica hacia almacén, control de calidad o el marketplace, mientras sincroniza a Kivvi en paralelo.](/blog/geraete-eingang-neu.svg)

### Un registro, cuatro canales

El `Geräte-Eingang` (la recepción de dispositivos, `erfassung` en el código) tiene una interfaz deliberadamente sencilla con cuatro canales de entrada: **texto**, **foto**, **archivo** (CSV/Excel) y **voz**. La decisión de diseño detrás de esto importa — son *canales*, no cuatro flujos de trabajo separados. Como sea que lleguen los datos, convergen en el mismo registro de producto.

El canal de texto es ingenioso: detecta automáticamente si una línea es un solo dispositivo o una lista entera. Una línea va a `/api/admin/erfassung/text`, varias líneas a `/api/admin/erfassung/bulk-text` — de modo que puedes pegar todo un palé de dispositivos a la vez y recibir a cambio una tabla de revisión por lotes. Los archivos CSV y Excel pasan por `bulk-upload`, la voz por `voice`.

### La cascada de IA

El corazón está en `src/lib/erfassung/ai-extraction.ts`. `extractProductFromText` envía el texto a través de una **cascada de reserva** de tres proveedores (`callWithFallback`): **Groq** primero (`llama-3.3-70b-versatile`), luego **OpenRouter**, luego un **Ollama** local. Si todo falla, un analizador de expresiones regulares (`fastParseProductText`) es la última red — el registro nunca falla de forma dura, solo se vuelve menos preciso.

Para las fotos, toma el relevo `extractProductFromImage`. Aquí vale la pena contar una pequeña historia de la sala de máquinas: Groq retiró su modelo de visión anterior (Llama 4 Scout) — las peticiones de repente volvían como `404 model_not_found`, y el análisis de fotos estaba muerto en producción. El reemplazo hoy es **`qwen/qwen3.6-27b`**, el único modelo con capacidad de imagen actualmente disponible en Groq. Pero Qwen3 es un modelo de *razonamiento*: piensa en voz alta en un bloque `<think>…</think>` antes de responder. Un analizador ingenuo del tipo «coge el primer `{…}`» pescaba rápidamente el JSON de ejemplo de ese bloque de pensamiento y fallaba. La solución es una función pequeña y nada espectacular, `extractJsonObject`, que elimina los bloques de razonamiento y las vallas de código `json` antes de leer el JSON. La voz, a su vez, se transcribe con `whisper-large-v3-turbo` de Groq y luego pasa por la misma extracción de texto.

Dos cosas hacen que el resultado sea utilizable en lugar de meramente impresionante. Primero, la **confianza por campo**: cada campo extraído lleva una certeza; el formulario de revisión resalta solo los campos que realmente necesitan una segunda mirada (un estado que el texto nunca mencionó, por ejemplo), en lugar de empapelar cada valor con un porcentaje. Segundo, la **categorización**: `detectCategory` es una tabla de patrones ordenada que mapea sobre los códigos de categoría existentes. El orden es intencionado — los patrones de accesorio, impresora, monitor y red coinciden *antes* que las marcas de portátiles, y los componentes internos en *último* lugar, de modo que el nombre de un dispositivo siempre gana. Así, «Dockingstation Lenovo ThinkPad» se archiva correctamente como *Red* y no como un portátil.

En la interfaz esto se ve así: tecleas una frase, y segundos después aparece un formulario relleno — fabricante, modelo, una descripción breve redactada, la categoría. Exactamente un campo aquí lleva una pequeña indicación naranja «Prüfen» (revisar): el *estado*, porque el texto nunca lo nombró. Todo lo demás está en silencio. Ese es el quid — la IA no grita «95 % seguro» en cada línea, señala en silencio lo único que una persona debería confirmar.

![El paso de revisión en la interfaz: a partir de la frase tecleada, la IA rellenó un formulario limpio — fabricante Lenovo, modelo ThinkPad T480, categoría Laptops, una descripción redactada, estado Bueno. Solo el campo de estado lleva una indicación naranja «revisar», porque el texto nunca nombró un estado.](/blog/geraete-eingang-review.svg)

### Una única fuente de verdad para las escrituras

Por muy diferentes que sean los canales, la escritura ocurre en un único lugar: `createErfassungProduct()` en `src/lib/erfassung/create-product.ts`. Esta función es la *single source of truth* para «un dispositivo cobra existencia». En una transacción asigna un número de artículo legible por humanos (`I-YYMMDD-NNNN`), escribe el registro de extracción (`ai_extracted_products`), crea la entrada de inventario (`inventory_items`, con ubicación, caja y cantidad), vincula los perfiles de cliente, sube la imagen a **R2** (almacenamiento de objetos) y la enlaza — y opcionalmente publica un anuncio de inmediato.

Como todo pasa por esta única función, los mismos invariantes se cumplen en todas partes. Esa es también la razón por la que más tarde pudimos migrar **197 productos de la antigua tienda Shopware** de una sola pasada (más sobre esto abajo): la importación llama exactamente a `createErfassungProduct`, en lugar de inventar una segunda forma de escribir, sutilmente diferente.

### La puerta de calidad

Tras la revisión viene la única decisión operativa real: *¿a dónde después?* Los `CAPTURE_DESTINATIONS` — calidad, inventario, piezas, reciclaje o «tienda sin probar» — mapean sobre niveles de registro. Un dispositivo de una categoría que requiere revisión y que quieres publicar directamente es interceptado por una puerta de seguridad y aterriza en su lugar como borrador en la cadena de reacondicionamiento con una lista de control de QC — a menos que alguien tome una decisión explícitamente registrada de «publicar sin revisión». Que una categoría requiera revisión no se mantiene por separado, sino que se *deriva de la propia lista de control*: requiere revisión significa que tiene una posición de prueba o seguridad obligatoria para esa clase de dispositivo.

### Hacia el marketplace

Cuando se publica un dispositivo, `publishRevampitListing` lo convierte en un anuncio activo (bandera `is_revampit`), traslada la imagen de R2 a las imágenes del anuncio, e indexa la entrada en **Meilisearch** para la búsqueda. La transición de «registrado» a «visible en la tienda» es así una llamada a la API, no una segunda persona con un segundo formulario.

### La prueba de esfuerzo: 197 productos de la antigua tienda

La mejor confirmación de que el flujo aguanta fue la migración del catálogo. La antigua tienda Shopware no tenía una API utilizable — pero sí metadatos Open Graph limpios por página de producto. Un pequeño scraper recorrió la lista `/Alles/`, extrajo nombre, marca, precio, descripción y URL de imagen, y un endpoint de migración de un solo uso creó **cada uno de los 197 productos como borrador** — mediante `createErfassungProduct`, con la imagen descargada en el servidor y realojada en R2. Las categorías se infirieron mediante `detectCategory`, los duplicados se evitaron mediante el número Shopware almacenado (idempotente, repetible a voluntad). Lo que a mano habría llevado días fue cuestión de minutos.

Y como la migración pasó por la misma función que cualquier registro individual, los borradores pudieron luego publicarse en una segunda pasada — cada uno se convierte en un anuncio activo, y la imagen de R2 lo acompaña automáticamente. **11 anuncios visibles se convirtieron en 208**, cada uno con imagen, precio y categoría. La antigua tienda no fue solo tecleada de nuevo, fue *trasladada*.

![El marketplace tras la migración: 11 anuncios se convirtieron en 208 ofertas activas — cada tarjeta con imagen de producto, título, precio y distintivo de estado, alimentada desde el antiguo catálogo de Shopware.](/blog/geraete-eingang-marktplatz.svg)

## Tres principios que lo sostienen

Antes de pasar a los sistemas vecinos, vale la pena mirar tres decisiones que marcan la diferencia entre «funciona en la demo» y «aguanta en producción» — y que reaparecen a lo largo del código.

**Una única fuente de verdad para las escrituras.** Ya sea foto, voz, CSV, registro individual o migración masiva: la escritura ocurre exclusivamente a través de `createErfassungProduct`. Habría habido mil tentaciones de construir «un segundo camino rápido, ligeramente diferente» para la migración. Eso es exactamente lo que *no* hicimos — y por eso los números de artículo, el manejo de imágenes, la puerta de QC y los invariantes de inventario se aplican igual a todos los caminos. Un error se corrige en un solo sitio, no en cinco.

**Certeza, no porcentajes.** La IA entrega una confianza para cada campo — pero la pantalla no muestra porcentajes. Muestra una indicación de «revisar» solo allí donde la certeza cae por debajo de un umbral. Un número como «73 %» no es una instrucción para la persona en el banco de trabajo; «mira esto de nuevo» sí lo es. La buena automatización reduce decisiones, no las multiplica.

**Idempotencia en todo lo que sale.** Cada sincronización a Kivvi lleva una clave de idempotencia; cada registro migrado lleva su número Shopware; cada pasada de publicación omite lo que ya tiene un anuncio. Esto suena a nimiedad, pero es la razón por la que podemos repetir migraciones, sincronizaciones y reindexaciones *a voluntad*, sin duplicados ni miedo. La repetibilidad no es un lujo — es la condición previa para poder reparar un sistema mientras está en funcionamiento.

## Sistemas que se comunican entre sí

Registrar es solo la mitad del trabajo. Un dispositivo también tiene que llegar allí donde viven el stock y la contabilidad. Y aquí es donde la cosa se pone interesante desde el punto de vista arquitectónico, porque cuelgan de ello dos mundos muy distintos.

![Arquitectura de integración: la recepción de dispositivos escribe inventory_items localmente y sincroniza hacia arriba a Kivvi a través de su API REST ya lista, con un token bearer y clave de idempotencia, y recibe webhooks de estado de vuelta; el camino hacia el Kivitendo heredado en Perl pasa por una capa de traducción Node separada que imita a un navegador.](/blog/geraete-eingang-integration.svg)

### Kivvi: una membrana limpia

**Kivvi** es el ERP en la nube moderno y suizo (TypeScript, Drizzle/Postgres) al que sincronizamos los dispositivos. Nos facilita las cosas porque ofrece exactamente lo que un socio de integración necesita: una API REST versionada bajo `/api/v1/`. Nuestro `syncToKivvi` (`src/lib/kivvi/client.ts`) hace un `POST /api/v1/inventory-items` con un token bearer (`kv_…`) guardado en el servidor como hash SHA-256.

Tres propiedades son decisivas aquí — y en el código de Kivvi incluso llevan el nombre de Revamp-IT:

- **Idempotencia.** La llamada lleva un `Idempotency-Key`; un push doble no crea ningún duplicado. Precisamente por eso podemos reintentar sin preocupaciones.
- **No bloqueante, tras el commit.** La sincronización es fire-and-forget: arranca *después* de la transacción de base de datos del registro y nunca bloquea la captura. Después escribimos `kivvi_inventory_item_id` y `kivvi_sync_status` de vuelta en la entrada de inventario. Si Kivvi no está configurado (sin `KIVVI_API_URL`), el cliente devuelve limpiamente `{ success: false }` en lugar de lanzar una excepción — en desarrollo, simplemente no hay sincronización.
- **Bidireccional.** Kivvi envía webhooks firmados de vuelta (`inventory_item.status_changed`, etc.). Cuando un dispositivo se vende allí, nos enteramos — sin sondear.

Un paso de traducción pequeño pero importante: el vocabulario de estado de RevampIT se mapea sobre el enum de Kivvi (`new → like_new`, `defect → parts_only`, desconocido → `untested`). Sin este mapeo, la validación de Kivvi rechaza el registro con un HTTP 400. Contratos pequeños, cumplidos con claridad.

### Kivitendo: un traductor, no un segundo cerebro

El otro vecino es **Kivitendo** — un ERP Perl MVC, nuestro libro contable de referencia conforme a la ley, que conservamos deliberadamente. El truco: Kivitendo **no tiene API**. Su «interfaz» es la *View* — formularios HTML para humanos —, y el controlador está acoplado a esos formularios. Cada petición es un POST de campos de formulario planos a `controller.pl?action=Part/save`, que Kivitendo reensambla en una estructura global, `$::form`.

Una escritura allí sigue el patrón **cargar → superponer → guardar**, siempre sobre el objeto *entero*. Eso tiene una consecuencia traicionera: los escalares se conservan cuando se omiten — pero **las colecciones (precios, proveedores) se borran-y-reescriben**. Envía un subconjunto, y pierdes el resto. Así que no puedes «cambiar solo un campo» sin haber cargado antes el estado completo.

¿Cómo conectas un sistema moderno a eso? No reconstruyendo la lógica de Kivitendo, sino con una fina **capa de traducción** — un servicio Node que imita a un navegador. Su único flujo: `recibir → cargar (SELECT) → mapear hacia dentro → fusionar → enviar como un POST de $::form → mapear hacia fuera → devolver`. La capa **nunca escribe SQL** por sí misma; la escritura ocurre exclusivamente a través del propio controlador de Kivitendo, de modo que su validación, historial y transacción permanecen en exactamente *un* lugar. El principio rector: **la lógica de negocio vive en Kivitendo — nosotros somos un traductor, no un segundo cerebro.**

Lo elegante: los mapeos por entidad necesarios (qué campo externo se llama cómo internamente, qué claves de formulario, qué variables personalizadas) son **generados por LLMs pequeños y locales** — extraídos del ORM y los controladores Perl de Kivitendo, comprobados de ida y vuelta contra un POST de formulario *real y capturado*. Un mapeo es correcto si y solo si reproduce un POST que Kivitendo aceptó, parámetro a parámetro. Nada se adivina. Esta pieza sigue siendo experimental (la entidad `Part` está en pie; aún no se ha endurecido contra una instancia en vivo), pero el camino está claro: un contrato limpio y versionado por fuera, la verdad inalterada de Kivitendo por dentro.

La advertencia honesta: mucho de esto está *inferido* de unas pocas capturas y de leer el código fuente, no *observado* bajo condiciones controladas. Lo menos confirmado es, precisamente, lo más importante — cómo señala Kivitendo el éxito frente al fallo (una redirección que lleva `&id=…` frente a una respuesta 200 con un cuerpo de error). Eso debería verificarse primero contra una instancia en funcionamiento. La arquitectura honesta nombra sus supuestos abiertos.

## La pieza que falta: almacén y logística

Y aquí viene la parte que aún no está terminada — nombrada a propósito, porque es el trabajo planeado para redondear el producto.

![El medio que falta: el registro de hoy da de alta un único dispositivo con un número de artículo y un puntero a ubicación y caja; entre eso y los almacenes ya listos de Kivvi, con niveles de stock y libro de movimientos, se encuentra la ausente gestión de almacén y logística — movimientos de stock reales, picking, multialmacén, transferencias.](/blog/geraete-eingang-lager.svg)

Hoy, la recepción de dispositivos es esencialmente un **registro de unidad única con una lista de control de QC y un puntero de «dónde está»**. Existe una tabla escueta `storage_locations` (nombre, tipo: almacén principal / tienda / almacén secundario / posesión de miembro / …), y la entrada de inventario lleva un `storage_location_id`, un `box_id` libre y un campo heredado `location`. Eso responde: *«¿qué estante alberga este único dispositivo?»*

Lo que **falta** es todo lo que va más allá de eso — y eso, honestamente, es la verdadera *gestión* de almacén:

- **Ningún libro de movimientos de stock.** Los contadores `quantity_reserved`/`quantity_sold` existen como columnas pero no se escriben en ninguna parte. No hay asientos de entrada/salida, ni historial de movimientos.
- **Ningún multialmacén, ninguna transferencia.** Una lista de ubicaciones plana, sin jerarquía, sin stock por almacén.
- **Ningún picking, ninguna recepción de mercancías, ningún reabastecimiento.** En resumen: ninguna gestión de almacén, solo un «dónde está qué».

La buena noticia: el punto de acoplamiento ya existe. **Kivvi trae exactamente las primitivas de stock que nos faltan** — `warehouses`, `stockLevels` (stock por producto y almacén) y un libro `stockMovements` de solo añadido con cantidades con signo. Aunque con granularidad **contable**, no **operativa**: Kivvi conoce los almacenes como un nombre y una dirección, pero sin ubicaciones, sin rutas de picking, sin transportista. Un futuro módulo de almacén de RevampIT tiene por tanto dos opciones limpias — o bien accionar directamente el `warehouseId` + `location` de Kivvi, o bien modelar la capa operativa (ubicaciones, movimientos, picking) por sí mismo y usar Kivvi como el *libro de referencia del stock* por detrás. Gracias a los webhooks bidireccionales, ambos lados se mantienen sincronizados.

¿Y Kivitendo? En principio, el almacén también podría reflejarse allí — a través de la misma capa de traducción esbozada arriba. Kivitendo tiene un concepto de almacén/stock en su modelo; un movimiento de stock sería entonces una entidad más que toma el mismo camino: cargar, fusionar, enviar como un POST de `$::form` al controlador apropiado. El mayor esfuerzo no reside en el concepto, sino en el cuidado — el stock es relevante para la contabilidad, y la semántica de «las colecciones se reemplazan» de Kivitendo exige que siempre se envíe el estado completo. Para un libro de referencia, precisamente esa cautela está justificada.

## Perspectiva

El registro está resuelto: a partir de una foto o de un nombre escrito, en segundos aparece un registro limpio, categorizado e ilustrado — ubicado en el almacén o publicado en la tienda, y sincronizado a Kivvi. La barrera que hacía que casi nadie registrara ya no está.

Lo que queda es su contraparte física: **saber dónde está cada dispositivo, y contabilizar cada movimiento limpiamente.** Esa es la próxima pieza — el puente entre nuestro registro de unidad única y el libro de stock de Kivvi, y, donde haga falta, hasta el interior de Kivitendo. Una vez que esté en pie, el círculo se cierra: desde el gesto que registra un dispositivo hasta el estante desde el que se vende — sin que nadie tenga que mantener una hoja de cálculo por el medio.
