# Betrieb Hardening Checklist (Tasks / Protokolle / Entscheidungen)

_Last updated: 2026-02-17_

## Objective
Bring `/admin/tasks`, `/admin/protocols`, `/admin/decisions` to production-grade quality with measurable gates aligned to `CLAUDE.md`.

## Quality Gates

### 1) Core Functionality
- [ ] Tasks: create/list/edit/request/attention/complete end-to-end
- [ ] Protocols: create/list/detail/process/finalize end-to-end
- [ ] Decisions: create/list/detail/discussion/voting/transition end-to-end
- [x] Admin route protection verified (`/admin/*` redirects to login when unauthenticated)

### 2) Resilience & UX
- [x] No infinite loading state on decisions list API failure
- [x] Decisions list shows actionable error state with retry
- [ ] Unified loading/empty/error/success patterns across all 3 areas

### 3) Notifications
- [x] Task request creates in-app notifications
- [x] Task attention flag creates in-app notifications
- [ ] Verify notifications surface correctly in UI (read/unread lifecycle)

### 4) CLAUDE.md Engineering Compliance
- [x] No `console.log` in Betrieb API/UI paths
- [x] Uses `logger` in touched API routes
- [x] Uses `TABLE_NAMES` in touched API routes
- [x] Uses parameterized SQL in touched API routes
- [ ] Full-project typecheck pass (pending long-run command completion)

### 5) Automated Validation
- [x] Targeted ESLint pass on changed files
- [x] Added regression tests for critical fixes (decisions error/retry + task notification helper)
- [ ] Expand automated tests to full tasks/protocols/decisions end-to-end critical paths
- [ ] Run E2E smoke (admin login + 3 Betrieb paths)

## Implemented in this hardening pass

1. **Decisions list hardening** (`src/app/admin/decisions/DecisionListClient.tsx`)
   - Added robust async loading flow (`try/catch/finally`)
   - Added explicit error state + retry button
   - Prevents stuck loading spinner on API/network failures

2. **Task notifications implemented**
   - Added shared helper: `createInAppNotifications()` in `src/lib/api/task-helpers.ts`
   - Wired into:
     - `src/app/api/tasks/[id]/request/route.ts`
     - `src/app/api/tasks/[id]/attention/route.ts`
   - Notifications created in `notifications` table with type=`system`, related to `task`

3. **Static quality checks**
   - Targeted ESLint pass completed on changed files.

4. **Regression tests added**
   - `src/app/admin/decisions/__tests__/DecisionListClient.test.tsx`
     - verifies error state and retry recovery path
   - `src/lib/api/__tests__/task-helpers.test.ts`
     - verifies notification insert call + recipient deduplication

## Remaining work to call this “perfect”

1. Run full typecheck to completion in CI-capable environment.
2. Execute full manual/E2E verification of the three Betrieb workflows.
3. Add regression tests for:
   - decision list error/retry behavior
   - task request + attention notification creation
4. Validate notification UX visibility and interaction in admin/client surfaces.

---

## Overnight Update – 2026-02-17 (George)

### Umgesetzt heute Nacht

1. **Root-Cause Fix für „Kein KI-Provider erreichbar“ (end-to-end, Protokoll-Pfad)**
   - `src/lib/ai/providers.ts`
     - Lädt System-Provider jetzt deterministisch via `DISTINCT ON (provider) ... ORDER BY is_default DESC, updated_at DESC`.
     - Respektiert `is_enabled` strikt (deaktivierte Provider werden nicht mehr still via `.env` reaktiviert).
     - Sauberes Verhalten bei deaktiviertem Ollama/Groq/OpenRouter (frühe, klare Fehlgründe statt zufälliger Netzwerk-Fallbacks).
   - `src/lib/ai/protocol-processing.ts`
     - Benutzerfehlertext verbessert: klarer Hinweis auf **Admin > Hirn** und API-Schlüssel-Prüfung.

2. **Admin Provider Settings/API-Key Persistence repariert**
   - `src/app/api/admin/hirn/providers/route.ts`
     - PATCH unterstützt jetzt robust:
       - `apiKey` speichern **ohne** sofortigen Default-Wechsel
       - `isEnabled` toggeln
       - `isDefault` nur wenn Provider aktiviert + erreichbar
     - Damit ist der Deadlock weg, wo ungültige/veraltete Keys nicht sauber gespeichert/korrigiert werden konnten.
   - `src/lib/hirn/providers/index.ts`
     - Neue Funktion `setProviderEnabled(...)` ergänzt.
   - `src/components/admin/HirnProviderSelector.tsx`
     - UI ergänzt: **„Key speichern“** direkt pro Cloud-Provider.
     - API-Key kann jetzt in der Admin-UI persistent gesetzt werden (nicht nur externen Link öffnen).

3. **DB-Härtung gegen doppelte System-Provider (wahrscheinlicher Prod-Blocker)**
   - Neue Migration: `scripts/db/migrations/036_hirn_provider_settings_uniqueness.sql`
     - Bereinigt doppelte `scope='system'` Provider-Zeilen (neueste gewinnt)
     - Erzwingt Eindeutigkeit via partiellen Unique Indexes
   - `src/app/api/admin/hirn/init/route.ts`
     - Auf `ON CONFLICT DO NOTHING` umgestellt, kompatibel mit partiellen Unique Indexes.

4. **Guided Step UX list/detail konsistent gemacht**
   - `src/lib/protocols/workflow.ts`
     - `getProtocolWorkflowStep(...)` akzeptiert jetzt Kontext (Status + unlinked tasks)
     - Review-Protokolle mit offenen Action Items mappen auf Schritt **„Aufgaben erstellen“**
   - `src/lib/services/protocols.ts`
     - List-Query erweitert um:
       - `unlinked_action_item_count`
       - `has_structured_notes`
   - `src/lib/schemas/protocols.ts`
     - `ProtocolListItem` um neue Felder erweitert
   - `src/app/admin/protocols/page.tsx`
     - Step-Filter + Workflow-Badge nutzen jetzt den echten Workflow-Kontext statt nur Status
   - `src/lib/protocols/__tests__/workflow.test.ts`
     - Regression-Test für Mapping auf `tasks` ergänzt

### Verifikation (Tests/Lint)

- ✅ `npx eslint` auf allen angepassten Dateien: **pass**
- ✅ `npm test -- src/lib/protocols/__tests__/workflow.test.ts src/lib/ai/__tests__/protocol-processing.test.ts`: **pass**
- ✅ `npm test -- src/app/admin/protocols/\[id\]/__tests__/ProtocolDetailClient.test.tsx --passWithNoTests`: **pass**
- ⚠️ `npm run typecheck`: gestartet, aber im verfügbaren Zeitfenster nicht abgeschlossen (langlaufend)

### Browser Smoke

- ⚠️ Blockiert durch Infrastruktur: `http://localhost:3001/admin/protocols` war nicht erreichbar (`ERR_CONNECTION_REFUSED`)
- Mitigation: Für nächste Runde zuerst App-Stack hochfahren (`npm run d` oder definierter CI Preview URL), dann Smoke auf:
  - Admin Login
  - `/admin/protocols` List + Schritt-Filter
  - `/admin/protocols/[id]` Stepper/Guidance
  - Protokoll-Verarbeitung inkl. Provider-Fehlerfall

### Noch offen / verbleibende Prod-Risiken

1. **Migration 036 muss auf Prod ausgeführt werden**, sonst können doppelte System-Provider weiterhin zu nicht-deterministischem Runtime-Verhalten führen.
2. **Typecheck voll durchlaufen lassen** in stabiler CI/Build-Umgebung.
3. **Live-Smoke nach Deploy** (inkl. echter API-Key Rotation in Admin > Hirn und anschliessende Protokoll-Verarbeitung).

