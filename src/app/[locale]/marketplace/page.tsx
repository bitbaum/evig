// force-dynamic: prevents static pre-rendering which crashes on next-auth v5 beta + webpack
// due to React-null circular dep in SSR bundle during parallel static generation workers.
export const dynamic = 'force-dynamic'

import MarketplacePageClient from './MarketplacePageClient'
import { MissionStrip } from '@/components/commerce/MissionStrip'

export default function MarketplacePage() {
  // Server-rendered mission strip above the client-rendered marketplace.
  // Anchors the page as nonprofit-circular-economy rather than just
  // "second-hand listings" — shown above the fold so the framing lands
  // before the listings grid.
  return (
    <>
      <MissionStrip />
      <MarketplacePageClient />
    </>
  )
}
