// Force runtime rendering — next-auth/react + lucide imports in AbosPageClient land in
// SSR bundles where Next.js 16 + next-auth v5 leave the vendored React module
// null during parallel static generation workers, causing hooks to throw.
export const dynamic = 'force-dynamic'

import AbosPageClient from './AbosPageClient'

export default function AbosPage() {
  return <AbosPageClient />
}
