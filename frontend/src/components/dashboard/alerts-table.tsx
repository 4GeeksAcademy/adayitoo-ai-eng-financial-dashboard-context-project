import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlertEntry } from "../../../specs/api-types";

interface AlertsTableProps {
  alerts: AlertEntry[];
  loading: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function LoadingRows() {
  return (
    <div className="space-y-3 py-2" aria-label="Cargando alertas">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function AlertsTable({ alerts, loading }: AlertsTableProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border px-5 py-4">
        <CardTitle className="text-sm font-semibold">Anomalías de gasto</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {loading && alerts.length === 0 ? (
          <div className="px-5 py-4">
            <LoadingRows />
          </div>
        ) : alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No hay anomalías para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Período</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Gasto</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Promedio previo</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Aumento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((alert) => (
                  <tr key={alert.period} className="hover:bg-muted/30">
                    <th scope="row" className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                      {alert.period}
                    </th>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {currencyFormatter.format(alert.outcome_total)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {currencyFormatter.format(alert.baseline_average)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-destructive">
                      {(alert.increase_ratio * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}