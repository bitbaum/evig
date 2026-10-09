/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every date field in evig is @bitbaum/whenkit's DateInput (see date-input.tsx),
 * and whenkit paints only through --wk-* variables. Its defaults read
 * HSL-triplet tokens — `hsl(var(--surface-base))` — while evig's tokens are
 * full colours, so `hsl(#ffffff)` is invalid and the property falls back to
 * its initial value; the accent defaults to an orange evig does not use.
 * globals.css therefore maps every --wk-* colour/face variable onto evig's
 * tokens, unlayered. This test fails when whenkit starts reading a variable
 * the mapping leaves out, or when the mapping drifts from what makes it work.
 */

const GLOBALS = readFileSync(join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');
const WHENKIT = readFileSync(
  join(process.cwd(), 'node_modules', '@bitbaum', 'whenkit', 'styles.css'),
  'utf8',
);

// Sizes, not tokens: whenkit's defaults are plain lengths and stay as they are
// (16px text so iOS does not zoom on focus; 44px touch targets).
const SIZE_VARIABLES = new Set(['--wk-text', '--wk-small', '--wk-target']);

function whenkitVariables(): Set<string> {
  const names = new Set<string>();
  for (const m of WHENKIT.matchAll(/(--wk-[a-z0-9-]+)\s*:/g)) names.add(m[1]);
  for (const m of WHENKIT.matchAll(/var\(\s*(--wk-[a-z0-9-]+)/g)) names.add(m[1]);
  return names;
}

function mappingBlock(): { body: string; start: number } {
  const marker = GLOBALS.indexOf('@bitbaum/whenkit → evig tokens');
  expect(marker, 'whenkit mapping comment missing from globals.css').toBeGreaterThan(-1);
  const open = GLOBALS.indexOf(':root {', marker);
  const close = GLOBALS.indexOf('}', open);
  return { body: GLOBALS.slice(open + ':root {'.length, close), start: open };
}

function mapping(): Map<string, string> {
  const entries = new Map<string, string>();
  for (const m of mappingBlock().body.matchAll(/(--wk-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    entries.set(m[1], m[2].trim());
  }
  return entries;
}

describe('@bitbaum/whenkit → evig tokens', () => {
  it('maps every --wk-* variable whenkit reads, except plain sizes', () => {
    const mapped = mapping();
    const missing = [...whenkitVariables()].filter((v) => !SIZE_VARIABLES.has(v) && !mapped.has(v));
    expect(missing).toEqual([]);
  });

  it('leaves only plain lengths to whenkit (no token-derived default left unmapped)', () => {
    for (const name of SIZE_VARIABLES) {
      const m = WHENKIT.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
      expect(m, `${name} no longer declared by whenkit`).not.toBeNull();
      expect(m![1]).toMatch(/^[\d.]+(rem|px|em)$/);
    }
  });

  it('maps straight onto evig tokens that exist — never through hsl()', () => {
    for (const [name, value] of mapping()) {
      const ref = value.match(/^var\((--[a-z0-9-]+)\)$/);
      expect(ref, `${name}: ${value} should be a single var(--token)`).not.toBeNull();
      expect(GLOBALS, `${name} points at undefined ${ref![1]}`).toMatch(
        new RegExp(`\\n\\s*${ref![1]}\\s*:`),
      );
    }
  });

  it('is unlayered, so it beats whenkit’s unlayered :where(:root) defaults', () => {
    const before = GLOBALS.slice(0, mappingBlock().start).replace(/\/\*[\s\S]*?\*\//g, '');
    const depth = [...before].reduce((d, c) => d + (c === '{' ? 1 : c === '}' ? -1 : 0), 0);
    expect(depth).toBe(0);
  });
});
