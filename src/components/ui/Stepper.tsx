'use client'

import React from 'react'
import { Check } from 'lucide-react'
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
  return (
    <nav aria-label="Fortschritt" className={cn('w-full', className)}>
      {/* Mobile view - compact */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Schritt {currentStep + 1} von {steps.length}
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
          {steps[currentStep]?.label}
        </p>
        {steps[currentStep]?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {steps[currentStep].description}
          </p>
        )}
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
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
                    isCompleted && 'bg-primary-600 border-primary-600',
                    isCurrent && 'border-primary-600 bg-white dark:bg-gray-800',
                    !isCompleted && !isCurrent && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
                    isClickable && 'group-hover:border-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent && 'text-primary-600',
                        !isCurrent && 'text-gray-500 dark:text-gray-400'
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
                      isCompleted && 'text-primary-600',
                      isCurrent && 'text-primary-600',
                      !isCompleted && !isCurrent && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
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
                    isCompleted ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
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
