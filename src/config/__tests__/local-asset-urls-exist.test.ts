/**
 * Guard: every local asset referenced via CSS `url('/…')` must exist in public/.
 *
 * ServiceHero shipped `bg-[url('/grid.svg')]` for an asset that was never in
 * the repo — every service page fired a 404 and the overlay never rendered
 * (PR #158). Such references are usually boilerplate/template leftovers and are
 * invisible to tsc/eslint. This scans source for `url('/…')` paths and asserts
 * the corresponding file exists under public/.
 *
 * Scope: only `url(...)` references with a root-relative literal path
 * (starts with `/`). Dynamic srcs, external URLs and data: URIs are ignored —
 * this targets exactly the static-asset class that 404'd.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../../..')
const SRC_DIR = join(ROOT, 'src')
const PUBLIC_DIR = join(ROOT, 'public')

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full)
  }
}

// url('/path'), url("/path"), url(/path) — capture the root-relative path.
const URL_RE = /url\(\s*['"]?(\/[^'")]+?)['"]?\s*\)/g

describe('local asset urls', () => {
  it('every url(\'/…\') reference resolves to a file in public/', () => {
    const files: string[] = []
    walk(SRC_DIR, files)

    const missing: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      let m: RegExpExecArray | null
      URL_RE.lastIndex = 0
      while ((m = URL_RE.exec(src)) !== null) {
        const ref = m[1].split(/[?#]/)[0] // strip query/hash
        if (ref.startsWith('//')) continue // protocol-relative external
        if (!existsSync(join(PUBLIC_DIR, ref))) {
          missing.push(`${file.replace(ROOT + '/', '')} → url(${ref}) [not found in public/]`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})
