#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

has_port() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
  fi
}

if command -v docker >/dev/null 2>&1; then
  docker compose up -d postgres redis
elif has_port 5432 && has_port 6379; then
  echo "Docker not found; using existing local Postgres on 5432 and Redis on 6379."
else
  echo "Cannot start local dependencies automatically." >&2
  echo "" >&2
  echo "Install and start Docker Desktop, then rerun:" >&2
  echo "  pnpm dev" >&2
  echo "" >&2
  echo "Or manually start compatible services first:" >&2
  echo "  Postgres: localhost:5432" >&2
  echo "  Redis:    localhost:6379" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  pnpm install
fi

pnpm prisma:generate
pnpm prisma:deploy

cleanup() {
  if [ -n "${API_PID:-}" ]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

pnpm start:dev &
API_PID=$!

echo "Waiting for API on http://localhost:3000 ..."
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:3000/docs >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS http://localhost:3000/docs >/dev/null 2>&1; then
  echo "API did not become ready within 60 seconds." >&2
  exit 1
fi

curl -fsS -X POST http://localhost:3000/portfolio/context/seed-ricki >/dev/null || true

echo ""
echo "AresQuant is running:"
echo "  API docs:      http://localhost:3000/docs"
echo "  Web dashboard: http://localhost:5173"
echo ""

pnpm web:dev
