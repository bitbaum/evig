'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import {
  Computer,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Globe,
  Recycle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Leaf,
  Star,
  ArrowRight,
  Search,
  ShoppingCart,
  Award,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/layout/PageHero'
import type { BuildResult } from '@/config/build-computer'
import { getMockRecommendation } from '@/config/build-computer'
import { getDefaultValue } from '@/lib/org-numbers.defaults'

const USE_CASE_IDS = ['office', 'creative', 'gaming', 'development', 'server', 'ai'] as const
const PERFORMANCE_IDS = ['basic', 'moderate', 'high', 'extreme'] as const
const BUDGET_VALUES = ['300-500', '500-800', '800-1200', '1200+'] as const

type UseCaseId = typeof USE_CASE_IDS[number]
type PerformanceId = typeof PERFORMANCE_IDS[number]
type BudgetValue = typeof BUDGET_VALUES[number]

export default function BuildYourComputerPage() {
  const t = useTranslations('services.buildComputer')

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    useCase: '' as UseCaseId | '',
    performance: '' as PerformanceId | '',
    budget: '' as BudgetValue | '',
    sustainability: 'high',
    specific: ''
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

  const useCaseOptions = USE_CASE_IDS.map(id => ({
    id,
    name: t(`useCaseOptions.${id}.name`),
    description: t(`useCaseOptions.${id}.description`),
  }))

  const performanceOptions = PERFORMANCE_IDS.map(id => ({
    id,
    name: t(`performanceOptions.${id}.name`),
    description: t(`performanceOptions.${id}.description`),
  }))

  const budgetOptions = BUDGET_VALUES.map(value => ({
    value,
    label: t(`budgetOptions.${value}`),
  }))

  const componentRows = buildResult ? [
    { component: buildResult.cpu, icon: Cpu, type: t('buildTool.componentTypes.cpu') },
    { component: buildResult.gpu, icon: Monitor, type: t('buildTool.componentTypes.gpu') },
    { component: buildResult.ram, icon: Zap, type: t('buildTool.componentTypes.ram') },
    { component: buildResult.storage, icon: HardDrive, type: t('buildTool.componentTypes.storage') },
  ] : []

  const getConditionLabel = (condition: string) => {
    if (condition === 'used') return t('buildTool.conditions.used')
    if (condition === 'refurbished') return t('buildTool.conditions.refurbished')
    return t('buildTool.conditions.new')
  }

  const getConditionClass = (condition: string) => {
    if (condition === 'used') return 'bg-green-100 text-green-800'
    if (condition === 'refurbished') return 'bg-blue-100 text-blue-800'
    return 'bg-orange-100 text-orange-800'
  }

  const scanningLines = t.raw('buildTool.scanningLines') as string[]

  return (
    <main>
      <PageHero
        theme="services"
        icon={Computer}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
          <strong>{t('hero.strong')}</strong>
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm mt-6">
          <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
            <Recycle className="w-4 h-4 mr-2" />
            {t('hero.badge1')}
          </div>
          <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
            <Globe className="w-4 h-4 mr-2" />
            {t('hero.badge2')}
          </div>
          <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
            <Star className="w-4 h-4 mr-2" />
            {t('hero.badge3')}
          </div>
        </div>
      </PageHero>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <Heading level={2} className="text-center mb-12">{t('howItWorks.heading')}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {(t.raw('howItWorks.steps') as Array<{ title: string; description: string }>).map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{index + 1}</div>
                <Heading level={3} className="mb-3">{step.title}</Heading>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Build Tool */}
      <section className="py-12 sm:py-16 md:py-20" id="build-tool">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Heading level={2} className="text-center mb-4">{t('buildTool.heading')}</Heading>
            <p className="text-center text-gray-600 mb-12">{t('buildTool.subtitle')}</p>

            {/* Progress Bar */}
            <div className="flex items-center justify-center mb-8">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
              <div className={`w-24 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Step 1: Requirements */}
              {step === 1 && (
                <div className="space-y-8">
                  <Heading level={3} className="mb-6">{t('buildTool.step1Heading')}</Heading>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {useCaseOptions.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => setFormData({...formData, useCase: category.id})}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.useCase === category.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Heading level={4} className="">{category.name}</Heading>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Heading level={4} className="mb-4">{t('buildTool.performanceHeading')}</Heading>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {performanceOptions.map((perf) => (
                        <button
                          key={perf.id}
                          onClick={() => setFormData({...formData, performance: perf.id})}
                          className={`p-3 text-center border-2 rounded-lg transition-all ${
                            formData.performance === perf.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">{perf.name}</div>
                          <div className="text-xs text-gray-600">{perf.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">{t('buildTool.budgetLabel')}</label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value as BudgetValue | ''})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">{t('buildTool.budgetPlaceholder')}</option>
                      {budgetOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">{t('buildTool.specificLabel')}</label>
                    <textarea
                      value={formData.specific}
                      onChange={(e) => setFormData({...formData, specific: e.target.value})}
                      placeholder={t('buildTool.specificPlaceholder')}
                      className="w-full p-3 border border-gray-300 rounded-lg h-20"
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!formData.useCase || !formData.performance || !formData.budget}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    {t('buildTool.nextButton')}
                  </button>
                </div>
              )}

              {/* Step 2: AI Analysis */}
              {step === 2 && (
                <div className="text-center space-y-8">
                  <Heading level={3} className="">{t('buildTool.step2Heading')}</Heading>

                  {!isAnalyzing ? (
                    <>
                      <div className="bg-green-50 p-6 rounded-lg">
                        <Heading level={4} className="mb-4">{t('buildTool.requirementsSummary')}</Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <strong>{t('buildTool.useCaseLabel')}:</strong>{' '}
                            {formData.useCase ? t(`useCaseOptions.${formData.useCase}.name`) : ''}
                          </div>
                          <div>
                            <strong>{t('buildTool.performanceLabel')}:</strong>{' '}
                            {formData.performance ? t(`performanceOptions.${formData.performance}.name`) : ''}
                          </div>
                          <div><strong>{t('buildTool.budgetSummaryLabel')}:</strong> {formData.budget}</div>
                          <div><strong>{t('buildTool.sustainabilityLabel')}:</strong> {t('buildTool.sustainabilityValue')}</div>
                        </div>
                        {formData.specific && (
                          <div className="mt-4 text-left">
                            <strong>{t('buildTool.specialNotesLabel')}:</strong> {formData.specific}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600">{t('buildTool.analyzeDescription')}</p>

                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setStep(1)}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          {t('buildTool.backButton')}
                        </button>
                        <button
                          onClick={handleAnalyze}
                          className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center"
                        >
                          <Search className="w-5 h-5 mr-2" />
                          {t('buildTool.analyzeButton')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                      <div className="space-y-3">
                        <p className="font-semibold">{t('buildTool.scanningLabel')}</p>
                        {scanningLines.map((line, i) => (
                          <p key={i} className="text-gray-600">• {line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Results */}
              {step === 3 && buildResult && (
                <div className="space-y-8">
                  <div className="text-center">
                    <Heading level={3} className="mb-2">{t('buildTool.step3Heading')}</Heading>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center">
                        <Leaf className="w-4 h-4 text-green-500 mr-1" />
                        {buildResult.sustainabilityScore}{t('buildTool.sustainableLabel')}
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                        {buildResult.performance}{t('buildTool.performanceMatchLabel')}
                      </div>
                      <div className="flex items-center">
                        <Recycle className="w-4 h-4 text-green-500 mr-1" />
                        {buildResult.usedPartsPercent}{t('buildTool.usedPartsLabel')}
                      </div>
                    </div>
                  </div>

                  {/* Component List */}
                  <div className="space-y-4">
                    {componentRows.map((item, index) => (
                      <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                        <item.icon className="w-8 h-8 text-green-600 mr-4" />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <Heading level={4} className="">{item.component.name}</Heading>
                            <span className={`px-2 py-1 text-xs rounded-full ${getConditionClass(item.component.condition)}`}>
                              {getConditionLabel(item.component.condition)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.type}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {item.component.location}
                            </span>
                            <span>{item.component.inStock} {t('buildTool.inStock')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">CHF {item.component.price}</div>
                          <div className="text-xs text-gray-500">{t('buildTool.deliveryTime')}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total and Actions */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">{t('buildTool.totalCost')}</span>
                      <span className="text-2xl font-bold text-green-600">CHF {buildResult.totalPrice}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-6">
                      {t('buildTool.extras')}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {t('buildTool.changeRequirements')}
                      </button>
                      <Link
                        href="/contact"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center flex items-center justify-center"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {t('buildTool.orderBuild')}
                      </Link>
                    </div>
                  </div>

                  {/* Sustainability Impact */}
                  <div className="bg-green-50 p-6 rounded-lg">
                    <Heading level={4} className="mb-4 flex items-center">
                      <Leaf className="w-5 h-5 text-green-600 mr-2" />
                      {t('buildTool.environmentHeading')}
                    </Heading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-semibold">{t('buildTool.co2Saved')}</div>
                        <div className="text-green-600">{t('buildTool.co2Value')}</div>
                      </div>
                      <div>
                        <div className="font-semibold">{t('buildTool.reusedLabel')}</div>
                        <div className="text-green-600">{t('buildTool.reusedValue')}</div>
                      </div>
                      <div>
                        <div className="font-semibold">{t('buildTool.circularLabel')}</div>
                        <div className="text-green-600">{t('buildTool.circularValue')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <Heading level={2} className="text-center mb-12">{t('features.heading')}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[Globe, Star, CheckCircle2].map((Icon, index) => {
              const items = t.raw('features.items') as Array<{ title: string; description: string }>
              return (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                  <Icon className="w-12 h-12 text-green-600 mb-4" />
                  <Heading level={3} className="mb-4">{items[index].title}</Heading>
                  <p className="text-gray-600">{items[index].description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Revamped Certification Brief */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center bg-green-100 px-6 py-3 rounded-full mb-6">
                <Award className="w-8 h-8 text-green-600 mr-3" />
                <span className="text-2xl font-bold text-green-800">Revamped</span>
                <Sparkles className="w-6 h-6 text-green-600 ml-2" />
              </div>
              <Heading level={2} className="mb-4">{t('certification.heading')}</Heading>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('certification.body')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getDefaultValue('reuse_rate')}</div>
                  <div className="text-sm text-gray-600">{t('certification.sustainabilityScore')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getDefaultValue('co2_savings_per_device')} kg</div>
                  <div className="text-sm text-gray-600">{t('certification.co2Saved')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getDefaultValue('devices_processed_per_year')}</div>
                  <div className="text-sm text-gray-600">{t('certification.certifiedComputers')}</div>
                </div>
              </div>
              <Link
                href="/revamped"
                className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                {t('certification.learnMore')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Heading level={2} className="mb-6">{t('cta.heading')}</Heading>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            {t('cta.body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              {t('cta.startBuild')}
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              {t('cta.explore')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
