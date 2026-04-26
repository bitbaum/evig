/**
 * GET /api/payments/payrexx-mock-redirect — Dev mock for Payrexx payment page.
 *
 * Renders a minimal HTML page simulating Payrexx's hosted payment experience.
 * "Pay Now" triggers our webhook with reserved status, then redirects to success.
 * "Cancel" redirects to the cancel URL.
 *
 * Only active when PAYREXX_INSTANCE is not set (dev mode).
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { apiForbidden } from '@/lib/api/helpers';
import { APP_URL } from '@/config/urls';
import { PAYREXX_TRANSACTION_STATUS } from '@/lib/payments/payrexx-client';
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect';

/** Escape special HTML characters so user input can't break out of text content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SUPPORTED_CURRENCIES = new Set(['CHF', 'EUR']);

export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.PAYREXX_INSTANCE) {
    return apiForbidden('Mock not available in production');
  }

  const { searchParams } = new URL(request.url);
  const rawReferenceId = searchParams.get('referenceId') || '';
  const rawAmount = searchParams.get('amount') || '0';
  const rawCurrency = searchParams.get('currency') || 'CHF';

  // Defense-in-depth: even though this route is dev-only, sanitize all
  // user-controlled values that flow into HTML or window.location.
  const referenceId = escapeHtml(rawReferenceId.slice(0, 64));
  const referenceIdRaw = rawReferenceId.slice(0, 64); // for the JS-string context (JSON.stringify-encoded)
  const currency = SUPPORTED_CURRENCIES.has(rawCurrency.toUpperCase())
    ? rawCurrency.toUpperCase()
    : 'CHF';
  const amountFormatted = (Number(rawAmount) / 100).toFixed(2);
  const successUrl = sanitizeReturnTo(searchParams.get('successUrl'), '/');
  const cancelUrl = sanitizeReturnTo(searchParams.get('cancelUrl'), '/');

  const webhookUrl = `${APP_URL}/api/payments/payrexx-webhook`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mock Payrexx — Zahlung</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    h1 { font-size: 20px; color: #111827; margin-bottom: 8px; }
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
    <h1>Payrexx Zahlung</h1>
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

    async function handlePay() {
      const btn = document.getElementById('payBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      status.textContent = 'Zahlung wird verarbeitet...';

      try {
        const mockTxId = Math.floor(Math.random() * 900000) + 100000;
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction: {
              id: mockTxId,
              status: ${JSON.stringify(PAYREXX_TRANSACTION_STATUS.RESERVED)},
              referenceId: referenceId,
            },
          }),
        });
        status.textContent = 'Zahlung erfolgreich! Weiterleitung...';
        setTimeout(() => { window.location.href = successUrl; }, 500);
      } catch (err) {
        status.textContent = 'Fehler: ' + err.message;
        btn.disabled = false;
      }
    }

    function handleCancel() {
      window.location.href = cancelUrl;
    }
  </script>
</body>
</html>`;

  logger.info('Mock Payrexx payment page rendered', { referenceId: referenceIdRaw, amount: rawAmount });

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
