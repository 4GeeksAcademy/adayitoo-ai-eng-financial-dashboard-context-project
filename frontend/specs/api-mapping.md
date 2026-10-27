# Mapeo de respuestas API a TypeScript

Fuente del contrato: OpenAPI servido por `http://localhost:8000/openapi.json`, accesible desde Swagger UI en `/docs`. Comparado con `frontend/specs/api-types.ts` el 2026-10-20.

## Facets

Endpoint: `GET /api/metrics/facets`. OpenAPI responde con un objeto `MetricsFacets`; TypeScript usa `FacetsResponse`.

| Campo OpenAPI | Schema OpenAPI | Tipo en `api-types.ts` | Resultado |
| --- | --- | --- | --- |
| `operation_types` | Array de strings: `income`, `outcome`; requerido | `OperationType[]` | Coincide: union literal con los mismos dos valores. |
| `business_types` | Array de strings: `B2B`, `B2C`; requerido | `BusinessType[]` | Coincide: union literal con los mismos dos valores. |
| `categories` | Array de strings: `suppliers`, `sales`, `operational`, `administrative`, `others`; requerido | `Category[]` | Coincide: union literal con los mismos cinco valores. |
| `min_date` | `string`, formato `date`; requerido | `ISODate` | Coincide en intención y es más específico en TypeScript; ver discrepancia de formato abajo. |
| `max_date` | `string`, formato `date`; requerido | `ISODate` | Coincide en intención y es más específico en TypeScript; ver discrepancia de formato abajo. |

## Alertas

Endpoint: `GET /api/metrics/alerts`. OpenAPI responde con `MetricsAlert[]`; TypeScript usa `AlertsResponse` (`AlertEntry[]`).

| Campo OpenAPI | Schema OpenAPI | Tipo en `api-types.ts` | Resultado |
| --- | --- | --- | --- |
| `period` | `string`; requerido | `string` | Coincide. Los formatos esperados dependen de `group_by`, pero OpenAPI no declara un patrón. |
| `outcome_total` | `number`; requerido | `number` | Coincide. |
| `baseline_average` | `number`; requerido | `number` | Coincide. |
| `increase_ratio` | `number`; requerido | `number` | Coincide. |

## Categorías principales

Endpoint: `GET /api/metrics/categories/top`. OpenAPI responde con `TopCategoryItem[]`; TypeScript usa `TopCategoriesResponse` (`CategoryEntry[]`).

| Campo OpenAPI | Schema OpenAPI | Tipo en `api-types.ts` | Resultado |
| --- | --- | --- | --- |
| `category` | String enum: `suppliers`, `sales`, `operational`, `administrative`, `others`; requerido | `Category` | Coincide: mismos valores literales. |
| `operation_type` | String enum: `income`, `outcome`; requerido | `OperationType` | Coincide: mismos valores literales. |
| `total_amount` | `number`; requerido | `number` | Coincide. |

## Discrepancias y límites

- **Sin discrepancias de campos ni valores:** las propiedades JSON, campos requeridos, valores enumerados, números y respuestas de array/objeto coinciden con OpenAPI.
- **Fechas (`min_date`, `max_date`):** OpenAPI expresa `string` con `format: date`. `ISODate` restringe la forma en TypeScript, pero `${number}-${number}-${number}` no comprueba el calendario ni garantiza todos los detalles del formato `YYYY-MM-DD` (por ejemplo, meses/días con dos dígitos). El tipo es una ayuda estática, no un validador de datos recibidos.
- **`period`:** la propiedad es `string` tanto en OpenAPI como en TypeScript. La descripción JSDoc enumera los formatos usuales para día, semana y mes, pero OpenAPI no impone un patrón ni una unión de formatos; esa precisión es documental, no una garantía del contrato.
- `business_type` filtra la petición de categorías, pero no aparece en cada elemento de respuesta OpenAPI ni en `CategoryEntry`. Para comparar segmentos se realizan solicitudes separadas con `business_type=B2B` y `business_type=B2C`.
