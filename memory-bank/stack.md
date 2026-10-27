# Stack

- Frontend: React `^19.2.4`, React DOM `^19.2.4`, TypeScript `~6.0.2` y Vite `^8.0.4`. Fuente: `frontend/package.json`.
- Interfaz y gráficos: Tailwind CSS `^4.2.2`, plugin Vite de Tailwind `^4.2.2` y Recharts `^3.8.1`. Fuente: `frontend/package.json`.
- Pruebas y calidad del frontend: Vitest `^4.1.4` y ESLint `^9.39.4`; los scripts disponibles son `test`, `test:watch`, `test:coverage`, `test:contract`, `lint` y `build`. Fuente: `frontend/package.json`.
- Pruebas de contrato (CDCT): `npm run test:contract` ejecuta `vitest run specs/contract-tests/`; validan las respuestas reales del backend contra los tipos de `frontend/specs/api-types.ts` y `param-types.ts` y requieren el backend en marcha. Fuente: `frontend/specs/contract-tests/README.md`, `.agents/skills/consumer-driven-contract-testing/SKILL.md`.
- Backend: las dependencias declaradas son FastAPI, Uvicorn con extras `standard`, debugpy, pytest, pytest-cov y httpx; `requirements.txt` no fija versiones. Fuente: `backend/requirements.txt`.
- Imagen del backend: `python:3.13-slim`; instala `backend/requirements.txt` y arranca Uvicorn mediante debugpy en el puerto 8000. Fuente: `backend/Dockerfile`.
- Imagen del frontend: `node:24-alpine`; instala dependencias npm y ejecuta Vite en el puerto 5173. Fuente: `frontend/Dockerfile`.
- Compose publica los puertos 5173 para frontend y 8000 y 5678 para backend. Fuente: `docker-compose.yml`.
- Skills del ecosistema aplicadas: `accessibility` (`addyosmani/web-quality-skills`) y `vercel-react-best-practices` (`vercel-labs/agent-skills`), en `.agents/skills/`. Fuente: `skills-lock.json`.
- Skills internas del proyecto: `consumer-driven-contract-testing` (`.agents/skills/consumer-driven-contract-testing/`, con tests en `frontend/specs/contract-tests/`) y `release-readiness` (`.skills/release-readiness/SKILL.md`, workflow de release/deploy para este repo). Fuente: `skills-lock.json`, `AGENTS.md`.
- Registry de skills: `skills-lock.json` en la raíz; lista cada skill con `source`, `sourceType`, `skillPath` y `computedHash`. Fuente: `skills-lock.json`.
- Workflow de release readiness: la skill interna `release-readiness` define el proceso para verificar que un cambio es desplegable (tests backend/frontend, `npm run build`, readiness poll de `/health`, smoke checks, contract tests e imagen Nginx de producción). Fuente: `.skills/release-readiness/SKILL.md`.