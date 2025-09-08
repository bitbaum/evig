# Automated Deployment Setup

> **One-click deployment**: Type `w` and deploy automatically

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Reflects**: Current automated deployment system
---

## 🎯 Overview

The automated deployment system provides one-click deployment with zero manual steps. Just type `w` and your website deploys automatically with full best practices.

## 🚀 Quick Setup

### 1. Run Setup Script
```bash
# Run the setup script
./setup-deploy-keybind.sh

# Choose option 5 (All methods) for maximum flexibility
```

### 2. Install Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel

# Install GitHub CLI (recommended)
sudo apt install gh  # Ubuntu/Debian
brew install gh       # macOS

# Login to services
vercel login
gh auth login
vercel link
```

### 3. Test Deployment
```bash
# Any of these commands will deploy:
w                    # Short alias
deploy              # Descriptive alias
npm run deploy      # NPM script
./deploy.sh         # Direct execution
```

## 🎯 What You Get

### Instant Deployment
- **Press `w`** or use `Ctrl+W` to deploy
- **Fully automated** workflow with best practices
- **Real-time status** updates with colors
- **Automatic error handling** and retries
- **Zero prompts** - completely automated

### Smart Workflow
✅ **Auto-commits** uncommitted changes with timestamp  
✅ **Auto-creates** feature branches (avoids direct main pushes)  
✅ **Runs quality checks** (linting and build tests)  
✅ **Auto-creates PRs** and merges (with GitHub CLI)  
✅ **Monitors deployment** with automatic retries  
✅ **Shows live status** with deployment logs  

### Complete Transparency
- **See actual command output** from linting and builds
- **View real-time git commands** being executed
- **Get clickable links** to GitHub, PRs, and deployments
- **Monitor live deployment** with Vercel dashboard links
- **Verify every step** - no hidden processes

## 🔧 Setup Options

### Option 1: Bash Key Binding
- **Usage**: Press `Ctrl+W` in bash terminal
- **Scope**: Works in any bash session
- **Setup**: Requires `source ~/.bashrc` after setup

### Option 2: Terminal Aliases
- **Usage**: Type `w` or `deploy` in any terminal
- **Scope**: Works from any directory
- **Setup**: Most intuitive method

### Option 3: Tmux Key Binding
- **Usage**: Press `tmux-prefix + w`
- **Scope**: Works in tmux sessions
- **Setup**: Requires tmux configuration reload

### Option 4: Desktop Entry
- **Usage**: System application entry
- **Scope**: Can bind to global keyboard shortcuts
- **Setup**: Works system-wide

### Option 5: All Methods (Recommended)
- **Usage**: All methods above
- **Scope**: Maximum flexibility
- **Setup**: Use whatever method suits the moment

## 🔍 How It Works

### 1. Pre-flight Checks
- Verifies git repository status
- Checks for uncommitted changes
- Prompts for commit message if needed

### 2. Branch Management
- Creates feature branch if on main
- Follows git workflow best practices
- Handles branch naming conventions

### 3. Quality Assurance
- Runs `npm run lint` with full output
- Runs `npm run build` with error checking
- Exits on any build failures

### 4. Git Operations
- Pushes branch to GitHub
- Creates Pull Request (if GitHub CLI available)
- Auto-merges PR to main branch
- Updates local main branch

### 5. Deployment Monitoring
- Monitors Vercel deployment status
- Shows real-time progress updates
- Displays deployment logs
- Retries on failures (up to 3 times)

### 6. Success Summary
- Shows deployment URL with clickable links
- Lists all completed actions
- Provides next steps and verification

## 🎨 Terminal Output

The script provides colorful, clear output:
- 🟢 **Green**: Success messages and completion
- 🔵 **Blue**: Information and progress updates
- 🟡 **Yellow**: Warnings and important notes
- 🔴 **Red**: Errors and failures

### Example Output
```
🚀 RevampIT Automated Deployment
==================================================
🚀 Starting fully automated deployment process...
📅 Started at: Wed Jul 16 10:30:45 CET 2025
📁 Repository: revamp-it/website
👉 GitHub: https://github.com/revamp-it/website

🔧 Running Quality Checks
==================================================
🔍 Running ESLint...
Command: npm run lint
✅ Linting passed!

🏗️  Running build test...
Command: npm run build
✅ Build successful!

📤 Git Operations
==================================================
Command: git push origin feature/auto-deploy-20250716-103045
✅ Branch pushed successfully!
👉 View branch: https://github.com/revamp-it/website/tree/feature/auto-deploy-20250716-103045

🔍 Monitoring Vercel Deployment
==================================================
👉 Monitor live: https://vercel.com/dashboard
🎉 Deployment successful!

🎉 Deployment Complete!
==================================================
🌐 Live Website: https://revampit.vercel.app
📁 GitHub: https://github.com/revamp-it/website
🚀 Vercel Dashboard: https://vercel.com/dashboard
```

## 🚨 Troubleshooting

### Common Issues

#### "Command not found: w"
```bash
# Restart terminal or run
source ~/.bashrc

# Verify setup
alias | grep deploy
```

#### "Not in a git repository"
```bash
# Ensure you're in project directory
cd /path/to/revampit
ls -la .git
```

#### "Build failed"
```bash
# Fix issues first
npm run lint
npm run build

# Then deploy
w
```

#### "GitHub CLI not available"
```bash
# Install GitHub CLI
sudo apt install gh

# Login
gh auth login

# Test
gh repo view
```

### Getting Help

1. **Check detailed output**: Run `./deploy.sh` directly
2. **Verify prerequisites**: Ensure all tools are installed
3. **Check permissions**: `ls -la *.sh`
4. **Review logs**: Look for specific error messages

## 🔄 Maintenance

### Updating Scripts
```bash
# Scripts are in project root
ls -la *.sh

# Modify as needed
nano deploy.sh
nano setup-deploy-keybind.sh

# Test changes
./deploy.sh
```

### Customization
The scripts are designed to be:
- **Self-contained**: All logic in the scripts
- **Maintainable**: Clear functions and comments
- **Extensible**: Easy to modify for specific needs
- **Robust**: Error handling and recovery

## 📞 Support

### Quick Commands
```bash
# Deploy
w

# Setup
./setup-deploy-keybind.sh

# Status
vercel ls
gh pr list

# Logs
vercel logs --limit 50
```

### Resources
- **[Deployment Guide](deployment-guide.md)** - Complete deployment documentation
- **[Manual Deployment](manual-deployment.md)** - Manual deployment steps
- **[Troubleshooting](../development/troubleshooting.md)** - Common issues

---

**Deploy with confidence!** The automated system handles all best practices, quality checks, and deployment monitoring. Just type `w` and your website goes live automatically.