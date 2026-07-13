'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { presentationComments } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'

/** Mark a presentation comment resolved / unresolved. Staff-only. */
export async function setCommentResolved(id: string, resolved: boolean) {
  await requireAnySection(['presentations', 'content'], 'presentations')
  await db.update(presentationComments).set({ resolved }).where(eq(presentationComments.id, id))
  revalidatePath('/admin/presentations/feedback')
}
