import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Simple in-memory rate limiting (per IP)
const rateLimit = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const MAX_REQUESTS = 3 // Max 3 suggestions per 5 minutes per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimit.get(ip)

  if (!userLimit) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return true
  }

  // Reset if window expired
  if (now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return true
  }

  // Check if under limit
  if (userLimit.count < MAX_REQUESTS) {
    userLimit.count++
    return true
  }

  return false
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  return 'unknown'
}

// Create email transporter
function createTransporter() {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // Use Ethereal Email for testing (creates test accounts)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }

  // Production email configuration
  // You can configure this with your preferred email service:
  // Gmail, SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    // Example Gmail configuration:
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
    
    // Example SendGrid configuration:
    // host: 'smtp.sendgrid.net',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: 'apikey',
    //   pass: process.env.SENDGRID_API_KEY
    // }
  })
}

async function sendNotification(suggestion: {
  suggestion: string
  contact?: string
  page: string
  url: string
  pageTitle?: string
  pageSection?: string
  feedbackScope?: string
  selectedElements?: Array<{
    elementType: string
    elementText: string
    selector: string
  }>
  timestamp: string
  ip: string
}) {
  try {
    const transporter = createTransporter()

    // Get scope emoji and color
    const getScopeDetails = (scope: string) => {
      switch(scope) {
        case 'site': return { emoji: '🌐', name: 'Gesamte Website', color: '#7c3aed' }
        case 'page': return { emoji: '📄', name: 'Diese Seite', color: '#16a34a' }
        case 'element': return { emoji: '🎯', name: 'Spezifisches Element', color: '#2563eb' }
        default: return { emoji: '📝', name: 'Allgemein', color: '#16a34a' }
      }
    }
    
    const scopeDetails = getScopeDetails(suggestion.feedbackScope || 'page')
    
    // Generate AI-friendly prompt section
    const aiPrompt = `## AI AGENT PROMPT FOR IMPLEMENTATION

**Context:** User feedback for RevampIT website
**Page:** ${suggestion.page}
**URL:** ${suggestion.url}
**Feedback Scope:** ${scopeDetails.name}
**User Request:** ${suggestion.suggestion}

**Implementation Task:**
${suggestion.feedbackScope === 'site' 
  ? '- Analyze and improve the overall website experience\n- Consider site-wide changes and navigation improvements'
  : suggestion.feedbackScope === 'element' && suggestion.selectedElements?.length
    ? `- Focus on the following specific elements:\n${suggestion.selectedElements.map(el => `  • ${el.elementType.toUpperCase()}: "${el.elementText.substring(0, 50)}..." (selector: ${el.selector})`).join('\n')}\n- Make targeted improvements to these selected elements`
    : '- Focus improvements on the current page\n- Consider layout, content, and functionality enhancements for this specific page'
}

**Next Steps:**
1. Review the current implementation at ${suggestion.url}
2. Implement the requested changes
3. Test the improvements
4. Deploy the updates

---
Copy the above prompt and use it with your AI development agent.`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${scopeDetails.color} 0%, ${scopeDetails.color}dd 100%); padding: 25px; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${scopeDetails.emoji} Verbesserungsvorschlag</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">${scopeDetails.name} • ${suggestion.pageTitle || suggestion.page}</p>
          </div>

          <!-- Page Context -->
          <div style="padding: 25px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">📋 Kontext & Details</h3>
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid ${scopeDetails.color};">
              <div style="display: grid; gap: 12px;">
                <div><strong style="color: #475569;">Seite:</strong> <span style="color: #1e293b;">${suggestion.pageTitle || suggestion.page}</span></div>
                <div><strong style="color: #475569;">Bereich:</strong> <span style="color: #1e293b;">${suggestion.pageSection || 'Unbekannt'}</span></div>
                <div><strong style="color: #475569;">Umfang:</strong> <span style="color: ${scopeDetails.color}; font-weight: 600;">${scopeDetails.name}</span></div>
                <div><strong style="color: #475569;">Pfad:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${suggestion.page}</code></div>
                <div><strong style="color: #475569;">URL:</strong> <a href="${suggestion.url}" style="color: #2563eb; text-decoration: none;">${suggestion.url}</a></div>
                <div><strong style="color: #475569;">Zeitpunkt:</strong> <span style="color: #1e293b;">${new Date(suggestion.timestamp).toLocaleString('de-CH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span></div>
                <div><strong style="color: #475569;">Kontakt:</strong> <span style="color: #1e293b;">${suggestion.contact || '👤 Anonym'}</span></div>
              </div>
            </div>
          </div>

          ${suggestion.selectedElements && suggestion.selectedElements.length > 0 ? `
          <!-- Selected Elements -->
          <div style="padding: 25px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">🎯 Ausgewählte Elemente</h3>
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              ${suggestion.selectedElements.map(el => `
                <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #dbeafe;">
                  <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">${el.elementType.toUpperCase()}</div>
                  <div style="color: #374151; font-size: 14px; margin-bottom: 6px;">"${el.elementText.length > 100 ? el.elementText.substring(0, 100) + '...' : el.elementText}"</div>
                  <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">Selector: ${el.selector}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- User Suggestion -->
          <div style="padding: 25px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">💬 Verbesserungsvorschlag</h3>
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="white-space: pre-wrap; color: #15803d; margin: 0; font-size: 16px; line-height: 1.6; font-weight: 500;">${suggestion.suggestion}</p>
            </div>
          </div>

          <!-- AI Agent Prompt -->
          <div style="padding: 25px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">🤖 KI-Entwickler Prompt</h3>
            <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308;">
              <p style="margin: 0 0 12px 0; color: #a16207; font-size: 14px; font-weight: 600;">📋 Kopiere diesen Prompt für deinen KI-Entwickler-Agent:</p>
              <div style="background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-x: auto; margin: 12px 0;">${aiPrompt}</div>
              <p style="margin: 12px 0 0 0; color: #a16207; font-size: 12px;">💡 Dieser Prompt enthält alle relevanten Informationen für die Umsetzung.</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 25px; background-color: #f8fafc; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">🔧 Automatisch generiert vom RevampIT Verbesserungssystem</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">IP-Adresse: ${suggestion.ip} • ${new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@revamp-it.ch',
      to: [
        'georgy.butaev@revamp-it.ch',
        'butaeff@gmail.com'
      ],
      subject: `📝 RevampIT Verbesserungsvorschlag - ${suggestion.pageTitle || suggestion.page}`,
      html: emailHtml,
      text: `
${scopeDetails.emoji} REVAMPIT VERBESSERUNGSVORSCHLAG
${'='.repeat(50)}

KONTEXT & DETAILS:
- Seite: ${suggestion.pageTitle || suggestion.page}
- Bereich: ${suggestion.pageSection || 'Unbekannt'} 
- Umfang: ${scopeDetails.name}
- Pfad: ${suggestion.page}
- URL: ${suggestion.url}
- Zeitpunkt: ${new Date(suggestion.timestamp).toLocaleString('de-CH')}
- Kontakt: ${suggestion.contact || 'Anonym'}

${suggestion.selectedElements && suggestion.selectedElements.length > 0 ? `AUSGEWÄHLTE ELEMENTE:
${suggestion.selectedElements.map(el => `- ${el.elementType.toUpperCase()}: "${el.elementText.substring(0, 80)}..." (${el.selector})`).join('\n')}

` : ''}VERBESSERUNGSVORSCHLAG:
${'-'.repeat(25)}
${suggestion.suggestion}

KI-ENTWICKLER PROMPT:
${'-'.repeat(25)}
${aiPrompt}

TECHNISCHE DETAILS:
- IP-Adresse: ${suggestion.ip}
- Timestamp: ${suggestion.timestamp}

---
🔧 Automatisch generiert vom RevampIT Verbesserungssystem
      `.trim()
    }

    // Log suggestion details (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 New suggestion:', {
        page: suggestion.pageTitle || suggestion.page,
        section: suggestion.pageSection || 'Unknown',
        path: suggestion.page,
        url: suggestion.url,
        timestamp: suggestion.timestamp,
        contact: suggestion.contact || 'Anonymous',
        ip: suggestion.ip,
        suggestion: suggestion.suggestion
      })
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Test-E-Mail gesendet. Preview URL:', nodemailer.getTestMessageUrl(info))
    } else {
      console.log('📧 E-Mail erfolgreich gesendet:', info.messageId)
    }

    return true
  } catch (error) {
    console.error('❌ Fehler beim E-Mail-Versand:', error)
    
    // Don't fail the API request if email fails
    // The suggestion is still logged to console
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { suggestion, contact, page, url, pageTitle, pageSection, feedbackScope, selectedElements, timestamp } = body

    // Validation
    if (!suggestion || typeof suggestion !== 'string' || suggestion.trim().length < 5) {
      return NextResponse.json(
        { error: 'Suggestion must be at least 5 characters long' },
        { status: 400 }
      )
    }

    if (suggestion.length > 1000) {
      return NextResponse.json(
        { error: 'Suggestion is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Basic spam detection
    const spamIndicators = ['http://', 'https://', 'www.', 'viagra', 'casino', 'crypto']
    const hasSpam = spamIndicators.some(indicator => 
      suggestion.toLowerCase().includes(indicator.toLowerCase())
    )
    
    if (hasSpam) {
      return NextResponse.json(
        { error: 'Suggestion contains prohibited content' },
        { status: 400 }
      )
    }

    // Send notification
    await sendNotification({
      suggestion: suggestion.trim(),
      contact: contact?.trim(),
      page,
      url,
      pageTitle,
      pageSection,
      feedbackScope,
      selectedElements,
      timestamp,
      ip
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing suggestion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
