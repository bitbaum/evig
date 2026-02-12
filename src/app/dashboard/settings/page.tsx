'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User, Bell, Shield, Globe, Mail, Smartphone,
  Lock, Eye, EyeOff, Save, Loader2, CheckCircle
} from 'lucide-react'

/**
 * User Settings Page
 * Allows users to manage their account preferences, notifications, and privacy settings
 */
export default function UserSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile')

  // Profile settings
  const [name, setName] = useState(session?.user?.name || '')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [phone, setPhone] = useState('')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [marketplaceUpdates, setMarketplaceUpdates] = useState(true)
  const [workshopReminders, setWorkshopReminders] = useState(true)

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public')
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)

    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated delay

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'notifications' as const, label: 'Benachrichtigungen', icon: Bell },
    { id: 'privacy' as const, label: 'Datenschutz', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
          <p className="mt-2 text-gray-600">
            Verwalte deine Account-Einstellungen, Benachrichtigungen und Datenschutz-Präferenzen
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Persönliche Informationen</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Dein Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="deine@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+41 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Passwort ändern</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Aus Sicherheitsgründen musst du dein aktuelles Passwort eingeben, um es zu ändern.
                </p>
                <button className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                  Passwort ändern
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Benachrichtigungskanäle</h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">E-Mail-Benachrichtigungen</div>
                        <div className="text-sm text-gray-500">Erhalte Updates per E-Mail</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">SMS-Benachrichtigungen</div>
                        <div className="text-sm text-gray-500">Erhalte wichtige Updates per SMS</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Was möchtest du erhalten?</h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Marketplace-Updates</div>
                      <div className="text-sm text-gray-500">Neue Nachrichten, Gebote und Verkäufe</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketplaceUpdates}
                      onChange={(e) => setMarketplaceUpdates(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Workshop-Erinnerungen</div>
                      <div className="text-sm text-gray-500">Erinnerungen für gebuchte Workshops</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={workshopReminders}
                      onChange={(e) => setWorkshopReminders(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profil-Sichtbarkeit</h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="visibility"
                      checked={profileVisibility === 'public'}
                      onChange={() => setProfileVisibility('public')}
                      className="h-4 w-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Öffentlich</div>
                      <div className="text-sm text-gray-500">Dein Profil ist für alle sichtbar</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="visibility"
                      checked={profileVisibility === 'private'}
                      onChange={() => setProfileVisibility('private')}
                      className="h-4 w-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Privat</div>
                      <div className="text-sm text-gray-500">Nur du kannst dein Profil sehen</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontaktinformationen anzeigen</h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">E-Mail-Adresse anzeigen</div>
                      <div className="text-sm text-gray-500">Andere Nutzer können deine E-Mail sehen</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Telefonnummer anzeigen</div>
                      <div className="text-sm text-gray-500">Andere Nutzer können deine Nummer sehen</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                      className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account löschen</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Wenn du deinen Account löschst, werden alle deine Daten unwiderruflich gelöscht.
                </p>
                <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Account löschen
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Einstellungen gespeichert</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Speichern
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
