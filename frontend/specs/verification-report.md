# Reporte de auditoría de tipos API

Fecha: 2026-10-20  
Fuente: OpenAPI servido en `http://localhost:8000/openapi.json` (la especificación de Swagger UI en `/docs`).  
Archivos auditados: `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`.

## Endpoints verificados

| Endpoint | Forma de respuesta OpenAPI | Tipo TypeScript asociado |
| --- | --- | --- |
| `GET /api/metrics/facets` | Objeto `MetricsFacets` | `FacetsResponse` |
| `GET /api/metrics/alerts` | Lista de `MetricsAlert` | `AlertsResponse` / `AlertEntry` |
| `GET /api/metrics/categories/top` | Lista de `TopCategoryItem` | `TopCategoriesResponse` / `CategoryEntry` |

## Comparación de respuestas

| Tipo TypeScript | Campos comparados con OpenAPI | Estado |
| --- | --- | --- |
| `FacetsResponse` | `operation_types`, `business_types`, `categories`, `min_date`, `max_date`; todos requeridos. Enums y fechas coinciden con `MetricsFacets`. | **Aprobado** |
| `AlertEntry` | `period`, `outcome_total`, `baseline_average`, `increase_ratio`; los cuatro campos son requeridos y sus tipos coinciden con `MetricsAlert`. | **Aprobado** |
| `AlertsResponse` | Alias de array equivalente a la respuesta OpenAPI `MetricsAlert[]`. | **Aprobado** |
| `CategoryEntry` | `category`, `operation_type`, `total_amount`; los tres campos son requeridos y enums/tipos coinciden con `TopCategoryItem`. | **Aprobado** |
| `TopCategoriesResponse` | Alias de array equivalente a la respuesta OpenAPI `TopCategoryItem[]`. | **Aprobado** |

No se encontraron campos omitidos, campos extra, discrepancias de nombres (camelCase/snake_case), ni diferencias entre los tipos de respuesta JSON y TypeScript.

## Comparación de parámetros

| Tipo TypeScript | Contrato OpenAPI verificado | Estado |
| --- | --- | --- |
| `GroupBy` | `day`, `week`, `month`. | **Aprobado** |
| `DateRangeFilter` | `start_date` y `end_date`: opcionales, fecha `string` con `format: date` o `null`. | **Aprobado tras corrección** |
| `AlertsParams` | `threshold`: number, mínimo `0`, default `0.3`; `group_by`: enum anterior, default `month`; `start_date`, `end_date`, `business_type`: opcionales y anulables; `business_type`: enum `B2B`, `B2C`. | **Aprobado tras corrección** |
| `TopCategoriesParams` | `operation_type`: enum `income`, `outcome`, default `outcome`; `limit`: integer entre `1` y `20`, default `5`; fechas y `business_type` opcionales y anulables. | **Aprobado tras corrección** |

### Discrepancia encontrada y corregida

OpenAPI declara `start_date`, `end_date` y `business_type` con `anyOf` que permite tanto el valor correspondiente como `null`. Inicialmente `param-types.ts` permitía omitir estos campos, pero no asignarles `null`. Se añadieron las uniones `| null` en `DateRangeFilter`, `AlertsParams` y `TopCategoriesParams`. No se encontraron otras propiedades ausentes o sobrantes.

## Limitaciones de representación

- OpenAPI especifica `limit` como `integer`; TypeScript no tiene un tipo numérico entero primitivo, por lo que se representa con `number`. El rango `1..20` y el requisito de entero están documentados en JSDoc y validados por el backend.
- OpenAPI marca las fechas como `format: date`; `ISODate` es una aproximación estática y no valida que mes y día formen una fecha real.
- `period` es `string` sin patrón en OpenAPI; TypeScript conserva ese tipo amplio.

Estas son diferencias entre la expresividad de OpenAPI y TypeScript, no discrepancias de campos o propiedades.

## Verificación ejecutada

- Se consultaron `/openapi.json`, los parámetros y los schemas `MetricsFacets`, `MetricsAlert` y `TopCategoryItem` con el backend en ejecución.
- Compilación estricta de tipos y fixtures:

  ```bash
  ./node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target ES2023 --moduleResolution bundler --module ESNext specs/api-types.ts specs/param-types.ts specs/type-tests.ts
  ```

- Resultado: compilación correcta después de corregir la nulabilidad de los parámetros.
