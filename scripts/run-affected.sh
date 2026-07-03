#!/usr/bin/env bash
# Runs only the E2E tests affected by the current git diff.
# Usage: bash scripts/run-affected.sh [baseRef] [--ci]
set -euo pipefail

BASE_REF="${1:-origin/main}"
CI_FLAG="${2:-}"

PATTERN="$(node scripts/get-affected-tags.ts "$BASE_REF" $CI_FLAG)"

if [ -z "$PATTERN" ]; then
  echo "No affected E2E tags for diff against $BASE_REF — skipping test run."
  exit 0
fi

echo "Running E2E tests matching: $PATTERN"
npx playwright test --grep="$PATTERN"
