# Integración de productos vivos: Amazon Creators API y PA API

## Estado actual de la documentación de Amazon

Revisión realizada el 1 de julio de 2026 sobre documentación oficial de Amazon:

- La documentación de Product Advertising API 5.0 indica: **“PA-API will be deprecated on May 15th, 2026. Please migrate to Creators API.”**
- También indica que el sitio de documentación de PA API ya no se mantiene y puede contener información obsoleta.
- La documentación de Creators API incluye una guía específica: **“Migrating to Creators API from Product Advertising API”**.
- Creators API ofrece operaciones equivalentes para nuestro caso: `SearchItems`, `GetItems`, `GetVariations`, `GetBrowseNodes`.
- Para precio y disponibilidad en Creators API ya no se usa `Offers.Listings`; se usa **`offersV2`**.

Conclusión operativa: **la integración nueva debe prepararse para Creators API por defecto**. PA API queda solo como proveedor legacy si una cuenta concreta todavía lo tiene activo durante transición.

## Qué mantiene seguro el proyecto

La web conserva la lógica ya creada:

- No muestra precio exacto sin dato oficial fresco.
- No muestra disponibilidad como afirmación si no viene de API oficial fresca.
- Si el dato caduca, cae a: **“Ver precio actualizado en Amazon”**.
- No se exponen claves en HTML, repo ni snapshots.
- `src/data/product-commercial.json` no contiene secretos.
- El validador falla si un precio visible está caducado.
- Si una API devuelve producto sin stock, la ficha puede proponer alternativa relacionada disponible.

## Proveedor por defecto

El script `scripts/sync-amazon-products.mjs` usa por defecto:

```bash
AMAZON_PRODUCT_API_PROVIDER=creators
```

También admite legacy:

```bash
AMAZON_PRODUCT_API_PROVIDER=paapi
```

## Variables comunes

Estas sí se pueden configurar de forma provisional:

```bash
AMAZON_PARTNER_TAG=tu-tag-de-amazon-es
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_SNAPSHOT_TTL_HOURS=24
```

## Variables para Creators API — vía recomendada

Para Amazon.es, Creators API usa marketplace `www.amazon.es`. La versión de credencial depende de lo que asigne Amazon al crearla:

- Europa v2.x: normalmente `2.2`, token endpoint Cognito EU.
- Europa v3.x: normalmente `3.2`, token endpoint Login with Amazon EU.

Variables:

```bash
AMAZON_PRODUCT_API_PROVIDER=creators
AMAZON_CREATORS_CREDENTIAL_ID=...
AMAZON_CREATORS_CREDENTIAL_SECRET=...
AMAZON_CREATORS_CREDENTIAL_VERSION=3.2
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PARTNER_TAG=...-21
```

Opcionales si Amazon entrega un endpoint específico:

```bash
AMAZON_CREATORS_TOKEN_ENDPOINT=https://api.amazon.co.uk/auth/o2/token
AMAZON_CREATORS_API_BASE=https://creatorsapi.amazon
AMAZON_CREATORS_SCOPE=creatorsapi::default
```

Defaults implementados:

- `3.2` → `https://api.amazon.co.uk/auth/o2/token`, scope `creatorsapi::default`.
- `2.2` → `https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token`, scope `creatorsapi/default`.
- API base → `https://creatorsapi.amazon`.

Headers usados para llamadas Creators API:

- `Authorization: Bearer ***` para v3.x.
- `Authorization: Bearer <token>, Version <version>` para v2.x.
- `Content-Type: application/json`.
- `x-marketplace: www.amazon.es`.

Recursos solicitados:

- `images.primary.large`
- `images.primary.medium`
- `itemInfo.title`
- `itemInfo.byLineInfo`
- `offersV2.listings.price`
- `offersV2.listings.availability`
- `offersV2.listings.condition`
- `offersV2.listings.type`
- `offersV2.listings.isBuyBoxWinner`
- `offersV2.listings.merchantInfo`

## Variables para PA API — solo legacy/transición

No configurar estas claves hasta confirmar que la cuenta concreta todavía tiene PA API funcional y que Amazon permite usarlo para esa cuenta.

```bash
AMAZON_PRODUCT_API_PROVIDER=paapi
AMAZON_PAAPI_ACCESS_KEY=...
AMAZON_PAAPI_SECRET_KEY=...
AMAZON_PAAPI_HOST=webservices.amazon.es
AMAZON_PAAPI_REGION=eu-west-1
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PARTNER_TAG=...-21
```

## Flujo recomendado ahora

1. Configurar solo:

```bash
AMAZON_PARTNER_TAG=...
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PRODUCT_API_PROVIDER=creators
```

2. Entrar en Associates Central y revisar si aparece **CreatorsAPI** en Tools.
3. Crear aplicación y credencial Creators API.
4. Guardar sin commitear:

```bash
AMAZON_CREATORS_CREDENTIAL_ID=...
AMAZON_CREATORS_CREDENTIAL_SECRET=...
AMAZON_CREATORS_CREDENTIAL_VERSION=...
```

5. Generar candidatos ASIN:

```bash
npm run sync:amazon:candidates
```

6. Revisar candidatos y copiar ASIN correcto a `src/data/amazon-product-map.json`.
7. Sincronizar snapshot comercial:

```bash
npm run sync:amazon
```

8. Build + deploy.

## Respuesta a la pregunta “¿PA API sigue siendo funcional?”

Con la documentación pública actual no conviene asumirlo para nuevas integraciones. Amazon dice que PA API será deprecada el 15/05/2026, que hay que migrar a Creators API y que PA API ya no acepta nuevos clientes. Si una cuenta ya tenía PA API antes, podría seguir funcionando durante transición hasta la fecha límite o según condiciones internas de Amazon, pero para esta web la integración correcta es **Creators API**.
