#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_NAME="${CF_WORKER_NAME:-wordm-project-subdomains}"
ROUTE_PATTERN="${DEPLOY_SUBDOMAIN_ROUTE_PATTERN:-*.wordm.us/*}"

cd "$ROOT_DIR"

npx wrangler deploy workers/subdomain-proxy.ts \
  --name "$WORKER_NAME" \
  --compatibility-date 2026-02-24 \
  --keep-vars \
  --routes "$ROUTE_PATTERN"
