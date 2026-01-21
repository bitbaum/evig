# Hirn AI - RAG Knowledge System

Hirn AI ist ein modulares RAG (Retrieval Augmented Generation) System für RevampIT Administratoren. Es ermöglicht kontextbasierte Fragen zu Dokumentation, Code und internen Prozessen.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         Hirn AI                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   Admin UI  │───▶│  RAG Engine  │───▶│  AI Provider     │   │
│  │  (Chat)     │    │  (Retrieval) │    │  (Groq/Ollama)   │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
│         ▲                  │                                    │
│         │                  ▼                                    │
│  ┌─────────────┐    ┌──────────────┐                           │
│  │   API       │    │  pgvector    │                           │
│  │  Routes     │    │  (Embeddings)│                           │
│  └─────────────┘    └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Komponenten

### 1. Providers (`src/lib/hirn/providers/`)

Abstraktionsschicht für verschiedene AI-Anbieter:

| Provider | Chat | Embeddings | Kosten |
|----------|------|------------|--------|
| **Groq** | ✓ | ✗ | Gratis (mit Limits) |
| **Ollama** | ✓ | ✓ | Gratis (self-hosted) |
| **OpenAI** | ✓ | ✓ | Pay-per-use |
| **OpenRouter** | ✓ | ✗ | Pay-per-use |

**Standard-Konfiguration:**
- Chat: Groq (llama-3.3-70b-versatile)
- Embeddings: Ollama (nomic-embed-text, 768 Dimensionen)

### 2. Document Ingestion (`src/lib/hirn/ingestion.ts`)

Pipeline zum Indexieren von Dokumenten:

1. **Parsen**: Dokument lesen und Typ erkennen
2. **Hashing**: SHA256 für Änderungserkennung
3. **Chunking**: Semantische Aufteilung in ~1000 Zeichen
4. **Embedding**: Vektorgenerierung via Ollama
5. **Speichern**: pgvector Datenbank

**Unterstützte Dateitypen:**
- `.md`, `.mdx` - Markdown (mit Header-Awareness)
- `.ts`, `.tsx`, `.js`, `.jsx` - TypeScript/JavaScript
- `.py` - Python
- `.sql` - SQL
- `.txt` - Plain Text

### 3. Retrieval (`src/lib/hirn/retrieval.ts`)

Semantische Suche über Dokumente:

```typescript
import { searchSimilar } from '@/lib/hirn'

const results = await searchSimilar('Was ist RevampIT?', {
  topK: 5,           // Anzahl Ergebnisse
  minSimilarity: 0.5 // Mindest-Ähnlichkeit (0-1)
})
```

### 4. Chat Engine (`src/lib/hirn/chat.ts`)

RAG-powered Chat mit Kontextabruf:

```typescript
import { chat } from '@/lib/hirn'

const response = await chat('Erkläre das Permission-System', {
  sessionId: 'session-123',
  userId: 'user-456',
  topK: 5,
  temperature: 0.7
})
```

## Setup

### 1. Voraussetzungen

- PostgreSQL mit pgvector Extension
- Ollama (für Embeddings)
- Groq API Key (für Chat) oder alternatives Provider

### 2. Docker-Setup

Die `docker-compose.yml` verwendet automatisch das pgvector Image:

```yaml
db:
  image: pgvector/pgvector:pg15
```

### 3. Migration ausführen

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d revampit_cms \
  -f scripts/db/migrations/005-hirn-ai-rag.sql
```

### 4. Ollama Model installieren

```bash
ollama pull nomic-embed-text
```

### 5. Environment Variables

In `.env.local`:

```env
# Chat Provider (wähle einen)
GROQ_API_KEY=gsk_xxx           # Groq (gratis, empfohlen)
# OPENAI_API_KEY=sk-xxx        # OpenAI (kostenpflichtig)
# OPENROUTER_API_KEY=sk-or-xxx # OpenRouter (kostenpflichtig)

# Embeddings (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### 6. Dokumente indexieren

```bash
# Alle Docs indexieren
npx tsx scripts/hirn-ingest.ts --dir ./docs

# Einzelne Datei
npx tsx scripts/hirn-ingest.ts --file ./README.md

# Stats anzeigen
npx tsx scripts/hirn-ingest.ts --stats
```

## API Endpoints

### POST `/api/admin/hirn/chat`

Chat-Nachricht senden und Antwort erhalten.

**Request:**
```json
{
  "message": "Was ist RevampIT?",
  "sessionId": "session-123",
  "temperature": 0.7,
  "topK": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "RevampIT ist ein Schweizer Non-Profit...",
    "contextUsed": [...],
    "model": "llama-3.3-70b-versatile",
    "provider": "groq"
  }
}
```

### GET `/api/admin/hirn/history`

Chat-Verlauf abrufen.

- `?sessionId=xxx` - Nachrichten einer Session
- Ohne Parameter - Alle Sessions des Users

### GET `/api/admin/hirn/documents`

Indexierte Dokumente auflisten.

- `?stats=true` - Nur Statistiken
- `?sourceType=markdown` - Nach Typ filtern

## Admin UI

Zugriff über: `/admin/hirn/ai`

Features:
- Chat-Interface mit Kontext-Anzeige
- Session-Management
- Dokumenten-Statistiken

## Troubleshooting

### "No embedding provider available"

Ollama läuft nicht oder hat kein Embedding-Model:

```bash
# Ollama starten
ollama serve

# Model installieren
ollama pull nomic-embed-text
```

### "Groq API error: 401"

API Key ungültig oder nicht gesetzt:

```bash
# In .env.local
GROQ_API_KEY=gsk_xxx
```

Kostenlosen Key erstellen: https://console.groq.com

### "vector type does not exist"

pgvector Extension nicht installiert:

```bash
# Docker-Container neustarten mit pgvector Image
docker compose up -d --force-recreate db
```

## Architektur-Entscheidungen

### Warum pgvector statt externer Vektor-DB?

- Keine zusätzliche Infrastruktur
- Konsistente Transaktionen mit anderen Daten
- Einfaches Backup zusammen mit anderen Tabellen

### Warum Ollama für Embeddings?

- Kostenlos und unbegrenzt
- Datenschutz (lokal)
- nomic-embed-text ist klein (274 MB) und schnell

### Warum 768 Dimensionen?

- Kompatibel mit vielen Open-Source Modellen
- Guter Kompromiss zwischen Qualität und Performance
- nomic-embed-text verwendet 768 Dimensionen

### Warum Groq als Standard-Chat?

- Kostenloser Tier verfügbar
- Sehr schnelle Inferenz
- Hochwertige Llama-3 Modelle

## Erweiterung

### Neuen Provider hinzufügen

1. Erstelle `src/lib/hirn/providers/[name].ts`
2. Implementiere `AIProvider` Interface
3. Füge Provider zu Factory in `providers/index.ts` hinzu
4. Füge Eintrag in `hirn_provider_settings` Tabelle hinzu

### Custom System Prompt

```typescript
const response = await chat('Frage', {
  sessionId,
  systemPrompt: `Du bist ein Experte für...`
})
```
