# Auth Incident Runbook

## Objective
Restore login quickly and safely when users report authentication failures.

## 5-Minute Triage
1. **Check app health**
   - `GET /api/health/auth`
   - Expect `200` with `checks.authSecret=ok` and `checks.database=ok`
2. **Check recent auth errors**
   - Look for structured log events:
     - `AUTH_DB_UNAVAILABLE`
     - `AUTH_LOGIN_REJECTED`
3. **Check CI signal**
   - Verify latest `Auth Smoke Test` workflow status

## Failure Classification

### A) DB unavailable / timeout
Symptoms:
- Login page loops or generic failure
- Logs show `AUTH_DB_UNAVAILABLE`

Actions:
1. Verify DB credentials/env: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
2. Verify pool limits are not saturating DB
   - `DB_POOL_MAX` (default 10)
3. Re-test `GET /api/health/auth`

### B) Invalid credentials drift
Symptoms:
- Logs show `AUTH_LOGIN_REJECTED`
- User claims password should work

Actions:
1. Confirm account exists
2. Perform controlled password reset
3. Re-test browser login end-to-end
4. Ask user to rotate password if any credential was exposed in chat/logs

### C) Config/secret issue
Symptoms:
- Immediate auth failures after deploy
- Missing/invalid secret errors

Actions:
1. Verify `AUTH_SECRET` present and stable
2. Verify env injection in target environment
3. Redeploy after correction

## Hard Constraints
- Never commit or hardcode credentials.
- Do not log plaintext passwords.
- Prefer explicit failure with clear messages over silent redirect loops.

## Recovery Verification Checklist
- [ ] `/api/health/auth` healthy
- [ ] Login with known test account succeeds
- [ ] Session endpoint returns authenticated user
- [ ] CI auth smoke is green (or intentionally skipped if secrets not configured)

## Follow-up (Postmortem)
- Root cause category (DB / credentials / config / code)
- Time to detection
- Time to recovery
- Preventive change shipped
