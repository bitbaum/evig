/**
 * Email deliverability probe
 *
 * Run with: npx tsx scripts/test-email.ts <recipient@example.com>
 *
 * WHY THIS CHECKS DNS: a relay answering `250 accepted` proves the credentials
 * work, not that anyone receives the mail. Brevo accepts messages from a sender
 * domain it has not authenticated and then drops them, so the SMTP conversation
 * succeeds while the inbox stays empty forever. That is precisely how evig's
 * production mail was silently dead: EMAIL_FROM was noreply@revampit.ch, a
 * domain with no SPF record and no Brevo DKIM key, and not one application
 * email had ever arrived.
 *
 * So this script reports the sender domain's authentication BEFORE sending, and
 * refuses to call a relay handoff "delivered".
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns/promises';
import * as nodemailer from 'nodemailer';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  PORT: parseInt(process.env.EMAIL_PORT || '587'),
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
  FROM: process.env.EMAIL_FROM || '',
  SECURE: process.env.EMAIL_SECURE === 'true',
};

/**
 * DKIM selectors are chosen by the mail provider and cannot be enumerated from
 * DNS, so absence here is only conclusive for a provider whose selector we
 * know. Brevo documents `brevo._domainkey`; the rest are common conventions
 * checked as a courtesy. A domain using some other selector is NOT broken —
 * saying otherwise would make this script cry wolf on healthy domains.
 */
const DKIM_SELECTORS = ['brevo', 'mail', 'default', 'k1'];

async function txtRecords(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(name);
    return records.map((chunks) => chunks.join(''));
  } catch {
    return [];
  }
}

/**
 * Report whether the sender domain authorises this relay. Returns false when
 * the domain is provably unauthenticated, so the caller can say so loudly
 * instead of reporting a cheerful 250.
 */
async function checkSenderDomain(from: string, relayHost: string): Promise<boolean> {
  const domain = from.split('@')[1];
  if (!domain) {
    console.log('  Sender has no domain — cannot authenticate');
    return false;
  }

  console.log(`Sender domain authentication for ${domain}:`);

  const spf = (await txtRecords(domain)).filter((r) => r.toLowerCase().startsWith('v=spf1'));
  console.log(spf.length ? `  SPF   : ${spf[0]}` : '  SPF   : MISSING');

  const dmarc = await txtRecords(`_dmarc.${domain}`);
  console.log(dmarc.length ? `  DMARC : ${dmarc[0]}` : '  DMARC : MISSING');

  const foundSelectors: string[] = [];
  for (const selector of DKIM_SELECTORS) {
    const key = await txtRecords(`${selector}._domainkey.${domain}`);
    if (key.length) foundSelectors.push(selector);
  }
  console.log(
    foundSelectors.length
      ? `  DKIM  : ${foundSelectors.join(', ')}`
      : `  DKIM  : none of the known selectors (${DKIM_SELECTORS.join(', ')})`
  );

  // Only claim a domain is unauthenticated where the evidence is conclusive:
  // a missing SPF record always is, and a missing `brevo` selector is when
  // Brevo is the relay we are actually sending through.
  const usingBrevo = relayHost.toLowerCase().includes('brevo');
  const problems: string[] = [];
  if (spf.length === 0) problems.push('no SPF record');
  if (usingBrevo && !foundSelectors.includes('brevo')) {
    problems.push('no brevo._domainkey DKIM record, but Brevo is the relay');
  }

  if (problems.length > 0) {
    console.log('');
    console.log(`  ⚠ ${domain} does not authenticate mail through this relay: ${problems.join('; ')}.`);
    console.log('    The relay will still answer 250 and the message will vanish.');
    console.log('    Fix: authenticate the sending domain with the provider and');
    console.log('    publish the SPF + DKIM records it gives you, then re-run.');
  } else if (!foundSelectors.length) {
    console.log('');
    console.log('  Note: no DKIM found under the selectors above, but providers choose');
    console.log('  their own — this is inconclusive rather than a failure.');
  }
  console.log('');
  return problems.length === 0;
}

async function testEmail() {
  const recipient = process.argv[2];
  if (!recipient || !recipient.includes('@')) {
    console.error('Usage: npx tsx scripts/test-email.ts <recipient@example.com>');
    process.exit(1);
  }

  console.log('Email configuration:');
  console.log('  Host  :', EMAIL_CONFIG.HOST);
  console.log('  Port  :', EMAIL_CONFIG.PORT);
  console.log('  User  :', EMAIL_CONFIG.USER);
  console.log('  From  :', EMAIL_CONFIG.FROM);
  console.log('  Secure:', EMAIL_CONFIG.SECURE);
  console.log('');

  if (!EMAIL_CONFIG.FROM || !EMAIL_CONFIG.USER || !EMAIL_CONFIG.PASS) {
    console.error('Incomplete SMTP configuration — set EMAIL_FROM, EMAIL_USER and EMAIL_PASS.');
    process.exit(1);
  }

  const authenticated = await checkSenderDomain(EMAIL_CONFIG.FROM, EMAIL_CONFIG.HOST);

  const transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.HOST,
    port: EMAIL_CONFIG.PORT,
    secure: EMAIL_CONFIG.SECURE,
    auth: {
      user: EMAIL_CONFIG.USER,
      pass: EMAIL_CONFIG.PASS,
    },
  });

  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('  Connection and credentials OK');
  } catch (error) {
    console.error('  SMTP connection failed:', error);
    process.exit(1);
  }

  const sentAt = new Date().toISOString();
  console.log(`\nSending to ${recipient}...`);

  try {
    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.FROM,
      to: recipient,
      subject: 'Email deliverability probe',
      text:
        'This is a deliverability probe sent by scripts/test-email.ts.\n\n' +
        'If it reached an inbox, the sending domain is configured correctly.\n' +
        'If it landed in spam, check the sender domain SPF/DKIM alignment.\n' +
        'If it never arrived at all, the relay accepted and dropped it.\n\n' +
        `Sent : ${sentAt}\n` +
        `Relay: ${EMAIL_CONFIG.HOST}:${EMAIL_CONFIG.PORT}\n` +
        `From : ${EMAIL_CONFIG.FROM}\n`,
    });

    console.log('  Relay accepted the message');
    console.log('  Message ID:', info.messageId);
  } catch (error) {
    console.error('  Failed to send:', error);
    process.exit(1);
  }

  console.log('');
  if (authenticated) {
    console.log(`Now confirm it actually arrived at ${recipient} — acceptance is not delivery.`);
  } else {
    console.log('The relay accepted the message, but the sender domain is NOT authenticated,');
    console.log('so expect it to be dropped or spam-filed. Treat this run as a FAILURE');
    console.log('until a message actually lands in the inbox.');
  }
}

testEmail();
