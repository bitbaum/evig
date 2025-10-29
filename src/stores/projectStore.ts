import type { Campaign, ProjectStore } from '@/types/campaign'

// Create a simple mock store for development
const createMockStore = (): ProjectStore => ({
  campaigns: [],
  currentCampaign: null,
  isLoading: false,
  error: null,

  setCampaigns: (campaigns: Campaign[]) => {
    // Mock implementation
  },

  setCurrentCampaign: (campaign: Campaign | null) => {
    // Mock implementation
  },

  addCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Mock implementation
  },

  updateCampaign: (id: string, updates: Partial<Campaign>) => {
    // Mock implementation
  },

  deleteCampaign: (id: string) => {
    // Mock implementation
  },

  setLoading: (loading: boolean) => {
    // Mock implementation
  },

  setError: (error: string | null) => {
    // Mock implementation
  },
})

// Export the store instance for external access if needed
export const projectStore = createMockStore()

// Hook that returns the store (simple implementation)
export const useCampaignStore = () => {
  return projectStore
}
