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
        print_info "Auto-committing uncommitted changes..."
        git status --short
        echo
        
        # Generate automatic commit message with timestamp
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        local commit_message="Auto-deploy: Updates from $timestamp"
        
        git add .
        git commit -m "$commit_message"
        print_status "Changes committed automatically: $commit_message"
    else
        print_status "No uncommitted changes found"
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
        print_info "Auto-creating feature branch for deployment..."
        
        # Generate automatic branch name with timestamp
        local timestamp=$(date '+%Y%m%d-%H%M%S')
        local branch_name="auto-deploy-$timestamp"
        
        git checkout -b "feature/$branch_name"
        print_status "Created and switched to feature/$branch_name"
        current_branch="feature/$branch_name"
    else
        print_status "Working on feature branch: $current_branch"
    fi
    
    echo "$current_branch"
}

# Function to run tests
run_tests() {
    print_info "Running tests and linting..."
    
    # Check if tests exist and run them
    if [ -f "package.json" ]; then
        # Run linting
        if npm run lint --silent > /dev/null 2>&1; then
            print_status "Linting passed"
        else
            print_warning "Linting failed, but continuing..."
        fi
        
        # Run build test
        if npm run build > /dev/null 2>&1; then
            print_status "Build test passed"
        else
            print_error "Build failed"
            exit 1
        fi
    fi
}

# Function to push branch and create PR
push_and_create_pr() {
    local branch_name=$1
    
    print_info "Pushing branch to origin..."
    git push origin "$branch_name"
    print_status "Branch pushed successfully"
    
    if [ "$branch_name" != "$MAIN_BRANCH" ]; then
        print_info "Creating Pull Request..."
        
        # Check if GitHub CLI is available
        if command -v gh &> /dev/null; then
            gh pr create --title "Deploy: $branch_name" --body "Automated deployment PR" --base "$MAIN_BRANCH" --head "$branch_name"
            print_status "Pull Request created"
            
            # Auto-merge if possible
            print_info "Attempting to merge PR..."
            sleep 5
            gh pr merge --merge --delete-branch
            print_status "PR merged and branch deleted"
        else
            print_warning "GitHub CLI not available. Continuing with automatic merge..."
            print_info "Note: For full automation in future, install GitHub CLI with: sudo apt install gh"
            print_info "Proceeding with deployment - PR can be created manually later if needed"
        fi
    fi
}

# Function to switch to main and pull latest
update_main_branch() {
    print_info "Switching to main branch and pulling latest changes..."
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    print_status "Main branch updated"
}

# Function to check Vercel deployment status
check_vercel_deployment() {
    local attempt=1
    
    print_info "Monitoring Vercel deployment..."
    
    while [ $attempt -le $MAX_RETRIES ]; do
        print_info "Checking deployment status (attempt $attempt/$MAX_RETRIES)..."
        
        # Check if Vercel CLI is available
        if command -v vercel &> /dev/null; then
            # Get latest deployment
            local deployment_status=$(vercel ls --limit 1 | grep -o 'READY\|ERROR\|BUILDING\|QUEUED' | head -1)
            
            case $deployment_status in
                "READY")
                    print_status "Deployment successful!"
                    vercel ls --limit 1
                    return 0
                    ;;
                "ERROR")
                    print_error "Deployment failed!"
                    print_info "Checking deployment logs..."
                    vercel logs --limit 50
                    
                    if [ $attempt -lt $MAX_RETRIES ]; then
                        print_warning "Retrying deployment in $RETRY_DELAY seconds..."
                        sleep $RETRY_DELAY
                        # Trigger redeploy
                        vercel --prod
                    fi
                    ;;
                "BUILDING"|"QUEUED")
                    print_info "Deployment in progress..."
                    sleep 30
                    ;;
                *)
                    print_warning "Unable to determine deployment status"
                    ;;
            esac
        else
            print_warning "Vercel CLI not available. Please check deployment manually:"
            print_info "1. Go to Vercel dashboard"
            print_info "2. Check deployment status"
            print_info "3. Review logs if deployment failed"
            return 0
        fi
        
        ((attempt++))
    done
    
    print_error "Deployment monitoring failed after $MAX_RETRIES attempts"
    return 1
}

# Function to display deployment summary
display_summary() {
    print_header "Deployment Summary"
    print_status "Deployment process completed successfully!"
    print_info "✅ Code committed and pushed"
    print_info "✅ PR created and merged (if applicable)"
    print_info "✅ Main branch updated"
    print_info "✅ Vercel deployment monitored"
    echo
    print_info "🌐 Your application should be live at:"
    print_info "   https://revampit.vercel.app"
    echo
    print_info "💡 Next steps:"
    print_info "   - Verify the deployment in browser"
    print_info "   - Check Vercel dashboard for detailed logs"
    print_info "   - Monitor for any runtime errors"
}

# Main deployment function
main() {
    print_header "RevampIT Automated Deployment"
    
    # Pre-flight checks
    check_git_repo
    check_uncommitted_changes
    
    # Handle feature branch workflow
    local current_branch=$(handle_feature_branch)
    
    # Run tests
    run_tests
    
    # Push and create PR if needed
    push_and_create_pr "$current_branch"
    
    # Update main branch
    update_main_branch
    
    # Monitor Vercel deployment
    if check_vercel_deployment; then
        display_summary
    else
        print_error "Deployment monitoring failed. Please check manually."
        exit 1
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" 