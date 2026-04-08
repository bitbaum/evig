/**
 * Admin Media Library
 *
 * Manages uploaded images, videos, and documents.
 * Provides a gallery view for media management.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import {
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  ArrowLeft,
  Upload,
  FolderOpen,
  Search,
  Grid,
  List,
  Filter,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Medienbibliothek | RevampIT Admin',
  description: 'Bilder, Videos und Dokumente verwalten.',
}

export default async function AdminMediaPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/media')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
              Medienbibliothek
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bilder, Videos und Dokumente verwalten
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          <Upload className="w-5 h-5" />
          Hochladen
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bilder
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Videos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Dokumente
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Speicher
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0 MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Medien suchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Filter
              </span>
            </button>

            <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600">
                <Grid className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
          <Heading level={3} className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Noch keine Medien hochgeladen
          </Heading>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Laden Sie Bilder, Videos und Dokumente hoch, um sie in Ihren
            Blog-Artikeln und Seiten zu verwenden.
          </p>

          {/* Upload Area */}
          <div className="max-w-lg mx-auto">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-teal-500 dark:hover:border-teal-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="text-teal-600 dark:text-teal-400 font-medium">
                  Klicken zum Hochladen
                </span>{' '}
                oder Dateien hierher ziehen
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF, PDF, MP4 bis zu 50MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Formats Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="w-6 h-6 text-blue-600" />
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              Bilder
            </Heading>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            JPG, PNG, GIF, WebP, SVG
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Max. 10 MB pro Datei
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-6 h-6 text-purple-600" />
            <Heading level={3} className="font-medium text-purple-900 dark:text-purple-200">
              Videos
            </Heading>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            MP4, WebM, MOV
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Max. 50 MB pro Datei
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <Heading level={3} className="font-medium text-orange-900 dark:text-orange-200">
              Dokumente
            </Heading>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            PDF, DOC, DOCX, XLS, XLSX
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Max. 25 MB pro Datei
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-yellow-900 dark:text-yellow-200">
              In Entwicklung
            </Heading>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Die Medienbibliothek wird gerade entwickelt. Bald können Sie hier
              Bilder und Dokumente hochladen, organisieren und in Ihren Inhalten
              verwenden. Für Produktbilder nutzen Sie bitte weiterhin die
              Produkterfassung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
