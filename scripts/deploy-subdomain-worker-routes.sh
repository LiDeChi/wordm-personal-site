#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Route-only deployments previously replaced the Worker trigger set. Keep the
# wildcard route and the certificate-carrying custom domains in one deployment.
exec "$ROOT_DIR/scripts/deploy-subdomain-worker.sh"
