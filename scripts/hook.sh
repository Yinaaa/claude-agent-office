#!/usr/bin/env bash
# Claude Code hook forwarder → claude-agent-office server
HOOK_TYPE="${1:-PreToolUse}"

# Write stdin to temp file, then POST async (never blocks Claude)
TMPFILE=$(mktemp /tmp/claude_hook_XXXXXX.json)
cat > "$TMPFILE"

python3 <<PYEOF "$HOOK_TYPE" "$TMPFILE" &
import sys, json, urllib.request, os
try:
    with open(sys.argv[2]) as f:
        data = json.load(f)
    data['hookType'] = sys.argv[1]
    req = urllib.request.Request(
        'http://localhost:3141/event',
        json.dumps(data).encode(),
        {'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req, timeout=2)
except Exception:
    pass
finally:
    try: os.unlink(sys.argv[2])
    except: pass
PYEOF

exit 0
