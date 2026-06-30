# Changelog

## v1.3.0 — 2026-06-30

- Changed: contenido adaptado al informe técnico TSA evolucionado: capa transaccional + capa inbound, criterios de decisión, aviso Amazon y enlaces `rel="sponsored nofollow noopener"`.
- Added: 90 productos reales iniciales enlazados a Amazon por búsqueda/producto, sin precios manuales ni claims de disponibilidad.
- Added: índices SEO `/mejores/`, `/comparativas/`, `/guias/`, `/reviews/` y `/marcas/` para reforzar arquitectura SILO/cluster.
- Changed: páginas de artículo con Top 3 real, comparativa rápida, microcopy de precios, metodología TSA y CTAs “Ver precio en Amazon”.

## v1.2.0 — 2026-06-30

- Changed: cambio de marca visible de Casa Resuelta a **Con Buen Ojo**.
- Changed: claim actualizado a “Productos para casa elegidos con criterio”.
- Changed: logo textual del header/footer a “OJO” y favicon adaptado a icono de ojo/lupa.
- Changed: textos legales, contacto, afiliación, metadatos y paquete actualizados con la nueva marca.

## v1.1.0 — 2026-06-30

- Changed: rediseño visual inspirado en referencias GearLab/comparadores/ofertas: cabecera con búsqueda, barra de categorías, tarjetas tipo ranking, score visual, sidebar editorial y páginas de review con comparativa rápida.
- Changed: home orientada a marketplace editorial/ecommerce, menos landing genérica y más navegación por categorías/productos.
- Changed: plantilla de artículos con veredicto, score, cards de producto y criterios visibles.
- Verification: `npm run build` OK; 53 páginas generadas; revisión local en home y artículo P1.

## v1.0.0 — 2026-06-30

- Added: primera implementación de Con Buen Ojo según SOP.
- Added: home, categorías, metodología, afiliación, legales, contacto, sitemap y robots.
- Added: 30 URLs iniciales con estructura editorial, tablas comparativas y aviso afiliado.
- Deployment: Vercel production en https://casa-resuelta.vercel.app/.
- Verification: `npm run build` OK; 53 páginas generadas; sitemap con 53 URLs; smoke local y live 200 OK en home y artículo P1.
