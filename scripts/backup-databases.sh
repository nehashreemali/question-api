#!/bin/bash
#
# SQLite Database Backup Script
#
# Usage:
#   ./scripts/backup-databases.sh           # Run backup
#   ./scripts/backup-databases.sh --dry-run # Show what would happen
#
# What it does:
#   1. Checkpoints WAL files (flushes to main db)
#   2. Runs integrity check on each database
#   3. Creates safe backup copies using sqlite3 .backup
#   4. Compresses to timestamped archive
#   5. Maintains last 7 days of backups
#

set -euo pipefail

# Configuration
DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/data"
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
KEEP_DAYS=7
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
DRY_RUN=false

# Parse arguments
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "[DRY RUN] No changes will be made"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    log_error "sqlite3 is required but not installed"
    exit 1
fi

# Create backup directory
SNAPSHOT_DIR="$BACKUP_DIR/$TIMESTAMP"
if [[ "$DRY_RUN" == false ]]; then
    mkdir -p "$SNAPSHOT_DIR"
fi
log_info "Backup destination: $SNAPSHOT_DIR"

# Find all .db files
DB_FILES=$(find "$DATA_DIR" -maxdepth 1 -name "*.db" -type f 2>/dev/null || true)

if [[ -z "$DB_FILES" ]]; then
    log_warn "No database files found in $DATA_DIR"
    exit 0
fi

# Initialize manifest
MANIFEST="{\"timestamp\": \"$TIMESTAMP\", \"databases\": ["
FIRST=true
FAILED=false

for DB_PATH in $DB_FILES; do
    DB_NAME=$(basename "$DB_PATH")
    log_info "Processing $DB_NAME..."

    # Step 1: Checkpoint WAL (flush pending writes)
    log_info "  Checkpointing WAL..."
    if [[ "$DRY_RUN" == false ]]; then
        sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
    fi

    # Step 2: Integrity check
    log_info "  Running integrity check..."
    if [[ "$DRY_RUN" == false ]]; then
        INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>&1)
        if [[ "$INTEGRITY" != "ok" ]]; then
            log_error "  Integrity check FAILED for $DB_NAME: $INTEGRITY"
            FAILED=true
            continue
        fi
    else
        INTEGRITY="ok (dry run)"
    fi
    log_info "  Integrity: $INTEGRITY"

    # Step 3: Get row count for manifest
    if [[ "$DRY_RUN" == false ]]; then
        # Try to get count from questions table, fallback to 0
        ROW_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM questions;" 2>/dev/null || echo "0")
    else
        ROW_COUNT="0"
    fi

    # Step 4: Create backup using sqlite3 .backup command
    # This is the safest way to copy a SQLite database
    BACKUP_PATH="$SNAPSHOT_DIR/$DB_NAME"
    log_info "  Creating backup..."
    if [[ "$DRY_RUN" == false ]]; then
        sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"

        # Verify backup integrity
        BACKUP_CHECK=$(sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" 2>&1)
        if [[ "$BACKUP_CHECK" != "ok" ]]; then
            log_error "  Backup integrity check FAILED: $BACKUP_CHECK"
            rm -f "$BACKUP_PATH"
            FAILED=true
            continue
        fi
    fi

    # Add to manifest
    if [[ "$FIRST" == true ]]; then
        FIRST=false
    else
        MANIFEST+=","
    fi

    SIZE=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH" 2>/dev/null || echo "0")
    MANIFEST+="{\"name\": \"$DB_NAME\", \"size\": $SIZE, \"rows\": $ROW_COUNT, \"integrity\": \"ok\"}"

    log_info "  Done: $DB_NAME ($ROW_COUNT rows, $(numfmt --to=iec $SIZE 2>/dev/null || echo "${SIZE}B"))"
done

MANIFEST+="]}"

# Write manifest
if [[ "$DRY_RUN" == false ]]; then
    echo "$MANIFEST" | python3 -m json.tool > "$SNAPSHOT_DIR/manifest.json" 2>/dev/null || echo "$MANIFEST" > "$SNAPSHOT_DIR/manifest.json"
fi

# Step 5: Compress backup
ARCHIVE_PATH="$BACKUP_DIR/$TIMESTAMP.tar.gz"
log_info "Compressing backup..."
if [[ "$DRY_RUN" == false ]]; then
    tar -czf "$ARCHIVE_PATH" -C "$BACKUP_DIR" "$TIMESTAMP"
    ARCHIVE_SIZE=$(stat -f%z "$ARCHIVE_PATH" 2>/dev/null || stat -c%s "$ARCHIVE_PATH" 2>/dev/null || echo "0")
    log_info "Archive created: $ARCHIVE_PATH ($(numfmt --to=iec $ARCHIVE_SIZE 2>/dev/null || echo "${ARCHIVE_SIZE}B"))"

    # Remove uncompressed snapshot (keep only archive)
    rm -rf "$SNAPSHOT_DIR"
fi

# Step 6: Update 'latest' symlink
if [[ "$DRY_RUN" == false ]]; then
    rm -f "$BACKUP_DIR/latest.tar.gz"
    ln -sf "$TIMESTAMP.tar.gz" "$BACKUP_DIR/latest.tar.gz"
    log_info "Updated latest symlink"
fi

# Step 7: Clean up old backups
log_info "Cleaning up backups older than $KEEP_DAYS days..."
if [[ "$DRY_RUN" == false ]]; then
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$KEEP_DAYS -delete 2>/dev/null || true
    REMAINING=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f | wc -l | tr -d ' ')
    log_info "Keeping $REMAINING backup(s)"
fi

# Summary
echo ""
if [[ "$FAILED" == true ]]; then
    log_error "Backup completed with errors - check logs above"
    exit 1
else
    log_info "Backup completed successfully!"
    echo ""
    echo "To restore from this backup:"
    echo "  tar -xzf $ARCHIVE_PATH -C /tmp"
    echo "  cp /tmp/$TIMESTAMP/*.db $DATA_DIR/"
fi
