# Monitor-Upcycling Gallery — real photos

This folder holds production photos for the gallery at
`/projects/upcycling/gallery`. The page entry list lives in
`src/app/[locale]/projects/upcycling/gallery/GalleryClient.tsx`
in the `PIECES` array.

## How it works

- Each entry in `PIECES` has an `id` and an optional `image` filename.
- If `image` is set AND the file exists in this folder, the gallery
  renders the JPG/GIF.
- If `image` is missing, OR the file 404s at runtime, the gallery falls
  back to the SVG `MonitorLampPlaceholder` (deterministic abstract
  gradient, seeded per piece).

## Adding a real photo

1. Convert/crop the photo. Recommended: 4:3 aspect, 1600px on the long
   edge, JPG quality 85, or a small GIF if it's animated.
2. Save into this folder as `<piece-id>-finished.jpg` (or `.gif`).
   Example: `dell-u2412m-finished.jpg`.
3. Add `image: '<filename>'` to the matching entry in `PIECES`.
4. Commit. The card swaps from placeholder to real photo on next deploy.

## Models currently retrofitted

From `Recreazzz_Anleitungen_zu_Umbau/! Infos zu umgebautenModellen.md`
(revamp-it / ReCreaZZZ, 2025-02-26). 12 successful retrofits to date:

- NEC Multisync E233 WMi
- Lenovo 24"
- Lenovo T2254A (2015)
- DELL U2312HMt (2013)
- DELL U2412M (2012) — two PCB revisions
- DELL U2713Hb (2014)
- DELL P2418D (2018)
- HP EliteDisplay E242 (July 2017)
- HP E24i G4 (2021) — two hardware revisions
- HP E243m (with built-in speakers)
- ASUS V247 (April 2011)
- EIZO EV2315W
- **Lenovo L2251pwd** ← only one with a real photo right now (the GIF
  in this folder is from the 28 May 2026 retrofit session at the
  Werkraum 4 workshop)
