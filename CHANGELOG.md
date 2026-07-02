# Changelog

## v1.3.6 — 2026-07-02

- Changed: Amazon product-data integration documented as Creators API-first after rechecking official Amazon docs; PA API remains legacy-only until account-level access is confirmed.
- Added: `.env.example` with safe provisional Amazon variables and server-only Creators credential placeholders; `.gitignore` now allows committing this template without real `.env` files.
- Changed: Amazon product map notes now refer to Creators API candidates instead of PA API; sync script missing-credential messages warn against PA API by default.
- Verification: official PA API and Creators API documentation reviewed; `npm run build` OK; missing-credentials dry runs preserve safe fallback.

## v1.3.5 — 2026-07-02

- Fixed: coherencia editorial entre veredictos rápidos y Top 3 en páginas money; eliminadas menciones a modelos que no estaban en la selección visible.
- Changed: el bloque Top 3 muestra el ranking numérico y deja el posicionamiento real en `bestFor`, evitando etiquetas genéricas que chocaban con el criterio editorial.
- Verification: `npm run build` OK; auditoría de coherencia producto/veredicto OK; smoke local de 6 páginas corregidas OK.

## v1.3.4 — 2026-07-02

- Changed: 10 páginas money incorporan bloque de decisión de compra segura: comprar si, mejor no comprar si y comprobaciones antes de abrir Amazon.
- Changed: CTAs reforzados hacia ficha recomendada y Amazon con `rel="sponsored nofollow noopener"`, manteniendo el fallback de precio actualizado sin mostrar importes estáticos.
- Changed: recomendaciones por perfil enlazan ahora a ficha interna y verificación de precio actualizado.
- Verification: `npm run build` OK; 30 artículos, 14 categorías, 28 P1 y 88 fichas producto validadas; smoke local de las 10 páginas money OK.

## v1.3.3 — 2026-07-01

- Changed: 10 páginas money reforzadas con decisión rápida, veredicto, criterios, errores y cierre específicos por categoría.
- Changed: plantilla de artículos preparada para usar bloques editoriales específicos y mantener fallback genérico en el resto de guías.
- Verification: `npm run build` OK; 30 artículos, 14 categorías, 28 P1 y 88 fichas producto validadas; 147 páginas generadas.

## v1.3.2 — 2026-06-30

- Changed: barra superior reorientada al comprador: comparar rápido, elegir según la casa y evitar compras que no encajan.
- Changed: aviso de afiliación en artículos reducido a título visible y botón de “Más info” hacia la página de afiliación.

## v1.3.1 — 2026-06-30

- Fixed: eliminadas referencias internas/no orientadas al visitante en home, guías, reviews, marcas y páginas legales.
- Changed: bloque de metodología en artículos reescrito como criterios de compra visibles para usuario final.
- Changed: métricas internas de la home sustituidas por beneficios comprensibles para el comprador.

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
