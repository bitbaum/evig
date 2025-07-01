# Deployment Workflow

This document outlines the proper workflow for making changes and deploying them to production.
Last Modified: 2024-12-29

## Overview

Our project is deployed through Vercel, which automatically deploys changes when they are merged into the `main` branch. We have both automated and manual deployment workflows to ensure smooth deployments and maintain code quality.

## 🚀 Quick Automated Deployment (Recommended)

We have an automated deployment script that handles the entire process with best practices:

### One-Time Setup
```bash
# Run the setup script to configure key bindings
./setup-deploy-keybind.sh

# Or use npm script
npm run setup-deploy
```

### Deploy with W Key
After setup, you can deploy by:
- **Terminal alias**: Type `w` or `deploy` in any terminal
- **Keyboard shortcut**: Press `Ctrl+W` in bash
- **Direct execution**: `./deploy.sh` or `npm run deploy`

### What the Automated Script Does
1. ✅ Commits any uncommitted changes (with your commit message)
2. ✅ Creates feature branch if you're on main (best practice)
3. ✅ Runs linting and build tests
4. ✅ Pushes branch to GitHub
5. ✅ Creates and merges Pull Request automatically (if GitHub CLI available)
6. ✅ Switches to main and pulls latest changes
7. ✅ Monitors Vercel deployment status
8. ✅ Shows deployment logs and retries on failure
9. ✅ Provides deployment summary and next steps

## 📋 Manual Development Workflow (Alternative)

If you prefer manual control or the automated script is not available, follow these steps:

### 1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   - Branch names should be descriptive and follow the pattern: `feature/`, `fix/`, or `docs/` followed by a brief description
   - Example: `feature/add-get-involved-section`

### 2. **Make Your Changes**
   - Make your code changes
   - Test locally: `npm run dev`
   - Ensure all tests pass: `npm run lint` and `npm run build`

### 3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```
   - Write clear, descriptive commit messages
   - Reference any related issues or tickets

### 4. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

### 5. **Create a Pull Request**
   - Go to GitHub repository
   - Create a new Pull Request from your feature branch to `main`
   - Add a description of your changes
   - Request review if needed

### 6. **Review and Merge**
   - Address any review comments
   - Once approved, merge the PR into `main`
   - Delete the feature branch after successful merge

## 🔄 Deployment Process

### Automatic Deployment
- Vercel automatically deploys changes when merged to `main`
- Each PR gets a preview deployment
- Production deployment happens after merge to `main`

### Deployment Monitoring
Our automated script monitors deployment status and provides:
- Real-time deployment status updates
- Automatic retry on failure (up to 3 attempts)
- Deployment logs for troubleshooting
- Success confirmation with live URL

### Manual Verification
If you want to manually verify deployment:
- Check Vercel dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- Clear browser cache if seeing old version
- Verify changes in production environment
- Check deployment logs for any errors

## 🛠️ Prerequisites

For optimal deployment experience, install these tools:

### Required
- **Git**: Version control (should be installed)
- **Node.js & npm**: For running the project
- **Vercel CLI**: `npm install -g vercel`

### Optional (for enhanced features)
- **GitHub CLI**: For automatic PR creation and merging
  ```bash
  # Install GitHub CLI (Ubuntu/Debian)
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update
  sudo apt install gh
  
  # Login to GitHub
  gh auth login
  ```

### Setup Commands
```bash
# First time setup
npm install
vercel login
vercel link
./setup-deploy-keybind.sh

# Test deployment (dry run)
./deploy.sh --help
```

## 🔧 Troubleshooting

### Common Issues

**Old versions after deployment:**
1. Check Vercel dashboard for deployment status
2. Clear browser cache (Ctrl+F5)
3. Check if deployment was successful
4. Verify the correct branch was merged

**Deployment script fails:**
1. Ensure you're in the project directory
2. Check git status: `git status`
3. Verify internet connection
4. Check if GitHub/Vercel services are available

**Key binding not working:**
1. Restart terminal or run `source ~/.bashrc`
2. Check if alias exists: `alias | grep deploy`
3. Verify script permissions: `ls -la deploy.sh`

**GitHub CLI issues:**
1. Login to GitHub: `gh auth login`
2. Check repository access: `gh repo view`
3. Verify repository permissions

### Deployment Logs
```bash
# View recent deployment logs
vercel logs --limit 50

# View specific deployment
vercel logs [deployment-url]

# Check build output
npm run build
```

## ✅ Best Practices

### Automated Deployment (Recommended)
- ✅ Use `w` command or `./deploy.sh` for deployments
- ✅ Let the script handle feature branch creation
- ✅ Trust the automated testing and deployment monitoring
- ✅ Review deployment summary after completion

### Manual Deployment
- ✅ Never push directly to `main`
- ✅ Always create feature branches for changes
- ✅ Write clear, descriptive commit messages
- ✅ Test changes locally before pushing (`npm run dev`)
- ✅ Run linting and build tests (`npm run lint && npm run build`)
- ✅ Review code before merging
- ✅ Keep branches up to date with `main`

### General Guidelines
- ✅ Use semantic commit messages (e.g., "feat:", "fix:", "docs:")
- ✅ Test in development environment first
- ✅ Monitor deployment status after merge
- ✅ Clear browser cache when verifying changes
- ✅ Report issues with deployment process immediately

## 🆘 Need Help?

### Quick Commands
```bash
# Deploy with one command
w                          # If alias is set up
npm run deploy            # Using npm script
./deploy.sh              # Direct execution

# Setup deployment shortcuts
npm run setup-deploy     # Run setup wizard

# Check deployment status
vercel ls                # List recent deployments
vercel logs --limit 50   # Show recent logs
```

### Getting Support
If you encounter any deployment issues:

**Automated Script Issues:**
1. Run `./deploy.sh` directly to see detailed output
2. Check script permissions: `ls -la *.sh`
3. Verify you're in the correct directory
4. Review error messages in the colored output

**Deployment Issues:**
1. Check Vercel dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Review deployment logs: `vercel logs --limit 50`
3. Verify build process: `npm run build`
4. Check git status: `git status`

**Contact Information:**
- Review this documentation first
- Check GitHub issues for similar problems
- Contact the development team for assistance
- Include deployment logs and error messages when reporting issues

### Quick Reference
| Command | Description |
|---------|-------------|
| `w` | Quick deploy (after setup) |
| `deploy` | Deploy alias (after setup) |
| `npm run deploy` | Deploy using npm |
| `./deploy.sh` | Direct script execution |
| `npm run setup-deploy` | Setup key bindings |
| `vercel logs` | View deployment logs |
| `gh pr list` | List GitHub PRs | 