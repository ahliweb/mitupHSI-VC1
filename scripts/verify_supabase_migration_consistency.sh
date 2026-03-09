#!/bin/bash

# =============================================================================
# Supabase Migration Consistency Verification Script
# 
# Verifies that local migration files match the remote database schema.
# This helps ensure development consistency across team members.
#
# Usage:
#   ./scripts/verify_supabase_migration_consistency.sh [options]
#
# Options:
#   --linked     Check linked Supabase project instead of local
#   --verbose    Show detailed diff output
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
echo "Supabase Migration Consistency Verification"
echo "================================================================================"
echo ""

# Get Supabase URL from environment
if [ "$USE_LINKED" = true ]; then
  echo "📡 Checking linked Supabase project..."
  SUPABASE_URL=$(npx supabase get-project-url 2>/dev/null || echo "")
else
  # Try to get from .env.local
  if [ -f "$ROOT_DIR/apps/admin/.env.local" ]; then
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" "$ROOT_DIR/apps/admin/.env.local" | cut -d'=' -f2 | tr -d ' ')
  fi
fi

if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}✗ Could not determine Supabase URL${NC}"
  echo "   Make sure you're linked to a project or have .env.local configured"
  exit 1
fi

echo "   Project: $SUPABASE_URL"
echo ""

# Migration directories
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
ADMIN_MIGRATIONS_DIR="$ROOT_DIR/apps/admin/supabase/migrations"

# Count local migrations
ROOT_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
ADMIN_COUNT=0
if [ -d "$ADMIN_MIGRATIONS_DIR" ]; then
  ADMIN_COUNT=$(ls -1 "$ADMIN_MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
fi

echo "📊 Local migration files:"
echo "   Root:    $ROOT_COUNT"
echo "   Admin:   $ADMIN_COUNT"
echo "   Total:   $((ROOT_COUNT + ADMIN_COUNT))"
echo ""

# Get remote migrations
echo "🔄 Fetching remote migrations..."

if [ "$USE_LINKED" = true ]; then
  REMOTE_LIST=$(npx supabase migration list --linked 2>/dev/null | tail -n +2 || echo "")
else
  REMOTE_LIST=$(npx supabase migration list --local 2>/dev/null | tail -n +2 || echo "")
fi

REMOTE_COUNT=$(echo "$REMOTE_LIST" | grep -c '\.sql' || echo "0")

echo "   Remote:  $REMOTE_COUNT"
echo ""

# Compare
echo "📋 Consistency Check:"
echo ""

IS_CONSISTENT=true
DIFF_COUNT=0

# Check if counts match
if [ "$((ROOT_COUNT + ADMIN_COUNT))" -ne "$REMOTE_COUNT" ]; then
  DIFF_COUNT=$((REMOTE_COUNT - ROOT_COUNT - ADMIN_COUNT))
  if [ $DIFF_COUNT -gt 0 ]; then
    echo -e "${RED}✗ Local is missing $DIFF_COUNT migrations compared to remote${NC}"
  else
    echo -e "${YELLOW}⚠ Remote is missing $((-DIFF_COUNT)) migrations compared to local${NC}"
  fi
  IS_CONSISTENT=false
else
  echo -e "${GREEN}✓ Migration counts match${NC}"
fi

# Compare individual migrations
MISSING_IN_LOCAL=0
for migration in $(echo "$REMOTE_LIST" | awk '{print $1}' | grep '\.sql$'); do
  if [ ! -f "$MIGRATIONS_DIR/$migration" ]; then
    if [ $MISSING_IN_LOCAL -eq 0 ]; then
      echo ""
      echo -e "${RED}✗ Migrations in remote but missing locally:${NC}"
    fi
    echo "   - $migration"
    MISSING_IN_LOCAL=$((MISSING_IN_LOCAL + 1))
    IS_CONSISTENT=false
  fi
done

if [ "$USE_LINKED" = true ]; then
  for sql_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
      filename=$(basename "$sql_file")
      if ! echo "$REMOTE_LIST" | grep -q "$filename"; then
        if [ $DIFF_COUNT -le 0 ]; then
          if [ $DIFF_COUNT -eq 0 ]; then
            echo ""
            echo -e "${YELLOW}⚠ Migrations in local but not in remote (may need push):${NC}"
          fi
        fi
        echo "   + $filename"
        IS_CONSISTENT=false
      fi
    fi
  done
fi

echo ""

# Summary
if [ "$IS_CONSISTENT" = true ]; then
  echo -e "${GREEN}✅ Migration history is consistent!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Migration history has inconsistencies!${NC}"
  echo ""
  echo "To fix:"
  echo "  1. Pull remote schema: npx supabase db pull"
  echo "  2. Or push local:      npx supabase db push"
  echo "  3. Or run repair:     ./scripts/repair_supabase_migration_history.sh --apply --linked"
  echo ""
  exit 1
fi
