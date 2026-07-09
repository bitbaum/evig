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
  Leaf,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { BuildRecommendation } from '@/config/build-computer'
import { getBuildRecommendation, USE_CASE_OPTIONS, PERFORMANCE_OPTIONS, BUDGET_OPTIONS } from '@/config/build-computer'

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
 * Selectable option card (SSOT for the use-case + performance pickers).
 *
 * A plain focusable div — NOT <Button>, whose base is
 * `inline-flex items-center justify-center whitespace-nowrap` and crushes a
 * stacked title+description onto one non-wrapping line (the layout bug this
 * replaced). role/tabIndex/onKeyDown keep it keyboard-accessible.
 */
function OptionCard({
  selected,
  onSelect,
  className = '',
  children,
}: {
  selected: boolean
  onSelect: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
      className={[
        'p-4 border rounded-lg cursor-pointer transition-colors w-full',
        'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action',
        selected ? 'border-strong bg-surface-raised' : 'hover:border-strong',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
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
  const [buildResult, setBuildResult] = useState<BuildRecommendation | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setBuildResult(getBuildRecommendation(formData.useCase))
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

  // Honest guidance rows — recommended component TIER per type, not fabricated
  // products. Each type links to the real marketplace so people see actual stock.
  const componentRows = buildResult ? [
    { guidance: buildResult.cpu,     icon: Cpu,       type: t('buildTool.componentTypes.cpu') },
    { guidance: buildResult.gpu,     icon: Monitor,   type: t('buildTool.componentTypes.gpu') },
    { guidance: buildResult.ram,     icon: Zap,       type: t('buildTool.componentTypes.ram') },
    { guidance: buildResult.storage, icon: HardDrive, type: t('buildTool.componentTypes.storage') },
  ] : []

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
          <OptionCard
            key={category.id}
            selected={formData.useCase === category.id}
            onSelect={() => setFormData({ ...formData, useCase: category.id as FormData['useCase'] })}
          >
            <Heading level={4} className="font-semibold text-text-primary">{category.name}</Heading>
            <p className="text-sm text-text-secondary mt-1">{category.description}</p>
          </OptionCard>
        ))}
      </div>

      <div>
        <Heading level={4} className="font-semibold mb-4">{t('buildTool.performanceHeading')}</Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {performanceOptions.map((perf) => (
            <OptionCard
              key={perf.id}
              selected={formData.performance === perf.id}
              onSelect={() => setFormData({ ...formData, performance: perf.id as FormData['performance'] })}
              className="text-center"
            >
              <div className="font-semibold">{perf.name}</div>
              <div className="text-xs text-text-secondary mt-1">{perf.description}</div>
            </OptionCard>
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
  buildResult: BuildRecommendation
  componentRows: Array<{
    guidance: string
    icon: React.ComponentType<{ className?: string }>
    type: string
  }>
  onBack: () => void
}

function Step3({ t, buildResult, componentRows, onBack }: Step3Props) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Heading level={3} className="ui-public-display-md mb-3">{t('buildTool.step3Heading')}</Heading>
        <p className="mx-auto max-w-xl text-text-secondary">{buildResult.note}</p>
      </div>

      {/* Recommended component TIERS — honest guidance, not fabricated products
          with invented prices/stock/locations. */}
      <div className="space-y-3">
        {componentRows.map((row, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
            <row.icon className="w-6 h-6 shrink-0 text-text-tertiary" />
            <div className="min-w-0 grow">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{row.type}</p>
              <Heading level={4} className="font-semibold text-text-primary">{row.guidance}</Heading>
            </div>
          </div>
        ))}
      </div>

      {/* Honest next steps: browse the REAL marketplace or request a built machine. */}
      <div className="card-shell space-y-4 p-6">
        <p className="text-sm text-text-secondary">{t('buildTool.resultNote')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onBack} variant="outline" className="flex-1">
            {t('buildTool.changeRequirements')}
          </Button>
          <Button as={Link} href="/marketplace" variant="outline" className="flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('buildTool.browseComponents')}
          </Button>
          <Button as={Link} href="/contact" variant="primary" className="flex-1">
            {t('buildTool.orderBuild')}
          </Button>
        </div>
      </div>

      {/* Honest sustainability line — no fabricated CO₂/percentage numbers. */}
      <div className="card-shell flex items-start gap-3 p-6">
        <Leaf className="mt-0.5 w-4 h-4 shrink-0 text-action" />
        <p className="text-sm text-text-secondary">{t('buildTool.sustainabilityNote')}</p>
      </div>
    </div>
  )
}
