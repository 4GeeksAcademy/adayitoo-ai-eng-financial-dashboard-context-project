# Estado actual

- El HEAD observado es `6292fbd5e50c8cda5c3f53021e8b40f4bb63c4c4`, con asunto `docs: hallazgos de ingeniería y reglas propuestas`; el historial reciente también incluye `0d12e92` y `954f812`. Fuente: salida de `git log -5 --oneline` y `git log -1 --format=%H%n%s`.
- Antes de crear este banco de memoria, `git status --short` no imprimió cambios. Fuente: salida vacía de `git status --short`.
- La suite backend no pudo recolectarse: `pytest -q backend/tests/test_routes.py` terminó con `ModuleNotFoundError: No module named 'fastapi'`. Esto no confirma un fallo funcional de los tests. Fuente: salida del comando `pytest -q backend/tests/test_routes.py`.
- La suite frontend no se ejecutó: `npm --prefix frontend test` terminó con `sh: 1: vitest: not found`. Fuente: salida del comando `npm --prefix frontend test`.
- El encabezado del dashboard fija `2024 - Full Year`, mientras el generador de movimientos calcula años en función de `date.today()`. Fuente: `frontend/src/App.tsx`, `backend/app/routes.py`.
- El generador determinista llama a `random.seed(seed)`, que cambia el estado aleatorio global del proceso. Fuente: `backend/app/routes.py`.
- CORS está configurado con `allow_origins=["*"]` y `allow_credentials=True`. Fuente: `backend/app/main.py`.
- `build_metrics_facets` indexa el primer y último elemento de la lista ordenada sin un caso vacío explícito. Fuente: `backend/app/routes.py`.
- El frontend solicita `/api/metrics`; no se observan solicitudes a las otras rutas analíticas en el flujo de `App`. Fuente: `frontend/src/App.tsx`, `backend/app/routes.py`.

## Skills aplicadas (2026-10-27)

Hasta la fecha se han aplicado tres skills en este repositorio:

| Skill | Origen | Ubicación | Estado |
|-------|--------|-----------|--------|
| `accessibility` | Comunidad (`addyosmani/web-quality-skills`) | `.agents/skills/accessibility/` | ✅ Aplicada (commit `ff7ac6f`) |
| `vercel-react-best-practices` | Comunidad (`vercel-labs/agent-skills`) | `.agents/skills/vercel-react-best-practices/` | ✅ Aplicada (commit `8b06b37`) |
| `consumer-driven-contract-testing` | Interna (creada y aplicada) | `.agents/skills/consumer-driven-contract-testing/` | ✅ Aplicada (37 tests en `specs/contract-tests/`) |

Las dos primeras son skills del ecosistema; la tercera se creó como skill interna del proyecto y luego se aplicó con tests ejecutables. La skill interna `release-readiness` (`.skills/`) se creó después y se **ejecutó como procedimiento el 2026-10-27** (ver sección "Ejecución de la skill Release Readiness" más abajo).

## Skill aplicada: Consumer-Driven Contract Testing (2026-10-27)

Se añadió la skill **`consumer-driven-contract-testing`** en `.agents/skills/consumer-driven-contract-testing/SKILL.md` y su implementación ejecutable en `frontend/specs/contract-tests/`.

### Justificación

- El backend expone 8 endpoints analíticos; el frontend declara tipos TypeScript para sus respuestas en `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`, pero **no existía ninguna prueba automatizada** que validara que las respuestas reales del backend cumplen esos tipos. La única verificación era manual y puntual (`frontend/specs/verification-report.md`, 2026-10-20).
- Un renombrado de campo en un modelo Pydantic, un cambio de tipo de parámetro o la eliminación de una ruta romperían el frontend silenciosamente: los tests backend verifican forma de respuesta con `assert set(keys) == {...}`, pero no contra los tipos TypeScript consumidos.
- La verificación de contratos automatizada **complementa** las reglas **A1** (`api-contracts.md`, mantener contratos sincronizados) y **A3** (`frontend-backend-integration.md`, conectar capacidades backend antes de integrarlas), aportando una barrera automatizada contra regresiones.
- Es la skill no aplicada con mayor valor para el estado actual del proyecto y el menor coste de implementación: reutiliza los tipos ya declarados y la infraestructura de Vitest existente.

### Implementación

- **8 archivos de contrato** en `frontend/specs/contract-tests/`: `metrics`, `facets`, `alerts`, `categories`, `summary`, `comparison`, `b2b-b2c` + helpers + README.
- **37 tests** que validan presencia de campos, tipos, enums, invariantes (`net = income - outcome`, `delta_abs = current - previous`, ordenación cronológica) y el rechazo `422` de parámetros fuera de rango.
- Script `npm run test:contract` (`vitest run specs/contract-tests/`).
- Los tests **no** se ejecutan en `npm run build` (viven en `specs/`, fuera del `include: ["src"]` de `tsconfig.app.json`); requieren un backend en ejecución (`docker compose up --build backend -d`).

### Hallazgo detectado por los contract tests

- **`GET /api/metrics` ignora el parámetro `business_type`.** El handler `get_metrics` en `backend/app/routes.py` no lo declara en su firma, por lo que `?business_type=B2C` devuelve los 360 movimientos (203 B2B + 157 B2C) en lugar de filtrar. Confirmado con `curl` el 2026-10-27. Contradice `frontend/specs/analytics-endpoints.md`, que documenta `business_type` como opcional en esa ruta. Para filtrar por segmento deben usarse `/api/metrics/b2b` y `/api/metrics/b2c`. El test fija el comportamiento observado para que corregir el contrato provoque un fallo intencional.

### Verificación ejecutada

- `docker compose up --build -d backend`; `curl http://localhost:8000/health` → `{"status":"ok"}`.
- `npx vitest run specs/contract-tests/` → **7 archivos, 37 tests, 37 passed** (2026-10-27).

## Cambios verificados (2026-10-27)

Tras aplicar las skills del ecosistema y crear la skill interna, se verificaron los cambios en ejecución y en estado:

- **Contract tests en ejecución:** `npx vitest run specs/contract-tests/` → **7 archivos, 37 tests, 37 passed** contra el backend real (`docker compose up --build -d backend`; `/health` → `{"status":"ok"}`). Fuente: ejecución del 2026-10-27.
- **Hallazgo `business_type`:** `GET /api/metrics` ignora el parámetro `business_type` (no declarado en la firma de `get_metrics`); devuelve los 360 movimientos sin filtrar. Contradice `frontend/specs/analytics-endpoints.md`. Para filtrar por segmento se usan `/api/metrics/b2b` y `/api/metrics/b2c`. Fuente: `backend/app/routes.py`, `frontend/specs/contract-tests/metrics-contract.test.ts`, confirmado con `curl` el 2026-10-27.
- **Skills aplicadas en el árbol:** `accessibility` (commits `ff7ac6f`), `vercel-react-best-practices` (commit `8b06b37`), `consumer-driven-contract-testing` (trabajo sin commitear en `feature/frontend-specs`). Fuente: `git log --oneline`, `git status --short`.
- **Skill interna creada:** `.skills/release-readiness/SKILL.md` (registrada en `skills-lock.json`). Fuente: estructura del workspace y `skills-lock.json`.
- **Árbol de trabajo:** rama `feature/frontend-specs` con cambios sin commitear en `frontend/package.json`, `memory-bank/*`, `skills-lock.json`, y archivos nuevos en `.agents/skills/consumer-driven-contract-testing/`, `.skills/` y `frontend/specs/contract-tests/`. Fuente: `git status --short` (2026-10-27).

## Skill del ecosistema elegida: Consumer-Driven Contract Testing

### Por qué se eligió

- El backend expone **8 endpoints analíticos**; el frontend declara tipos TypeScript para sus respuestas en `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`, pero **no existía ninguna prueba automatizada** que validara que las respuestas reales cumplen esos tipos.
- Un cambio silencioso en el backend (renombrado de campo, cambio de tipo, ruta eliminada) rompería el frontend sin que los tests unitarios lo detectaran. Los tests backend verifican forma con `assert set(keys) == {...}`, pero no contra los tipos consumidos.
- Es la skill no aplicada con **mayor valor y menor coste**: reutiliza tipos ya declarados e infraestructura Vitest existente, y complementa las reglas **A1** (`api-contracts.md`) y **A3** (`frontend-backend-integration.md`).
- Fuente: `.agents/skills/consumer-driven-contract-testing/SKILL.md`, `memory-bank/estado-actual.md`.

## Skill interna creada: Release Readiness (2026-10-27)

Se creó la skill interna **`release-readiness`** en `.skills/release-readiness/SKILL.md` para cubrir un gap que las skills del ecosistema no cubren bien: el **workflow de release/deployment readiness** de este repositorio.

### Por qué es necesaria

- `docker-compose.yml` declara `depends_on` pero **no tiene `healthcheck`**: que un contenedor figure como activo no asegura que la API responda (regla **X1**).
- El bucle dev con Compose usa Vite; la **imagen Nginx de producción** (`API_UPSTREAM=backend:8000`) no se ejercita en dev, por lo que dev-green ≠ prod-ready.
- Los contract tests requieren backend en ejecución y son fáciles de olvidar en un release.
- `verification.md` debe distinguir lo **declarado**, lo **cubierto por tests** y lo **ejecutado** (regla **M1**); el reporte de la skill implementa esta distinción.

### Estructura (tipo clase)

- **Objetivo:** producir un veredicto único (`READY` / `READY WITH CAVEATS` / `NOT READY`) ejecutando cada verificación y registrando la evidencia.
- **Inputs:** working tree, target (`dev`/`prod`), backend/frontend URLs, tooling.
- **Output:** Release Readiness Report con SHA, tabla de checks (✓/✗/? con motivo), evidencia, veredicto y confirmación de cleanup.
- **Procedimiento:** 10 pasos (baseline git SHA → tests backend → tests frontend → `npm run build` → levantar stack + poll `/health` → smoke checks → contract tests → imagen Nginx prod → cleanup → escribir reporte).
- **Criterios de aceptación:** 11 checks con checkbox que exigen evidencia real de cada paso.
- **Relación con reglas:** X1 (readiness poll), X2 (CORS en prod), M1 (evidencia verificable), T1 (tests unitarios).

### Nota de ubicación

La skill se guardó en `.skills/` por solicitud explícita del usuario, mientras la convención documentada en `AGENTS.md`/`README.md` es `.agents/skills/`. Queda registrada en `skills-lock.json` con `skillPath: ".skills/release-readiness/SKILL.md"`. Si se prefiere uniformidad con la convención, se puede mover a `.agents/skills/release-readiness/`.

## Ejecución de la skill Release Readiness (2026-10-27)

La skill `release-readiness` se **ejecutó de principio a fin** y generó el primer Release Readiness Report real en `verification.md`.

### Resultado por paso (resumen)

| Paso | Resultado |
|------|-----------|
| Baseline (SHA `8b06b37`, rama `feature/frontend-specs`) | ✓ |
| Backend tests | ✓ **15 passed** en contenedor (host: `?` sin pytest) |
| Frontend unit tests | ✓ **8 passed** (`npx vitest run src/`) |
| `npm run build` | ✓ sin errores TS; warning chunk >500 kB |
| Stack + poll `/health` | ✓ `{"status":"ok"}` (poll 1s) |
| Smoke checks (4 endpoints) | ✓ HTTP 200 ×4, 360 items |
| Contract tests | ✓ **37 passed** (7 archivos) |
| Imagen Nginx prod | build ✓, índice 200, healthcheck healthy; **proxy API 504** |
| Cleanup | ✓ `docker compose down` + contenedores de prueba detenidos |

### Hallazgo de infraestructura (red bridge)

- La app funciona (backend alcanzable desde host y por `--network host`), pero **la red bridge de Docker en este entorno no permite comunicación inter-contenedor**: `backend:8000` da timeout desde el contenedor frontend (proxy Vite → 502), desde la imagen Nginx prod (proxy → 504), desde un contenedor `alpine` limpio en la misma red, e incluso por IP directa. No es un defecto del código.
- Veredicto del reporte: **READY WITH CAVEATS** para dev; **NOT READY** para prod (bloqueado por el hallazgo de red).
- Caveats adicionales: bundle >500 kB (candidato a code-splitting); `npm test` ejecuta también contract tests (requiere backend), no es un indicador puro de unit tests; Compose sin `healthcheck` (regla X1).
- Fuente: `verification.md` (sección "Release Readiness Report", 2026-10-27), ejecución real de la skill.