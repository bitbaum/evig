import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { ROUTES } from '@/config/routes'

describe('Hirn admin page guides', () => {
  it.each(['/admin/intake/capture', '/admin/erfassung'])(
    '%s resolves to the canonical product-capture guide',
    (path) => {
      const context = resolveHirnContext(path, 'admin')
      expect(context.area).toBe('admin-product-capture')
      expect(context.guide?.steps.map(step => step.title)).toEqual([
        'Daten eingeben',
        'KI-Vorschlag prüfen',
        'Nächsten Schritt wählen',
        'Weiterarbeiten',
      ])
      expect(context.guide?.learnMore?.href).toBe(ROUTES.public.soFunktioniert)
    },
  )

  it('keeps the pipeline guide distinct from capture', () => {
    const context = resolveHirnContext('/admin/intake', 'admin')
    expect(context.area).toBe('admin-erfassung')
    expect(context.guide?.title).toBe('Geräte-Eingang')
  })
})
