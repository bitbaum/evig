/**
 * Generate per-page Open Graph images for the Monitor-Upcycling minisite.
 *
 * Target: 1200×630 (1.91:1) — the size Facebook, LinkedIn, Slack, X,
 * iMessage and WhatsApp all converge on. Composes from existing source
 * photos with smart crop so we don't ship blank social previews.
 *
 * Run idempotently — overwrites existing files in public/projects/upcycling/og/.
 * Source files must exist; if you add a new minisite page, add its mapping
 * below and rerun.
 */
import sharp from 'sharp'
import { mkdir, stat } from 'fs/promises'
import { join } from 'path'

const ROOT = 'public/projects/upcycling'
const OG_DIR = join(ROOT, 'og')

/**
 * Each entry: og output filename (without extension) ← source photo
 * relative to public/projects/upcycling/. Pick source images whose
 * dominant content reads at 1.91:1 — anything portrait-heavy gets
 * awkwardly cropped.
 */
const MAPPINGS = [
  // Landing — the finished lamp; the brand-defining visual
  { out: 'landing',       src: 'businessplan/hero-finished-poster.jpg' },
  // Wirkung — what's inside the box; visceral "real engineering" frame
  { out: 'wirkung',       src: 'businessplan/04-electronics-spread.jpg' },
  // Applications — finished panel again (this is what the user buys)
  { out: 'applications',  src: 'businessplan/hero-finished-poster.jpg' },
  // Gallery — the one piece with real photography
  { out: 'gallery',       src: 'gallery/lenovo-l2251pwd-finished-poster.jpg' },
  // Businessplan — finished result; matches the funder-grade pitch
  { out: 'businessplan',  src: 'businessplan/hero-finished-poster.jpg' },
  // Build-your-own — disassembled monitor; signals "this is doable"
  { out: 'build-your-own', src: 'businessplan/03-lcd-panel-removed.jpg' },
  // Status — source artifact (the actual monitor with its label); concrete
  { out: 'status',        src: 'businessplan/06-source-monitor-label.jpg' },
  // Lenovo guide — same poster as gallery's hero
  { out: 'lenovo-l2251pwd', src: 'gallery/lenovo-l2251pwd-finished-poster.jpg' },
]

await mkdir(OG_DIR, { recursive: true })

let totalBytes = 0
for (const { out, src } of MAPPINGS) {
  const inputPath = join(ROOT, src)
  await stat(inputPath) // throws if missing — fail loud
  const outputPath = join(OG_DIR, `${out}.jpg`)
  await sharp(inputPath)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toFile(outputPath)
  const size = (await stat(outputPath)).size
  totalBytes += size
  console.log(`  ${out.padEnd(20)} ← ${src.padEnd(45)}  ${(size / 1024).toFixed(0)}KB`)
}
console.log(`\nTotal: ${(totalBytes / 1024).toFixed(0)}KB across ${MAPPINGS.length} images`)
