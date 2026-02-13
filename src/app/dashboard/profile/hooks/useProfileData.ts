'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ROLES } from '@/lib/constants'
import { logger } from '@/lib/logger'

export interface ProfileData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  mobile: string
  address_line1: string
  address_line2: string
  postal_code: string
  city: string
  canton: string
  country: string
  preferred_language: string
  newsletter_subscribed: boolean
  // Public profile fields
  avatar_url?: string
  display_name?: string
  bio?: string
  profile_visibility?: 'public' | 'private'
  // Privacy settings
  show_email?: boolean
  show_phone?: boolean
  // Notification preferences
  email_notifications?: boolean
  sms_notifications?: boolean
  marketplace_updates?: boolean
  workshop_reminders?: boolean
  // Service provider fields
  skills?: string[]
  expertise_areas?: string[]
  website?: string
  service_radius_km?: number
  availability?: {
    monday?: { start: string; end: string; available: boolean }
    tuesday?: { start: string; end: string; available: boolean }
    wednesday?: { start: string; end: string; available: boolean }
    thursday?: { start: string; end: string; available: boolean }
    friday?: { start: string; end: string; available: boolean }
    saturday?: { start: string; end: string; available: boolean }
    sunday?: { start: string; end: string; available: boolean }
  }
}

const DEFAULT_PROFILE: ProfileData = {
  first_name: '',
  last_name: '',
  company_name: '',
  phone: '',
  mobile: '',
  address_line1: '',
  address_line2: '',
  postal_code: '',
  city: '',
  canton: '',
  country: 'Schweiz',
  preferred_language: 'de',
  newsletter_subscribed: false,
  avatar_url: '',
  display_name: '',
  bio: '',
  profile_visibility: 'public',
  show_email: false,
  show_phone: false,
  email_notifications: true,
  sms_notifications: false,
  marketplace_updates: true,
  workshop_reminders: true,
  skills: [],
  expertise_areas: [],
  website: '',
  service_radius_km: 50,
  availability: {
    monday: { start: '09:00', end: '17:00', available: true },
    tuesday: { start: '09:00', end: '17:00', available: true },
    wednesday: { start: '09:00', end: '17:00', available: true },
    thursday: { start: '09:00', end: '17:00', available: true },
    friday: { start: '09:00', end: '17:00', available: true },
    saturday: { start: '09:00', end: '17:00', available: false },
    sunday: { start: '09:00', end: '17:00', available: false },
  },
}

export function useProfileData() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [userRole, setUserRole] = useState<string>('')

  const isServiceProvider = userRole === ROLES.REPAIRER || userRole === ROLES.SELLER

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/profile')
    }
  }, [status, router])

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      logger.info('Profile loading', { userId: session?.user?.id })

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile(prev => ({ ...prev, ...data.profile }))
            logger.info('Profile loaded successfully', {
              userId: session?.user?.id,
              hasAvatar: !!data.profile.avatar_url,
              hasDisplayName: !!data.profile.display_name,
            })
          }
          if (data.role) {
            setUserRole(data.role)
          }
        } else if (response.status === 401) {
          logger.warn('Unauthorized profile access, redirecting to login', {
            userId: session?.user?.id,
          })
          router.push('/auth/login?callbackUrl=/dashboard/profile')
          return
        }
      } catch (error) {
        logger.error('Failed to load profile', { error, userId: session?.user?.id })
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated' && session?.user) {
      loadProfile()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
      router.push('/auth/login?callbackUrl=/dashboard/profile')
    }
  }, [session, status, router])

  return {
    session,
    status,
    isLoading,
    profile,
    setProfile,
    userRole,
    isServiceProvider,
  }
}
