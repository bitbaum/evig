'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Search,
  ShoppingCart,
  MapPin,
  Leaf,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { BuildResult } from '@/config/build-computer'
import { getMockRecommendation, USE_CASE_OPTIONS, PERFORMANCE_OPTIONS, BUDGET_OPTIONS } from '@/config/build-computer'

type UseCaseId = typeof USE_CASE_OPTIONS[number]['id']
type PerformanceId = typeof PERFORMANCE_OPTIONS[number]['id']
type BudgetValue = typeof BUDGET_OPTIONS[number]['value']

interface FormData {
  useCase: UseCaseId | ''
  performance: PerformanceId | ''
  budget: BudgetValue | ''
  sustainability: string
  specific: string
}

/**
 * Single SSOT for the selectable option-card style.
 * Used by use-case + performance pickers in Step 1.
 */
function optionCardClass(selected: boolean) {
  return [
    'p-4 border rounded-lg cursor-pointer transition-colors text-left w-full',
    selected ? 'border-strong bg-surface-raised' : 'hover:border-strong',
  ].join(' ')
}

/** Monochrome step indicator — replaces bg-action-text-white circles. */
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8 font-mono tabular-nums">
      {[1, 2, 3].map((n, i) => (
        <span key={n} className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${
              step >= n
                ? 'border-strong bg-text-primary text-canvas'
                : 'border text-text-tertiary'
            }`}
          >
            {n}
          </span>
          {i < 2 && (
            <span className={`w-16 h-px ${step > n ? 'bg-text-primary' : 'bg-border-default'}`} />
          )}
        </span>
      ))}
    </div>
  )
}

export function BuildTool() {
  const t = useTranslations('services.buildComputer')

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    useCase: '',
    performance: '',
    budget: '',
    sustainability: 'high',
    specific: '',
  })
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setBuildResult(getMockRecommendation(formData.useCase))
    setIsAnalyzing(false)
    setStep(3)
  }

  const useCaseOptions = USE_CASE_OPTIONS.map(({ id }) => ({
    id,
    name: t(`useCaseOptions.${id}.name`),
    description: t(`useCaseOptions.${id}.description`),
  }))

  const performanceOptions = PERFORMANCE_OPTIONS.map(({ id }) => ({
    id,
    name: t(`performanceOptions.${id}.name`),
    description: t(`performanceOptions.${id}.description`),
  }))

  const budgetOptions = BUDGET_OPTIONS.map(({ value }) => ({
    value,
    label: t(`budgetOptions.${value}`),
  }))

  const componentRows = buildResult ? [
    { component: buildResult.cpu,     icon: Cpu,        type: t('buildTool.componentTypes.cpu') },
    { component: buildResult.gpu,     icon: Monitor,    type: t('buildTool.componentTypes.gpu') },
    { component: buildResult.ram,     icon: Zap,        type: t('buildTool.componentTypes.ram') },
    { component: buildResult.storage, icon: HardDrive,  type: t('buildTool.componentTypes.storage') },
  ] : []

  const conditionLabel = (condition: string) =>
    condition === 'used' ? t('buildTool.conditions.used')
    : condition === 'refurbished' ? t('buildTool.conditions.refurbished')
    : t('buildTool.conditions.new')

  const scanningLines = t.raw('buildTool.scanningLines') as string[]

  return (
    <section className="py-20 sm:py-24" id="build-tool">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Heading level={2} className="ui-public-display-md text-center mb-4">
            {t('buildTool.heading')}
          </Heading>
          <p className="ui-public-section-lede text-center mx-auto mb-12">
            {t('buildTool.subtitle')}
          </p>

          <StepDots step={step} />

          <div className="card-shell p-8">
            {step === 1 && (
              <Step1
                t={t}
                formData={formData}
                setFormData={setFormData}
                useCaseOptions={useCaseOptions}
                performanceOptions={performanceOptions}
                budgetOptions={budgetOptions}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <Step2
                t={t}
                formData={formData}
                isAnalyzing={isAnalyzing}
                scanningLines={scanningLines}
                onBack={() => setStep(1)}
                onAnalyze={handleAnalyze}
              />
            )}

            {step === 3 && buildResult && (
              <Step3
                t={t}
                buildResult={buildResult}
                componentRows={componentRows}
                conditionLabel={conditionLabel}
                onBack={() => setStep(1)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────── Step 1: Requirements ────────────────────────── */

interface Step1Props {
  t: ReturnType<typeof useTranslations>
  formData: FormData
  setFormData: (data: FormData) => void
  useCaseOptions: Array<{ id: string; name: string; description: string }>
  performanceOptions: Array<{ id: string; name: string; description: string }>
  budgetOptions: Array<{ value: string; label: string }>
  onNext: () => void
}

function Step1({ t, formData, setFormData, useCaseOptions, performanceOptions, budgetOptions, onNext }: Step1Props) {
  return (
    <div className="space-y-8">
      <Heading level={3} className="ui-public-display-md mb-6">{t('buildTool.step1Heading')}</Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {useCaseOptions.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setFormData({ ...formData, useCase: category.id as FormData['useCase'] })}
            className={optionCardClass(formData.useCase === category.id)}
          >
            <Heading level={4} className="font-semibold text-text-primary">{category.name}</Heading>
            <p className="text-sm text-text-secondary mt-1">{category.description}</p>
          </button>
        ))}
      </div>

      <div>
        <Heading level={4} className="font-semibold mb-4">{t('buildTool.performanceHeading')}</Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {performanceOptions.map((perf) => (
            <button
              key={perf.id}
              type="button"
              onClick={() => setFormData({ ...formData, performance: perf.id as FormData['performance'] })}
              className={`${optionCardClass(formData.performance === perf.id)} text-center`}
            >
              <div className="font-semibold">{perf.name}</div>
              <div className="text-xs text-text-secondary mt-1">{perf.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2">{t('buildTool.budgetLabel')}</label>
        <Select
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value as BudgetValue | '' })}
        >
          <option value="">{t('buildTool.budgetPlaceholder')}</option>
          {budgetOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block font-semibold mb-2">{t('buildTool.specificLabel')}</label>
        <Textarea
          value={formData.specific}
          onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
          placeholder={t('buildTool.specificPlaceholder')}
          className="h-20"
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!formData.useCase || !formData.performance || !formData.budget}
        variant="primary"
        className="w-full"
      >
        {t('buildTool.nextButton')}
      </Button>
    </div>
  )
}

/* ────────────────────────── Step 2: AI Analysis ────────────────────────── */

interface Step2Props {
  t: ReturnType<typeof useTranslations>
  formData: FormData
  isAnalyzing: boolean
  scanningLines: string[]
  onBack: () => void
  onAnalyze: () => void
}

function Step2({ t, formData, isAnalyzing, scanningLines, onBack, onAnalyze }: Step2Props) {
  if (isAnalyzing) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="animate-spin w-10 h-10 border-2 border-text-primary border-t-transparent rounded-full mx-auto" />
        <div className="space-y-2 font-mono text-sm text-text-secondary">
          <p className="text-text-primary font-semibold">{t('buildTool.scanningLabel')}</p>
          {scanningLines.map((line, i) => (
            <p key={i}>· {line}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-8">
      <Heading level={3} className="ui-public-display-md">{t('buildTool.step2Heading')}</Heading>

      <div className="card-shell p-6 text-left">
        <Heading level={4} className="font-semibold mb-4">{t('buildTool.requirementsSummary')}</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>{t('buildTool.useCaseLabel')}:</strong>{' '}
            {formData.useCase ? t(`useCaseOptions.${formData.useCase}.name`) : ''}
          </div>
          <div><strong>{t('buildTool.performanceLabel')}:</strong>{' '}
            {formData.performance ? t(`performanceOptions.${formData.performance}.name`) : ''}
          </div>
          <div><strong>{t('buildTool.budgetSummaryLabel')}:</strong> {formData.budget}</div>
          <div><strong>{t('buildTool.sustainabilityLabel')}:</strong> {t('buildTool.sustainabilityValue')}</div>
        </div>
        {formData.specific && (
          <div className="mt-4 text-sm">
            <strong>{t('buildTool.specialNotesLabel')}:</strong> {formData.specific}
          </div>
        )}
      </div>

      <p className="text-text-secondary">{t('buildTool.analyzeDescription')}</p>

      <div className="flex gap-3 justify-center">
        <Button onClick={onBack} variant="outline">
          {t('buildTool.backButton')}
        </Button>
        <Button onClick={onAnalyze} variant="primary">
          <Search className="w-4 h-4 mr-2" />
          {t('buildTool.analyzeButton')}
        </Button>
      </div>
    </div>
  )
}

/* ────────────────────────── Step 3: Results ────────────────────────── */

interface Step3Props {
  t: ReturnType<typeof useTranslations>
  buildResult: BuildResult
  componentRows: Array<{
    component: BuildResult['cpu']
    icon: React.ComponentType<{ className?: string }>
    type: string
  }>
  conditionLabel: (condition: string) => string
  onBack: () => void
}

function Step3({ t, buildResult, componentRows, conditionLabel, onBack }: Step3Props) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Heading level={3} className="ui-public-display-md mb-3">{t('buildTool.step3Heading')}</Heading>
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          <span>{buildResult.sustainabilityScore}{t('buildTool.sustainableLabel')}</span>
          <span>·</span>
          <span>{buildResult.performance}{t('buildTool.performanceMatchLabel')}</span>
          <span>·</span>
          <span>{buildResult.usedPartsPercent}{t('buildTool.usedPartsLabel')}</span>
        </div>
      </div>

      <div className="space-y-3">
        {componentRows.map((row, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <row.icon className="w-6 h-6 text-text-tertiary shrink-0" />
            <div className="grow min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <Heading level={4} className="font-semibold text-text-primary">{row.component.name}</Heading>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                  · {conditionLabel(row.component.condition)}
                </span>
              </div>
              <p className="text-sm text-text-secondary">{row.type}</p>
              <div className="font-mono text-xs text-text-tertiary mt-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{row.component.location}</span>
                <span>{row.component.inStock} {t('buildTool.inStock')}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono tabular-nums font-semibold">CHF {row.component.price}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mt-1">{t('buildTool.deliveryTime')}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-shell p-6">
        <div className="flex justify-between items-center mb-3 font-mono tabular-nums">
          <span className="font-semibold">{t('buildTool.totalCost')}</span>
          <span className="text-2xl font-semibold">CHF {buildResult.totalPrice}</span>
        </div>
        <p className="text-sm text-text-secondary mb-5">{t('buildTool.extras')}</p>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            {t('buildTool.changeRequirements')}
          </Button>
          <Button as={Link} href="/contact" variant="primary" className="flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('buildTool.orderBuild')}
          </Button>
        </div>
      </div>

      <div className="card-shell p-6">
        <Heading level={4} className="font-semibold mb-4 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-action" />
          {t('buildTool.environmentHeading')}
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{t('buildTool.co2Saved')}</div>
            <div className="font-mono tabular-nums mt-1 text-text-primary">{t('buildTool.co2Value')}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{t('buildTool.reusedLabel')}</div>
            <div className="font-mono tabular-nums mt-1 text-text-primary">{t('buildTool.reusedValue')}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{t('buildTool.circularLabel')}</div>
            <div className="font-mono tabular-nums mt-1 text-text-primary">{t('buildTool.circularValue')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
