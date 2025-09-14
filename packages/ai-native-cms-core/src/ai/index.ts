import { AIInstructionGenerator, AINativeCMSConfig } from '../types'
import { OpenAIInstructionGenerator } from './OpenAIInstructionGenerator'
import { AnthropicInstructionGenerator } from './AnthropicInstructionGenerator'
import { TemplateInstructionGenerator } from './TemplateInstructionGenerator'

export function createAIInstructionGenerator(config: AINativeCMSConfig['aiInstructions']): AIInstructionGenerator {
  switch (config.provider) {
    case 'openai':
      return new OpenAIInstructionGenerator(config.config)
    
    case 'anthropic':
      return new AnthropicInstructionGenerator(config.config)
    
    case 'template':
    case 'local':
      return new TemplateInstructionGenerator(config.config)
    
    case 'custom':
      if (!config.config.customGenerator) {
        throw new Error('Custom AI generator not provided in config')
      }
      return config.config.customGenerator
    
    default:
      throw new Error(`Unknown AI instruction provider: ${config.provider}`)
  }
}

export * from './OpenAIInstructionGenerator'
export * from './AnthropicInstructionGenerator'
export * from './TemplateInstructionGenerator'
export * from './templates'