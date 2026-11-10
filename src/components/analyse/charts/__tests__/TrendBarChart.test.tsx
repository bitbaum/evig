import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TrendBarChart } from '../TrendBarChart';

describe('TrendBarChart', () => {
  it('draws both years per category with chartkit and states the change in the table', () => {
    const html = renderToStaticMarkup(
      <TrendBarChart
        currentYear={2025}
        previousYear={2024}
        source="Kivitendo"
        data={[
          { category: 'Verkauf', previousValue: 1000, currentValue: 1100, percentChange: 10 },
          { category: 'Spenden', previousValue: 0, currentValue: 500, percentChange: 0 },
        ]}
      />,
    );
    expect(html).toContain('Vergleich 2024 vs 2025');
    expect(html).toContain('Verkauf');
    expect(html).toContain('Spenden');
    expect(html).toMatch(/Veränderung \+10\s?%/);
    expect(html).toContain('Quelle: Kivitendo');
    expect(html).not.toContain('recharts');
  });
});
