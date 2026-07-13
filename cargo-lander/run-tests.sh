#!/usr/bin/env bash
# One-command verification for cargo-lander. Runs every headless check the
# project has and exits non-zero if any of them fail:
#
#   1. boot smoke      — syntax-check.html: every game script parses, core
#                        globals + one method per mixin file exist
#   2. unit/behavior   — tests.html suite (must be "N passed / 0 failed")
#   3. editor logic    — level-editor.html?runTests=1 (undo/redo self-tests)
#   4. editor round-trip — autoload+dumpExport produces a registerLevel export
#   5. game boot probe — probe-screenshot.html renders a level and stamps the
#                        post-FX shader link status (implies full game boot)
#
# Usage: ./run-tests.sh            (from cargo-lander/, or any cwd)
#        CHROME=/path/to/chrome ./run-tests.sh
#
# Serves the folder itself on a scratch port — no setup needed beyond python3
# and a headless-capable Chromium.

set -u
cd "$(dirname "$0")"

# ── Locate a headless Chromium ───────────────────────────────────────────────
if [ -z "${CHROME:-}" ]; then
  for c in chrome chromium chromium-browser google-chrome \
           "/c/Program Files/Google/Chrome/Application/chrome.exe" \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
if [ -z "${CHROME:-}" ]; then echo "FATAL: no Chrome/Chromium found (set CHROME=...)"; exit 2; fi

# Prefer whichever python actually runs — on Windows, `python3` is often a
# Microsoft Store stub that opens a browser instead of executing.
PY=""
for p in python python3; do
  if "$p" -c "print(1)" >/dev/null 2>&1; then PY="$p"; break; fi
done
if [ -z "$PY" ]; then echo "FATAL: no working python found"; exit 2; fi

# ── Serve the folder ─────────────────────────────────────────────────────────
PORT=8177
BASE="http://localhost:$PORT"
"$PY" -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
# Wait until the server actually answers (up to ~10s)
for _ in $(seq 1 20); do
  if curl -s -o /dev/null "$BASE/tests.html"; then break; fi
  sleep 0.5
done

# Extra flags headless Linux sandboxes tend to need are harmless elsewhere
FLAGS=(--headless=new --disable-gpu --no-first-run --no-sandbox)

dump() { # dump <path> <virtual-time-budget-ms>
  "$CHROME" "${FLAGS[@]}" --virtual-time-budget="$2" --dump-dom "$BASE/$1" 2>/dev/null
}

FAILED=0
check() { # check <name> <ok:0|1> <detail>
  if [ "$2" -eq 0 ]; then echo "PASS  $1"; else echo "FAIL  $1 — $3"; FAILED=1; fi
}

# 1. Boot smoke — every script parses, mixins attached
OUT=$(dump "syntax-check.html" 5000 | tr -d '\r')
echo "$OUT" | grep -q '<pre id="err">no errors</pre>'
check "boot smoke (syntax-check.html)" $? "$(echo "$OUT" | sed -n 's/.*<pre id="err">//p' | head -4)"

# 2. Test suite
OUT=$(dump "tests.html" 15000)
SUMMARY=$(echo "$OUT" | grep -o 'Tests complete[^<]*<span class="pass">[0-9]* passed</span> / <span class="fail">[0-9]* failed' | sed 's/<[^>]*>//g' | head -1)
echo "$OUT" | grep -q '<span class="fail">0 failed'
check "test suite (${SUMMARY:-no summary found})" $? "see tests.html"

# 3. Editor logic self-tests
OUT=$(dump "level-editor.html?runTests=1" 8000)
echo "$OUT" | grep -q 'id="test-results">PASSED'
check "editor self-tests (?runTests=1)" $? "$(echo "$OUT" | grep -o 'id="test-results">[^<]*' | head -1)"

# 4. Editor load→export round trip
OUT=$(dump "level-editor.html?autoload=level1.js&dumpExport=1" 8000)
echo "$OUT" | grep -q 'id="headless-export-dump"' && echo "$OUT" | grep -q 'registerLevel({'
check "editor export round-trip (autoload level1)" $? "no export dump produced"

# 5. Game boot probe — level renders, shader status stamped
OUT=$(dump "probe-screenshot.html?level=0&debug=1" 9000)
echo "$OUT" | grep -qi 'postFX link'
check "game boot probe (probe-screenshot L1)" $? "no postFX stamp — game likely failed to boot"

echo
if [ "$FAILED" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "CHECKS FAILED"; fi
exit $FAILED
