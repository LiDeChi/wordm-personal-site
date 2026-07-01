#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"

strip_wrapping_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

extract_env_value() {
  local file="$1"
  local key="$2"
  local raw

  raw="$(grep -E "^${key}=" "$file" | tail -n 1 | sed -E "s/^${key}=//")"
  raw="$(printf '%s' "$raw" | tr -d '\r')"
  strip_wrapping_quotes "$raw"
}

load_supabase_env_from() {
  local file="$1"
  [[ -f "$file" ]] || return 1

  local url
  local anon
  url="$(extract_env_value "$file" "VITE_SUPABASE_URL")"
  anon="$(extract_env_value "$file" "VITE_SUPABASE_ANON_KEY")"

  [[ -n "$url" && -n "$anon" ]] || return 1

  if [[ -z "${VITE_SUPABASE_URL:-}" ]]; then
    export VITE_SUPABASE_URL="$url"
  fi

  if [[ -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
    export VITE_SUPABASE_ANON_KEY="$anon"
  fi

  return 0
}

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  for candidate in \
    "$ROOT_DIR/.env.local" \
    "$ROOT_DIR/.env" \
    "$WORKSPACE_DIR/gridnote/.env.local"
  do
    if load_supabase_env_from "$candidate"; then
      echo "Loaded Supabase env from: $candidate"
      break
    fi
  done
fi

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  cat >&2 <<'MSG'
Missing Supabase env vars for build:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Set them in your shell, or place them in one of:
- my-blog/.env.local
- my-blog/.env
- ../gridnote/.env.local
MSG
  exit 1
fi

cd "$ROOT_DIR"
npm run build
PAGES_PROJECT="${CF_PAGES_PROJECT:-my-blog}"
PAGES_BRANCH="${CF_PAGES_BRANCH:-$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'main')}"

if [[ -z "$PAGES_BRANCH" || "$PAGES_BRANCH" == "HEAD" ]]; then
  PAGES_BRANCH="main"
fi

echo "Deploying Pages project '$PAGES_PROJECT' to branch '$PAGES_BRANCH'"
npx wrangler pages deploy dist --project-name "$PAGES_PROJECT" --branch "$PAGES_BRANCH" --commit-dirty=true
