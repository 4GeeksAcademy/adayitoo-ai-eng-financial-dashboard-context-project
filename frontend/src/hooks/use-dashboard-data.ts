import { useEffect, useState } from "react";
import type {
  AlertsResponse,
  BusinessType,
  FacetsResponse,
  TopCategoriesResponse,
} from "../../specs/api-types";
import type {
  AlertsParams,
  DateRangeFilter,
  TopCategoriesParams,
} from "../../specs/param-types";
import type { FinancialMovement } from "@/lib/financial-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type DashboardFilters = DateRangeFilter & {
  threshold: number;
};

interface DashboardDataBatch {
  movements: FinancialMovement[];
  alerts: AlertsResponse;
  b2bCategories: TopCategoriesResponse;
  b2cCategories: TopCategoriesResponse;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`La API respondió con estado ${response.status}.`);
  }
  return (await response.json()) as T;
}

function appendDateRange(query: URLSearchParams, filters: DateRangeFilter) {
  if (filters.start_date) query.set("start_date", filters.start_date);
  if (filters.end_date) query.set("end_date", filters.end_date);
}

function buildApiUrl(path: string, query: URLSearchParams): string {
  const search = query.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ""}`;
}

function buildAlertsUrl(filters: DashboardFilters): string {
  const params: AlertsParams = {
    start_date: filters.start_date,
    end_date: filters.end_date,
    threshold: filters.threshold,
  };
  const query = new URLSearchParams();
  appendDateRange(query, params);
  if (params.threshold !== undefined) {
    query.set("threshold", String(params.threshold));
  }
  if (params.group_by) query.set("group_by", params.group_by);
  if (params.business_type) query.set("business_type", params.business_type);
  return buildApiUrl("/api/metrics/alerts", query);
}

function buildTopCategoriesUrl(
  filters: DashboardFilters,
  businessType: BusinessType,
): string {
  const params: TopCategoriesParams = {
    start_date: filters.start_date,
    end_date: filters.end_date,
    operation_type: "outcome",
    limit: 5,
    business_type: businessType,
  };
  const query = new URLSearchParams();
  appendDateRange(query, params);
  if (params.operation_type) query.set("operation_type", params.operation_type);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.business_type) query.set("business_type", params.business_type);
  return buildApiUrl("/api/metrics/categories/top", query);
}

async function fetchDashboardData(
  filters: DashboardFilters,
  signal: AbortSignal,
): Promise<DashboardDataBatch> {
  const movementQuery = new URLSearchParams();
  appendDateRange(movementQuery, filters);

  const [movements, alerts, b2bCategories, b2cCategories] = await Promise.all([
    fetchJson<FinancialMovement[]>(
      buildApiUrl("/api/metrics", movementQuery),
      signal,
    ),
    fetchJson<AlertsResponse>(buildAlertsUrl(filters), signal),
    fetchJson<TopCategoriesResponse>(
      buildTopCategoriesUrl(filters, "B2B"),
      signal,
    ),
    fetchJson<TopCategoriesResponse>(
      buildTopCategoriesUrl(filters, "B2C"),
      signal,
    ),
  ]);

  return { movements, alerts, b2bCategories, b2cCategories };
}

export function useDashboardData() {
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ threshold: 0.3 });
  const [filtersReady, setFiltersReady] = useState(false);
  const [data, setData] = useState<DashboardDataBatch>({
    movements: [],
    alerts: [],
    b2bCategories: [],
    b2cCategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facetsAttempt, setFacetsAttempt] = useState(0);
  const [dataAttempt, setDataAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFacets() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchJson<FacetsResponse>(
          `${API_BASE_URL}/api/metrics/facets`,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setFacets(result);
        setFilters((current) => ({
          ...current,
          start_date: current.start_date ?? result.min_date,
          end_date: current.end_date ?? result.max_date,
        }));
        setFiltersReady(true);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los filtros de la API.",
          );
          setLoading(false);
        }
      }
    }

    void loadFacets();
    return () => controller.abort();
  }, [facetsAttempt]);

  useEffect(() => {
    if (!filtersReady) return;

    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboardData(filters, controller.signal);
        if (controller.signal.aborted) return;
        setData(result);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          controller.abort();
          setLoading(false);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los datos del dashboard.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, [dataAttempt, filters, filtersReady]);

  function updateFilters(updates: Partial<DashboardFilters>) {
    setFilters((current) => ({ ...current, ...updates }));
  }

  function retry() {
    if (facets === null) {
      setFacetsAttempt((attempt) => attempt + 1);
    } else {
      setDataAttempt((attempt) => attempt + 1);
    }
  }

  return {
    facets,
    filters,
    updateFilters,
    ...data,
    loading,
    error,
    retry,
  };
}