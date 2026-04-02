#!/usr/bin/env bash
# Refresh vendored Swagger UI assets (FastAPI /docs without CDN).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/backend/static/swagger-ui"
mkdir -p "$DIR"
BASE="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5"
curl -sSL -o "$DIR/swagger-ui-bundle.js" "$BASE/swagger-ui-bundle.js"
curl -sSL -o "$DIR/swagger-ui.css" "$BASE/swagger-ui.css"
curl -sSL -o "$DIR/favicon.png" "$BASE/favicon-32x32.png" || true
echo "Updated $DIR"
