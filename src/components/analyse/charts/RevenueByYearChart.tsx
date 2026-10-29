import { ColumnChart } from '@bitbaum/chartkit/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { REVENUE_CATEGORY_LABELS } from '@/config/ui-colors';

type RevenueCategory = keyof typeof REVENUE_CATEGORY_LABELS;

type RevenueDataPoint = { year: number; total: number } & Record<RevenueCategory, number>;

interface RevenueByYearChartProps {
  data: RevenueDataPoint[];
  source?: string;
  sourceDate?: string;
}

/**
 * Revenue by category for every booked year, as stacked columns drawn by
 * @bitbaum/chartkit on the server. Year labels thin out on a narrow plot
 * instead of being cut; the table behind the chart holds every figure.
 */
export function RevenueByYearChart({ data, source, sourceDate }: RevenueByYearChartProps) {
  const years = [...data].sort((a, b) => a.year - b.year);
  const series = (Object.keys(REVENUE_CATEGORY_LABELS) as RevenueCategory[]).map((key) => ({
    id: key,
    label: REVENUE_CATEGORY_LABELS[key],
    points: years.map((d) => ({ x: String(d.year), y: d[key] })),
  }));

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Einnahmen im Zeitverlauf</CardTitle>
        <CardDescription>Entwicklung der Einnahmequellen über die Jahre</CardDescription>
      </CardHeader>
      <CardContent>
        <ColumnChart
          series={series}
          stacked
          unit="CHF"
          caption="Einnahmen pro Jahr nach Kategorie"
          locale="de-CH"
          periodLabel="Jahr"
          height={260}
        />
        {source && (
          <div className="mt-2 text-xs text-muted-foreground">
            Quelle: {source}
            {sourceDate && ` (${sourceDate})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
