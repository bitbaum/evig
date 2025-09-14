import { Suggestion, SuggestionInput, SuggestionFilters, SuggestionStatus, SuggestionStats, SuggestionCategory } from '@/types/suggestion'
import { v4 as uuidv4 } from 'uuid'

// In-memory storage for now - replace with database in production
let suggestions: Suggestion[] = []

export async function createSuggestion(input: SuggestionInput, ip: string): Promise<Suggestion> {
  const suggestion: Suggestion = {
    id: uuidv4(),
    content: input.content,
    contact: input.contact,
    page: input.page,
    url: input.url,
    timestamp: new Date().toISOString(),
    ip,
    status: SuggestionStatus.PENDING_REVIEW,
    priority: determinePriority(input.content),
    category: determineCategory(input.content),
    complexity: determineComplexity(input.content),
    confidence: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Auto-generate AI instructions for simple requests
  if (suggestion.complexity === 'low' && shouldAutoGenerateAI(input.content)) {
    suggestion.aiInstructions = await generateSimpleInstructions(suggestion)
    suggestion.status = SuggestionStatus.NEEDS_APPROVAL
    suggestion.confidence = 85
  }

  suggestions.push(suggestion)
  return suggestion
}

export async function getSuggestions(filters?: SuggestionFilters): Promise<Suggestion[]> {
  let filtered = [...suggestions]

  if (filters) {
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status)
    }
    if (filters.category) {
      filtered = filtered.filter(s => s.category === filters.category)
    }
    if (filters.priority) {
      filtered = filtered.filter(s => s.priority === filters.priority)
    }
    if (filters.page) {
      filtered = filtered.filter(s => s.page === filters.page)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(s => 
        s.content.toLowerCase().includes(search) ||
        (s.contact && s.contact.toLowerCase().includes(search)) ||
        s.page.toLowerCase().includes(search)
      )
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(s => s.createdAt >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(s => s.createdAt <= filters.dateTo!)
    }
  }

  // Sort by priority and creation date
  filtered.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  // Apply pagination
  if (filters?.offset) {
    filtered = filtered.slice(filters.offset)
  }
  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  return filtered
}

export async function getSuggestionById(id: string): Promise<Suggestion | null> {
  return suggestions.find(s => s.id === id) || null
}

export async function updateSuggestionStatus(
  id: string, 
  status: SuggestionStatus, 
  updates: Partial<Suggestion> = {}
): Promise<Suggestion> {
  const index = suggestions.findIndex(s => s.id === id)
  if (index === -1) {
    throw new Error(`Suggestion with id ${id} not found`)
  }

  suggestions[index] = {
    ...suggestions[index],
    status,
    ...updates,
    updatedAt: new Date(),
    reviewedAt: new Date()
  }

  return suggestions[index]
}

export async function generateAIInstructions(id: string): Promise<string> {
  const suggestion = await getSuggestionById(id)
  if (!suggestion) {
    throw new Error(`Suggestion with id ${id} not found`)
  }

  if (suggestion.aiInstructions) {
    return suggestion.aiInstructions
  }

  const instructions = await generateAdvancedInstructions(suggestion)
  
  // Update suggestion with AI instructions
  await updateSuggestionStatus(id, SuggestionStatus.NEEDS_APPROVAL, {
    aiInstructions: instructions,
    confidence: 90
  })

  return instructions
}

export async function getSuggestionStats(): Promise<SuggestionStats> {
  const byStatus = Object.values(SuggestionStatus).reduce((acc, status) => {
    acc[status] = suggestions.filter(s => s.status === status).length
    return acc
  }, {} as Record<SuggestionStatus, number>)

  const byCategory = Object.values(SuggestionCategory).reduce((acc, category) => {
    acc[category] = suggestions.filter(s => s.category === category).length
    return acc
  }, {} as Record<SuggestionCategory, number>)

  const byPriority = {
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
    low: suggestions.filter(s => s.priority === 'low').length
  }

  const byPage = suggestions.reduce((acc, s) => {
    acc[s.page] = (acc[s.page] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recentActivity = suggestions
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10)

  const completedSuggestions = suggestions.filter(s => s.status === SuggestionStatus.COMPLETED)
  const completionRate = suggestions.length > 0 ? (completedSuggestions.length / suggestions.length) * 100 : 0

  // Calculate average response time (mock data for now)
  const averageResponseTime = 2.5 // hours

  return {
    total: suggestions.length,
    byStatus,
    byCategory,
    byPriority,
    byPage,
    recentActivity,
    averageResponseTime,
    completionRate
  }
}

// Helper functions
function determinePriority(content: string): 'low' | 'medium' | 'high' {
  const urgent = ['urgent', 'asap', 'immediately', 'broken', 'error', 'bug', 'fix']
  const important = ['important', 'please', 'users', 'customers', 'main', 'home']
  
  const lowerContent = content.toLowerCase()
  
  if (urgent.some(word => lowerContent.includes(word))) {
    return 'high'
  }
  if (important.some(word => lowerContent.includes(word))) {
    return 'medium'
  }
  return 'low'
}

function determineCategory(content: string): SuggestionCategory {
  const lowerContent = content.toLowerCase()
  
  if (/color|font|size|spacing|bigger|smaller|style|design|layout/.test(lowerContent)) {
    return SuggestionCategory.VISUAL_STYLING
  }
  if (/text|content|copy|information|add.*section|update.*info/.test(lowerContent)) {
    return SuggestionCategory.CONTENT
  }
  if (/menu|navigation|nav|link|button|page/.test(lowerContent)) {
    return SuggestionCategory.NAVIGATION
  }
  if (/add.*feature|new.*function|integrate|plugin/.test(lowerContent)) {
    return SuggestionCategory.FEATURE
  }
  if (/slow|fast|performance|speed|load/.test(lowerContent)) {
    return SuggestionCategory.PERFORMANCE
  }
  if (/accessibility|a11y|screen reader|keyboard/.test(lowerContent)) {
    return SuggestionCategory.ACCESSIBILITY
  }
  if (/user.*experience|ux|usability|intuitive/.test(lowerContent)) {
    return SuggestionCategory.UX
  }
  
  return SuggestionCategory.OTHER
}

function determineComplexity(content: string): 'low' | 'medium' | 'high' {
  const lowerContent = content.toLowerCase()
  
  // High complexity indicators
  if (/integrate|database|api|authentication|payment|complex|system/.test(lowerContent)) {
    return 'high'
  }
  
  // Medium complexity indicators  
  if (/add.*page|new.*section|form|multiple/.test(lowerContent)) {
    return 'medium'
  }
  
  // Low complexity (styling, text changes, etc.)
  return 'low'
}

function shouldAutoGenerateAI(content: string): boolean {
  // Auto-generate for simple styling and content changes
  const simple = /bigger|smaller|color|font|text|spacing|padding|margin/i
  return simple.test(content)
}

async function generateSimpleInstructions(suggestion: Suggestion): Promise<string> {
  const templates = {
    [SuggestionCategory.VISUAL_STYLING]: `# AI Agent Instructions: Visual Changes

## 🎨 User Request
**Page:** ${suggestion.page}
**Request:** "${suggestion.content}"

## 🔧 Implementation Steps
1. **Locate the target element** on ${suggestion.page}
2. **Apply the requested styling changes**
3. **Test responsive design** on mobile and desktop
4. **Verify accessibility** (contrast, focus states)

## ✅ Quick Implementation
This appears to be a simple styling change. Look for:
- CSS classes or inline styles
- Component styling (if using CSS-in-JS)
- Design system variables

**Estimated time:** 5-10 minutes`,

    [SuggestionCategory.CONTENT]: `# AI Agent Instructions: Content Update

## 📝 User Request  
**Page:** ${suggestion.page}
**Request:** "${suggestion.content}"

## 🔧 Implementation Steps
1. **Find the content section** on ${suggestion.page}
2. **Update the text/copy** as requested
3. **Check for any SEO implications** (meta tags, headings)
4. **Verify content hierarchy** and formatting

## ✅ Quick Implementation
This appears to be a content change. Look for:
- Text content in components
- Markdown files (if using content management)
- Hard-coded strings in templates

**Estimated time:** 2-5 minutes`
  }

  return templates[suggestion.category] || templates[SuggestionCategory.VISUAL_STYLING]
}

async function generateAdvancedInstructions(suggestion: Suggestion): Promise<string> {
  // This would use the AI instruction generator from our modular system
  // For now, return a comprehensive template
  
  return `# AI Agent Instructions: ${suggestion.category.replace('_', ' ').toUpperCase()}

## 🎯 User Request Analysis
**Page:** ${suggestion.page}
**URL:** ${suggestion.url}
**Category:** ${suggestion.category}
**Priority:** ${suggestion.priority}
**Complexity:** ${suggestion.complexity}

**User Request:** "${suggestion.content}"
**Contact:** ${suggestion.contact || 'Anonymous'}

## 🤖 AI Analysis
- **Intent:** ${analyzeIntent(suggestion.content)}
- **Scope:** ${analyzeScope(suggestion.content)}
- **Technical Requirements:** ${analyzeTechnicalRequirements(suggestion.content)}

## 🔧 Implementation Steps

1. **Understand the Request**
   - Review the current page at ${suggestion.url}
   - Identify the specific elements mentioned
   - Consider user experience impact

2. **Plan the Implementation**
   - Determine files that need modification
   - Consider responsive design implications
   - Plan for accessibility requirements

3. **Execute the Changes**
   - Make the requested modifications
   - Test on different devices and browsers
   - Verify functionality and styling

4. **Quality Assurance**
   - Check for any breaking changes
   - Validate accessibility standards
   - Test user interaction flows

## 📁 Likely Files to Modify
${suggestFilesToModify(suggestion)}

## ✅ Testing Checklist
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768px width)
- [ ] Mobile view (375px width)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Performance impact minimal

## 📝 Implementation Notes
- Consider existing design patterns
- Maintain code consistency
- Update related documentation if needed

**Estimated Implementation Time:** ${estimateTime(suggestion.complexity)}

---
*This suggestion was processed by AI-Native CMS*`
}

// Helper functions for advanced instructions
function analyzeIntent(content: string): string {
  if (/bigger|larger|increase/.test(content.toLowerCase())) {
    return "User wants to increase size or prominence of elements"
  }
  if (/add|new/.test(content.toLowerCase())) {
    return "User wants to add new content or functionality"
  }
  if (/fix|broken|error/.test(content.toLowerCase())) {
    return "User has identified an issue that needs fixing"
  }
  return "User wants to modify existing functionality"
}

function analyzeScope(content: string): string {
  if (/page|entire|whole/.test(content.toLowerCase())) {
    return "Page-wide changes"
  }
  if (/section/.test(content.toLowerCase())) {
    return "Section-specific changes"
  }
  return "Component-level changes"
}

function analyzeTechnicalRequirements(content: string): string {
  const requirements = []
  
  if (/responsive|mobile/.test(content.toLowerCase())) {
    requirements.push("Responsive design considerations")
  }
  if (/accessibility/.test(content.toLowerCase())) {
    requirements.push("Accessibility compliance")
  }
  if (/performance/.test(content.toLowerCase())) {
    requirements.push("Performance optimization")
  }
  
  return requirements.length > 0 ? requirements.join(", ") : "Standard web development practices"
}

function suggestFilesToModify(suggestion: Suggestion): string {
  const basePath = "src/"
  const page = suggestion.page.replace('/', '') || 'home'
  
  const suggestions = [
    `${basePath}pages${suggestion.page}/page.tsx (or index.tsx)`,
    `${basePath}components/sections/${page}Section.tsx`,
    `${basePath}styles/${page}.css (or global styles)`,
    `${basePath}components/layout/Layout.tsx (if global change)`
  ]
  
  return suggestions.map(file => `- ${file}`).join('\n')
}

function estimateTime(complexity: 'low' | 'medium' | 'high'): string {
  const times = {
    low: "5-15 minutes",
    medium: "30-60 minutes", 
    high: "2-4 hours"
  }
  return times[complexity]
}