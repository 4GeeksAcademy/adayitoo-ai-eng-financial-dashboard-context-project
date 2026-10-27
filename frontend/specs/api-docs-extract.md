# Extracción de contratos API desde OpenAPI

Fuente consultada: `http://localhost:8000/openapi.json`, la especificación que sirve Swagger UI en `/docs`. Fecha de consulta: 2026-10-20. Los nombres JSON se reproducen tal cual están definidos por el backend.

## `GET /api/metrics/facets`

**Respuesta `200`:** objeto `MetricsFacets` (no es una lista). No declara parámetros de consulta.

| Campo de respuesta | Schema OpenAPI | Requerido | Valores / formato |
| --- | --- | --- | --- |
| `operation_types` | `array[string]` | Sí | Elementos: `income`, `outcome`. |
| `business_types` | `array[string]` | Sí | Elementos: `B2B`, `B2C`. |
| `categories` | `array[string]` | Sí | Elementos: `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `min_date` | `string` | Sí | `format: date`. |
| `max_date` | `string` | Sí | `format: date`. |

El schema declara los cinco campos como requeridos. `business_types` es el conjunto de segmentos disponibles; no representa una vista seleccionada en la respuesta.

## `GET /api/metrics/alerts`

**Respuesta `200`:** `array` de objetos `MetricsAlert`.

| Campo de cada objeto | Schema OpenAPI | Requerido | Valores / formato |
| --- | --- | --- | --- |
| `period` | `string` | Sí | Sin `enum` ni patrón declarado. |
| `outcome_total` | `number` | Sí | Total de gastos del período. |
| `baseline_average` | `number` | Sí | Promedio de referencia. |
| `increase_ratio` | `number` | Sí | Razón del aumento. |

Parámetros de consulta:

| Parámetro | Schema OpenAPI | Requerido | Valor predeterminado / restricción |
| --- | --- | --- | --- |
| `threshold` | `number` | No | `0.3`; mínimo `0`. |
| `group_by` | `string` | No | `month`; enum `day`, `week`, `month`. |
| `start_date` | `string` o `null` | No | `format: date`. |
| `end_date` | `string` o `null` | No | `format: date`. |
| `business_type` | `string` o `null` | No | Enum `B2B`, `B2C`. |

Todos los campos de `MetricsAlert` (`period`, `outcome_total`, `baseline_average`, `increase_ratio`) son requeridos en OpenAPI.

## `GET /api/metrics/categories/top`

**Respuesta `200`:** `array` de objetos `TopCategoryItem`.

| Campo de cada objeto | Schema OpenAPI | Requerido | Valores / formato |
| --- | --- | --- | --- |
| `category` | `string` | Sí | Enum `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `operation_type` | `string` | Sí | Enum `income`, `outcome`. |
| `total_amount` | `number` | Sí | Total monetario de la categoría. |

Parámetros de consulta:

| Parámetro | Schema OpenAPI | Requerido | Valor predeterminado / restricción |
| --- | --- | --- | --- |
| `operation_type` | `string` | No | `outcome`; enum `income`, `outcome`. |
| `limit` | `integer` | No | `5`; mínimo `1`, máximo `20`. |
| `start_date` | `string` o `null` | No | `format: date`. |
| `end_date` | `string` o `null` | No | `format: date`. |
| `business_type` | `string` o `null` | No | Enum `B2B`, `B2C`. |

Todos los campos de `TopCategoryItem` (`category`, `operation_type`, `total_amount`) son requeridos en OpenAPI. `business_type` filtra la consulta y no forma parte de cada elemento de respuesta.

## Comparación directa con los tipos frontend

El contrato de `MetricsFacets` se representa como `FacetsResponse`; `MetricsAlert[]` como `AlertsResponse` (`AlertEntry[]`); y `TopCategoryItem[]` como `TopCategoriesResponse` (`CategoryEntry[]`). Los enums, nombres de propiedades, campos obligatorios y formas de objeto/lista coinciden con `frontend/specs/api-types.ts`.

Matices de representación TypeScript:

- OpenAPI expresa `number` para cantidades y razones, y `integer` para `limit`; TypeScript usa `number` para ambos porque no tiene un tipo entero primitivo. El límite entero de `limit` se valida en la API y está descrito en `frontend/specs/param-types.ts`.
- OpenAPI marca las fechas con `format: date`; en TypeScript se usa el alias `ISODate`, que no valida por sí solo que el valor sea una fecha calendario válida.
- OpenAPI define `period` como `string` sin patrón. Sus formatos usuales dependen de `group_by`, pero no están impuestos por el schema.
