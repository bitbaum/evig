# Email Configuration Guide - RevampIT

**Last Updated:** 2026-02-12

Email is **REQUIRED** for the authentication system to work. Users cannot:
- Register accounts (email verification)
- Reset passwords
- Receive important notifications

This guide shows you how to configure email sending for development and production.

---

## Quick Start (Gmail for Development)

1. **Enable 2-Step Verification** on your Google Account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "RevampIT Dev"
   - Copy the 16-character password

3. **Add to `.env.local`**:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # App Password from step 2
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Test the configuration**:
   ```bash
   npm run dev
   # Try registering a new user
   # Check your inbox for verification code
   ```

---

## Email Provider Options

### Option 1: Gmail (Free, Easy for Development)

**Pros:**
- ✅ Free
- ✅ 500 emails/day limit
- ✅ Easy setup
- ✅ Reliable delivery

**Cons:**
- ❌ Not suitable for production (rate limits)
- ❌ Requires App Password setup
- ❌ Gmail branding in headers

**Setup:**
1. Follow "Quick Start" above
2. Make sure your Google account has 2FA enabled
3. Use App Password, NOT your regular password

**Configuration:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

---

### Option 2: SendGrid (Production Recommended)

**Pros:**
- ✅ 100 emails/day free tier
- ✅ Professional delivery
- ✅ Good deliverability
- ✅ Analytics dashboard

**Cons:**
- ❌ Requires signup
- ❌ Paid for high volume (>100/day)

**Setup:**

1. **Create SendGrid Account**:
   - Go to: https://sendgrid.com/free/
   - Sign up for free tier

2. **Create API Key**:
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "RevampIT Production"
   - Permissions: "Full Access" or "Mail Send"
   - Copy the key (starts with `SG.`)

3. **Verify Sender Email**:
   - Settings → Sender Authentication
   - Single Sender Verification (free) OR
   - Domain Authentication (requires DNS access)

4. **Add to `.env.local`**:
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey  # Literally the word "apikey"
   EMAIL_PASS=SG.your-actual-api-key
   EMAIL_FROM=noreply@revamp-it.ch  # Must be verified
   ```

---

### Option 3: AWS SES (High Volume Production)

**Pros:**
- ✅ $0.10 per 1,000 emails (very cheap)
- ✅ Unlimited sending (after verification)
- ✅ Enterprise reliability

**Cons:**
- ❌ Complex setup
- ❌ Requires AWS account
- ❌ Sandbox mode by default (must request production access)

**Setup:**

1. **Create AWS Account**:
   - Go to: https://aws.amazon.com/ses/
   - Sign up and verify identity

2. **Request Production Access**:
   - SES Dashboard → Account Dashboard
   - "Request Production Access" button
   - Fill out form (usually approved in 24-48 hours)

3. **Create SMTP Credentials**:
   - SES Dashboard → SMTP Settings
   - "Create SMTP Credentials"
   - Download credentials

4. **Verify Domain**:
   - SES Dashboard → Verified Identities
   - Add domain (revamp-it.ch)
   - Add DNS records

5. **Add to `.env.local`**:
   ```bash
   EMAIL_HOST=email-smtp.eu-central-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-smtp-username
   EMAIL_PASS=your-smtp-password
   EMAIL_FROM=noreply@revamp-it.ch
   ```

---

### Option 4: Postmark (Transactional Specialist)

**Pros:**
- ✅ Built for transactional emails
- ✅ Excellent deliverability
- ✅ 100 emails/month free

**Cons:**
- ❌ Limited free tier
- ❌ Paid only beyond 100/month

**Setup:**

1. **Create Account**:
   - Go to: https://postmarkapp.com/
   - Sign up for free tier

2. **Create Server**:
   - Servers → Create Server
   - Name: "RevampIT Production"
   - Server Type: "Transactional"

3. **Add Sender Signature**:
   - Sender Signatures → Add Signature
   - Email: noreply@revamp-it.ch
   - Verify email

4. **Get SMTP Credentials**:
   - Server → Credentials
   - Copy SMTP token

5. **Add to `.env.local`**:
   ```bash
   EMAIL_HOST=smtp.postmarkapp.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-server-api-token
   EMAIL_PASS=your-server-api-token  # Same as username
   EMAIL_FROM=noreply@revamp-it.ch
   ```

---

### Option 5: Listmonk (FOSS Self-Hosted)

**Pros:**
- ✅ Free and open source
- ✅ Self-hosted (full control)
- ✅ Newsletter + transactional in one
- ✅ No per-email costs

**Cons:**
- ❌ Requires server setup
- ❌ You manage deliverability
- ❌ More complex

**Setup:**

1. **Install Listmonk**:
   ```bash
   # Using Docker Compose (recommended)
   docker run -p 9090:9090 -d \
     -v listmonk-data:/listmonk \
     listmonk/listmonk:latest
   ```

2. **Access Dashboard**:
   - Open: http://localhost:9090
   - Default login: admin / listmonk

3. **Configure SMTP**:
   - Settings → SMTP
   - Add your SMTP provider (SendGrid, AWS SES, etc.)
   - Listmonk will relay through this

4. **Add to `.env.local`**:
   ```bash
   LISTMONK_ENABLED=true
   LISTMONK_URL=http://localhost:9090
   LISTMONK_USERNAME=admin
   LISTMONK_PASSWORD=your-password
   LISTMONK_FROM_EMAIL=noreply@revamp-it.ch
   LISTMONK_FROM_NAME=RevampIT

   # Still need SMTP for Listmonk to relay through
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=SG.your-key
   ```

---

## Testing Email Configuration

### Test Script

Create a test file to verify email works:

```bash
# Create test script
cat > test-email.js << 'EOF'
import { sendEmail } from './src/lib/email/index.ts';

async function test() {
  try {
    const result = await sendEmail({
      to: 'your-test-email@gmail.com',  // Change this
      subject: 'RevampIT Email Test',
      text: 'If you receive this, email is working!',
      html: '<p>If you receive this, <strong>email is working!</strong></p>',
    });

    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

test();
EOF

# Run test
node --loader tsx test-email.js
```

### Test via Registration

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Register a new user**:
   - Go to: http://localhost:3001/auth/register
   - Use your real email address
   - Complete registration

3. **Check your inbox**:
   - Look for email from RevampIT
   - Subject: "Willkommen bei RevampIT - E-Mail bestätigen"
   - Should contain a 6-digit verification code

4. **Enter verification code**:
   - Copy the 6-digit code from email
   - Paste into verification form
   - Click "Bestätigen"

### Test Password Reset

1. **Go to forgot password**:
   - http://localhost:3001/auth/forgot-password

2. **Enter your email**:
   - Submit form

3. **Check email for reset link**:
   - Subject: "Passwort zurücksetzen - RevampIT"
   - Click the reset link
   - Should take you to reset password page

---

## Email Templates

The app includes these email templates (all in Swiss German):

### Authentication Emails

1. **Verification Code** (`verificationCode`)
   - Sent: After registration
   - Contains: 6-digit code
   - Expires: 15 minutes
   - File: `src/lib/email/templates/auth.ts`

2. **Staff Verification** (`staffVerificationCode`)
   - Sent: After staff member registration (@revamp-it.ch)
   - Contains: 6-digit code + onboarding info
   - Expires: 15 minutes

3. **Welcome Email** (`welcome`)
   - Sent: After email verification
   - Contains: Getting started guide

4. **Staff Welcome** (`staffWelcome`)
   - Sent: After staff email verification
   - Contains: Admin dashboard link, team info

5. **Password Reset** (`passwordReset`)
   - Sent: After forgot password request
   - Contains: Reset link (1-hour expiry)

### Customizing Templates

Edit templates in: `/home/g/dev/revampit/src/lib/email/templates/auth.ts`

All templates include:
- ✅ Swiss German text (ä, ö, ü)
- ✅ HTML + plain text versions
- ✅ Responsive design
- ✅ RevampIT branding
- ✅ Security warnings

---

## Troubleshooting

### "Authentication failed" Error

**Problem:** SMTP credentials rejected

**Solutions:**
1. **Gmail**: Make sure you're using App Password, not regular password
2. **SendGrid**: Username should be literally "apikey"
3. **AWS SES**: Check region in hostname (e.g., `eu-central-1`)
4. **All**: Verify EMAIL_USER and EMAIL_PASS have no extra spaces

### Emails Go to Spam

**Problem:** Emails land in spam folder

**Solutions:**
1. **Verify sender domain**: Use proper domain authentication (SPF, DKIM, DMARC)
2. **Use professional provider**: SendGrid, AWS SES, or Postmark
3. **Avoid spam triggers**: Don't use all caps, excessive exclamation marks
4. **Send from verified domain**: noreply@revamp-it.ch instead of gmail.com

### "Connection timeout" Error

**Problem:** Cannot connect to SMTP server

**Solutions:**
1. **Check port**: Try 587 (recommended), 465, or 25
2. **Check EMAIL_SECURE**: Should be `false` for port 587
3. **Firewall**: Make sure outgoing SMTP is allowed
4. **VPN**: Some VPNs block SMTP ports

### No Email Received

**Problem:** Email not arriving in inbox

**Solutions:**
1. **Check spam folder**: May be filtered
2. **Check sent quota**: Gmail has 500/day limit
3. **Verify recipient**: Make sure email address is correct
4. **Check logs**: Look in terminal for email errors
5. **Test with another email**: Try different provider (Gmail, Outlook, ProtonMail)

### Rate Limit Errors

**Problem:** "Too many emails sent"

**Solutions:**
1. **Gmail**: 500 emails/day limit - switch to SendGrid for production
2. **SendGrid Free**: 100 emails/day - upgrade if needed
3. **Rate limiting**: Check `src/lib/auth/rate-limiter.ts` config

---

## Production Checklist

Before deploying to production:

- [ ] Email provider configured (NOT Gmail)
- [ ] Sender domain verified
- [ ] SPF, DKIM, DMARC records added to DNS
- [ ] EMAIL_FROM uses your domain (e.g., noreply@revamp-it.ch)
- [ ] Tested all email templates (registration, reset, verification)
- [ ] Emails not going to spam
- [ ] Rate limits appropriate for expected volume
- [ ] Monitoring set up for email failures
- [ ] Unsubscribe link added (if sending marketing emails)

---

## Recommended Setup by Environment

### Development
```bash
# Use Gmail with App Password (free, easy)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-dev-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=your-dev-email@gmail.com
```

### Staging
```bash
# Use SendGrid free tier (100/day)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.staging-key
EMAIL_FROM=staging@revamp-it.ch
```

### Production
```bash
# Use SendGrid or AWS SES
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.production-key
EMAIL_FROM=noreply@revamp-it.ch
```

---

## Support

If email is still not working after following this guide:

1. **Check logs**: Look in terminal for detailed error messages
2. **Test SMTP credentials**: Use a tool like https://www.smtper.net/
3. **Review code**: Check `/home/g/dev/revampit/src/lib/email/`
4. **Ask for help**: Create an issue with:
   - Email provider you're using
   - Full error message from logs
   - Steps you've already tried

---

**Last Updated:** 2026-02-12
**Maintained by:** RevampIT Team
