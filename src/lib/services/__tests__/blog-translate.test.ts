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

  it('returns translated title/excerpt/content for a target locale', async () => {
    mockCall
      .mockResolvedValueOnce({ text: '{"title":"Titre","excerpt":"Extrait"}' }) // meta
      .mockResolvedValueOnce({ text: '# Titre\n\nCorps traduit.' }) // content
    const out = await translateBlogPost({ title: 'Titel', excerpt: 'Auszug', content: '# Titel\n\nInhalt.' }, 'fr')
    expect(out).toEqual({ title: 'Titre', excerpt: 'Extrait', content: '# Titre\n\nCorps traduit.' })
  })

  it('strips an accidental ```markdown code-fence wrapper from the body', async () => {
    mockCall
      .mockResolvedValueOnce({ text: '{"title":"Titre","excerpt":"Extrait"}' })
      .mockResolvedValueOnce({ text: '```markdown\n# Titre\n\nCorps.\n```' })
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out?.content).toBe('# Titre\n\nCorps.')
  })

  it('returns null when the content call fails (so the caller can report it)', async () => {
    mockCall
      .mockResolvedValueOnce({ text: '{"title":"Titre","excerpt":"Extrait"}' }) // meta ok
      .mockResolvedValueOnce(null) // content fails
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out).toBeNull()
  })

  it('returns null when the meta JSON has no title', async () => {
    mockExtractJson.mockReturnValue({ excerpt: 'only excerpt' })
    mockCall
      .mockResolvedValueOnce({ text: '{"excerpt":"only excerpt"}' })
      .mockResolvedValueOnce({ text: '# Titre' })
    const out = await translateBlogPost({ title: 'Titel', content: '# Titel' }, 'fr')
    expect(out).toBeNull()
  })
})
