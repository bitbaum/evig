#!/usr/bin/env node
/**
 * Rename the Saldo PRODUCT (brand) in one command.
 *
 *   node packages/saldo/scripts/rename.mjs "New Name" [npm-handle]
 *
 * e.g.  node packages/saldo/scripts/rename.mjs "Klarzeit"
 *       → display name "Klarzeit", npm package "klarzeit-engine".
 *
 * It updates every place the brand NAME is read — the package (brand.ts,
 * package.json), the import alias (tsconfig, jest, the app adapter), the landing
 * site's PRODUCT constant, the Projects card (config), the README, and the
 * project's locale titles — and NOTHING else.
 *
 * It deliberately leaves untouched:
 *   • the domain term "saldo" = balance (computeTimeSaldo, saldoMinutes, the
 *     "SALDO" column, Zeitsaldo/Feriensaldo) — that is the accounting word;
 *   • the URL /saldo and the folder names (a stable technical route) — rename
 *     those separately if you want (see the printed note).
 *
 * Re-runnable: it reads the CURRENT name from the SSOT, so you can rename again.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const displayNew = process.argv[2]
if (!displayNew) {
  console.error('Usage: node packages/saldo/scripts/rename.mjs "New Name" [npm-handle]')
  process.exit(1)
}

// Current name = SSOT: display from brand.ts, npm handle from package.json.
const brandSrc = fs.readFileSync(path.join(ROOT, 'packages/saldo/src/brand.ts'), 'utf8')
const displayOld = (brandSrc.match(/name:\s*'([^']+)'/) || [])[1]
const handleOld = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/saldo/package.json'), 'utf8')).name
if (!displayOld || !handleOld) {
  console.error('Could not read the current name from brand.ts / package.json.')
  process.exit(1)
}
const slug = displayNew.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const handleNew = process.argv[3] || `${slug}-engine`

const repl = (str, from, to) => str.split(from).join(to)
const changed = []
function edit(rel, fn) {
  const p = path.join(ROOT, rel)
  const before = fs.readFileSync(p, 'utf8')
  const after = fn(before)
  if (after !== before) { fs.writeFileSync(p, after); changed.push(rel) }
}

// 1) display name in the package + config SSOTs
edit('packages/saldo/src/brand.ts', (s) => repl(s, `name: '${displayOld}'`, `name: '${displayNew}'`))
edit('src/app/[locale]/projects/data.ts', (s) => repl(s, `brandName: '${displayOld}'`, `brandName: '${displayNew}'`))

// 2) npm handle everywhere it's imported (unambiguous string — safe to replace)
for (const f of ['packages/saldo/package.json', 'tsconfig.json', 'jest.config.js', 'src/lib/team/saldo.ts']) {
  edit(f, (s) => repl(s, handleOld, handleNew))
}

// 3) README — handle + the brand word (\bWord\b avoids Zeitsaldo/computeTimeSaldo)
edit('packages/saldo/README.md', (s) =>
  repl(s, handleOld, handleNew).replace(new RegExp(`\\b${displayOld}\\b`, 'g'), displayNew),
)

// 4) landing site — ONLY the isolated brand strings + the handle (never a bare
//    "Saldo" replace: the domain word lives on this page too)
edit('public/saldo/index.html', (s) =>
  [
    [handleOld, handleNew],
    [`var PRODUCT = { name: '${displayOld}' }`, `var PRODUCT = { name: '${displayNew}' }`],
    [`<title>${displayOld} — `, `<title>${displayNew} — `],
    [`<span data-brand>${displayOld}</span>`, `<span data-brand>${displayNew}</span>`],
  ].reduce((acc, [a, b]) => repl(acc, a, b), s),
)

// 5) projects locale titles (belt & suspenders — brandName already overrides)
for (const loc of ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'ru']) {
  const rel = `messages/${loc}.json`
  const p = path.join(ROOT, rel)
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  let touched = false
  for (const it of j?.projects?.items ?? []) if (it.title === displayOld) { it.title = displayNew; touched = true }
  if (touched) { fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n'); changed.push(rel) }
}

console.log(`\nRenamed  "${displayOld}" → "${displayNew}"   (npm: ${handleOld} → ${handleNew})`)
console.log('Files changed:\n  ' + (changed.length ? changed.join('\n  ') : '(none)'))
console.log('\nUntouched on purpose: the domain word "saldo" (= balance) and the URL /saldo.')
console.log('Next: cd packages/saldo && npm run build   (then commit; publish if desired).')
