import { DoughnutChart } from '@bitbaum/chartkit/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCHF } from '@/lib/hirn/format';
import { REVENUE_CATEGORY_LABELS } from '@/config/ui-colors';

interface RevenuePieChartProps {
  data: Record<keyof typeof REVENUE_CATEGORY_LABELS, number>;
  year: number;
  source?: string;
}

/**
 * Revenue for one year split by category, drawn by @bitbaum/chartkit:
 * a ring with an exact-value legend and a table behind it.
 */
export function RevenuePieChart({ data, year, source }: RevenuePieChartProps) {
  // A category with no revenue that year gets no slice and no legend row.
  const rows = (Object.keys(REVENUE_CATEGORY_LABELS) as (keyof typeof REVENUE_CATEGORY_LABELS)[])
    .filter((key) => data[key] > 0)
    .map((key) => ({ label: REVENUE_CATEGORY_LABELS[key], value: data[key] }));

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Einnahmenverteilung {year}</CardTitle>
        <CardDescription>Total: {formatCHF(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        <DoughnutChart
          rows={rows}
          unit="CHF"
          caption={`Einnahmen ${year} nach Kategorie`}
          locale="de-CH"
          labelHeading="Kategorie"
          valueHeading="Betrag"
        />
        {source && <div className="mt-2 text-xs text-muted-foreground">Quelle: {source}</div>}
      </CardContent>
    </Card>
  );
}
