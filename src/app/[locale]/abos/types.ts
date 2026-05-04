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

export const CATEGORY_EMOJIS: Record<string, string> = {
  streaming: '📺',
  software:  '💻',
  cloud:     '☁️',
  gaming:    '🎮',
  music:     '🎵',
  news:      '📰',
  other:     '📦',
}
