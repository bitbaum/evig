# RevampIT Deployment Guide

**Created:** 2024-12-29  
**Last Modified:** 2025-01-XX  
**Last Modified Summary:** Added GitHub Actions + Vercel automated deployment setup

This guide covers multiple deployment methods for RevampIT:
1. **GitHub + Vercel (Recommended)** - Automated CI/CD from main branch
2. **Manual CLI Deployment** - Local deployment using scripts

## 🚀 Method 1: GitHub + Vercel Automated Deployment (Recommended)

This is the recommended approach for production deployments. Every push to the `main` branch automatically triggers:
- Code quality checks (linting, type checking)
- Build verification
- Automatic deployment to Vercel

### Initial Setup

1. **Connect GitHub Repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: `/` (project root)
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm ci`

2. **Configure Environment Variables:**
   - In Vercel project settings, add all required environment variables
   - These should match your `.env.local` file (but never commit secrets!)
   - Required variables:
     - `NEXTAUTH_URL` - Production URL
     - `NEXTAUTH_SECRET` - Secure random string
     - `AUTH_DB_*` - Database connection strings
     - Any other environment variables your app needs

3. **Verify Vercel Configuration:**
   - The `vercel.json` file is already configured to deploy from `main` branch
   - Vercel will automatically detect pushes to `main` and deploy

4. **GitHub Actions CI/CD:**
   - The repository includes `.github/workflows/ci.yml` for automated checks
   - Runs on every push and pull request
   - Ensures code quality before deployment

### How It Works

1. **Developer pushes to main branch:**
   ```bash
   git push origin main
   ```

2. **GitHub Actions runs:**
   - Linting and type checking
   - Build verification
   - Test execution (if configured)

3. **Vercel automatically deploys:**
   - Detects the push to `main` branch
   - Builds the application
   - Deploys to production
   - Provides deployment URL

### Deployment Workflow

```
Developer → Push to main → GitHub Actions (CI) → Vercel (Deploy) → Production
```

### Monitoring Deployments

- **GitHub Actions:** Check `.github/workflows/ci.yml` status in GitHub
- **Vercel Dashboard:** View deployments at [vercel.com/dashboard](https://vercel.com/dashboard)
- **Deployment URLs:** 
  - Current production app: `https://revampit.orangecat.ch`
  - Preview: Each PR gets a preview deployment URL

### Troubleshooting GitHub + Vercel Setup

**Vercel not deploying automatically:**
- Verify GitHub integration in Vercel project settings
- Check that `vercel.json` has `"main": true` in git.deploymentEnabled
- Ensure repository is properly connected in Vercel

**Build failures:**
- Check Vercel build logs in dashboard
- Verify all environment variables are set
- Ensure `package.json` build script is correct

**GitHub Actions failing:**
- Check workflow logs in GitHub Actions tab
- Fix linting/type errors locally first
- Ensure Node.js version matches (currently 20)

---

## 🛠️ Method 2: Manual CLI Deployment

This guide will help you set up the **fully automated** deployment system using local scripts. Just type `w` + Enter and your website deploys automatically - no prompts, no questions, zero manual steps!

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-deploy-keybind.sh
   ```

2. **Choose your preferred method (recommended: option 5 - All of the above)**

3. **Install prerequisites:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Install GitHub CLI (Ubuntu/Debian)
   sudo apt install gh
   
   # Login to services
   vercel login
   gh auth login
   vercel link
   ```

4. **Test the deployment:**
   ```bash
   # Try any of these:
   w                    # Short alias
   deploy              # Descriptive alias
   npm run deploy      # NPM script
   ./deploy.sh         # Direct execution
   ```

## 🎯 What You Get

### Instant Deployment
- Press `w` or `Ctrl+W` to deploy
- Fully automated best-practices workflow
- Real-time status updates with colors
- Automatic error handling and retries

### Smart Workflow
- ✅ Auto-commits uncommitted changes (with timestamp)
- ✅ Auto-creates feature branches (avoids direct main pushes)
- ✅ Runs linting and build tests
- ✅ Auto-creates and merges Pull Requests (with GitHub CLI)
- ✅ Monitors Vercel deployment with retries
- ✅ Shows deployment status and logs
- ✅ **Zero prompts - completely automated!**

### Error Handling
- Automatic retry on deployment failures (up to 3 times)
- Detailed error messages with troubleshooting hints
- Deployment log monitoring
- Graceful fallback to manual steps

### Complete Transparency
- ✅ **See actual command output** from linting and builds
- ✅ **View real-time git commands** being executed  
- ✅ **Get clickable links** to GitHub, PRs, and deployments
- ✅ **Monitor live deployment** with Vercel dashboard links
- ✅ **Verify every step** - no hidden processes
- ✅ **Copy commands** to run manually if needed

## 🔧 Setup Options Explained

### Option 1: Bash Key Binding
- Press `Ctrl+W` in bash terminal to deploy
- Works in any bash terminal session
- Requires restart or `source ~/.bashrc`

### Option 2: Terminal Aliases
- Type `w` or `deploy` in any terminal
- Works from any directory
- Simple and intuitive

### Option 3: Tmux Key Binding
- Press `tmux-prefix + w` to deploy
- Great for tmux users
- Requires tmux configuration reload

### Option 4: Desktop Entry
- Creates system application entry
- Can be bound to global keyboard shortcuts
- Works system-wide, not just in terminal

### Option 5: All Methods
- **Recommended**: Sets up all options above
- Maximum flexibility
- Use whatever method suits the moment

## 📋 Prerequisites Setup

### Required Tools

```bash
# Node.js and npm (should be installed)
node --version
npm --version

# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project to Vercel
vercel link
```

### Optional but Recommended

```bash
# Install GitHub CLI for automatic PR handling
sudo apt install gh

# Login to GitHub
gh auth login

# Test GitHub access
gh repo view
```

## 🔍 How It Works

### The Deployment Process

1. **Pre-flight Checks**
   - Verifies git repository
   - Checks for uncommitted changes
   - Prompts for commit message if needed

2. **Branch Management**
   - Creates feature branch if on main
   - Handles branch naming conventions
   - Follows git workflow best practices

3. **Quality Checks**
   - Runs `npm run lint`
   - Runs `npm run build`
   - Exits on build failures

4. **Git Operations**
   - Pushes branch to origin
   - Creates Pull Request (if GitHub CLI available)
   - Auto-merges PR
   - Updates main branch

5. **Deployment Monitoring**
   - Monitors Vercel deployment status
   - Shows real-time progress
   - Displays deployment logs
   - Retries on failures

6. **Success Summary**
   - Shows deployment URL
   - Lists completed actions
   - Provides next steps

## 🎨 Terminal Output

The script provides colorful, clear output:
- 🟢 **Green**: Success messages
- 🔵 **Blue**: Information and progress
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors

Example output with **complete transparency**:
```
🚀 RevampIT Automated Deployment
==================================================
🚀 Starting fully automated deployment process...
📅 Started at: Sun Dec 29 15:30:45 CET 2024
📁 Repository: yourusername/revampit
👉 GitHub: https://github.com/yourusername/revampit

🔧 Running Quality Checks
==================================================
🔍 Running ESLint (you can see the actual output)...
Command: npm run lint
----------------------------------------
✅ Linting passed!

🏗️  Running build test (you can see the actual output)...
Command: npm run build
----------------------------------------
✅ Build successful!

📤 Git Operations  
==================================================
Command: git push origin feature/auto-deploy-20241229-153045
----------------------------------------
✅ Branch pushed successfully!
👉 View branch on GitHub: https://github.com/yourusername/revampit/tree/feature/auto-deploy-20241229-153045

🔍 Monitoring Vercel Deployment
==================================================
👉 Monitor deployment live at: https://vercel.com/dashboard
Command: vercel ls --limit 3
----------------------------------------
🎉 Deployment successful!
Your website is live!

🎉 Deployment Complete!
==================================================
🔗 Important Links (Click to Open)
📁 GitHub Repository: https://github.com/yourusername/revampit
🚀 Vercel Dashboard: https://vercel.com/dashboard  
🌐 Production app: https://revampit.orangecat.ch
```

## 🚨 Troubleshooting

### Common Issues

**"Command not found: w"**
- Run `source ~/.bashrc` or restart terminal
- Verify setup completed successfully

**"Not in a git repository"**
- Ensure you're in the project directory
- Check if `.git` folder exists

**"Build failed"**
- Fix linting/build errors first
- Run `npm run lint` and `npm run build` manually

**"GitHub CLI not available"**
- Install with: `sudo apt install gh`
- Or manually create PRs as instructed

**Deployment monitoring fails**
- Install Vercel CLI: `npm install -g vercel`
- Login: `vercel login`
- Link project: `vercel link`

### Getting Help

1. Check the detailed documentation: `docs/DEPLOYMENT.md`
2. Run with verbose output: `./deploy.sh --help`
3. Check script logs and error messages
4. Ensure all prerequisites are installed

## 🔄 Updates and Maintenance

The deployment scripts are designed to be:
- **Self-contained**: All logic in the scripts
- **Maintainable**: Clear functions and comments
- **Extensible**: Easy to modify for your needs
- **Robust**: Error handling and recovery

To update the scripts:
1. Modify `deploy.sh` or `setup-deploy-keybind.sh`
2. Test changes with `./deploy.sh`
3. Update this documentation if needed

## 📚 Additional Resources

- [Full Deployment Documentation](docs/DEPLOYMENT.md)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project README](README.md)

---

## 🔄 Choosing Your Deployment Method

### When to Use GitHub + Vercel (Method 1) ✅ Recommended

**Best for:**
- Production deployments
- Team collaboration
- Automated CI/CD pipelines
- Multiple developers
- Long-term maintenance

**Advantages:**
- ✅ Fully automated - no manual steps
- ✅ Built-in preview deployments for PRs
- ✅ Automatic rollback on failures
- ✅ Deployment history and logs
- ✅ No local dependencies required
- ✅ Works for all team members

### When to Use Manual CLI (Method 2)

**Best for:**
- Quick local testing
- Development workflows
- Single developer projects
- Custom deployment scripts
- Learning/debugging

**Advantages:**
- ✅ Full control over deployment process
- ✅ Can test locally before pushing
- ✅ Useful for debugging deployment issues
- ✅ Works offline (after initial setup)

### Recommendation

**For production:** Use **Method 1 (GitHub + Vercel)** - it's the industry standard, fully automated, and requires zero maintenance once set up.

**For development:** Use **Method 2 (Manual CLI)** when you need to test deployments locally or debug issues.

---

**Happy Deploying!** 🚀

Choose the method that best fits your workflow. For most teams, the GitHub + Vercel integration provides the best balance of automation, reliability, and ease of use.
