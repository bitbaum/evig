#!/usr/bin/env node

import { basename, dirname, extname, join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

const DEFAULT_SERVICE_URL = process.env.TRANSCRIPTION_URL || 'http://localhost:5111'
const DEFAULT_LANGUAGE = 'de'
const DEFAULT_MODEL = process.env.WHISPER_MODEL || 'small'

function printUsage() {
  console.log(`Usage:
  npm run transcribe:local -- "/path/to/recording.m4a" [--model small] [--language de] [--output /path/to/transcript.txt]

Options:
  --model       tiny | base | small | medium | large-v3 (default: ${DEFAULT_MODEL})
  --language    de | en | auto (default: ${DEFAULT_LANGUAGE})
  --output      transcript text output path
  --service-url transcription service URL (default: ${DEFAULT_SERVICE_URL})

The script writes:
  - transcript text to the output path
  - full transcription metadata to a matching .json file`)
}

function parseArgs(argv) {
  const args = {
    filePath: null,
    language: DEFAULT_LANGUAGE,
    model: DEFAULT_MODEL,
    output: null,
    serviceUrl: DEFAULT_SERVICE_URL,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--help' || value === '-h') {
      args.help = true
      continue
    }
    if (value === '--language') {
      args.language = argv[++index]
      continue
    }
    if (value === '--model') {
      args.model = argv[++index]
      continue
    }
    if (value === '--output') {
      args.output = argv[++index]
      continue
    }
    if (value === '--service-url') {
      args.serviceUrl = argv[++index]
      continue
    }
    if (!args.filePath) {
      args.filePath = value
      continue
    }
    throw new Error(`Unexpected argument: ${value}`)
  }

  return args
}

function getOutputPath(filePath, output) {
  if (output) return output
  const dir = dirname(filePath)
  const name = basename(filePath, extname(filePath))
  return join(dir, `${name}.transcript.txt`)
}

function getJsonOutputPath(textOutputPath) {
  return textOutputPath.replace(/\.txt$/i, '.json')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printUsage()
    return
  }
  if (!args.filePath) {
    printUsage()
    process.exitCode = 1
    return
  }

  const audioBytes = await readFile(args.filePath)
  const fileName = basename(args.filePath)
  const formData = new FormData()
  formData.append('audio', new Blob([audioBytes]), fileName)

  const url = new URL('/transcribe', args.serviceUrl)
  url.searchParams.set('language', args.language)
  url.searchParams.set('model', args.model)

  console.log(`Transcribing ${fileName} with ${args.model} (${args.language})...`)
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const rawBody = await response.text()
  if (!response.ok) {
    throw new Error(`Transcription failed (${response.status}): ${rawBody}`)
  }

  const result = JSON.parse(rawBody)
  const transcript = typeof result.text === 'string' ? result.text.trim() : ''
  if (!transcript) {
    throw new Error('Transcription returned no text.')
  }

  const outputPath = getOutputPath(args.filePath, args.output)
  const jsonOutputPath = getJsonOutputPath(outputPath)

  await writeFile(outputPath, `${transcript}\n`, 'utf8')
  await writeFile(jsonOutputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')

  console.log(`Transcript: ${outputPath}`)
  console.log(`Metadata:   ${jsonOutputPath}`)
  console.log(`Audio:      ${result.duration_audio ?? 'unknown'}s`)
  console.log(`Processing: ${result.duration_processing ?? 'unknown'}s`)
  console.log(`Language:   ${result.language ?? 'unknown'} (${result.language_probability ?? 'n/a'})`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
