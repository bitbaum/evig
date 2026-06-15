import {
  UPCYCLING_GALLERY_PIECES,
  splitUpcyclingGalleryPieces,
} from '@/data/upcycling-gallery'
import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'

describe('splitUpcyclingGalleryPieces', () => {
  it('splits documented vs queued by presence of image', () => {
    const { documented, queued } = splitUpcyclingGalleryPieces()
    expect(documented).toHaveLength(1)
    expect(documented[0]?.id).toBe('lenovo-l2251pwd')
    expect(queued).toHaveLength(UPCYCLING_GALLERY_PIECES.length - 1)
  })

  it('links the documented piece to its guide route', () => {
    const { documented } = splitUpcyclingGalleryPieces()
    expect(documented[0]?.guideHref).toBe(UPCYCLING_ROUTES.lenovoL2251pwd)
  })
})
