export interface Pool {
  id: string
  serviceName: string
  serviceCategory: string
  maxMembers: number
  monthlyCostChf: string
  costPerMemberChf: string
  description: string | null
  rules: string | null
  ownerName: string | null
  memberCount: number
  spotsLeft: number
  createdAt: string
}

/**
 * Pool categories, in the order they are offered.
 *
 * `ai` leads because it is the reason this page exists. The /ai division page
 * states the problem in one line — "Wer ein teures Abo bezahlen kann, lernt
 * schneller, arbeitet besser und kommt an Chancen, die anderen verschlossen
 * bleiben" — and a shared seat in one of those subscriptions is the most
 * direct answer evig has to it. A pool of four turns CHF 22/month into
 * CHF 5.50. The other categories still work; they are just not the point.
 *
 * Key order here IS the render order: both the filter chips and the create
 * form iterate this object.
 */
export const CATEGORY_EMOJIS: Record<string, string> = {
  ai:        '🤖',
  software:  '💻',
  cloud:     '☁️',
  music:     '🎵',
  news:      '📰',
  streaming: '📺',
  gaming:    '🎮',
  other:     '📦',
}

/** Default selection in the create form — see the ordering note above. */
export const DEFAULT_CATEGORY = 'ai'
