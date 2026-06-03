/**
 * Admin Project Detail — needs + contributions for one public project.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { projects, projectNeeds, projectContributions, users, taskProjects } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { ROUTES } from '@/config/routes'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Lightbulb, ExternalLink, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { NeedsPanel } from '@/components/admin/projects/NeedsPanel'
import { ContributionsPanel } from '@/components/admin/projects/ContributionsPanel'

type PageProps = { params: Promise<{ slug: string }> }

async function loadProject(slug: string) {
  const [p] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      isActive: projects.isActive,
      taskProjectId: projects.taskProjectId,
      taskProjectTitle: taskProjects.title,
    })
    .from(projects)
    .leftJoin(taskProjects, eq(taskProjects.id, projects.taskProjectId))
    .where(eq(projects.slug, slug))
  if (!p) return null

  const needs = await db
    .select()
    .from(projectNeeds)
    .where(eq(projectNeeds.projectId, p.id))
    .orderBy(asc(projectNeeds.sortOrder))

  const contributions = await db
    .select({
      id: projectContributions.id,
      needId: projectContributions.needId,
      name: projectContributions.name,
      email: projectContributions.email,
      phone: projectContributions.phone,
      organization: projectContributions.organization,
      message: projectContributions.message,
      status: projectContributions.status,
      internalNotes: projectContributions.internalNotes,
      respondedAt: projectContributions.respondedAt,
      respondedByName: users.name,
      createdAt: projectContributions.createdAt,
    })
    .from(projectContributions)
    .leftJoin(users, eq(users.id, projectContributions.respondedBy))
    .where(eq(projectContributions.projectId, p.id))
    .orderBy(desc(projectContributions.createdAt))

  return { project: p, needs, contributions }
}

export default async function AdminProjectDetail({ params }: PageProps) {
  const { slug } = await params
  const [data, t] = await Promise.all([
    loadProject(slug),
    getTranslations('admin.projects'),
  ])
  if (!data) notFound()
  const { project, needs, contributions } = data

  return (
    <AdminPageWrapper
      title={t('detailTitle', { slug: project.slug })}
      description={t('detailDescription')}
      icon={Lightbulb}
      iconColor="green"
      backButton={{ href: ROUTES.admin.projects, label: t('pageTitle') }}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className={cn(
              designPrimitive.buttonBase,
              designPrimitive.buttonSize.default,
              designPrimitive.button.outline,
              'gap-1.5 min-h-[40px]',
            )}
          >
            {t('publicPageLink')}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {project.taskProjectId && (
            <Link
              href={ROUTES.admin.taskProject(project.taskProjectId)}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.default,
                designPrimitive.button.outline,
                'gap-1.5 min-h-[40px]',
              )}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              {project.taskProjectTitle ?? t('fallbackTaskProjectLabel')}
            </Link>
          )}
        </div>
      }
    >
      <NeedsPanel slug={project.slug} initialNeeds={needs} />
      <ContributionsPanel slug={project.slug} initialContributions={contributions} needs={needs} />
    </AdminPageWrapper>
  )
}
