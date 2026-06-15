'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export interface Step {
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

const StepperComponent: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className
}) => {
  const t = useTranslations('components.stepper')

  return (
    <nav aria-label={t('progressLabel')} className={cn('w-full', className)}>
      {/* Mobile view - compact */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-text-tertiary">
          {t('stepOf', { current: currentStep + 1, total: steps.length })}
        </p>
        <p className="text-lg font-semibold text-text-primary mt-1">
          {steps[currentStep]?.label}
        </p>
        {steps[currentStep]?.description && (
          <p className="text-sm text-text-tertiary mt-1">
            {steps[currentStep].description}
          </p>
        )}
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-surface-overlay rounded-full overflow-hidden">
          <div
            className="h-full bg-action transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop view - full stepper */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && index < currentStep

          return (
            <li
              key={step.label}
              className={cn(
                'flex items-center',
                index !== steps.length - 1 && 'flex-1'
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-3 group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isCompleted && 'bg-action border-action',
                    isCurrent && 'border-action bg-surface-base',
                    !isCompleted && !isCurrent && 'border-default bg-surface-base',
                    isClickable && 'group-hover:border-action group-hover:bg-action-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent && 'text-action',
                        !isCurrent && 'text-text-muted'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>

                {/* Step label */}
                <div className="hidden lg:block">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-action',
                      isCurrent && 'text-action',
                      !isCompleted && !isCurrent && 'text-text-muted'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors duration-200',
                    isCompleted ? 'bg-action' : 'bg-surface-overlay'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export const Stepper = React.memo(StepperComponent)
