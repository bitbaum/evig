import Link from 'next/link'
import React from 'react'
import { Calendar, Clock, Users, ArrowRight, Sparkles, CheckCircle2, Briefcase, Rocket } from 'lucide-react'

export interface Workshop {
  title: string
  description: string
  icon: string
  duration: string
  level: string
  category: string
  isAvailable: boolean
  comingSoon?: boolean
  outcomes?: string[]
}

interface WorkshopCardProps {
  workshop: Workshop
  variant: 'available' | 'coming-soon'
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, variant }) => {
  const isAvailable = variant === 'available'
  const categoryColor = isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'

  return (
    <div className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
          {workshop.icon}
        </div>
        <div className="text-sm">
          <span className={`inline-block ${categoryColor} px-2 py-1 rounded-full text-xs font-medium mb-2`}>
            {workshop.category}
          </span>
          <div className="text-gray-500">
            <span className="block">{workshop.duration}</span>
            <span className="block">{workshop.level}</span>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-3 group-hover:text-green-600 transition-colors duration-300">
        {workshop.title}
      </h3>
      
      <p className="text-gray-600 mb-4 flex-grow">{workshop.description}</p>
      
      {workshop.outcomes && isAvailable && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 text-green-500 mr-2" />
            What You'll Achieve:
          </h4>
          <ul className="space-y-2">
            {workshop.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
        {isAvailable ? (
          <Link 
            href="/contact"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-1 transition-transform duration-300"
          >
            Start Learning
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        ) : (
          <button 
            className="inline-flex items-center text-gray-500 font-medium cursor-not-allowed"
            disabled
          >
            Coming Soon
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
        <span className="text-sm text-gray-500">
          {isAvailable ? 'Next session: Coming soon' : 'Stay tuned!'}
        </span>
      </div>
    </div>
  )
} 