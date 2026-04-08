import { Metadata } from 'next'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

async function getRepairerMeta(id: string) {
  try {
    const result = await query<{ business_name: string | null; city: string }>(
      `SELECT business_name, city FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE id = $1`,
      [id]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const repairer = await getRepairerMeta(id)

  if (!repairer) {
    return { title: 'Reparateur nicht gefunden | RevampIT' }
  }

  const name = repairer.business_name || 'Reparateur'
  return {
    title: `${name} in ${repairer.city} | RevampIT`,
    description: `${name} — Profil, Bewertungen und Terminbuchung. Elektronik-Reparatur in ${repairer.city}.`,
    openGraph: {
      title: `${name} in ${repairer.city} | RevampIT`,
      description: `Profil und Bewertungen von ${name}. Buche einen Reparaturtermin in ${repairer.city}.`,
      type: 'profile',
    },
  }
}

export default function RepairerDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
