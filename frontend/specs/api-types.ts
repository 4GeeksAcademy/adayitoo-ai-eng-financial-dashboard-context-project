/**
 * Date-only string shape used by OpenAPI's `format: date` fields.
 * @example `2026-10-20`
 */
export type ISODate = `${number}-${number}-${number}`;

/** Operation types accepted and returned by the financial metrics API. */
export type OperationType = "income" | "outcome";

/** Category values accepted and returned by the financial metrics API. */
export type Category =
  | "suppliers"
  | "sales"
  | "operational"
  | "administrative"
  | "others";

/** Business segments accepted and returned by the financial metrics API. */
export type BusinessType = "B2B" | "B2C";

/**
 * Response from `GET /api/metrics/facets`.
 */
export interface FacetsResponse {
  /** Available operation types: `income` and `outcome`. */
  operation_types: OperationType[];

  /** Available business views: `B2B` and `B2C`. */
  business_types: BusinessType[];

  /** Available categories: `suppliers`, `sales`, `operational`, `administrative`, and `others`. */
  categories: Category[];

  /** Earliest movement date, serialized as an ISO `YYYY-MM-DD` date. */
  min_date: ISODate;

  /** Latest movement date, serialized as an ISO `YYYY-MM-DD` date. */
  max_date: ISODate;
}

/** One anomalous spending period returned by `GET /api/metrics/alerts`. */
export interface AlertEntry {
  /** Period key: an ISO date for `day`, `YYYY-Www` for `week`, or `YYYY-MM` for `month`. */
  period: string;

  /** Total outcome amount for this period. */
  outcome_total: number;

  /** Average outcome amount across earlier periods in the selected grouping. */
  baseline_average: number;

  /** Increase ratio over the baseline as a decimal (for example, `0.3` means 30%). */
  increase_ratio: number;
}

/** Array response from `GET /api/metrics/alerts`. */
export type AlertsResponse = AlertEntry[];

/** One category total returned by `GET /api/metrics/categories/top`. */
export interface CategoryEntry {
  /** Category value: `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  category: Category;

  /** Operation type used to calculate this total: `income` or `outcome`. */
  operation_type: OperationType;

  /** Sum of amounts for this category and operation type. */
  total_amount: number;
}

/** Array response from `GET /api/metrics/categories/top`. */
export type TopCategoriesResponse = CategoryEntry[];