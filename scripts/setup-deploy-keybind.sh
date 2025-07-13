#!/bin/bash

# Setup script for W key deployment binding
# This script sets up various key binding options for the deployment script
# Created: 2024-12-29
# Last Modified: 2024-12-29

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to create the key binding script
create_deploy_trigger() {
    cat > deploy-trigger.sh << 'EOF'
#!/bin/bash
# Quick deployment trigger script
# This script can be bound to a key for instant deployment

# Change to project directory (adjust path as needed)
PROJECT_DIR="/home/g/dev/revampit"
cd "$PROJECT_DIR" || {
    echo "Error: Could not change to project directory: $PROJECT_DIR"
    exit 1
}

# Run the deployment script
./deploy.sh
EOF

    chmod +x deploy-trigger.sh
    print_status "Created deploy-trigger.sh"
}

# Function to setup bash key binding
setup_bash_keybind() {
    local bashrc_file="$HOME/.bashrc"
    local project_dir=$(pwd)
    
    print_info "Setting up bash key bindings..."
    
    # Add key binding to .bashrc
    cat >> "$bashrc_file" << EOF

# RevampIT Development & Deployment Key Bindings
# Press Ctrl+W to deploy (in bash)
bind '"\C-w": "\C-u${project_dir}/deploy.sh\C-m"'
# Press Ctrl+D to start development servers (in bash)
bind '"\C-d": "\C-ucd ${project_dir} && npm run dev:all\C-m"'
EOF

    print_status "Added key bindings to $bashrc_file"
    print_info "Press Ctrl+W to deploy (after restarting terminal or running 'source ~/.bashrc')"
    print_info "Press Ctrl+D to start development servers (Next.js + Strapi)"
}

# Function to create desktop entry for global shortcut
create_desktop_entry() {
    local desktop_file="$HOME/.local/share/applications/revampit-deploy.desktop"
    local project_dir=$(pwd)
    
    mkdir -p "$HOME/.local/share/applications"
    
    cat > "$desktop_file" << EOF
[Desktop Entry]
Name=RevampIT Deploy
Comment=Deploy RevampIT website
Exec=gnome-terminal --working-directory=${project_dir} -e "${project_dir}/deploy.sh"
Icon=utilities-terminal
Terminal=true
Type=Application
Categories=Development;
StartupNotify=true
EOF

    print_status "Created desktop entry: $desktop_file"
    print_info "You can now bind this to a global keyboard shortcut in your system settings"
}

# Function to setup tmux key binding
setup_tmux_keybind() {
    local tmux_conf="$HOME/.tmux.conf"
    local project_dir=$(pwd)
    
    print_info "Setting up tmux key bindings..."
    
    # Add key binding to .tmux.conf
    cat >> "$tmux_conf" << EOF

# RevampIT Development & Deployment Key Bindings
# Press prefix + w to deploy
bind-key w run-shell "cd ${project_dir} && ./deploy.sh"
# Press prefix + d to start development servers
bind-key d run-shell "cd ${project_dir} && npm run dev:all"
EOF

    print_status "Added tmux key bindings to $tmux_conf"
    print_info "Press tmux-prefix + w to deploy (after reloading tmux config)"
    print_info "Press tmux-prefix + d to start development servers"
}

# Function to create a simple terminal alias
setup_alias() {
    local bashrc_file="$HOME/.bashrc"
    local project_dir=$(pwd)
    
    print_info "Setting up deployment and development aliases..."
    
    # Add alias to .bashrc
    cat >> "$bashrc_file" << EOF

# RevampIT Development & Deployment Aliases
alias deploy='cd ${project_dir} && ./deploy.sh'
alias w='cd ${project_dir} && ./deploy.sh'
alias dev='cd ${project_dir} && npm run dev:all'
alias d='cd ${project_dir} && npm run dev:all'
alias dev-next='cd ${project_dir} && npm run dev:next'
alias dev-strapi='cd ${project_dir} && npm run dev:strapi'
alias stop-dev='pkill -f "next dev" && pkill -f "strapi develop"'
EOF

    print_status "Added development and deployment aliases to $bashrc_file"
    print_info "You can now use:"
    print_info "  • 'd' or 'dev' - Start all development servers (Next.js + Strapi)"
    print_info "  • 'w' or 'deploy' - Deploy to production"
    print_info "  • 'dev-next' - Start only Next.js server"
    print_info "  • 'dev-strapi' - Start only Strapi server"
    print_info "  • 'stop-dev' - Stop all development servers"
}

# Function to create a systemd service for monitoring
create_deployment_service() {
    print_info "Creating systemd user service for deployment monitoring..."
    
    local service_file="$HOME/.config/systemd/user/revampit-deploy.service"
    local project_dir=$(pwd)
    
    mkdir -p "$HOME/.config/systemd/user"
    
    cat > "$service_file" << EOF
[Unit]
Description=RevampIT Deployment Service
After=network.target

[Service]
Type=oneshot
WorkingDirectory=${project_dir}
ExecStart=${project_dir}/deploy.sh
User=$(whoami)
Environment=HOME=${HOME}
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=default.target
EOF

    systemctl --user daemon-reload
    print_status "Created systemd service: $service_file"
    print_info "You can run: systemctl --user start revampit-deploy"
}

# Main setup function
main() {
    print_header "RevampIT Development & Deployment Key Binding Setup"
    
    # Create the basic trigger script
    create_deploy_trigger
    
    echo
    print_info "Choose your preferred key binding method:"
    echo "1) Bash key bindings (Ctrl+W=deploy, Ctrl+D=dev servers)"
    echo "2) Terminal aliases ('w'=deploy, 'd'=dev servers, etc.)"
    echo "3) Tmux key bindings (prefix+w=deploy, prefix+d=dev servers)"
    echo "4) Desktop entry (for global shortcuts)"
    echo "5) All of the above"
    echo "0) Skip key binding setup"
    echo
    
    read -p "Enter your choice (0-5): " choice
    
    case $choice in
        1)
            setup_bash_keybind
            ;;
        2)
            setup_alias
            ;;
        3)
            setup_tmux_keybind
            ;;
        4)
            create_desktop_entry
            ;;
        5)
            setup_bash_keybind
            setup_alias
            setup_tmux_keybind
            create_desktop_entry
            ;;
        0)
            print_info "Skipping key binding setup"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo
    print_header "Setup Complete!"
    
    print_status "Deployment script is ready: ./deploy.sh"
    print_status "Development servers script is ready: npm run dev:all"
    print_status "Quick trigger script: ./deploy-trigger.sh"
    
    echo
    print_info "🚀 Deployment Options:"
    print_info "   • Run directly: ./deploy.sh"
    print_info "   • Use alias: w (or deploy)"
    print_info "   • Bash shortcut: Ctrl+W"
    print_info "   • Manual trigger: ./deploy-trigger.sh"
    
    echo
    print_info "🛠️  Development Options:"
    print_info "   • Start all servers: d (or dev) - Starts Next.js + Strapi"
    print_info "   • Bash shortcut: Ctrl+D - Starts both development servers"
    print_info "   • Next.js only: dev-next"
    print_info "   • Strapi only: dev-strapi"
    print_info "   • Stop all: stop-dev"
    
    echo
    print_info "🔧 Additional Setup:"
    print_info "   • Install GitHub CLI: https://cli.github.com/"
    print_info "   • Install Vercel CLI: npm i -g vercel"
    print_info "   • Configure Vercel: vercel login && vercel link"
    
    echo
    print_warning "Remember to restart your terminal or run 'source ~/.bashrc' to activate aliases and key bindings!"
}

# Run main function
main "$@" 