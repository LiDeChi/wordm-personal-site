#!/usr/bin/env bash

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_INPUT="${CODEX_WORKTREE_PATH:-$PROJECT_ROOT}"
HOST="127.0.0.1"
SERVER_PID=""

if [[ ! -d "$WORKTREE_INPUT" ]]; then
  printf '无法定位 my-blog 工作树：%s\n' "$WORKTREE_INPUT" >&2
  exit 1
fi

WORKTREE_PATH="$(cd "$WORKTREE_INPUT" && pwd -P)"

if [[ ! -f "$WORKTREE_PATH/package.json" ]] || [[ ! -f "$WORKTREE_PATH/src/main.tsx" ]]; then
  printf '无法定位 my-blog 工作树：%s\n' "$WORKTREE_PATH" >&2
  exit 1
fi

GIT_COMMON_DIR="$(git -C "$WORKTREE_PATH" rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -n "$GIT_COMMON_DIR" ]] && [[ "$GIT_COMMON_DIR" != /* ]]; then
  GIT_COMMON_DIR="$(cd "$WORKTREE_PATH/$GIT_COMMON_DIR" && pwd -P)"
fi
PRIMARY_WORKTREE_PATH="$(dirname "$GIT_COMMON_DIR")"

if [[ -n "${OPEN_EXPERIENCE_PORT:-}" ]]; then
  PORT="$OPEN_EXPERIENCE_PORT"
elif [[ "$WORKTREE_PATH" == "$PRIMARY_WORKTREE_PATH" ]]; then
  PORT="44014"
else
  WORKTREE_CHECKSUM="$(printf '%s' "$WORKTREE_PATH" | cksum | awk '{print $1}')"
  PORT="$((44100 + WORKTREE_CHECKSUM % 800))"
fi

ROOT_URL="http://${HOST}:${PORT}/"
EXPERIENCE_URL="${ROOT_URL}?lang=zh"

cd "$WORKTREE_PATH"

is_worktree_listener() {
  local listener_pids
  local listener_pid
  local listener_cwd

  listener_pids="$(lsof -t -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  while IFS= read -r listener_pid; do
    [[ -n "$listener_pid" ]] || continue
    listener_cwd="$(
      lsof -a -p "$listener_pid" -d cwd -Fn 2>/dev/null |
        sed -n 's/^n//p' |
        head -n 1
    )"
    if [[ "$listener_cwd" == "$WORKTREE_PATH" ]]; then
      return 0
    fi
  done <<< "$listener_pids"

  return 1
}

is_project_server() {
  local response

  is_worktree_listener || return 1
  response="$(curl --silent --show-error --max-time 2 "$ROOT_URL" 2>/dev/null || true)"
  [[ "$response" == *"Jian Yongjie | Personal Systems & Projects"* ]] &&
    [[ "$response" == *"/src/main.tsx"* ]]
}

open_experience() {
  if [[ "${OPEN_EXPERIENCE_NO_OPEN:-0}" == "1" ]]; then
    printf '体验已就绪：%s\n' "$EXPERIENCE_URL"
    return 0
  fi

  if command -v open >/dev/null 2>&1; then
    open "$EXPERIENCE_URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$EXPERIENCE_URL"
  else
    printf '体验已就绪，请打开：%s\n' "$EXPERIENCE_URL"
  fi
}

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

if is_project_server; then
  open_experience
  exit 0
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  printf '端口 %s 已被其他服务占用，未启动错误的项目。\n' "$PORT" >&2
  exit 1
fi

trap cleanup EXIT INT TERM
npm run dev -- --host "$HOST" --port "$PORT" --strictPort &
SERVER_PID=$!

for _ in $(seq 1 80); do
  if is_project_server; then
    open_experience
    wait "$SERVER_PID"
    exit $?
  fi

  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    wait "$SERVER_PID"
    exit $?
  fi

  sleep 0.25
done

printf '开发服务器未在预期时间内就绪：%s\n' "$ROOT_URL" >&2
exit 1
