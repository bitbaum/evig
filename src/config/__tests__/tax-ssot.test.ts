/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SWISS_VAT_RATES, SWISS_VAT_STANDARD_PERCENT } from '@/config/tax';

/**
 * The VAT rate is declared exactly once.
 *
 * It used to live in five places — lib/pricing, lib/payments/tax-compliance,
 * lib/payments/currency (twice), the zod default in api/invoices and the
 * payment_transactions.tax_rate column default — all carrying the pre-2024
 * rate, while the Kivvi booking path used the correct 8.1%. The platform
 * therefore invoiced at one rate and posted the accounting entry at another,
 * and two separate files each described themselves as "the SSOT for VAT".
 *
 * Duplicating a number is not caught by types, so it needs a test.
 */

const SRC = join(process.cwd(), 'src');
const OLD_SWISS_RATES = [/\b0\.077\b/, /\b0\.0770\b/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' || entry === 'node_modules' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Strip comments so prose about the history doesn't trip the scan. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    .join('\n');
}

describe('VAT rate SSOT', () => {
  it('is the rate in force since 2024-01-01', () => {
    expect(SWISS_VAT_RATES.standard).toBe(0.081);
    expect(SWISS_VAT_STANDARD_PERCENT).toBe('8.1');
  });

  it('derives the percentage string from the number', () => {
    // Kivvi bookings send the string; it must not be typed independently.
    expect(Number(SWISS_VAT_STANDARD_PERCENT) / 100).toBeCloseTo(SWISS_VAT_RATES.standard, 10);
  });

  it('no source file hardcodes the superseded Swiss rate', () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => !file.endsWith(join('config', 'tax.ts')))
      .filter((file) => {
        const code = codeOnly(readFileSync(file, 'utf8'));
        return OLD_SWISS_RATES.some((re) => re.test(code));
      })
      .map((f) => f.replace(process.cwd() + '/', ''));

    expect(offenders).toEqual([]);
  });

  it('scans a meaningful number of files (guards an always-green sweep)', () => {
    expect(sourceFiles(SRC).length).toBeGreaterThan(500);
  });
});
