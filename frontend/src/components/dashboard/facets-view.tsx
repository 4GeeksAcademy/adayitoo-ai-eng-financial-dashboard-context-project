import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacetsResponse, ISODate } from "../../../specs/api-types";
import type { DashboardFilters } from "@/hooks/use-dashboard-data";

interface FacetsViewProps {
  facets: FacetsResponse;
  filters: DashboardFilters;
  onFiltersChange: (updates: Partial<DashboardFilters>) => void;
}

export function FacetsView({
  facets,
  filters,
  onFiltersChange,
}: FacetsViewProps) {
  return (
    <Card aria-label="Filtros del dashboard" className="gap-0 py-0">
      <CardHeader className="border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Fecha inicial
          <input
            type="date"
            min={facets.min_date}
            max={facets.max_date}
            value={filters.start_date ?? ""}
            onChange={(event) =>
              onFiltersChange({
                start_date: event.target.value
                  ? (event.target.value as ISODate)
                  : null,
              })
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Fecha final
          <input
            type="date"
            min={facets.min_date}
            max={facets.max_date}
            value={filters.end_date ?? ""}
            onChange={(event) =>
              onFiltersChange({
                end_date: event.target.value
                  ? (event.target.value as ISODate)
                  : null,
              })
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Umbral de alerta
          <span className="relative">
            <input
              type="number"
              min="0"
              step="0.05"
              value={filters.threshold}
              onChange={(event) =>
                onFiltersChange({
                  threshold: Math.max(0, Number(event.target.value)),
                })
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ratio
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Segmentos comparados
          <div className="flex h-10 items-center gap-2" aria-label="Segmentos B2B y B2C">
            {facets.business_types.map((businessType) => (
              <span
                key={businessType}
                className="inline-flex h-7 items-center rounded border border-border bg-muted px-2.5 text-xs font-semibold text-foreground"
              >
                {businessType}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}