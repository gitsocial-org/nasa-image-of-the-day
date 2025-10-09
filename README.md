# NASA Image of the Day Bot

Daily commits of NASA Image of the Day with 1920px images.

## Usage

```bash
# Fetch today's POTD
node scripts/fetch-potd.js

# Fetch specific date
node scripts/fetch-potd.js 2025-10-08

# Create commit for today
./scripts/commit-potd.sh

# Create commit for specific date
./scripts/commit-potd.sh 2025-10-08
```

## Automation

GitHub Action runs daily at 12:30 UTC, fetching and committing the Image of the Day with the correct date.
