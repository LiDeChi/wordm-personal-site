#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SNAPSHOT_FILE="$ROOT_DIR/src/data/projects.snapshot.json"

if [[ ! -f "$SNAPSHOT_FILE" ]]; then
  echo "Missing snapshot file: $SNAPSHOT_FILE" >&2
  exit 1
fi

domain_output="$(node - "$SNAPSHOT_FILE" <<'NODE'
const fs = require('fs')
const snapshotFile = process.argv[2]
const payload = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'))
const set = new Set(['resume.wordm.us', 'cv.wordm.us', 'admin.wordm.us'])

for (const project of payload.projects || []) {
  const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
  if (subdomain) {
    set.add(`${subdomain}.wordm.us`)
  }
}

for (const domain of [...set].sort((a, b) => a.localeCompare(b))) {
  console.log(domain)
}
NODE
)"

args=()
while IFS= read -r domain; do
  [[ -z "$domain" ]] && continue
  args+=(--domains "$domain")
done <<< "$domain_output"

npx wrangler deploy workers/subdomain-proxy.ts \
  --name wordm-project-subdomains \
  --compatibility-date 2026-02-24 \
  "${args[@]}"
