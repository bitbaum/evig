# Monitor-Upcycling Gallery — real photos

This folder holds production photos for the gallery at
`/projects/upcycling/gallery`. The piece list lives in
`src/data/upcycling-gallery.ts` (`PIECES` array). Asset paths are also
referenced from `src/config/upcycling-assets.ts`.

## How it works

- Each entry in `PIECES` has an `id` and optional `image` / `video` filenames
  under `public/projects/upcycling/gallery/`.
- When `video` is set, the gallery renders `<video autoplay muted loop playsinline>`
  and uses `image` as the poster (respects `prefers-reduced-motion`).
- If no files are set, the gallery falls back to `MonitorLampPlaceholder`
  (deterministic abstract gradient, seeded per piece).

## Adding a real photo

1. Convert/crop the photo. Recommended: 4:3 aspect, JPG. Then run
   `node scripts/optimize-minisite-photos.mjs` (max 1600px wide, mozjpeg
   q82 — typically ~150–300KB).
2. Save into this folder as `<piece-id>-finished-poster.jpg` (and optional
   `<piece-id>-finished.mp4`).
3. Update the matching entry in `src/data/upcycling-gallery.ts`.
4. Commit. The card swaps from placeholder to real photo on next deploy.

## Models in the gallery

The 13 entries mirror the workshop model list in `src/data/upcycling-gallery.ts`.
Only models with files under this folder show real photos; the rest stay in the
queue with SVG placeholders until documented.

Other workshop photos (business plan, Lenovo guide) live in sibling folders
under `public/projects/upcycling/`.
