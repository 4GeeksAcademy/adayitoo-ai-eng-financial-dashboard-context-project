import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/alerts", () => {
  it("devuelve AlertEntry[] compatible con el tipo TypeScript", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/alerts",
    );

    expect(Array.isArray(data)).toBe(true);

    data.forEach((alert) => {
      // Todos los campos requeridos presentes
      expect(alert).toHaveProperty("period");
      expect(alert).toHaveProperty("outcome_total");
      expect(alert).toHaveProperty("baseline_average");
      expect(alert).toHaveProperty("increase_ratio");

      // Tipos correctos
      expect(typeof alert.period).toBe("string");
      expect(typeof alert.outcome_total).toBe("number");
      expect(typeof alert.baseline_average).toBe("number");
      expect(typeof alert.increase_ratio).toBe("number");

      // Aumento relativo decimal, no porcentaje escalado
      expect(Number(alert.increase_ratio)).toBeGreaterThan(0);
    });
  });

  it("acepta el parámetro group_by=day|week|month", async () => {
    for (const groupBy of ["day", "week", "month"]) {
      const path = `/api/metrics/alerts${queryString({ group_by: groupBy })}`;
      const data = await apiGet<Array<Record<string, unknown>>>(path);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("acepta el umbral threshold>=0 y respeta el default", async () => {
    const defaultData = await apiGet<Array<Record<string, unknown>>>(
      "/api/metrics/alerts",
    );
    const lowThreshold = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/alerts${queryString({ threshold: 0.1 })}`,
    );

    // Un umbral más bajo suele generar >= alertas (o iguales)
    expect(lowThreshold.length).toBeGreaterThanOrEqual(defaultData.length);
  });

  it("acepta filtros de fecha opcionales", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/alerts${queryString({
        start_date: "2025-01-01",
        end_date: "2025-12-31",
      })}`,
    );
    expect(Array.isArray(data)).toBe(true);
  });

  it("acepta el filtro business_type B2B y B2C", async () => {
    for (const bt of ["B2B", "B2C"]) {
      const data = await apiGet<Array<Record<string, unknown>>>(
        `/api/metrics/alerts${queryString({ business_type: bt })}`,
      );
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
