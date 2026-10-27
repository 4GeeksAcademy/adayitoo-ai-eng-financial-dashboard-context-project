import type {
  AlertEntry,
  AlertsResponse,
  CategoryEntry,
  FacetsResponse,
  TopCategoriesResponse,
} from "./api-types";
import type { AlertsParams, TopCategoriesParams } from "./param-types";

export const facetsExample = {
  operation_types: ["income", "outcome"],
  business_types: ["B2B", "B2C"],
  categories: [
    "administrative",
    "operational",
    "others",
    "sales",
    "suppliers",
  ],
  min_date: "2025-10-02",
  max_date: "2026-09-28",
} satisfies FacetsResponse;

export const alertExample = {
  period: "2025-12",
  outcome_total: 103378.98,
  baseline_average: 51174.1,
  increase_ratio: 1.0201,
} satisfies AlertEntry;

export const alertsResponseExample: AlertsResponse = [alertExample];

export const categoryExample = {
  category: "others",
  operation_type: "outcome",
  total_amount: 127890.6,
} satisfies CategoryEntry;

export const topCategoriesResponseExample: TopCategoriesResponse = [
  categoryExample,
];

export const alertsParamsExample = {
  threshold: 0.3,
  group_by: "month",
  start_date: null,
  end_date: "2026-09-30",
  business_type: null,
} satisfies AlertsParams;

export const topCategoriesParamsExample = {
  operation_type: "outcome",
  limit: 5,
  start_date: "2026-01-01",
  end_date: null,
  business_type: "B2B",
} satisfies TopCategoriesParams;
