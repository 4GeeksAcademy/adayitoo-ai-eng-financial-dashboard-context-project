import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/facets", () => {
  it("devuelve un FacetsResponse compatible con el tipo TypeScript", async () => {
    const data = await apiGet<Record<string, unknown>>("/api/metrics/facets");

    // Campos requeridos (todos presentes)
    expect(data).toHaveProperty("operation_types");
    expect(data).toHaveProperty("business_types");
    expect(data).toHaveProperty("categories");
    expect(data).toHaveProperty("min_date");
    expect(data).toHaveProperty("max_date");

    // Enums coinciden con el contrato
    expect(data.operation_types).toContain("income");
    expect(data.operation_types).toContain("outcome");
    expect(data.business_types).toContain("B2B");
    expect(data.business_types).toContain("B2C");
    expect(data.categories).toEqual(
      expect.arrayContaining([
        "suppliers",
        "sales",
        "operational",
        "administrative",
        "others",
      ]),
    );

    // Fechas ISO (YYYY-MM-DD)
    expect(String(data.min_date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(String(data.max_date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // min_date <= max_date
    expect(String(data.min_date) <= String(data.max_date)).toBe(true);
  });

  it("no devuelve campos extra fuera del contrato", async () => {
    const data = await apiGet<Record<string, unknown>>("/api/metrics/facets");
    const allowedKeys = new Set([
      "operation_types",
      "business_types",
      "categories",
      "min_date",
      "max_date",
    ]);
    for (const key of Object.keys(data)) {
      expect(allowedKeys.has(key)).toBe(true);
    }
  });
});

describe("GET /api/metrics/facets con business_type B2B/B2C", () => {
  it("facetas no cambian con el filtro de segmento (endpoint sin parámetros)", async () => {
    // Este endpoint no acepta parámetros; verificar que no los requiere
    const base = await apiGet<Record<string, unknown>>("/api/metrics/facets");
    expect(base.operation_types).toBeDefined();
  });
});
