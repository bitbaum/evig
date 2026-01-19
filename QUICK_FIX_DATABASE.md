# QUICK FIX: Self-Hosted Database Connection

**Time**: 5 minutes
**Result**: Team can register and use the site immediately

---

## Problem

The Vercel CLI added invisible newline characters to the database environment variables, breaking the connection to your self-hosted PostgreSQL.

## Solution

Fix the environment variables manually in the Vercel dashboard (avoids CLI bug).

---

## Step-by-Step Fix

### 1. Login to Vercel (1 min)
Go to: https://vercel.com/orangecat/revampit/settings/environment-variables

### 2. Delete Broken Variables (1 min)
Delete these variables (they have newlines):
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`

### 3. Add Correct Variables (2 min)

Click "Add New" for each and enter EXACTLY:

**DB_PORT**
- Key: `DB_PORT`
- Value: `63637`
- Environment: Production ✓
- Click "Save"

**DB_NAME**
- Key: `DB_NAME`
- Value: `revampit_cms`
- Environment: Production ✓
- Click "Save"

**DB_USER**
- Key: `DB_USER`
- Value: `postgres`
- Environment: Production ✓
- Click "Save"

**DB_PASSWORD**
- Key: `DB_PASSWORD`
- Value: `postgres`
- Environment: Production ✓
- Click "Save"

**DB_SSL**
- Key: `DB_SSL`
- Value: `false`
- Environment: Production ✓
- Click "Save"

### 4. Verify DB_HOST (30 sec)

Check that `DB_HOST` exists and equals: `bore.pub` (no newline)

If it has a newline, delete and re-add:
- Key: `DB_HOST`
- Value: `bore.pub`
- Environment: Production ✓

### 5. Redeploy (1 min)

In terminal:
```bash
cd /home/g/dev/revampit
vercel --prod
```

Wait ~1 minute for deployment.

### 6. Test Registration (30 sec)

Go to: https://revampit.vercel.app/auth/register

Try registering with:
- Name: Test User
- Email: test@example.com
- Password: test1234

Should work! ✅

---

## What This Does

Your self-hosted PostgreSQL on your laptop will be accessible from Vercel production:

```
Your Laptop (Frauenfeld)
  ├─ PostgreSQL :5433
  └─ bore tunnel → bore.pub:63637
         ↓
    Vercel Production
```

Later you can move the database to your datacenter server:

```bash
# Export from laptop
pg_dump -h localhost -p 5433 -U postgres revampit_cms > backup.sql

# Import to datacenter
psql -h datacenter-host -U postgres revampit_cms < backup.sql

# Update Vercel env vars to point to datacenter
# Done! ✅
```

---

## Tunnel Status Check

The bore tunnel must be running. Check:

```bash
ps aux | grep bore | grep -v grep
```

Should show:
```
/tmp/bore local 5433 --to bore.pub
```

If not running, restart it:
```bash
/tmp/bore local 5433 --to bore.pub &
```

---

## After This Works

1. ✅ Your team can register and use the site
2. ✅ All data stored in YOUR PostgreSQL (self-hosted)
3. ✅ Easy to move to datacenter later
4. ✅ Free and open source
5. ✅ No cloud dependencies

Just keep your laptop running while the team tests. When you move to the datacenter, just:
- Export database
- Import to datacenter PostgreSQL
- Update 1 env var (DB_HOST)
- Done!

---

## Summary

**Current**: Laptop PostgreSQL → bore tunnel → Vercel ✅
**Future**: Datacenter PostgreSQL → Cloudflare tunnel → Vercel ✅

Same self-hosted approach, just different location!
