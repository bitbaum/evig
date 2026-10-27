/**
 * Changelog — SSOT for platform release notes.
 *
 * Add a new entry at the top after each meaningful deploy. Keep bullets
 * concise and user-facing (fixes, features, improvements). UI chrome lives
 * in the `changelog` namespace of messages/{locale}.json; release copy lives here.
 *
 * CHANGELOG.md at the repo root is the canonical record the fleet map
 * (loki.orangecat.ch/api/fleet/map) reads, in Keep-a-Changelog form with one
 * language. It must be updated in the same PR as this file, so the /changelog
 * page (which renders this array) and the fleet's record never disagree.
 */

export interface LocalizedCopy {
  de: string;
  en: string;
}

export interface ChangelogRelease {
  /** Anchor id, e.g. "v0-1-0" */
  id: string;
  version: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  title: LocalizedCopy;
  changes: LocalizedCopy[];
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'v0-5-3',
    version: '0.5.3',
    date: '2026-10-27',
    title: {
      de: 'Hirn führt Gespräche, die bleiben',
      en: 'Hirn keeps your conversations',
    },
    changes: [
      {
        de: 'Hirn hat jetzt eine Gesprächsliste mit Suche: neues Gespräch, umbenennen, löschen, und nach dem Neuladen ist dein letztes Gespräch wieder da',
        en: 'Hirn now has a conversation list with search: new conversation, rename, delete, and after a reload your last conversation is back',
      },
      {
        de: 'Im öffentlichen Hirn-Assistenten gibt es zusätzlich ein temporäres Gespräch, das nirgends gespeichert wird',
        en: 'The public Hirn assistant also offers a temporary conversation that is saved nowhere',
      },
    ],
  },
  {
    id: 'v0-5-2',
    version: '0.5.2',
    date: '2026-10-12',
    title: {
      de: 'Die Suche verzeiht einen Tippfehler',
      en: 'Search forgives a typo',
    },
    changes: [
      {
        de: 'Ein Tippfehler pro Wort findet trotzdem, was gemeint war: im Marktplatz («Thinkpda» findet das ThinkPad), in der Technikerliste («Zurich» findet Zürich), in der Befehlsleiste (⌘K), im Blog, in der Open-Source-Liste und beim Auswählen von Personen',
        en: 'One slip per word still finds what was meant: in the marketplace ("Thinkpda" finds the ThinkPad), in the technician directory ("Zurich" finds Zürich), in the command palette (⌘K), on the blog, in the open-source list and when picking people',
      },
      {
        de: 'In der Befehlsleiste, im Blog und in der Open-Source-Liste steht der beste Treffer zuoberst, und die Befehlsleiste zeigt, welcher Teil gepasst hat',
        en: 'In the command palette, on the blog and in the open-source list the best match comes first, and the command palette marks what matched',
      },
    ],
  },
  {
    id: 'v0-5-1',
    version: '0.5.1',
    date: '2026-10-11',
    title: {
      de: 'Die Roadmap sagt, wann jeder Schritt kam',
      en: 'The roadmap says when each step shipped',
    },
    changes: [
      {
        de: 'Jeder erledigte Schritt auf /roadmap verlinkt die Version im Changelog, die ihn geliefert hat, und der Changelog reicht jetzt bis heute statt bei 0.1.4 aufzuhören',
        en: 'Each finished step on /roadmap links to the release on /changelog that delivered it, and the changelog covers everything since June instead of stopping at 0.1.4',
      },
    ],
  },
  {
    id: 'v0-5-0',
    version: '0.5.0',
    date: '2026-10-09',
    title: {
      de: 'Mit OrangeCat anmelden',
      en: 'Sign in with OrangeCat',
    },
    changes: [
      {
        de: '«Mit OrangeCat anmelden» ist der erste Weg auf der Login- und Registrierungsseite; das Passwortformular liegt einen Klick dahinter, und ein bestehendes Konto verbindet OrangeCat im Profil. Ein über OrangeCat erstelltes Konto erhält keinen Link zum Zurücksetzen des Passworts, weil es hier keines hat',
        en: '"Sign in with OrangeCat" is the first way in on the login and registration pages; the password form is one click behind it, and an existing account connects OrangeCat from the profile. An account made through OrangeCat gets no password-reset link, because it has no password here',
      },
      {
        de: 'Die Startseite sagt, was evig löst — konkrete Probleme, für eine Person und für alle — statt sich selbst zu beschreiben',
        en: 'The homepage says what evig solves — concrete problems, for one person and for everyone — instead of describing itself',
      },
      {
        de: 'Die Website behauptet keine Werkstatt, keine Partner, keine Spendenbescheinigungen und keine evig.ch-Adresse mehr, die evig nicht hat',
        en: 'The site stopped claiming a workshop, partners, donation receipts and an evig.ch address that evig does not have',
      },
      {
        de: 'Daten in Formularen stehen in Worten, und Hirn schlägt in jedem Chat Antworten vor',
        en: 'Dates in forms read in words, and Hirn offers suggested replies in every chat',
      },
      {
        de: 'Auf dem Handy öffnet die Dateiauswahl für ein Protokoll den Dateibrowser statt einer Kamera-App-Auswahl',
        en: 'On a phone, choosing a source file for a protocol opens the file browser instead of a camera-app chooser',
      },
      {
        de: 'Next.js 16.3.8 schliesst eine kritische Lücke zur Codeausführung in der Bilderzeugung und eine Lücke bei der Bildoptimierung',
        en: 'Next.js 16.3.8 closes a critical remote-code-execution hole in image generation and a request-forgery hole in image optimisation',
      },
    ],
  },
  {
    id: 'v0-4-0',
    version: '0.4.0',
    date: '2026-09-28',
    title: {
      de: 'Eine öffentliche Roadmap, und die Aufzeichnung dahinter',
      en: 'A public roadmap, and the record behind it',
    },
    changes: [
      {
        de: '/roadmap zeigt, woran evig baut, gelesen aus denselben ROADMAP.md und CHANGELOG.md, die auch die Flottenkarte liest',
        en: '/roadmap shows what evig is building, read from the same ROADMAP.md and CHANGELOG.md the fleet map reads',
      },
      {
        de: 'Die Kontaktadresse ist cato@orangecat.ch statt eines persönlichen Postfachs',
        en: 'The contact address is cato@orangecat.ch instead of a personal mailbox',
      },
      {
        de: 'Navigationsziele sind 44px hoch, und der Hirn-Knopf liegt nicht mehr unter dem Cookie-Banner',
        en: 'Navigation targets are 44px tall, and the Hirn button no longer sits under the cookie banner',
      },
      {
        de: 'Jede Seite sendet die fünf grundlegenden Sicherheits-Header; die Zahlungsbremse vertraut keinem Header mehr, den der Aufrufer selbst setzt',
        en: 'Every page sends the five baseline security headers; the payment throttle no longer trusts a header the caller writes',
      },
      {
        de: 'Blogartikel werden über typisierte Blöcke dargestellt — Inhalte aus der Datenbank liefen vorher ohne Bereinigung durch; eine Slug-Änderung löscht nicht mehr sieben der acht Übersetzungen',
        en: 'Blog articles render through typed blocks — database content was rendered without a sanitiser; changing a slug no longer deletes seven of the eight translations',
      },
      {
        de: 'E-Mails gehen über Resend hinaus; der alte SMTP-Zugang war abgelaufen und Mails gingen still verloren',
        en: 'Mail goes out through Resend; the old SMTP credential had died and mail was silently lost',
      },
      {
        de: '/api/health/ai meldet, ob die KI wirklich antwortet, statt eine unbeobachtete KI «gesund» zu nennen; «Rate-Limit erreicht» erscheint nur noch, wenn es stimmt',
        en: '/api/health/ai reports whether the AI actually answers, instead of calling an unobserved AI "healthy"; "Rate-Limit erreicht" now appears only when it is true',
      },
    ],
  },
  {
    id: 'v0-3-0',
    version: '0.3.0',
    date: '2026-08-26',
    title: {
      de: 'Drei Bereiche, fünf Säulen — und was nicht funktionierte',
      en: 'Three divisions, five pillars — and what did not work',
    },
    changes: [
      {
        de: 'evig zeigt sich in drei Bereichen — computers, technicians, ai — aus einer einzigen Liste, die Wortmarken, Navigation, Fusszeile und Bereichsseiten speist',
        en: 'evig is stated as three divisions — computers, technicians, ai — from one list that drives the wordmarks, the navigation, the footer and the division pages',
      },
      {
        de: 'Aus evig repairs wird evig technicians: Anfrage stellen, Angebote von Technikerinnen und Technikern in der Nähe erhalten, eines wählen; evig sammelt keine Drucker mehr',
        en: 'evig repairs became evig technicians: post a request, get offers from technicians nearby, choose one; evig stopped asking for printers',
      },
      {
        de: 'Die Startseite nennt die fünf Säulen statt eines Spendentrichters und sagt nicht mehr dreimal dasselbe',
        en: 'The homepage states the five pillars instead of a donation funnel, and no longer says the same thing three times',
      },
      {
        de: 'Der Satz «keine Wohltätigkeitsorganisation» ist weg — er widersprach der Rechtsseite; evig architecture und evig health sind eigene Projekte geworden',
        en: 'The "not a charity" line is gone — it contradicted the legal page; evig architecture and evig health moved to their own projects',
      },
      {
        de: 'Die Spendenknöpfe finanzierten eine andere Organisation; jetzt finanzieren sie evig, und zwei Navigationseinträge ins Leere sind entfernt',
        en: 'The donate buttons funded another organisation; they fund evig now, and two navigation entries that went nowhere were removed',
      },
      {
        de: 'Die auf der Website angegebene Adresse empfing keine Post; jetzt schon',
        en: 'The address printed on the site did not receive mail; it does now',
      },
      {
        de: 'Rechnungen verwendeten den Mehrwertsteuersatz von vor 2024; jetzt gilt überall ein Satz. Bezahlte Inserate bleiben nicht mehr für immer reserviert, und die Bestellseite zeigt keine Servicegebühr von CHF 0.00 mehr',
        en: 'Invoices charged the pre-2024 VAT rate; one rate is used everywhere. Paid listings no longer stay reserved forever, and the order page stopped showing a CHF 0.00 service fee',
      },
      {
        de: 'Acht Dialoge halten den Fokus und schliessen mit Escape',
        en: 'Eight dialogs trap focus and close with Escape',
      },
      {
        de: 'Geldrouten verlangen die Finanzberechtigung, Cron-Routen verweigern standardmässig, und eine Stimme gibt ab, wer sich ausweist — nicht, wer eine E-Mail-Adresse eintippt. Über den laufenden Entscheid kann wieder abgestimmt werden',
        en: 'Money routes require the finance permission, cron routes deny by default, and a vote is cast by whoever proves it rather than whoever types an email address. The one live decision can be voted on again',
      },
      {
        de: 'Mitarbeitende füllen das Kategorienformular aus einem Satz und ändern es im Gespräch',
        en: 'Staff can fill the category form from a sentence and then change it by talking to it',
      },
    ],
  },
  {
    id: 'v0-2-0',
    version: '0.2.0',
    date: '2026-07-28',
    title: {
      de: 'Aus Revamp-IT wird evig',
      en: 'Revamp-IT becomes evig',
    },
    changes: [
      {
        de: 'Neuer Name, neues Erscheinungsbild und eine neue Adresse: evig.orangecat.ch',
        en: 'New name, identity and canonical address: evig.orangecat.ch',
      },
      {
        de: 'Jede Seite sagt, was stimmt: evig ist ein Verein in Gründung, keine anerkannte gemeinnützige Organisation',
        en: 'Every page says what is true: evig is a Verein in Gründung, not a recognised non-profit',
      },
      {
        de: 'Die erfundene Erfolgsbilanz, Kennzahlen und Kundenstimmen sind weg, ebenso Spendenbescheinigungen und Gemeinnützigkeit, die evig noch nicht beanspruchen kann',
        en: 'The invented track record, metrics and testimonials are gone, and so are the donation-receipt and charity claims evig cannot make yet',
      },
      {
        de: 'Ladenadresse, Öffnungszeiten sowie die Projekte und Social-Media-Konten von Revamp-IT sind entfernt — evig ist nicht Revamp-IT',
        en: "The physical store address, opening hours and Revamp-IT's projects and social accounts were removed — evig is not Revamp-IT",
      },
      {
        de: 'Rückmeldungen laufen über das einbettbare Widget der Flotte',
        en: "Feedback goes through the fleet's embeddable widget",
      },
    ],
  },
  {
    id: 'v0-1-5',
    version: '0.1.5',
    date: '2026-07-17',
    title: {
      de: 'Geprüft, bevor es verkauft wird',
      en: 'Checked before it is sold',
    },
    changes: [
      {
        de: 'Ein Gerät mit einem fehlgeschlagenen Pflichttest erreicht den Shop nicht; Mitarbeitende können ohne Qualitätskontrolle mit einem protokollierten Klick veröffentlichen — das Inserat trägt dann kein Prüfsiegel, und Käufer sehen, dass es ungeprüft ist',
        en: 'A device whose required test fails cannot reach the shop; staff can still publish without QC in one audited click, and the listing then carries no Prüfsiegel so buyers see it is untested',
      },
      {
        de: 'Die Schlussprüfung behält das Vier-Augen-Prinzip, mit einer protokollierten Ein-Klick-Ausnahme',
        en: 'Final QA keeps the four-eyes rule, with an audited one-click solo override',
      },
      {
        de: 'Jede CO₂-Zahl stammt aus offenen ADEME-Daten pro Kategorie, abzüglich 15 % für die Aufbereitung, mindestens 5 kg; Kategorien ohne belastbaren Faktor zeigen keine Angabe',
        en: 'Every CO₂ figure comes from per-category ADEME open data, minus 15% for refurbishment, floored at 5 kg; categories without a defensible factor show no claim',
      },
      {
        de: 'Die Methode ist öffentlich unter /transparenz/co2 und unter «Über uns» verlinkt',
        en: 'The methodology is public at /transparenz/co2 and linked under "Über uns"',
      },
      {
        de: 'Wird ein Inserat entfernt, kehrt das Gerät in die Pipeline zurück, und die Pipeline zeigt, was im Shop live ist',
        en: 'Removing a listing returns the device to the pipeline, and the pipeline shows what is live in the shop',
      },
    ],
  },
  {
    id: 'v0-1-4',
    version: '0.1.4',
    date: '2026-06-16',
    title: {
      de: 'Weniger Klicks, schnellere Wege',
      en: 'Fewer clicks, faster paths',
    },
    changes: [
      {
        de: 'Login und Registrierung respektieren wieder callbackUrl — Checkout und Deep Links landen nach Anmeldung am richtigen Ort',
        en: 'Login and registration respect callbackUrl again — checkout and deep links return to the right place after sign-in',
      },
      {
        de: 'Marktplatz-Checkout lädt Inserat serverseitig; kein Doppel-Spinner mehr durch Session- und API-Wasserfall',
        en: 'Marketplace checkout loads listings on the server; no double spinner from session + API waterfall',
      },
      {
        de: 'Dashboard hat persistente Schnellnavigation; schlankes Layout ohne schwebende Assistenten auf Aufgabenseiten',
        en: 'Dashboard has persistent quick navigation; lean layout without floating assistants on task pages',
      },
      {
        de: 'Legacy /shop/product/:uuid leitet bei Treffer direkt auf die Marktplatz-Inseratseite weiter',
        en: 'Legacy /shop/product/:uuid redirects to the marketplace listing when a match exists',
      },
      {
        de: 'IT-Hilfe-Anfrage: Problem beschreiben sofort sichtbar; AI-Hilfe standardmässig eingeklappt',
        en: 'IT-Hilfe request: describe the problem immediately; AI assist collapsed by default',
      },
      {
        de: 'Admin-Sidebar klappt die aktive Gruppe automatisch auf — ein Klick weniger pro Besuch',
        en: 'Admin sidebar auto-expands the active group — one fewer click per visit',
      },
    ],
  },
  {
    id: 'v0-1-3',
    version: '0.1.3',
    date: '2026-06-16',
    title: {
      de: 'Shop auf Marktplatz vereinheitlicht',
      en: 'Shop unified into marketplace',
    },
    changes: [
      {
        de: '/shop, /shop/search, /shop/category/... und /shop/product/... leiten jetzt auf den kanonischen Marktplatz weiter',
        en: '/shop, /shop/search, /shop/category/..., and /shop/product/... now redirect into the canonical marketplace',
      },
      {
        de: 'Navigation, Sitemap, Chatbot-Vorschlaege und Shop-URL-Helfer erzeugen keine neuen /shop-Links mehr',
        en: 'Navigation, sitemap, chatbot suggestions, and shop URL helpers no longer generate new /shop links',
      },
      {
        de: 'evig-Inserate werden einheitlich anhand Flag oder Staff-E-Mail markiert; andere Anbieter werden neutral benannt',
        en: 'evig listings are consistently marked by explicit flag or staff email; other sellers use neutral labeling',
      },
      {
        de: 'Payrexx-Zahlungen stoppen in Produktion mit Setup-Meldung, solange kein Payrexx-Konto konfiguriert ist',
        en: 'Payrexx-backed payments now stop in production with a setup message until a Payrexx account is configured',
      },
    ],
  },
  {
    id: 'v0-1-2',
    version: '0.1.2',
    date: '2026-06-16',
    title: {
      de: 'Self-Host-Deploy gehärtet',
      en: 'Self-host deploy hardened',
    },
    changes: [
      {
        de: 'Produktionsziel eindeutig auf revampit.orangecat.ch dokumentiert; revamp-it.ch bleibt als Legacy-Domain markiert',
        en: 'Production target clearly documented as revampit.orangecat.ch; revamp-it.ch remains marked as the legacy domain',
      },
      {
        de: 'Deploy-Skript legt vor dem Aktivieren ein Release-Backup an und rollt bei fehlgeschlagenem Healthcheck automatisch zurück',
        en: 'Deploy script now keeps a release backup before activation and automatically rolls back when the health check fails',
      },
      {
        de: 'Self-Host-Releases übernehmen serverlokale .env- und launch.sh-Dateien, damit Secrets und systemd-Startlogik nicht im Repository liegen',
        en: 'Self-host releases inherit server-local .env and launch.sh files so secrets and systemd launch logic stay out of the repository',
      },
      {
        de: 'GitHub-Deploy-Workflow führt Lint und Typecheck vor dem Produktionsdeploy aus',
        en: 'GitHub deploy workflow now runs lint and typecheck before production deploy',
      },
      {
        de: 'Neuer /api/version-Endpunkt zeigt App-Version, Git-SHA und Build-Zeit für Monitoring und Deploy-Verifikation',
        en: 'New /api/version endpoint exposes app version, git SHA, and build time for monitoring and deploy verification',
      },
      {
        de: 'Meilisearch läuft auf dem Hetzner-Server als localhost-only Docker-Service und /api/health meldet wieder healthy',
        en: 'Meilisearch now runs on the Hetzner server as a localhost-only Docker service and /api/health reports healthy again',
      },
    ],
  },
  {
    id: 'v0-1-1',
    version: '0.1.1',
    date: '2026-06-16',
    title: {
      de: 'Homepage- und Marktplatz-Hierarchie neu ausgerichtet',
      en: 'Homepage and marketplace hierarchy realigned',
    },
    changes: [
      {
        de: 'Homepage-CTAs von Geräte-Spenden auf Refurbished-Kauf und Reparatur-Suche umgestellt',
        en: 'Homepage CTAs moved from device donation to refurbished purchasing and repair discovery',
      },
      {
        de: 'Marktplatz-Mega-Menü priorisiert jetzt Shop, Community-Inserate, Techniker-Suche und Hilfe anfragen vor Angebots-/Mitmach-Pfaden',
        en: 'Marketplace mega menu now prioritizes shop, community listings, technician search, and help requests before supply/contribution paths',
      },
      {
        de: 'IT-Hilfe-Hub startet mit Techniker- und Werkstatt-Suche statt zuerst mit dem Anfrageformular',
        en: 'IT-Hilfe hub now starts with technician and workshop discovery instead of the request form',
      },
      {
        de: 'Blog-Rationale dokumentiert die Business-, Design- und Engineering-Entscheidung hinter der neuen Informationshierarchie',
        en: 'Blog rationale documents the business, design, and engineering decision behind the new information hierarchy',
      },
    ],
  },
  {
    id: 'v0-1-0',
    version: '0.1.0',
    date: '2026-06-15',
    title: {
      de: 'evig Plattform 0.1.0',
      en: 'evig Platform 0.1.0',
    },
    changes: [
      {
        de: 'Design-System-Migration abgeschlossen: Admin- und Dashboard-Oberflächen nutzen durchgängig semantische Tokens und card-shell',
        en: 'Design system migration complete: admin and dashboard surfaces now use semantic tokens and card-shell throughout',
      },
      {
        de: 'Legacy-CSS-Aliase entfernt — globals.css ist alleinige Quelle für Surface-, Text- und Akzent-Tokens',
        en: 'Removed legacy CSS aliases — globals.css is now the sole source for surface, text, and accent tokens',
      },
      {
        de: 'ESLint-Design-Regeln projektweit auf error: keine rohen Buttons/Inputs ausserhalb des UI-Kits',
        en: 'Project-wide ESLint design rules set to error: no raw buttons/inputs outside the UI kit',
      },
      {
        de: 'Overlay-Schatten auf shadow-xs vereinheitlicht; statische Karten ohne shadow-lg',
        en: 'Unified overlay shadows to shadow-xs; static cards no longer use shadow-lg',
      },
    ],
  },
  {
    id: 'v0-0-9',
    version: '0.0.9',
    date: '2026-06-14',
    title: {
      de: 'evig Plattform 0.0.9',
      en: 'evig Platform 0.0.9',
    },
    changes: [
      {
        de: 'ui-public-* Utilities auf Marketing-, Shop- und IT-Hilfe-Seiten ausgerollt',
        en: 'Rolled out ui-public-* utilities across marketing, shop, and IT-Hilfe pages',
      },
      {
        de: 'Semantische Design-Tokens für öffentliche Oberflächen — keine hardcodierten neutral-* Klassen mehr',
        en: 'Semantic design tokens on public surfaces — no more hardcoded neutral-* classes',
      },
      {
        de: 'Self-Host-Deploy-Skript und GitHub-Actions-Workflow für Hetzner dokumentiert',
        en: 'Self-host deploy script and GitHub Actions workflow for Hetzner documented',
      },
    ],
  },
  {
    id: 'v0-0-8',
    version: '0.0.8',
    date: '2026-06-10',
    title: {
      de: 'evig Plattform 0.0.8',
      en: 'evig Platform 0.0.8',
    },
    changes: [
      {
        de: 'Upcycling-Mini-Site refactoriert mit Scroll-Spy-Inhaltsverzeichnis auf dem Businessplan',
        en: 'Refactored upcycling mini-site with scroll-spy table of contents on the business plan',
      },
      {
        de: 'Navigation i18n-Fix: Projekte-Mega-Menü zeigt übersetzte Labels statt roher Schlüssel',
        en: 'Navigation i18n fix: projects mega-menu shows translated labels instead of raw keys',
      },
      {
        de: 'Techniker-Profilseiten und öffentliche Techniker-Liste überarbeitet',
        en: 'Technician profile pages and public technician list refreshed',
      },
      {
        de: 'Pro-Seiten og:image für Upcycling-Unterseiten — Social Shares zeigen Vorschaubilder',
        en: 'Per-page og:image for upcycling subpages — social shares now show preview images',
      },
    ],
  },
  {
    id: 'v0-0-7',
    version: '0.0.7',
    date: '2026-06-05',
    title: {
      de: 'evig Plattform 0.0.7',
      en: 'evig Platform 0.0.7',
    },
    changes: [
      {
        de: 'Admin-Protokoll-Votes werden in Tasks überführt; Legacy-Voting entfernt',
        en: 'Admin protocol votes now bridge into tasks; legacy voting removed',
      },
      {
        de: 'Task-Analytics-Seite entfernt; Task-Erstellungsformular komprimiert',
        en: 'Removed task analytics page; compressed task creation form',
      },
      {
        de: 'Auth-Dokumentation und Dashboard-Onboarding an live JWT-Stack angeglichen',
        en: 'Auth documentation and dashboard onboarding aligned with live JWT stack',
      },
    ],
  },
  {
    id: 'v0-0-6',
    version: '0.0.6',
    date: '2026-05-28',
    title: {
      de: 'evig Plattform 0.0.6',
      en: 'evig Platform 0.0.6',
    },
    changes: [
      {
        de: 'Erfassungs-Quick-Entry Hover-Klassen repariert',
        en: 'Fixed malformed quick-entry hover classes in device intake (Erfassung)',
      },
      {
        de: 'Admin-Interaktions-Hover auf SSOT-Utilities vereinheitlicht',
        en: 'Unified admin interactive hovers to SSOT utilities',
      },
      {
        de: 'Tasks-Standardfilter und Inline-Aktionen konsolidiert',
        en: 'Consolidated tasks default filter and inline actions',
      },
    ],
  },
];
