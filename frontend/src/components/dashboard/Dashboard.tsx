import { RefreshCw } from "lucide-react";
import { AlertsTable } from "@/components/dashboard/alerts-table";
import { CategoriesTable } from "@/components/dashboard/categories-table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FacetsView } from "@/components/dashboard/facets-view";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  computeKPIs,
  computeMonthlyData,
  formatFinancialPeriod,
} from "@/lib/financial-utils";

export function Dashboard() {
  // The hook owns the shared filters and API lifecycle; filter controls update this state.
  const {
    facets,
    filters,
    updateFilters,
    movements,
    alerts,
    b2bCategories,
    b2cCategories,
    loading,
    error,
    retry,
  } = useDashboardData();

  // All dashboard sections render from the same response snapshot and filter state.
  const metrics = computeKPIs(movements);
  const monthlyData = computeMonthlyData(movements);
  const period = formatFinancialPeriod(movements);

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader period={period} />

          {error ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={retry}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-current px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : null}

          {facets ? (
            <FacetsView
              facets={facets}
              filters={filters}
              onFiltersChange={updateFilters}
            />
          ) : (
            <section aria-label="Cargando filtros" aria-busy="true">
              <Skeleton className="h-36 w-full" />
            </section>
          )}

          <section aria-label="Indicadores clave" aria-busy={loading}>
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <section
            aria-label="Gráficos financieros"
            aria-busy={loading}
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <IncomeOutcomeChart data={monthlyData} loading={loading} />
            <ProfitPercentChart data={monthlyData} loading={loading} />
          </section>

          <section
            aria-label="Análisis detallado"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <AlertsTable alerts={alerts} loading={loading} />
            <CategoriesTable
              categories={facets?.categories ?? []}
              b2bCategories={b2bCategories}
              b2cCategories={b2cCategories}
              loading={loading}
            />
          </section>
        </div>
      </div>
    </main>
  );
}