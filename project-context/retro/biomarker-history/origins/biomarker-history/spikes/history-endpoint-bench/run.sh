#!/usr/bin/env bash
# Usage: run.sh <db-dir>   (run from repo root)
set -euo pipefail
SPIKE=$(dirname "$0"); DBS=$1; N=${N:-200}
bench() { uv run scripts/bench.py --base http://localhost:8001 --n "$N" "$@" | sed -n '1,3p'; }
serve() {
  PYTHONPATH=. SPIKE_DB=$1 uv run uvicorn spike_app:app --app-dir "$SPIKE" --port 8001 --log-level warning &
  PID=$!; sleep 3
}
for db in seed padded; do
  serve "$DBS/$db.db"
  echo "===== $db.db"
  members=(james.chen@example.com priya.raman@example.com tom.okafor@example.com sofia.marek@example.com)
  [ "$db" = padded ] && members=(james.chen@example.com)
  for m in "${members[@]}"; do
    echo "--- $m"
    bench --email "$m" --path /api/home
    bench --email "$m" --path /api/spike/home-a
    bench --email "$m" --path /api/spike/history/ldl_cholesterol
  done
  kill $PID; wait $PID 2>/dev/null || true
done
