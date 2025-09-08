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
