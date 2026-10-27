import { describe, expect, it } from "vitest";
import { apiGet, queryString } from "./helpers";

describe("GET /api/metrics/b2b", () => {
  it("devuelve FinancialMovement[] solo con business_type=B2B", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>("/api/metrics/b2b");

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    data.forEach((item) => {
      expect(item).toHaveProperty("create_date");
      expect(item).toHaveProperty("amount");
      expect(item).toHaveProperty("operation_type");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("business_type");
      expect(item.business_type).toBe("B2B");
    });
  });

  it("devuelve movimientos ordenados cronológicamente", async () => {
    const data = await apiGet<Array<{ create_date: string }>>("/api/metrics/b2b");
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].create_date <= data[i].create_date).toBe(true);
    }
  });

  it("respeta filtros combinados", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>(
      `/api/metrics/b2b${queryString({
        operation_type: "outcome",
        category: "suppliers",
      })}`,
    );
    data.forEach((item) => {
      expect(item.business_type).toBe("B2B");
      expect(item.operation_type).toBe("outcome");
      expect(item.category).toBe("suppliers");
    });
  });
});

describe("GET /api/metrics/b2c", () => {
  it("devuelve FinancialMovement[] solo con business_type=B2C", async () => {
    const data = await apiGet<Array<Record<string, unknown>>>("/api/metrics/b2c");

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    data.forEach((item) => {
      expect(item).toHaveProperty("create_date");
      expect(item).toHaveProperty("amount");
      expect(item).toHaveProperty("operation_type");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("business_type");
      expect(item.business_type).toBe("B2C");
    });
  });

  it("devuelve movimientos ordenados cronológicamente", async () => {
    const data = await apiGet<Array<{ create_date: string }>>("/api/metrics/b2c");
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].create_date <= data[i].create_date).toBe(true);
    }
  });
});
