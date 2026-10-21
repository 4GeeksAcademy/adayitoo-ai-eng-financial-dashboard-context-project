# Contrato de datos del dashboard

Fuente: OpenAPI publicado en `http://localhost:8000/openapi.json` y Swagger UI en `/docs`. Los ejemplos siguientes se capturaron del backend en ejecución el 2026-10-20; los valores pueden variar cuando cambie la fecha del sistema porque el período de los datos simulados depende de la fecha actual.

## Facetas

**Endpoint:** `GET /api/metrics/facets`  
**Parámetros de consulta:** ninguno.

**Respuesta:** objeto JSON `MetricsFacets`, tipado como `FacetsResponse` en `frontend/specs/api-types.ts`.

```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2025-10-02",
  "max_date": "2026-09-28"
}
```

Los cinco campos son requeridos. `operation_types`, `business_types` y `categories` son arrays de enums; `min_date` y `max_date` son strings con `format: date` (`YYYY-MM-DD`).

## Alertas

**Endpoint:** `GET /api/metrics/alerts`  
**Respuesta `200`:** array JSON de `MetricsAlert`; usar `AlertsResponse` y `AlertEntry` en `frontend/specs/api-types.ts`.

| Parámetro | Tipo OpenAPI | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `threshold` | number, mínimo `0` | No | Aumento relativo mínimo; predeterminado `0.3`. |
| `group_by` | string enum | No | `day`, `week` o `month`; predeterminado `month`. |
| `start_date` | string `format: date` o `null` | No | Inicio inclusivo del rango. |
| `end_date` | string `format: date` o `null` | No | Fin inclusivo del rango. |
| `business_type` | string enum `B2B`/`B2C` o `null` | No | Filtra el segmento de negocio. |

Cada alerta contiene cuatro campos requeridos: `period` (string), `outcome_total` (number), `baseline_average` (number) e `increase_ratio` (number). Ejemplo observado:

```json
[
  {
    "period": "2025-12",
    "outcome_total": 103378.98,
    "baseline_average": 51174.1,
    "increase_ratio": 1.0201
  },
  {
    "period": "2026-03",
    "outcome_total": 88076.9,
    "baseline_average": 56456.19,
    "increase_ratio": 0.5601
  },
  {
    "period": "2026-06",
    "outcome_total": 80212.01,
    "baseline_average": 57857.4,
    "increase_ratio": 0.3864
  },
  {
    "period": "2026-08",
    "outcome_total": 82189.37,
    "baseline_average": 60357.08,
    "increase_ratio": 0.3617
  }
]
```

## Categorías

**Endpoint:** `GET /api/metrics/categories/top`  
**Respuesta `200`:** array JSON de `TopCategoryItem`; usar `TopCategoriesResponse` y `CategoryEntry` en `frontend/specs/api-types.ts`.

| Parámetro | Tipo OpenAPI | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `operation_type` | string enum `income`/`outcome` | No | Tipo de operación; predeterminado `outcome`. |
| `limit` | integer de `1` a `20` | No | Cantidad máxima de categorías; predeterminado `5`. |
| `start_date` | string `format: date` o `null` | No | Inicio inclusivo del rango. |
| `end_date` | string `format: date` o `null` | No | Fin inclusivo del rango. |
| `business_type` | string enum `B2B`/`B2C` o `null` | No | Filtra el segmento; se consulta cada segmento por separado para compararlos. |

Cada elemento contiene tres campos requeridos: `category` (enum de categorías), `operation_type` (`income` o `outcome`) y `total_amount` (number). Ejemplos observados con `operation_type=outcome&limit=2`:

**B2B**

```json
[
  {"category": "others", "operation_type": "outcome", "total_amount": 127890.6},
  {"category": "operational", "operation_type": "outcome", "total_amount": 127593.34}
]
```

**B2C**

```json
[
  {"category": "others", "operation_type": "outcome", "total_amount": 96537.84},
  {"category": "operational", "operation_type": "outcome", "total_amount": 68499.88}
]
```

## Casos de Error

Los endpoints y schemas de error que publica OpenAPI se deben distinguir de respuestas observadas o valores predeterminados del framework.

| Estado | Evidencia y formato |
| --- | --- |
| `400 Bad Request` | No está declarado como respuesta por estos endpoints ni se observó durante la comprobación. El backend no tiene un manejador de errores 400 propio, así que este código y su cuerpo no forman parte del contrato actual. Las validaciones de parámetros probadas devuelven `422`, no `400`. |
| `404 Not Found` | Una ruta inexistente se comprobó en ejecución y devolvió `application/json`: `{"detail":"Not Found"}`. No es una respuesta `404` declarada en los schemas de las tres operaciones. |
| `500 Internal Server Error` | No hay un manejador ni schema `500` específico en la app/OpenAPI, y no se indujo un fallo interno. Con `FastAPI(debug=False)`, la respuesta genérica de Starlette es texto `text/plain` con cuerpo `Internal Server Error`; el servidor o infraestructura puede sustituirla. No debe tratarse como un contrato JSON estable. |
| `422 Unprocessable Entity` | Es la respuesta de validación que OpenAPI sí declara para alertas y categorías. Se comprobó, por ejemplo, con `limit=0`: `application/json` con forma `{"detail":[{"type":"greater_than_equal","loc":["query","limit"],"msg":"Input should be greater than or equal to 1","input":"0","ctx":{"ge":1}}]}`. La forma general es `{"detail":[ValidationError, ...]}`. |

`/api/metrics/facets` no declara parámetros de consulta ni respuesta `422` en su operación OpenAPI.
