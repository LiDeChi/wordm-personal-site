#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_NAME="${CF_AUTH_WORKER_NAME:-wordm-auth}"
AUTH_DOMAIN="${CF_AUTH_DOMAIN:-auth.wordm.us}"
AUTH_ROUTE_PATTERN="${CF_AUTH_ROUTE_PATTERN:-auth.wordm.us/*}"

cd "$ROOT_DIR"

npx wrangler deploy workers/wordm-auth.ts \
  --name "$WORKER_NAME" \
  --compatibility-date 2026-06-28 \
  --keep-vars \
  --domains "$AUTH_DOMAIN" \
  --routes "$AUTH_ROUTE_PATTERN"
