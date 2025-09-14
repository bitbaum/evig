import { AIInstructionGenerator, AIInstructionContext } from '../types'
import { getDefaultTemplates, InstructionTemplate } from './templates'

interface TemplateConfig {
  templates?: InstructionTemplate[]
  defaultTemplate?: string
  customPrompts?: Record<string, string>
}

export class TemplateInstructionGenerator implements AIInstructionGenerator {
  public readonly name = 'template'
  private templates: Map<string, InstructionTemplate>
  private defaultTemplate: string

  constructor(private config: TemplateConfig = {}) {
    this.templates = new Map()
    
    // Load default templates
    const defaultTemplates = getDefaultTemplates()
    for (const template of defaultTemplates) {
      this.templates.set(template.id, template)
    }

    // Load custom templates
    if (config.templates) {
      for (const template of config.templates) {
        this.templates.set(template.id, template)
      }
    }

    this.defaultTemplate = config.defaultTemplate || 'general'
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  async generate(context: AIInstructionContext): Promise<string> {
    // Determine which template to use
    const templateId = this.selectTemplate(context)
    const template = this.templates.get(templateId)
    
    if (!template) {
      throw new Error(`Template '${templateId}' not found`)
    }

    // Generate instructions using template
    return this.renderTemplate(template, context)
  }

  private selectTemplate(context: AIInstructionContext): string {
    const { suggestion, siteConfig } = context
    
    // Try to match based on suggestion content keywords
    const content = suggestion.content.toLowerCase()
    
    for (const template of this.templates.values()) {
      if (template.keywords) {
        for (const keyword of template.keywords) {
          if (content.includes(keyword.toLowerCase())) {
            return template.id
          }
        }
      }
    }

    // Try to match based on page patterns
    if (suggestion.page) {
      for (const template of this.templates.values()) {
        if (template.pagePatterns) {
          for (const pattern of template.pagePatterns) {
            if (suggestion.page.includes(pattern) || suggestion.url.includes(pattern)) {
              return template.id
            }
          }
        }
      }
    }

    // Try to match based on framework
    const frameworkTemplate = `${siteConfig.framework}_${this.defaultTemplate}`
    if (this.templates.has(frameworkTemplate)) {
      return frameworkTemplate
    }

    return this.defaultTemplate
  }

  private renderTemplate(template: InstructionTemplate, context: AIInstructionContext): string {
    let result = template.template

    // Replace variables in template
    const variables = {
      suggestion: context.suggestion.content,
      page: context.suggestion.page,
      url: context.suggestion.url,
      siteName: context.siteConfig.name,
      framework: context.siteConfig.framework,
      contact: context.suggestion.contact || 'Anonymous user',
      timestamp: context.suggestion.timestamp,
      
      // File structure hints
      fileHints: this.generateFileHints(context),
      frameworkSpecificInstructions: this.generateFrameworkInstructions(context),
      
      // Custom variables from config
      ...this.config.customPrompts
    }

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value))
    }

    return result.trim()
  }

  private generateFileHints(context: AIInstructionContext): string {
    const { siteConfig } = context
    
    if (!siteConfig.fileStructure || siteConfig.fileStructure.length === 0) {
      return 'No specific file structure hints available.'
    }

    const hints = siteConfig.fileStructure.map(hint => 
      `- ${hint.pattern}: ${hint.description} (${hint.type})`
    ).join('\n')

    return `File structure hints:\n${hints}`
  }

  private generateFrameworkInstructions(context: AIInstructionContext): string {
    const { siteConfig } = context
    
    const frameworkInstructions: Record<string, string> = {
      nextjs: `
This is a Next.js project. Consider:
- Pages/App Router structure
- Server/Client Components
- CSS Modules or Tailwind CSS
- Public folder for static assets
- API routes in app/api or pages/api`,
      
      react: `
This is a React project. Consider:
- Component-based architecture
- State management (useState, useContext, Redux, etc.)
- CSS/SCSS modules or styled-components
- Public folder for static assets`,
      
      vue: `
This is a Vue.js project. Consider:
- Single File Components (.vue)
- Vue composition API or options API
- Vue Router for navigation
- Vuex or Pinia for state management`,
      
      vanilla: `
This is a vanilla JavaScript project. Consider:
- HTML/CSS/JS file structure
- ES6+ modules or script tags
- CSS files for styling
- Assets folder for images/fonts`
    }

    return frameworkInstructions[siteConfig.framework] || 'No specific framework instructions available.'
  }

  // Template management methods
  addTemplate(template: InstructionTemplate): void {
    this.templates.set(template.id, template)
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id)
  }

  getTemplate(id: string): InstructionTemplate | undefined {
    return this.templates.get(id)
  }

  listTemplates(): InstructionTemplate[] {
    return Array.from(this.templates.values())
  }

  setDefaultTemplate(templateId: string): void {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template '${templateId}' not found`)
    }
    this.defaultTemplate = templateId
  }
}