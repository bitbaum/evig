#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const messagesDir = path.join(repoRoot, 'messages');
const baselinePath = path.join(repoRoot, 'scripts', 'baselines', 'i18n-missing.json');
const defaultLocale = 'de';
const locales = ['fr', 'en', 'it', 'es', 'ja', 'ko', 'ru'];
const updateBaseline = process.argv.includes('--update-baseline');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(nested, nextPrefix);
  });
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

const baseMessages = readJson(path.join(messagesDir, `${defaultLocale}.json`));
const baseKeys = new Set(flattenKeys(baseMessages));

const currentMissing = Object.fromEntries(
  locales.map((locale) => {
    const localeMessages = readJson(path.join(messagesDir, `${locale}.json`));
    const localeKeys = new Set(flattenKeys(localeMessages));
    return [locale, uniqueSorted([...baseKeys].filter((key) => !localeKeys.has(key)))];
  }),
);

// Baseline shape: ONE entry per key, naming the locales it is missing from
// (locales in the canonical order above). The earlier shape — one key list per
// locale — wrote the same keys once per locale, six near-identical 90-line
// blocks for a file that states ~90 facts. A missing key is a fact; it is
// stated once. `byLocale`/`byKey` convert between the two views.
function byKey(missingByLocale) {
  const keys = {};
  for (const locale of locales) {
    for (const key of missingByLocale[locale] ?? []) {
      (keys[key] ??= []).push(locale);
    }
  }
  return Object.fromEntries(
    Object.keys(keys)
      .sort()
      .map((key) => [key, keys[key]]),
  );
}

function byLocale(missingByKey) {
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      Object.entries(missingByKey)
        .filter(([, missingIn]) => missingIn.includes(locale))
        .map(([key]) => key),
    ]),
  );
}

if (updateBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        description:
          'Known missing translation keys, one entry per key naming the locales it is missing from. The audit fails only on regressions beyond this baseline.',
        defaultLocale,
        locales,
        missing: byKey(currentMissing),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Updated i18n baseline: ${baselinePath}`);
  process.exit(0);
}

const baseline = fs.existsSync(baselinePath) ? byLocale(readJson(baselinePath).missing ?? {}) : {};

let hasRegression = false;

for (const locale of locales) {
  const baselineMissing = new Set(baseline[locale] ?? []);
  const missing = currentMissing[locale] ?? [];
  const newMissing = missing.filter((key) => !baselineMissing.has(key));
  const fixedMissing = [...baselineMissing].filter((key) => !missing.includes(key));

  console.log(
    `${locale}: ${missing.length} missing keys (${newMissing.length} new, ${fixedMissing.length} fixed since baseline)`,
  );

  if (newMissing.length > 0) {
    hasRegression = true;
    for (const key of newMissing.slice(0, 25)) {
      console.log(`  new missing: ${key}`);
    }
    if (newMissing.length > 25) {
      console.log(`  ...and ${newMissing.length - 25} more`);
    }
  }
}

if (hasRegression) {
  console.error(
    'i18n audit failed: update locale files or intentionally refresh scripts/baselines/i18n-missing.json.',
  );
  process.exit(1);
}

console.log('i18n audit passed: no missing-key regressions beyond baseline.');
