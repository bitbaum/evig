import { Metadata } from 'next'
import { Users } from 'lucide-react'
import ClaimForm from './ClaimForm'
import { getClaimInvite } from '@/lib/services/team-invites'
import { getTeamRoleColor } from '@/config/teams'

export const metadata: Metadata = { title: 'Einladung – RevampIT' }

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function ClaimInvitePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { email } = await searchParams
  const invite = await getClaimInvite(token)

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-raised p-4">
      <div className="w-full max-w-md bg-surface-base rounded-xl border p-6 sm:p-8">
        {!invite ? (
          <div className="text-center space-y-3">
            <h1 className="text-lg font-semibold text-text-primary">Einladung ungültig</h1>
            <p className="text-sm text-text-secondary">
              Dieser Einladungslink ist ungültig, abgelaufen oder wurde bereits verwendet. Bitte
              wende dich an dein Team, um einen neuen Link zu erhalten.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-text-primary">Willkommen bei RevampIT</h1>
              <p className="text-sm text-text-secondary mt-1">
                Du wurdest eingeladen, dein Konto zu übernehmen. Setze deinen Namen, deine E-Mail und
                ein Passwort — deine Teams bleiben erhalten.
              </p>
            </div>

            {invite.teams.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Deine Teams
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {invite.teams.map((t) => (
                    <li key={t.name} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-raised text-sm text-text-primary">
                      {t.name}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTeamRoleColor(t.role)}`}>
                        {t.roleLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ClaimForm token={token} suggestedName={invite.currentName} suggestedEmail={email ?? null} />
          </>
        )}
      </div>
    </main>
  )
}
