#!/bin/bash

# =============================================================================
# Supabase Migration History Repair Script
# 
# Repairs migration history by synchronizing local migrations with remote database.
# This script ensures local and remote migration states are consistent.
#
# Usage:
#   ./scripts/repair_supabase_migration_history.sh [options]
#
# Options:
#   --dry-run    Show what would be done without making changes (default)
#   --apply      Actually apply the fixes
#   --linked     Use linked Supabase project instead of local
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DRY_RUN=true
USE_LINKED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --apply)
      DRY_RUN=false
      shift
      ;;
    --linked)
      USE_LINKED=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "================================================================================"
echo "Supabase Migration History Repair"
echo "================================================================================"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 Running in DRY-RUN mode (no changes will be made)${NC}"
  echo "   Use --apply to actually apply fixes"
  echo ""
else
  echo -e "${YELLOW}⚠️  Running in APPLY mode - changes will be made!${NC}"
  echo ""
fi

# Determine migration source
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
ADMIN_MIGRATIONS_DIR="$ROOT_DIR/apps/admin/supabase/migrations"

echo "📁 Migration directories:"
echo "   Root:    $MIGRATIONS_DIR"
echo "   Admin:   $ADMIN_MIGRATIONS_DIR"
echo ""

# Check if directories exist
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${RED}✗ Root migrations directory not found: $MIGRATIONS_DIR${NC}"
  exit 1
fi

# Count migrations
ROOT_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
ADMIN_COUNT=0
if [ -d "$ADMIN_MIGRATIONS_DIR" ]; then
  ADMIN_COUNT=$(ls -1 "$ADMIN_MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
fi

echo "📊 Migration counts:"
echo "   Root migrations:    $ROOT_COUNT"
echo "   Admin migrations:  $ADMIN_COUNT"
echo ""

# Get remote migrations
echo "🔄 Fetching remote migration status..."

if [ "$USE_LINKED" = true ]; then
  REMOTE_MIGRATIONS=$(npx supabase migration list --linked 2>/dev/null | tail -n +2 || echo "")
else
  REMOTE_MIGRATIONS=$(npx supabase migration list --local 2>/dev/null | tail -n +2 || echo "")
fi

REMOTE_COUNT=$(echo "$REMOTE_MIGRATIONS" | grep -c '\.sql' || echo "0")

echo "   Remote migrations:  $REMOTE_COUNT"
echo ""

# Analyze differences
echo "📋 Analysis:"
echo ""

MISSING_LOCAL=()
MISSING_REMOTE=()

# Check for migrations in remote but not in local
for migration in $(echo "$REMOTE_MIGRATIONS" | awk '{print $1}' | grep '\.sql$'); do
  if [ ! -f "$MIGRATIONS_DIR/$migration" ]; then
    MISSING_LOCAL+=("$migration")
  fi
done

# Check for migrations in local but not in remote (for linked)
if [ "$USE_LINKED" = true ]; then
  for sql_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
      filename=$(basename "$sql_file")
      if ! echo "$REMOTE_MIGRATIONS" | grep -q "$filename"; then
        MISSING_REMOTE+=("$filename")
      fi
    fi
  done
fi

# Report findings
if [ ${#MISSING_LOCAL[@]} -gt 0 ]; then
  echo -e "${RED}✗ Migrations in remote but missing locally:${NC}"
  for migration in "${MISSING_LOCAL[@]}"; do
    echo "   - $migration"
  done
  echo ""
fi

if [ ${#MISSING_REMOTE[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠ Migrations in local but missing in remote:${NC}"
  for migration in "${MISSING_REMOTE[@]}"; do
    echo "   - $migration"
  done
  echo ""
fi

if [ ${#MISSING_LOCAL[@]} -eq 0 ] && [ ${#MISSING_REMOTE[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ Migration history is in sync!${NC}"
  exit 0
fi

# Offer repair options
echo "================================================================================"
echo "Repair Options"
echo "================================================================================"
echo ""

if [ ${#MISSING_LOCAL[@]} -gt 0 ]; then
  echo "Option 1: Pull missing migrations from remote"
  echo "  This will download the missing migration files from the remote database."
  echo ""
fi

if [ ${#MISSING_REMOTE[@]} -gt 0 ]; then
  echo "Option 2: Push local migrations to remote"
  echo "  This will apply the local migrations to the remote database."
  echo ""
fi

echo "Option 3: Reset local to match remote"
echo "  WARNING: This will delete all local migrations and re-pull from remote."
echo ""

# Ask user what to do
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Run with --apply to execute one of these options:${NC}"
  echo "  --apply --linked     Push local migrations to remote"
  echo "  (Pull is automatic via 'npx supabase db pull')"
  exit 0
fi

# Apply the fix - push local migrations to remote
if [ ${#MISSING_REMOTE[@]} -gt 0 ]; then
  echo ""
  echo -e "${GREEN}→ Pushing local migrations to remote...${NC}"
  echo ""
  
  if [ "$USE_LINKED" = true ]; then
    npx supabase db push --linked
  else
    npx supabase db push --local
  fi
  
  echo ""
  echo -e "${GREEN}✅ Migration history repaired!${NC}"
fi
