/**
 * Tests for blog-translate.ts — AI-assisted per-locale translation.
 *
 * The scalable "all 8 languages without git" path. We don't test the model's
 * output quality (that's the provider's job); we lock the contract: the German
 * base is never re-translated, content is returned as raw Markdown, a failed AI
 * call yields null (so the caller can report which locales failed), and code
 * fences the model might wrap around the body are stripped.
 */

const mockCall = jest.fn()
const mockExtractJson = jest.fn()

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCall(...args),
  extractJson: (...args: unknown[]) => mockExtractJson(...args),
}))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }))

import { translateBlogPost } from '../blog-translate'

beforeEach(() => {
  jest.clearAllMocks()
  mockExtractJson.mockReturnValue({ title: 'Titre', excerpt: 'Extrait' })
})

describe('translateBlogPost', () => {
  it('never translates the German base locale', async () => {
    const out = await translateBlogPost({ title: 'x', content: 'y' }, 'de')
    expect(out).toBeNull()
    expect(mockCall).not.toHaveBeenCalled()
  })

  // Order: content is translated first (raw Markdown), then title+excerpt (JSON).
  it('returns translated title/excerpt/content for a target locale', async () => {
    mockCall
      .mockResolvedValueOnce({ text: '# Titre\n\nCorps traduit.' }) // content (1st)
      .mockResolvedValueOnce({ text: '{"title":"Titre","excerpt":"Extrait"}' }) // meta (2nd)
    const out = await translateBlogPost({ title: 'Titel', excerpt: 'Auszug', content: '# Titel\n\nInhalt.' }, 'fr')
    expect(out).toEqual({ title: 'Titre', excerpt: 'Extrait', content: '# Titre\n\nCorps traduit.' })
  })

  it('strips an accidental ```markdown code-fence wrapper from the body', async () => {
    mockCall
      .mockResolvedValueOnce({ text: '```markdown\n# Titre\n\nCorps.\n```' }) // content
      .mockResolvedValueOnce({ text: '{"title":"Titre","excerpt":"Extrait"}' }) // meta
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out?.content).toBe('# Titre\n\nCorps.')
  })

  it('returns null when the content call fails (so the caller can report it)', async () => {
    mockCall.mockResolvedValue(null) // content fails on every retry → never reaches meta
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out).toBeNull()
  })

  it('returns null when the meta JSON has no title', async () => {
    mockExtractJson.mockReturnValue({ excerpt: 'only excerpt' })
    mockCall
      .mockResolvedValueOnce({ text: '# Titre' }) // content ok
      .mockResolvedValue({ text: '{"excerpt":"only excerpt"}' }) // meta: no title, every retry
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out).toBeNull()
  })
})
