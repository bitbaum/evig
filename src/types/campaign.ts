/**
 * Campaign/Project Types
 * 
 * Type definitions for campaigns and projects
 */

export type CampaignStatus = 'draft' | 'active' | 'completed'

export interface Campaign {
  id: string
  title: string
  description: string
  status: CampaignStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectStore {
  campaigns: Campaign[]
  currentCampaign: Campaign | null
  isLoading: boolean
  error: string | null
  setCampaigns: (campaigns: Campaign[]) => void
  setCurrentCampaign: (campaign: Campaign | null) => void
  addCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  deleteCampaign: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

