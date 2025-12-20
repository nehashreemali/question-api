#!/bin/bash

# Complete remaining Friends Season 1 episodes
# This script will keep retrying with delays until successful

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Complete Remaining Friends S1 Episodes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

episodes=(20 22 23)

for ep in "${episodes[@]}"; do
  success=false
  attempts=0
  max_attempts=10

  while [ "$success" = false ] && [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    echo "📺 Episode $ep - Attempt $attempts/$max_attempts"

    bun src/generate-questions.ts "Friends" 1 $ep

    if [ $? -eq 0 ]; then
      echo "✅ Episode $ep completed!"
      success=true
    else
      if [ $attempts -lt $max_attempts ]; then
        wait_time=$((30 + attempts * 10))
        echo "⏳ Rate limited. Waiting ${wait_time} seconds before retry..."
        sleep $wait_time
      else
        echo "❌ Episode $ep failed after $max_attempts attempts"
        echo "💡 The rate limit is still active. Try again later with:"
        echo "   bun src/generate-questions.ts \"Friends\" 1 $ep"
      fi
    fi
  done

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All remaining episodes processed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
