import type {
  BusinessType,
  ISODate,
  OperationType,
} from "./api-types";

/** Grouping options accepted by the alerts endpoint. */
export type GroupBy = "day" | "week" | "month";

/** Optional inclusive date range shared by the analytics endpoints. */
export interface DateRangeFilter {
  /** Inclusive start date in ISO `YYYY-MM-DD` format, or `null` for no lower bound. */
  start_date?: ISODate | null;

  /** Inclusive end date in ISO `YYYY-MM-DD` format, or `null` for no upper bound. */
  end_date?: ISODate | null;
}

/** Query parameters accepted by `GET /api/metrics/alerts`. */
export interface AlertsParams extends DateRangeFilter {
  /** Minimum relative increase to report; non-negative number, default `0.3`. */
  threshold?: number;

  /** Period aggregation: `day`, `week`, or `month`; default `month`. */
  group_by?: GroupBy;

  /** Optional business segment filter: `B2B`, `B2C`, or `null` for no filter. */
  business_type?: BusinessType | null;
}

/** Query parameters accepted by `GET /api/metrics/categories/top`. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation type: `income` or `outcome`; default `outcome`. */
  operation_type?: OperationType;

  /** Maximum number of categories; integer from 1 to 20, default `5`. */
  limit?: number;

  /** Business segment filter: `B2B`, `B2C`, or `null`; call once per segment to compare them. */
  business_type?: BusinessType | null;
}