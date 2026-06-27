/**
 * Guard: every translated ARRAY must match the canonical DE shape.
 *
 * next-intl's deep-merge fallback (src/i18n/request.ts) replaces arrays
 * wholesale — there is NO per-element fallback to DE. Many pages zip a
 * translation array against a config array by index (`CONFIG[i]`) or read
 * fixed per-element fields. If a translator adds/removes/​reorders an element in
 * ONE locale, that locale silently desyncs: an out-of-bounds `CONFIG[i]` yields
 * `undefined` — and an `undefined` icon component hard-crashes the page (500).
 *
 * This test locks the invariant: for every array that appears in DE, any locale
 * that ALSO defines that path must have the SAME length and, for object
 * elements, the SAME per-index key set. A locale may omit the path entirely
 * (then it cleanly falls back to DE) — but if it ships its own array, the shape
 * must match. This turns the whole latent desync class into a build failure.
 *
 * Structure (slugs/order/enums) belongs in config, not messages — see the
 * i18n SSOT rule in .claude/CLAUDE.md. This guard is the enforcement half.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MESSAGES_DIR = join(__dirname, '../../../messages')
const de = JSON.parse(readFileSync(join(MESSAGES_DIR, 'de.json'), 'utf8'))

type ArrayShape = { path: string; length: number; elementKeys: string[][] }

function elementKeySet(el: unknown): string[] {
  if (el === null || typeof el !== 'object' || Array.isArray(el)) return []
  return Object.keys(el as Record<string, unknown>).sort()
}

/** Collect every array path in an object tree, with its length + per-element key sets. */
function collectArrays(obj: unknown, path: string, out: ArrayShape[]): void {
  if (obj === null || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    out.push({ path, length: obj.length, elementKeys: obj.map(elementKeySet) })
    obj.forEach((el, i) => collectArrays(el, `${path}[${i}]`, out))
    return
  }
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    collectArrays(val, path ? `${path}.${key}` : key, out)
  }
}

/** Resolve a dotted/indexed path (e.g. `a.b[0].c`) against a tree; undefined if absent. */
function resolve(tree: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>((acc, seg) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[seg] : undefined), tree)
}

const deArrays = ((): ArrayShape[] => {
  const out: ArrayShape[] = []
  collectArrays(de, '', out)
  // only top-level array shapes (the per-element recursion is for nested arrays)
  return out
})()

const localeFiles = readdirSync(MESSAGES_DIR).filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== 'de.json')

describe('i18n array parity (vs canonical DE)', () => {
  it.each(localeFiles)('%s: arrays match DE length + per-element keys', (file) => {
    const locale = JSON.parse(readFileSync(join(MESSAGES_DIR, file), 'utf8'))
    const offenders: string[] = []

    for (const { path, length, elementKeys } of deArrays) {
      const got = resolve(locale, path)
      if (got === undefined) continue // omitted → falls back to DE, fine
      if (!Array.isArray(got)) {
        offenders.push(`${path}: expected array, got ${typeof got}`)
        continue
      }
      if (got.length !== length) {
        offenders.push(`${path}: length ${got.length} ≠ DE ${length}`)
        continue
      }
      got.forEach((el, i) => {
        const want = elementKeys[i].join(',')
        const have = elementKeySet(el).join(',')
        if (want !== have) offenders.push(`${path}[${i}]: keys [${have}] ≠ DE [${want}]`)
      })
    }

    expect(offenders).toEqual([])
  })
})
