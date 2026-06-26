import { APP_URL } from '@/config/urls'
import { ROUTES } from '@/config/routes'

export function publicVacancyUrl(slug: string): string {
  return `${APP_URL}${ROUTES.public.careerPosting(slug)}`
}
