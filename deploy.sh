#!/usr/bin/env bash
set -euo pipefail

# Thin wrapper to the canonical deployment script
exec bash tools/deployment/deploy.sh "$@"

