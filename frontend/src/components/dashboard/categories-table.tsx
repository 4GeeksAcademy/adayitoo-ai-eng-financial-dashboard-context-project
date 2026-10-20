import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Category,
  CategoryEntry,
} from "../../../specs/api-types";

interface CategoriesTableProps {
  categories: Category[];
  b2bCategories: CategoryEntry[];
  b2cCategories: CategoryEntry[];
  loading: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function toAmountMap(entries: CategoryEntry[]): Map<Category, number> {
  return new Map(entries.map((entry) => [entry.category, entry.total_amount]));
}

function formatCategory(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function CategoriesTable({
  categories,
  b2bCategories,
  b2cCategories,
  loading,
}: CategoriesTableProps) {
  const b2bAmounts = toAmountMap(b2bCategories);
  const b2cAmounts = toAmountMap(b2cCategories);
  const hasRows = b2bCategories.length > 0 || b2cCategories.length > 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border px-5 py-4">
        <CardTitle className="text-sm font-semibold">Gastos por categoría</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {loading && !hasRows ? (
          <div className="space-y-3 px-5 py-4" aria-label="Cargando categorías">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </div>
        ) : !hasRows ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No hay categorías para los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Categoría</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">B2B</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">B2C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <tr key={category} className="hover:bg-muted/30">
                    <th scope="row" className="px-5 py-3 font-medium text-foreground">
                      {formatCategory(category)}
                    </th>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {currencyFormatter.format(b2bAmounts.get(category) ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {currencyFormatter.format(b2cAmounts.get(category) ?? 0)}
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