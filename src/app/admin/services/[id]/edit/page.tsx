/**
 * Admin Service Edit Page
 *
 * Server component that fetches service data and passes to form.
 */

import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getAdminServiceById } from '@/lib/services'
import { ServiceForm } from '@/components/admin/ServiceForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const service = await getAdminServiceById(id)

  return {
    title: service
      ? `${service.name} bearbeiten | RevampIT Admin`
      : 'Dienstleistung bearbeiten | RevampIT Admin',
    description: 'Dienstleistung bearbeiten',
  }
}

export default async function AdminServiceEditPage({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/services')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'services')) {
    redirect('/admin')
  }

  const service = await getAdminServiceById(id)

  if (!service) {
    notFound()
  }

  // Transform DB format to form format
  const formData = {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description || '',
    category: service.category || 'general',
    durationMinutes: service.duration_minutes,
    priceCents: service.price_cents,
    requiresApproval: service.requires_approval,
    isActive: service.is_active,
    isBookable: service.is_bookable,
    isFeatured: service.is_featured,
    displayOrder: service.display_order,
    // Presentation fields
    iconName: service.icon_name || 'Wrench',
    heroTitle: service.hero_title || '',
    heroSubtitle: service.hero_subtitle || '',
    heroDescription: service.hero_description || '',
    features: service.features_json || [],
    process: service.process_json || [],
    pricingBase: service.pricing_base || '',
    pricingDetails: service.pricing_details || [],
    pricingMediaPrices: service.pricing_media_prices || null,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ServiceForm initialData={formData} isEdit />
    </div>
  )
}
