#!/usr/bin/env bash
set -euo pipefail

# Thin wrapper to the keybind setup script
exec bash tools/deployment/setup-deploy-keybind.sh "$@"

