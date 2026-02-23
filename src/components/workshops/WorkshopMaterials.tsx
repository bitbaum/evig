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
import { logger } from '@/lib/logger'

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
  const [materials, setMaterials] = useState<Material[]>([])
  const [accessLevel, setAccessLevel] = useState<string>('public')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`/api/workshops/${workshopSlug}/materials`)
        if (response.ok) {
          const data = await response.json()
          setMaterials(data.data.materials)
          setAccessLevel(data.data.accessLevel)
        } else {
          setError('Fehler beim Laden der Materialien')
        }
      } catch (err) {
        logger.error('Error fetching workshop materials', { error: err })
        setError('Netzwerkfehler')
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [workshopSlug])

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
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Keine Materialien verfügbar</p>
        {accessLevel === 'public' && (
          <p className="text-gray-500 text-xs mt-1">
            Melden Sie sich an, um auf weitere Materialien zuzugreifen
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {accessLevel !== 'public' && (
        <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
          <Unlock className="w-3 h-3" />
          <span>
            {accessLevel === 'attended'
              ? 'Vollständiger Zugang (Teilnehmer)'
              : 'Erweiterter Zugang (Angemeldet)'}
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
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
        >
          <div className={`p-2 rounded-lg ${
            material.material_type === 'pdf' ? 'bg-red-100 text-red-600' :
            material.material_type === 'video' ? 'bg-purple-100 text-purple-600' :
            material.material_type === 'archive' ? 'bg-yellow-100 text-yellow-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {getMaterialIcon(material.material_type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm truncate">
                {material.title}
              </span>
              {material.access_type !== 'public' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  material.access_type === 'attended'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {material.access_type === 'attended' ? 'Teilnehmer' : 'Angemeldet'}
                </span>
              )}
            </div>
            {material.description && (
              <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">
                {material.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
              <ExternalLink className="w-4 h-4 text-gray-400" />
            ) : (
              <Download className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
