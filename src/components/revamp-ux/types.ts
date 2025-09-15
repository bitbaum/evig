/**
 * Types for the Revamp-UX system components
 * @fileoverview Centralized type definitions for better maintainability
 */

export type FeatureKey =
  | 'Direkte Nutzer-Feedback-Sammlung'
  | 'Technische Voraussetzungen'
  | 'Feedback-Kontext-Erfassung'
  | 'Feedback-Verarbeitung'
  | 'Echtzeit-Nutzer-Interaktion'

export interface FeatureComparison {
  wordpress: string
  strapi: string
  contentful: string
  revamp: string
}

export interface FeatureDetails extends Record<FeatureKey, FeatureComparison> {}

export interface FeatureModalProps {
  selectedFeature: FeatureKey | null
  featureDetails: FeatureDetails
  onClose: () => void
}

export interface FeatureCardProps {
  feature: FeatureKey
  description: string
  onClick: (feature: FeatureKey) => void
  icon: React.ComponentType<{ className?: string }>
}

export interface HeroSectionProps {
  title?: string
  subtitle?: string
  isDevelopment?: boolean
}