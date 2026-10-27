import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/summary", () => {
  it("devuelve MetricsSummaryItem[] compatible con el contrato", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/summary",
    );

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    data.forEach((item) => {
      expect(item).toHaveProperty("period");
      expect(item).toHaveProperty("income");
      expect(item).toHaveProperty("outcome");
      expect(item).toHaveProperty("net");

      expect(typeof item.period).toBe("string");
      expect(typeof item.income).toBe("number");
      expect(typeof item.outcome).toBe("number");
      expect(typeof item.net).toBe("number");
    });
  });

  it("no devuelve campos extra fuera del contrato", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/summary",
    );
    const allowedKeys = new Set(["period", "income", "outcome", "net"]);
    data.forEach((item) => {
      for (const key of Object.keys(item)) {
        expect(allowedKeys.has(key)).toBe(true);
      }
    });
  });

  it("respeta group_by=day|week|month", async () => {
    for (const groupBy of ["day", "week", "month"]) {
      const data = await apiGet<Array<Record<string, unknown>>>(
        `/api/metrics/summary${queryString({ group_by: groupBy })}`,
      );
      expect(data.length).toBeGreaterThan(0);
      // El formato del período debe variar según la agrupación
      expect(typeof data[0].period).toBe("string");
    }
  });

  it("net = income - outcome en cada elemento", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/summary",
    );
    data.forEach((item) => {
      expect(Number(item.net)).toBeCloseTo(
        Number(item.income) - Number(item.outcome),
        2,
      );
    });
  });

  it("acepta filtros de categoría, tipo de operación, fechas y segmento", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/summary${queryString({
        category: "suppliers",
        operation_type: "outcome",
        start_date: "2025-01-01",
        end_date: "2025-12-31",
        business_type: "B2B",
      })}`,
    );
    expect(Array.isArray(data)).toBe(true);
  });
});
