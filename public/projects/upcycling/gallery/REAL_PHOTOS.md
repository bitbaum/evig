# Monitor-Upcycling Gallery — real photos

This folder holds production photos for the gallery at
`/projects/upcycling/gallery`. The page entry list lives in
`src/app/[locale]/projects/upcycling/gallery/GalleryClient.tsx`
in the `PIECES` array.

## How it works

- Each entry in `PIECES` has an `id` and an optional `image` filename.
- Optional `video` field for animated demos (mp4) — when set, the gallery
  renders a `<video autoplay muted loop playsinline>` and uses `image` as
  the poster.
- If neither is set (or the file 404s at runtime), the gallery falls back
  to the SVG `MonitorLampPlaceholder` (deterministic abstract gradient,
  seeded per piece).

## Adding a real photo

1. Convert/crop the photo. Recommended: 4:3 aspect, JPG. Then run
   `node scripts/optimize-minisite-photos.mjs` (max 1600px wide, mozjpeg
   q82 — typically ~150-300KB).
2. Save into this folder as `<piece-id>-finished.jpg`.
   Example: `dell-u2412m-finished.jpg`.
3. Add `image: '<filename>'` to the matching entry in `PIECES`.
4. Commit. The card swaps from placeholder to real photo on next deploy.

## Adding an animated demo (mp4)

1. Start from a GIF or short video clip.
2. Convert with ffmpeg — much smaller than GIF, plays natively:
   ```
   ffmpeg -i in.gif -movflags +faststart -pix_fmt yuv420p \
     -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
     -c:v libx264 -crf 28 -preset slow <piece-id>-finished.mp4
   ```
3. Extract a poster frame at ~1s in:
   ```
   ffmpeg -i <piece-id>-finished.mp4 -ss 00:00:01 -vframes 1 -q:v 3 \
     <piece-id>-finished-poster.jpg
   ```
4. Add `image: '<piece-id>-finished-poster.jpg'` and
   `video: '<piece-id>-finished.mp4'` to the matching entry in `PIECES`.

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
- **Lenovo L2251pwd** ← only one with a real photo right now (the looping
  mp4 + poster jpg in this folder are from the 28 May 2026 retrofit
  session at the Werkraum 4 workshop)
