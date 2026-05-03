/**
 * Open-Source Alternatives Registry - SSOT
 *
 * Comprehensive registry of open-source alternatives to proprietary software.
 * Types, display config, seed data (~60-80 alternatives), and helper functions.
 *
 * Adding a new alternative:
 *   1. Add ProprietaryApp entry (if not existing) to PROPRIETARY_APPS
 *   2. Add OSSAlternative entry to OSS_ALTERNATIVES
 *   3. Done — search, list, and detail pages update automatically
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Maturity = 'established' | 'growing' | 'emerging'
export type MigrationDifficulty = 'easy' | 'medium' | 'advanced'
export type Platform = 'windows' | 'macos' | 'linux' | 'web' | 'android' | 'ios'
export type PricingModel = 'subscription' | 'one-time' | 'freemium'

export interface OSSCategory {
  id: string
  label: string
  icon: string
  description: string
  order: number
}

export interface ProprietaryApp {
  id: string
  name: string
  categoryId: string
  pricingModel: PricingModel
  typicalCost?: string
}

export interface ReplacementInfo {
  appId: string
  migrationDifficulty: MigrationDifficulty
  compatibilityNote?: string
  migrationTips?: string[]
}

export interface OSSAlternative {
  id: string
  name: string
  tagline: string
  description: string
  categoryId: string
  website: string
  sourceCode?: string
  license: string
  platforms: Platform[]
  maturity: Maturity
  replaces: ReplacementInfo[]
  highlights: string[]
  limitations: string[]
  revampitServices?: {
    workshopSlug?: string
    itHilfeNote?: string
  }
}

// ---------------------------------------------------------------------------
// Display Config
// ---------------------------------------------------------------------------

export const MATURITY_CONFIG: Record<Maturity, { label: string; color: string }> = {
  established: { label: 'Etabliert', color: 'bg-primary-100 text-primary-800' },
  growing: { label: 'Wachsend', color: 'bg-blue-100 text-blue-800' },
  emerging: { label: 'Aufkommend', color: 'bg-warning-100 text-warning-800' },
}

export const MIGRATION_DIFFICULTY_CONFIG: Record<MigrationDifficulty, { label: string; color: string; description: string }> = {
  easy: { label: 'Einfach', color: 'bg-primary-100 text-primary-800', description: 'Direkter Umstieg, kaum Einarbeitung nötig' },
  medium: { label: 'Mittel', color: 'bg-warning-100 text-warning-800', description: 'Etwas Einarbeitung nötig, aber machbar' },
  advanced: { label: 'Anspruchsvoll', color: 'bg-error-100 text-error-800', description: 'Deutliche Unterschiede, Einarbeitung erforderlich' },
}

export const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string }> = {
  windows: { label: 'Windows', icon: '🪟' },
  macos: { label: 'macOS', icon: '🍎' },
  linux: { label: 'Linux', icon: '🐧' },
  web: { label: 'Web', icon: '🌐' },
  android: { label: 'Android', icon: '📱' },
  ios: { label: 'iOS', icon: '📱' },
}

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  subscription: 'Abo-Modell',
  'one-time': 'Einmalkauf',
  freemium: 'Freemium',
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const OSS_CATEGORIES: OSSCategory[] = [
  { id: 'office', label: 'Büro & Produktivität', icon: '📄', description: 'Textverarbeitung, Tabellen, Präsentationen und kollaboratives Arbeiten', order: 1 },
  { id: 'os', label: 'Betriebssysteme', icon: '🖥️', description: 'Desktop- und Server-Betriebssysteme als Windows-Alternative', order: 2 },
  { id: 'cloud', label: 'Cloud & Dateien', icon: '☁️', description: 'Dateisynchronisation, Cloud-Speicher und Backup-Lösungen', order: 3 },
  { id: 'communication', label: 'Kommunikation', icon: '💬', description: 'Chat, Videokonferenzen und Team-Zusammenarbeit', order: 4 },
  { id: 'graphics', label: 'Grafik & Design', icon: '🎨', description: 'Bildbearbeitung, Vektorgrafik und UI-Design', order: 5 },
  { id: 'video-audio', label: 'Video & Audio', icon: '🎬', description: 'Videobearbeitung, Streaming und Audiobearbeitung', order: 6 },
  { id: '3d', label: '3D & Animation', icon: '🧊', description: '3D-Modellierung, Animation und CAD', order: 7 },
  { id: 'browser', label: 'Webbrowser', icon: '🌍', description: 'Datenschutzfreundliche Browser-Alternativen', order: 8 },
  { id: 'security', label: 'Sicherheit & Privatsphäre', icon: '🔒', description: 'Passwort-Manager, Verschlüsselung und VPN', order: 9 },
  { id: 'development', label: 'Entwicklung', icon: '💻', description: 'Code-Editoren, Versionskontrolle und Dev-Tools', order: 10 },
  { id: 'ai', label: 'KI & Maschinelles Lernen', icon: '🤖', description: 'Lokale KI-Modelle und kreative KI-Werkzeuge', order: 11 },
  { id: 'email', label: 'E-Mail & Kalender', icon: '📧', description: 'E-Mail-Clients, Kalender und Groupware', order: 12 },
]

// ---------------------------------------------------------------------------
// Proprietary Apps
// ---------------------------------------------------------------------------

export const PROPRIETARY_APPS: ProprietaryApp[] = [
  // Office
  { id: 'ms-office', name: 'Microsoft Office', categoryId: 'office', pricingModel: 'subscription', typicalCost: 'CHF 99/Jahr' },
  { id: 'google-docs', name: 'Google Docs', categoryId: 'office', pricingModel: 'freemium' },
  { id: 'notion', name: 'Notion', categoryId: 'office', pricingModel: 'freemium', typicalCost: 'CHF 10/Monat' },

  // OS
  { id: 'windows', name: 'Microsoft Windows', categoryId: 'os', pricingModel: 'one-time', typicalCost: 'CHF 150-250' },
  { id: 'macos', name: 'macOS', categoryId: 'os', pricingModel: 'one-time' },

  // Cloud
  { id: 'google-drive', name: 'Google Drive', categoryId: 'cloud', pricingModel: 'freemium', typicalCost: 'CHF 30/Jahr (100 GB)' },
  { id: 'dropbox', name: 'Dropbox', categoryId: 'cloud', pricingModel: 'freemium', typicalCost: 'CHF 120/Jahr' },
  { id: 'icloud', name: 'iCloud', categoryId: 'cloud', pricingModel: 'subscription', typicalCost: 'CHF 12/Jahr (50 GB)' },
  { id: 'onedrive', name: 'OneDrive', categoryId: 'cloud', pricingModel: 'freemium' },

  // Communication
  { id: 'slack', name: 'Slack', categoryId: 'communication', pricingModel: 'freemium', typicalCost: 'CHF 8/Monat pro Person' },
  { id: 'ms-teams', name: 'Microsoft Teams', categoryId: 'communication', pricingModel: 'subscription' },
  { id: 'zoom', name: 'Zoom', categoryId: 'communication', pricingModel: 'freemium', typicalCost: 'CHF 160/Jahr' },
  { id: 'whatsapp', name: 'WhatsApp', categoryId: 'communication', pricingModel: 'freemium' },

  // Graphics
  { id: 'photoshop', name: 'Adobe Photoshop', categoryId: 'graphics', pricingModel: 'subscription', typicalCost: 'CHF 24/Monat' },
  { id: 'illustrator', name: 'Adobe Illustrator', categoryId: 'graphics', pricingModel: 'subscription', typicalCost: 'CHF 24/Monat' },
  { id: 'figma', name: 'Figma', categoryId: 'graphics', pricingModel: 'freemium', typicalCost: 'CHF 15/Monat' },
  { id: 'canva', name: 'Canva', categoryId: 'graphics', pricingModel: 'freemium', typicalCost: 'CHF 12/Monat' },
  { id: 'lightroom', name: 'Adobe Lightroom', categoryId: 'graphics', pricingModel: 'subscription', typicalCost: 'CHF 12/Monat' },

  // Video & Audio
  { id: 'premiere', name: 'Adobe Premiere Pro', categoryId: 'video-audio', pricingModel: 'subscription', typicalCost: 'CHF 24/Monat' },
  { id: 'final-cut', name: 'Final Cut Pro', categoryId: 'video-audio', pricingModel: 'one-time', typicalCost: 'CHF 350' },
  { id: 'obs-proprietary', name: 'Streamlabs', categoryId: 'video-audio', pricingModel: 'freemium' },
  { id: 'audition', name: 'Adobe Audition', categoryId: 'video-audio', pricingModel: 'subscription', typicalCost: 'CHF 24/Monat' },

  // 3D
  { id: 'maya', name: 'Autodesk Maya', categoryId: '3d', pricingModel: 'subscription', typicalCost: 'CHF 2\'300/Jahr' },
  { id: 'autocad', name: 'AutoCAD', categoryId: '3d', pricingModel: 'subscription', typicalCost: 'CHF 2\'400/Jahr' },
  { id: 'solidworks', name: 'SolidWorks', categoryId: '3d', pricingModel: 'subscription', typicalCost: 'CHF 4\'000/Jahr' },

  // Browser
  { id: 'chrome', name: 'Google Chrome', categoryId: 'browser', pricingModel: 'freemium' },
  { id: 'edge', name: 'Microsoft Edge', categoryId: 'browser', pricingModel: 'freemium' },

  // Security
  { id: 'lastpass', name: 'LastPass', categoryId: 'security', pricingModel: 'freemium', typicalCost: 'CHF 36/Jahr' },
  { id: '1password', name: '1Password', categoryId: 'security', pricingModel: 'subscription', typicalCost: 'CHF 36/Jahr' },
  { id: 'nordvpn', name: 'NordVPN', categoryId: 'security', pricingModel: 'subscription', typicalCost: 'CHF 60/Jahr' },

  // Development
  { id: 'vscode', name: 'Visual Studio Code', categoryId: 'development', pricingModel: 'freemium' },
  { id: 'github', name: 'GitHub', categoryId: 'development', pricingModel: 'freemium', typicalCost: 'CHF 4/Monat' },
  { id: 'postman', name: 'Postman', categoryId: 'development', pricingModel: 'freemium', typicalCost: 'CHF 14/Monat' },

  // AI
  { id: 'chatgpt', name: 'ChatGPT', categoryId: 'ai', pricingModel: 'freemium', typicalCost: 'CHF 20/Monat' },
  { id: 'midjourney', name: 'Midjourney', categoryId: 'ai', pricingModel: 'subscription', typicalCost: 'CHF 10/Monat' },
  { id: 'copilot', name: 'GitHub Copilot', categoryId: 'ai', pricingModel: 'subscription', typicalCost: 'CHF 10/Monat' },

  // Email
  { id: 'outlook', name: 'Microsoft Outlook', categoryId: 'email', pricingModel: 'subscription' },
  { id: 'gmail', name: 'Gmail', categoryId: 'email', pricingModel: 'freemium' },
]

// ---------------------------------------------------------------------------
// Open-Source Alternatives
// ---------------------------------------------------------------------------

export const OSS_ALTERNATIVES: OSSAlternative[] = [
  // ===== OFFICE & PRODUCTIVITY =====
  {
    id: 'libreoffice',
    name: 'LibreOffice',
    tagline: 'Die führende freie Office-Suite',
    description: 'LibreOffice bietet eine vollständige Office-Suite mit Textverarbeitung (Writer), Tabellenkalkulation (Calc), Präsentationen (Impress), Datenbanken (Base), Zeichnungen (Draw) und Formeln (Math). Entwickelt von einer globalen Community mit über 200 Millionen Nutzern weltweit.',
    categoryId: 'office',
    website: 'https://de.libreoffice.org',
    sourceCode: 'https://cgit.freedesktop.org/libreoffice',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'ms-office', migrationDifficulty: 'easy', compatibilityNote: 'Öffnet und speichert MS-Office-Formate (.docx, .xlsx, .pptx)', migrationTips: ['Dokumente einzeln testen', 'Makros müssen angepasst werden', 'Schriftarten installieren für perfekte Darstellung'] },
    ],
    highlights: ['Vollständige Office-Suite mit 6 Programmen', 'Exzellente MS-Office-Kompatibilität', 'Über 200 Millionen Nutzer weltweit', 'Kein Abo — einmal installieren, immer nutzen'],
    limitations: ['Zusammenarbeit in Echtzeit nur über Nextcloud/Collabora', 'Makro-Kompatibilität mit VBA nicht 100%', 'Modernere Oberfläche als früher, aber kein Ribbon-Design'],
    revampitServices: { itHilfeNote: 'Wir helfen bei der Installation und Migration von Microsoft Office' },
  },
  {
    id: 'onlyoffice',
    name: 'ONLYOFFICE',
    tagline: 'Office-Suite mit MS-Office-Oberfläche',
    description: 'ONLYOFFICE kombiniert eine vertraute Ribbon-Oberfläche mit leistungsstarker Echtzeit-Zusammenarbeit. Besonders stark in der MS-Office-Kompatibilität, da es OOXML nativ als Dateiformat verwendet.',
    categoryId: 'office',
    website: 'https://www.onlyoffice.com/de/',
    sourceCode: 'https://github.com/ONLYOFFICE',
    license: 'AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'web'],
    maturity: 'growing',
    replaces: [
      { appId: 'ms-office', migrationDifficulty: 'easy', compatibilityNote: 'Beste OOXML-Kompatibilität unter den Alternativen', migrationTips: ['Ribbon-Interface ist sehr ähnlich wie MS Office', 'Integriert sich mit Nextcloud'] },
      { appId: 'google-docs', migrationDifficulty: 'easy' },
    ],
    highlights: ['Vertraute Ribbon-Oberfläche wie MS Office', 'Echtzeit-Zusammenarbeit eingebaut', 'Beste OOXML-Kompatibilität', 'Integrierbar mit Nextcloud'],
    limitations: ['Weniger Funktionsumfang als LibreOffice für Power-User', 'Server-Version benötigt eigene Infrastruktur', 'Einige Funktionen nur in der Enterprise-Version'],
  },
  {
    id: 'cryptpad',
    name: 'CryptPad',
    tagline: 'Ende-zu-Ende-verschlüsselte Zusammenarbeit',
    description: 'CryptPad bietet kollaborative Dokumentbearbeitung mit voller Ende-zu-Ende-Verschlüsselung. Texte, Tabellen, Präsentationen, Whiteboards und mehr — alles verschlüsselt, sodass selbst der Server-Betreiber die Inhalte nicht lesen kann.',
    categoryId: 'office',
    website: 'https://cryptpad.org',
    sourceCode: 'https://github.com/cryptpad/cryptpad',
    license: 'AGPL v3',
    platforms: ['web'],
    maturity: 'growing',
    replaces: [
      { appId: 'google-docs', migrationDifficulty: 'easy', compatibilityNote: 'Browser-basiert wie Google Docs', migrationTips: ['Konto erstellen auf cryptpad.fr oder eigene Instanz', 'Dokumente manuell importieren'] },
      { appId: 'notion', migrationDifficulty: 'medium' },
    ],
    highlights: ['Ende-zu-Ende-verschlüsselt', 'Echtzeit-Zusammenarbeit', 'Kein Konto für schnelle Zusammenarbeit nötig', 'DSGVO-konform — Server in Frankreich'],
    limitations: ['Keine Desktop-App, nur im Browser', 'Import/Export-Optionen begrenzt', 'Weniger Funktionen als klassische Office-Suiten'],
  },

  // ===== OPERATING SYSTEMS =====
  {
    id: 'linux-mint',
    name: 'Linux Mint',
    tagline: 'Die benutzerfreundlichste Linux-Distribution',
    description: 'Linux Mint ist das ideale Einsteiger-Linux: eine vertraute Desktop-Oberfläche, die Windows-Umsteigern sofort vertraut vorkommt. Alles funktioniert direkt nach der Installation — Browser, Office, Mediaplayer. Stabil, sicher und schnell, auch auf älterer Hardware.',
    categoryId: 'os',
    website: 'https://linuxmint.com',
    sourceCode: 'https://github.com/linuxmint',
    license: 'GPL v2',
    platforms: ['linux'],
    maturity: 'established',
    replaces: [
      { appId: 'windows', migrationDifficulty: 'medium', compatibilityNote: 'Windows-Programme über Wine/Proton teilweise nutzbar', migrationTips: ['Erst als Dual-Boot testen', 'Wichtige Daten vorher sichern', 'Software-Alternativen vorab prüfen'] },
    ],
    highlights: ['Vertraute Oberfläche für Windows-Umsteiger', 'Läuft auch auf älterer Hardware schnell', 'Alle nötigen Programme vorinstalliert', 'Riesige Software-Bibliothek über Paketmanager', 'Langzeit-Support (5 Jahre)'],
    limitations: ['Nicht alle Windows-Programme verfügbar', 'Manche Hardware-Treiber brauchen Nacharbeit', 'Gaming eingeschränkt (verbessert sich durch Steam/Proton)'],
    revampitServices: { itHilfeNote: 'Wir installieren Linux auf Ihrem Gerät und helfen beim Umstieg', workshopSlug: 'linux-basics' },
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    tagline: 'Die populärste Linux-Distribution',
    description: 'Ubuntu ist die am weitesten verbreitete Linux-Distribution mit professionellem Support von Canonical. Ideal für Einsteiger und Profis gleichermassen, mit grosser Community und umfangreicher Dokumentation.',
    categoryId: 'os',
    website: 'https://ubuntu.com',
    sourceCode: 'https://launchpad.net/ubuntu',
    license: 'GPL v2+',
    platforms: ['linux'],
    maturity: 'established',
    replaces: [
      { appId: 'windows', migrationDifficulty: 'medium', compatibilityNote: 'Snap-Pakete vereinfachen Software-Installation', migrationTips: ['Ubuntu Desktop wählen, nicht Server', 'LTS-Version für Stabilität'] },
    ],
    highlights: ['Grösste Linux-Community und Support-Basis', 'Professioneller Support von Canonical verfügbar', 'LTS-Versionen mit 5 Jahren Support', 'Riesiges Software-Angebot'],
    limitations: ['Snap-System ist umstritten (langsamer Start)', 'Telemetrie standardmässig aktiviert (abschaltbar)', 'Hoher Ressourcenverbrauch im Vergleich zu leichteren Distros'],
    revampitServices: { itHilfeNote: 'Wir installieren Ubuntu auf Ihrem Gerät' },
  },
  {
    id: 'fedora',
    name: 'Fedora',
    tagline: 'Innovative Linux-Distribution mit neuester Technologie',
    description: 'Fedora ist die führende Linux-Distribution für Technologie-Enthusiasten und Entwickler. Sie bietet stets die neueste Software und dient als Grundlage für Red Hat Enterprise Linux.',
    categoryId: 'os',
    website: 'https://fedoraproject.org',
    sourceCode: 'https://src.fedoraproject.org',
    license: 'Verschiedene FOSS-Lizenzen',
    platforms: ['linux'],
    maturity: 'established',
    replaces: [
      { appId: 'windows', migrationDifficulty: 'advanced', migrationTips: ['Eher für technikaffine Nutzer', 'Kürzerer Release-Zyklus als Ubuntu LTS'] },
      { appId: 'macos', migrationDifficulty: 'advanced' },
    ],
    highlights: ['Immer die neueste Software', 'Starker Fokus auf Sicherheit', 'Flatpak nativ integriert', 'Basis für Red Hat Enterprise Linux'],
    limitations: ['Kurzer Support-Zyklus (ca. 13 Monate)', 'Weniger anfängerfreundlich als Mint/Ubuntu', 'Multimedia-Codecs müssen nachinstalliert werden'],
  },

  // ===== CLOUD & FILES =====
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'Die selbstgehostete Cloud-Plattform',
    description: 'Nextcloud ist die führende selbstgehostete Cloud-Lösung: Dateisynchronisation, Kalender, Kontakte, E-Mail, Videokonferenzen, Office-Integration und hunderte Apps. Volle Kontrolle über deine Daten auf Ihrem eigenen Server.',
    categoryId: 'cloud',
    website: 'https://nextcloud.com',
    sourceCode: 'https://github.com/nextcloud',
    license: 'AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'web', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'google-drive', migrationDifficulty: 'medium', compatibilityNote: 'Dateien per Desktop-Client synchronisieren', migrationTips: ['Managed Hosting bei einem Schweizer Anbieter nutzen', 'Nextcloud Office (Collabora) für Dokumentbearbeitung aktivieren'] },
      { appId: 'dropbox', migrationDifficulty: 'easy', migrationTips: ['Desktop-Client funktioniert ähnlich wie Dropbox'] },
      { appId: 'onedrive', migrationDifficulty: 'medium' },
      { appId: 'icloud', migrationDifficulty: 'medium' },
    ],
    highlights: ['Komplette Cloud-Plattform (Dateien, Kalender, Kontakte, Office)', 'Volle Datenkontrolle — deine Daten bleiben bei dir', 'Hunderte Erweiterungen verfügbar', 'Schweizer Hosting-Anbieter verfügbar', 'DSGVO-konform'],
    limitations: ['Self-Hosting braucht technisches Know-how oder Managed-Dienst', 'Performance bei vielen Nutzern erfordert gute Hardware', 'Mobile Apps weniger poliert als Dropbox'],
    revampitServices: { itHilfeNote: 'Wir richten Nextcloud für dich ein und helfen bei der Migration' },
  },
  {
    id: 'syncthing',
    name: 'Syncthing',
    tagline: 'Dezentrale Dateisynchronisation ohne Cloud',
    description: 'Syncthing synchronisiert Dateien direkt zwischen Ihren Geräten — ohne zentralen Server, ohne Cloud, ohne Konto. Alles verschlüsselt, alles unter Ihrer Kontrolle.',
    categoryId: 'cloud',
    website: 'https://syncthing.net',
    sourceCode: 'https://github.com/syncthing/syncthing',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux', 'android'],
    maturity: 'established',
    replaces: [
      { appId: 'dropbox', migrationDifficulty: 'medium', compatibilityNote: 'Direkte Gerät-zu-Gerät-Synchronisation', migrationTips: ['Auf allen Geräten installieren', 'Ordner zum Teilen freigeben', 'Kein Cloud-Speicher — Geräte müssen gleichzeitig online sein'] },
      { appId: 'google-drive', migrationDifficulty: 'medium' },
    ],
    highlights: ['Keine Cloud nötig — direkte Synchronisation', 'Vollständig verschlüsselt', 'Kein Konto erforderlich', 'Läuft auf NAS, Raspberry Pi, etc.'],
    limitations: ['Kein Cloud-Speicher — mindestens ein Gerät muss online sein', 'Keine Web-Oberfläche für Dateizugriff', 'Teilen mit externen Personen nicht direkt möglich', 'Keine iOS-App'],
  },

  // ===== COMMUNICATION =====
  {
    id: 'element',
    name: 'Element',
    tagline: 'Sichere Kommunikation über das Matrix-Protokoll',
    description: 'Element ist der führende Client für das dezentrale Matrix-Netzwerk. Ende-zu-Ende-verschlüsselter Chat, Sprach- und Videoanrufe, Dateifreigabe und Integrationen — alles unter Ihrer Kontrolle.',
    categoryId: 'communication',
    website: 'https://element.io',
    sourceCode: 'https://github.com/element-hq',
    license: 'AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'web', 'android', 'ios'],
    maturity: 'growing',
    replaces: [
      { appId: 'slack', migrationDifficulty: 'medium', compatibilityNote: 'Räume und Spaces ähnlich wie Slack-Channels', migrationTips: ['Eigenen Matrix-Server oder matrix.org nutzen', 'Bridges für Slack/Teams/Telegram verfügbar'] },
      { appId: 'ms-teams', migrationDifficulty: 'advanced' },
    ],
    highlights: ['Ende-zu-Ende-verschlüsselt', 'Dezentral — kein einzelner Anbieter kontrolliert alles', 'Bridges zu Slack, Teams, Telegram, WhatsApp', 'Selbst hostbar'],
    limitations: ['Weniger polierte Oberfläche als Slack/Teams', 'Bridges können instabil sein', 'Verschlüsselungs-Setup kann Nutzer verwirren'],
  },
  {
    id: 'signal',
    name: 'Signal',
    tagline: 'Gold-Standard für verschlüsselte Nachrichten',
    description: 'Signal bietet kompromisslose Ende-zu-Ende-Verschlüsselung für Nachrichten, Sprach- und Videoanrufe. Empfohlen von Sicherheitsexperten weltweit, entwickelt von einer gemeinnützigen Stiftung.',
    categoryId: 'communication',
    website: 'https://signal.org',
    sourceCode: 'https://github.com/signalapp',
    license: 'AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'whatsapp', migrationDifficulty: 'easy', compatibilityNote: 'Gleiche Grundfunktionen, besserer Datenschutz', migrationTips: ['App installieren, Nummer verifizieren', 'Kontakte einladen', 'Gruppen neu erstellen (kein Import)'] },
    ],
    highlights: ['Stärkste Verschlüsselung auf dem Markt', 'Keine Metadaten-Sammlung', 'Gemeinnützige Stiftung, kein Gewinninteresse', 'Einfach zu bedienen wie WhatsApp'],
    limitations: ['Telefonnummer als ID erforderlich', 'Weniger Funktionen als WhatsApp (keine Channels)', 'Kleinere Nutzerbasis — Kontakte müssen wechseln'],
  },
  {
    id: 'jitsi',
    name: 'Jitsi Meet',
    tagline: 'Videokonferenzen ohne Konto und Installation',
    description: 'Jitsi Meet ermöglicht Videokonferenzen direkt im Browser — kein Konto nötig, kein Download, kein Limit. Einfach einen Link teilen und loslegen. Kann auch selbst gehostet werden.',
    categoryId: 'communication',
    website: 'https://jitsi.org',
    sourceCode: 'https://github.com/jitsi',
    license: 'Apache 2.0',
    platforms: ['web', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'zoom', migrationDifficulty: 'easy', compatibilityNote: 'Funktioniert direkt im Browser', migrationTips: ['meet.jit.si nutzen oder eigene Instanz aufsetzen', 'Einfach Link teilen — fertig'] },
      { appId: 'ms-teams', migrationDifficulty: 'easy' },
    ],
    highlights: ['Kein Konto oder Download nötig', 'Komplett kostenlos und unbegrenzt', 'Selbst hostbar für volle Kontrolle', 'Bildschirmfreigabe und Aufzeichnung'],
    limitations: ['Qualität bei grossen Gruppen (50+) kann nachlassen', 'Weniger Integrations-Ökosystem als Zoom/Teams', 'Recording-Funktion braucht Jibri-Server'],
    revampitServices: { itHilfeNote: 'Wir helfen beim Einrichten eines eigenen Jitsi-Servers' },
  },
  {
    id: 'mattermost',
    name: 'Mattermost',
    tagline: 'Selbstgehostete Slack-Alternative für Teams',
    description: 'Mattermost ist eine leistungsstarke Team-Messaging-Plattform, die auf dem eigenen Server läuft. Channels, Threads, Integrationen, Bots — alles, was Teams brauchen, unter eigener Kontrolle.',
    categoryId: 'communication',
    website: 'https://mattermost.com',
    sourceCode: 'https://github.com/mattermost',
    license: 'MIT + AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'web', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'slack', migrationDifficulty: 'easy', compatibilityNote: 'Slack-Import-Tool vorhanden', migrationTips: ['Slack-Export importieren', 'Webhooks und Bots sind kompatibel', 'Oberfläche ist Slack sehr ähnlich'] },
      { appId: 'ms-teams', migrationDifficulty: 'medium' },
    ],
    highlights: ['Selbst hostbar — volle Datenkontrolle', 'Slack-kompatible Webhooks und Integrationen', 'Slack-Import-Tool', 'Enterprise-ready mit Compliance-Funktionen'],
    limitations: ['Self-Hosting braucht Server-Administration', 'Einige Funktionen nur in der Enterprise-Version', 'Kleineres Plugin-Ökosystem als Slack'],
  },

  // ===== GRAPHICS & DESIGN =====
  {
    id: 'gimp',
    name: 'GIMP',
    tagline: 'Professionelle Bildbearbeitung seit 1996',
    description: 'GIMP (GNU Image Manipulation Program) ist der Veteran der freien Bildbearbeitung. Ebenen, Masken, Filter, Plugins — alles vorhanden für professionelle Fotobearbeitung und Grafikgestaltung.',
    categoryId: 'graphics',
    website: 'https://www.gimp.org',
    sourceCode: 'https://gitlab.gnome.org/GNOME/gimp',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'photoshop', migrationDifficulty: 'advanced', compatibilityNote: 'Öffnet PSD-Dateien (mit Einschränkungen)', migrationTips: ['PhotoGIMP-Plugin installiert Photoshop-ähnliche Tastenkürzel', 'Oberfläche auf Einzelfenster umstellen', 'Python-Fu und Script-Fu statt Photoshop-Aktionen'] },
    ],
    highlights: ['Leistungsstarke Bildbearbeitung ohne Abo', 'PSD-Kompatibilität', 'Riesiges Plugin-Ökosystem', 'Skriptbar für Batch-Verarbeitung'],
    limitations: ['Andere Oberfläche als Photoshop (gewöhnungsbedürftig)', 'Kein CMYK-Workflow (nur über Separate+Plugin)', 'Keine nicht-destruktive Bearbeitung (kommt in GIMP 3)'],
    revampitServices: { itHilfeNote: 'Wir helfen bei der Einrichtung und zeigen die wichtigsten Funktionen' },
  },
  {
    id: 'inkscape',
    name: 'Inkscape',
    tagline: 'Professionelle Vektorgrafik für alle',
    description: 'Inkscape ist der führende freie Vektorgrafikeditor. SVG-nativ, mit mächtigen Werkzeugen für Illustration, Logos, Diagramme, Karten und technische Zeichnungen.',
    categoryId: 'graphics',
    website: 'https://inkscape.org',
    sourceCode: 'https://gitlab.com/inkscape/inkscape',
    license: 'GPL v2+',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'illustrator', migrationDifficulty: 'medium', compatibilityNote: 'Importiert AI-Dateien (mit Einschränkungen), SVG-nativ', migrationTips: ['SVG als Austauschformat nutzen', 'Tastenkürzel-Unterschiede beachten'] },
    ],
    highlights: ['SVG als natives Dateiformat — zukunftssicher', 'Starke Pfadbearbeitung und Kalligrafie-Werkzeuge', 'Erweiterbar durch Python-Plugins', 'Grosse Community und viele Tutorials'],
    limitations: ['Keine CMYK-Unterstützung für Druckvorstufe', 'Performance bei sehr komplexen Zeichnungen', 'Weniger Funktionen für Print-Design als Illustrator'],
  },
  {
    id: 'krita',
    name: 'Krita',
    tagline: 'Digitales Malen und Illustrieren',
    description: 'Krita ist spezialisiert auf digitales Malen und Illustration. Mit über 100 Pinseln, Animationswerkzeugen und Grafiktablett-Unterstützung ist es die erste Wahl für Künstler und Illustratoren.',
    categoryId: 'graphics',
    website: 'https://krita.org',
    sourceCode: 'https://invent.kde.org/graphics/krita',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'photoshop', migrationDifficulty: 'medium', compatibilityNote: 'Stärker in Illustration/Malen als in Fotobearbeitung', migrationTips: ['Ideal als Ergänzung zu GIMP', 'Hervorragende Grafiktablett-Unterstützung', 'PSD-Kompatibilität vorhanden'] },
    ],
    highlights: ['Über 100 professionelle Pinsel', 'Hervorragende Grafiktablett-Unterstützung', 'Eingebaute Animation', 'PSD-Kompatibilität'],
    limitations: ['Schwächer in Fotobearbeitung als GIMP', 'Keine Vektor-Werkzeuge wie Inkscape', 'RAM-intensiv bei grossen Leinwänden'],
  },
  {
    id: 'penpot',
    name: 'Penpot',
    tagline: 'Open-Source UI-Design und Prototyping',
    description: 'Penpot ist die erste wirklich offene Design-Plattform. Browser-basiert, selbst hostbar, SVG-nativ. Für UI-Design, Prototyping und Design-Systeme — mit Echtzeit-Zusammenarbeit.',
    categoryId: 'graphics',
    website: 'https://penpot.app',
    sourceCode: 'https://github.com/penpot/penpot',
    license: 'MPL 2.0',
    platforms: ['web'],
    maturity: 'growing',
    replaces: [
      { appId: 'figma', migrationDifficulty: 'medium', compatibilityNote: 'SVG-basiert statt proprietärem Format', migrationTips: ['Figma-Import-Plugin verfügbar', 'SVG-natives Format erleichtert Entwickler-Übergabe'] },
    ],
    highlights: ['Echtzeit-Zusammenarbeit wie Figma', 'SVG-nativ — kein proprietäres Format', 'Selbst hostbar für volle Kontrolle', 'Figma-Import verfügbar'],
    limitations: ['Weniger Plugins als Figma', 'Performance bei sehr grossen Projekten', 'Kleinere Community als Figma'],
  },
  {
    id: 'darktable',
    name: 'darktable',
    tagline: 'RAW-Fotografie-Workflow und Bildverwaltung',
    description: 'darktable ist eine professionelle Fotografie-Anwendung: RAW-Entwicklung, nicht-destruktive Bearbeitung, Bildverwaltung und umfangreiche Export-Optionen. Der virtuelle Leuchttisch und die Dunkelkammer für digitale Fotografen.',
    categoryId: 'graphics',
    website: 'https://www.darktable.org',
    sourceCode: 'https://github.com/darktable-org/darktable',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'lightroom', migrationDifficulty: 'medium', compatibilityNote: 'Ähnlicher Workflow wie Lightroom', migrationTips: ['Katalog manuell importieren', 'Nicht-destruktive Bearbeitung wie Lightroom', 'Stärkere Maskierungswerkzeuge'] },
    ],
    highlights: ['Nicht-destruktive RAW-Bearbeitung', 'Unterstützt über 600 Kamera-RAW-Formate', 'Leistungsstarke Maskierung und Module', 'Bildverwaltung mit Tags und Sammlungen'],
    limitations: ['Steilere Lernkurve als Lightroom', 'Keine Cloud-Synchronisation', 'Weniger intuitive Oberfläche für Einsteiger'],
  },

  // ===== VIDEO & AUDIO =====
  {
    id: 'kdenlive',
    name: 'Kdenlive',
    tagline: 'Professioneller Videoschnitt unter Linux und mehr',
    description: 'Kdenlive ist ein leistungsstarker Videoeditor mit Multi-Track-Timeline, Hunderten von Effekten, Titeln, Übergängen und Proxy-Editing für flüssiges Arbeiten auch mit 4K-Material.',
    categoryId: 'video-audio',
    website: 'https://kdenlive.org',
    sourceCode: 'https://invent.kde.org/multimedia/kdenlive',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'premiere', migrationDifficulty: 'medium', compatibilityNote: 'Multi-Track-Editor mit professionellen Funktionen', migrationTips: ['Proxy-Editing für 4K aktivieren', 'Keyboard-Shortcuts anpassbar'] },
      { appId: 'final-cut', migrationDifficulty: 'medium' },
    ],
    highlights: ['Multi-Track-Editing mit Hunderten Effekten', 'Proxy-Editing für flüssiges 4K-Arbeiten', 'Keyframe-Animation', 'Aktive Entwicklung und Community'],
    limitations: ['Gelegentliche Stabilitätsprobleme', 'Weniger Effekte als Premiere Pro', 'Keine Team-Collaboration-Funktionen'],
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    tagline: 'Der Standard für Streaming und Aufnahme',
    description: 'OBS Studio ist der De-facto-Standard für Live-Streaming und Bildschirmaufnahme. Genutzt von Millionen von Streamern, YouTubern und Unternehmen für professionelle Live-Produktionen.',
    categoryId: 'video-audio',
    website: 'https://obsproject.com',
    sourceCode: 'https://github.com/obsproject/obs-studio',
    license: 'GPL v2',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'obs-proprietary', migrationDifficulty: 'easy', migrationTips: ['Szenen und Quellen flexibel konfigurieren', 'Plugin-Ökosystem für Erweiterungen'] },
    ],
    highlights: ['Industrie-Standard für Streaming', 'Szenen-System für komplexe Setups', 'Plugin-Ökosystem', 'Unterstützt alle gängigen Streaming-Plattformen'],
    limitations: ['Steilere Lernkurve für Anfänger', 'Kein eingebauter Videoeditor', 'Ressourcenintensiv bei hoher Qualität'],
  },
  {
    id: 'audacity',
    name: 'Audacity',
    tagline: 'Der meistgenutzte freie Audioeditor',
    description: 'Audacity ist ein leistungsstarker Audioeditor für Aufnahme, Bearbeitung und Mischung. Ideal für Podcasts, Musikproduktion, Audio-Restauration und Sprachaufnahmen.',
    categoryId: 'video-audio',
    website: 'https://www.audacityteam.org',
    sourceCode: 'https://github.com/audacity/audacity',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'audition', migrationDifficulty: 'easy', compatibilityNote: 'Ähnliche Grundfunktionen', migrationTips: ['Plugin-Schnittstelle für VST/AU', 'Effektketten für Batch-Verarbeitung'] },
    ],
    highlights: ['Einfach zu erlernen', 'VST-Plugin-Unterstützung', 'Rauschunterdrückung und Audio-Restauration', 'Multitrack-Aufnahme und -Bearbeitung'],
    limitations: ['Destruktive Bearbeitung (kein nicht-destruktiver Workflow)', 'Veraltete Oberfläche', 'Keine MIDI-Unterstützung'],
  },
  {
    id: 'shotcut',
    name: 'Shotcut',
    tagline: 'Plattformübergreifender Videoeditor',
    description: 'Shotcut ist ein benutzerfreundlicher Videoeditor mit breiter Format-Unterstützung dank FFmpeg. Timeline-Editing, Filter, Übergänge und Hardware-Beschleunigung.',
    categoryId: 'video-audio',
    website: 'https://shotcut.org',
    sourceCode: 'https://github.com/mltframework/shotcut',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'premiere', migrationDifficulty: 'easy', compatibilityNote: 'Einfacherer Editor für grundlegende Schnittarbeit' },
      { appId: 'final-cut', migrationDifficulty: 'easy' },
    ],
    highlights: ['Breite Format-Unterstützung (FFmpeg)', 'Intuitive Oberfläche', 'Hardware-beschleunigte Kodierung', 'Kein Import nötig — direkt vom Dateisystem'],
    limitations: ['Weniger Effekte als Kdenlive/Premiere', 'Kein Motion-Tracking', 'Gelegentlich unpoliert in der Bedienung'],
  },

  // ===== 3D & ANIMATION =====
  {
    id: 'blender',
    name: 'Blender',
    tagline: 'Professionelle 3D-Suite — komplett kostenlos',
    description: 'Blender ist eine vollständige 3D-Produktionssuite: Modellierung, Sculpting, Animation, Simulation, Rendering, Compositing, Video-Editing und Motion Tracking. Genutzt von Indie-Künstlern bis zu grossen Studios.',
    categoryId: '3d',
    website: 'https://www.blender.org',
    sourceCode: 'https://projects.blender.org/blender/blender',
    license: 'GPL v2+',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'maya', migrationDifficulty: 'advanced', compatibilityNote: 'Vollständige 3D-Suite als Alternative', migrationTips: ['Tutorials auf blender.org nutzen', 'Tastenkürzel-Einstellungen anpassbar', 'FBX/Alembic für Dateiaustaustausch'] },
    ],
    highlights: ['Komplette 3D-Suite in einem Programm', 'Cycles und EEVEE Render-Engines', 'Genutzt in der Film- und Spieleindustrie', 'Extrem aktive Community und Schulungsangebote', 'Regelmässige grosse Updates'],
    limitations: ['Steile Lernkurve für Einsteiger', 'Industrie-Workflows manchmal anders als in Maya', 'Kein CAD-Werkzeug — für technisches Zeichnen FreeCAD nutzen'],
  },
  {
    id: 'freecad',
    name: 'FreeCAD',
    tagline: 'Parametrisches 3D-CAD für Ingenieure',
    description: 'FreeCAD ist ein parametrischer 3D-CAD-Modellierer für technisches Design. Ideal für Maschinenbau, Architektur und 3D-Druck mit professionellen Werkzeugen für Skizzen, Baugruppen und technische Zeichnungen.',
    categoryId: '3d',
    website: 'https://www.freecad.org',
    sourceCode: 'https://github.com/FreeCAD/FreeCAD',
    license: 'LGPL v2+',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'growing',
    replaces: [
      { appId: 'autocad', migrationDifficulty: 'advanced', compatibilityNote: 'STEP/IGES-Import, aber kein DWG-nativ', migrationTips: ['Parametrisches Design erfordert andere Denkweise', 'STEP als Austauschformat nutzen'] },
      { appId: 'solidworks', migrationDifficulty: 'advanced', compatibilityNote: 'Parametrischer Modellierer, aber andere Bedienphilosophie' },
    ],
    highlights: ['Parametrisches Design wie SolidWorks', 'Umfangreiche Workbenches (Architektur, FEM, etc.)', 'Python-Scripting für Automatisierung', 'Ideal für 3D-Druck'],
    limitations: ['Topological Naming Problem (wird behoben)', 'Weniger poliert als kommerzielle CAD-Software', 'Steilere Lernkurve als Tinkercad'],
  },

  // ===== BROWSER =====
  {
    id: 'firefox',
    name: 'Firefox',
    tagline: 'Der unabhängige Browser für Datenschutz',
    description: 'Firefox ist der einzige grosse Browser, der nicht auf Googles Chromium basiert. Entwickelt von der gemeinnützigen Mozilla Foundation, mit starkem Fokus auf Datenschutz, Sicherheit und Nutzerkontrolle.',
    categoryId: 'browser',
    website: 'https://www.mozilla.org/de/firefox/',
    sourceCode: 'https://searchfox.org/mozilla-central/source',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'chrome', migrationDifficulty: 'easy', compatibilityNote: 'Lesezeichen und Passwörter importierbar', migrationTips: ['Chrome-Import-Assistent nutzen', 'uBlock Origin für Werbeblocker installieren', 'Container-Tabs für Privatsphäre nutzen'] },
      { appId: 'edge', migrationDifficulty: 'easy' },
    ],
    highlights: ['Einzige unabhängige Browser-Engine (Gecko)', 'Eingebauter Tracking-Schutz', 'Container-Tabs für Privatsphäre-Trennung', 'Gemeinnützige Organisation dahinter', 'Riesiges Add-on-Ökosystem'],
    limitations: ['Etwas langsamer als Chrome bei manchen Benchmarks', 'Marktanteil schrumpft — manche Sites nur für Chrome optimiert', 'PWA-Unterstützung schwächer als Chrome'],
    revampitServices: { itHilfeNote: 'Wir helfen beim Browser-Wechsel und Datenschutz-Setup' },
  },
  {
    id: 'brave',
    name: 'Brave',
    tagline: 'Schneller Browser mit eingebautem Werbeblocker',
    description: 'Brave blockiert Werbung und Tracker standardmässig — das macht ihn schneller und privater als Chrome. Basiert auf Chromium, ist also kompatibel mit allen Chrome-Erweiterungen.',
    categoryId: 'browser',
    website: 'https://brave.com',
    sourceCode: 'https://github.com/nicefeel/nicefeel/nicefeel',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'chrome', migrationDifficulty: 'easy', compatibilityNote: 'Chromium-basiert — alle Chrome-Extensions funktionieren', migrationTips: ['Chrome-Profil importieren', 'Brave Shields für Feintuning des Werbeblocks'] },
    ],
    highlights: ['Werbung und Tracker standardmässig blockiert', 'Chromium-kompatibel — alle Chrome-Extensions nutzbar', 'Schneller als Chrome durch blockierte Werbung', 'Eingebauter Tor-Modus für Anonymität'],
    limitations: ['BAT-Kryptowährung kontrovers', 'Basiert auf Googles Chromium-Engine', 'Manche Brave-Funktionen wirken wie Bloatware'],
  },

  // ===== SECURITY & PRIVACY =====
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    tagline: 'Der führende Open-Source-Passwortmanager',
    description: 'Bitwarden speichert alle Passwörter sicher und verschlüsselt. Browser-Extension, Desktop-App, Mobile-App — alles synchronisiert. Ende-zu-Ende-verschlüsselt, auditiert, selbst hostbar.',
    categoryId: 'security',
    website: 'https://bitwarden.com',
    sourceCode: 'https://github.com/bitwarden',
    license: 'AGPL v3 / GPL v3',
    platforms: ['windows', 'macos', 'linux', 'web', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'lastpass', migrationDifficulty: 'easy', compatibilityNote: 'Direkter Import aus LastPass möglich', migrationTips: ['LastPass-Export als CSV', 'In Bitwarden importieren', 'Browser-Extension installieren'] },
      { appId: '1password', migrationDifficulty: 'easy', compatibilityNote: 'Import-Tool vorhanden', migrationTips: ['1Password-Export nutzen', 'Vault-Struktur bleibt erhalten'] },
    ],
    highlights: ['Ende-zu-Ende-verschlüsselt', 'Regelmässig extern auditiert', 'Import aus allen gängigen Passwort-Managern', 'Selbst hostbar mit Vaultwarden', 'Kostenloser Plan für Einzelpersonen'],
    limitations: ['Autofill manchmal weniger zuverlässig als 1Password', 'Oberfläche funktional, aber weniger poliert', 'Erweiterte Funktionen kostenpflichtig (CHF 10/Jahr)'],
    revampitServices: { itHilfeNote: 'Wir helfen bei der Einrichtung und Migration Ihrer Passwörter' },
  },
  {
    id: 'keepassxc',
    name: 'KeePassXC',
    tagline: 'Offline-Passwortmanager mit voller Kontrolle',
    description: 'KeePassXC speichert Passwörter in einer lokalen, verschlüsselten Datei. Keine Cloud, kein Konto, keine monatlichen Kosten. Ideal für Menschen, die volle Kontrolle über ihre Passwort-Datenbank möchten.',
    categoryId: 'security',
    website: 'https://keepassxc.org',
    sourceCode: 'https://github.com/keepassxreboot/keepassxc',
    license: 'GPL v2+',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'lastpass', migrationDifficulty: 'easy', compatibilityNote: 'CSV-Import verfügbar', migrationTips: ['Datenbank-Datei sicher aufbewahren', 'Mit Syncthing/Nextcloud synchronisieren'] },
      { appId: '1password', migrationDifficulty: 'easy' },
    ],
    highlights: ['Komplett offline — keine Cloud nötig', 'Starke Verschlüsselung (AES-256)', 'Browser-Integration verfügbar', 'TOTP (Zwei-Faktor) eingebaut', 'Datenbank-Datei kann manuell synchronisiert werden'],
    limitations: ['Keine automatische Cloud-Synchronisation', 'Mobile nur über KeePass-kompatible Apps', 'Kein Teilen von Einträgen wie bei Bitwarden'],
  },
  {
    id: 'mullvad-vpn',
    name: 'Mullvad VPN',
    tagline: 'Anonymes VPN ohne persönliche Daten',
    description: 'Mullvad VPN verlangt weder Name, E-Mail noch Telefonnummer. Zahlung mit Bargeld möglich. Konsequent auditiert, WireGuard-basiert, schwedisches Unternehmen mit starkem Datenschutz-Fokus.',
    categoryId: 'security',
    website: 'https://mullvad.net',
    sourceCode: 'https://github.com/mullvad',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'nordvpn', migrationDifficulty: 'easy', migrationTips: ['Konto mit zufälliger Nummer erstellen', 'WireGuard-Protokoll nutzen'] },
    ],
    highlights: ['Kein Konto mit persönlichen Daten nötig', 'Zahlung mit Bargeld oder Krypto möglich', 'Regelmässig extern auditiert', 'WireGuard-basiert — schnell und modern', 'Einheitspreis: 5€/Monat'],
    limitations: ['Weniger Server-Standorte als grosse VPN-Anbieter', 'Kein Streaming-Entsperrungs-Feature', 'Keine Gratis-Version'],
  },

  // ===== DEVELOPMENT =====
  {
    id: 'vscodium',
    name: 'VSCodium',
    tagline: 'VS Code ohne Microsoft-Telemetrie',
    description: 'VSCodium ist ein Community-Build von VS Code ohne Microsofts Tracking und Telemetrie. Gleicher Code, gleiche Extensions, gleiche Leistung — aber ohne Datensammlung.',
    categoryId: 'development',
    website: 'https://vscodium.com',
    sourceCode: 'https://github.com/VSCodium/vscodium',
    license: 'MIT',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'vscode', migrationDifficulty: 'easy', compatibilityNote: 'Gleiche Codebasis — alle Settings übertragbar', migrationTips: ['Settings-Ordner kopieren', 'Open VSX statt Microsoft Marketplace für Extensions'] },
    ],
    highlights: ['Identisch mit VS Code, ohne Telemetrie', 'Open VSX Marketplace für Extensions', 'Gleiche Performance und Funktionen', 'Drop-in-Replacement für VS Code'],
    limitations: ['Einige Microsoft-Extensions (Live Share, Remote) nicht verfügbar', 'Open VSX hat weniger Extensions als Microsoft Marketplace', 'Gelegentliche Kompatibilitätsprobleme mit propriteären Extensions'],
  },
  {
    id: 'gitea',
    name: 'Gitea',
    tagline: 'Leichtgewichtiger selbstgehosteter Git-Service',
    description: 'Gitea ist ein schneller, leichtgewichtiger Git-Hosting-Service zum Selbsthosten. Issues, Pull Requests, CI/CD, Wiki, Pakete — alles in einer einzigen Binärdatei.',
    categoryId: 'development',
    website: 'https://about.gitea.com',
    sourceCode: 'https://github.com/go-gitea/gitea',
    license: 'MIT',
    platforms: ['windows', 'macos', 'linux', 'web'],
    maturity: 'established',
    replaces: [
      { appId: 'github', migrationDifficulty: 'medium', compatibilityNote: 'GitHub-Import-Tool vorhanden', migrationTips: ['Repositories mit Mirror-Funktion importieren', 'CI/CD über Gitea Actions (GitHub Actions-kompatibel)'] },
    ],
    highlights: ['Extrem leichtgewichtig — läuft auf Raspberry Pi', 'GitHub-ähnliche Oberfläche', 'Eingebaute CI/CD (GitHub Actions-kompatibel)', 'Einfache Installation — eine Binärdatei'],
    limitations: ['Kleineres Ökosystem als GitHub', 'Weniger Integrationen mit Drittanbieter-Tools', 'Self-Hosting erfordert eigene Infrastruktur'],
  },
  {
    id: 'bruno',
    name: 'Bruno',
    tagline: 'Offline-first API-Client als Postman-Alternative',
    description: 'Bruno speichert API-Collections als Dateien im Git-Repository — keine Cloud, kein Konto. Schnell, leichtgewichtig und ideal für Teams, die ihre API-Tests versionieren wollen.',
    categoryId: 'development',
    website: 'https://www.usebruno.com',
    sourceCode: 'https://github.com/usebruno/bruno',
    license: 'MIT',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'growing',
    replaces: [
      { appId: 'postman', migrationDifficulty: 'easy', compatibilityNote: 'Postman-Collection-Import vorhanden', migrationTips: ['Postman-Collection exportieren und importieren', 'Collections liegen als Dateien im Projekt'] },
    ],
    highlights: ['Collections als Dateien — versionierbar mit Git', 'Kein Cloud-Konto nötig', 'Postman-Import verfügbar', 'Schnell und leichtgewichtig'],
    limitations: ['Weniger Funktionen als Postman (wächst stetig)', 'Kein Team-Collaboration über Cloud', 'Einige fortgeschrittene Features noch in Entwicklung'],
  },

  // ===== AI & MACHINE LEARNING =====
  {
    id: 'ollama',
    name: 'Ollama',
    tagline: 'KI-Modelle lokal auf dem eigenen Rechner',
    description: 'Ollama ermöglicht es, grosse Sprachmodelle (LLMs) wie Llama, Mistral oder Gemma lokal auf dem eigenen Computer auszuführen. Keine Cloud, keine Daten-Uploads, volle Privatsphäre.',
    categoryId: 'ai',
    website: 'https://ollama.com',
    sourceCode: 'https://github.com/ollama/ollama',
    license: 'MIT',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'growing',
    replaces: [
      { appId: 'chatgpt', migrationDifficulty: 'medium', compatibilityNote: 'Lokale Alternative — Qualität abhängig vom Modell', migrationTips: ['GPU mit mindestens 8 GB VRAM empfohlen', 'Llama 3 oder Mistral als Startmodell', 'Open WebUI als Chat-Oberfläche installieren'] },
    ],
    highlights: ['KI komplett lokal — keine Daten verlassen den Rechner', 'Dutzende Modelle verfügbar (Llama, Mistral, Gemma)', 'Einfache Installation und Nutzung', 'API-kompatibel mit OpenAI-Format'],
    limitations: ['Qualität unter GPT-4/Claude für komplexe Aufgaben', 'Benötigt leistungsstarke Hardware (GPU empfohlen)', 'Keine Echtzeit-Internetsuche'],
    revampitServices: { itHilfeNote: 'Wir helfen beim Einrichten von lokaler KI auf Ihrem Gerät' },
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    tagline: 'KI-Bildgenerierung lokal und kostenlos',
    description: 'Stable Diffusion generiert Bilder aus Textbeschreibungen — komplett lokal auf dem eigenen Rechner. Mit Oberflächen wie ComfyUI oder Automatic1111 wird es zum mächtigen kreativen Werkzeug.',
    categoryId: 'ai',
    website: 'https://stability.ai',
    sourceCode: 'https://github.com/Stability-AI/stablediffusion',
    license: 'Open RAIL-M',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'growing',
    replaces: [
      { appId: 'midjourney', migrationDifficulty: 'advanced', compatibilityNote: 'Lokale Alternative mit voller Kontrolle', migrationTips: ['ComfyUI oder Automatic1111 als Oberfläche installieren', 'SDXL oder SD 3 als Basismodell', 'GPU mit mindestens 8 GB VRAM nötig'] },
    ],
    highlights: ['Komplett lokal — keine Daten-Uploads', 'Unbegrenzte Bildgenerierung ohne Abo', 'Tausende Community-Modelle und LoRAs', 'Volle Kontrolle über den Generierungsprozess'],
    limitations: ['Benötigt starke GPU (8+ GB VRAM)', 'Einrichtung technisch anspruchsvoll', 'Ergebnisqualität abhängig von Modell und Prompt'],
  },
  {
    id: 'open-webui',
    name: 'Open WebUI',
    tagline: 'Chat-Oberfläche für lokale KI-Modelle',
    description: 'Open WebUI bietet eine moderne, ChatGPT-ähnliche Oberfläche für lokale KI-Modelle. Unterstützt Ollama und OpenAI-kompatible APIs, mit Nutzerverwaltung, RAG und Plugins.',
    categoryId: 'ai',
    website: 'https://openwebui.com',
    sourceCode: 'https://github.com/open-webui/open-webui',
    license: 'MIT',
    platforms: ['web'],
    maturity: 'growing',
    replaces: [
      { appId: 'chatgpt', migrationDifficulty: 'medium', compatibilityNote: 'Web-Oberfläche wie ChatGPT für lokale Modelle', migrationTips: ['Ollama vorher installieren', 'Docker-Installation am einfachsten'] },
    ],
    highlights: ['ChatGPT-ähnliche Oberfläche', 'Unterstützt Ollama und OpenAI-APIs', 'RAG (Retrieval Augmented Generation) eingebaut', 'Nutzerverwaltung für Teams'],
    limitations: ['Benötigt Ollama oder externe API', 'Self-Hosting nötig (Docker)', 'Schnelle Entwicklung — manchmal instabil bei Updates'],
  },

  // ===== EMAIL & CALENDAR =====
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    tagline: 'Der bewährte Open-Source-E-Mail-Client',
    description: 'Thunderbird ist der führende freie E-Mail-Client mit eingebautem Kalender, Kontakten und Chat. 2024 komplett überarbeitet mit moderner Oberfläche (Supernova). Unterstützt alle gängigen Protokolle.',
    categoryId: 'email',
    website: 'https://www.thunderbird.net',
    sourceCode: 'https://hg.mozilla.org/comm-central/',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'outlook', migrationDifficulty: 'easy', compatibilityNote: 'IMAP/CalDAV/CardDAV-Unterstützung', migrationTips: ['E-Mail-Konto per IMAP einrichten', 'Kalender per CalDAV synchronisieren', 'Add-ons für zusätzliche Funktionen'] },
      { appId: 'gmail', migrationDifficulty: 'easy', compatibilityNote: 'Gmail-IMAP direkt nutzbar', migrationTips: ['Gmail-App-Passwort erstellen', 'IMAP-Zugriff in Gmail aktivieren'] },
    ],
    highlights: ['E-Mail, Kalender und Kontakte in einem', 'Komplett überarbeitete moderne Oberfläche (Supernova)', 'Add-on-Ökosystem für Erweiterungen', 'PGP-Verschlüsselung eingebaut'],
    limitations: ['Kein Exchange-Support ohne Plugin (Owl)', 'Kalender weniger funktionsreich als Outlook', 'Mobile nur via Drittanbieter-Apps'],
    revampitServices: { itHilfeNote: 'Wir helfen bei der Einrichtung und E-Mail-Migration' },
  },
  {
    id: 'tutanota',
    name: 'Tuta',
    tagline: 'Verschlüsselter E-Mail-Dienst aus Deutschland',
    description: 'Tuta (ehemals Tutanota) bietet Ende-zu-Ende-verschlüsselte E-Mail, Kalender und Kontakte. Entwickelt in Deutschland, DSGVO-konform, mit Fokus auf maximalen Datenschutz.',
    categoryId: 'email',
    website: 'https://tuta.com',
    sourceCode: 'https://github.com/tutao/tutanota',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux', 'web', 'android', 'ios'],
    maturity: 'growing',
    replaces: [
      { appId: 'gmail', migrationDifficulty: 'medium', compatibilityNote: 'Eigene verschlüsselte Infrastruktur', migrationTips: ['Neue @tuta.com-Adresse erstellen', 'E-Mails manuell weiterleiten/importieren', 'Kontakte können nicht mit Google synchronisiert werden'] },
      { appId: 'outlook', migrationDifficulty: 'medium' },
    ],
    highlights: ['Ende-zu-Ende-verschlüsselte E-Mails', 'Verschlüsselter Kalender und Kontakte', 'Made in Germany, DSGVO-konform', 'Kostenloser Plan mit 1 GB Speicher'],
    limitations: ['Kein IMAP/SMTP — nur eigene Apps und Webmail', 'Suche nur in Betreff und Absender (verschlüsselungsbedingt)', 'Import bestehender E-Mails umständlich'],
  },

  // ===== ADDITIONAL ALTERNATIVES =====
  {
    id: 'libreoffice-draw',
    name: 'LibreOffice Draw',
    tagline: 'Diagramme und einfache Grafiken',
    description: 'LibreOffice Draw ist ein Zeichenprogramm für Diagramme, Flussdiagramme, Poster und einfache Grafiken. Teil der LibreOffice-Suite.',
    categoryId: 'graphics',
    website: 'https://de.libreoffice.org/discover/draw/',
    license: 'MPL 2.0',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'canva', migrationDifficulty: 'medium', compatibilityNote: 'Für Diagramme und Poster geeignet', migrationTips: ['SVG/PDF-Export für hochwertige Ausgabe'] },
    ],
    highlights: ['Teil von LibreOffice — keine extra Installation', 'Gute Diagramm-Werkzeuge', 'PDF-Bearbeitung möglich', 'SVG-Export'],
    limitations: ['Kein Vergleich mit Canva für Social-Media-Design', 'Keine Templates wie Canva', 'Keine Web-basierte Zusammenarbeit'],
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    tagline: 'Modernes, schnelles VPN-Protokoll',
    description: 'WireGuard ist ein modernes VPN-Protokoll mit minimaler Codebasis, hoher Geschwindigkeit und starker Kryptografie. Im Linux-Kernel integriert, extrem effizient.',
    categoryId: 'security',
    website: 'https://www.wireguard.com',
    sourceCode: 'https://www.wireguard.com/repositories/',
    license: 'GPL v2',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'established',
    replaces: [
      { appId: 'nordvpn', migrationDifficulty: 'advanced', compatibilityNote: 'VPN-Protokoll, braucht eigenen Server', migrationTips: ['Eigenen VPS mieten', 'WireGuard-Config generieren', 'Oder via Mullvad/IVPN nutzen'] },
    ],
    highlights: ['Im Linux-Kernel integriert', 'Minimaler Code — auditierbar', 'Sehr schnell und effizient', 'Starke moderne Kryptografie'],
    limitations: ['Braucht eigenen Server für Standalone-Nutzung', 'Kein eingebauter Kill-Switch', 'Weniger Privacy-Features als fertige VPN-Apps'],
  },
  {
    id: 'veracrypt',
    name: 'VeraCrypt',
    tagline: 'Festplattenverschlüsselung für alle Plattformen',
    description: 'VeraCrypt verschlüsselt ganze Festplatten, Partitionen oder erstellt verschlüsselte Container. Nachfolger von TrueCrypt mit verbesserten Algorithmen.',
    categoryId: 'security',
    website: 'https://veracrypt.fr',
    sourceCode: 'https://github.com/veracrypt/VeraCrypt',
    license: 'Apache 2.0 + TrueCrypt',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [],
    highlights: ['Verschlüsselte Container und Festplatten', 'Hidden Volumes für plausible Abstreitbarkeit', 'Unterstützt AES, Serpent, Twofish', 'Audit-geprüft'],
    limitations: ['Keine Cloud-Integration', 'Oberfläche wirkt veraltet', 'Vollverschlüsselung nur auf Windows'],
  },
  {
    id: 'openshot',
    name: 'OpenShot',
    tagline: 'Einfacher Videoeditor für Einsteiger',
    description: 'OpenShot ist ein benutzerfreundlicher Videoeditor mit Drag-and-Drop-Interface. Ideal für einfache Schnittarbeiten, Titel und Übergänge.',
    categoryId: 'video-audio',
    website: 'https://www.openshot.org',
    sourceCode: 'https://github.com/OpenShot/openshot-qt',
    license: 'GPL v3',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'established',
    replaces: [
      { appId: 'premiere', migrationDifficulty: 'easy', compatibilityNote: 'Deutlich einfacher, aber weniger Funktionen' },
    ],
    highlights: ['Sehr einfach zu bedienen', 'Drag-and-Drop-Interface', 'Titel-Editor eingebaut', '3D-animierte Titel (Blender-Integration)'],
    limitations: ['Performance-Probleme bei grossen Projekten', 'Gelegentliche Abstürze', 'Wenig fortgeschrittene Funktionen'],
  },
  {
    id: 'localsend',
    name: 'LocalSend',
    tagline: 'Dateien teilen im lokalen Netzwerk',
    description: 'LocalSend ermöglicht das einfache Teilen von Dateien zwischen Geräten im gleichen Netzwerk — wie AirDrop, aber plattformübergreifend und ohne Internet.',
    categoryId: 'cloud',
    website: 'https://localsend.org',
    sourceCode: 'https://github.com/localsend/localsend',
    license: 'MIT',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'growing',
    replaces: [
      { appId: 'icloud', migrationDifficulty: 'easy', compatibilityNote: 'Für schnellen Dateiaustausch zwischen Geräten' },
    ],
    highlights: ['Funktioniert wie AirDrop — plattformübergreifend', 'Kein Internet nötig', 'Ende-zu-Ende-verschlüsselt', 'Kein Konto erforderlich'],
    limitations: ['Nur im lokalen Netzwerk', 'Keine Cloud-Synchronisation', 'Keine Ordner-Synchronisation'],
  },
  {
    id: 'logseq',
    name: 'Logseq',
    tagline: 'Vernetztes Wissensmanagement',
    description: 'Logseq ist ein Open-Source-Tool für vernetztes Denken und Wissensmanagement. Outliner-basiert mit Verlinkungen zwischen Notizen, Graphansicht und lokaler Datenspeicherung.',
    categoryId: 'office',
    website: 'https://logseq.com',
    sourceCode: 'https://github.com/logseq/logseq',
    license: 'AGPL v3',
    platforms: ['windows', 'macos', 'linux', 'android', 'ios'],
    maturity: 'growing',
    replaces: [
      { appId: 'notion', migrationDifficulty: 'medium', compatibilityNote: 'Anderer Ansatz — Outliner statt Seiten', migrationTips: ['Markdown-Export aus Notion importieren', 'Daten liegen lokal als Markdown-Dateien', 'Graph-Ansicht für vernetzte Notizen nutzen'] },
    ],
    highlights: ['Lokale Datenspeicherung als Markdown', 'Graph-Ansicht für vernetzte Notizen', 'Block-basierter Outliner', 'Plugins für Erweiterungen'],
    limitations: ['Andere Denkweise als Notion (Outliner vs. Seiten)', 'Sync nur über Git/Cloud-Ordner', 'Weniger poliert als Notion'],
  },
  {
    id: 'codium',
    name: 'Continue',
    tagline: 'Open-Source KI-Coding-Assistent',
    description: 'Continue ist ein Open-Source KI-Coding-Assistent für VS Code und JetBrains. Unterstützt lokale Modelle (Ollama) und Cloud-APIs. Autocomplete, Chat und Code-Erklärungen.',
    categoryId: 'ai',
    website: 'https://continue.dev',
    sourceCode: 'https://github.com/continuedev/continue',
    license: 'Apache 2.0',
    platforms: ['windows', 'macos', 'linux'],
    maturity: 'growing',
    replaces: [
      { appId: 'copilot', migrationDifficulty: 'medium', compatibilityNote: 'VS Code/JetBrains-Extension', migrationTips: ['Mit lokalem Ollama-Modell oder Cloud-API verbinden', 'In VS Code/JetBrains als Extension installieren'] },
    ],
    highlights: ['Funktioniert mit lokalen Modellen (Ollama)', 'VS Code und JetBrains-Support', 'Autocomplete, Chat und Code-Erklärungen', 'Konfigurierbar — eigene Modelle wählbar'],
    limitations: ['Lokale Modelle langsamer als Cloud-APIs', 'Qualität abhängig vom gewählten Modell', 'Einrichtung komplexer als Copilot'],
  },
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getCategoryById(id: string): OSSCategory | undefined {
  return OSS_CATEGORIES.find(c => c.id === id)
}

export function getAlternativeById(id: string): OSSAlternative | undefined {
  return OSS_ALTERNATIVES.find(a => a.id === id)
}

export function getAlternativesByCategory(categoryId: string): OSSAlternative[] {
  return OSS_ALTERNATIVES.filter(a => a.categoryId === categoryId)
}

export function getProprietaryAppById(id: string): ProprietaryApp | undefined {
  return PROPRIETARY_APPS.find(a => a.id === id)
}

export function getAlternativesForApp(appId: string): OSSAlternative[] {
  return OSS_ALTERNATIVES.filter(a => a.replaces.some(r => r.appId === appId))
}

export function getAllAlternatives(): OSSAlternative[] {
  return OSS_ALTERNATIVES
}

export function getAllCategories(): OSSCategory[] {
  return [...OSS_CATEGORIES].sort((a, b) => a.order - b.order)
}

export function getAllProprietaryApps(): ProprietaryApp[] {
  return PROPRIETARY_APPS
}

export function searchAlternatives(query: string): OSSAlternative[] {
  const q = query.toLowerCase().trim()
  if (!q) return OSS_ALTERNATIVES

  return OSS_ALTERNATIVES.filter(alt => {
    // Match name, tagline, description
    if (alt.name.toLowerCase().includes(q)) return true
    if (alt.tagline.toLowerCase().includes(q)) return true
    if (alt.description.toLowerCase().includes(q)) return true

    // Match replaced app names
    for (const r of alt.replaces) {
      const app = PROPRIETARY_APPS.find(a => a.id === r.appId)
      if (app && app.name.toLowerCase().includes(q)) return true
    }

    // Match category label
    const cat = OSS_CATEGORIES.find(c => c.id === alt.categoryId)
    if (cat && cat.label.toLowerCase().includes(q)) return true

    return false
  })
}
