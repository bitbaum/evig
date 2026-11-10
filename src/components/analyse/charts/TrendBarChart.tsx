import { ColumnChart } from '@bitbaum/chartkit/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TrendDataPoint {
  category: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
}

interface TrendBarChartProps {
  data: TrendDataPoint[];
  currentYear: number;
  previousYear: number;
  source?: string;
}

const percent = new Intl.NumberFormat('de-CH', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

/**
 * Year-over-year comparison by revenue category: the previous and the current
 * year side by side per category, drawn by @bitbaum/chartkit on the server.
 * The change against the previous year is the note on each current-year column and in the table behind
 * the chart, so it is readable without colour.
 */
export function TrendBarChart({ data, currentYear, previousYear, source }: TrendBarChartProps) {
  const series = [
    {
      id: 'previous',
      label: String(previousYear),
      points: data.map((d) => ({ x: d.category, y: d.previousValue })),
    },
    {
      id: 'current',
      label: String(currentYear),
      points: data.map((d) => ({
        x: d.category,
        y: d.currentValue,
        note:
          d.previousValue > 0
            ? percent.format((d.currentValue - d.previousValue) / d.previousValue)
            : undefined,
      })),
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{`Vergleich ${previousYear} vs ${currentYear}`}</CardTitle>
        <CardDescription>Jahresvergleich nach Einnahmekategorie</CardDescription>
      </CardHeader>
      <CardContent>
        <ColumnChart
          series={series}
          unit="CHF"
          caption={`Einnahmen ${previousYear} und ${currentYear} nach Kategorie`}
          locale="de-CH"
          periodLabel="Kategorie"
          height={300}
        />
        {source && <div className="mt-2 text-xs text-muted-foreground">Quelle: {source}</div>}
      </CardContent>
    </Card>
  );
}
