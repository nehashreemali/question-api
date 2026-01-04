#!/bin/bash
#
# SQLite Database Restore Script
#
# Usage:
#   ./scripts/restore-databases.sh                     # Restore from latest
#   ./scripts/restore-databases.sh 2026-01-04_030000   # Restore specific backup
#   ./scripts/restore-databases.sh --list              # List available backups
#
# What it does:
#   1. Extracts backup archive to temp directory
#   2. Verifies integrity of backup files
#   3. Moves current DBs to .corrupted suffix
#   4. Restores backup files to data/
#

set -euo pipefail

# Configuration
DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/data"
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# List available backups
if [[ "${1:-}" == "--list" ]]; then
    echo "Available backups:"
    echo ""
    for archive in $(find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort -r); do
        name=$(basename "$archive" .tar.gz)
        size=$(stat -f%z "$archive" 2>/dev/null || stat -c%s "$archive" 2>/dev/null || echo "?")
        if [[ -L "$BACKUP_DIR/latest.tar.gz" ]] && [[ "$(readlink "$BACKUP_DIR/latest.tar.gz")" == "$(basename "$archive")" ]]; then
            echo "  $name  ($(numfmt --to=iec $size 2>/dev/null || echo "${size}B"))  <- latest"
        else
            echo "  $name  ($(numfmt --to=iec $size 2>/dev/null || echo "${size}B"))"
        fi
    done
    exit 0
fi

# Determine which backup to restore
if [[ -n "${1:-}" ]]; then
    BACKUP_NAME="$1"
    ARCHIVE_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
else
    ARCHIVE_PATH="$BACKUP_DIR/latest.tar.gz"
    if [[ -L "$ARCHIVE_PATH" ]]; then
        BACKUP_NAME=$(basename "$(readlink "$ARCHIVE_PATH")" .tar.gz)
    else
        log_error "No backup specified and no 'latest' symlink found"
        log_info "Usage: $0 [backup-name]"
        log_info "       $0 --list"
        exit 1
    fi
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
    log_error "Backup not found: $ARCHIVE_PATH"
    exit 1
fi

log_info "Restoring from: $BACKUP_NAME"

# Confirm with user
echo ""
log_warn "This will replace all databases in $DATA_DIR"
log_warn "Current databases will be renamed to *.corrupted"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Aborted"
    exit 0
fi

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

log_info "Extracting backup..."
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR"

# Find the extracted directory (should match backup name)
EXTRACT_DIR="$TEMP_DIR/$BACKUP_NAME"
if [[ ! -d "$EXTRACT_DIR" ]]; then
    # Try finding any directory
    EXTRACT_DIR=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -1)
fi

if [[ ! -d "$EXTRACT_DIR" ]]; then
    log_error "Could not find extracted backup directory"
    exit 1
fi

# Show manifest if available
if [[ -f "$EXTRACT_DIR/manifest.json" ]]; then
    log_info "Backup manifest:"
    cat "$EXTRACT_DIR/manifest.json"
    echo ""
fi

# Verify and restore each database
for DB_FILE in "$EXTRACT_DIR"/*.db; do
    [[ -f "$DB_FILE" ]] || continue

    DB_NAME=$(basename "$DB_FILE")
    TARGET_PATH="$DATA_DIR/$DB_NAME"

    log_info "Verifying $DB_NAME..."
    INTEGRITY=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;" 2>&1)
    if [[ "$INTEGRITY" != "ok" ]]; then
        log_error "Backup file $DB_NAME failed integrity check: $INTEGRITY"
        exit 1
    fi

    # Move current DB to .corrupted (if exists)
    if [[ -f "$TARGET_PATH" ]]; then
        CORRUPTED_PATH="$TARGET_PATH.corrupted"
        log_info "Moving current $DB_NAME to $DB_NAME.corrupted"
        mv "$TARGET_PATH" "$CORRUPTED_PATH"
        # Also move WAL files if present
        [[ -f "$TARGET_PATH-wal" ]] && mv "$TARGET_PATH-wal" "$CORRUPTED_PATH-wal"
        [[ -f "$TARGET_PATH-shm" ]] && mv "$TARGET_PATH-shm" "$CORRUPTED_PATH-shm"
    fi

    # Copy backup to data directory
    log_info "Restoring $DB_NAME..."
    cp "$DB_FILE" "$TARGET_PATH"
done

echo ""
log_info "Restore completed successfully!"
echo ""
echo "Restored databases:"
ls -la "$DATA_DIR"/*.db

echo ""
log_info "Old databases saved with .corrupted suffix"
log_info "Delete them manually once you've verified the restore:"
echo "  rm $DATA_DIR/*.corrupted"
