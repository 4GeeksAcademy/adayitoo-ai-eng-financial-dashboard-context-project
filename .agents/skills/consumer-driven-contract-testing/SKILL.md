---
name: consumer-driven-contract-testing
description: Automate verification of API contracts between backend (FastAPI/Pydantic) and frontend (TypeScript). Write tests that validate real backend responses against the TypeScript types declared in specs/. Use when asked to "add contract tests", "verify API contracts", "prevent breaking changes", "add integration tests", or "validate API types".
license: MIT
metadata:
  author: 4GeeksAcademy
  version: "1.0.0"
---

# Consumer-Driven Contract Testing (CDCT)

Ensure that backend API responses remain compatible with frontend TypeScript types by writing automated tests that validate real HTTP responses against the declared shape.

## Why contract testing?

In this project, the backend exposes financial analytics endpoints and the frontend declares TypeScript types for their responses (`specs/api-types.ts`, `specs/param-types.ts`). Without contract tests:

- A renamed field in Pydantic silently delivers `undefined` to React components.
- A changed parameter type may be accepted by FastAPI but produce wrong results.
- A removed endpoint breaks the frontend with no early warning.

Contract tests close this gap by running the backend and verifying every response field against the expected TypeScript type.

## When to apply

Apply this skill when:

- Adding a **new endpoint** to `backend/app/routes.py`.
- **Modifying** an existing Pydantic model that the frontend consumes.
- **Connecting** a previously backend-only endpoint to the frontend (per rule A3).
- **Reviewing** a PR that changes API contracts.
- **Setting up CI** for the first time — contract tests run without a browser.

## How it works

```
┌─────────────────────────────────────────────────────┐
│  Contract Test (Vitest)                             │
│  1. Start backend (or connect to running instance)  │
│  2. Make HTTP request to endpoint                   │
│  3. Assert status + body shape matches TypeScript   │
│  4. Assert field types and constraints               │
└─────────────────────────────────────────────────────┘
```

Tests live in `frontend/specs/contract-tests/` and use Vitest with standard `fetch`.

## Test patterns

### Basic shape validation

```typescript
import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:8000';

describe('GET /api/metrics/facets', () => {
  it('responde con FacetsResponse válido', async () => {
    const res = await fetch(`${API_BASE}/api/metrics/facets`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toMatchShape({
      operation_types: ['income', 'outcome'],
      business_types: ['B2B', 'B2C'],
      categories: expect.any(Array),
      min_date: expect.any(String),
      max_date: expect.any(String),
    });
  });
});
```

### Array response validation

```typescript
describe('GET /api/metrics/alerts', () => {
  it('cada alerta cumple AlertEntry', async () => {
    const res = await fetch(`${API_BASE}/api/metrics/alerts`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);

    data.forEach(alert => {
      expect(alert).toHaveShape({
        period: expect.any(String),
        outcome_total: expect.any(Number),
        baseline_average: expect.any(Number),
        increase_ratio: expect.any(Number),
      });
    });
  });
});
```

### Parameterized endpoint validation

```typescript
describe('GET /api/metrics/categories/top', () => {
  it.each([
    { operation_type: 'income', limit: 5 },
    { operation_type: 'outcome', limit: 3 },
  ])('acepta $operation_type con limit $limit', async (params) => {
    const query = new URLSearchParams(params);
    const res = await fetch(`${API_BASE}/api/metrics/categories/top?${query}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBeLessThanOrEqual(params.limit);
    data.forEach(item => {
      expect(item).toHaveShape({
        category: expect.any(String),
        operation_type: params.operation_type,
        total_amount: expect.any(Number),
      });
    });
  });
});
```

### Business segment comparison

```typescript
describe('GET /api/metrics/categories/top (B2B vs B2C)', () => {
  it('B2B y B2C devuelven categorías diferentes', async () => {
    const b2b = await fetch(`${API_BASE}/api/metrics/categories/top?business_type=B2B`).then(r => r.json());
    const b2c = await fetch(`${API_BASE}/api/metrics/categories/top?business_type=B2C`).then(r => r.json());

    expect(b2b.length).toBeGreaterThan(0);
    expect(b2c.length).toBeGreaterThan(0);
  });
});
```

## Project structure

```
frontend/specs/
├── api-types.ts              # Tipos de respuesta
├── param-types.ts            # Tipos de parámetros
├── type-tests.ts             # Fixtures de tipo (satisfies checks)
├── contract-tests/           # ← tests de contrato (nuevos)
│   ├── facets-contract.test.ts
│   ├── alerts-contract.test.ts
│   ├── categories-contract.test.ts
│   ├── summary-contract.test.ts
│   ├── comparison-contract.test.ts
│   └── README.md             # Cómo ejecutar los tests
└── verification-report.md    # Auditoría manual histórica
```

## Running the tests

```bash
# 1. Start the backend
docker compose up --build backend -d

# 2. Wait for health
curl -s http://localhost:8000/health

# 3. Run contract tests from the frontend directory
cd frontend && npx vitest run specs/contract-tests/
```

## Rules

### C1 — Test the real backend, not mocks
Contract tests must hit a running backend instance. Mocking defeats the purpose.

### C2 — Validate shape, do not copy exact values
The backend generates random data. Assert structural compatibility (field names, types, enums) — not specific numeric values.

### C3 — Cover every endpoint the frontend declares types for
If a type exists in `api-types.ts` or `param-types.ts`, a corresponding contract test must exist. This includes endpoints not yet integrated into the UI.

### C4 — Fail on extra or missing fields
Use strict shape matchers that reject undocumented fields and flag missing required fields.

### C5 — Validate parameter combinations
Test parameter boundary values (`limit=1`, `limit=20`), enum values, nullable fields, and default values.

### C6 — Keep tests close to the type declarations
Place contract tests in `frontend/specs/contract-tests/` so they are co-located with the types they validate.

## Related rules in this project

| Rule | Connection |
|------|-----------|
| **A1** (api-contracts.md) | Contract tests enforce A1 automatically |
| **A3** (frontend-backend-integration.md) | Contract tests confirm an endpoint is consumable before UI integration |
| **T1** (endpoint-testing.md) | Contract tests complement backend unit tests |
| **M1** (verification-evidence.md) | Contract tests replace manual verification with repeatable evidence |