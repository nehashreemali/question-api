#!/bin/bash

# Regenerate all TV show questions with clean format
# Run this after API rate limit resets

echo "🔄 Regenerating all TV show questions..."
echo ""

# Friends Season 1 (episodes 1-10)
for ep in {2..10}; do
  echo "📺 Friends S01E$ep"
  bun src/generate-questions.ts "Friends" 1 $ep
  if [ $? -ne 0 ]; then
    echo "❌ Failed on Friends S01E$ep - stopping"
    exit 1
  fi
  echo ""
  sleep 2
done

echo "✅ All done!"
