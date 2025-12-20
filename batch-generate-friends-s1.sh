#!/bin/bash

# Batch script to complete Friends Season 1
# Run this when Groq API rate limit resets

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📺 Batch Generate: Friends Season 1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Array of remaining episodes (9-24)
episodes=(9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24)

for ep in "${episodes[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📺 Processing Episode $ep"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Check if questions already exist
  if [ -f "data/tv-shows/friends/season-1/episode-$ep/questions.json" ]; then
    echo "✅ Episode $ep already has questions, skipping..."
    continue
  fi

  # Check if transcript exists, if not scrape it
  if [ ! -f "data/tv-shows/friends/season-1/episode-$ep/transcript.json" ]; then
    echo "📥 Scraping transcript for episode $ep..."
    bun src/scrape-tv.ts "Friends" 1 $ep
    if [ $? -ne 0 ]; then
      echo "❌ Failed to scrape episode $ep, stopping..."
      exit 1
    fi
  else
    echo "✅ Transcript already exists for episode $ep"
  fi

  # Generate questions
  echo "🤖 Generating questions for episode $ep..."
  bun src/generate-questions.ts "Friends" 1 $ep

  if [ $? -ne 0 ]; then
    echo "❌ Failed to generate questions for episode $ep"
    echo "⏰ Likely hit rate limit. Resume from episode $ep later."
    exit 1
  fi

  echo "✅ Episode $ep complete!"
  echo ""

  # Small delay between episodes to be nice to the API
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Friends Season 1 Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View progress:"
echo "  cat data/tv-shows/friends/season-1/manifest.json"
