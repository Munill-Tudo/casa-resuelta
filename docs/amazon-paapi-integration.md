# Integración de productos vivos: Amazon Creators API y PA API legacy

## Decisión ejecutiva — revisión 2026-07-02

La integración nueva debe ir preparada para **Amazon Creators API** por defecto. No debemos introducir `AMAZON_PAAPI_ACCESS_KEY` ni `AMAZON_PAAPI_SECRET_KEY` ahora.

Comprobado en documentación oficial de Amazon:

- PA API 5.0 muestra el aviso: **“PA-API will be deprecated on May 15th, 2026. Please migrate to Creators API.”**
- La misma página indica que la documentación PA API ya no se mantiene y puede contener información obsoleta.
- Amazon remite a `https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction`.
- Creators API documenta la migración desde PA API y dice que los clientes PA API existentes deben migrar.
- Creators API ofrece las operaciones necesarias para nuestro caso: `SearchItems`, `GetItems`, `GetVariations`, `GetBrowseNodes`.
- El locale/marketplace de España aparece como **Spain → `https://www.amazon.es`**.
- Creators API usa OAuth 2.0 con `Credential ID`, `Credential Secret` y `Version`; las claves AWS Access Key/Secret Key de PA API no sirven para Creators API.

## Respuestas concretas

### ¿PA API sigue siendo funcional para Amazon.es en nuestra cuenta?

**No se puede confirmar sin entrar en Associates Central de esa cuenta o ejecutar una llamada real con credenciales vigentes.**

Pero para una integración nueva la respuesta operativa es: **no basarse en PA API**. La documentación pública oficial ya la marca como deprecada con fecha 15/05/2026 y remite a Creators API. Si la cuenta conserva acceso legacy, debe tratarse solo como transición y no como base del proyecto.

### ¿Amazon exige Creators API para nuevas integraciones?

**Sí, para este proyecto debemos asumir Creators API como vía correcta.** Amazon documenta Creators API como sustituto/migración de PA API y la propia documentación de PA API remite allí.

### ¿Qué se puede configurar provisionalmente ahora?

Variables no sensibles, válidas para dejar preparadas:

```bash
AMAZON_PARTNER_TAG=tu-tag-de-amazon-es
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PRODUCT_API_PROVIDER=creators
AMAZON_SNAPSHOT_TTL_HOURS=24
```

No configurar todavía:

```bash
AMAZON_PAAPI_ACCESS_KEY=
AMAZON_PAAPI_SECRET_KEY=
```

## Variables exactas — Creators API, vía recomendada

Requeridas cuando Amazon active/entregue la credencial:

```bash
AMAZON_PRODUCT_API_PROVIDER=creators
AMAZON_PARTNER_TAG=...-21
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_CREATORS_CREDENTIAL_ID=...
AMAZON_CREATORS_CREDENTIAL_SECRET=...
AMAZON_CREATORS_CREDENTIAL_VERSION=...
AMAZON_SNAPSHOT_TTL_HOURS=24
```

Opcionales si Amazon entrega endpoints/scope explícitos o cambia la versión:

```bash
AMAZON_CREATORS_TOKEN_ENDPOINT=...
AMAZON_CREATORS_API_BASE=https://creatorsapi.amazon
AMAZON_CREATORS_SCOPE=...
```

Defaults implementados en `scripts/sync-amazon-products.mjs`:

- `AMAZON_PRODUCT_API_PROVIDER`: `creators`.
- `AMAZON_MARKETPLACE`: `www.amazon.es`.
- `AMAZON_CREATORS_CREDENTIAL_VERSION`: `3.2`, salvo que Amazon indique otra.
- `AMAZON_CREATORS_API_BASE`: `https://creatorsapi.amazon`.
- Credencial `3.2` → token endpoint `https://api.amazon.co.uk/auth/o2/token`, scope `creatorsapi::default`.
- Credencial `2.2` → token endpoint `https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token`, scope `creatorsapi/default`.

Recursos solicitados en Creators API:

```text
images.primary.large
images.primary.medium
itemInfo.title
itemInfo.byLineInfo
offersV2.listings.price
offersV2.listings.availability
offersV2.listings.condition
offersV2.listings.type
offersV2.listings.isBuyBoxWinner
offersV2.listings.merchantInfo
```

## Variables exactas — PA API, solo legacy si se confirma cuenta activa

No usarlas salvo confirmación explícita en Associates Central o test real de cuenta.

```bash
AMAZON_PRODUCT_API_PROVIDER=paapi
AMAZON_PARTNER_TAG=...-21
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PAAPI_ACCESS_KEY=...
AMAZON_PAAPI_SECRET_KEY=...
AMAZON_PAAPI_HOST=webservices.amazon.es
AMAZON_PAAPI_REGION=eu-west-1
AMAZON_SNAPSHOT_TTL_HOURS=24
```

## ¿Debe adaptarse `scripts/sync-amazon-products.mjs`?

**Ya está preparado para Creators API como proveedor por defecto.** Mantiene PA API como proveedor legacy opcional, pero el flujo principal es:

```bash
AMAZON_PRODUCT_API_PROVIDER=creators npm run sync:amazon:candidates
AMAZON_PRODUCT_API_PROVIDER=creators npm run sync:amazon
```

Contrato de salida seguro en `src/data/product-commercial.json`:

- `asin`
- `title`
- `brand`
- `detailPageUrl`
- `image`, si viene de fuente permitida
- `price`, solo si viene fresco de API/snapshot válido
- `availability`
- `fetchedAt`
- `expiresAt`
- `source`
- `error`, si no se obtiene dato seguro

## Seguridad que no se toca

La web debe mantener siempre:

- Datos frescos con `fetchedAt` y `expiresAt`.
- TTL explícito.
- Si el precio caduca o falta, fallback a **“Ver precio actualizado en Amazon”**.
- Sin claves en HTML, repo, snapshots ni cliente.
- Validación de precios caducados antes de build/deploy.
- Enlaces afiliados con `rel="sponsored nofollow noopener"`.
- Aviso de afiliación visible.

## Flujo recomendado ahora

1. Configurar solo variables no sensibles:

```bash
AMAZON_PARTNER_TAG=...-21
AMAZON_MARKETPLACE=www.amazon.es
AMAZON_PRODUCT_API_PROVIDER=creators
```

2. Entrar en Associates Central de Amazon.es y comprobar si aparece **CreatorsAPI** en Tools.
3. Crear aplicación y credencial Creators API.
4. Guardar fuera del repo:

```bash
AMAZON_CREATORS_CREDENTIAL_ID=...
AMAZON_CREATORS_CREDENTIAL_SECRET=...
AMAZON_CREATORS_CREDENTIAL_VERSION=...
```

5. Generar candidatos:

```bash
npm run sync:amazon:candidates
```

6. Revisar candidatos y copiar ASIN correcto a `src/data/amazon-product-map.json`.
7. Sincronizar snapshot comercial:

```bash
npm run sync:amazon
```

8. Ejecutar build/validación y desplegar.

## Fuentes oficiales revisadas

- PA API 5.0 documentation: `https://webservices.amazon.com/paapi5/documentation/`
- PA API 5.0 documentation, locale ES: `https://webservices.amazon.es/paapi5/documentation/`
- Creators API introduction: `https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction`
- Creators API migration guide: sección “Migrating to Creators API from Product Advertising API” en la documentación de Creators API.
- Creators API locale reference: sección “Locale Reference”, Spain → `https://www.amazon.es`.
