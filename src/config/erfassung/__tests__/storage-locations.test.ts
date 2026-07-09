import {
  STORAGE_LOCATION_KINDS,
  STORAGE_LOCATION_KIND_OPTIONS,
  STORAGE_LOCATION_KIND_LABELS,
  STORAGE_LOCATION_SEEDS,
  isStorageLocationKind,
  getStorageLocationKindLabel,
} from '../storage-locations'

describe('storage-locations config (SSOT)', () => {
  it('every kind has a label', () => {
    for (const kind of STORAGE_LOCATION_KIND_OPTIONS) {
      expect(STORAGE_LOCATION_KIND_LABELS[kind]).toBeTruthy()
    }
  })

  it('isStorageLocationKind guards valid + invalid values', () => {
    expect(isStorageLocationKind(STORAGE_LOCATION_KINDS.MAIN_STORAGE)).toBe(true)
    expect(isStorageLocationKind('member_possession')).toBe(true)
    expect(isStorageLocationKind('warehouse-42')).toBe(false)
  })

  it('getStorageLocationKindLabel falls back to Andere / echoes unknown', () => {
    expect(getStorageLocationKindLabel('shop')).toBe('Laden')
    expect(getStorageLocationKindLabel(null)).toBe(STORAGE_LOCATION_KIND_LABELS.other)
    expect(getStorageLocationKindLabel('xyz')).toBe('xyz')
  })

  it('seed rows all use valid kinds (migration 117 matches config)', () => {
    for (const seed of STORAGE_LOCATION_SEEDS) {
      expect(isStorageLocationKind(seed.kind)).toBe(true)
      expect(seed.name).toBeTruthy()
    }
  })
})
