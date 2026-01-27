/**
 * API: Voice-to-Product Erfassung
 *
 * POST /api/admin/erfassung/voice
 * Accepts audio file, transcribes it, and returns structured product data.
 *
 * Flow:
 * 1. Receive audio blob from browser
 * 2. Send to local Whisper transcription service
 * 3. Send transcribed text to Ollama for structured parsing
 * 4. Return ErfassungFormData ready to fill the form
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'

// Transcription service URL
const TRANSCRIPTION_URL = process.env.TRANSCRIPTION_URL || 'http://localhost:5111'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

// Product form structure for Ollama to fill
const PRODUCT_SCHEMA = `{
  "hersteller": "manufacturer name (Dell, Lenovo, HP, Apple, etc.)",
  "produktname": "product model name",
  "kurzbeschreibung": "short German description of the product",
  "specs": [
    { "key": "CPU", "value": "processor model" },
    { "key": "RAM", "value": "memory amount" },
    { "key": "Speicher", "value": "storage type and size" },
    { "key": "Display", "value": "screen size and resolution" }
  ],
  "verkaufspreis": "price in CHF as number only",
  "zustand": "one of: new, like_new, good, fair, poor",
  "hauptkategorie": "10 for Laptops, 20 for Desktop PCs, 30 for Monitors, 40 for Peripherals",
  "unterkategorie": "101 for Business Laptops, 102 for Consumer, 103 for Gaming",
  "kundenprofile": ["suitable profiles: oma, buero, chiller, gamer, kreativ, dev, student"],
  "bemerkungen": "any additional notes about condition or features"
}`

const OLLAMA_PROMPT = `Du bist ein Assistent für die Produkterfassung bei RevampIT, einem Schweizer Non-Profit für gebrauchte IT-Geräte.

Der Benutzer hat folgendes gesagt (transkribiert von Sprache):
"{TEXT}"

Extrahiere die Produktinformationen und fülle folgendes JSON-Schema aus. Wenn Informationen fehlen, nutze sinnvolle Standardwerte basierend auf dem Produkttyp.

Schema:
${PRODUCT_SCHEMA}

Wichtige Regeln:
- Preise in CHF ohne Währungssymbol
- Zustand mappen: "gut" -> "good", "wie neu" -> "like_new", "neu" -> "new", "akzeptabel" -> "fair", "schlecht" -> "poor"
- Bei Laptops: Kategorien 10 (Hauptkategorie) und 101/102/103 (Unterkategorie je nach Typ)
- Kundenprofile basierend auf Gerät wählen (z.B. ThinkPad -> buero, dev; Gaming Laptop -> gamer)
- Beschreibung auf Deutsch
- Specs basierend auf bekanntem Modell ergänzen falls nicht genannt

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    // Check permission - erfassung is part of products section
    if (!canAccessSection(user, 'products')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für Produkterfassung' },
        { status: 403 }
      )
    }

    // Get audio from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Keine Audiodatei empfangen' },
        { status: 400 }
      )
    }

    logger.info('Voice erfassung started', {
      userId: session.user.id,
      audioSize: audioFile.size,
      audioType: audioFile.type,
    })

    // Step 1: Transcribe audio
    const transcribeFormData = new FormData()
    transcribeFormData.append('audio', audioFile)

    const transcribeResponse = await fetch(
      `${TRANSCRIPTION_URL}/transcribe?language=de`,
      {
        method: 'POST',
        body: transcribeFormData,
      }
    )

    if (!transcribeResponse.ok) {
      const error = await transcribeResponse.text()
      logger.error('Transcription failed', { error })
      return NextResponse.json(
        { error: 'Transkription fehlgeschlagen', details: error },
        { status: 500 }
      )
    }

    const transcription = await transcribeResponse.json()
    const transcribedText = transcription.text

    if (!transcribedText || transcribedText.trim() === '') {
      return NextResponse.json(
        { error: 'Keine Sprache erkannt. Bitte erneut versuchen.' },
        { status: 400 }
      )
    }

    logger.info('Transcription complete', {
      text: transcribedText,
      language: transcription.language,
      duration: transcription.duration_processing,
    })

    // Step 2: Parse with Ollama
    const ollamaPrompt = OLLAMA_PROMPT.replace('{TEXT}', transcribedText)

    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: ollamaPrompt,
        stream: false,
        options: {
          temperature: 0.3,  // Low temperature for consistent output
        },
      }),
    })

    if (!ollamaResponse.ok) {
      const error = await ollamaResponse.text()
      logger.error('Ollama parsing failed', { error })
      return NextResponse.json(
        { error: 'KI-Parsing fehlgeschlagen', details: error },
        { status: 500 }
      )
    }

    const ollamaResult = await ollamaResponse.json()
    const responseText = ollamaResult.response

    // Extract JSON from response (in case there's extra text)
    let productData
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      logger.error('Failed to parse Ollama response', {
        response: responseText,
        error: parseError,
      })
      return NextResponse.json(
        {
          error: 'Konnte Produktdaten nicht extrahieren',
          transcription: transcribedText,
          rawResponse: responseText,
        },
        { status: 500 }
      )
    }

    logger.info('Voice erfassung complete', {
      userId: session.user.id,
      product: productData.produktname,
    })

    return NextResponse.json({
      success: true,
      transcription: transcribedText,
      data: productData,
    })

  } catch (error) {
    logger.error('Voice erfassung error', { error })
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
