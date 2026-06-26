import { createNotification, notifyAllStaff } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { sendCustomEmail } from '@/lib/email'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import { APP_URL } from '@/config/urls'

export async function notifyStaffNewApplication(
  applicationId: string,
  applicantName: string,
  postingTitle: string,
  excludeUserId?: string,
) {
  await notifyAllStaff(
    {
      type: NOTIFICATION_TYPES.JOB_APPLICATION_RECEIVED,
      title: `Neue Bewerbung: ${postingTitle}`,
      content: `${applicantName} hat sich beworben.`,
      related_type: RELATED_TYPES.JOB_APPLICATION,
      related_id: applicationId,
    },
    excludeUserId,
  )
}

export async function notifyApplicantConfirmation(
  email: string,
  name: string,
  postingTitle: string,
) {
  await sendCustomEmail(email, {
    subject: `Bewerbung erhalten — ${postingTitle}`,
    html: `<p>Hallo ${name},</p><p>Danke für deine Bewerbung als «${postingTitle}» bei ${ORG.name}. Wir melden uns bei dir.</p><p>${ORG.name}</p>`,
    text: `Hallo ${name},\n\nDanke für deine Bewerbung als «${postingTitle}» bei ${ORG.name}.\n\n${ORG.name}`,
  })
}

export async function notifyApplicantStatusChange(
  userId: string | null,
  email: string,
  postingTitle: string,
  statusLabel: string,
  applicationId?: string,
) {
  if (userId) {
    await createNotification(userId, {
      type: NOTIFICATION_TYPES.JOB_APPLICATION_STATUS,
      title: `Bewerbung: ${statusLabel}`,
      content: `Deine Bewerbung für «${postingTitle}» — Status: ${statusLabel}.`,
      related_type: RELATED_TYPES.JOB_APPLICATION,
      related_id: applicationId,
    })
  } else {
    await sendCustomEmail(email, {
      subject: `Bewerbungsupdate — ${postingTitle}`,
      html: `<p>Status deiner Bewerbung für «${postingTitle}»: <strong>${statusLabel}</strong>.</p>`,
      text: `Status deiner Bewerbung für «${postingTitle}»: ${statusLabel}.`,
    })
  }
}

export function publicVacancyUrl(slug: string): string {
  return `${APP_URL}${ROUTES.public.careerPosting(slug)}`
}
