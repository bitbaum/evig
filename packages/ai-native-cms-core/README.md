# @ai-native-cms/core

> Transform user suggestions into AI agent instructions - The core engine for AI-Native Content Management

[![npm version](https://badge.fury.io/js/@ai-native-cms%2Fcore.svg)](https://badge.fury.io/js/@ai-native-cms%2Fcore)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is AI-Native CMS?

AI-Native CMS is a revolutionary approach to content management where **site visitors can propose changes** that get automatically **translated into actionable instructions for AI agents** (Claude Code, Cursor, etc.).

Instead of complex admin interfaces, users simply describe what they want changed, and AI generates the exact implementation steps for developers.

## ⭐ Key Features

- **🤖 AI Instruction Generation**: Convert natural language suggestions into detailed technical instructions
- **🔧 Modular Architecture**: Plug-and-play storage adapters, notification providers, and AI generators  
- **📊 Multiple Storage Options**: Memory, PostgreSQL, MySQL, MongoDB, or custom adapters
- **📧 Rich Notifications**: Email, Slack, Discord, Webhook, or custom providers
- **🎨 Customizable Templates**: Framework-specific instruction templates (Next.js, React, Vue, etc.)
- **⚡ Rate Limiting**: Built-in protection against abuse
- **🔒 TypeScript First**: Full type safety and excellent DX

## 🚀 Quick Start

```bash
npm install @ai-native-cms/core
```

### Basic Usage

```typescript
import { AINativeCMS, createDefaultConfig } from '@ai-native-cms/core'

// Create configuration
const config = createDefaultConfig({
  name: 'My Website',
  domain: 'example.com',
  framework: 'nextjs',
  aiProvider: 'template'
})

// Initialize CMS
const cms = new AINativeCMS(config)
await cms.init()

// Submit a suggestion
const suggestion = await cms.submitSuggestion({
  content: 'Make the header bigger and add more spacing',
  contact: 'user@example.com',
  page: '/about',
  url: 'https://example.com/about'
}, '192.168.1.1')

// Generate AI instructions
const instructions = await cms.generateAIInstructions(suggestion.id)
console.log(instructions)
```

## 🏗️ Architecture

### Storage Adapters

Choose how suggestions are stored:

```typescript
// Memory (development)
storage: {
  adapter: 'memory',
  config: {}
}

// PostgreSQL (production)
storage: {
  adapter: 'postgres',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'cms',
    username: 'user',
    password: 'pass'
  }
}
```

### Notification Providers

Get notified of new suggestions:

```typescript
notifications: {
  providers: [
    {
      name: 'email',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: { user: 'admin@example.com', pass: 'password' },
        from: 'AI CMS <admin@example.com>',
        to: ['dev@example.com']
      },
      enabled: true
    },
    {
      name: 'slack',
      config: {
        webhookUrl: 'https://hooks.slack.com/services/...',
        channel: '#dev'
      },
      enabled: true
    }
  ]
}
```

### AI Instruction Generation

Transform suggestions into actionable instructions:

```typescript
aiInstructions: {
  provider: 'template', // or 'openai', 'anthropic'
  config: {
    customPrompts: {
      siteName: 'My Amazing Website',
      additionalContext: 'We use Tailwind CSS for styling'
    }
  }
}
```

## 📝 AI Instruction Templates

The core comes with built-in templates for different types of changes:

### General Content Changes
```
User suggestion: "Make the services section bigger"

Generated instructions:
# AI Agent Instructions: Visual/Styling Changes

## 🎨 Visual Modification Request
**Page:** /services
**User Request:** "Make the services section bigger"

## 🔧 Styling Implementation Steps

1. **Identify Target Elements**
   - Locate the services section in /services page
   - Check current CSS/styling implementation
   - Review design system consistency

2. **Implement Visual Changes**
   - Increase section height/padding
   - Consider responsive design implications
   - Maintain accessibility standards

3. **Files to Consider**
   - src/components/sections/ServicesSection.tsx
   - src/styles/services.css
   - Check responsive breakpoints

...
```

### Navigation Changes
```
User suggestion: "Add a Blog link to the main menu"

Generated instructions:
# AI Agent Instructions: Navigation Modification

## 🧭 Navigation Change Request
**Navigation Request:** "Add a Blog link to the main menu"

## 🔗 Implementation Steps

1. **Update Navigation Component**
   - Add "Blog" link to main navigation array
   - Ensure proper routing to /blog
   - Update mobile navigation if applicable

2. **Files to Modify**
   - src/components/layout/Header.tsx
   - src/components/navigation/Navigation.tsx
   - Check routing configuration

...
```

## 🔧 Advanced Configuration

### Custom Storage Adapter

```typescript
import { StorageAdapter, Suggestion } from '@ai-native-cms/core'

class CustomStorageAdapter implements StorageAdapter {
  async create(input: SuggestionInput, ip: string): Promise<Suggestion> {
    // Your custom storage logic
  }
  
  async findById(id: string): Promise<Suggestion | null> {
    // Your custom retrieval logic
  }
  
  // ... implement other methods
}

const config = {
  storage: {
    adapter: 'custom',
    config: {
      customAdapter: new CustomStorageAdapter()
    }
  }
}
```

### Custom AI Generator

```typescript
import { AIInstructionGenerator, AIInstructionContext } from '@ai-native-cms/core'

class CustomAIGenerator implements AIInstructionGenerator {
  name = 'my-ai'
  
  async generate(context: AIInstructionContext): Promise<string> {
    // Your custom AI generation logic
    return `Custom instructions for: ${context.suggestion.content}`
  }
  
  configure(config: Record<string, any>): void {
    // Configure your generator
  }
}
```

### Event System

Listen to CMS events for custom logic:

```typescript
cms.on('suggestion:created', ({ suggestion }) => {
  console.log('New suggestion:', suggestion.content)
})

cms.on('suggestion:ai_generated', ({ suggestion, instructions }) => {
  console.log('AI instructions ready:', instructions)
})

cms.on('rate_limit:exceeded', ({ ip, attempts }) => {
  console.log(`Rate limit exceeded for IP ${ip}: ${attempts} attempts`)
})
```

## 📊 Statistics and Monitoring

```typescript
const stats = await cms.getStats()

console.log(stats)
/*
{
  total: 156,
  byStatus: {
    pending: 12,
    processing: 3,
    ai_generated: 89,
    in_progress: 25,
    completed: 24,
    rejected: 3
  },
  byPage: {
    '/': 45,
    '/about': 23,
    '/services': 18,
    '/contact': 12
  },
  recentActivity: [...]
}
*/
```

## 🔒 Rate Limiting

Protect your API from abuse:

```typescript
rateLimit: {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: true
}

// Check rate limit manually
const result = await cms.checkRateLimit('192.168.1.1')
console.log(result.allowed) // true/false
console.log(result.remaining) // requests remaining
console.log(result.resetTime) // when window resets
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📚 API Reference

### AINativeCMS

Main CMS class for managing suggestions and AI instructions.

#### Methods

- `init(): Promise<void>` - Initialize the CMS
- `submitSuggestion(input, ip): Promise<Suggestion>` - Submit a new suggestion
- `getSuggestions(filters?): Promise<Suggestion[]>` - Get suggestions with optional filters
- `updateSuggestionStatus(id, status): Promise<Suggestion>` - Update suggestion status
- `generateAIInstructions(id): Promise<string>` - Generate AI instructions
- `getStats(): Promise<SuggestionStats>` - Get system statistics
- `destroy(): Promise<void>` - Cleanup and destroy CMS instance

#### Events

- `suggestion:created` - New suggestion submitted
- `suggestion:updated` - Suggestion updated
- `suggestion:ai_generated` - AI instructions generated
- `rate_limit:exceeded` - Rate limit exceeded
- `notification:sent` - Notification sent successfully

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT © [AI-Native CMS Team](https://github.com/your-org/ai-native-cms)

## 🔗 Related Packages

- [`@ai-native-cms/react`](../ai-native-cms-react) - React components
- [`@ai-native-cms/nextjs`](../ai-native-cms-nextjs) - Next.js plugin
- [`@ai-native-cms/cli`](../ai-native-cms-cli) - CLI tools

---

**Ready to make your website AI-native?** 🚀

Get started with our [Quick Start Guide](../../docs/quick-start.md) or check out the [live examples](../../examples).