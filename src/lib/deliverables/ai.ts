/**
 * Context-aware AI for deliverables (SoC: domain logic, no HTTP/JSX).
 *
 * Two layers, per the product decision:
 *   1. DIRECT CONTEXT — a deliverable's own files (served from public/) are read
 *      and injected verbatim into the prompt. Accurate for "ask about THIS
 *      code/deliverable" and needs only the chat provider (Groq on prod).
 *   2. RAG INDEX — the same text is ingested into the Hirn pgvector store
 *      (hirn_documents/chunks) so Hirn can also search across deliverables. This
 *      is best-effort: embeddings run Ollama-first → OpenRouter, and if neither
 *      is reachable we log and continue — the direct-context answer still works.
 */

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { getDefaultChatProvider, type Message } from '@/lib/hirn/providers'
import { ingestDocument } from '@/lib/hirn/ingestion'
import { searchSimilar, formatContext } from '@/lib/hirn/retrieval'
import { isTextFile } from '@/config/deliverables'
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger'
import type { DeliverableDetail } from '@/lib/schemas/deliverables'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const PER_FILE_CHARS = 8000
const TOTAL_CONTEXT_CHARS = 16000
/** sourcePath prefix so deliverable docs are retrievable/scoped in the RAG store. */
const RAG_PREFIX = 'deliverable'

/**
 * Read a text file that is served from public/. Guards against path traversal —
 * only files that resolve INSIDE public/ are read. Returns null for binary,
 * missing, or out-of-bounds paths.
 */
async function readPublicFileText(url: string): Promise<string | null> {
  if (!url.startsWith('/') || !isTextFile(url)) return null
  const rel = decodeURIComponent(url.replace(/^\/+/, ''))
  const abs = path.join(PUBLIC_DIR, rel)
  // Containment check — abs must stay within PUBLIC_DIR.
  if (abs !== PUBLIC_DIR && !abs.startsWith(PUBLIC_DIR + path.sep)) return null
  try {
    const text = await readFile(abs, 'utf8')
    return text.length > PER_FILE_CHARS ? text.slice(0, PER_FILE_CHARS) + '\n… (gekürzt)' : text
  } catch {
    return null
  }
}

function sourceTypeFor(name: string): 'markdown' | 'code' | 'text' | 'json' {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'md') return 'markdown'
  if (ext === 'json') return 'json'
  if (['html', 'htm', 'css', 'js', 'ts', 'tsx', 'jsx', 'svg', 'xml', 'yml', 'yaml'].includes(ext)) return 'code'
  return 'text'
}

/** Collect the deliverable's own text (meta + description + file contents). */
async function collectDeliverableText(deliverable: DeliverableDetail): Promise<{
  header: string
  files: { name: string; url: string; content: string }[]
}> {
  const header = [
    `Titel: ${deliverable.title}`,
    `Typ: ${deliverable.type}`,
    deliverable.description ? `Beschreibung: ${deliverable.description}` : '',
  ].filter(Boolean).join('\n')

  const files: { name: string; url: string; content: string }[] = []
  let budget = TOTAL_CONTEXT_CHARS
  for (const f of deliverable.files ?? []) {
    if (budget <= 0) break
    const content = await readPublicFileText(f.url)
    if (!content) continue
    const clipped = content.length > budget ? content.slice(0, budget) + '\n… (gekürzt)' : content
    budget -= clipped.length
    files.push({ name: f.name, url: f.url, content: clipped })
  }
  return { header, files }
}

/**
 * Ingest a deliverable into the Hirn RAG store (best-effort). One document per
 * text file, tagged so it's retrievable and scoped. Safe to call repeatedly —
 * ingestDocument upserts by sourcePath.
 */
export async function ingestDeliverable(deliverable: DeliverableDetail): Promise<void> {
  try {
    const { files } = await collectDeliverableText(deliverable)
    const descBlock = deliverable.description
      ? `${deliverable.title}\n\n${deliverable.description}`
      : deliverable.title

    await ingestDocument({
      sourcePath: `${RAG_PREFIX}/${deliverable.id}/_meta`,
      sourceType: 'text',
      title: `Liefergegenstand: ${deliverable.title}`,
      content: descBlock,
      metadata: { deliverableId: deliverable.id, kind: 'deliverable', field: 'meta' },
    })

    for (const f of files) {
      await ingestDocument({
        sourcePath: `${RAG_PREFIX}/${deliverable.id}/${f.name}`,
        sourceType: sourceTypeFor(f.name),
        title: `${deliverable.title} — ${f.name}`,
        content: f.content,
        metadata: { deliverableId: deliverable.id, kind: 'deliverable', file: f.name },
      })
    }
    logger.info('Deliverable ingested into Hirn RAG', { deliverableId: deliverable.id, files: files.length })
  } catch (error) {
    // Embeddings unavailable (no Ollama/OpenRouter) or store error — the
    // direct-context path still answers, so never let this break the request.
    logger.warn('Deliverable RAG ingestion skipped', {
      deliverableId: deliverable.id,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export interface AskTurn {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Answer a question grounded in a deliverable. Direct-context is primary;
 * related chunks from the RAG store are added when retrieval is available.
 */
export async function answerDeliverableQuestion(
  deliverable: DeliverableDetail,
  message: string,
  history: AskTurn[] = [],
): Promise<string> {
  const { header, files } = await collectDeliverableText(deliverable)

  const fileBlocks = files.length
    ? files.map((f) => `--- Datei: ${f.name} ---\n${f.content}`).join('\n\n')
    : '(keine lesbaren Dateien hinterlegt)'

  // Best-effort cross-deliverable retrieval — never fatal.
  let relatedBlock = ''
  try {
    const results = await searchSimilar(message, {
      topK: 3,
      minSimilarity: 0.55,
      sourcePaths: [`${RAG_PREFIX}/%`],
    })
    const other = results.filter((r) => !r.document.sourcePath.startsWith(`${RAG_PREFIX}/${deliverable.id}/`))
    if (other.length) relatedBlock = `\n\nVERWANDTER KONTEXT (andere Liefergegenstände):\n${formatContext(other)}`
  } catch {
    /* retrieval/embeddings unavailable — direct context is enough */
  }

  const systemPrompt = `Du bist Hirn, der Assistent der ${ORG.name}-Plattform. Beantworte Fragen zu DIESEM Liefergegenstand und seinem Code/Inhalt.

LIEFERGEGENSTAND:
${header}

DATEIEN / CODE:
${fileBlocks}${relatedBlock}

REGELN:
- Antworte auf Deutsch; schreibt die Person in einer anderen Sprache, antworte in dieser Sprache.
- Schweizer Deutsch: «ss» statt «ß», echte Umlaute (ä, ö, ü).
- Stütze dich AUSSCHLIESSLICH auf den obigen Inhalt. Erfinde nichts. Sag ehrlich, wenn die Antwort nicht im Inhalt steht.
- Bei Code-Fragen: zitiere die relevante Stelle knapp und erkläre sie. Nutze Markdown-Codeblöcke.
- Fasse dich klar und hilfreich.`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8),
    { role: 'user', content: message },
  ]

  const provider = await getDefaultChatProvider()
  const response = await provider.chat({ messages, temperature: 0.3, maxTokens: 900 })
  // Enforce Swiss German deterministically — the model doesn't always honour the
  // «ss statt ß» rule from the prompt. Safe: ß→ss is always correct in de-CH.
  return response.content.replace(/ß/g, 'ss')
}
