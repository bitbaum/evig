import { NotificationProvider, NotificationPayload } from '../types'

export interface EmailConfig {
  host: string
  port: number
  secure?: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
}

export class EmailNotificationProvider implements NotificationProvider {
  public readonly name = 'email'
  private config: EmailConfig
  private transporter: any = null

  constructor(config: EmailConfig) {
    this.config = config
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  async init(): Promise<void> {
    try {
      // Dynamic import to avoid requiring nodemailer as peer dependency
      const nodemailer = await import('nodemailer')
      
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure || false,
        auth: this.config.auth
      })

      // Verify connection
      await this.transporter.verify()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if ('code' in err && err.code === 'MODULE_NOT_FOUND') {
        throw new Error('nodemailer package is required for email notifications. Install it with: npm install nodemailer @types/nodemailer')
      }
      throw new Error(`Failed to initialize email provider: ${err.message}`)
    }
  }

  async send(notification: NotificationPayload): Promise<boolean> {
    if (!this.transporter) {
      await this.init()
    }

    try {
      const emailHtml = this.generateEmailHTML(notification)
      const emailText = this.generateEmailText(notification)

      const recipients = notification.recipients.length > 0 
        ? notification.recipients 
        : (Array.isArray(this.config.to) ? this.config.to : [this.config.to])

      const mailOptions = {
        from: this.config.from,
        to: recipients.join(', '),
        cc: this.config.cc,
        bcc: this.config.bcc,
        subject: notification.subject,
        text: emailText,
        html: emailHtml,
        attachments: this.generateAttachments(notification)
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Email notification failed:', error)
      return false
    }
  }

  private generateEmailHTML(notification: NotificationPayload): string {
    const { suggestion, type } = notification
    
    const statusColor = this.getStatusColor(suggestion.status)
    const typeIcon = this.getTypeIcon(type)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .suggestion-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; background-color: ${statusColor}; }
    .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .details-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: bold; width: 100px; color: #666; }
    .ai-instructions { background: #e8f4fd; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; margin: 15px 0; }
    .ai-instructions pre { white-space: pre-wrap; font-family: 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.4; }
    .footer { background: #f8f9fa; padding: 15px 20px; font-size: 12px; color: #666; text-align: center; }
    .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px 0 0; }
    .button:hover { background: #5a67d8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${typeIcon} ${notification.subject}</h1>
    </div>
    
    <div class="content">
      <p>A ${type.replace('_', ' ')} has been received for your website.</p>
      
      <div class="suggestion-box">
        <h3>User Suggestion:</h3>
        <p><em>"${suggestion.content}"</em></p>
      </div>
      
      <table class="details-table">
        <tr><td>Status:</td><td><span class="status-badge">${suggestion.status.replace('_', ' ').toUpperCase()}</span></td></tr>
        <tr><td>Page:</td><td>${suggestion.page}</td></tr>
        <tr><td>URL:</td><td><a href="${suggestion.url}" target="_blank">${suggestion.url}</a></td></tr>
        <tr><td>Contact:</td><td>${suggestion.contact || 'Anonymous'}</td></tr>
        <tr><td>Time:</td><td>${new Date(suggestion.timestamp).toLocaleString()}</td></tr>
        <tr><td>ID:</td><td><code>${suggestion.id}</code></td></tr>
      </table>
      
      ${suggestion.aiInstructions ? `
      <div class="ai-instructions">
        <h3>🤖 AI-Generated Instructions:</h3>
        <pre>${this.escapeHtml(suggestion.aiInstructions)}</pre>
      </div>
      ` : ''}
      
      <p>
        <a href="${suggestion.url}" class="button">View Page</a>
        ${suggestion.aiInstructions ? `<a href="#" class="button">Copy Instructions</a>` : ''}
      </p>
    </div>
    
    <div class="footer">
      <p>This notification was sent by AI-Native CMS</p>
      <p>Suggestion ID: ${suggestion.id}</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  private generateEmailText(notification: NotificationPayload): string {
    const { suggestion } = notification
    
    let text = `${notification.subject}\n${'='.repeat(notification.subject.length)}\n\n`
    text += `User Suggestion: "${suggestion.content}"\n\n`
    text += `Details:\n`
    text += `- Status: ${suggestion.status.replace('_', ' ').toUpperCase()}\n`
    text += `- Page: ${suggestion.page}\n`
    text += `- URL: ${suggestion.url}\n`
    text += `- Contact: ${suggestion.contact || 'Anonymous'}\n`
    text += `- Time: ${new Date(suggestion.timestamp).toLocaleString()}\n`
    text += `- ID: ${suggestion.id}\n\n`
    
    if (suggestion.aiInstructions) {
      text += `AI-Generated Instructions:\n`
      text += `${'-'.repeat(25)}\n`
      text += `${suggestion.aiInstructions}\n`
      text += `${'-'.repeat(25)}\n\n`
    }
    
    text += `View the page: ${suggestion.url}\n\n`
    text += `This notification was sent by AI-Native CMS`
    
    return text
  }

  private generateAttachments(notification: NotificationPayload): any[] {
    const attachments: any[] = []
    
    // If AI instructions exist, attach them as a text file
    if (notification.suggestion.aiInstructions) {
      attachments.push({
        filename: `ai-instructions-${notification.suggestion.id}.txt`,
        content: notification.suggestion.aiInstructions,
        contentType: 'text/plain'
      })
    }
    
    return attachments
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#ffa500',
      processing: '#007bff',
      ai_generated: '#28a745',
      in_progress: '#17a2b8',
      completed: '#28a745',
      rejected: '#dc3545'
    }
    return colors[status] || '#6c757d'
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      new_suggestion: '💡',
      status_update: '🔄',
      ai_generated: '🤖'
    }
    return icons[type] || '📝'
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  async destroy(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
    }
  }

  // Email provider specific methods
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.init()
      }
      await this.transporter.verify()
      return true
    } catch (error) {
      return false
    }
  }
}