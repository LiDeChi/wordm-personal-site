#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_NAME="${CF_WORKER_NAME:-wordm-project-subdomains}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-794b63fe0f5c7cccb9968718bb16ed39}"
ROUTE_PATTERN="${DEPLOY_SUBDOMAIN_ROUTE_PATTERN:-*.wordm.us/*}"

cd "$ROOT_DIR"

domain_output="$(
  WORKER_NAME="$WORKER_NAME" \
    CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" \
    node scripts/resolve-subdomain-worker-domains.mjs
)"

args=()
while IFS= read -r domain; do
  [[ -z "$domain" ]] && continue
  args+=(--domains "$domain")
done <<< "$domain_output"

npx wrangler deploy workers/subdomain-proxy.ts \
  --name "$WORKER_NAME" \
  --compatibility-date 2026-02-24 \
  --keep-vars \
  --routes "$ROUTE_PATTERN" \
  "${args[@]}"

node scripts/ensure-worker-exclusion-routes.mjs
