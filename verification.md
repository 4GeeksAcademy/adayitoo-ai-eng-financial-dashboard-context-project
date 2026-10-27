# Verificación del proyecto

Esta guía contrasta el resumen del proyecto con el código y el estado observado en esta sesión.

## Significado de los símbolos

- **✓ Confirmado:** aparece en el código o la configuración, o el comando indicado terminó correctamente.
- **✗ No coincide:** el código no implementa lo esperado o existe una discrepancia comprobada.
- **? Pendiente:** no se pudo comprobar en ejecución.

## Qué hace

- **✓** El frontend React/TypeScript solicita `GET /api/metrics`, calcula ingresos, gastos, beneficio y margen, y construye los datos mensuales de sus gráficos.
- **✓** FastAPI define `GET /health` y `GET /api/metrics`. La segunda ruta genera 360 movimientos financieros ficticios con semilla fija (`42`) y acepta filtros de fecha, categoría y tipo de operación.
- **✗** El título del dashboard está fijado a `2024 - Full Year`, pero los movimientos se generan en relación con la fecha actual. A fecha de esta verificación (octubre de 2026), el generador asigna movimientos a 2025 y 2026, no a 2024.
- **✓** El backend también define rutas B2B/B2C, facets, resumen, categorías principales, comparación y alertas; sus contratos están cubiertos por los tests de `backend/tests/test_routes.py`.

## Cómo se ejecuta y conecta

- **✓** `docker compose config --services` devuelve `backend` y `frontend`.
- **✓** Compose publica el frontend en `5173` y la API en `8000`; el contenedor frontend depende del backend.
- **✓** El frontend llama a `/api/metrics` y Vite reenvía `/api` a `http://backend:8000` dentro de la red de Compose. Desde el navegador se entra por `http://localhost:5173`; la API también queda accesible en `http://localhost:8000`.
- **✓** El README indica que se inicia el proyecto con:

	```bash
	docker compose up --build
	```

- **✓** La documentación interactiva de FastAPI está prevista en `http://localhost:8000/docs`.
- **✗** Compose no declara un `healthcheck`; que un contenedor figure como activo no asegura que la API ya responda.

## Verificación previa

- En una verificación anterior, `docker compose ps` no mostró contenedores activos y no se comprobaron respuestas HTTP. Ese resultado es histórico y no describe el estado de la revisión del 2026-10-20 que se documenta abajo.
- `pytest -q backend/tests/test_routes.py` no pudo recolectar los tests en esa verificación anterior porque el entorno del host no tenía instalado `fastapi` (`ModuleNotFoundError`). No se afirma que los tests pasen o fallen funcionalmente.

## Verificación de contratos analíticos (2026-10-20)

- **✓ Servicio iniciado:** `docker compose up --build backend`; Compose construyó la imagen y Uvicorn reportó `Application startup complete` en `http://localhost:8000`.
- **✓ Documentación abierta:** `"$BROWSER" http://localhost:8000/docs`.
- **✓ Contratos publicados:** `python3` consultó `http://localhost:8000/openapi.json`. Se confirmaron `GET /api/metrics/summary`, `GET /api/metrics/comparison` y `GET /api/metrics/alerts`, sus parámetros y schemas de respuesta.
- **✓ Respuestas ejecutadas:** se consultaron las tres rutas. Summary devolvió una lista (12 elementos en la muestra); comparison un objeto con `current_period`, `previous_period`, `delta_abs` y `delta_pct`; alerts una lista (4 elementos en la muestra).
- **✓ Patrón frontend contrastado:** búsqueda de `fetch`, `axios`, `VITE_API_BASE_URL` y `/api/metrics` bajo `frontend/src/` encontró una llamada en `frontend/src/App.tsx`, a `/api/metrics`. Las tres rutas analíticas no tienen consumidores frontend observados.
- **✓ Terminología documentada:** la especificación diferencia `net` de **Profit**, `delta_pct` de **Profit Margin** e indica que `increase_ratio` se convierte a porcentaje multiplicándolo por 100. Ver `frontend/specs/analytics-endpoints.md`.
- No se modificó código de aplicación ni se ejecutó la suite de tests como parte de este análisis de contratos.

## Cómo repetir la comprobación

Arranca los servicios y consulta sus respuestas:

```bash
docker compose up --build
```

En otra terminal:

```bash
curl -i http://localhost:8000/health
curl -i http://localhost:8000/api/metrics
```

Se espera HTTP `200` en ambos casos; `/health` debe devolver `{"status":"ok"}` y `/api/metrics` una lista JSON. Para revisar el estado de los contenedores, usa `docker compose ps`.

---

## Release Readiness Report (2026-10-27)

> Ejecutado con la skill interna `release-readiness` (`.skills/release-readiness/SKILL.md`), target **dev + prod**.

### Alcance

- **SHA:** `8b06b373a4f3355f4257bf0a1e69069c6011b531`
- **Rama:** `feature/frontend-specs`
- **Target:** `dev` (completo) y `prod` (imagen Nginx)
- **Árbol:** con cambios sin commitear (skills, contract tests, memory bank, skills-lock.json) — esperados en esta revisión.

### Tabla de checks

| # | Check | Comando | Resultado observado | Estado |
|---|-------|---------|---------------------|--------|
| 1 | Baseline | `git rev-parse HEAD`, `git status --short` | SHA `8b06b37`, rama `feature/frontend-specs`, árbol con cambios sin commitear | ✓ ejecutado |
| 2 | Backend unit tests (host) | `cd backend && python -m pytest -q` | `No module named pytest` en el host (Python 3.14, sin deps) | ? no ejecutado (dependencia faltante) |
| 2b | Backend unit tests (contenedor) | `docker compose exec backend python -m pytest -q` | **15 passed, 1 warning** (deprecación httpx/starlette) | ✓ ejecutado |
| 3 | Frontend unit tests | `cd frontend && npx vitest run src/` | **1 archivo, 8 tests, 8 passed** | ✓ ejecutado |
| 4 | Frontend build | `cd frontend && npm run build` | `tsc -b && vite build` OK, sin errores TS; **warning chunk >500 kB** (596.86 kB / 177.99 kB gzip) | ✓ ejecutado |
| 5 | Stack + readiness poll | `docker compose up --build -d` + poll `/health` | `/health` → `{"status":"ok"}` tras poll de 1s; ambos contenedores `Up` | ✓ ejecutado |
| 6a | Smoke /health | `curl -i http://localhost:8000/health` | HTTP 200 | ✓ ejecutado |
| 6b | Smoke /api/metrics | `curl -i http://localhost:8000/api/metrics` | HTTP 200, **360 items** (semilla 42) | ✓ ejecutado |
| 6c | Smoke /api/metrics/facets | `curl -i http://localhost:8000/api/metrics/facets` | HTTP 200 | ✓ ejecutado |
| 6d | Smoke categories/top | `curl -i "http://localhost:8000/api/metrics/categories/top?limit=5"` | HTTP 200 | ✓ ejecutado |
| 6e | Frontend dev + docs | `curl -i http://localhost:5173/`, `curl -i http://localhost:8000/docs` | Frontend HTTP 200, docs HTTP 200 | ✓ ejecutado |
| 7 | Contract tests | `cd frontend && npx vitest run specs/contract-tests/` | **7 archivos, 37 tests, 37 passed** (backend en marcha) | ✓ ejecutado |
| 8a | Build imagen Nginx prod | `docker build -t financial-dashboard-frontend ./frontend` | Imagen construida (usa `dist/` del build del paso 4) | ✓ ejecutado |
| 8b | Prod Nginx: índice | `docker run ... -p 8080:80` + `curl http://localhost:8080/` | HTTP 200, healthcheck → `healthy` | ✓ ejecutado |
| 8c | Prod Nginx: proxy API | `curl http://localhost:8080/api/metrics/facets` | **HTTP 504** (upstream timeout) | ✗ fallido |
| 9 | Cleanup | `docker compose down --remove-orphans` + `docker stop` de contenedores de prueba | Contenedores detenidos/eliminados, red removida | ✓ ejecutado |

### Evidencia (comandos y salidas clave)

```text
$ docker compose up --build -d
Container ...-backend-1 Started
Container ...-frontend-1 Started

$ for i in $(seq 1 20); do curl -s -m 2 http://localhost:8000/health >/dev/null && break; sleep 1; done
READY after 1s
$ curl -s http://localhost:8000/health
{"status":"ok"}

$ docker compose exec backend python -m pytest -q
15 passed, 1 warning in 0.45s

$ cd frontend && npx vitest run src/
Test Files  1 passed (1)
Tests       8 passed (8)

$ cd frontend && npm run build
✓ built in 2.84s
(!) Some chunks are larger than 500 kB after minification
dist/assets/index-BrbShF2R.js  596.86 kB | gzip: 177.99 kB

$ cd frontend && npx vitest run specs/contract-tests/
Test Files  7 passed (7)
Tests       37 passed (37)

# Target prod:
$ docker build -t financial-dashboard-frontend ./frontend   # OK
$ docker run --rm -d --name ffdash-frontend-prod --network <compose_default> \
    -e API_UPSTREAM=backend:8000 -p 8080:80 financial-dashboard-frontend
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/        # 200
$ docker inspect -f '{{json .State.Health.Status}}' ffdash-frontend-prod  # "healthy"
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/metrics/facets  # 504
```

### Hallazgo de infraestructura (bloquea target prod)

- **El proxy Nginx → backend devuelve 504** y el proxy Vite dentro del contenedor frontend también devuelve **502**.
- Diagnóstico: el backend responde correctamente desde el host (`localhost:8000` → `{"status":"ok"}`) y el puerto 8000 está abierto **dentro** del contenedor (loopback e IP `172.18.0.2`), pero **ningún otro contenedor en la red bridge `_default` consigue alcanzarlo** (timeout), ni siquiera por IP directa, ni con un backend standalone sin `--reload`, ni desde un contenedor `alpine` limpio en la misma red.
- Con `--network host`, el mismo backend es alcanzable (`{"status":"ok"}`), lo que confirma que **la aplicación funciona** y el fallo es de **red bridge de Docker en este entorno** (iptables/forwarding, típico de Codespaces), no del código.
- Implicación: en este entorno, el path dev (Vite → `backend:8000`) y el path prod (Nginx → `backend:8000`) **no pueden verificarse de extremo a extremo** vía red bridge. La verificación de contratos se hizo contra `localhost:8000` (puerto publicado al host), que sí funciona.
- **Recomendación:** en un entorno con red bridge funcional, repetir los checks 8b/8c; o usar `network_mode: host` para los servicios si se desea validar el proxy completo aquí. No es un fallo de la aplicación.

### Veredicto

**READY WITH CAVEATS** (dev) · **NOT READY** (prod, por hallazgo de infraestructura)

- Bloqueadores para prod: comunicación inter-contenedor en red bridge no funciona en este entorno (504/502); no es un defecto del código.
- Caveats: warning de chunk >500 kB en el bundle (candidato a code-splitting, relevante para `vercel-react-best-practices`); `npm test` ejecuta también los contract tests (requieren backend), por lo que el script `test` no es un indicador puro de unit tests; Compose sigue sin `healthcheck` (regla X1).
- Limpieza confirmada: `docker compose down --remove-orphans` ejecutado; contenedores de prueba `ffdash-frontend-prod` y `backend-test-noreload` detenidos; red `_default` removida.