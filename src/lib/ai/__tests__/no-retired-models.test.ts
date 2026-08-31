/**
 * No retired model id may survive anywhere in this repo's AI layers.
 *
 * This exists because evig has been repinned three times for the same reason,
 * and the history is still legible in the comments: Llama-4-Scout was
 * decommissioned, so the ids moved to `llama-3.3-70b-versatile`, and Groq then
 * retired the entire llama-3.x family. At the low point FOUR ids were dead at
 * once — the Groq default, the large-context fallback, the OpenRouter default
 * and the OpenRouter vision model — and none of them failed anything until a
 * user saw it.
 *
 * A repin cannot prevent the next retirement; only a check that runs without
 * being asked can. Two now do:
 *
 *   - dotfiles/scripts/ci/model-pin-audit.mjs asks Groq and OpenRouter DAILY
 *     whether these exact ids are still listed. That is the one that catches
 *     new rot, because it talks to the vendor.
 *   - this test, which catches the cheaper mistake: someone reintroducing an
 *     id already known to be dead, by copying an old line, reverting a file, or
 *     merging a stale branch.
 *
 * ── Why this reads source text, and why that is normally wrong ──────────────
 *
 * These ids are module-private constants. Nothing exports them, so there is no
 * value to assert against, and the alternative — exporting internals purely to
 * make them testable — would be a worse trade.
 *
 * Reading source has a specific failure mode that has already bitten this fleet
 * once: a sibling repo's guard grepped a function body and failed on a COMMENT
 * that named the old id, so it reported on prose rather than behaviour. The
 * comments above these very constants name every retired id on purpose, because
 * that history is the most useful thing on the page.
 *
 * So comments are stripped before anything is matched. The test then sees only
 * code, which is the only thing that can call a vendor.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Source with `//` and block comments removed. Not a parser; sufficient here. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Families, not individual ids.
 *
 * The failure here was never one model being deprecated — it was a whole
 * lineage withdrawn at once, twice. Listing `llama-3.3-70b-versatile` alone
 * would pass happily on `llama-3.1-8b-instant`, which died the same day.
 */
const RETIRED = [
  { pattern: /\bllama-3\.\d[\w.-]*/i, why: 'Groq retired the entire llama-3.x family' },
  {
    pattern: /\bllama-4-scout[\w.-]*/i,
    why: 'decommissioned; this repo was already repinned off it once',
  },
  { pattern: /\bopenai\/gpt-oss-20b:free\b/i, why: 'retired from OpenRouter’s catalogue' },
  { pattern: /\bgoogle\/gemini-2\.0-flash-001\b/i, why: 'retired from OpenRouter’s catalogue' },
];

const AI_DIRS = ['src/lib/ai', 'src/lib/hirn'];

describe('retired model ids', () => {
  const files = AI_DIRS.flatMap((dir) => walk(join(process.cwd(), dir)));

  it('finds AI source to check, so an empty sweep cannot pass vacuously', () => {
    // Without this, a moved directory turns the whole file below into a
    // guarantee about nothing — which reads identically to a clean result.
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(RETIRED)('carries no id matching $pattern ($why)', ({ pattern }) => {
    const offenders: string[] = [];

    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'));
      // Only quoted strings can be sent to a vendor. This also keeps a bare
      // word in an identifier or type name from tripping the check.
      for (const match of code.matchAll(/['"`]([^'"`\n]+)['"`]/g)) {
        if (pattern.test(match[1])) {
          offenders.push(`${file.replace(process.cwd() + '/', '')}: ${match[1]}`);
        }
      }
    }

    // Named, not counted: the failure should say which file and which id.
    expect(offenders).toEqual([]);
  });

  it('still catches an id that is genuinely present', () => {
    // Guards the stripper and the matcher together. If `stripComments` ever
    // ate real code, or the quoted-string scan stopped finding anything, every
    // assertion above would pass on an empty haystack.
    const sample = `
      // a comment naming 'llama-3.3-70b-versatile' must NOT count
      const model = 'llama-3.1-8b-instant'
    `;
    const code = stripComments(sample);
    const found = [...code.matchAll(/['"`]([^'"`\n]+)['"`]/g)].map((m) => m[1]);

    expect(found).toContain('llama-3.1-8b-instant');
    expect(found).not.toContain('llama-3.3-70b-versatile');
  });
});
