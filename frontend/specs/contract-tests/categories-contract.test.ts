import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/categories/top", () => {
  it("devuelve TopCategoryItem[] compatible con el tipo TypeScript", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/categories/top",
    );

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    data.forEach((item) => {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("operation_type");
      expect(item).toHaveProperty("total_amount");

      expect(typeof item.category).toBe("string");
      expect(["income", "outcome"]).toContain(item.operation_type);
      expect(typeof item.total_amount).toBe("number");
    });
  });

  it("respeta el parámetro operation_type (income|outcome)", async () => {
    for (const op of ["income", "outcome"]) {
      const data = await apiGet<Array<Record<string, unknown>>>(
        `/api/metrics/categories/top${queryString({ operation_type: op })}`,
      );
      expect(data.length).toBeGreaterThan(0);
      data.forEach((item) => {
        expect(item.operation_type).toBe(op);
      });
    }
  });

  it("respeta el límite limit (1..20)", async () => {
    for (const limit of [1, 3, 5, 20]) {
      const data = await apiGet<Array<Record<string, unknown>>>(
        `/api/metrics/categories/top${queryString({ limit })}`,
      );
      expect(data.length).toBeLessThanOrEqual(limit);
      expect(data.length).toBeGreaterThan(0);
    }
  });

  it("rechaza límites fuera de rango", async () => {
    const res = await fetch(
      `${process.env.CONTRACT_API_BASE ?? "http://localhost:8000"}/api/metrics/categories/top?limit=0`,
    );
    expect(res.status).toBe(422);
  });

  it("ordena categorías de mayor a menor total_amount", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/categories/top${queryString({ operation_type: "outcome", limit: 20 })}`,
    );
    for (let i = 1; i < data.length; i++) {
      expect(Number(data[i - 1].total_amount)).toBeGreaterThanOrEqual(
        Number(data[i].total_amount),
      );
    }
  });

  it("filtra por business_type B2B y B2C", async () => {
    for (const bt of ["B2B", "B2C"]) {
      const data = await apiGet<Array<Record<string, unknown>>>(
        `/api/metrics/categories/top${queryString({ business_type: bt })}`,
      );
      expect(data.length).toBeGreaterThan(0);
    }
  });

  it("acepta filtros de fecha opcionales", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/categories/top${queryString({
        start_date: "2025-01-01",
        end_date: "2025-12-31",
      })}`,
    );
    expect(Array.isArray(data)).toBe(true);
  });
});
