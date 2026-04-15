'use client'

import { useState } from 'react'
import Image from 'next/image'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'
import AboutSubNav from '@/components/about/AboutSubNav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IMPACT_METRICS, getEnvironmentalSummary, getSocialSummary, type ImpactMetric } from '@/data/impact-metrics'
import { getDefaultValue, getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { useTranslations } from 'next-intl'
// Simple Badge component replacement
const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
)

// Simple Tabs replacement using state
const SimpleTabs = ({
  tabs,
  defaultValue,
  children
}: {
  tabs: { value: string, label: string, icon?: React.ReactNode }[],
  defaultValue: string,
  children: (value: string) => React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className="w-full">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {children(activeTab)}
      </div>
    </div>
  )
}
import {
  Heart,
  Leaf,
  Users,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
  Download,
  Calendar,
  MapPin
} from 'lucide-react'
import {
  EWasteProblemSection,
  ZeroWasteSolutionSection,
  CommunitySpaceSection
} from '@/components/impact'

interface DonationMethod {
  id: string
  name: string
  description: string
  amount?: string
  icon: React.ReactNode
  benefits: string[]
  ctaText: string
  popular?: boolean
}

export default function ImpactPageContent() {
  const t = useTranslations('about.impact')
  const [selectedDonationMethod, setSelectedDonationMethod] = useState<string | null>(null)
  const envSummary = getEnvironmentalSummary()
  const socialSummary = getSocialSummary()

  const donationMethods: DonationMethod[] = [
    {
      id: 'monthly',
      name: t('donation.methods.monthly.name'),
      description: t('donation.methods.monthly.description'),
      amount: t('donation.methods.monthly.amount'),
      icon: <Heart className="h-6 w-6" />,
      benefits: [
        t('donation.methods.monthly.benefits.0'),
        t('donation.methods.monthly.benefits.1'),
        t('donation.methods.monthly.benefits.2'),
        t('donation.methods.monthly.benefits.3'),
      ],
      ctaText: t('donation.methods.monthly.cta'),
      popular: true
    },
    {
      id: 'one-time',
      name: t('donation.methods.oneTime.name'),
      description: t('donation.methods.oneTime.description'),
      amount: t('donation.methods.oneTime.amount'),
      icon: <Target className="h-6 w-6" />,
      benefits: [
        t('donation.methods.oneTime.benefits.0'),
        t('donation.methods.oneTime.benefits.1'),
        t('donation.methods.oneTime.benefits.2'),
        t('donation.methods.oneTime.benefits.3'),
      ],
      ctaText: t('donation.methods.oneTime.cta')
    },
    {
      id: 'corporate',
      name: t('donation.methods.corporate.name'),
      description: t('donation.methods.corporate.description'),
      amount: t('donation.methods.corporate.amount'),
      icon: <Award className="h-6 w-6" />,
      benefits: [
        t('donation.methods.corporate.benefits.0'),
        t('donation.methods.corporate.benefits.1'),
        t('donation.methods.corporate.benefits.2'),
        t('donation.methods.corporate.benefits.3'),
      ],
      ctaText: t('donation.methods.corporate.cta')
    },
    {
      id: 'equipment',
      name: t('donation.methods.equipment.name'),
      description: t('donation.methods.equipment.description'),
      icon: <Leaf className="h-6 w-6" />,
      benefits: [
        t('donation.methods.equipment.benefits.0'),
        t('donation.methods.equipment.benefits.1'),
        t('donation.methods.equipment.benefits.2'),
        t('donation.methods.equipment.benefits.3'),
      ],
      ctaText: t('donation.methods.equipment.cta')
    }
  ]

  const getCategoryIcon = (category: ImpactMetric['category']) => {
    switch (category) {
      case 'environmental': return <Leaf className="h-5 w-5 text-green-600" />
      case 'social': return <Users className="h-5 w-5 text-blue-600" />
      case 'economic': return <TrendingUp className="h-5 w-5 text-purple-600" />
    }
  }

  const getCategoryColor = (category: ImpactMetric['category']) => {
    switch (category) {
      case 'environmental': return 'bg-green-50 border-green-200'
      case 'social': return 'bg-blue-50 border-blue-200'
      case 'economic': return 'bg-purple-50 border-purple-200'
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <ResponsiveHero
        title={t('hero.title')}
        description={t('hero.description')}
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* E-Waste Problem Section */}
      <EWasteProblemSection />

      {/* Zero-Waste Solution Section */}
      <ZeroWasteSolutionSection />

      {/* Community Space Section */}
      <CommunitySpaceSection />

      {/* Impact Overview */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Heading level={2} className="mb-4">{t('transparency.title')}</Heading>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('transparency.description')}
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {IMPACT_METRICS.map((metric) => (
            <Card key={metric.id} className={`${getCategoryColor(metric.category)} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {getCategoryIcon(metric.category)}
                  {metric.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('verified')}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
                <CardDescription className="font-medium">{metric.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer font-medium mb-2">{t('methodology')}</summary>
                  <p className="mb-2">{metric.methodology}</p>
                  <p className="text-gray-500">{t('lastUpdated')}: {metric.lastUpdated}</p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Impact Stories */}
        <div className="bg-gray-50 rounded-lg p-8">
          <Heading level={3} className="mb-6 text-center">{t('impactInNumbers')}</Heading>
          <SimpleTabs
            defaultValue="environmental"
            tabs={[
              { value: 'environmental', label: t('tabs.environmental'), icon: <Leaf className="h-4 w-4" /> },
              { value: 'social', label: t('tabs.social'), icon: <Users className="h-4 w-4" /> },
              { value: 'economic', label: t('tabs.economic'), icon: <TrendingUp className="h-4 w-4" /> }
            ]}
          >
            {(activeTab) => (
              <>
                {activeTab === 'environmental' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Heading level={4} className="mb-3">{t('environmental.title')}</Heading>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{t('environmental.co2PerDevice', { value: envSummary.co2PerDevice })}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{t('environmental.ewasteAvoided', { value: envSummary.ewastePreventedTons.toFixed(1) })}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{t('environmental.reuseRate', { value: Math.round(envSummary.reuseRate * 100) })}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">{t('environmental.comparison')}</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>{t('environmental.newLaptop')}</span>
                          <span className="font-semibold">{envSummary.co2ProductionKg}kg CO₂</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('environmental.refurbishment')}</span>
                          <span className="font-semibold text-green-600">{envSummary.co2RefurbishmentKg}kg CO₂</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>{t('environmental.savings')}</span>
                          <span className="font-semibold text-green-600">{envSummary.co2PerDevice}kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Heading level={4} className="mb-3">{t('social.title')}</Heading>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{t('social.internshipSuccess', { value: Math.round(socialSummary.internshipSuccessRate * 100) })}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{t('social.careerReentries', { value: socialSummary.careerReentries })}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{t('social.peopleHelped', { value: getDefaultValue('people_helped_total') })}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">{t('social.successStories')}</h5>
                      <div className="space-y-3 text-sm">
                        <p>&ldquo;{t('social.testimonial')}&rdquo;</p>
                        <p className="text-gray-500">- {t('social.testimonialAuthor')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'economic' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Heading level={4} className="mb-3">{t('economic.title')}</Heading>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{t('economic.customerSavings', { value: getDefaultNumeric('customer_savings_chf') })}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{t('economic.smeOpenSource')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{t('economic.jobs', { value: getDefaultValue('team_size_community') })}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg">
                      <h5 className="font-semibold mb-3">{t('economic.economicImpact')}</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>{t('economic.avgRepairCost')}</span>
                          <span className="font-semibold">CHF {getDefaultNumeric('avg_repair_cost_chf')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('economic.newDevicePrice')}</span>
                          <span className="font-semibold">CHF {getDefaultNumeric('new_device_comparison_chf')}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>{t('economic.savingsPerCustomer')}</span>
                          <span className="font-semibold text-green-600">CHF {getDefaultNumeric('customer_savings_chf')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </SimpleTabs>
        </div>
      </section>

      {/* Donation Methods */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4">{t('donation.title')}</Heading>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('donation.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {donationMethods.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  method.popular ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => setSelectedDonationMethod(method.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method.icon}
                      <CardTitle className="text-xl">{method.name}</CardTitle>
                    </div>
                    {method.popular && (
                      <Badge className="bg-green-600 text-white">{t('donation.popular')}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">{method.description}</CardDescription>
                  {method.amount && (
                    <p className="text-sm font-medium text-green-600">{method.amount}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {method.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={method.popular ? "default" : "outline"}>
                    {method.ctaText}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Donation Impact Calculator */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center">{t('donation.impactCalculator')}</CardTitle>
              <CardDescription className="text-center">
                {t('donation.impactCalculatorDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_laptop_chf')}</p>
                  <p className="text-sm text-gray-600">{t('donation.laptopRepair')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_internship_chf')}</p>
                  <p className="text-sm text-gray-600">{t('donation.internshipMonth')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">CHF {getDefaultNumeric('donation_impact_data_recovery_chf')}</p>
                  <p className="text-sm text-gray-600">{t('donation.dataRecovery')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transparency & Reports */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Heading level={2} className="mb-4">{t('reports.title')}</Heading>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('reports.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {t('reports.annual.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {t('reports.annual.description')}
              </p>
              <Button variant="outline" className="w-full">
                {t('reports.annual.download')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('reports.impact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {t('reports.impact.description')}
              </p>
              <Button variant="outline" className="w-full">
                {t('reports.impact.view')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('reports.register.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {t('reports.register.description')}
              </p>
              <Button variant="outline" className="w-full">
                {t('reports.register.open')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Heading level={2} className="mb-6">{t('ctaDonate.title')}</Heading>
          <p className="text-xl mb-8">
            {t('ctaDonate.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              {t('ctaDonate.donate')}
              <Heart className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline-light">
              {t('ctaDonate.contact')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
