import { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  Eye,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react'
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Benutzer verwalten | RevampIT Admin',
  description: 'Benutzerkonten anzeigen und verwalten.',
}

export default function AdminUsersPage() {
  // Mock data - replace with actual database queries
  const users = [
    {
      id: '1',
      name: 'Hans Müller',
      email: 'hans.mueller@revamp-it.ch',
      role: ROLES.REVAMPIT_ADMIN,
      status: 'active',
      joinDate: '2023-01-15',
      lastLogin: '2024-12-10',
      location: 'Zürich',
      phone: '+41 44 123 45 67',
      ordersCount: 0,
      workshopsCount: 0
    },
    {
      id: '2',
      name: 'Anna Schmidt',
      email: 'anna.schmidt@revamp-it.ch',
      role: ROLES.REVAMPIT_EDITOR,
      status: 'active',
      joinDate: '2023-03-20',
      lastLogin: '2024-12-09',
      location: 'Basel',
      phone: '+41 61 234 56 78',
      ordersCount: 0,
      workshopsCount: 0
    },
    {
      id: '3',
      name: 'Max Mustermann',
      email: 'max@example.com',
      role: ROLES.SELLER,
      status: 'active',
      joinDate: '2024-06-10',
      lastLogin: '2024-12-08',
      location: 'Zürich',
      phone: '+41 44 345 67 89',
      ordersCount: 15,
      workshopsCount: 0
    },
    {
      id: '4',
      name: 'Lisa Weber',
      email: 'lisa@example.com',
      role: ROLES.CUSTOMER,
      status: 'active',
      joinDate: '2024-08-15',
      lastLogin: '2024-12-07',
      location: 'Luzern',
      phone: '+41 41 456 78 90',
      ordersCount: 8,
      workshopsCount: 3
    },
    {
      id: '5',
      name: 'Peter Fischer',
      email: 'peter@partner.ch',
      role: ROLES.PARTNER_ADMIN,
      status: 'active',
      joinDate: '2024-02-01',
      lastLogin: '2024-12-06',
      location: 'Bern',
      phone: '+41 31 567 89 01',
      ordersCount: 0,
      workshopsCount: 0
    }
  ]

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    revampitStaff: users.filter(u => u.email.endsWith('@revamp-it.ch')).length,
    sellers: users.filter(u => u.role === ROLES.SELLER).length,
    customers: users.filter(u => [ROLES.CUSTOMER, ROLES.PREMIUM_CUSTOMER, ROLES.VERIFIED_CUSTOMER].includes(u.role as typeof ROLES.CUSTOMER | typeof ROLES.PREMIUM_CUSTOMER | typeof ROLES.VERIFIED_CUSTOMER)).length
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case ROLES.REVAMPIT_SUPER_ADMIN:
      case ROLES.REVAMPIT_ADMIN:
        return <Crown className="w-4 h-4 text-purple-600" />
      case ROLES.REVAMPIT_EDITOR:
      case ROLES.REVAMPIT_SUPPORT:
        return <Shield className="w-4 h-4 text-blue-600" />
      case ROLES.SELLER:
        return <Users className="w-4 h-4 text-green-600" />
      default:
        return <UserCheck className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case ROLES.REVAMPIT_SUPER_ADMIN:
      case ROLES.REVAMPIT_ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case ROLES.REVAMPIT_EDITOR:
      case ROLES.REVAMPIT_SUPPORT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case ROLES.SELLER:
      case ROLES.REPAIRER:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case ROLES.PARTNER_ADMIN:
      case ROLES.PARTNER_STAFF:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Benutzer verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Benutzerkonten anzeigen, Rollen zuweisen und Aktivitäten überwachen
          </p>
        </div>
        <Link
          href="/admin/users/invite"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Users className="w-5 h-5" />
          Benutzer einladen
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Benutzer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktive Benutzer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">RevampIT Team</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.revampitStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sellers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kunden</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Benutzer suchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Alle Rollen</option>
              {Object.entries(ROLE_DISPLAY_NAMES).map(([role, name]) => (
                <option key={role} value={role}>{name}</option>
              ))}
            </select>
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="suspended">Gesperrt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Letzte Anmeldung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktivität
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] || user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {user.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(user.lastLogin).toLocaleDateString('de-CH')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.lastLogin).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.ordersCount} Bestellungen
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.workshopsCount} Workshops
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Benutzer
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Es wurden noch keine Benutzer registriert.
            </p>
          </div>
        )}
      </div>

      {/* Role Management Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Automatische Rollenzuweisung
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Benutzer mit @revamp-it.ch E-Mail-Adressen erhalten automatisch Administrator-Rollen.
              Andere Benutzer starten als Kunden und können sich für Seller- oder Service-Provider-Rollen bewerben.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/users/roles"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Rollen verwalten
              </Link>
              <Link
                href="/admin/users/invite"
                className="text-sm bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Team einladen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
