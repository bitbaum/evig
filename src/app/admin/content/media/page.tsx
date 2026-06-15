/**
 * Admin Media Library
 *
 * Manages uploaded images, videos, and documents.
 * Provides a gallery view for media management.
 */

import { Metadata } from 'next'
import { adminInteractive } from '@/lib/admin-ui'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import Heading from '@/components/admin/AdminHeading'
import { AdminHeroStatus } from '@/components/admin/AdminHeroStatus'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Medienbibliothek',
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
            href={ROUTES.admin.content}
            className={`p-2 ${adminInteractive.rowHover} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">
              Medienbibliothek
            </Heading>
            <p className="text-text-secondary mt-1">
              Bilder, Videos und Dokumente verwalten
            </p>
          </div>
        </div>
        <Button variant="primary">
          <Upload className="w-5 h-5" />
          Hochladen
        </Button>
      </div>

      {/*
        Media library is currently unimplemented — no DB-backed counts exist.
        Per CLAUDE.md "NEVER hardcode numbers/stats in UI", the previous 4
        hardcoded-zero stat cards are gone. Replaced with an honest empty-
        state hero pointing at the Upload primary action.
        When the library lands a real backend, swap this for an
        AdminStatsGrid wired to actual counts.
      */}
      <AdminHeroStatus
        tone="empty"
        icon={ImageIcon}
        headline="Medienbibliothek ist noch leer"
        sub="Lade Bilder, Videos oder Dokumente hoch, um sie in Inhalten zu verwenden."
        kpis={[]}
      />

      {/* Toolbar */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Medien suchen..."
              className="pl-10"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className={`flex items-center gap-2 px-3 py-2 border border rounded-lg ${adminInteractive.rowHover} transition-colors`}>
              <Filter className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">
                Filter
              </span>
            </Button>

            <div className="flex border border rounded-lg overflow-hidden">
              <Button variant="ghost" size="icon" className="p-2 bg-action-muted text-action">
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`p-2 ${adminInteractive.rowHover} text-text-secondary`}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle overflow-hidden">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-text-muted" />
          </div>
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Noch keine Medien hochgeladen
          </Heading>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Lade Bilder, Videos und Dokumente hoch, um sie in Ihren
            Blog-Artikeln und Seiten zu verwenden.
          </p>

          {/* Upload Area */}
          <div className="max-w-lg mx-auto">
            <div className="border-2 border-dashed border-default rounded-xl p-8 hover:border-action dark:hover:border-action transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-2">
                <span className="text-action font-medium">
                  Klicken zum Hochladen
                </span>{' '}
                oder Dateien hierher ziehen
              </p>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                PNG, JPG, GIF, PDF, MP4 bis zu 50MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Formats Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-surface-raised border border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="w-6 h-6 text-text-secondary" />
            <Heading level={3} className="font-medium text-text-primary">
              Bilder
            </Heading>
          </div>
          <p className="text-sm text-text-secondary">
            JPG, PNG, GIF, WebP, SVG
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Max. 10 MB pro Datei
          </p>
        </div>

        <div className="bg-action-muted border border-strong rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-6 h-6 text-action" />
            <Heading level={3} className="font-medium text-action">
              Videos
            </Heading>
          </div>
          <p className="text-sm text-action">
            MP4, WebM, MOV
          </p>
          <p className="text-xs text-action mt-1">
            Max. 50 MB pro Datei
          </p>
        </div>

        <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-secondary-600" />
            <Heading level={3} className="font-medium text-secondary-900 dark:text-secondary-200">
              Dokumente
            </Heading>
          </div>
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            PDF, DOC, DOCX, XLS, XLSX
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
            Max. 25 MB pro Datei
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-warning-900 dark:text-warning-200">
              In Entwicklung
            </Heading>
            <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
              Die Medienbibliothek wird gerade entwickelt. Bald kannst du hier
              Bilder und Dokumente hochladen, organisieren und in deinen Inhalten
              verwenden. Für Produktbilder nutze bitte weiterhin die
              Produkterfassung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
