import { Search, User, X } from 'lucide-react'
import type { UserResult } from './types'

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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Benutzer verknüpfen (optional)
      </label>
      {selectedUser ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <User className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {selectedUser.name || selectedUser.email}
            </div>
            {selectedUser.name && (
              <div className="text-xs text-gray-500">{selectedUser.email}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClearUser}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Benutzer suchen (Name oder E-Mail)..."
            />
            {searchingUsers && (
              <div className="absolute right-3">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
          {userResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {userResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Suchen Sie nach einem bestehenden Benutzer oder geben Sie die Daten manuell ein.
      </p>
    </div>
  )
}
