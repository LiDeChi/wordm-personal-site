#!/usr/bin/env bash
set -euo pipefail

npx wrangler deploy workers/subdomain-proxy.ts \
  --name wordm-project-subdomains \
  --compatibility-date 2026-02-24 \
  --domains resume.wordm.us \
  --domains p-page-glance-extension.wordm.us \
  --domains p-apple-notes-webclipper.wordm.us \
  --domains p-personalinflationbasket.wordm.us \
  --domains p-llm-layer.wordm.us \
  --domains p-focusor.wordm.us \
  --domains p-code-agent-demo.wordm.us \
  --domains p-open-deep-research.wordm.us \
  --domains p-dynamic-delegate-2.wordm.us
