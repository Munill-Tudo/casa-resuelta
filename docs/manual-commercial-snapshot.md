# Snapshot comercial manual sin scraping

## Decisión

No vamos a crear un bot que raspe Amazon cada pocas horas. Es frágil y puede incumplir condiciones de Amazon. Hasta tener Creators API, el camino seguro es:

- Web perfecta y útil con enlaces afiliados/search.
- Precios exactos solo cuando un operador los introduce y revisa manualmente.
- Fotos solo si vienen de una fuente autorizada/documentada —fabricante, banco propio/licenciado o herramienta oficial permitida—, no de scraping.
- Caducidad corta automática: si no se refresca, vuelve a “Ver precio actualizado en Amazon”.

## Flujo operativo

1. Exportar plantilla:

```bash
npm run manual:commercial:export
```

Genera:

```bash
data/manual-amazon-snapshot.csv
```

2. Revisar productos manualmente y rellenar solo filas verificadas:

- `detailPageUrl`: URL final de Amazon con tag si aplica.
- `asin`: opcional; se infiere si la URL contiene `/dp/ASIN`.
- `priceDisplay`: ejemplo `129,99 €`.
- `priceAmount`: ejemplo `129.99`.
- `currency`: `EUR`.
- `availabilityMessage`: ejemplo `Disponible en Amazon` o `Sin stock en la revisión`.
- `isAvailable`: `yes` / `no`.
- `capturedAt`: ISO opcional; si está vacío, se usa ahora.
- `imageUrl`: solo si la imagen está autorizada.
- `imageSource`: fuente de la imagen autorizada.
- `rightsConfirmed`: debe ser `yes` si hay imagen.

3. Importar snapshot:

```bash
npm run manual:commercial:import -- --ttl-hours 6
```

4. Validar:

```bash
npm run build
```

5. Deploy.

## Seguridad incorporada

- El script no descarga ni parsea Amazon.
- El CSV no contiene secretos.
- Si una fila tiene precio vacío, la ficha no muestra precio exacto.
- Si `expiresAt` caduca, la web deja de mostrar precio/foto comercial y vuelve al fallback seguro.
- Si se intenta importar una imagen sin `rightsConfirmed=yes` e `imageSource`, falla.
- `product-commercial.json` queda como snapshot no secreto.

## TTL recomendado

- Precios manuales Amazon: `6h` si vamos a mostrar precio exacto.
- Si el mantenimiento no será constante, mejor dejar precios ocultos y usar CTA de comprobación.

## Importante

Este sistema sirve para arrancar y conseguir tracción/ventas reales sin bloquear la web por no tener API. En cuanto Amazon active Creators API, el flujo manual debe pasar a ser secundario y la fuente principal debe ser `npm run sync:amazon` con Creators API.
