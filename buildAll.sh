#!/usr/bin/env bash
set -euo pipefail

echo "=== Format check ==="
npm run format:check

echo ""
echo "=== Lint ==="
npm run lint

echo ""
echo "=== Build (includes astro check + pagefind) ==="
npm run build

echo ""
echo "=== All checks passed ==="
