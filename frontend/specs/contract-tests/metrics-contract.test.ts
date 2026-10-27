import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics (movimientos)", () => {
  it("devuelve FinancialMovement[] compatible con el tipo TypeScript", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>("/api/metrics");

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(360);

    data.forEach((item) => {
      expect(item).toHaveProperty("create_date");
      expect(item).toHaveProperty("amount");
      expect(item).toHaveProperty("operation_type");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("business_type");

      expect(typeof item.create_date).toBe("string");
      expect(typeof item.amount).toBe("number");
      expect(["income", "outcome"]).toContain(item.operation_type);
      expect([
        "suppliers",
        "sales",
        "operational",
        "administrative",
        "others",
      ]).toContain(item.category);
      expect(["B2B", "B2C"]).toContain(item.business_type);
    });
  });

  it("devuelve movimientos ordenados cronológicamente", async () => {
    const data = await apiGet<Array<{ create_date: string }>>("/api/metrics");
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].create_date <= data[i].create_date).toBe(true);
    }
  });

  it("respeta filtros de fecha con límites inclusivos", async () => {
    const all = await apiGet<Array<{ create_date: string }>>("/api/metrics");
    const firstDate = all[0].create_date;

    const filtered = await apiGet<Array<{ create_date: string }>>(
      `/api/metrics${queryString({ start_date: firstDate, end_date: firstDate })}`,
    );
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((item) => {
      expect(item.create_date).toBe(firstDate);
    });
  });

  it("respeta filtro de categoría", async () => {
    const data = await apiGet<Array<{ category: string }>>(
      `/api/metrics${queryString({ category: "sales" })}`,
    );
    expect(data.length).toBeGreaterThan(0);
    data.forEach((item) => {
      expect(item.category).toBe("sales");
    });
  });

  it("respeta filtro de operation_type", async () => {
    const data = await apiGet<Array<{ operation_type: string }>>(
      `/api/metrics${queryString({ operation_type: "income" })}`,
    );
    expect(data.length).toBeGreaterThan(0);
    data.forEach((item) => {
      expect(item.operation_type).toBe("income");
    });
  });

  // HALLAZGO (2026-10-27): `GET /api/metrics` NO declara `business_type` en su
  // firma (ver backend/app/routes.py::get_metrics). El parámetro se ignora
  // silenciosamente: `?business_type=B2C` devuelve los 360 movimientos, con B2B
  // incluido. Este test fija el comportamiento observado para que un cambio de
  // contrato (añadir el filtro de verdad) provoque un fallo intencional.
  // Nota: analytics-endpoints.md documenta `business_type` como opcional en esta
  // ruta, lo que contradice el comportamiento real; usar /api/metrics/b2b y
  // /api/metrics/b2c para filtrar por segmento.
  it("ignora silenciosamente business_type (parámetro no soportado)", async () => {
    const filtered = await apiGet<Array<{ business_type: string }>>(
      `/api/metrics${queryString({ business_type: "B2C" })}`,
    );
    const unfiltered = await apiGet<Array<{ business_type: string }>>(
      "/api/metrics",
    );
    // El filtro no tiene efecto: mismo número de movimientos en ambos casos.
    expect(filtered.length).toBe(unfiltered.length);
  });

  it("combina filtros múltiples", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics${queryString({
        operation_type: "outcome",
        category: "suppliers",
      })}`,
    );
    data.forEach((item) => {
      expect(item.operation_type).toBe("outcome");
      expect(item.category).toBe("suppliers");
    });
  });
});
