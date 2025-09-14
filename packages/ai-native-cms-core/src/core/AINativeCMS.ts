import { EventEmitter } from 'events'
import { 
  AINativeCMSConfig, 
  AINativeCMSCore,
  AINativeCMSPlugin,
  Suggestion, 
  SuggestionInput, 
  SuggestionFilters,
  SuggestionStatus,
  StorageAdapter,
  NotificationProvider,
  AIInstructionGenerator,
  RateLimitResult,
  AINativeCMSEvents,
  EventName,
  EventPayload
} from '../types'
import { createStorageAdapter } from '../storage'
import { createNotificationProviders } from '../notifications'
import { createAIInstructionGenerator } from '../ai'
import { RateLimiter } from '../utils/RateLimiter'

export class AINativeCMS extends EventEmitter implements AINativeCMSCore {
  public readonly config: AINativeCMSConfig
  public readonly storage: StorageAdapter
  public readonly notifications: NotificationProvider[]
  public readonly aiGenerator: AIInstructionGenerator
  
  private rateLimiter: RateLimiter
  private plugins: Map<string, AINativeCMSPlugin> = new Map()
  private initialized = false

  constructor(config: AINativeCMSConfig) {
    super()
    this.config = config
    
    // Initialize core components
    this.storage = createStorageAdapter(config.storage)
    this.notifications = createNotificationProviders(config.notifications)
    this.aiGenerator = createAIInstructionGenerator(config.aiInstructions)
    this.rateLimiter = new RateLimiter(config.rateLimit)
  }

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('AINativeCMS is already initialized')
    }

    try {
      // Initialize storage
      if (typeof this.storage.init === 'function') {
        await this.storage.init()
      }

      // Initialize AI generator
      if (typeof this.aiGenerator.init === 'function') {
        await this.aiGenerator.init()
      }

      // Initialize notification providers
      for (const provider of this.notifications) {
        if (typeof provider.init === 'function') {
          await provider.init()
        }
      }

      this.initialized = true
      this.emit('cms:initialized', { config: this.config })
    } catch (error) {
      throw new Error(`Failed to initialize AINativeCMS: ${error.message}`)
    }
  }

  async submitSuggestion(input: SuggestionInput, ip: string): Promise<Suggestion> {
    this.ensureInitialized()

    // Check rate limiting
    const rateLimitResult = await this.rateLimiter.checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      this.emit('rate_limit:exceeded', { ip, attempts: this.rateLimiter.getAttempts(ip) })
      throw new Error('Rate limit exceeded')
    }

    try {
      // Create suggestion in storage
      const suggestion = await this.storage.create(input, ip)
      this.emit('suggestion:created', { suggestion })

      // Send notifications asynchronously
      this.sendNotifications('new_suggestion', suggestion).catch(error => {
        console.error('Failed to send notifications:', error)
      })

      // Auto-generate AI instructions if enabled
      if (this.config.aiInstructions && this.config.site.aiProvider !== 'disabled') {
        this.generateAIInstructionsAsync(suggestion.id).catch(error => {
          console.error('Failed to generate AI instructions:', error)
        })
      }

      return suggestion
    } catch (error) {
      throw new Error(`Failed to submit suggestion: ${error.message}`)
    }
  }

  async getSuggestions(filters?: SuggestionFilters): Promise<Suggestion[]> {
    this.ensureInitialized()
    return this.storage.findAll(filters)
  }

  async getSuggestion(id: string): Promise<Suggestion | null> {
    this.ensureInitialized()
    return this.storage.findById(id)
  }

  async updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<Suggestion> {
    this.ensureInitialized()

    const existing = await this.storage.findById(id)
    if (!existing) {
      throw new Error(`Suggestion with id ${id} not found`)
    }

    const oldStatus = existing.status
    const updated = await this.storage.update(id, { 
      status, 
      updatedAt: new Date() 
    })

    this.emit('suggestion:updated', { suggestion: updated, changes: { status } })
    this.emit('suggestion:status_changed', { suggestion: updated, oldStatus })

    // Send status update notifications
    this.sendNotifications('status_update', updated).catch(error => {
      console.error('Failed to send status update notifications:', error)
    })

    return updated
  }

  async generateAIInstructions(id: string): Promise<string> {
    this.ensureInitialized()

    const suggestion = await this.storage.findById(id)
    if (!suggestion) {
      throw new Error(`Suggestion with id ${id} not found`)
    }

    if (suggestion.aiInstructions) {
      return suggestion.aiInstructions
    }

    this.emit('ai:generation_started', { suggestionId: id })

    try {
      const instructions = await this.aiGenerator.generate({
        suggestion,
        siteConfig: this.config.site,
        pageContext: this.extractPageContext(suggestion)
      })

      // Update suggestion with AI instructions
      const updated = await this.storage.update(id, {
        aiInstructions: instructions,
        status: SuggestionStatus.AI_GENERATED,
        updatedAt: new Date()
      })

      this.emit('ai:generation_completed', { suggestionId: id, instructions })
      this.emit('suggestion:ai_generated', { suggestion: updated, instructions })

      // Send AI generation notifications
      this.sendNotifications('ai_generated', updated).catch(error => {
        console.error('Failed to send AI generation notifications:', error)
      })

      return instructions
    } catch (error) {
      this.emit('ai:generation_failed', { suggestionId: id, error })
      throw new Error(`Failed to generate AI instructions: ${error.message}`)
    }
  }

  private async generateAIInstructionsAsync(id: string): Promise<void> {
    try {
      await this.generateAIInstructions(id)
    } catch (error) {
      console.error(`Async AI generation failed for suggestion ${id}:`, error)
    }
  }

  private async sendNotifications(type: 'new_suggestion' | 'status_update' | 'ai_generated', suggestion: Suggestion): Promise<void> {
    const enabledProviders = this.notifications.filter(provider => 
      this.config.notifications.providers.find(p => p.name === provider.name && p.enabled)
    )

    const payload = {
      type,
      suggestion,
      subject: this.generateNotificationSubject(type, suggestion),
      message: this.generateNotificationMessage(type, suggestion),
      recipients: this.getNotificationRecipients(type),
      metadata: { timestamp: new Date().toISOString() }
    }

    for (const provider of enabledProviders) {
      try {
        const success = await provider.send(payload)
        this.emit('notification:sent', { provider: provider.name, payload, success })
      } catch (error) {
        this.emit('notification:failed', { provider: provider.name, payload, error })
      }
    }
  }

  private generateNotificationSubject(type: string, suggestion: Suggestion): string {
    switch (type) {
      case 'new_suggestion':
        return `New suggestion for ${this.config.site.name}: ${suggestion.page}`
      case 'status_update':
        return `Suggestion ${suggestion.id} status updated to ${suggestion.status}`
      case 'ai_generated':
        return `AI instructions generated for suggestion ${suggestion.id}`
      default:
        return `Suggestion update: ${suggestion.id}`
    }
  }

  private generateNotificationMessage(type: string, suggestion: Suggestion): string {
    const baseInfo = `Page: ${suggestion.page}\nURL: ${suggestion.url}\nSuggestion: ${suggestion.content}`
    
    switch (type) {
      case 'new_suggestion':
        return `A new suggestion has been submitted.\n\n${baseInfo}\n\nContact: ${suggestion.contact || 'Anonymous'}`
      case 'status_update':
        return `Suggestion status has been updated to: ${suggestion.status}\n\n${baseInfo}`
      case 'ai_generated':
        return `AI instructions have been generated for this suggestion.\n\n${baseInfo}\n\nInstructions:\n${suggestion.aiInstructions}`
      default:
        return baseInfo
    }
  }

  private getNotificationRecipients(type: string): string[] {
    // This would be configurable in a real implementation
    return this.config.notifications.providers
      .filter(p => p.enabled)
      .map(p => p.config.recipients || [])
      .flat()
  }

  private extractPageContext(suggestion: Suggestion) {
    // This would analyze the page to provide context for AI generation
    return {
      title: suggestion.page,
      description: `Page context for ${suggestion.url}`,
      components: [], // Would be extracted from actual page analysis
      styles: [],
      layout: 'default'
    }
  }

  // Plugin system
  use(plugin: AINativeCMSPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already loaded`)
    }

    plugin.init(this)
    this.plugins.set(plugin.name, plugin)
    this.emit('plugin:loaded', { plugin })
  }

  removePlugin(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return false
    }

    if (plugin.destroy) {
      plugin.destroy()
    }

    this.plugins.delete(name)
    this.emit('plugin:unloaded', { pluginName: name })
    return true
  }

  // Typed event emitter methods
  emit<T extends EventName>(event: T, payload: EventPayload<T>): boolean {
    return super.emit(event, payload)
  }

  on<T extends EventName>(event: T, callback: (payload: EventPayload<T>) => void): this {
    return super.on(event, callback)
  }

  once<T extends EventName>(event: T, callback: (payload: EventPayload<T>) => void): this {
    return super.once(event, callback)
  }

  async destroy(): Promise<void> {
    if (!this.initialized) {
      return
    }

    // Destroy plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        plugin.destroy()
      }
    }
    this.plugins.clear()

    // Cleanup components
    if (typeof this.storage.destroy === 'function') {
      await this.storage.destroy()
    }

    for (const provider of this.notifications) {
      if (typeof provider.destroy === 'function') {
        await provider.destroy()
      }
    }

    if (typeof this.aiGenerator.destroy === 'function') {
      await this.aiGenerator.destroy()
    }

    this.initialized = false
    this.emit('cms:shutdown', {})
    this.removeAllListeners()
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AINativeCMS must be initialized before use')
    }
  }

  // Utility methods
  async getStats() {
    this.ensureInitialized()
    return this.storage.getStats()
  }

  async checkRateLimit(ip: string): Promise<RateLimitResult> {
    return this.rateLimiter.checkRateLimit(ip)
  }

  getPlugins(): AINativeCMSPlugin[] {
    return Array.from(this.plugins.values())
  }

  isInitialized(): boolean {
    return this.initialized
  }
}