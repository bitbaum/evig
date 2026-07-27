# evig — Brand Assets

Single source for evig's logo, mark, and identity assets. **Vectors are canonical**
(`*.svg`); the `png/` folder holds rasterized exports for contexts that can't take SVG
(social avatars, some favicons, email signatures, OG share cards).

Full brand guidelines (colour, type, voice, misuse): the **evig Brand System** artifact.

---

## The system in one line

Electric **Ion Lime** `#B6F531` on near-black **Obsidian** `#0A0B0A` — a single-stroke
**eternal loop** (∞ / Möbius) for "evig" = *eternal* + circular reuse. Reuse as **energy**,
not obligation.

| Token | Hex | Use |
|-------|-----|-----|
| Ion Lime | `#B6F531` | the accent — mark, one CTA per surface, focus |
| Obsidian | `#0A0B0A` | ground / dark backgrounds |
| Ink | `#0A0A0A` | text/mark on light; **required** as text colour on lime fills |
| Paper | `#FAFCF7` | text/mark on dark |

Wordmark = **Space Grotesk** (outlined in the lockups — no font dependency).
Labels/tagline = **IBM Plex Mono**. Body = **Inter**.

---

## Which file do I use?

### Mark only (∞, no wordmark)
| File | When |
|------|------|
| `evig-mark.svg` | inline in code — inherits `currentColor` |
| `evig-mark-lime.svg` | lime mark on a dark surface |
| `evig-mark-ink.svg` | ink mark on a light surface |
| `png/mark-lime-512.png` · `png/mark-ink-512.png` | raster mark, transparent bg |

### Logo (mark + "evig")
| File | When |
|------|------|
| `evig-logo.svg` | inline — both mark + wordmark inherit `currentColor` |
| `evig-logo-dark.svg` | on dark (lime mark + paper wordmark) |
| `evig-logo-light.svg` | on light (ink) |
| `evig-logo-stacked-dark.svg` · `-light.svg` | vertical lockup (narrow spaces) |
| `evig-logo-tagline-dark.svg` · `-light.svg` | lockup + "raise for longer" |
| `png/logo-dark-1040.png` | email signatures, slide decks, docs |

### App icon / favicon (rounded obsidian tile + lime mark)
| File | When |
|------|------|
| `evig-icon.svg` | source tile |
| `png/favicon-16/32/48/64.png` | favicons |
| `png/favicon-192.png` · `favicon-512.png` | PWA / web manifest |
| `png/apple-touch-icon.png` (180) | iOS home screen |

### Social
| File | When |
|------|------|
| `evig-avatar.svg` · `png/avatar-256.png` · `png/avatar-512.png` | profile pictures (obsidian circle + lime mark) |
| `png/og-card-1200x630.png` | Open Graph / Twitter share card |

---

## Clear space & minimum size
- **Clear space:** keep at least the height of the mark's loop clear on all sides.
- **Minimum mark size:** 16px. Below that, use the solid tile favicon, not the bare stroke.

## Don't
- Don't recolour the mark to anything but lime / ink / paper / `currentColor`.
- Don't put **paper/white** text on a lime fill — lime needs **ink** text (contrast).
- Don't add gradients, shadows, or outlines to the mark.
- Don't stretch, rotate (beyond the built-in −8° tilt), or re-space the wordmark.
- Don't reintroduce the old recycling-green — it's retired.

## Regenerating
SVGs are generated from the mark geometry SSOT (`src/config/brand.ts` once wired) via the
build script; PNGs are rasterized from those SVGs with `sharp`. See the design pipeline in
the brand-system notes. Wordmark glyphs are pre-outlined (Space Grotesk) so the lockups
render identically without the font installed.
