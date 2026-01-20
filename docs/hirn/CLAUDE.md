# CLAUDE.md – Entwicklungsrichtlinien für das Revamp-Hirn

> **Für Claude Code und alle AI-Agenten.**
> Dieses Dokument ist die Single Source of Truth für Entwicklungspraktiken.

---

## Die Hirn-Methodologie

### Vision

Das **Hirn** ist eine Methodologie zur Automatisierung und Skalierung von Unternehmen durch:

1. **Strukturierte Wissensbasis** – Alles Wissen an einem Ort, maschinenlesbar
2. **First Principles Dokumentation** – Jeder Bereich mit Ziel, Constraints, Invarianten
3. **SSOT-Datenmanagement** – Eine Quelle der Wahrheit für alle Daten
4. **AI-Agent-Integration** – Agenten können autonom mit dem Kontext arbeiten

### Revamp-IT als Testfall

Dieses Repository ist die **Referenzimplementierung** der Hirn-Methodologie. Revamp-IT dient als Testumgebung, um die Methodik zu entwickeln und zu validieren, bevor sie auf andere Unternehmen angewendet wird.

```
Hirn-Methodologie (abstrakt)
         │
         ↓
Revamp-Hirn (Implementierung)    →    Andere Unternehmen
         │                                    │
         ↓                                    ↓
    Validierung                          Anwendung
    Iteration                            Skalierung
```

### Was automatisiert das Hirn?

| Bereich | Heute (manuell) | Mit Hirn (automatisiert) |
|---------|-----------------|--------------------------|
| **Finanzen** | Excel, manuelle Reports | CSV → Dashboard → Insights |
| **KPIs** | Sporadische Messung | Kontinuierliches Tracking |
| **Dokumentation** | Verstreut, veraltet | Strukturiert, aktuell |
| **Entscheidungen** | Ad-hoc | Datengetrieben |
| **Reporting** | Zeitaufwändig | Generiert |
| **Wissenstransfer** | Abhängig von Personen | Im System kodifiziert |

---

## Was ist dieses Repository?

Dieses Repository ist das **digitale Gehirn (Hirn)** von Revamp-IT – eine strukturierte Wissensbasis für Menschen und AI-Agenten. Es enthält:

- Geschäftsdokumentation und Strategie
- Finanzdaten und Analysen (CSV als SSOT)
- KPI-Framework und Tracking
- Interne Dashboards und Tools
- Workflows für Dokument- und Präsentationserstellung

**Geplante Umbenennung:** `Revamp-Hirn` → `revamp-hirn`

---

## Agent-Architektur

### Wie Agenten mit dem Hirn arbeiten

```
┌─────────────────────────────────────────────────────────────┐
│                         HIRN                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CLAUDE.md    │  │ 00_INDEX.md  │  │ CSV-Daten    │       │
│  │ (Regeln)     │  │ (Kontext)    │  │ (SSOT)       │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └────────────┬────┴────────────────┘                │
│                      ↓                                       │
│              ┌───────────────┐                               │
│              │ Agent-Kontext │                               │
│              └───────┬───────┘                               │
└──────────────────────│───────────────────────────────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        ↓              ↓              ↓
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Finanz- │   │ Content-│   │ Ops-    │
   │ Agent   │   │ Agent   │   │ Agent   │
   └─────────┘   └─────────┘   └─────────┘
```

### Agent-Typen (geplant)

| Agent | Aufgabe | Datenquellen |
|-------|---------|--------------|
| **Finanz-Agent** | Analysen, Forecasts, Anomalien | Finanzmodell/*.csv |
| **Content-Agent** | Berichte, Präsentationen, Texte | docs/, templates/ |
| **Ops-Agent** | Prozesse, Workflows, Automatisierung | workflows/, digihirn/ |
| **KPI-Agent** | Tracking, Alerts, Dashboards | KPI_Framework/*.csv |
| **Fundraising-Agent** | Pipeline, Anträge, Follow-ups | Fundraising_Pipeline.csv |

### Agent-Kontext-Prinzip

Jeder Agent erhält Kontext durch:

1. **CLAUDE.md** – Globale Regeln und Architektur
2. **00_INDEX.md** – Bereichsspezifischer Kontext (First Principles)
3. **CSV-Daten** – Aktuelle Zahlen und Fakten
4. **Verlauf** – Bisherige Entscheidungen und Änderungen

**Ziel:** Ein Agent kann ohne menschliche Einweisung verstehen:
- Was ist das Ziel dieses Bereichs?
- Welche Constraints gelten?
- Wo sind die Daten?
- Was wurde bereits entschieden?

### Autonomie-Stufen

```
Stufe 0: Informieren     → Agent zeigt Daten an
Stufe 1: Analysieren     → Agent erkennt Muster/Probleme
Stufe 2: Empfehlen       → Agent schlägt Aktionen vor
Stufe 3: Ausführen       → Agent führt mit Bestätigung aus
Stufe 4: Autonom         → Agent handelt selbstständig (mit Grenzen)
```

**Aktueller Stand:** Stufe 1-2 (Analyse und Empfehlungen)

---

## Replizierbarkeit: Hirn für andere Organisationen

### Das Wertversprechen

```
Revamp-IT Hirn (validiert)
         │
         ↓
    ┌────────────────────────────────────────┐
    │     Hirn-Methodologie (Framework)       │
    │  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
    │  │ Templates│ │ Patterns │ │ Tooling │ │
    │  └──────────┘ └──────────┘ └─────────┘ │
    └────────────────────────────────────────┘
         │
         ├──→ Organisation A (NGO)
         ├──→ Organisation B (KMU)
         └──→ Organisation C (Startup)
```

### Was ist übertragbar?

| Komponente | Revamp-IT spezifisch | Übertragbar |
|------------|---------------------|-------------|
| CLAUDE.md Struktur | ❌ | ✅ |
| 00_INDEX.md Pattern | ❌ | ✅ |
| First Principles Schema | ❌ | ✅ |
| CSV als SSOT | ❌ | ✅ |
| Agent-Architektur | ❌ | ✅ |
| Dashboard-Templates | ❌ | ✅ |
| Finanzmodell-Struktur | Teilweise | ✅ (anpassbar) |
| KPI-Framework | Teilweise | ✅ (anpassbar) |
| Konkrete KPIs | ✅ | ❌ (organisationsspezifisch) |
| Branchenwissen | ✅ | ❌ (muss neu erfasst werden) |

### Implementierung für neue Organisation

**Phase 1: Grundstruktur (Tag 1)**
```
neues-hirn/
├── CLAUDE.md              # Kopiert + angepasst
├── README.md              # Organisationsbeschreibung
└── 01_Management/
    ├── 00_INDEX.md        # First Principles definieren
    └── B_Finanzen/
        └── 00_INDEX.md    # Finanz-Kontext
```

**Phase 2: Datenstruktur (Woche 1)**
- CSV-Schemas für Finanzen definieren
- KPIs identifizieren und dokumentieren
- Bestehende Daten migrieren

**Phase 3: Dashboard (Woche 2)**
- hirn-site Templates anpassen
- Datenquellen verbinden
- Erste Visualisierungen

**Phase 4: Agenten (fortlaufend)**
- Agent-Kontext aufbauen
- Autonomie schrittweise erhöhen
- Workflows automatisieren

### Erfolgskriterien

Eine Hirn-Implementierung ist erfolgreich wenn:

1. **Wissen kodifiziert** – Neues Teammitglied findet alles selbstständig
2. **Daten zentralisiert** – Eine Quelle der Wahrheit, keine Excel-Inseln
3. **Agenten produktiv** – AI kann autonom sinnvolle Arbeit leisten
4. **Entscheidungen nachvollziehbar** – Dokumentierte Begründungen
5. **Skalierung möglich** – Mehr Last ohne proportional mehr Aufwand

---

## First Principles Denken

### Was sind First Principles?

First Principles (Grundprinzipien) ist eine Denkweise, die auf Aristoteles zurückgeht. Statt Probleme durch Analogie zu lösen ("so haben wir es immer gemacht"), zerlegt man sie in ihre fundamentalen Bestandteile und baut von dort neu auf.

**Beispiel:**
- **Analogie-Denken:** "Batterien kosten CHF 600/kWh, weil sie das immer gekostet haben."
- **First Principles:** "Woraus besteht eine Batterie? Kobalt, Nickel, Aluminium, Kohlenstoff, Polymere. Was kosten diese Rohstoffe an der Börse? ~CHF 80/kWh. Also können wir günstiger produzieren."

### Wie wir First Principles anwenden

Jeder Bereich in diesem Repository wird durch folgende Fragen strukturiert:

| Frage | Beschreibung |
|-------|--------------|
| **Ziel** | Was optimieren wir? (mit messbaren Metriken) |
| **Constraints** | Welche Einschränkungen existieren? (Recht, Kapazität, Geld, Zeit) |
| **Invarianten** | Was ist nicht verhandelbar? (Privacy, FOSS-first, etc.) |
| **Annahmen** | Welche Hypothesen testen wir? (explizit dokumentiert) |
| **Entscheidungen** | Was haben wir entschieden und warum? |
| **Abhängigkeiten** | Upstream (wovon hängen wir ab) / Downstream (wer hängt von uns ab) |

### Beispiel: 00_INDEX.md

Jeder Hauptordner hat eine `00_INDEX.md` mit YAML Front-Matter:

```yaml
---
id: FIN
area: B_Finanzen
owner: [TBD]
status: Aktiv
review_cycle: monthly
source_of_truth:
  - ./Finanzmodell/Actual_Income_Data.csv
upstream:
  - ../E_Personal_und_HR/HR_Roster.csv
downstream:
  - ../C_Kennzahlen/KPI_Dashboard.csv
---

# Finanzen – Index (First Principles)

## Goal
- Transparente Liquidität, Budgettreue, klare Mittelverwendung.

## Constraints
- Gemeinnützigkeitsregeln, Zahlungsziele, Spendenauflagen.

## Invariants
- CHF als Leitwährung; ISO-Datum; Trennung zugesagt vs. eingegangen.
...
```

---

## Architekturprinzipien

### 1. Single Source of Truth (SSOT)

**Daten werden einmal definiert und von dort referenziert.**

- **CSV-Dateien** sind die kanonischen Datenquellen
- **HTML/Dashboards** laden Daten aus CSV (nie hardcoded)
- **Markdown-Dokumente** referenzieren auf CSVs
- **Präsentationen** werden aus `source.md` generiert

**Datenquellen-Hierarchie:**
```
Finanzmodell/*.csv          → Finanzdaten (Einnahmen, Ausgaben, Budget)
KPI_Framework/*.csv         → KPI-Definitionen und Tracking
Personalwesen/*.csv         → Team-Daten
```

### 2. DRY (Don't Repeat Yourself)

- Informationen nicht duplizieren
- Gemeinsame Styles in geteilten CSS-Dateien
- Gemeinsame Funktionen in JS-Modulen
- Templates für wiederkehrende Dokumenttypen

### 3. Separation of Concerns (SoC)

```
hirn-site/              # Präsentation (Frontend)
├── assets/css/         # Nur Styling
├── assets/js/          # Nur Logik
└── pages/              # Nur Struktur

digihirn/               # Werkzeuge und Workflows
├── tools/              # Python-Tools
├── templates/          # Dokumentvorlagen
└── workflows/          # Prozessdokumentation

01_Management/          # Geschäftsdaten
├── B_Finanzen/         # Finanzdaten
└── C_Kennzahlen/       # KPI-Daten
```

### 4. Progressive Disclosure

Informationen werden in Schichten präsentiert:
1. **Dashboard** – Überblick auf einen Blick
2. **Kategorie-Seiten** – Vertiefung pro Bereich
3. **Detail-Seiten** – Vollständige Analyse
4. **Rohdaten** – CSV-Download

### 5. Modularity & Scalability

**Code-Organisation:**
- **Kleine Komponenten** (<200 Zeilen) mit einer Verantwortlichkeit
- **Wiederverwendbarkeit** durch Composition
- **Klare Interfaces** mit TypeScript
- **Testbarkeit** durch Dependency Injection

**Scalability:**
- Performance skaliert mit Wachstum (Code-Splitting, Lazy Loading)
- Team kann parallel arbeiten (klare Ownership)
- Neue Features einfach hinzuzufügen (modulare Architektur)

---

## Frontend-Architektur (Next.js 14+)

### Migration zu Next.js

**Status:** In Progress  
**Von:** Statische HTML-Dateien (hirn-site/)  
**Zu:** Next.js 14+ App Router (hirn-dashboard/)

**Ziel:** Professional, maintainable, scalable Frontend-Architektur

### Architekturprinzipien

1. **Server-First:** Server Components als Default
   - Schnellere Ladezeiten
   - Weniger Client-JavaScript
   - Direkte Backend-Zugriffe

2. **Type Safety:** 100% TypeScript (Strict Mode)
   - Fehler bei Compile-Time, nicht Runtime
   - Bessere IDE-Unterstützung
   - Self-documenting Code

3. **Component-Driven:** Reusable React Components
   - DRY: Keine Code-Duplikation
   - Testbar: Unit + Integration Tests
   - Wartbar: Kleine, fokussierte Komponenten

4. **Performance-Optimiert:**
   - Automatic Code-Splitting per Route
   - Image Optimization (Next.js Image)
   - Bundle Size Monitoring

### Folder Structure

```
hirn-dashboard/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root Layout (Nav, Footer)
│   ├── page.tsx            # Dashboard Home
│   ├── (dashboard)/        # Route Group
│   │   ├── finanzen/
│   │   ├── kennzahlen/
│   │   └── wirkung/
│   └── api/                # API Routes
│
├── components/             # React Components
│   ├── ui/                 # Primitives (shadcn/ui)
│   ├── layout/             # Nav, Footer, Sidebar
│   ├── charts/             # Data Visualization
│   ├── numbers/            # Number System
│   └── sections/           # Page Sections
│
├── lib/                    # Core Logic
│   ├── utils.ts
│   ├── types.ts
│   ├── number-sources.ts
│   └── first-principles.ts
│
├── hooks/                  # Custom React Hooks
└── stores/                 # Global State (Zustand)
```

### State Management Hierarchy

1. **URL State** (searchParams) → Shareable, bookmarkable
2. **Server State** (React Query) → Backend-Daten
3. **Global State** (Zustand) → App-weiter State (theme, modals)
4. **Component State** (useState) → Lokaler UI State

### Component Standards

**Alle Komponenten folgen:**
- Named Exports (nicht default)
- Props Interface mit TypeScript
- Max 200 Zeilen pro Komponente
- Loading/Error States
- Accessibility (ARIA, Keyboard Nav)

**Beispiel:**
```typescript
// components/numbers/ClickableNumber.tsx
'use client';

interface ClickableNumberProps {
  value: number | string;
  numberKey: string;
  format?: 'CHF' | 'percent' | 'number';
  className?: string;
}

export function ClickableNumber({
  value,
  numberKey,
  format = 'number',
  className,
}: ClickableNumberProps) {
  // Implementation
}
```

### Testing Requirements

- **Unit Tests:** Utilities, Hooks (Vitest)
- **Component Tests:** UI Components (React Testing Library)
- **E2E Tests:** Critical Flows (Playwright)
- **Coverage:** 70%+ für kritische Pfade

### Dokumentation

**Vollständige Best Practices:**
- [Frontend Best Practices](02_Technology/E_Development_Workflows/Frontend_Best_Practices.md)
- [Frontend Architecture](02_Technology/E_Development_Workflows/Frontend_Architecture.md)
- [Component Standards](02_Technology/E_Development_Workflows/Component_Standards.md)

---

## Sprache: Schweizer Hochdeutsch

### Regeln

| Regel | Beispiel richtig | Beispiel falsch |
|-------|------------------|-----------------|
| **Kein Eszett** | Strasse, Massnahme | Stra**ss**e, Ma**ss**nahme |
| **Umlaute sind OK** | Zürich, Präsentation, Übersicht | Zuerich, Praesentation |
| **UTF-8 Encoding** | ä, ö, ü direkt | ae, oe, ue |

### Warum?

In der Schweiz wird das Eszett nicht verwendet. Wir schreiben immer "ss" statt des deutschen Eszett. Umlaute (ä, ö, ü) sind jedoch Standard und werden direkt geschrieben, nicht als ae, oe, ue.

---

## Verzeichnisstruktur

```
revamp-hirn/                        # (aktuell: Revamp-Hirn)
├── CLAUDE.md                       # DIESE DATEI
├── README.md                       # Projektübersicht
│
├── hirn-site/                      # Internes Dashboard (NEU)
│   ├── index.html                  # Haupt-Dashboard
│   ├── assets/
│   │   ├── css/                    # Modulare Styles
│   │   └── js/                     # Data-Loader, Utils
│   └── pages/                      # Unterseiten
│
├── digihirn/                       # Tools und Workflows
│   ├── tools/                      # Python-Werkzeuge
│   ├── templates/                  # Dokumentvorlagen
│   └── workflows/                  # Prozesse
│
├── 01_Management/                  # Geschäftsdokumentation
│   ├── A_Strategie/
│   ├── B_Finanzen/
│   ├── C_Kennzahlen/
│   └── ...
│
├── 02_Technology/                  # Tech-Dokumentation
└── 03_Services/                    # Dienstleistungen
```

---

## Beziehung zu revamp-it (Webseite)

### Zwei separate Systeme

```
revamp-hirn (Nextcloud)          revamp-it (Webseite)
─────────────────────────        ────────────────────
Internes Gehirn                  Öffentliche Webseite
Team-zugänglich (Nextcloud)      Öffentlich im Internet
Analysen, Dashboards             Produkte, Services
Rohdaten (CSV)                   Aufbereitete Inhalte
Vertraulich                      Öffentlich
                    ↓
            Hirn generiert Content
            für die Webseite
```

### Pfade

| System | Pfad | Zugang |
|--------|------|--------|
| **Hirn** | `/home/g/Nextcloud/Revamp-Hirn/` | Nextcloud (Team) |
| **Webseite** | `/home/g/dev/revampit/` | Öffentlich |

**Geplant:** `Revamp-Hirn` → `revamp-hirn` umbenennen

### Datenfluss

```
┌─────────────────────────────────────────────────────────┐
│                    REVAMP-HIRN                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ CSV-Daten   │ →  │ hirn-site   │ →  │ Analysen    │ │
│  │ (SSOT)      │    │ Dashboard   │    │ Reports     │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                            │                            │
│                            ↓                            │
│                   ┌─────────────────┐                   │
│                   │ Export-Scripts  │                   │
│                   │ (digihirn)      │                   │
│                   └────────┬────────┘                   │
└────────────────────────────│────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────┐
│                    REVAMP-IT                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Öffentliche Webseite mit aufbereiteten Inhalten │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Was gehört wohin?

| Inhalt | Hirn | Webseite |
|--------|------|----------|
| Rohdaten (CSV) | ✅ | ❌ |
| Interne Dashboards | ✅ | ❌ |
| Finanzdetails | ✅ | ❌ |
| Team-Dokumentation | ✅ | ❌ |
| Öffentliche Wirkungsberichte | ✅ (Quelle) | ✅ (Publikation) |
| Produkt-Informationen | ❌ | ✅ |
| Kontaktformulare | ❌ | ✅ |
| SEO-Inhalte | ❌ | ✅ |

### Integration (Zukunft)

Das Hirn kann automatisiert Inhalte für die Webseite generieren:

1. **Wirkungszahlen** – aus CSV aggregiert, für Webseite formatiert
2. **Blogbeiträge** – Entwürfe im Hirn, Publikation auf Webseite
3. **Statistiken** – Aktuelle Zahlen aus Finanzmodell

**Wichtig:** Die Webseite zeigt nie vertrauliche Daten. Alles Öffentliche muss explizit exportiert werden.

---

## Entwicklungsworkflow

### Neue Seite erstellen

1. Lies diese CLAUDE.md
2. Prüfe, ob ähnliche Seiten existieren (DRY)
3. Nutze bestehende CSS-Komponenten
4. Lade Daten aus CSV (nie hardcoden)
5. Verwende korrektes Schweizer Hochdeutsch
6. Teste responsive Design

### Daten aktualisieren

1. Bearbeite die CSV-Quelle (SSOT)
2. Dashboard lädt automatisch aktualisierte Daten
3. Dokumentiere Änderungen im entsprechenden 00_INDEX.md

### Neue Analyse erstellen

1. Definiere Ziel und Metriken (First Principles)
2. Identifiziere Datenquellen
3. Erstelle Analyse im entsprechenden Ordner
4. Verlinke in 00_INDEX.md

---

## CSS-Architektur (hirn-site)

### Design Tokens (variables.css)

```css
:root {
  /* Farben */
  --color-primary: #1e40af;
  --color-secondary: #059669;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* Typografie */
  --font-family: 'Segoe UI', system-ui, sans-serif;

  /* Abstände */
  --space-4: 1rem;
  --space-6: 1.5rem;
}
```

### Komponenten-Klassen

```html
<!-- Metrik-Karte -->
<div class="metric-card">
  <span class="metric-value">CHF 125'000</span>
  <span class="metric-label">Jahresumsatz</span>
</div>

<!-- Datentabelle -->
<table class="data-table">
  <thead>...</thead>
  <tbody>...</tbody>
</table>

<!-- Status-Indikator -->
<span class="status status-success">Auf Kurs</span>
```

---

## JavaScript-Architektur (hirn-site)

### Data Loader

```javascript
// Daten aus CSV laden
const income = await DataLoader.load('income');
const yearTotal = income.sum('Total_Revenue');
```

### Utilities

```javascript
// Schweizer Formatierung
Utils.formatCHF(12500);       // "CHF 12'500"
Utils.formatPercent(0.125);   // "12.5%"
Utils.formatMonth('2025-01'); // "Januar 2025"
```

---

## Häufige Fehler vermeiden

| Fehler | Richtig |
|--------|---------|
| Daten hardcoden | Aus CSV laden |
| Eszett verwenden | ss schreiben |
| ae/oe/ue schreiben | ä/ö/ü verwenden |
| Inline-Styles | CSS-Klassen nutzen |
| Copy-Paste Code | Gemeinsame Module |
| Ohne SSOT arbeiten | CSV als Quelle |
| Analogie-Denken | First Principles |

---

## Ressourcen

- **DigiHirn System:** `./digihirn/README.md`
- **Knowledge Graph:** `./docs/knowledge-graph.md`
- **Glossar:** `./docs/glossary.md`
- **Templates:** `./digihirn/templates/`

---

## Kontakt & Governance

- **Repository Owner:** Management Team
- **Letzte Aktualisierung:** 2025-01-11
- **Review-Zyklus:** Monatlich

---

*"Vom Grundprinzip zur Lösung – für Menschen und AI."*
