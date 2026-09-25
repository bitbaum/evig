/**
 * No background job spends the free AI. Ever.
 *
 * George, 2026-09-25: the free-tier keys on the box (evig's own Groq key and
 * the OpenRouter key shared by eleven apps, 50 requests/day between them) may
 * only be spent when a person deliberately asks — a click, a sent question.
 *
 * The leak this was written for: the nightly close-decisions cron closed
 * expired votes through transitionDecision(), which fired the AI "Beschluss"
 * narrative in the background. The cron never imported the model itself — it
 * imported the decisions barrel, which imported decisions-transitions, which
 * imported decisions-narrative, which imported the provider chain. So this
 * walks the import graph TRANSITIVELY from every entry point that runs with
 * nobody asking, and fails if any of them can reach a model module.
 *
 * Import reachability over-approximates a call, which is the safe direction:
 * a render file that genuinely needs a barrel with an AI export in it goes in
 * RENDER_ALLOWED with a reason a reviewer can check.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Modules that call a model (or a transcription model) on a free-tier key. */
const MODEL_MODULES = [
  'src/lib/ai/providers.ts',
  'src/lib/hirn/providers/index.ts',
  'src/lib/hirn/providers/groq.ts',
  'src/lib/hirn/providers/openrouter.ts',
  'src/lib/transcription/transcribe.ts',
];
/** A value import of ai-kit's model-calling entry points. */
const AI_KIT_CALL =
  /import\s+(?!type\b)(?:\*\s+as\s+\w+|\{[^}]*\b(?:complete|completeStream|freeChain)\b[^}]*\})\s+from\s+["']@bitbaum\/ai-kit/;

/**
 * Render files that import a barrel with an AI export but call none of it
 * while rendering. Adding a line here is a decision, not a fix.
 */
const RENDER_ALLOWED = new Map([
  // protocols barrel: reads + recoverStaleProtocolProcessing (a status UPDATE).
  ['src/app/admin/protocols/[id]/page.tsx', 'reads + stale-status reset only'],
  ['src/app/admin/protocols/new/page.tsx', 'reads only'],
  ['src/app/admin/protocols/page.tsx', 'reads only'],
]);

type Source = (path: string) => string | null;

function localImports(from: string, code: string, read: Source): string[] {
  const specs = [
    ...code.matchAll(/(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/g),
    ...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  return specs.flatMap((spec) => {
    const base = spec.startsWith('@/')
      ? join('src', spec.slice(2))
      : spec.startsWith('.')
        ? join(dirname(from), spec)
        : null;
    if (!base) return [];
    const hit = ['.ts', '.tsx', '/index.ts', '/index.tsx', '']
      .map((ext) => base + ext)
      .find((p) => /\.tsx?$/.test(p) && read(p) !== null);
    return hit ? [hit] : [];
  });
}

const importCache = new WeakMap<Source, Map<string, string[]>>();
function importsOf(file: string, code: string, read: Source): string[] {
  let byFile = importCache.get(read);
  if (!byFile) importCache.set(read, (byFile = new Map()));
  if (!byFile.has(file)) byFile.set(file, localImports(file, code, read));
  return byFile.get(file)!;
}

/** The import chain from `entry` to a model, or null. Pure over `read`, so it can be tested. */
function pathToModel(entry: string, read: Source): string[] | null {
  const seen = new Set<string>();
  const queue: string[][] = [[entry]];
  while (queue.length > 0) {
    const chain = queue.shift()!;
    const file = chain[chain.length - 1];
    if (seen.has(file)) continue;
    seen.add(file);
    const code = read(file);
    if (code === null) continue;
    if (MODEL_MODULES.includes(file) || AI_KIT_CALL.test(code)) return chain;
    for (const next of importsOf(file, code, read)) queue.push([...chain, next]);
  }
  return null;
}

const diskCache = new Map<string, string | null>();
const fromDisk: Source = (path) => {
  if (!diskCache.has(path)) {
    const abs = join(ROOT, path);
    diskCache.set(
      path,
      existsSync(abs) && statSync(abs).isFile() ? readFileSync(abs, 'utf8') : null,
    );
  }
  return diskCache.get(path)!;
};

function walk(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === '__tests__' || name === 'node_modules') return [];
    if (statSync(full).isDirectory()) return walk(full, keep);
    return keep(name) ? [relative(ROOT, full)] : [];
  });
}

const cronRoutes = walk(join(SRC, 'app/api/cron'), (n) => n === 'route.ts');
/** Called by a third party, never by a person waiting for an answer. */
const webhookRoutes = walk(join(SRC, 'app/api'), (n) => n === 'route.ts').filter((p) =>
  /webhook/i.test(p),
);
const bootModules = ['src/instrumentation.ts', 'src/proxy.ts'].filter((p) => fromDisk(p));
/** Pages, layouts and their server components: rendering must never reach a model. */
const renderFiles = walk(join(SRC, 'app'), (n) => /^(page|layout|template|loading)\.tsx?$/.test(n));

describe('no background path reaches a free-tier model', () => {
  it('the walker finds a transitive path, the shape of the old leak (it can fail)', () => {
    const tree: Record<string, string> = {
      'src/app/api/cron/x/route.ts':
        "import { transitionDecision } from '@/lib/services/decisions';",
      'src/lib/services/decisions.ts': "export { transitionDecision } from './decisions-core';",
      'src/lib/services/decisions-core.ts': "import { t } from './decisions-transitions';",
      'src/lib/services/decisions-transitions.ts':
        "import { generateOutcomeNarrative } from '@/lib/ai/decisions-narrative';",
      'src/lib/ai/decisions-narrative.ts': "import { callWithFallback } from '@/lib/ai/providers';",
      'src/lib/ai/providers.ts': 'export const callWithFallback = 1;',
      'src/app/api/cron/y/route.ts': "import { complete } from '@bitbaum/ai-kit';",
      'src/app/api/cron/z/route.ts': "import type { Link } from '@bitbaum/ai-kit';",
    };
    const read: Source = (p) => (p in tree ? tree[p] : null);
    expect(pathToModel('src/app/api/cron/x/route.ts', read)?.at(-1)).toBe(
      'src/lib/ai/providers.ts',
    );
    expect(pathToModel('src/app/api/cron/y/route.ts', read)).not.toBeNull();
    expect(pathToModel('src/app/api/cron/z/route.ts', read)).toBeNull();
  });

  it('finds the entry points at all', () => {
    // A path typo would make every assertion below vacuously true.
    expect(cronRoutes.length).toBeGreaterThanOrEqual(5);
    expect(webhookRoutes.length).toBeGreaterThanOrEqual(1);
    expect(renderFiles.length).toBeGreaterThan(20);
  });

  it('no cron route can reach a model', () => {
    const leaks = cronRoutes.map((r) => pathToModel(r, fromDisk)).filter(Boolean);
    expect(leaks).toEqual([]);
  });

  it('no webhook or boot module can reach a model', () => {
    const leaks = [...webhookRoutes, ...bootModules]
      .map((r) => pathToModel(r, fromDisk))
      .filter(Boolean);
    expect(leaks).toEqual([]);
  });

  it('no page or layout can reach a model while rendering', { timeout: 60_000 }, () => {
    const leaks = renderFiles
      .filter((r) => !RENDER_ALLOWED.has(r))
      .map((r) => pathToModel(r, fromDisk))
      .filter(Boolean);
    expect(leaks).toEqual([]);
  });

  it('closing a decision does not generate the narrative; only the staff route does', () => {
    const transitions = fromDisk('src/lib/services/decisions-transitions.ts') ?? '';
    expect(transitions).not.toMatch(/from ['"][^'"]*decisions-narrative['"]/);
    expect(transitions).not.toMatch(/generateOutcomeNarrative\(/);
    const barrel = fromDisk('src/lib/services/decisions.ts') ?? '';
    expect(barrel).not.toMatch(/decisions-narrative/);
    const route = fromDisk('src/app/api/decisions/[id]/narrative/route.ts') ?? '';
    expect(route).toMatch(/export const POST/);
    expect(route).not.toMatch(/export const GET/);
    expect(route).toMatch(/rateLimiters\.decisionNarrative/);
  });
});
