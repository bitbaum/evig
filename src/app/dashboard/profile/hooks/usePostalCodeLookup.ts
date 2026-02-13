'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { lookupSwissPostalCode, searchSwissCities, isValidSwissPostalCode, type PostalCodeData } from '@/lib/swiss-postal-codes'
import type { ProfileData } from './useProfileData'

interface UsePostalCodeLookupParams {
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>
}

export function usePostalCodeLookup({ setProfile }: UsePostalCodeLookupParams) {
  const [postalCodeSuggestions, setPostalCodeSuggestions] = useState<PostalCodeData[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handlePostalCodeChange = (value: string) => {
    setProfile(prev => ({ ...prev, postal_code: value }))

    // Auto-fill city and canton if valid Swiss postal code
    if (isValidSwissPostalCode(value)) {
      const postalData = lookupSwissPostalCode(value)
      if (postalData) {
        logger.info('Postal code auto-filled', {
          postalCode: value,
          city: postalData.city,
          canton: postalData.canton,
        })
        setProfile(prev => ({
          ...prev,
          postal_code: value,
          city: postalData.city,
          canton: postalData.canton
        }))
      }
    }
  }

  const handleCitySearch = (value: string) => {
    setProfile(prev => ({ ...prev, city: value }))

    if (value.length >= 2) {
      const suggestions = searchSwissCities(value)
      setPostalCodeSuggestions(suggestions.slice(0, 5))
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectPostalSuggestion = (suggestion: PostalCodeData) => {
    logger.info('Postal suggestion selected', {
      postalCode: suggestion.postal_code,
      city: suggestion.city,
      canton: suggestion.canton,
    })
    setProfile(prev => ({
      ...prev,
      postal_code: suggestion.postal_code,
      city: suggestion.city,
      canton: suggestion.canton
    }))
    setShowSuggestions(false)
  }

  return {
    postalCodeSuggestions,
    showSuggestions,
    handlePostalCodeChange,
    handleCitySearch,
    selectPostalSuggestion,
  }
}
