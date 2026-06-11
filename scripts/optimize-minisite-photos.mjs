/**
 * Compress all Monitor-Upcycling minisite photos.
 *
 * JPGs → max 1600px wide, quality 82. Expected ~150-300KB each (was 2.5-3MB).
 * Source files are overwritten — these are committed photos, the originals
 * live in /home/g/Nextcloud/Kreislaufnutzung_IT/ if we ever need to redo.
 */
import sharp from 'sharp'
import { readdir, stat, rename } from 'fs/promises'
import { join } from 'path'

const ROOT = 'public/projects/upcycling'
const FOLDERS = ['businessplan', 'competitor-benchmark']

async function compress(file) {
  const tmp = file + '.tmp.jpg'
  await sharp(file)
    .rotate() // honor EXIF rotation before resize
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(tmp)
  const before = (await stat(file)).size
  const after = (await stat(tmp)).size
  await rename(tmp, file)
  return { before, after }
}

let totalBefore = 0, totalAfter = 0
for (const folder of FOLDERS) {
  const dir = join(ROOT, folder)
  for (const entry of await readdir(dir)) {
    if (!entry.toLowerCase().endsWith('.jpg')) continue
    const file = join(dir, entry)
    const { before, after } = await compress(file)
    totalBefore += before
    totalAfter += after
    const pct = ((1 - after / before) * 100).toFixed(0)
    console.log(`  ${entry.padEnd(40)} ${(before/1024/1024).toFixed(2)}MB → ${(after/1024).toFixed(0)}KB (-${pct}%)`)
  }
}
console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(2)}MB → ${(totalAfter/1024/1024).toFixed(2)}MB (-${((1-totalAfter/totalBefore)*100).toFixed(0)}%)`)
