'use client'

import { usePathname } from '@/i18n/navigation'
import {
  UPCYCLING_FLOW_PATH_MAP,
  type UpcyclingFlowFromKey,
} from '@/config/upcycling-routes'
import { UpcyclingNextStep } from './UpcyclingNextStep'

type NextStepCopy = {
  eyebrow: string
  title: string
  body: string
  cta: string
}

type NextStepMessages = Partial<Record<UpcyclingFlowFromKey, NextStepCopy>>

interface UpcyclingNextStepBandProps {
  messages: NextStepMessages
}

/** Single “continue reading” band on flow pages (landing + status are terminal). */
export function UpcyclingNextStepBand({ messages }: UpcyclingNextStepBandProps) {
  const pathname = usePathname()
  const from = UPCYCLING_FLOW_PATH_MAP[pathname]
  if (!from) return null
  return <UpcyclingNextStep from={from} messages={messages} />
}
