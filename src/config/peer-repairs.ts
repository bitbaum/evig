/**
 * Peer Repair Marketplace Configuration
 *
 * @deprecated This file is deprecated. Import from '@/config/it-hilfe' instead.
 * This file re-exports from it-hilfe.ts for backward compatibility.
 *
 * Migration guide:
 * - Replace: import { ... } from '@/config/peer-repairs'
 * - With:    import { ... } from '@/config/it-hilfe'
 */

// Re-export everything from it-hilfe for backward compatibility
export {
  // Feature identity
  IT_HILFE,

  // Service categories (new)
  SERVICE_CATEGORIES,
  type ServiceCategory,

  // Skills
  IT_SKILLS,
  type ITSkill,
  getAllSkills,
  getSkillsByCategory,
  getSkillById,
  getSkillIds,
  getServiceCategoryById,
  getSkillsGroupedByCategory,

  // Device categories
  DEVICE_CATEGORIES,
  type DeviceCategory,
  getCategoryById,
  getCategoryIds,
  getSkillsForCategory,

  // Budget tiers
  BUDGET_TIERS,
  type BudgetTier,
  getBudgetTierById,
  formatBudget,

  // Urgency levels
  URGENCY_LEVELS,
  type UrgencyLevel,
  getUrgencyById,

  // Service types
  SERVICE_TYPES,
  type ServiceType,
  getServiceTypeById,

  // Request statuses
  REQUEST_STATUSES,
  type RequestStatus,
  getRequestStatusById,
  isRequestAcceptingOffers,

  // Offer statuses
  OFFER_STATUSES,
  type OfferStatus,
  getOfferStatusById,

  // Swiss cantons
  SWISS_CANTONS,
  type SwissCanton,
} from './it-hilfe'

// Legacy aliases for backward compatibility
// These map old names to new names

import { IT_SKILLS, type ITSkill } from './it-hilfe'

/**
 * @deprecated Use IT_SKILLS from '@/config/it-hilfe' instead
 * This exports skills in the old flat array format for backward compatibility
 */
export interface RepairSkill {
  id: string
  name: string
  category: 'hardware' | 'software' | 'network'
  description: string
}

/**
 * @deprecated Use getAllSkills() from '@/config/it-hilfe' instead
 * Maps new grouped skills to old flat array format
 */
export const REPAIR_SKILLS: RepairSkill[] = (() => {
  const categoryMap: Record<string, 'hardware' | 'software' | 'network'> = {
    repair: 'hardware',
    setup: 'software',
    support: 'software',
    data: 'software',
    network: 'network',
  }

  const skills: RepairSkill[] = []
  for (const [categoryId, categorySkills] of Object.entries(IT_SKILLS)) {
    for (const skill of categorySkills) {
      skills.push({
        id: skill.id,
        name: skill.name,
        category: categoryMap[categoryId] || 'hardware',
        description: skill.description,
      })
    }
  }
  return skills
})()

/**
 * @deprecated Use getSkillsGroupedByCategory() from '@/config/it-hilfe' instead
 */
export function getSkillsByOldCategory(): Record<string, RepairSkill[]> {
  return REPAIR_SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, RepairSkill[]>)
}
