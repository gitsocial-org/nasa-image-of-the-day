#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE_ARG="${1:-}"

echo "Fetching Picture of the Day..."

OUTPUT=$(node "$SCRIPT_DIR/fetch-potd.js" "$DATE_ARG" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "Error: fetch-potd.js failed with exit code $EXIT_CODE" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

if [ -z "$OUTPUT" ]; then
  echo "Error: No output from fetch-potd.js" >&2
  exit 1
fi

if echo "$OUTPUT" | grep -q "Error fetching Picture of the Day"; then
  echo "Error: fetch-potd.js returned an error:" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

# Extract publish date and commit message
PUBLISH_DATE=$(echo "$OUTPUT" | grep "^PublishDate:" | cut -d' ' -f2)
COMMIT_MESSAGE=$(echo "$OUTPUT" | sed '/^PublishDate:/d')

if [ -z "$PUBLISH_DATE" ]; then
  echo "Error: Could not extract publish date from output" >&2
  exit 1
fi

# Extract title (first line of commit message)
TITLE=$(echo "$COMMIT_MESSAGE" | head -n1)

# Check if last commit has the same title (duplicate detection)
LAST_COMMIT_TITLE=$(git log -1 --format=%s 2>/dev/null || echo "")
if [ "$LAST_COMMIT_TITLE" = "$TITLE" ]; then
  echo "Skipping: Image '$TITLE' already committed"
  exit 0
fi

echo "Creating commit with date: $PUBLISH_DATE..."

git commit --allow-empty --date="${PUBLISH_DATE}T00:00:00Z" -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
  echo "Successfully committed Picture of the Day for $PUBLISH_DATE"
else
  echo "Error: git commit failed" >&2
  exit 1
fi
