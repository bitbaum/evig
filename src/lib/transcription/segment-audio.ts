/**
 * Audio segmentation for chunked transcription (server-side, ffmpeg).
 *
 * WHY: Groq Whisper caps uploads at ~25 MB, but real meeting recordings are
 * routinely bigger (a 2 h phone recording is 60–120 MB). Rather than rejecting
 * them, we transcode to 16 kHz mono MP3 (what Whisper resamples to anyway) and
 * split into fixed-length segments that each fit comfortably under the cap,
 * then transcribe segment by segment and join the text.
 *
 * ffmpeg is invoked as a subprocess (installed on the prod box by the deploy
 * script). All work happens in a private temp dir that is always removed.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { logger } from '@/lib/logger'

const execFileAsync = promisify(execFile)

// 16 kHz mono MP3 at 48 kbit/s ≈ 6 KB/s ⇒ a 15-minute segment ≈ 5.4 MB —
// far under Groq's 25 MB cap, with headroom for VBR spikes.
export const SEGMENT_SECONDS = 15 * 60
const AUDIO_ARGS = ['-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '48k']
// Transcoding runs at many times realtime; 10 minutes covers multi-hour
// recordings on a slow box while still bounding a hung process.
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000

let ffmpegChecked: boolean | null = null

/** Whether ffmpeg is runnable on this host (cached per process). */
export async function isFfmpegAvailable(): Promise<boolean> {
  if (ffmpegChecked !== null) return ffmpegChecked
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 10_000 })
    ffmpegChecked = true
  } catch {
    ffmpegChecked = false
  }
  return ffmpegChecked
}

export interface AudioSegment {
  /** Segment filename (ordering encoded as seg_000.mp3, seg_001.mp3, …). */
  name: string
  data: Buffer
}

/**
 * Transcode `audio` to 16 kHz mono MP3 and split into SEGMENT_SECONDS chunks.
 * Returns the segments in playback order. Throws when ffmpeg fails — callers
 * decide how to degrade (fall back to another provider or surface an error).
 */
export async function segmentAudioForTranscription(
  audio: Blob,
  filename: string,
): Promise<AudioSegment[]> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'protocol-audio-'))
  try {
    // Keep the original extension so ffmpeg's demuxer detection works for
    // containers where content sniffing is unreliable.
    const ext = path.extname(filename || '').toLowerCase() || '.bin'
    const inputPath = path.join(workDir, `input${ext}`)
    await writeFile(inputPath, Buffer.from(await audio.arrayBuffer()))

    const outputPattern = path.join(workDir, 'seg_%03d.mp3')
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-nostdin', '-y',
      '-i', inputPath,
      ...AUDIO_ARGS,
      '-f', 'segment',
      '-segment_time', String(SEGMENT_SECONDS),
      '-reset_timestamps', '1',
      outputPattern,
    ], { timeout: FFMPEG_TIMEOUT_MS })

    const names = (await readdir(workDir))
      .filter((n) => n.startsWith('seg_') && n.endsWith('.mp3'))
      .sort()
    if (names.length === 0) {
      throw new Error('ffmpeg produced no segments')
    }

    const segments: AudioSegment[] = []
    for (const name of names) {
      segments.push({ name, data: await readFile(path.join(workDir, name)) })
    }

    logger.info('Audio segmented for transcription', {
      inputBytes: audio.size,
      segments: segments.length,
      segmentSeconds: SEGMENT_SECONDS,
    })
    return segments
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
