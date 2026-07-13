'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { siteSuggestions } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'

/** Mark a site-feedback item resolved / unresolved. Staff-only. */
export async function setSuggestionResolved(id: string, resolved: boolean) {
  await requireAnySection(['siteFeedback', 'content'], 'siteFeedback')
  await db.update(siteSuggestions).set({ resolved }).where(eq(siteSuggestions.id, id))
  revalidatePath('/admin/feedback')
}
