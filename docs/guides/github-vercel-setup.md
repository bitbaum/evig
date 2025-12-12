# GitHub + Vercel Deployment Setup Guide

**Created:** 2025-01-XX  
**Last Modified:** 2025-01-XX  
**Last Modified Summary:** Initial setup guide for GitHub Actions + Vercel deployment

This is a quick setup guide for configuring automated deployments from GitHub to Vercel.

## 🎯 Overview

This setup enables automatic deployment to Vercel whenever code is pushed to the `main` branch. The process includes:

1. **GitHub Actions** - Runs CI checks (lint, test, build)
2. **Vercel** - Automatically deploys from `main` branch
3. **Zero manual steps** - Fully automated workflow

## 📋 Prerequisites

- GitHub repository (already set up)
- Vercel account (free tier works)
- Node.js 20+ installed locally (for testing)

## 🚀 Step-by-Step Setup

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repository
5. Click **"Import"**

### Step 2: Configure Project Settings

In the project configuration screen:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `/` (leave as default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm ci` (recommended for CI/CD)

Click **"Deploy"** to create the initial deployment.

### Step 3: Configure Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add all required variables from your `.env.local`:

   **Required Variables:**
   ```
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-here
   AUTH_DB_HOST=your-db-host
   AUTH_DB_PORT=5432
   AUTH_DB_NAME=your-db-name
   AUTH_DB_USER=your-db-user
   AUTH_DB_PASSWORD=your-db-password
   ```

   **Optional Variables:**
   ```
   MEDUSA_API_URL=https://your-medusa-api.com
   NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER=false
   ```

3. Set environment for each variable:
   - **Production** - for main branch deployments
   - **Preview** - for PR preview deployments
   - **Development** - for local development (if using Vercel CLI)

### Step 4: Verify Vercel Configuration

The `vercel.json` file is already configured:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": true
    }
  }
}
```

This ensures:
- ✅ Main branch → Production deployment
- ✅ Pull requests → Preview deployments

### Step 5: Verify GitHub Actions

The repository includes `.github/workflows/ci.yml` which:
- Runs on every push to `main` or `develop`
- Runs on pull requests
- Performs linting and type checking
- Verifies the build succeeds

No additional configuration needed - it works automatically!

## ✅ Testing the Setup

### Test 1: Push to Main Branch

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify deployment"
git push origin main
```

**Expected Result:**
1. GitHub Actions runs (check Actions tab)
2. Vercel automatically deploys (check Vercel dashboard)
3. Deployment completes in ~2-3 minutes

### Test 2: Create a Pull Request

```bash
# Create feature branch
git checkout -b test/deployment

# Make a change
echo "# PR Test" >> README.md

# Push and create PR
git add README.md
git commit -m "test: PR deployment"
git push origin test/deployment
```

Then create a PR on GitHub.

**Expected Result:**
1. GitHub Actions runs on PR
2. Vercel creates preview deployment
3. Preview URL appears in PR comments

## 🔍 Monitoring Deployments

### GitHub Actions

- **Location:** Repository → Actions tab
- **What to check:** 
  - ✅ All jobs passing (lint, test, build)
  - ❌ Any failures need to be fixed before merge

### Vercel Dashboard

- **Location:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **What to check:**
  - Deployment status (Ready/Building/Error)
  - Build logs
  - Deployment URL
  - Performance metrics

### Deployment URLs

- **Production:** `https://revampit.vercel.app` (or your custom domain)
- **Preview:** Unique URL per PR (e.g., `revampit-git-feature-branch.vercel.app`)

## 🚨 Troubleshooting

### Vercel Not Deploying

**Problem:** Pushes to main don't trigger deployments

**Solutions:**
1. Check Vercel project settings → Git → Connected Repository
2. Verify `vercel.json` has `"main": true`
3. Check Vercel dashboard for error messages
4. Reconnect repository if needed

### Build Failures

**Problem:** Vercel build fails

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check Node.js version (should be 20+)

### GitHub Actions Failing

**Problem:** CI checks fail

**Solutions:**
1. Fix linting errors: `npm run lint`
2. Fix type errors: `npx tsc --noEmit`
3. Fix build errors: `npm run build`
4. Check workflow file syntax

### Environment Variables Missing

**Problem:** App works locally but fails on Vercel

**Solutions:**
1. Add missing variables in Vercel project settings
2. Ensure variables are set for "Production" environment
3. Check variable names match exactly (case-sensitive)
4. Redeploy after adding variables

## 📚 Next Steps

1. **Set up custom domain** (optional):
   - Go to Vercel project settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **Enable preview deployments** (already enabled):
   - Every PR gets a preview URL
   - Share with team for testing

3. **Set up monitoring**:
   - Configure Vercel Analytics
   - Set up error tracking (Sentry, etc.)
   - Monitor performance metrics

4. **Configure branch protection** (recommended):
   - Require CI checks to pass before merge
   - Prevent direct pushes to main
   - Require PR reviews

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Project Deployment Guide](../deployment.md)

---

**Setup Complete!** 🎉

Your repository is now configured for automated deployments. Every push to `main` will automatically deploy to production.
