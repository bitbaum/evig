/**
 * GET /api/payments/mock-redirect — generic dev mock checkout for NEW rails.
 *
 * Rails without a local sandbox (Taler, BTCPay) return a link here when
 * unconfigured. "Jetzt bezahlen" POSTs a NORMALIZED webhook
 * ({ referenceId, providerTxId, status, amount, currency }) to
 * `/api/payments/webhook/<provider>`, which the adapter reads via
 * `parseMockWebhook`. Blocked in production.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { APP_URL } from '@/config/urls'
import { GATEWAY_STATUS } from '@/config/gateway-status'
import { hasGateway } from '@/lib/payments/gateways'
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect'
import { escapeHtml } from '@/lib/utils/escape-html'

const SUPPORTED_CURRENCIES = new Set(['CHF', 'EUR'])

export async function GET(request: NextRequest) {
  // Dev only — never render a payment-bypassing page in production.
  if (process.env.NODE_ENV === 'production') {
    return apiForbidden('Mock not available in production')
  }

  const { searchParams } = new URL(request.url)
  const provider = (searchParams.get('provider') || '').slice(0, 32)
  if (!hasGateway(provider)) {
    return apiBadRequest('Unknown payment provider')
  }

  const rawReferenceId = searchParams.get('referenceId') || ''
  const rawAmount = searchParams.get('amount') || '0'
  const rawCurrency = searchParams.get('currency') || 'CHF'

  const referenceId = escapeHtml(rawReferenceId.slice(0, 64))
  const referenceIdRaw = rawReferenceId.slice(0, 64)
  const providerLabel = escapeHtml(provider)
  const currency = SUPPORTED_CURRENCIES.has(rawCurrency.toUpperCase()) ? rawCurrency.toUpperCase() : 'CHF'
  const amountFormatted = (Number(rawAmount) / 100).toFixed(2)

  const toSameOriginPath = (raw: string | null): string | null => {
    if (!raw) return null
    try {
      const u = new URL(raw, APP_URL)
      return u.origin === new URL(APP_URL).origin ? u.pathname + u.search : null
    } catch {
      return null
    }
  }
  const successUrl = sanitizeReturnTo(toSameOriginPath(searchParams.get('successUrl')), '/')
  const cancelUrl = sanitizeReturnTo(toSameOriginPath(searchParams.get('cancelUrl')), '/')

  const webhookUrl = `${APP_URL}/api/payments/webhook/${provider}`

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mock ${providerLabel} — Zahlung</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    h1 { font-size: 20px; color: #111827; margin-bottom: 8px; text-transform: capitalize; }
    .amount { font-size: 36px; font-weight: 700; color: #059669; margin: 16px 0; }
    .ref { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    .buttons { display: flex; gap: 12px; }
    button { flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .pay { background: #059669; color: white; }
    .cancel { background: #e5e7eb; color: #374151; }
    .status { margin-top: 16px; font-size: 14px; color: #6b7280; min-height: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">DEV MOCK</div>
    <h1>${providerLabel} Zahlung</h1>
    <p class="amount">${currency} ${amountFormatted}</p>
    <p class="ref">Referenz: ${referenceId}</p>
    <div class="buttons">
      <button class="pay" id="payBtn" onclick="handlePay()">Jetzt bezahlen</button>
      <button class="cancel" onclick="handleCancel()">Abbrechen</button>
    </div>
    <p class="status" id="status"></p>
  </div>
  <script>
    const webhookUrl = ${JSON.stringify(webhookUrl)};
    const successUrl = ${JSON.stringify(successUrl)};
    const cancelUrl = ${JSON.stringify(cancelUrl)};
    const referenceId = ${JSON.stringify(referenceIdRaw)};
    const txAmount = ${Number(rawAmount) || 0};
    const txCurrency = ${JSON.stringify(currency)};

    async function post(status) {
      const mockTxId = 'mock-' + (Math.floor(Math.random() * 900000) + 100000);
      // Normalized mock webhook body (parseMockWebhook reads this directly).
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: referenceId,
          providerTxId: mockTxId,
          status: status,
          amount: txAmount,
          currency: txCurrency,
        }),
      });
    }

    async function handlePay() {
      const btn = document.getElementById('payBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      status.textContent = 'Zahlung wird verarbeitet...';
      try {
        await post(${JSON.stringify(GATEWAY_STATUS.RESERVED)});
        status.textContent = 'Zahlung erfolgreich! Weiterleitung...';
        setTimeout(() => { window.location.href = successUrl; }, 500);
      } catch (err) {
        status.textContent = 'Fehler: ' + err.message;
        btn.disabled = false;
      }
    }

    async function handleCancel() {
      try { await post(${JSON.stringify(GATEWAY_STATUS.CANCELLED)}); } catch (e) {}
      window.location.href = cancelUrl;
    }
  </script>
</body>
</html>`

  logger.info('Mock payment page rendered', { provider, referenceId: referenceIdRaw, amount: rawAmount })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
