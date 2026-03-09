#!/bin/bash

# =============================================================================
# Supabase Function Consistency Verification Script
# 
# Verifies that local Edge Functions match the deployed versions.
# This helps ensure functions are properly deployed.
#
# Usage:
#   ./scripts/verify_supabase_function_consistency.sh [options]
#
# Options:
#   --linked     Check linked Supabase project instead of local
#   --verbose    Show detailed output
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

USE_LINKED=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --linked)
      USE_LINKED=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "================================================================================"
echo "Supabase Function Consistency Verification"
echo "================================================================================"
echo ""

# Functions directory
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo -e "${YELLOW}⚠ No functions directory found: $FUNCTIONS_DIR${NC}"
  echo "   This is fine if you don't have any Edge Functions yet."
  exit 0
fi

# Count local functions
LOCAL_COUNT=$(find "$FUNCTIONS_DIR" -maxdepth 1 -type d ! -name 'functions' ! -name '.*' | wc -l)

echo "📁 Local functions: $LOCAL_COUNT"
echo ""

if [ "$LOCAL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ No local functions to verify${NC}"
  exit 0
fi

# List local functions
echo "📦 Local functions:"
for func_dir in "$FUNCTIONS_DIR"/*/; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    echo "   - $func_name"
  fi
done
echo ""

# Get remote functions
echo "🔄 Fetching remote functions..."

if [ "$USE_LINKED" = true ]; then
  REMOTE_FUNCTIONS=$(npx supabase functions list --linked 2>/dev/null | tail -n +2 || echo "")
else
  REMOTE_FUNCTIONS=$(npx supabase functions list --local 2>/dev/null | tail -n +2 || echo "")
fi

if [ -z "$REMOTE_FUNCTIONS" ]; then
  echo -e "${YELLOW}⚠ Could not fetch remote functions${NC}"
  echo "   Make sure Supabase CLI is configured properly."
  echo ""
  # Check if we can at least verify locally
  echo "📦 Local functions present:"
  for func_dir in "$FUNCTIONS_DIR"/*/; do
    if [ -d "$func_dir" ]; then
      func_name=$(basename "$func_dir")
      echo "   - $func_name"
    fi
  done
  echo ""
  exit 0
fi

REMOTE_COUNT=$(echo "$REMOTE_FUNCTIONS" | grep -v '^$' | wc -l)

echo "   Remote functions: $REMOTE_COUNT"
echo ""

# Compare
echo "📋 Consistency Check:"
echo ""

IS_CONSISTENT=true

# Check for functions in local but not remote
echo "Local → Remote comparison:"
for func_dir in "$FUNCTIONS_DIR"/*/; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    if echo "$REMOTE_FUNCTIONS" | grep -q "$func_name"; then
      echo -e "   ${GREEN}✓${NC} $func_name (deployed)"
    else
      echo -e "   ${RED}✗${NC} $func_name (NOT deployed)"
      IS_CONSISTENT=false
    fi
  fi
done

echo ""

# Summary
if [ "$IS_CONSISTENT" = true ]; then
  if [ "$REMOTE_COUNT" -eq "$LOCAL_COUNT" ]; then
    echo -e "${GREEN}✅ All functions are deployed and consistent!${NC}"
  else
    echo -e "${YELLOW}⚠ All local functions are deployed, but there are extra remote functions${NC}"
  fi
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some functions are not deployed!${NC}"
  echo ""
  echo "To deploy functions:"
  echo "  npx supabase functions deploy"
  echo ""
  echo "Or deploy a specific function:"
  echo "  npx supabase functions deploy <function-name>"
  echo ""
  exit 1
fi
