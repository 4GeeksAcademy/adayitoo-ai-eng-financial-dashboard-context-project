/**
 * Shared helpers for consumer-driven contract tests.
 * These tests validate that real backend responses match the TypeScript
 * types declared in `specs/api-types.ts` and `specs/param-types.ts`.
 *
 * Usage: start the backend (`docker compose up --build backend -d`)
 * and run `npx vitest run specs/contract-tests/` from `frontend/`.
 */

/** Base URL of the backend API. Override with CONTRACT_API_BASE env var. */
export const API_BASE =
  process.env.CONTRACT_API_BASE ?? "http://localhost:8000";

/** Fetch JSON from the API and throw a descriptive error on non-200. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(
      `GET ${path} → HTTP ${response.status}: ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

/** Build a query string from a record, skipping undefined/null values. */
export function queryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}
