# Consumer-Driven Contract Tests

These tests validate that the real backend API responses are compatible with the
TypeScript types declared in `frontend/specs/api-types.ts` and `frontend/specs/param-types.ts`.

They implement the **Consumer-Driven Contract Testing** skill defined in
`.agents/skills/consumer-driven-contract-testing/SKILL.md`.

## Why they exist

The backend exposes financial analytics endpoints; the frontend declares types for their
responses but previously had no automated guarantee that the contract stayed valid.
A field rename in Pydantic, a changed parameter type, or a removed endpoint would
silently break the frontend with no early warning. These tests close that gap.

## Coverage

| Endpoint | Type validated | File |
|----------|----------------|------|
| `GET /api/metrics` | `FinancialMovement[]` | `metrics-contract.test.ts` |
| `GET /api/metrics/facets` | `FacetsResponse` | `facets-contract.test.ts` |
| `GET /api/metrics/alerts` | `AlertEntry[]` | `alerts-contract.test.ts` |
| `GET /api/metrics/categories/top` | `CategoryEntry[]` | `categories-contract.test.ts` |
| `GET /api/metrics/summary` | `MetricsSummaryItem[]` | `summary-contract.test.ts` |
| `GET /api/metrics/comparison` | `MetricsComparison` | `comparison-contract.test.ts` |
| `GET /api/metrics/b2b` | `FinancialMovement[]` | `b2b-b2c-contract.test.ts` |
| `GET /api/metrics/b2c` | `FinancialMovement[]` | `b2b-b2c-contract.test.ts` |

## How to run

### Prerequisites

- Backend running and reachable. Start it with:

  ```bash
  docker compose up --build backend -d
  ```

- Verify health:

  ```bash
  curl -s http://localhost:8000/health
  # → {"status":"ok"}
  ```

### Run the tests

From the `frontend/` directory:

```bash
cd frontend
npx vitest run specs/contract-tests/
```

To point at a different backend origin (e.g. a deployed instance):

```bash
CONTRACT_API_BASE=https://api.example.com npx vitest run specs/contract-tests/
```

## Conventions

- **Test the real backend** — never mock the API. Mocks defeat the purpose.
- **Validate shape, not exact values** — the backend generates random data.
  Assert field presence, types, enums, and invariants (e.g. `net = income - outcome`),
  not specific numbers.
- **Cover every endpoint with a declared type** — if a type exists in
  `api-types.ts`/`param-types.ts`, a contract test must exist.
- **Fail on extra or missing fields** — strict checks catch undocumented
  contract drift.

## When to update

- A Pydantic model changes → update the corresponding test.
- A new endpoint is added → add a new test file.
- A type in `api-types.ts` changes → update the matching contract test.
