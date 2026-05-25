/**
 * Sweeps every email template source file in src/lib/email/templates/ for
 * the `subject: '...${...}...'` regression pattern — single-quoted strings
 * with template-literal syntax inside them, where ${...} ships verbatim in
 * the email subject instead of being interpolated.
 *
 * The bug shipped for months in the newsletter template (commit ac509d26
 * caught it) and across 44 other templates (sed sweep — see commit message
 * for this test). Catching the regression at lint-time (file-scan) is the
 * cheapest way to keep new templates from re-introducing it.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const TEMPLATES_DIR = join(__dirname, '..', 'templates')

describe('email template subjects use backticks, not single quotes, when interpolating', () => {
  // Match the buggy shape: `subject: '...${...}...'`. The single-quoted
  // outer string means ${...} doesn't actually interpolate at runtime.
  // The fix is to swap the outer quotes to backticks.
  const REGRESSION_REGEX = /subject:\s*'[^']*\$\{/m

  const templateFiles = readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))

  // Sanity check: we actually walked the directory and found files.
  it('finds template files to scan', () => {
    expect(templateFiles.length).toBeGreaterThan(0)
  })

  for (const file of templateFiles) {
    it(`${file} has no subject: '...\${...}...' regression`, () => {
      const content = readFileSync(join(TEMPLATES_DIR, file), 'utf8')
      const match = content.match(REGRESSION_REGEX)
      if (match) {
        throw new Error(
          `${file} contains a subject string in single quotes with \${...} interpolation syntax — ` +
          `change the outer quotes to backticks. Offending fragment: ${match[0]}`,
        )
      }
    })
  }
})
