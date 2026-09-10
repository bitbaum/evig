#!/usr/bin/env bash
# Regression tests for scripts/ops/run-cron.sh.
#
# The bug this exists for: on 2026-09-10 the box rebooted at 08:01:48 UTC, the
# `Persistent=true` timecard-reminders timer caught up its missed 08:00 run at
# 08:01:58, and evig-app only bound :4004 at 08:02:00. curl's connection-refused
# became the script's exit status, the daily unit sat `failed` for 24h, and that
# day's reminder emails never went out. run-cron.sh must now ride out an app
# that is still starting — WITHOUT going soft on a genuinely broken endpoint.
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1

RUN_CRON=scripts/ops/run-cron.sh
[ -x "$RUN_CRON" ] || { echo "FAIL: $RUN_CRON missing or not executable"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; jobs -p | xargs -r kill 2>/dev/null' EXIT

ENV_FILE="$TMP/.env"
printf 'CRON_SECRET="test-secret"\n' > "$ENV_FILE"

pass=0; fail=0
ok()   { echo "  ok   — $1"; pass=$((pass + 1)); }
bad()  { echo "  FAIL — $1"; fail=$((fail + 1)); }

free_port() { python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()'; }

# Cases that time the script must not start the clock while the *test's* own
# server is still binding — that lag is itself connection-refused, and would be
# scored as run-cron retrying when it was only doing its job.
wait_for_port() {
  for _ in $(seq 1 100); do
    python3 -c "import socket,sys;s=socket.socket();s.settimeout(0.2);sys.exit(0 if s.connect_ex(('127.0.0.1',$1))==0 else 1)" && return 0
    sleep 0.1
  done
  echo "  FAIL — test server never came up on :$1"; exit 1
}

# Serves <status> on every path until killed. Written to a file so each case can
# start it at the moment it wants the "app" to come up.
cat > "$TMP/server.py" <<'PY'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

status = int(sys.argv[2])

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b'{"ok":true}' if status == 200 else b'{"error":"boom"}'
        self.send_response(status)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a):
        pass

HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PY

# --- 1. The incident: app is not listening yet, then comes up ----------------
port="$(free_port)"
# `trap - EXIT` first: bash inherits the EXIT trap into a ( ) subshell, so
# without this the backgrounded runner rm -rf's $TMP the moment it finishes and
# the rest of the suite races a deleted temp dir.
( trap - EXIT
  APP_ENV="$ENV_FILE" PORT="$port" RETRY_ATTEMPTS=10 RETRY_SLEEP_SECS=1 \
    bash "$RUN_CRON" timecard-reminders > "$TMP/late.out" 2>&1; echo $? > "$TMP/late.rc" ) &
runner=$!
sleep 3
python3 "$TMP/server.py" "$port" 200 & late_srv=$!
wait "$runner"
kill "$late_srv" 2>/dev/null
rc="$(cat "$TMP/late.rc")"
if [ "$rc" = "0" ] && grep -q 'HTTP 200' "$TMP/late.out"; then
  ok "app that binds its port late is waited for, not failed (exit 0)"
else
  bad "late-starting app should exit 0 with HTTP 200, got rc=$rc: $(cat "$TMP/late.out")"
fi
grep -q 'retrying' "$TMP/late.out" \
  && ok "the wait is visible in the journal, not silent" \
  || bad "no retry line logged — a silent wait is indistinguishable from a hang"

# --- 2. A real HTTP error must still fail, and fail FAST ---------------------
port="$(free_port)"
python3 "$TMP/server.py" "$port" 500 & err_srv=$!
wait_for_port "$port"
start=$SECONDS
APP_ENV="$ENV_FILE" PORT="$port" RETRY_ATTEMPTS=10 RETRY_SLEEP_SECS=5 \
  bash "$RUN_CRON" timecard-reminders > "$TMP/err.out" 2>&1
rc=$?
elapsed=$((SECONDS - start))
kill "$err_srv" 2>/dev/null
[ "$rc" -ne 0 ] && ok "HTTP 500 still fails the unit (exit $rc)" \
                || bad "HTTP 500 exited 0 — a broken endpoint would look healthy"
[ "$elapsed" -lt 5 ] && ok "HTTP 500 fails on the first response, no retry budget burned" \
                     || bad "HTTP 500 was retried (${elapsed}s) — only connection-refused may retry"
grep -q 'HTTP 500' "$TMP/err.out" && ok "the failing status reaches the journal" \
                                  || bad "status missing from output: $(cat "$TMP/err.out")"

# --- 3. Nothing ever listens: give up, bounded, and say why ------------------
port="$(free_port)"
start=$SECONDS
APP_ENV="$ENV_FILE" PORT="$port" RETRY_ATTEMPTS=3 RETRY_SLEEP_SECS=1 \
  bash "$RUN_CRON" timecard-reminders > "$TMP/dead.out" 2>&1
rc=$?
elapsed=$((SECONDS - start))
[ "$rc" -ne 0 ] && ok "an app that never comes up still fails the unit (exit $rc)" \
                || bad "unreachable app exited 0"
[ "$elapsed" -lt 30 ] && ok "retries are bounded (${elapsed}s, inside TimeoutStartSec=180)" \
                      || bad "retry budget ran ${elapsed}s — risks systemd's start timeout"
grep -q 'could not reach' "$TMP/dead.out" && ok "gives the reason it gave up" \
                                          || bad "no reason logged: $(cat "$TMP/dead.out")"

# --- 4. No CRON_SECRET: must still run (routes skip auth when it is unset) ---
port="$(free_port)"
python3 "$TMP/server.py" "$port" 200 & bare_srv=$!
wait_for_port "$port"
: > "$TMP/empty.env"
APP_ENV="$TMP/empty.env" PORT="$port" bash "$RUN_CRON" timecard-reminders > "$TMP/bare.out" 2>&1
rc=$?
kill "$bare_srv" 2>/dev/null
[ "$rc" -eq 0 ] && ok "runs with no CRON_SECRET set (set -e does not kill the empty-header path)" \
               || bad "unset CRON_SECRET aborted the run (exit $rc): $(cat "$TMP/bare.out")"

echo
echo "run-cron: $pass pass · $fail fail"
[ "$fail" -eq 0 ]
