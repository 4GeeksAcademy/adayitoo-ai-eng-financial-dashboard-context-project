import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/comparison", () => {
  it("devuelve MetricsComparison compatible con el contrato", async () => {
    const data = await apiGet<Record<string, unknown>>(
      `/api/metrics/comparison${queryString({
        start_date: "2025-03-01",
        end_date: "2025-03-31",
      })}`,
    );

    expect(data).toHaveProperty("current_period");
    expect(data).toHaveProperty("previous_period");
    expect(data).toHaveProperty("delta_abs");
    expect(data).toHaveProperty("delta_pct");

    expect(typeof data.current_period).toBe("number");
    expect(typeof data.previous_period).toBe("number");
    expect(typeof data.delta_abs).toBe("number");
    // delta_pct puede ser number o null (cuando previous_period es 0)
    expect(
      data.delta_pct === null || typeof data.delta_pct === "number",
    ).toBe(true);
  });

  it("current_period y previous_period son números finitos", async () => {
    const data = await apiGet<Record<string, unknown>>(
      `/api/metrics/comparison${queryString({
        start_date: "2025-06-01",
        end_date: "2025-06-30",
      })}`,
    );
    expect(Number.isFinite(Number(data.current_period))).toBe(true);
    expect(Number.isFinite(Number(data.previous_period))).toBe(true);
  });

  it("delta_abs = current_period - previous_period", async () => {
    const data = await apiGet<Record<string, unknown>>(
      `/api/metrics/comparison${queryString({
        start_date: "2025-04-01",
        end_date: "2025-04-30",
      })}`,
    );
    expect(Number(data.delta_abs)).toBeCloseTo(
      Number(data.current_period) - Number(data.previous_period),
      2,
    );
  });

  it("acepta business_type opcional", async () => {
    for (const bt of ["B2B", "B2C"]) {
      const data = await apiGet<Record<string, unknown>>(
        `/api/metrics/comparison${queryString({
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          business_type: bt,
        })}`,
      );
      expect(typeof data.current_period).toBe("number");
    }
  });

  it("requiere start_date y end_date (obligatorios)", async () => {
    const res = await fetch(
      `${process.env.CONTRACT_API_BASE ?? "http://localhost:8000"}/api/metrics/comparison`,
    );
    expect(res.status).toBe(422);
  });
});