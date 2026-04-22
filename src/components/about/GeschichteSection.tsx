/**
 * Geschichte (History) Section Component
 *
 * Displays RevampIT's founding story and timeline of milestones.
 * Uses warm, storytelling-focused design with visual timeline.
 */

import { Clock, Rocket, Award, TrendingUp, Users, Building } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import {
  HISTORY_CONFIG,
  type Milestone,
} from '@/data/history'

const getTypeIcon = (type: Milestone['type']) => {
  switch (type) {
    case 'founding':
      return <Rocket className="h-5 w-5" />
    case 'growth':
      return <TrendingUp className="h-5 w-5" />
    case 'achievement':
      return <Award className="h-5 w-5" />
    case 'expansion':
      return <Building className="h-5 w-5" />
    case 'community':
      return <Users className="h-5 w-5" />
  }
}

const getTypeColor = (type: Milestone['type']) => {
  switch (type) {
    case 'founding':
      return 'bg-amber-500'
    case 'growth':
      return 'bg-blue-500'
    case 'achievement':
      return 'bg-green-500'
    case 'expansion':
      return 'bg-purple-500'
    case 'community':
      return 'bg-rose-500'
  }
}

function TimelineItem({
  milestone,
  isLeft,
}: {
  milestone: Milestone
  isLeft: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Content Card */}
      <div
        className={`flex-1 ${isLeft ? 'md:text-right' : ''}`}
      >
        <div
          className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100
            ${milestone.highlight ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
        >
          <div
            className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}
          >
            <span
              className={`${getTypeColor(milestone.type)} text-white p-2 rounded-lg`}
            >
              {getTypeIcon(milestone.type)}
            </span>
            <div>
              <span className="text-sm font-medium text-gray-500">
                {milestone.year}
              </span>
              <Heading level={3} className="text-lg font-bold text-gray-900">
                {milestone.title}
              </Heading>
            </div>
          </div>
          <p className="text-gray-600">{milestone.description}</p>
        </div>
      </div>

      {/* Timeline Dot - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${
            milestone.highlight ? 'bg-green-500 ring-4 ring-green-200' : 'bg-gray-300'
          }`}
        />
      </div>

      {/* Spacer for alternating layout - Hidden on mobile */}
      <div className="hidden md:block flex-1" />
    </div>
  )
}

export default function GeschichteSection() {
  const { founding, milestones, currentState } = HISTORY_CONFIG

  return (
    <section className="py-20 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            Unsere Geschichte
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {founding.title}
          </Heading>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {founding.subtitle}
          </p>
        </div>

        {/* Founding Story */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="prose prose-lg max-w-none">
              {founding.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-600 mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="text-center mb-12">
          <Heading level={3} className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Meilensteine
          </Heading>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Von der kleinen Werkstatt zur führenden Organisation für nachhaltige IT
            in der Schweiz.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200" />

          {/* Timeline Items */}
          <div className="space-y-8 md:space-y-12">
            {milestones.map((milestone, index) => (
              <TimelineItem
                key={milestone.year}
                milestone={milestone}
                isLeft={index % 2 === 0}
              />
            ))}
          </div>
        </div>

        {/* Current State Summary */}
        <div className="mt-20 bg-green-600 rounded-2xl p-8 text-white text-center">
          <Heading level={3} className="text-2xl font-bold mb-6">Heute</Heading>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.yearsActive}</p>
              <p className="text-green-100">Jahre aktiv</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.teamSize}</p>
              <p className="text-green-100">Teammitglieder</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.devicesPerYear}</p>
              <p className="text-green-100">Geräte pro Jahr gerettet</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
