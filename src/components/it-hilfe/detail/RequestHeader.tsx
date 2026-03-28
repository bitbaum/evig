import Image from 'next/image'
import { Wrench } from 'lucide-react'
import {
  getCategoryById,
  getUrgencyById,
  getRequestStatusById,
  getSkillById,
} from '@/config/it-hilfe'
import type { ITHilfeRequest } from './types'

interface RequestHeaderProps {
  request: ITHilfeRequest
}

export function RequestHeader({ request }: RequestHeaderProps) {
  const categoryConfig = getCategoryById(request.categoryId)
  const urgencyConfig = getUrgencyById(request.urgency)
  const statusConfig = getRequestStatusById(request.status)
  const CategoryIcon = categoryConfig?.icon || Wrench

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 ${categoryConfig?.color || 'bg-gray-500'} rounded-xl`}>
          <CategoryIcon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
              {statusConfig?.name || request.status}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-gray-100 text-gray-700'}`}>
              {urgencyConfig?.name || request.urgency}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        </div>
      </div>

      {/* Device info */}
      {(request.deviceBrand || request.deviceModel) && (
        <p className="text-gray-600 mb-4">
          <span className="font-medium">Gerät:</span>{' '}
          {[categoryConfig?.name, request.deviceBrand, request.deviceModel].filter(Boolean).join(' - ')}
        </p>
      )}

      {/* Description */}
      <div className="prose prose-gray max-w-none">
        <p className="whitespace-pre-wrap">{request.description}</p>
      </div>

      {/* Images */}
      {request.imageUrls.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {request.imageUrls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Image
                  src={url}
                  alt={`Bild ${index + 1}`}
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Skills needed */}
      {request.skillsNeeded.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Benötigte Skills</h3>
          <div className="flex flex-wrap gap-2">
            {request.skillsNeeded.map((skillId) => {
              const skill = getSkillById(skillId)
              return (
                <span
                  key={skillId}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {skill?.name || skillId}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
