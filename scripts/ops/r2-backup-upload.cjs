#!/usr/bin/env node
/**
 * Upload one file to the PRIVATE R2 backups bucket, verify it landed, then prune
 * old objects. Hardened so a transient R2/network blip retries instead of losing
 * a night's backup, and so a missing/short upload is caught (not silently "ok").
 *
 * SDK resolution order (first that loads wins) — the backup must not depend on
 * the app's redeployable node_modules:
 *   1. /opt/revampit/ops/node_modules  (pinned, installed once — primary)
 *   2. $APP_DIR/node_modules           (the live app — fallback)
 *
 * Usage:  node r2-backup-upload.cjs <localFile> <objectKey>
 * Env:    S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 *         BACKUP_BUCKET  (default: revampit-backups)
 *         RETENTION_DAYS (default: 30)
 *         APP_DIR        (default: /opt/revampit/app)
 *         SDK_DIR        (optional explicit @aws-sdk/client-s3 path)
 */
const fs = require('fs')

function loadSdk() {
  const candidates = [
    process.env.SDK_DIR,
    '/opt/revampit/ops/node_modules/@aws-sdk/client-s3',
    `${process.env.APP_DIR || '/opt/revampit/app'}/node_modules/@aws-sdk/client-s3`,
  ].filter(Boolean)
  for (const p of candidates) {
    try {
      return require(p)
    } catch {
      /* try next */
    }
  }
  throw new Error(`@aws-sdk/client-s3 not found in: ${candidates.join(', ')}`)
}

const {
  S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand,
} = loadSdk()

const [, , localFile, objectKey] = process.argv
if (!localFile || !objectKey) {
  console.error('usage: r2-backup-upload.cjs <localFile> <objectKey>')
  process.exit(2)
}

const bucket = process.env.BACKUP_BUCKET || 'revampit-backups'
const retentionDays = parseInt(process.env.RETENTION_DAYS || '30', 10)

for (const k of ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
  if (!process.env[k]) {
    console.error(`missing required env ${k}`)
    process.exit(2)
  }
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  maxAttempts: 5, // SDK-level retry on top of our own loop
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function withRetry(label, fn, tries = 4) {
  let lastErr
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < tries) {
        const wait = Math.min(2 ** i * 500, 8000)
        console.error(`${label}: attempt ${i}/${tries} failed (${e.message}) — retry in ${wait}ms`)
        await sleep(wait)
      }
    }
  }
  throw new Error(`${label} failed after ${tries} attempts: ${lastErr && lastErr.message}`)
}

async function main() {
  const body = fs.readFileSync(localFile)
  if (body.length === 0) throw new Error(`${localFile} is empty — refusing to upload`)

  await withRetry('put', () => s3.send(new PutObjectCommand({
    Bucket: bucket, Key: objectKey, Body: body, ContentType: 'application/octet-stream',
  })))

  // Verify the object actually landed at the expected size — an upload that
  // "succeeded" but stored 0/short bytes must fail loudly, not pass.
  const head = await withRetry('verify', () => s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey })))
  if (Number(head.ContentLength) !== body.length) {
    throw new Error(`verify mismatch for ${objectKey}: stored ${head.ContentLength}, expected ${body.length}`)
  }
  console.log(`uploaded+verified ${objectKey} (${body.length} bytes) → ${bucket}`)

  // Retention is best-effort: a prune failure must NOT fail the backup, because
  // the night's copy is already safely stored.
  try {
    const cutoff = Date.now() - retentionDays * 86400_000
    let removed = 0
    let ContinuationToken
    do {
      const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }))
      const old = (page.Contents || []).filter((o) => o.LastModified && o.LastModified.getTime() < cutoff)
      if (old.length) {
        await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: old.map((o) => ({ Key: o.Key })) } }))
        removed += old.length
      }
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (ContinuationToken)
    if (removed) console.log(`pruned ${removed} object(s) older than ${retentionDays}d`)
  } catch (e) {
    console.error(`WARN: prune failed (backup is safe): ${e.message}`)
  }
}

main().catch((e) => {
  console.error('backup upload FAILED:', e.message)
  process.exit(1)
})
