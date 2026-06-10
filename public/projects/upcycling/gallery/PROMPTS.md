# Monitor-Upcycling Gallery — AI Image Prompts

Generate 9 hero shots for the gallery page (`/projects/upcycling/gallery`)
using Grok Imagine, ChatGPT (DALL·E / GPT-4o), Midjourney, or another
image model.

**Drop the finished images into this folder using the filenames below.**
The component at `src/app/[locale]/projects/upcycling/gallery/GalleryClient.tsx`
already falls back to the SVG placeholder if a file is missing — no code
change needed once the JPGs are dropped in.

**Style discipline (apply across all 9):**
- Real-photograph aesthetic, NOT 3D render or illustration
- Soft, naturalistic lighting; one light source for the lamp's own glow
- Swiss/European interior context, restrained
- Sensor-realistic noise; mild lens character (Fujifilm X-T5 / 35 mm equiv.)
- Aspect 16:10 for the spotlight image, 4:3 for the rest
- No text, no watermarks, no logos
- The retrofitted monitor is THE subject — composition centred or
  rule-of-thirds; surroundings tasteful but secondary
- Common element: the monitor casing is intact; the screen surface is
  now a soft, even light field (no broken pixels, no image)

---

## Spotlight (16:10, ~2400×1500)

### `spotlight-lenovo-l2251pwd-art.jpg`
Tier: ART · Variant: art (saturated magenta/violet)
> A retrofitted Lenovo L2251pwd monitor (22 inch, matte black bezel)
> standing on its original stand. The screen surface now glows with a
> soft magenta-to-violet gradient — a saturated, gallery-installation
> light field. Plinth on a polished concrete floor in a contemporary
> Zurich art gallery, dim cool background, a single sculptural shadow
> falling left of frame. Cinematic, 16:10. Real photo, no text.

---

## Bento grid (4:3, ~1600×1200 each)

### `lenovo-l2251pwd-functional-1.jpg`
Tier: FUNCTIONAL · Variant: functional (cool neutral grey)
> A retrofitted Lenovo L2251pwd monitor used as a desk lamp on a
> minimal Scandinavian oak desk in a Zurich home office. Screen
> surface emits an even, cool-neutral 4000K light. A small leather
> notebook and a fountain pen in the foreground, morning daylight
> from a window left of frame. Honest, documentary feel — not staged
> too cleanly. Real photo, no text.

### `lenovo-l2251pwd-functional-2.jpg`
Tier: FUNCTIONAL · Variant: functional
> The same retrofitted Lenovo L2251pwd, this time on a workshop
> bench in a Swiss protected workshop (Geschützte Werkstatt) — a
> wooden bench with hand tools, soldering station, the LED driver
> visible behind the bezel. Honest workspace light, mid-day, warm
> overhead fluorescent. The monitor face glows cool-neutral. Real
> photo, no text.

### `lenovo-l2251pwd-decor-warm.jpg`
Tier: DECOR · Variant: warm (warm amber)
> A retrofitted Lenovo L2251pwd in a Swiss living room corner,
> beside a green velvet armchair and an open book. The screen emits
> a warm 2700K amber light, dusk outside, no other lights on. Cosy
> café/library mood. Composition rule-of-thirds, the lamp at the
> right third. Real photo, no text.

### `dell-u2412m-functional.jpg`
Tier: FUNCTIONAL · Variant: cool
> A retrofitted Dell U2412M monitor (24 inch, slightly rounder
> bezel, plastic stand) as a task lamp on a co-working desk in a
> renovated factory loft in Zurich. Concrete ceiling, exposed
> ductwork. The screen surface emits an even cool 5000K light onto
> a laptop and an architectural floor plan. Late afternoon. Real
> photo, no text.

### `hp-l2245wg-decor.jpg`
Tier: DECOR · Variant: warm
> A retrofitted HP L2245wg monitor on a marble side table in a
> boutique hotel lobby in Lucerne. Screen emits soft warm-white
> ambient light. Neutral travertine wall behind, a small ceramic
> vase with dried flowers in the foreground. Editorial interior
> magazine quality. Real photo, no text.

### `samsung-s24-decor.jpg`
Tier: DECOR · Variant: warm
> A retrofitted Samsung 24-inch monitor sitting on top of an open
> bookshelf in a Geneva apartment, glowing warm 2700K. Two
> hardcover books leaning against it on the right, a small succulent
> plant on the left. Soft golden-hour light through gauze curtains.
> Real photo, no text.

### `asus-mx259h-art.jpg`
Tier: ART · Variant: art
> A retrofitted Asus MX259H monitor mounted vertically on a white
> gallery wall as a piece of light art. Saturated magenta gradient
> field on the screen, the rest of the room dim. A small museum
> label below it (no text legible — blurred). Wide composition,
> wall fills 70% of frame. Real photo, no text.

### `eizo-flexscan-art.jpg`
Tier: ART · Variant: cool (cool teal)
> A retrofitted Eizo FlexScan monitor on a stainless-steel plinth
> in a Basel design studio. The screen surface emits a saturated
> cool teal field, very even. Polished concrete floor with the teal
> reflection. Background falls off into shadow. Architectural,
> minimal, museum-quality. Real photo, no text.

---

## Tier semantics

| Tier         | Mood                | Light temperature        |
|--------------|---------------------|--------------------------|
| `functional` | Office, utility     | Cool neutral 4000–5000K  |
| `decor`      | Home, café, hotel   | Warm amber 2400–2700K    |
| `art`        | Gallery, statement  | Saturated colour field   |

These align with the existing `MonitorLampPlaceholder` variants in
`src/app/[locale]/projects/upcycling/MonitorLampPlaceholder.tsx`.

---

## When you've generated the images

1. Drop the JPG files into this folder
   (`public/projects/upcycling/gallery/`)
2. The gallery page picks them up automatically (no code change needed
   once the wiring is in)
3. Optional: run `find public/projects/upcycling/gallery -name '*.jpg'`
   to confirm presence

If you want different filenames, update the `PIECES` array in
`GalleryClient.tsx` — the `id` field there matches the filename stem.
