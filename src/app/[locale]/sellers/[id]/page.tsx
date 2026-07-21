import PublicProfile from '@/components/profile/PublicProfile'

// One person, one profile. /sellers/[id] and /members/[id] are URL aliases that
// render the same unified public profile (identity + everything they offer +
// reputation). The seller storefront is now the "Marktplatz" tab of that
// profile. See src/components/profile/PublicProfile.tsx.
export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PublicProfile params={params} />
}
