# Especificación de endpoints analíticos del frontend

Estado: análisis del contrato existente; no implica que estos endpoints estén integrados en la interfaz.

Base local: `http://localhost:8000`. En desarrollo, el frontend puede usar rutas relativas `/api/...` a través del proxy de Vite. Los contratos se contrastaron con Swagger UI (`/docs`), OpenAPI (`/openapi.json`) y respuestas HTTP en ejecución el 2026-10-20.

## Resumen financiero

`GET /api/metrics/summary`

Devuelve una lista de agregados financieros. Cada elemento contiene:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `period` | string | Período como `YYYY-MM`, `YYYY-Www` o fecha ISO, según `group_by`. |
| `income` | number | Total de ingresos del período. |
| `outcome` | number | Total de gastos/salidas del período. |
| `net` | number | Ingresos menos gastos/salidas. |

Parámetros de consulta opcionales:

| Parámetro | Valores / formato | Predeterminado |
| --- | --- | --- |
| `group_by` | `day`, `week`, `month` | `month` |
| `start_date`, `end_date` | Fecha ISO `YYYY-MM-DD` | Sin límite |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, `others` | Sin filtro |
| `operation_type` | `income`, `outcome` | Sin filtro |
| `business_type` | `B2B`, `B2C` | Sin filtro |

Los filtros de fecha incluyen sus límites. `net` se calcula como `income - outcome`.

## Comparación de períodos

`GET /api/metrics/comparison`

Devuelve un objeto:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `current_period` | number | Neto del rango solicitado. |
| `previous_period` | number | Neto del rango anterior calculado por el backend. |
| `delta_abs` | number | Diferencia entre netos: actual menos anterior. |
| `delta_pct` | number o `null` | Variación porcentual frente al neto anterior; es `null` si el neto anterior es cero. |

Parámetros:

| Parámetro | Valores / formato | Requerido |
| --- | --- | --- |
| `start_date`, `end_date` | Fecha ISO `YYYY-MM-DD` | Sí |
| `business_type` | `B2B`, `B2C` | No |

El backend determina el rango previo a partir de las fechas recibidas. No acepta filtros de categoría ni tipo de operación en esta ruta.

## Alertas de gastos

`GET /api/metrics/alerts`

Devuelve una lista de alertas, cada una con:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `period` | string | Clave del período agrupado. |
| `outcome_total` | number | Gastos/salidas totales del período. |
| `baseline_average` | number | Promedio de gastos/salidas de períodos anteriores. |
| `increase_ratio` | number | Aumento relativo frente al promedio; por ejemplo, `0.30` equivale a un 30 %. |

Parámetros opcionales:

| Parámetro | Valores / formato | Predeterminado |
| --- | --- | --- |
| `threshold` | Número mayor o igual que `0` | `0.3` |
| `group_by` | `day`, `week`, `month` | `month` |
| `start_date`, `end_date` | Fecha ISO `YYYY-MM-DD` | Sin límite |
| `business_type` | `B2B`, `B2C` | Sin filtro |

Se genera una alerta cuando el aumento relativo supera el umbral y existe un promedio anterior positivo. Esta ruta no admite filtros de categoría ni tipo de operación.

## Integración frontend

El patrón existente está en `frontend/src/App.tsx`: obtiene la base desde `VITE_API_BASE_URL` (vacía por defecto), llama `fetch`, comprueba `response.ok`, lanza un error para estados HTTP no exitosos y luego lee JSON. La llamada actual es solo `GET /api/metrics`; no hay consumidores para las tres rutas de esta especificación.

Guías para una futura integración:

- Mantener la base de URL configurable y construir los parámetros con `URLSearchParams`.
- Definir tipos de respuesta específicos para cada ruta y conservar en el transporte los nombres JSON del backend.
- Seguir el manejo existente de carga, error y reintento; validar estados HTTP antes de procesar el cuerpo.
- Mantener el cálculo/presentación del frontend separado de los contratos HTTP, especialmente para porcentajes y etiquetas.

## Terminología del producto y nombres de API

No cambiar estos nombres en el backend ni en el JSON para hacerlos coincidir con las etiquetas del producto; aplicar cualquier alias solo en la capa de presentación:

- El dashboard presenta **Profit** (`KPIMetrics.profit`), mientras el resumen API lo denomina `net`. Ambos representan ingresos menos gastos/salidas.
- **Profit Margin** (`profitPercent`) es el beneficio dividido por los ingresos y multiplicado por 100. No equivale a `delta_pct`, que mide el cambio del neto actual respecto al anterior.
- La interfaz usa **Total Outcome** y conceptos de gasto/egreso; el contrato también usa `outcome` y sus derivados `outcome_total`. En textos orientados al usuario pueden mostrarse como gastos, pero se debe mantener el nombre API en los tipos de transporte.
- `increase_ratio` es una razón decimal, no un porcentaje ya escalado: para presentarlo como porcentaje se multiplica por 100.