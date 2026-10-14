#!/usr/bin/env node
/**
 * Fails when this repo states a retired fact as if it were current.
 *
 * The phrases are rows in bitbaum/fleet registers/retired.json. That audit
 * reads public docs on every default branch. This script is the same list,
 * run before the commit, including the generator that would otherwise write
 * the sentence back into docs/API_DOCUMENTATION.md on the next ingest.
 *
 * docs/archive is exempt: it is the record of what used to be true.
 * A line that already says the claim is retired / never / not is exempt too,
 * so the correction itself can name what it is correcting.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const phrases = [
  'Staff = `@revamp-it.ch` email',
  'Staff endpoints require `@revamp-it.ch` email',
  'for initial auto-provisioning',
  '(Port 3001)',
  'revampit.vercel.app',
  'staff-auth domain',
  'staff detection by @revamp-it.ch',
];
const negated =
  /\b(never|not|no longer|isn't|is not|does not|don't|retired|legacy|historical|superseded)\b/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.next') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const failures = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (rel.startsWith('docs/archive/')) continue;
  if (rel === 'scripts/ci/no-retired-claims.mjs') continue;
  if (!/\.(md|ts|tsx|mjs|js|yml|yaml|json|example|sql|sh)$/.test(rel) && !rel.endsWith('CLAUDE.md'))
    continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (negated.test(line)) return;
    for (const phrase of phrases) {
      if (line.includes(phrase)) failures.push(`${rel}:${i + 1}: ${phrase}`);
    }
  });
}

if (failures.length) {
  console.error('Retired claims stated as current:\n');
  for (const f of failures) console.error('  ' + f);
  console.error(
    '\nSay what is true now, or mark the line retired. The list is scripts/ci/no-retired-claims.mjs.',
  );
  process.exit(1);
}
console.log('no retired claims');
