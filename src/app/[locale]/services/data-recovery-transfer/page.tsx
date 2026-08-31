import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

/**
 * Retired service — data recovery is technician work, and technicians are
 * found through IT-Hilfe. Redirect rather than 404: the URL is indexed and
 * the visitor still wants the same thing.
 */
export default async function RetiredDataRecoveryService() {
  const locale = await getLocale();
  redirect({ href: '/it-hilfe', locale });
}
