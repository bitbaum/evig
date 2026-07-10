---
title: "Por qué la tienda es el marketplace"
excerpt: "En Revamp-IT, tienda significa a partir de ahora marketplace: un camino de compra rápido para electrónica usada de Revamp-IT y de otros proveedores."
author: "RevampIT Team"
featuredImage: "/blog/shop-products.svg"
category: "Produkt"
tags:
  - shop
  - design-system
  - reparatur
  - ssot
publishedAt: "2026-06-16"
published: true
---

La pregunta de la tienda partía de una premisa falsa. No necesitamos una segunda página de tienda que, junto al marketplace, explique dónde se puede comprar. Quien hace clic en "Tienda" quiere ver productos, compararlos y llegar lo antes posible a la decisión de compra. Por eso la tienda online es ahora el marketplace.

Esto reduce la carga cognitiva. Hay un lugar canónico para la electrónica usada: `/marketplace`. Las antiguas URLs `/shop` se mantienen como redirects, pero la nueva navegación, el sitemap, las sugerencias del chatbot y los helpers internos apuntan al marketplace. Los usuarios aterrizan directamente en la búsqueda, los filtros y los anuncios en lugar de en una selección de canal.

Desde el punto de vista del negocio, este es el default correcto. El marketplace puede reunir los anuncios de Revamp-IT y los anuncios de otros proveedores. Las ofertas de Revamp-IT se marcan como tales cuando están explícitamente flagueadas de esa forma o cuando provienen de una dirección de staff bajo `@revamp-it.ch` o bien `@revampit.ch`. Así surge un mercado mental sencillo: buscar todo, reconocer la fuente, comprar.

Desde el punto de vista del diseño, la disciplina es la misma que en nuestras otras superficies endurecidas: sin grandes tarjetas alternativas, sin caminos secundarios equivalentes, sin textos de CTA poco claros. La primera tarea es comprar. Filtrar, buscar y las páginas de detalle deben ser rápidos y necesitar poca explicación.

Desde el punto de vista de la ingeniería, la decisión elimina una bifurcación. `/shop`, `/shop/search`, `/shop/category/...` y `/shop/product/...` son entradas legacy al marketplace. Al sitemap ya no se añaden viejas páginas de productos de la tienda. Los helpers de URL generan URLs del marketplace, para que los nuevos enlaces no reactiven accidentalmente la vieja arquitectura.

La otra gran tarea del usuario sigue siendo la reparación y la ayuda informática. Ahí, el punto de entrada canónico no es un nuevo proceso paralelo, sino `/it-hilfe/create` para describir el problema y `/it-hilfe/techniker` para técnicos y talleres. La solicitud permanece en el sistema; el matching y el diagnóstico pueden construirse sobre ella.

Como Payrexx todavía no está configurado en producción, la plataforma puede funcionar hasta el clic de pago, pero no debe generar pagos falsos en producción. Por eso el checkout del marketplace, el pago de citas y el pago de workshops se detienen con un mensaje claro de configuración, antes de modificar inventario, citas o plazas. Esto es más honesto y más seguro que un pago de demostración que parece real.
