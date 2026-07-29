'use client'

/** Entry-mode tab configuration and shared state types for DataEntryTabs. */

import { Mic, Camera, Zap, FileUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type EntryMode = 'speech' | 'picture' | 'form' | 'file'

export interface TabConfig {
  id: EntryMode
  label: string
  icon: React.ReactNode
  description: string
}

export type QuickEntryState = 'idle' | 'loading' | 'success' | 'error'

export function useCoreTabs(): TabConfig[] {
  const t = useTranslations('components.erfassung.dataEntryTabs')

  return [
    {
      id: 'form',
      label: t('tabTextLabel'),
      icon: <Zap className="w-4 h-4" />,
      description: t('tabTextDesc'),
    },
    {
      id: 'picture',
      label: t('tabPictureLabel'),
      icon: <Camera className="w-4 h-4" />,
      description: t('tabPictureDesc'),
    },
    {
      id: 'file',
      label: t('tabFileLabel'),
      icon: <FileUp className="w-4 h-4" />,
      description: t('tabFileDesc'),
    },
    {
      id: 'speech',
      label: t('tabSpeechLabel'),
      icon: <Mic className="w-4 h-4" />,
      description: t('tabSpeechDesc'),
    },
  ]
}
