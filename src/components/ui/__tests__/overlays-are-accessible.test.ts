/**
 * @jest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Every modal-style overlay is keyboard-operable.
 *
 * `<Modal>` and `<Drawer>` own Escape-to-close, initial focus, a Tab cycle and
 * focus restoration (via useFocusTrap). Two dialogs hand-rolled their own
 * `fixed inset-0` shell and got none of it: a keyboard user could tab straight
 * out of an open dialog into the page behind it, and could not dismiss it
 * without finding the ✕ — in the appointment BOOKING form, of all places.
 *
 * The rule: if a component paints a full-viewport overlay, it must either use
 * the primitives or call useFocusTrap itself.
 *
 * ALLOWLIST is for shapes that are genuinely not modal dialogs — transparent
 * click-catchers that close a dropdown, and the primitives themselves.
 */

const COMPONENTS = join(process.cwd(), 'src', 'components');
const APP = join(process.cwd(), 'src', 'app');

const ALLOWLIST = new Set([
  // The primitives themselves — they ARE the implementation.
  'src/components/ui/Modal.tsx',
  'src/components/ui/Drawer.tsx',
  // Transparent click-catchers that dismiss a dropdown/popover. No focusable
  // content, no dialog semantics — trapping focus in them would be wrong.
  'src/components/erfassung/AIFieldIndicator.tsx',
  'src/components/ui/IconPicker.tsx',
  'src/components/hirn/HirnProviderSelector.tsx',
  // Admin shell's own sidebar scrim.
  'src/app/admin/AdminLayoutClient.tsx',
  // Native <dialog>: the platform provides the trap.
  'src/components/admin/CommandBar.tsx',
]);

function sourceFiles(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx$/.test(entry) ? [full] : [];
  });
}

const overlays = [...sourceFiles(COMPONENTS), ...sourceFiles(APP)]
  .filter((file) => {
    const src = readFileSync(file, 'utf8');
    // A full-viewport overlay with a visible scrim. Transparent catchers
    // (no bg-*) are excluded by requiring a background on the same element.
    return /className=["'`][^"'`]*fixed inset-0[^"'`]*bg-(black|surface-overlay)/.test(src);
  })
  .map((file) => relative(process.cwd(), file))
  .filter((rel) => !ALLOWLIST.has(rel));

describe('modal overlays are keyboard-operable', () => {
  it('finds overlays to check (guards an always-green sweep)', () => {
    // If this drops to zero the detector broke, not the codebase.
    expect(overlays.length + ALLOWLIST.size).toBeGreaterThan(5);
  });

  it.each(overlays.length ? overlays : ['(none)'])(
    '%s uses Modal/Drawer or calls useFocusTrap',
    (rel) => {
      if (rel === '(none)') return;
      const src = readFileSync(join(process.cwd(), rel), 'utf8');
      // Match a CALL, not a mention. A bare /useFocusTrap/ also matches
      // `useFocusTrapDISABLED` or a comment — which is exactly how this
      // assertion first passed against a deliberately broken file during
      // mutation testing. Require `useFocusTrap(` or `useFocusTrap<…>(`.
      const callsFocusTrap = /useFocusTrap\s*(<[^>]*>)?\s*\(/.test(src);
      const usesPrimitive = /<(Modal|Drawer)[\s>]/.test(src);
      expect(callsFocusTrap || usesPrimitive).toBe(true);
    },
  );
});
