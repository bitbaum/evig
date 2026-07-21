import PublicProfile from '@/components/profile/PublicProfile'

// One person, one profile. /members/[id] and /sellers/[id] are URL aliases that
// render the same unified public profile (identity + everything they offer +
// reputation). See src/components/profile/PublicProfile.tsx.
export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <PublicProfile params={params} />
}
