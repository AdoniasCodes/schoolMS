#!/bin/bash
# Pings Supabase DB to prevent free-tier auto-pause (7-day inactivity limit)
# Run via cron every 5 days:
#   crontab -e
#   0 0 */5 * * /path/to/scripts/keep-alive.sh >> /tmp/supabase-keepalive.log 2>&1

SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "$(date) - ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
  exit 1
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/roles?select=key&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if [ "$STATUS" -eq 200 ]; then
  echo "$(date) - OK: Supabase pinged successfully (HTTP $STATUS)"
else
  echo "$(date) - WARN: Supabase returned HTTP $STATUS"
fi
