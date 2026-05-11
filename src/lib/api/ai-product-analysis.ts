import { apiFetch } from '@/lib/api/client'
import type { ProductAnalysis, SustainabilityScore } from '@/hooks/useAIProductAnalysis'

export type { ProductAnalysis, SustainabilityScore }

interface AnalyzeProductResponse {
  analysis?: ProductAnalysis
  sustainability_score?: SustainabilityScore
  saved_product_id?: string
}

export async function callAnalyzeProductAPI(imageBase64: string, saveToDatabase = false) {
  return apiFetch<AnalyzeProductResponse>('/api/ai/analyze-product', {
    method: 'POST',
    body: { image: imageBase64, saveToDatabase },
  })
}
