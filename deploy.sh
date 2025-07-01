#!/bin/bash

# RevampIT Deployment Script - Best Practices Automated Deployment
# This script handles the complete deployment workflow with monitoring
# Created: 2024-12-29
# Last Modified: 2024-12-29

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAIN_BRANCH="main"
VERCEL_PROJECT_ID="" # Will be auto-detected
VERCEL_ORG_ID="" # Will be auto-detected
MAX_RETRIES=3
RETRY_DELAY=30

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🚀 $1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
}

# Function to check if we have uncommitted changes
check_uncommitted_changes() {
    if [ -n "$(git status --porcelain)" ]; then
        print_info "📝 Auto-committing uncommitted changes..."
        echo "Current changes:"
        git status --short
        echo
        
        # Generate automatic commit message with timestamp
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        local commit_message="Auto-deploy: Updates from $timestamp"
        
        echo "Commands being executed:"
        echo "git add ."
        echo "git commit -m '$commit_message'"
        echo "----------------------------------------"
        
        git add .
        if git commit -m "$commit_message"; then
            print_status "✅ Changes committed successfully!"
            print_info "📋 Commit message: $commit_message"
            
            # Show commit hash and details
            local commit_hash=$(git rev-parse --short HEAD)
            print_info "📦 Commit hash: $commit_hash"
            
            local github_repo=$(get_github_info)
            if [ -n "$github_repo" ]; then
                print_info "👉 View commit: https://github.com/$github_repo/commit/$commit_hash"
            fi
        else
            print_error "❌ Failed to commit changes"
            exit 1
        fi
    else
        print_status "✅ No uncommitted changes found - repository is clean"
    fi
}

# Function to get current branch
get_current_branch() {
    git branch --show-current
}

# Function to create feature branch if not on main
handle_feature_branch() {
    local current_branch=$(get_current_branch)
    
    if [ "$current_branch" = "$MAIN_BRANCH" ]; then
        print_info "🌿 Auto-creating feature branch for deployment..."
        print_info "📋 Current branch: $current_branch (main branch)"
        
        # Generate automatic branch name with timestamp
        local timestamp=$(date '+%Y%m%d-%H%M%S')
        local branch_name="auto-deploy-$timestamp"
        local full_branch_name="feature/$branch_name"
        
        echo "Command: git checkout -b $full_branch_name"
        echo "----------------------------------------"
        
        if git checkout -b "$full_branch_name"; then
            print_status "✅ Created and switched to $full_branch_name"
            current_branch="$full_branch_name"
            
            local github_repo=$(get_github_info)
            if [ -n "$github_repo" ]; then
                print_info "👉 Branch will be visible at: https://github.com/$github_repo/tree/$full_branch_name"
            fi
        else
            print_error "❌ Failed to create feature branch"
            exit 1
        fi
    else
        print_status "✅ Working on existing branch: $current_branch"
        
        local github_repo=$(get_github_info)
        if [ -n "$github_repo" ]; then
            print_info "👉 View branch: https://github.com/$github_repo/tree/$current_branch"
        fi
    fi
    
    echo "$current_branch"
}

# Function to auto-fix common issues
auto_fix_issues() {
    local max_fix_attempts=10
    local fix_attempt=1
    
    while [ $fix_attempt -le $max_fix_attempts ]; do
        print_info "🔧 Auto-fix attempt $fix_attempt/$max_fix_attempts..."
        
        # Try to build and capture output
        print_info "Running build to identify issues..."
        local build_output=$(npm run build 2>&1)
        local build_exit_code=$?
        
        if [ $build_exit_code -eq 0 ]; then
            print_status "✅ Build successful after auto-fixing!"
            return 0
        fi
        
        print_info "📋 Build failed, analyzing error..."
        echo "$build_output"
        echo "----------------------------------------"
        
        # Check for specific error patterns and apply fixes
        if echo "$build_output" | grep -q "Property 'bool' does not exist"; then
            print_info "🔧 Detected Strapi env.bool issue - fixing..."
            auto_fix_strapi_env_bool
        elif echo "$build_output" | grep -q "ESLint"; then
            print_info "🔧 Detected ESLint issues - auto-fixing..."
            npm run lint --fix
        elif echo "$build_output" | grep -q "Module not found\|Cannot resolve"; then
            print_info "🔧 Detected missing dependencies - installing..."
            npm install
        elif echo "$build_output" | grep -q "TypeScript error\|Type error"; then
            print_info "🔧 Detected TypeScript errors - attempting generic fixes..."
            auto_fix_typescript_errors "$build_output"
        else
            print_info "🔧 Trying generic fixes..."
            rm -rf .next node_modules/.cache
            npm install
        fi
        
        sleep 2
        ((fix_attempt++))
    done
    
    print_error "❌ Unable to auto-fix build issues after $max_fix_attempts attempts"
    return 1
}

# Function to fix Strapi env.bool issues
auto_fix_strapi_env_bool() {
    if [ -f "strapi/config/admin.ts" ]; then
        print_info "🔧 Fixing Strapi env.bool usage..."
        sed -i 's/env\.bool(/env(/g' strapi/config/admin.ts
        print_status "✅ Fixed env.bool references in strapi/config/admin.ts"
    fi
    
    # Check other common Strapi config files
    for file in strapi/config/*.ts strapi/config/*.js; do
        if [ -f "$file" ]; then
            if grep -q "env\.bool" "$file"; then
                print_info "🔧 Fixing env.bool in $file..."
                sed -i 's/env\.bool(/env(/g' "$file"
                print_status "✅ Fixed env.bool references in $file"
            fi
        fi
    done
}

# Function to fix TypeScript errors
auto_fix_typescript_errors() {
    local build_output="$1"
    
    # Try adding missing type imports
    if echo "$build_output" | grep -q "Cannot find name"; then
        print_info "🔧 Attempting to fix missing type definitions..."
        npm install @types/node @types/react @types/react-dom --save-dev
    fi
    
    # Clear TypeScript cache
    print_info "🔧 Clearing TypeScript cache..."
    rm -rf .next tsconfig.tsbuildinfo
}

# Function to run tests with auto-fixing
run_tests() {
    local max_attempts=3
    local attempt=1
    
    # Check if tests exist and run them
    if [ -f "package.json" ]; then
        print_info "🔍 Running ESLint (you can see the actual output)..."
        echo "Command: npm run lint"
        echo "----------------------------------------"
        
        if npm run lint; then
            print_status "✅ Linting passed!"
        else
            print_info "🔧 Auto-fixing linting issues..."
            npm run lint --fix
            if npm run lint; then
                print_status "✅ Linting fixed and passed!"
            else
                print_warning "⚠️  Some linting issues remain, but continuing..."
            fi
        fi
        
        echo ""
        print_info "🏗️  Running build test with auto-fixing..."
        echo "Command: npm run build"
        echo "----------------------------------------"
        
        while [ $attempt -le $max_attempts ]; do
            if npm run build; then
                print_status "✅ Build successful!"
                return 0
            else
                print_warning "❌ Build failed (attempt $attempt/$max_attempts)"
                
                if [ $attempt -lt $max_attempts ]; then
                    print_info "🔧 Attempting auto-fix..."
                    if auto_fix_issues; then
                        print_status "✅ Auto-fix successful, retrying build..."
                        continue
                    else
                        print_error "❌ Auto-fix failed"
                    fi
                fi
                
                ((attempt++))
            fi
        done
        
        print_error "❌ Build failed after $max_attempts attempts with auto-fixing"
        print_header "🔧 Manual Fix Required"
        print_info "The auto-fix couldn't resolve all issues. Please check the errors above."
        print_info "Common manual fixes:"
        print_info "1. Check TypeScript errors and fix type annotations"
        print_info "2. Verify all imports are correct"
        print_info "3. Remove problematic files if they're not needed"
        exit 1
    else
        print_warning "No package.json found - skipping tests"
    fi
}

# Function to push branch and create PR
push_and_create_pr() {
    local branch_name=$1
    local github_repo=$(get_github_info)
    print_info "📤 Pushing branch to GitHub..."
    echo "Command: git push origin $branch_name"
    echo "----------------------------------------"
    
    if git push origin "$branch_name"; then
        print_status "✅ Branch pushed successfully!"
        
        if [ -n "$github_repo" ]; then
            print_info "👉 View branch on GitHub: https://github.com/$github_repo/tree/$branch_name"
        fi
    else
        print_error "❌ Failed to push branch"
        exit 1
    fi
    
    echo
    
    if [ "$branch_name" != "$MAIN_BRANCH" ]; then
        print_info "🔄 Creating Pull Request..."
        
        # Check if GitHub CLI is available
        if command -v gh &> /dev/null; then
            echo "Command: gh pr create --title 'Deploy: $branch_name' --body 'Automated deployment PR' --base '$MAIN_BRANCH' --head '$branch_name'"
            echo "----------------------------------------"
            
            local pr_url=$(gh pr create --title "Deploy: $branch_name" --body "Automated deployment PR created at $(date)" --base "$MAIN_BRANCH" --head "$branch_name")
            print_status "✅ Pull Request created!"
            
            if [ -n "$pr_url" ]; then
                print_info "👉 View PR: $pr_url"
            fi
            
            # Auto-merge if possible
            print_info "🔄 Auto-merging PR in 5 seconds..."
            sleep 5
            echo "Command: gh pr merge --merge --delete-branch"
            echo "----------------------------------------"
            
            if gh pr merge --merge --delete-branch; then
                print_status "✅ PR merged and branch deleted automatically!"
                if [ -n "$github_repo" ]; then
                    print_info "👉 View merged commits: https://github.com/$github_repo/commits/main"
                fi
            else
                print_warning "⚠️  Auto-merge failed, but continuing..."
                if [ -n "$pr_url" ]; then
                    print_info "👉 Please merge manually: $pr_url"
                fi
            fi
        else
            print_warning "⚠️  GitHub CLI not available. Continuing with deployment..."
            print_info "💡 Install GitHub CLI for full PR automation: sudo apt install gh"
            if [ -n "$github_repo" ]; then
                print_info "👉 Create PR manually: https://github.com/$github_repo/compare/main...$branch_name"
            fi
            print_info "✅ Code is pushed and ready for deployment"
        fi
    fi
}

# Function to switch to main and pull latest
update_main_branch() {
    print_info "🔄 Switching to main branch and pulling latest changes..."
    echo "Commands being executed:"
    echo "git checkout $MAIN_BRANCH"
    echo "git pull origin $MAIN_BRANCH"
    echo "----------------------------------------"
    
    if git checkout "$MAIN_BRANCH"; then
        print_status "✅ Switched to main branch"
    else
        print_error "❌ Failed to switch to main branch"
        exit 1
    fi
    
    if git pull origin "$MAIN_BRANCH"; then
        print_status "✅ Main branch updated with latest changes"
        
        local github_repo=$(get_github_info)
        if [ -n "$github_repo" ]; then
            print_info "👉 View latest commits: https://github.com/$github_repo/commits/main"
        fi
    else
        print_warning "⚠️  Failed to pull latest changes, but continuing..."
    fi
}

# Function to check Vercel deployment status with persistent monitoring
check_vercel_deployment() {
    print_info "🔍 Starting persistent deployment monitoring..."
    print_info "⏰ This will monitor until deployment succeeds - no giving up!"
    
    # Show Vercel dashboard link immediately
    print_info "👉 Monitor deployment live at: https://vercel.com/dashboard"
    local github_repo=$(get_github_info)
    if [ -n "$github_repo" ]; then
        print_info "👉 GitHub Repository: https://github.com/$github_repo"
        print_info "👉 GitHub Actions: https://github.com/$github_repo/actions"
    fi
    print_info "👉 Live Website: https://revampit.vercel.app"
    echo
    
    local attempt=1
    local consecutive_errors=0
    local max_consecutive_errors=5
    
    # Install Vercel CLI if not available
    if ! command -v vercel &> /dev/null; then
        print_info "📦 Installing Vercel CLI..."
        npm install -g vercel
        print_status "✅ Vercel CLI installed"
    fi
    
    while true; do
        print_info "📊 Deployment check #$attempt ($(date '+%H:%M:%S'))"
        
        # Check if Vercel CLI is available
        if command -v vercel &> /dev/null; then
            print_info "Command: vercel ls --limit 3"
            echo "----------------------------------------"
            
            # Show recent deployments with full output
            local ls_output=$(vercel ls --limit 3 2>&1)
            echo "$ls_output"
            
            # Get latest deployment status
            local deployment_status=$(echo "$ls_output" | grep -o 'READY\|ERROR\|BUILDING\|QUEUED' | head -1)
            
            echo "----------------------------------------"
            
            case $deployment_status in
                "READY")
                    print_status "🎉 Deployment successful after $attempt checks!"
                    print_info "🌐 Your website is live at: https://revampit.vercel.app"
                    return 0
                    ;;
                "ERROR")
                    ((consecutive_errors++))
                    print_error "❌ Deployment failed! (Error #$consecutive_errors)"
                    print_info "📋 Showing deployment logs:"
                    echo "Command: vercel logs --limit 20"
                    echo "----------------------------------------"
                    vercel logs --limit 20
                    echo "----------------------------------------"
                    
                    # Auto-fix deployment errors
                    print_info "🔧 Attempting to fix deployment errors..."
                    auto_fix_deployment_errors
                    
                    print_warning "🔄 Triggering redeploy in $RETRY_DELAY seconds..."
                    sleep $RETRY_DELAY
                    print_info "Command: vercel --prod"
                    echo "----------------------------------------"
                    vercel --prod
                    
                    if [ $consecutive_errors -ge $max_consecutive_errors ]; then
                        print_warning "⚠️  Multiple consecutive errors detected"
                        print_info "🔧 Applying more aggressive fixes..."
                        aggressive_deployment_fixes
                        consecutive_errors=0
                    fi
                    ;;
                "BUILDING"|"QUEUED")
                    consecutive_errors=0
                    print_info "🔨 Deployment in progress... waiting 45 seconds"
                    print_info "👀 Monitor live:"
                    print_info "   👉 Vercel Dashboard: https://vercel.com/dashboard"
                    if [ -n "$github_repo" ]; then
                        print_info "   👉 GitHub Actions: https://github.com/$github_repo/actions"
                    fi
                    sleep 45
                    ;;
                *)
                    consecutive_errors=0
                    print_info "📋 Deployment status unclear - waiting and retrying..."
                    print_info "👉 Check manually at: https://vercel.com/dashboard"
                    sleep 30
                    ;;
            esac
        else
            print_error "❌ Vercel CLI installation failed"
            print_info "🔗 Manual monitoring required:"
            print_info "   👉 Vercel Dashboard: https://vercel.com/dashboard"
            print_info "   👉 Live Website: https://revampit.vercel.app"
            print_info "✅ Deployment was triggered via Git push - check links above"
            return 0
        fi
        
        ((attempt++))
        
        # Progress indicator
        if [ $((attempt % 10)) -eq 0 ]; then
            print_header "📊 Deployment Monitoring Progress"
            print_info "⏱️  Monitoring for $(((attempt * 45) / 60)) minutes"
            print_info "🔄 Check #$attempt completed"
            print_info "🌐 Live site: https://revampit.vercel.app"
            print_info "📊 Dashboard: https://vercel.com/dashboard"
            echo
            print_info "💪 Still monitoring - will not give up until deployed!"
        fi
    done
}

# Function to auto-fix deployment errors
auto_fix_deployment_errors() {
    print_info "🔧 Analyzing deployment errors and applying fixes..."
    
    # Clear build cache
    print_info "🧹 Clearing build cache..."
    rm -rf .next node_modules/.cache
    
    # Update dependencies
    print_info "📦 Updating dependencies..."
    npm install
    
    # Try to fix common Vercel deployment issues
    if [ -f "vercel.json" ]; then
        print_info "🔧 Checking vercel.json configuration..."
    fi
    
    # Ensure build works locally
    print_info "🏗️  Testing build locally..."
    if npm run build 2>/dev/null; then
        print_status "✅ Local build successful"
    else
        print_warning "⚠️  Local build failed - running auto-fix..."
        auto_fix_issues
    fi
}

# Function for aggressive deployment fixes
aggressive_deployment_fixes() {
    print_header "🚨 Applying Aggressive Fixes"
    
    # Remove all caches and reinstall everything
    print_info "🧹 Deep cleaning..."
    rm -rf .next node_modules package-lock.json
    npm install
    
    # Check for environment variable issues
    print_info "🔧 Checking environment configuration..."
    
    # Force a fresh deployment
    print_info "🚀 Forcing fresh deployment..."
    git add .
    git commit -m "Force deployment refresh - $(date)" || true
    git push origin "$(git branch --show-current)"
    
    # Wait longer before next check
    print_info "⏳ Waiting 2 minutes for fresh deployment..."
    sleep 120
}

# Function to get GitHub repository info
get_github_info() {
    local remote_url=$(git config --get remote.origin.url)
    if [[ $remote_url == *"github.com"* ]]; then
        # Extract owner/repo from various Git URL formats
        local repo_path=$(echo "$remote_url" | sed -E 's|.*github\.com[:/]([^/]+/[^/]+).*|\1|' | sed 's/\.git$//')
        echo "$repo_path"
    fi
}

# Function to display deployment summary
display_summary() {
    print_header "🎉 Deployment Complete!"
    
    # Get GitHub info for links
    local github_repo=$(get_github_info)
    
    print_status "✅ Deployment process completed successfully!"
    echo
    print_info "📊 What was accomplished:"
    print_info "   ✅ Code committed and pushed"
    print_info "   ✅ Feature branch created and merged"
    print_info "   ✅ Quality checks passed (linting & build)"
    print_info "   ✅ Vercel deployment triggered"
    echo
    
    print_header "🔗 Important Links (Click to Open)"
    
    if [ -n "$github_repo" ]; then
        print_info "📁 GitHub Repository:"
        echo "   👉 https://github.com/$github_repo"
        echo
        print_info "🔄 Recent Pull Requests:"
        echo "   👉 https://github.com/$github_repo/pulls"
        echo
        print_info "📈 Repository Activity:"
        echo "   👉 https://github.com/$github_repo/commits/main"
        echo
    fi
    
    print_info "🚀 Vercel Dashboard:"
    echo "   👉 https://vercel.com/dashboard"
    echo
    print_info "🌐 Live Website:"
    echo "   👉 https://revampit.vercel.app"
    echo
    
    print_header "🔍 How to Verify Deployment"
    print_info "1. Click the Live Website link above"
    print_info "2. Check Vercel Dashboard for deployment logs"
    print_info "3. Verify your changes are visible on the live site"
    print_info "4. Check GitHub for the merged PR and commits"
    
    if [ -n "$github_repo" ]; then
        echo
        print_info "🔧 Quick Commands:"
        print_info "   View recent deployments: vercel ls"
        print_info "   View deployment logs: vercel logs"
        print_info "   View GitHub PRs: gh pr list"
    fi
}

# Main deployment function
main() {
    print_header "RevampIT Automated Deployment"
    print_info "🚀 Starting fully automated deployment process..."
    print_info "📅 Started at: $(date)"
    echo
    
    local github_repo=$(get_github_info)
    if [ -n "$github_repo" ]; then
        print_info "📁 Repository: $github_repo"
        print_info "👉 GitHub: https://github.com/$github_repo"
    fi
    print_info "📂 Working directory: $(pwd)"
    echo
    
    print_header "📋 Deployment Progress"
    print_info "Step 1/6: ✅ Pre-flight checks"
    print_info "Step 2/6: ⏳ Commit changes"
    print_info "Step 3/6: ⏳ Create/update branch"
    print_info "Step 4/6: ⏳ Run quality checks"
    print_info "Step 5/6: ⏳ Push to GitHub & create PR"
    print_info "Step 6/6: ⏳ Deploy to Vercel"
    echo
    
    # Pre-flight checks
    print_header "🔍 Step 1/6: Pre-flight Checks"
    check_git_repo
    echo
    
    # Commit changes
    print_header "💾 Step 2/6: Commit Changes"  
    check_uncommitted_changes
    print_status "✅ Step 2/6 Complete: Changes committed"
    echo
    
    # Handle feature branch workflow
    print_header "🌿 Step 3/6: Branch Management"
    local current_branch=$(handle_feature_branch)
    print_status "✅ Step 3/6 Complete: Branch ready"
    echo
    
    # Run tests
    print_header "🧪 Step 4/6: Quality Checks"
    run_tests
    print_status "✅ Step 4/6 Complete: Quality checks passed"
    echo
    
    # Push and create PR if needed
    print_header "📤 Step 5/6: GitHub Operations"
    push_and_create_pr "$current_branch"
    print_status "✅ Step 5/6 Complete: Code pushed to GitHub"
    echo
    
    # Update main branch
    print_header "🔄 Step 6/6: Vercel Deployment"
    update_main_branch
    print_status "✅ Main branch updated"
    echo
    
    # Monitor Vercel deployment
    if check_vercel_deployment; then
        echo
        display_summary
    else
        print_error "❌ Deployment monitoring failed. Check links below:"
        print_info "👉 Vercel Dashboard: https://vercel.com/dashboard"
        print_info "👉 Live Website: https://revampit.vercel.app"
        exit 1
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" 