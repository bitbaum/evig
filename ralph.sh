#!/bin/bash

# Ralph Loop for RevampIT
# Conservative settings for limited Claude subscription plans
#
# Usage:
#   ./ralph.sh                    # Default: 10 iterations
#   ./ralph.sh --max 5            # Custom max iterations
#   ./ralph.sh --prompt custom.md # Custom prompt file
#
# Stop anytime with Ctrl+C

set -e

# Configuration (conservative defaults for limited plans)
MAX_ITERATIONS=${MAX_ITERATIONS:-10}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-60}  # 60 seconds between iterations
PROMPT_FILE=${PROMPT_FILE:-"PROMPT.md"}
COMPLETION_SIGNAL="TASK_COMPLETE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --prompt)
      PROMPT_FILE="$2"
      shift 2
      ;;
    --sleep)
      SLEEP_BETWEEN="$2"
      shift 2
      ;;
    --help|-h)
      echo "Ralph Loop for RevampIT (Conservative Mode)"
      echo ""
      echo "Usage: ./ralph.sh [options]"
      echo ""
      echo "Options:"
      echo "  --max N       Maximum iterations (default: 10)"
      echo "  --prompt FILE Custom prompt file (default: PROMPT.md)"
      echo "  --sleep N     Seconds between iterations (default: 60)"
      echo "  --help        Show this help"
      echo ""
      echo "Environment variables:"
      echo "  MAX_ITERATIONS    Same as --max"
      echo "  SLEEP_BETWEEN     Same as --sleep"
      echo "  PROMPT_FILE       Same as --prompt"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${RED}Error: Prompt file '$PROMPT_FILE' not found${NC}"
  echo "Create PROMPT.md with your task description first."
  exit 1
fi

# Read prompt
PROMPT=$(cat "$PROMPT_FILE")

# Check if prompt has been customized
if echo "$PROMPT" | grep -q "\[DESCRIBE YOUR TASK HERE\]"; then
  echo -e "${YELLOW}Warning: PROMPT.md contains placeholder text${NC}"
  echo "Edit PROMPT.md to describe your specific task before running Ralph."
  read -p "Continue anyway? (y/N): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    exit 0
  fi
fi

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           RALPH LOOP - RevampIT (Conservative)            ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Max iterations: $(printf '%-5s' $MAX_ITERATIONS)                                    ║"
echo "║  Sleep between:  $(printf '%-5s' $SLEEP_BETWEEN) seconds                            ║"
echo "║  Prompt file:    $(printf '%-20s' $PROMPT_FILE)                    ║"
echo "║                                                           ║"
echo "║  Press Ctrl+C to stop at any time                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Track iterations
iteration=0
start_time=$(date +%s)

# Cleanup on exit
cleanup() {
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Ralph session complete${NC}"
  echo "  Iterations: $iteration / $MAX_ITERATIONS"
  echo "  Duration: $((duration / 60)) minutes $((duration % 60)) seconds"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}
trap cleanup EXIT

# Main loop
while [ $iteration -lt $MAX_ITERATIONS ]; do
  iteration=$((iteration + 1))

  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Iteration $iteration / $MAX_ITERATIONS${NC} - $(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run Claude Code with the prompt
  # Using --print to capture output for completion detection
  output=$(claude -p "$PROMPT" 2>&1) || true

  echo "$output"

  # Check for completion signal
  if echo "$output" | grep -q "$COMPLETION_SIGNAL"; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Task completed! Completion signal detected.${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    break
  fi

  # Check for rate limit messages
  if echo "$output" | grep -qi "rate limit\|too many requests\|usage limit"; then
    echo ""
    echo -e "${YELLOW}Rate limit detected. Waiting 5 minutes...${NC}"
    sleep 300
  fi

  # Don't sleep after last iteration
  if [ $iteration -lt $MAX_ITERATIONS ]; then
    echo ""
    echo -e "${BLUE}Waiting ${SLEEP_BETWEEN}s before next iteration...${NC}"
    echo -e "${BLUE}(Ctrl+C to stop)${NC}"
    sleep $SLEEP_BETWEEN
  fi
done

# Final status
if [ $iteration -ge $MAX_ITERATIONS ]; then
  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Max iterations reached. Task may not be complete.${NC}"
  echo -e "${YELLOW}Check progress and run again if needed.${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
fi
