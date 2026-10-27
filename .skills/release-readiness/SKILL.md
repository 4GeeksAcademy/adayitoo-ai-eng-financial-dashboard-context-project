---
name: release-readiness
description: Repo-specific workflow to verify a Financial Metrics Dashboard change is releasable. Use when asked to "prepare a release", "verify the change is done", "run pre-merge checks", "smoke-test the stack", "build the production image", or "confirm the dashboard is deployable". Covers the Docker Compose dev loop, the test suites, the consumer contract tests, the endpoint smoke checks, and the Nginx production image for this repository only.
license: MIT
metadata:
  author: 4GeeksAcademy
  version: "1.0.0"
---

# Release Readiness — Financial Metrics Dashboard

Project-internal skill. Defines what "done and deployable" means for **this**
repository. It is intentionally narrow: it assumes the monorepo layout
(`backend/` FastAPI + `frontend/` React/Vite) and the Compose/Nginx tooling that
already ships in the repo.

## Objective

Produce a single, repeatable verdict — **READY** or **NOT READY** — on whether
the current working tree can be released, by executing every verification step
this project requires and recording the evidence. The skill exists because the
repo has these known gaps:

- `docker-compose.yml` declares `depends_on` but **no `healthcheck`**, so
  "container started" is not "API ready" (rule X1).
- Verification separated in `verification.md` must distinguish **declared**,
  **test-covered**, and **actually executed** states (rule M1).
- The frontend has a **production Nginx image** with an `API_UPSTREAM` env var
  that is not exercised by the dev Compose loop, so dev-green ≠ prod-ready.
- Consumer contract tests require a running backend and are easy to forget.

## Inputs

| Input | Where it comes from | Required |
|-------|--------------------|----------|
| Working tree under review | `git status` / current checkout | Yes |
| Target of the checks | `dev` (default) or `prod` (build Nginx image) | No (defaults to `dev`) |
| Backend base URL for smoke + contract tests | `http://localhost:8000` (override with `CONTRACT_API_BASE`) | Yes for test/smoke steps |
| Frontend dev URL | `http://localhost:5173` | Yes for dev smoke |
| Tooling | Docker + Docker Compose, Node 24 (or frontend `node_modules/`), Python 3.13 for the backend image | Yes |

## Output

A markdown **Release Readiness Report** written to
`verification.md` (append a dated section) with, at minimum:

1. **Scope** — commit SHA (`git rev-parse HEAD`), branch, and target (`dev`/`prod`).
2. **Check table** — one row per check with command, observed result, and status
   (`✓ executed`, `✗ failed`, `? not run`, with the reason).
3. **Evidence** — the exact commands run and their key output lines.
4. **Verdict** — `READY`, `READY WITH CAVEATS`, or `NOT READY`, plus a short list
   of blockers or unverified items.
5. **Cleanup confirmation** — containers stopped/removed as part of the check.

The report must never upgrade a check that could not run into a pass (rule M1).

## Procedure

Run the checks in order. Stop and mark `NOT READY` on the first hard failure
(a real `✗`), but keep recording the remaining steps as `? not run`.

### Step 1 — Baseline

```bash
git rev-parse HEAD
git status --short
```

Record the SHA and whether the tree is clean. Untracked build artifacts
(`node_modules/`, `backend/__pycache__/`, `.pytest_cache/`) are expected and are
not blockers.

### Step 2 — Backend tests (unit)

```bash
cd backend
python -m pytest -q
```

- Pass → record the collected/passed count.
- `ModuleNotFoundError: No module named 'fastapi'` → mark `? not run` with the
  missing-dependency reason; **do not** record it as a failure or a pass
  (matches rule M1 and the history in `verification.md`).

### Step 3 — Frontend unit tests

```bash
cd frontend
npx vitest run          # or: npm test
```

Must pass. Report the file/test counts.

### Step 4 — Frontend production build (type-check + bundle)

```bash
cd frontend
npm run build           # runs `tsc -b && vite build`
```

This proves the TypeScript project compiles and the production bundle is
generated. It does **not** run the contract tests (those live under `specs/`,
outside `tsconfig.app.json`'s `include: ["src"]`).

### Step 5 — Start the stack and wait for real readiness

```bash
docker compose up --build -d
# Poll /health because Compose has no healthcheck (rule X1):
for i in $(seq 1 20); do
  if curl -s -m 2 http://localhost:8000/health >/dev/null; then break; fi
  sleep 1
done
curl -s http://localhost:8000/health   # expect {"status":"ok"}
```

Never treat `docker compose ps` showing "running" as proof the API answers.

### Step 6 — API smoke checks (dev)

```bash
curl -i http://localhost:8000/health
curl -i http://localhost:8000/api/metrics
curl -i "http://localhost:8000/api/metrics/facets"
curl -i "http://localhost:8000/api/metrics/categories/top?limit=5"
```

Expect HTTP `200` for each. For `/api/metrics`, the body is a JSON list
(360 items with the fixed seed). Also open the interactive docs at
`http://localhost:8000/docs` to confirm the app mounted.

### Step 7 — Consumer contract tests

```bash
cd frontend
npx vitest run specs/contract-tests/     # or: npm run test:contract
```

All contract tests must pass against the **running** backend. These validate
that real responses match the types in `frontend/specs/api-types.ts` and
`param-types.ts`. If the backend is offline, restart Step 5 first.

### Step 8 — Prod target only (Nginx image)

Skip unless target is `prod`.

```bash
docker build -t financial-dashboard-frontend ./frontend
docker run --rm -d --name ffdash-frontend-prod \
  --network <same-network-as-backend> \
  -e API_UPSTREAM=backend:8000 \
  -p 8080:80 financial-dashboard-frontend
# Smoke: index + proxied API
curl -i http://localhost:8080/
curl -i http://localhost:8080/api/metrics/facets
docker stop ffdash-frontend-prod
```

Confirm the Nginx `HEALTHCHECK` reports healthy and that `/api/...` is proxied
to `API_UPSTREAM`. A green dev loop does not cover this path.

### Step 9 — Cleanup

```bash
docker compose down --remove-orphans
```

Record that containers were stopped/removed.

### Step 10 — Write the report

Append a dated section to `verification.md` using the structure in **Output**.
Fill the check table from the actual command output captured above.

## Acceptance criteria

The skill passes only when **all** of the following hold:

- [ ] A `verification.md` section exists for the current SHA, dated, with scope
      (SHA + branch + target) explicitly stated.
- [ ] Every check has a row with a command, observed result, and one of
      `✓ executed` / `✗ failed` / `? not run` + reason.
- [ ] Backend unit tests: executed and passing, **or** recorded as `? not run`
      with the missing-dependency reason (never silently omitted or upgraded).
- [ ] Frontend unit tests: executed and passing, with counts recorded.
- [ ] `npm run build` completed without TypeScript or Vite errors.
- [ ] `/health` returned `{"status":"ok"}` after an explicit readiness poll
      (not merely a "running" container).
- [ ] The four API smoke endpoints each returned HTTP `200`.
- [ ] Contract tests (`specs/contract-tests/`) executed and passing while the
      backend was up.
- [ ] For `prod`: the Nginx image built, served `/`, and proxied `/api/...` to
      `API_UPSTREAM`.
- [ ] A final verdict (`READY` / `READY WITH CAVEATS` / `NOT READY`) is stated,
      with blockers or unverified items listed.
- [ ] Cleanup was performed and confirmed in the report.

## Failure handling

- **Backend tests can't collect** (no `fastapi`): record `? not run` with the
  exact `ModuleNotFoundError`. Do not fail the release on an environment issue;
  note it as a caveat.
- **Contract tests fail**: treat as `✗`. Investigate whether the Pydantic model
  or the TypeScript type changed; fix the divergence before release. (See the
  `consumer-driven-contract-testing` skill.)
- **`/api/metrics?business_type=...` behavior**: this endpoint currently ignores
  `business_type` (documented 2026-10-27). Do not use it as a smoke assertion for
  segment filtering; use `/api/metrics/b2b` and `/api/metrics/b2c` instead.
- **Ports busy** (5173/8000/5678): resolve before re-running; do not skip the
  readiness poll.

## Related project rules

| Rule | Connection |
|------|-----------|
| **X1** (`service-readiness.md`) | This skill enforces the readiness poll it recommends |
| **X2** (`cors-environments.md`) | Prod target should verify CORS is not `*` |
| **M1** (`verification-evidence.md`) | The report structure implements it |
| **T1** (`endpoint-testing.md`) | Backend unit tests are Step 2 |
