#!/usr/bin/env npx tsx
/**
 * Test script for HIRN chat
 */
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

// Load environment variables from .env.local BEFORE any other imports
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value !== undefined) {
        process.env[key] = value
      }
    }
  }
}

async function test() {
  const { chat } = await import('../src/lib/hirn/chat')
  const { getDefaultChatProvider } = await import('../src/lib/hirn/providers')

  const question = process.argv[2] || 'Was ist RevampIT und was macht die Plattform?'

  console.log('=== HIRN Chat Test ===\n')

  // Check which provider is available
  console.log('Checking for available providers...')
  console.log('  - OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL ? '✓ set' : '✗ not set')
  console.log('  - GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✓ set' : '✗ not set')
  console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ set' : '✗ not set')
  console.log('  - ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ not set')

  const provider = await getDefaultChatProvider()
  if (!provider) {
    console.log('\n❌ No chat provider configured!')
    console.log('Please set one of the following in .env.local:')
    console.log('  - OLLAMA_BASE_URL (for local Ollama)')
    console.log('  - GROQ_API_KEY')
    console.log('  - OPENAI_API_KEY')
    console.log('  - ANTHROPIC_API_KEY')
    process.exit(1)
  }

  console.log(`\nUsing provider: ${provider.name}\n`)
  console.log(`Question: "${question}"`)
  console.log('---\n')

  try {
    const sessionId = crypto.randomUUID()

    const response = await chat(question, {
      sessionId,
    })

    console.log('Response:')
    console.log(response.content)
    console.log('\n---')
    console.log(`Provider: ${response.provider}`)
    console.log(`Model: ${response.model}`)

    if (response.usage) {
      console.log(`Tokens: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

test().catch(console.error).finally(() => process.exit(0))
