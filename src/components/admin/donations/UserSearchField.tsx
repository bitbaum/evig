import { Search, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserResult } from './types'
import { adminInteractive } from '@/lib/admin-ui'

interface Props {
  selectedUser: UserResult | null
  userSearch: string
  userResults: UserResult[]
  searchingUsers: boolean
  onSearchChange: (value: string) => void
  onSelectUser: (user: UserResult) => void
  onClearUser: () => void
}

export function UserSearchField({
  selectedUser,
  userSearch,
  userResults,
  searchingUsers,
  onSearchChange,
  onSelectUser,
  onClearUser,
}: Props) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-secondary mb-1">
        Benutzer verknüpfen (optional)
      </label>
      {selectedUser ? (
        <div className="flex items-center gap-2 p-3 bg-action-muted border border-strong rounded-lg">
          <User className="w-5 h-5 text-action" />
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              {selectedUser.name || selectedUser.email}
            </div>
            {selectedUser.name && (
              <div className="text-xs text-text-tertiary">{selectedUser.email}</div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearUser}
            className="text-text-tertiary hover:text-text-secondary h-auto w-auto p-0 bg-transparent hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-text-tertiary" />
            <Input
              type="text"
              value={userSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              placeholder="Benutzer suchen (Name oder E-Mail)..."
            />
            {searchingUsers && (
              <div className="absolute right-3">
                <div className="w-4 h-4 border-2 border-default border-t-neutral-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
          {userResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-base border border rounded-lg shadow-xs max-h-48 overflow-y-auto">
              {userResults.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectUser(user)}
                  className={`w-full px-3 py-2 text-left ${adminInteractive.rowHover} flex items-center gap-2 h-auto rounded-none justify-start`}
                >
                  <User className="w-4 h-4 text-text-muted" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {user.name || user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-text-tertiary">{user.email}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-text-tertiary">
        Suche nach einem bestehenden Benutzer oder gib die Daten manuell ein.
      </p>
    </div>
  )
}
