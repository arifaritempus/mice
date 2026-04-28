#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/arifari/Desktop/TT_Sistem"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# 1) Tüm proje arşivi (geçici ve ağır klasörler hariç)
ARCHIVE="$BACKUP_DIR/TT_Sistem_backup_${TIMESTAMP}.tar.gz"
 tar -czf "$ARCHIVE" \
  --exclude='**/node_modules/**' \
  --exclude='**/.next/**' \
  --exclude='**/.turbo/**' \
  --exclude='**/.cache/**' \
  --exclude='**/.git/**' \
  --exclude='**/dist/**' \
  --exclude='**/build/**' \
  --exclude='**/backups/**' \
  -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"

# 2) page.tsx günlük dosya yedeği
PAGE_FILE="$PROJECT_DIR/frontend/src/app/projects/[id]/page.tsx"
if [ -f "$PAGE_FILE" ]; then
  cp "$PAGE_FILE" "$BACKUP_DIR/page.tsx.backup_${TIMESTAMP}"
fi

# 3) Eski arşivleri temizle
find "$BACKUP_DIR" -type f -name 'TT_Sistem_backup_*.tar.gz' -mtime +14 -delete || true
find "$BACKUP_DIR" -type f -name 'page.tsx.backup_*' -mtime +30 -delete || true

echo "Yedekleme tamamlandı: $ARCHIVE"
