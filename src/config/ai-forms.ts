/**
 * SSOT for every form the assistant is allowed to fill or change.
 *
 * A form appears here once. The API route reads this list to decide what the
 * model may write, and the form component reads the same specs — so a field
 * cannot exist for the model and not for the UI, or the other way round.
 *
 * Option lists are imported from the config that already defines them. Never
 * retype a palette or an enum here.
 */

import { defineFields, type FormTarget } from '@fleet/ai-forms';
import { UI_COLOR_PALETTE } from '@/config/ui-colors';

export const CATEGORY_FORM: FormTarget = {
  key: 'blog-category',
  name: 'Blog-Kategorie',
  fields: defineFields([
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      maxLength: 100,
      placeholder: 'z.B. Reparatur-Tipps',
    },
    {
      name: 'description',
      label: 'Beschreibung',
      type: 'textarea',
      maxLength: 500,
      hint: 'Ein bis zwei Sätze: worum geht es in dieser Kategorie.',
    },
    {
      name: 'color',
      label: 'Farbe',
      type: 'select',
      options: UI_COLOR_PALETTE.map((value) => ({ value })),
      // The form opens on the palette's first colour as a template default,
      // not as a choice the user made, so a fill may replace it.
      overridable: true,
    },
    {
      name: 'sort_order',
      label: 'Sortierung',
      type: 'number',
      min: 0,
      hint: 'Kleinere Zahlen erscheinen zuerst. Nur setzen, wenn eine Reihenfolge genannt wird.',
    },
    { name: 'is_active', label: 'Aktiv', type: 'boolean', overridable: true },
    // Derived from the name by generateSlug() and editable by hand. The model
    // has no business inventing a URL segment — letting it would silently
    // change where published posts live.
    { name: 'slug', label: 'URL-Segment', type: 'text', aiExcluded: true },
  ]),
  instructions: [
    'Antworte auf Deutsch, in Schweizer Schreibweise — immer "ss" statt "ß".',
    'Die Beschreibung ist für Leserinnen und Leser des Blogs, nicht für interne Notizen.',
    'Wähle eine Farbe nur, wenn der Text eine nennt oder klar nahelegt. Sonst die vorhandene lassen.',
  ],
};

/** Every form the assistant may touch. The client can only name these keys. */
export const AI_FORMS: readonly FormTarget[] = [CATEGORY_FORM];
