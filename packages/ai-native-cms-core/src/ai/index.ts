import { AIInstructionGenerator, AINativeCMSConfig } from '../types'
import { TemplateInstructionGenerator } from './TemplateInstructionGenerator'

export function createAIInstructionGenerator(config: AINativeCMSConfig['aiInstructions']): AIInstructionGenerator {
  switch (config.provider) {
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

export * from './TemplateInstructionGenerator'
export * from './templates'