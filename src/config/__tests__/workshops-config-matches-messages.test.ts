/**
 * The workshop category labels exist twice. This keeps the copies identical.
 *
 * `WORKSHOP_CATEGORIES` in src/config/workshops.ts carries a German `name` and
 * `description` per category, and messages/de.json carries the same strings
 * again under `workshops.categories.<id>` and
 * `workshops.categoryDescriptions.<id>`. The public browse page renders the
 * MESSAGE version (`tCat(cat.id)`); the config version is load-bearing
 * elsewhere — `normalizeCategoryId` matches legacy database rows on the German
 * name, and the admin filter uses it as an option value.
 *
 * So the second copy cannot be deleted today without untangling both of those.
 * What it CAN do is stop drifting: edit one and this fails. That turns an
 * invisible duplication into a gated one, which is the honest interim state —
 * a translator fixing the message file and leaving the config behind would
 * otherwise produce two different labels for one category, with the admin and
 * the public page disagreeing.
 *
 * The real fix is to drop `name`/`description` from the config entirely once
 * legacy normalisation no longer needs them. Until then, this is the seam.
 */

import { WORKSHOP_CATEGORIES } from '@/config/workshops';
import de from '../../../messages/de.json';

describe('workshop category labels match the message files', () => {
  const categories = de.workshops.categories as Record<string, string>;
  const descriptions = de.workshops.categoryDescriptions as Record<string, string>;

  it('sweeps a non-empty category list', () => {
    // A sweep over zero categories would pass every assertion below.
    expect(WORKSHOP_CATEGORIES.length).toBeGreaterThan(5);
  });

  it('every config category has a message entry', () => {
    const missing = WORKSHOP_CATEGORIES.filter((c) => !categories[c.id]).map(
      (c) => `workshops.categories.${c.id} is missing`,
    );
    expect(missing).toEqual([]);
  });

  it('config name and message label are identical', () => {
    const drifted = WORKSHOP_CATEGORIES.filter((c) => categories[c.id] !== c.name).map(
      (c) => `${c.id}: config "${c.name}" vs message "${categories[c.id]}"`,
    );
    expect(drifted).toEqual([]);
  });

  it('config description and message description are identical', () => {
    const drifted = WORKSHOP_CATEGORIES.filter((c) => descriptions[c.id] !== c.description).map(
      (c) => `${c.id}: config "${c.description}" vs message "${descriptions[c.id]}"`,
    );
    expect(drifted).toEqual([]);
  });
});
