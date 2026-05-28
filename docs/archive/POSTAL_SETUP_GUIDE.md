# Postal Setup Guide - Open Source Email for RevampIT

**Date**: 2026-01-19
**License**: MIT (Fully Open Source)
**Estimated Setup Time**: 2-3 hours

---

## 🎯 Why Postal is Perfect for RevampIT

**Postal** is a modern, open-source email delivery platform built for sending emails at scale.

### ✅ Meets All Your Requirements

| Requirement | How Postal Delivers |
|-------------|---------------------|
| **Open Source** | ✅ MIT License - fully open, can fork/modify |
| **User-Friendly** | ✅ Beautiful modern web UI, easy to use |
| **Modern** | ✅ Built with Rails 7, Docker, active development |
| **AI Integration** | ✅ RESTful API, webhooks, perfect for automation |
| **All Use Cases** | ✅ Transactional, newsletters, notifications |
| **Cost** | ✅ Only server costs (~€10/month), unlimited emails |
| **Swiss/GDPR** | ✅ Host in Swiss or German data center |
| **Quality** | ✅ Professional features, tracking, analytics |

---

## 📊 What You Get with Postal

### Features
- ✅ **Unlimited emails** - No monthly caps
- ✅ **Beautiful UI** - Modern admin interface
- ✅ **Multiple organizations** - Multi-tenant ready
- ✅ **Message tracking** - Opens, clicks, bounces
- ✅ **Webhooks** - Real-time notifications
- ✅ **SMTP + HTTP API** - Use both protocols
- ✅ **IP pools** - Manage sender reputation
- ✅ **Suppression lists** - Manage bounces/complaints
- ✅ **Message retention** - Configurable storage
- ✅ **SPF/DKIM/DMARC** - Full email authentication

### Perfect for AI Automation
```typescript
// Send email via Postal API
const response = await fetch('https://postal.revampit.ch/api/v1/send/message', {
  method: 'POST',
  headers: {
    'X-Server-API-Key': process.env.POSTAL_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: [customer.email],
    from: 'support@revampit.ch',
    subject: aiResponse.subject,
    html_body: aiResponse.body
  })
});
```

---

## 🚀 Setup Plan

### Phase 1: Initial Setup (Today - 2 hours)
1. Get VPS server (Hetzner Germany)
2. Install Postal via Docker
3. Configure DNS records
4. Create admin account
5. Configure first mail server

### Phase 2: IP Warming (Week 1-4)
1. Start with 50 emails/day
2. Double every 3 days if good deliverability
3. Monitor bounces and spam complaints
4. Reach full volume in 2-4 weeks

### Phase 3: Production (Week 4+)
1. Full email sending capability
2. AI automation integration
3. Monitor and optimize

---

## 📋 Prerequisites

### What You Need
1. **VPS Server** (Hetzner recommended)
   - 2 GB RAM minimum (4 GB recommended)
   - 20 GB storage
   - Ubuntu 22.04 LTS
   - Cost: €4.49/month (CX22) or €7.79/month (CX32)

2. **Domain Access**
   - Ability to add DNS records to `revampit.ch`
   - We'll use subdomain: `postal.revampit.ch`

3. **Time**
   - 2-3 hours for initial setup
   - 15 minutes/week for monitoring

---

## 🛠️ Step-by-Step Setup

### Step 1: Get Hetzner VPS (10 minutes)

**Why Hetzner?**
- German company, EU data centers
- Excellent reputation
- Very affordable (€4.49/month)
- Near Switzerland (low latency)

**Process:**
1. Go to https://www.hetzner.com/cloud
2. Sign up for account
3. Create new project: "RevampIT Email"
4. Create server:
   - Location: **Falkenstein** or **Nuremberg** (Germany - closest to Zürich)
   - Image: **Ubuntu 22.04**
   - Type: **CX22** (2 vCPU, 4 GB RAM, €4.49/mo)
   - Volume: None needed
   - Network: Default
   - SSH Key: Add your SSH public key
   - Name: `postal-revampit`

5. Wait 1 minute for server to start
6. Note the IP address (e.g., 65.108.123.45)

---

### Step 2: Configure DNS Records (15 minutes)

Add these records to your `revampit.ch` domain:

```dns
# Main Postal subdomain
postal.revampit.ch.     A       65.108.123.45

# Sending domain records (for email authentication)
# Replace YOUR_POSTAL_DOMAIN_KEY with key from Postal setup

# SPF Record
@                       TXT     "v=spf1 a mx include:postal.revampit.ch ~all"

# DKIM Record (you'll get this from Postal later)
postal._domainkey       TXT     "v=DKIM1; t=s; p=YOUR_PUBLIC_KEY_HERE"

# DMARC Record
_dmarc                  TXT     "v=DMARC1; p=none; rua=mailto:postmaster@revampit.ch"

# Return path
psrp                    CNAME   postal.revampit.ch.
```

**Note**: We'll add the DKIM key after Postal is installed.

---

### Step 3: Install Postal (30 minutes)

SSH into your server:

```bash
ssh root@65.108.123.45
```

**Install Docker:**

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git apt-transport-https ca-certificates software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Install Postal:**

```bash
# Create directory
mkdir -p /opt/postal
cd /opt/postal

# Clone Postal
git clone https://github.com/postalserver/install /opt/postal/install
cd /opt/postal/install

# Run installer
./install.sh

# This will:
# - Download Postal Docker images
# - Create configuration files
# - Set up database
# - Create initial admin user
```

**Follow the prompts:**
- Web Hostname: `postal.revampit.ch`
- Email Domain: `revampit.ch`
- Admin Email: `admin@revampit.ch`
- Admin Password: (choose a strong password)

---

### Step 4: Start Postal (5 minutes)

```bash
# Start all services
cd /opt/postal
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f postal-web

# Wait for "Listening on 0.0.0.0:5000" message
```

**Verify it's running:**

Open browser: `http://65.108.123.45:5000`

You should see Postal login page.

---

### Step 5: Configure NGINX + SSL (20 minutes)

Install NGINX as reverse proxy with SSL:

```bash
# Install NGINX
apt install -y nginx certbot python3-certbot-nginx

# Create NGINX config
cat > /etc/nginx/sites-available/postal << 'EOF'
server {
    server_name postal.revampit.ch;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/postal /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart NGINX
systemctl restart nginx

# Get SSL certificate (wait for DNS to propagate first - 5 minutes)
certbot --nginx -d postal.revampit.ch --non-interactive --agree-tos -m admin@revampit.ch

# Verify SSL
systemctl restart nginx
```

**Access Postal:**

Now open: `https://postal.revampit.ch`

Should show secure HTTPS connection.

---

### Step 6: Initial Postal Configuration (15 minutes)

1. **Login:**
   - Go to `https://postal.revampit.ch`
   - Email: `admin@revampit.ch`
   - Password: (what you set during install)

2. **Create Organization:**
   - Click "Organizations" → "New Organization"
   - Name: `RevampIT`
   - Slug: `revampit`

3. **Create Mail Server:**
   - Click into RevampIT organization
   - "Mail Servers" → "New Mail Server"
   - Name: `RevampIT Production`
   - Mode: `Live`
   - Click "Create"

4. **Get API Key:**
   - Click into your mail server
   - "API Keys" → "New API Key"
   - Name: `Production API`
   - Copy the key (starts with `postal_`)
   - **Save this key** - you'll need it!

5. **Configure DKIM:**
   - Click "Domains" → "revampit.ch"
   - Copy the DKIM public key
   - Add to DNS as shown above
   - Click "Check DNS" to verify

6. **Configure Return Path:**
   - In Domains section
   - Copy the return path domain (e.g., `psrp.revampit.ch`)
   - Already added to DNS above
   - Click "Check DNS" to verify

---

### Step 7: Test Email Sending (10 minutes)

**Via Web UI:**

1. In Postal → Your Mail Server → "Send Message"
2. Fill in:
   - From: `test@revampit.ch`
   - To: (your personal email)
   - Subject: `Test from Postal`
   - Body: `This is a test email from RevampIT's Postal server!`
3. Click "Send"
4. Check your email (might be in spam for now - that's okay)

**Via SMTP (for Nodemailer):**

```bash
# Get SMTP credentials from Postal
# In Postal → Mail Server → "Credentials"
# Copy username and password

# Test with openssl
openssl s_client -connect postal.revampit.ch:25 -starttls smtp
```

---

### Step 8: Configure for Production (20 minutes)

**Update Vercel Environment Variables:**

```bash
# Email Configuration for Postal
EMAIL_HOST=postal.revampit.ch
EMAIL_PORT=25
EMAIL_SECURE=false  # We use STARTTLS
EMAIL_USER=<from Postal credentials>
EMAIL_PASS=<from Postal credentials>
EMAIL_FROM=noreply@revampit.ch

# Or use Postal HTTP API
POSTAL_API_KEY=postal_xxxxxxxxxxxxxxxx
POSTAL_API_URL=https://postal.revampit.ch/api/v1
```

**Update Nodemailer Config:**

Option A - Keep SMTP (easier, no code changes):
- Just update environment variables above
- Existing Nodemailer code works as-is

Option B - Use Postal HTTP API (more features):
```typescript
// src/lib/email-postal.ts
async function sendViaPostalAPI(options: EmailOptions) {
  const response = await fetch(`${process.env.POSTAL_API_URL}/send/message`, {
    method: 'POST',
    headers: {
      'X-Server-API-Key': process.env.POSTAL_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [options.to],
      from: options.from,
      subject: options.subject,
      html_body: options.html,
      plain_body: options.text
    })
  });

  return response.json();
}
```

---

## 🔥 IP Warming Strategy (Critical!)

**Why IP Warming?**
- New IP addresses have no reputation
- ISPs (Gmail, Outlook) are suspicious of new IPs
- Sending too many emails too fast = SPAM folder
- Proper warming = inbox delivery

### Week 1: Start Slow
```
Day 1:  50 emails
Day 2:  50 emails
Day 3:  100 emails
Day 4:  100 emails
Day 5:  200 emails
Day 6:  200 emails
Day 7:  300 emails
```

### Week 2: Ramp Up
```
Day 8:   500 emails
Day 10:  750 emails
Day 12:  1,000 emails
Day 14:  1,500 emails
```

### Week 3-4: Reach Full Volume
```
Day 16:  2,500 emails
Day 18:  4,000 emails
Day 21:  6,000 emails
Day 28:  Unlimited (monitor)
```

### Best Practices
- ✅ Send to engaged users first (people who signed up recently)
- ✅ Monitor bounce rate (<5% is good)
- ✅ Monitor spam complaints (<0.1% is good)
- ✅ If bounce rate spikes, slow down
- ✅ Warm up with transactional emails first (they have higher engagement)
- ❌ Don't send to old/inactive lists during warming
- ❌ Don't send marketing emails in first 2 weeks

---

## 📊 Monitoring & Maintenance

### Daily (First 2 Weeks)
- Check Postal dashboard
- Monitor bounce rate
- Check spam complaints
- View delivery statistics

### Weekly (Ongoing)
- Review email analytics
- Check server resources (CPU, memory, disk)
- Update Postal if new version available
- Backup configuration

### Monthly
- Review suppression lists
- Clean up old message data
- Optimize performance
- Plan for growth

---

## 🔧 Maintenance Commands

```bash
# Check Postal status
cd /opt/postal
docker compose ps

# View logs
docker compose logs -f postal-web

# Restart Postal
docker compose restart

# Update Postal
cd /opt/postal/install
git pull
./upgrade.sh

# Backup database
docker compose exec postal-mariadb mysqldump -u postal -p postal > backup.sql

# Check disk space
df -h

# Check email queue
# In Postal web UI → "Queues"
```

---

## 💰 Cost Breakdown

### Server Costs (Hetzner CX22)
- **Monthly**: €4.49
- **Annual**: €53.88
- **Emails**: Unlimited

### Additional Costs
- **Domain**: Already own revampit.ch (€0)
- **SSL**: Free (Let's Encrypt)
- **Software**: Free (open source)

**Total**: ~€54/year for unlimited emails

---

## 🤖 AI Integration Examples

### Example 1: AI Customer Support
```typescript
// src/lib/ai-support.ts
import { sendViaPostalAPI } from '@/lib/email-postal';

async function handleCustomerQuestion(email: string, question: string) {
  // Generate AI response
  const aiResponse = await generateAIResponse(question);

  // Send via Postal
  await sendViaPostalAPI({
    to: email,
    from: 'support@revampit.ch',
    subject: `Re: ${question}`,
    html: aiResponse.html,
    text: aiResponse.text
  });

  // Track in database
  await logSupportEmail(email, question, aiResponse);
}
```

### Example 2: Smart Newsletter Segmentation
```typescript
async function sendNewsletterWithAI() {
  const subscribers = await getNewsletterSubscribers();

  // AI segments users by interest
  const segments = await aiSegmentUsers(subscribers);

  for (const segment of segments) {
    // AI generates personalized content per segment
    const content = await aiGenerateNewsletter(segment.interests);

    // Batch send via Postal
    await sendBatchEmails(segment.users, content);
  }
}
```

### Example 3: Automated Bounce Handling
```typescript
// Webhook handler for Postal bounces
export async function POST(request: Request) {
  const event = await request.json();

  if (event.type === 'MessageBounced') {
    // AI analyzes bounce reason
    const analysis = await aiAnalyzeBounce(event.message);

    if (analysis.shouldRemove) {
      await removeFromMailingList(event.recipient);
    } else if (analysis.shouldRetry) {
      await scheduleRetry(event.message, analysis.retryDelay);
    }
  }
}
```

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Hetzner VPS created and running
- [ ] DNS records added and verified
- [ ] Postal installed and accessible via HTTPS
- [ ] DKIM, SPF, DMARC configured
- [ ] Test email sent and received
- [ ] API key generated and saved

### Vercel Configuration
- [ ] Add Postal SMTP credentials to Vercel
- [ ] Or add Postal API key to Vercel
- [ ] Update EMAIL_HOST, EMAIL_PORT, etc.
- [ ] Test email sending from staging

### Production Deployment
- [ ] Deploy to Vercel
- [ ] Test registration email flow
- [ ] Test password reset email
- [ ] Test newsletter subscription
- [ ] Monitor first 100 emails

### IP Warming
- [ ] Week 1 plan: 50-300 emails/day
- [ ] Week 2 plan: 500-1,500 emails/day
- [ ] Monitor bounce rates daily
- [ ] Adjust if deliverability issues

---

## 🆘 Troubleshooting

### Emails Going to Spam
- **Check**: DKIM, SPF, DMARC records in DNS
- **Check**: Sending reputation (too fast warming?)
- **Check**: Email content (avoid spammy words)
- **Solution**: Slow down sending, improve content

### High Bounce Rate
- **Check**: Email addresses valid?
- **Check**: DNS records correct?
- **Solution**: Clean email list, verify DNS

### Postal Not Sending
- **Check**: Docker containers running
- **Check**: Queue in Postal dashboard
- **Check**: Logs: `docker compose logs -f`
- **Solution**: Restart if needed

### Can't Access Web UI
- **Check**: NGINX running: `systemctl status nginx`
- **Check**: SSL certificate valid
- **Check**: DNS resolving correctly
- **Solution**: Check firewall, restart NGINX

---

## 📚 Resources

- **Postal Docs**: https://docs.postalserver.io
- **Postal GitHub**: https://github.com/postalserver/postal
- **Postal Community**: https://discord.gg/postal
- **Hetzner Docs**: https://docs.hetzner.com
- **Email Deliverability**: https://www.mail-tester.com

---

## ✅ Summary

**What You're Getting:**
- ✅ Fully open source (MIT license)
- ✅ Modern, beautiful UI
- ✅ Unlimited emails (~€5/month)
- ✅ Swiss/German hosting (GDPR)
- ✅ Perfect for AI automation
- ✅ All use cases covered
- ✅ Professional quality

**Timeline:**
- **Today**: 2-3 hours setup
- **Week 1-4**: IP warming (gradual sending)
- **Month 2+**: Full production capacity

**Ready to start?** I can help you through each step!
