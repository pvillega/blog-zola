#!/bin/sh

# Purge Cloudflare cache after deployment
# Requires CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables

set -e

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Error: CLOUDFLARE_ZONE_ID not set"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN not set"
  exit 1
fi

echo "Purging Cloudflare cache for zone ${CLOUDFLARE_ZONE_ID}..."

response=$(curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

success=$(echo "$response" | grep -o '"success":\s*true' || true)

if [ -n "$success" ]; then
  echo "Cache purged successfully!"
else
  echo "Failed to purge cache:"
  echo "$response"
  exit 1
fi
