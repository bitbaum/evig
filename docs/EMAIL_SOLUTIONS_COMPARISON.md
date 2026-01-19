# Email Solutions for RevampIT - Complete Comparison

**Date**: 2026-01-19
**Purpose**: Compare all viable email solutions for a Swiss non-profit

---

## 🎯 Your Requirements

1. **Free or very low cost** (non-profit budget)
2. **Open source friendly** (aligns with RevampIT mission)
3. **High quality** (professional, reliable)
4. **AI integration** (easy API for automation)
5. **Multiple use cases**: newsletters, support, auth, password reset, notifications
6. **Swiss/GDPR compliant** (you're based in Zürich)

---

## 📊 Complete Comparison Matrix

| Solution | Type | Free Tier | Monthly Cost | AI-Friendly | Setup Time | Deliverability | Open Source | GDPR |
|----------|------|-----------|--------------|-------------|------------|----------------|-------------|------|
| **Resend** | Cloud SaaS | 3,000/mo | $0-20 | ⭐⭐⭐⭐⭐ | 5 min | ⭐⭐⭐⭐⭐ | No (but APIs are) | ✅ |
| **Postal** | Self-hosted | Unlimited | $10-30 | ⭐⭐⭐⭐ | 2-3 hrs | ⭐⭐⭐⭐ | ✅ MIT | ✅ |
| **Brevo** | Cloud SaaS | 300/day | $0-25 | ⭐⭐⭐ | 10 min | ⭐⭐⭐⭐ | No | ✅ |
| **SendGrid** | Cloud SaaS | 100/day | $0-20 | ⭐⭐⭐⭐ | 10 min | ⭐⭐⭐⭐⭐ | No | ✅ |
| **Mailgun** | Cloud SaaS | 1,000/mo | $0-35 | ⭐⭐⭐⭐ | 10 min | ⭐⭐⭐⭐ | No | ✅ |
| **Mailcow** | Self-hosted | Unlimited | $10-30 | ⭐⭐⭐ | 4-6 hrs | ⭐⭐⭐⭐ | ✅ GPL | ✅ |
| **Mailu** | Self-hosted | Unlimited | $10-30 | ⭐⭐⭐ | 3-4 hrs | ⭐⭐⭐ | ✅ MIT | ✅ |
| **Mautic** | Self-hosted | Unlimited | $15-40 | ⭐⭐⭐⭐ | 2-3 hrs | ⭐⭐⭐ | ✅ GPL | ✅ |
| **Amazon SES** | Cloud Pay | N/A | ~$1/10k | ⭐⭐⭐⭐ | 30 min | ⭐⭐⭐⭐⭐ | No | ✅ |
| **Postmark** | Cloud SaaS | 100/mo | $0-15 | ⭐⭐⭐⭐ | 10 min | ⭐⭐⭐⭐⭐ | No | ✅ |

---

## 🔍 Detailed Analysis

### 1. Resend ⭐ (Recommended for Quick Start)

**What it is**: Modern email API built for developers

**Pros**:
- ✅ **Easiest setup** - 5 minutes from signup to sending
- ✅ **Generous free tier** - 3,000 emails/month (100/day)
- ✅ **Best developer experience** - Clean API, great docs
- ✅ **AI-perfect** - RESTful API, webhooks, batch sending
- ✅ **High deliverability** - Excellent sender reputation
- ✅ **React Email support** - Build templates with React (optional)
- ✅ **No credit card** - Free tier doesn't require card
- ✅ **Modern stack** - Built in 2023, uses latest tech

**Cons**:
- ❌ **Not open source** - Proprietary service
- ❌ **US-based** - Data processed in US (EU option available)
- ❌ **Vendor lock-in** - Migration requires work

**Best for**: Getting to production TODAY while evaluating long-term options

**Pricing**:
- Free: 3,000/month
- $20/month: 50,000 emails
- Non-profit discount: Request via support

**AI Integration Example**:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Send AI-generated email
await resend.emails.send({
  from: 'support@revampit.ch',
  to: customer.email,
  subject: aiResponse.subject,
  html: aiResponse.body
});
```

---

### 2. Postal ⭐⭐ (Recommended for Long-Term)

**What it is**: Self-hosted open-source mail server for sending

**Pros**:
- ✅ **Fully open source** - MIT license, full control
- ✅ **Unlimited emails** - Only server costs
- ✅ **Swiss hosting** - Deploy in Swiss data center
- ✅ **Beautiful UI** - Modern admin interface
- ✅ **Webhooks** - Track bounces, clicks, opens
- ✅ **Multi-tenant** - Can host for other organizations
- ✅ **API-first** - Good for AI automation
- ✅ **No monthly fees** - Only infrastructure costs

**Cons**:
- ❌ **Server management** - Need to maintain server
- ❌ **Setup complexity** - 2-3 hours initial setup
- ❌ **IP reputation** - Need to warm up sending IP
- ❌ **Email expertise** - Need to understand DKIM, SPF, DMARC
- ❌ **No support** - Community support only

**Best for**: Once you have tech resources and want full control

**Costs**:
- VPS (Hetzner Germany): €5-15/month
- Domain for sending: Free (use revampit.ch)
- Setup time: 2-3 hours one-time

**Setup Requirements**:
- Ubuntu server (2GB RAM minimum)
- Docker installed
- DNS access to add records
- Basic Linux knowledge

---

### 3. Brevo (formerly Sendinblue)

**What it is**: Marketing automation + transactional email platform

**Pros**:
- ✅ **Good free tier** - 300 emails/day (9,000/month)
- ✅ **Marketing features** - Newsletter builder, automation
- ✅ **Contact management** - CRM included
- ✅ **SMS support** - Can send SMS too
- ✅ **EU-based** - French company, GDPR native
- ✅ **Templates** - Drag & drop email builder

**Cons**:
- ❌ **Daily limit** - 300/day cap (can't send 1000 in one day)
- ❌ **Less developer-friendly** - More marketing-focused
- ❌ **Bloated interface** - Too many features for simple needs
- ❌ **Slower API** - Not as fast as Resend

**Best for**: If you need marketing automation more than transactional emails

**Pricing**:
- Free: 300 emails/day
- $25/month: 20,000 emails/month

---

### 4. SendGrid (Twilio)

**What it is**: Enterprise email delivery platform

**Pros**:
- ✅ **Established** - Industry standard since 2009
- ✅ **Excellent deliverability** - Top-tier reputation
- ✅ **Good API** - Well-documented, stable
- ✅ **Analytics** - Detailed tracking and reports
- ✅ **Twilio integration** - Can combine with SMS

**Cons**:
- ❌ **Smaller free tier** - Only 100 emails/day (3,000/month)
- ❌ **Complex pricing** - Hard to predict costs
- ❌ **Account suspensions** - Aggressive fraud detection
- ❌ **US-based** - Twilio is American company

**Best for**: If you're already using Twilio for other services

**Pricing**:
- Free: 100 emails/day
- $20/month: 50,000 emails

---

### 5. Mailgun

**What it is**: Developer-focused email API

**Pros**:
- ✅ **Good API** - Clean REST API
- ✅ **Email validation** - Built-in email verification
- ✅ **Flexible** - Good for complex workflows
- ✅ **Logs** - Detailed log retention

**Cons**:
- ❌ **Small free tier** - Only 1,000 emails/month trial
- ❌ **No permanent free tier** - Must upgrade after trial
- ❌ **More expensive** - $35/month minimum after trial
- ❌ **Complex setup** - DNS configuration required

**Best for**: If you need email validation features

**Pricing**:
- Trial: 1,000 emails (3 months)
- $35/month: 50,000 emails

---

### 6. Mailcow ⭐ (Self-Hosted Alternative)

**What it is**: Complete email server suite (receive + send)

**Pros**:
- ✅ **Full email server** - Can receive emails too
- ✅ **Open source** - GPL license
- ✅ **Docker-based** - Easy deployment
- ✅ **Webmail included** - SOGo webmail interface
- ✅ **Complete solution** - IMAP, SMTP, calendar, contacts
- ✅ **Active development** - Regular updates

**Cons**:
- ❌ **Complex** - Full mail server is overkill for just sending
- ❌ **Resource heavy** - Needs 4GB+ RAM
- ❌ **Maintenance** - Regular security updates needed
- ❌ **Spam management** - Need to handle incoming spam

**Best for**: If you want a complete email solution (sending AND receiving)

**Costs**:
- VPS: €15-30/month (needs more resources)
- Very powerful but complex for your needs

---

### 7. Amazon SES (Simple Email Service)

**What it is**: AWS email sending service

**Pros**:
- ✅ **Very cheap** - $0.10 per 1,000 emails
- ✅ **Scalable** - Handles millions of emails
- ✅ **Excellent deliverability** - Amazon reputation
- ✅ **AWS ecosystem** - Works with Lambda, etc.

**Cons**:
- ❌ **No free tier** - Pay-as-you-go only
- ❌ **AWS complexity** - Steep learning curve
- ❌ **No email builder** - Just sending, no UI
- ❌ **Sandbox mode** - Hard to get out of sandbox initially
- ❌ **US-based** - Amazon is American

**Best for**: If you're already on AWS and need millions of emails

**Pricing**:
- $1 per 10,000 emails
- ~$3/month for your volume

---

### 8. Postmark

**What it is**: Transactional email specialist

**Pros**:
- ✅ **Laser-focused** - Only transactional emails (no marketing)
- ✅ **Best deliverability** - 99%+ inbox rate
- ✅ **Beautiful UI** - Cleanest dashboard
- ✅ **Message streams** - Separate transactional/broadcast
- ✅ **Templates** - Good template system

**Cons**:
- ❌ **Tiny free tier** - Only 100 emails/month
- ❌ **Expensive** - $15/month minimum (10,000 emails)
- ❌ **No newsletters** - Transactional only on lower tiers

**Best for**: If deliverability is #1 priority and you have budget

**Pricing**:
- Free: 100 emails/month
- $15/month: 10,000 emails

---

### 9. Mautic (Self-Hosted Marketing Automation)

**What it is**: Open-source marketing automation platform

**Pros**:
- ✅ **Open source** - GPL license
- ✅ **Marketing automation** - Workflows, campaigns, segmentation
- ✅ **Self-hosted** - Full control
- ✅ **CRM features** - Contact management included
- ✅ **AI-ready** - API for automation

**Cons**:
- ❌ **Complex setup** - Needs database, server config
- ❌ **Heavy** - Requires dedicated server
- ❌ **Learning curve** - Many features to learn
- ❌ **Overkill** - Too much for simple transactional emails

**Best for**: If you want full marketing automation (more than just email)

**Costs**:
- VPS: €15-40/month
- Setup: 2-3 hours

---

### 10. Mailu (Self-Hosted Lightweight)

**What it is**: Lightweight self-hosted email server

**Pros**:
- ✅ **Open source** - MIT license
- ✅ **Lightweight** - Runs on 1GB RAM
- ✅ **Docker-based** - Easy setup
- ✅ **Simple** - Less complex than Mailcow
- ✅ **Free** - Only server costs

**Cons**:
- ❌ **Less features** - Basic compared to Mailcow
- ❌ **Smaller community** - Less support available
- ❌ **Full server** - Still overkill for just sending

**Best for**: Minimal self-hosted email server

**Costs**:
- VPS: €5-10/month

---

## 🎯 Decision Matrix

### For RevampIT Specifically

#### Current Needs (Month 1-3)
- ~1,000-2,000 emails/month
- Registration, verification, password reset
- Basic newsletters (100 subscribers)
- Customer support responses

#### Future Needs (Month 6+)
- ~5,000-10,000 emails/month
- AI-automated customer support
- Regular newsletters (500+ subscribers)
- Automated notifications
- Workshop confirmations

---

## 🏆 My Recommendation Strategy

### Phase 1: IMMEDIATE (Today) - Use Resend

**Why**:
1. ✅ **Get to production in 5 minutes** - No time wasted
2. ✅ **Free tier covers you for months** - 3,000/month is plenty
3. ✅ **Zero infrastructure** - No servers to manage
4. ✅ **Perfect AI integration** - Start building automation now
5. ✅ **Professional** - Emails land in inbox, not spam
6. ✅ **Reversible** - Easy to migrate later

**What you get**:
- Immediate email sending
- All your use cases covered
- Time to evaluate long-term options
- No upfront costs
- No technical debt

---

### Phase 2: EVALUATION (Month 3-6) - Monitor & Plan

**Track**:
- Email volume (how fast are you growing?)
- Use cases (what emails are you sending?)
- AI automation (how much can you automate?)
- Budget (can you afford $20/month or want $0?)

**Options to consider**:
1. **Stay with Resend** if:
   - Volume stays under 3,000/month (free)
   - OR you're okay with $20/month for 50,000
   - OR you get non-profit discount

2. **Move to Postal** if:
   - You want full control
   - You have tech resources
   - You want Swiss data hosting
   - You're sending 10,000+ emails/month

3. **Try hybrid** if:
   - Resend for transactional (auth, password reset)
   - Postal for newsletters (bulk)
   - Best of both worlds

---

### Phase 3: LONG-TERM (Month 6+) - Scale Decision

#### Option A: Stay Cloud (Resend)
**Choose if**:
- ✅ You want zero maintenance
- ✅ Budget is okay ($20-40/month)
- ✅ Focus on product, not infrastructure
- ✅ Want guaranteed deliverability

**Total Cost**: $0-240/year depending on volume

---

#### Option B: Go Self-Hosted (Postal)
**Choose if**:
- ✅ You want $0 monthly fees
- ✅ You have technical resources
- ✅ You value data sovereignty
- ✅ You're sending 10,000+ emails/month
- ✅ Open source is a priority

**Total Cost**: ~€60-180/year (server only)

**Setup**:
```bash
# Postal on Hetzner (German server, near Switzerland)
# €5/month = €60/year
# Unlimited emails
# 2-3 hours setup time
# Your data stays in EU
```

---

#### Option C: Hybrid Approach
**Choose if**:
- ✅ Want best of both worlds
- ✅ Have technical skills
- ✅ Want to optimize costs

**Setup**:
- **Resend**: Critical transactional (auth, password reset)
  - Guaranteed delivery
  - ~500 emails/month
  - Free tier

- **Postal**: Newsletters, bulk emails
  - Self-hosted
  - ~5,000+ emails/month
  - Server cost only

**Total Cost**: €60/year (server) + $0 (Resend free tier)

---

## 📊 Cost Comparison Over Time

### Year 1 Costs (Estimated 36,000 emails/year)

| Solution | Setup | Monthly | Annual | Notes |
|----------|-------|---------|--------|-------|
| **Resend Free** | $0 | $0 | **$0** | If under 3,000/mo |
| **Resend Paid** | $0 | $20 | **$240** | For 50k/mo allowance |
| **Postal** | 3 hrs | €10 | **€120** | Server + time |
| **SendGrid** | $0 | $20 | **$240** | Similar to Resend |
| **Brevo Free** | $0 | $0 | **$0** | If under 300/day |
| **Postmark** | $0 | $15 | **$180** | For 10k/mo |
| **Amazon SES** | 1 hr | $3 | **$36** | Cheapest but complex |

---

## 🎓 Final Recommendation

### START WITH: Resend (Today)

**Immediate Steps** (5 minutes):
1. Create account at https://resend.com
2. Get API key
3. Add to Vercel environment variables
4. Deploy

**Pros for RevampIT**:
- ✅ Free for first few months
- ✅ Deployed in 5 minutes
- ✅ Perfect for AI automation
- ✅ Professional quality
- ✅ No technical overhead
- ✅ Non-profit friendly

---

### EVALUATE: Postal (Month 3-6)

**When to Consider**:
- You're sending 5,000+ emails/month
- You want Swiss data hosting
- You have technical resources
- Open source is important

**Transition Plan**:
1. Set up Postal on Hetzner (German server)
2. Configure DNS, warm up IP
3. Test with newsletters first
4. Keep Resend for critical emails
5. Gradually move everything to Postal

---

### HYBRID OPTION: Both (Month 6+)

**Best of Both Worlds**:
- **Resend**: Critical emails (auth, password reset) - Always works
- **Postal**: Newsletters, bulk - Cost-effective, full control

---

## ✅ Action Plan for TODAY

1. **Create Resend account** (2 min)
   - Go to https://resend.com
   - Sign up with email
   - No credit card needed

2. **Get API key** (1 min)
   - Dashboard → API Keys
   - Create key with "Sending access"
   - Copy the key (re_xxx...)

3. **I'll configure Vercel** (2 min)
   - Add to environment variables
   - Deploy to production

4. **Test email sending** (5 min)
   - Send test registration email
   - Check inbox (not spam!)
   - Verify all flows work

---

## 🤔 Still Deciding? Quick Quiz

**Q: Do you want to deploy TODAY?**
- Yes → Use Resend

**Q: Do you have time to set up a server?**
- No → Use Resend
- Yes, later → Start with Resend, plan Postal

**Q: Is open source critical RIGHT NOW?**
- Yes → Set up Postal (2-3 hours)
- No, but important long-term → Resend now, Postal later

**Q: What's your email volume?**
- <3,000/month → Resend free tier
- 3,000-50,000/month → Resend paid ($20/mo)
- 50,000+/month → Self-hosted (Postal)

**Q: Do you have DevOps resources?**
- No → Definitely use Resend
- Yes → Your choice, but start with Resend for speed

---

## 📚 Summary Table

| Criteria | Resend | Postal | Brevo | SendGrid |
|----------|--------|--------|-------|----------|
| **Cost (Year 1)** | $0-240 | €120 | $0-300 | $0-240 |
| **Setup Time** | 5 min | 2-3 hrs | 10 min | 10 min |
| **Open Source** | ❌ | ✅ | ❌ | ❌ |
| **AI-Friendly** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Deliverability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Free Tier** | 3,000/mo | Unlimited | 300/day | 100/day |
| **Maintenance** | None | Medium | None | None |
| **Swiss Hosting** | No | Yes | No | No |
| **Start Today** | ✅ | ❌ | ✅ | ✅ |

---

**My recommendation: Start with Resend today, evaluate Postal in 3-6 months.**

This gives you:
- ✅ Immediate deployment
- ✅ Professional email sending
- ✅ AI-ready infrastructure
- ✅ Time to grow and decide
- ✅ Clear migration path to open source

**Ready to proceed with Resend?**
