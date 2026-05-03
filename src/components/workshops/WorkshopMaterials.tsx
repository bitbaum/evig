'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Link as LinkIcon,
  Video,
  Archive,
  Download,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { WORKSHOP_MATERIAL_ACCESS_TYPE } from '@/config/workshop-registration-status'

interface Material {
  id: string
  title: string
  description: string | null
  material_type: string
  url: string
  file_size_bytes: number | null
  access_type: string
  created_at: string
}

interface WorkshopMaterialsProps {
  workshopSlug: string
}

export default function WorkshopMaterials({ workshopSlug }: WorkshopMaterialsProps) {
  const t = useTranslations('workshops.materials')
  const [materials, setMaterials] = useState<Material[]>([])
  const [accessLevel, setAccessLevel] = useState<string>(WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const result = await apiFetch<{ materials: Material[]; accessLevel: string }>(`/api/workshops/${workshopSlug}/materials`)
        if (result.success && result.data) {
          setMaterials(result.data.materials)
          setAccessLevel(result.data.accessLevel)
        } else {
          setError(result.error || t('error'))
        }
      } catch (err) {
        logger.error('Error fetching workshop materials', { error: err })
        setError(t('networkError'))
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [workshopSlug, t])

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'archive':
        return <Archive className="w-5 h-5" />
      case 'link':
      default:
        return <LinkIcon className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isExternalLink = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://')
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-error-500 text-sm">{error}</p>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-neutral-500 text-sm">{t('emptyTitle')}</p>
        {accessLevel === WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC && (
          <p className="text-neutral-500 text-xs mt-1">
            {t('loginHint')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {accessLevel !== WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC && (
        <div className="flex items-center gap-2 text-xs text-primary-600 mb-2">
          <Unlock className="w-3 h-3" />
          <span>
            {accessLevel === WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED
              ? t('accessAttended')
              : t('accessRegistered')}
          </span>
        </div>
      )}

      {materials.map((material) => (
        <a
          key={material.id}
          href={material.url}
          target={isExternalLink(material.url) ? '_blank' : undefined}
          rel={isExternalLink(material.url) ? 'noopener noreferrer' : undefined}
          download={!isExternalLink(material.url)}
          className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
        >
          <div className={`p-2 rounded-lg ${
            material.material_type === 'pdf' ? 'bg-error-100 text-error-600' :
            material.material_type === 'video' ? 'bg-purple-100 text-purple-600' :
            material.material_type === 'archive' ? 'bg-yellow-100 text-yellow-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {getMaterialIcon(material.material_type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 text-sm truncate">
                {material.title}
              </span>
              {material.access_type !== WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  material.access_type === WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {material.access_type === WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED ? t('badgeAttended') : t('badgeRegistered')}
                </span>
              )}
            </div>
            {material.description && (
              <p className="text-neutral-600 text-xs mt-0.5 line-clamp-1">
                {material.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
              <span className="uppercase">{material.material_type}</span>
              {material.file_size_bytes && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(material.file_size_bytes)}</span>
                </>
              )}
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {isExternalLink(material.url) ? (
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            ) : (
              <Download className="w-4 h-4 text-neutral-400" />
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
