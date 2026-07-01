# Integración de productos vivos con Amazon PA API

## Decisión técnica

La vía profesional y compatible para precios, disponibilidad, enlaces e imágenes reales de Amazon es Product Advertising API 5.0 (PA API). No se debe scrapear Amazon ni copiar imágenes/precios manualmente.

## Qué sincroniza

El script `scripts/sync-amazon-products.mjs` puede traer por ASIN confirmado:

- título de Amazon;
- imagen principal real (`Images.Primary.Large`);
- URL afiliada/detail page;
- precio (`Offers.Listings.Price`);
- disponibilidad (`Offers.Listings.Availability.Message/Type`);
- elegibilidad Prime si viene en la respuesta;
- fecha de sincronización y caducidad.

Los datos se guardan en `src/data/product-commercial.json` y las fichas los muestran solo si siguen frescos. Si caducan o no existen, la web vuelve al modo seguro: “Ver precio actualizado en Amazon” y “Consultar en Amazon”.

## Archivos

- `src/data/amazon-product-map.json`: mapa de productos internos a ASIN confirmado.
- `src/data/product-commercial.json`: snapshot comercial generado, sin secretos.
- `scripts/sync-amazon-products.mjs`: cliente PA API con firma AWS SigV4, sin dependencias externas.

## Variables necesarias

Configurar en local y Vercel/cron, sin commitear secretos:

```bash
AMAZON_PAAPI_ACCESS_KEY=...
AMAZON_PAAPI_SECRET_KEY=...
AMAZON_PARTNER_TAG=...-21
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PAAPI_HOST=webservices.amazon.es
AMAZON_PAAPI_REGION=eu-west-1
AMAZON_SNAPSHOT_TTL_HOURS=24
```

## Flujo recomendado

1. Confirmar ASINs en `src/data/amazon-product-map.json`.
2. Ejecutar `npm run sync:amazon`.
3. Revisar que `src/data/product-commercial.json` contiene imagen/precio/disponibilidad.
4. Ejecutar `npm run build`.
5. Desplegar.
6. Programar una sincronización periódica + redeploy para mantener la web viva.

## Candidatos automáticos

Si hay credenciales PA API, se puede ejecutar:

```bash
npm run sync:amazon:candidates
```

Eso genera `src/data/amazon-product-candidates.json` con posibles ASINs por búsqueda. Hay que revisar antes de publicar: un primer resultado automático puede no ser exactamente el producto correcto.

## Límites reales

- PA API puede requerir cuenta de afiliado aprobada y ventas cualificadas para acceso/rate limits.
- Sin credenciales oficiales, no hay forma fiable ni compatible de mostrar precios, stock o fotos reales de Amazon de forma automatizada.
- Las reseñas de Amazon no deben copiarse. La web debe mantener análisis editorial propio.
