# Smart Batch Generation Guide

## Overview

The smart batch generator is designed to **minimize token usage** and handle rate limits gracefully while generating questions for multiple episodes.

## Key Features

✅ **Auto-Skip Completed Episodes** - Saves tokens by skipping episodes that already have questions
✅ **Graceful Rate Limit Handling** - Stops automatically when rate limited and shows resume command
✅ **Easy Resume** - Pick up exactly where you left off
✅ **Transcript Pre-scraping** - Scrapes all transcripts first (no API usage)
✅ **Smart Delays** - 2-second delays between episodes to avoid hammering the API
✅ **Automatic Manifest Updates** - Tracks all progress automatically

## Usage

### Simple Commands (npm scripts)

```bash
# Complete Friends Season 1
npm run generate:friends:s1

# Complete Friends Season 2
npm run generate:friends:s2

# Complete Big Bang Theory Season 1
npm run generate:bbbt:s1
```

### Advanced Usage

```bash
# Generate specific episode range
bun scripts/batch-generate.ts "Friends" 1 14 24

# Generate entire season
bun scripts/batch-generate.ts "Friends" 2

# Resume from where it stopped (example)
bun scripts/batch-generate.ts "Friends" 1 15 24
```

## How It Minimizes Token Usage

1. **Skip Check** - Before generating, checks if `questions.json` exists
2. **Smart Skip Flag** - Uses `skipIfExists: true` in question generator
3. **Transcript Caching** - Transcripts are scraped once and reused
4. **No Regeneration** - Never regenerates existing questions unless forced

## Handling Rate Limits

When you hit the Groq API rate limit:

1. **Script stops gracefully** - No errors, clean exit
2. **Shows progress** - Tells you how many episodes were processed
3. **Provides resume command** - Exact command to continue
4. **Transcripts saved** - All transcripts are pre-scraped, so resuming is fast

### Rate Limit Info

- **Groq Limit:** ~100,000 tokens per day
- **Episodes per day:** ~8-15 episodes (depends on length)
- **Reset time:** Typically 1 hour, sometimes up to 24 hours
- **Strategy:** Run multiple small batches throughout the day

## Current Progress

### Friends
- **Season 1:** 14/24 episodes complete (58%)
- **Season 2:** 1/24 episodes have transcripts ready
- **Remaining:** 10 episodes in S1, all of S2-S10

### The Big Bang Theory
- **Season 1:** 1/17 episodes complete (6%)
- **Remaining:** 16 episodes in S1, all of S2-S12

## Recommended Workflow

### Option 1: Complete One Season at a Time

```bash
# Morning batch
npm run generate:friends:s1

# If rate limited, wait 1-2 hours, then resume
bun scripts/batch-generate.ts "Friends" 1 15 24

# Afternoon batch (after reset)
npm run generate:friends:s1  # Will auto-skip completed ones
```

### Option 2: Mix Different Shows

```bash
# Generate Friends until rate limited
npm run generate:friends:s1

# Wait for reset, then switch to Big Bang Theory
npm run generate:bbbt:s1

# This spreads out usage across different shows
```

### Option 3: Pre-scrape Everything (Recommended!)

```bash
# First, scrape ALL transcripts (no API usage, very fast!)
for ep in {1..24}; do
  bun src/scrape-tv.ts "Friends" 1 $ep
done

for ep in {1..24}; do
  bun src/scrape-tv.ts "Friends" 2 $ep
done

# Then generate questions in batches as rate limit allows
npm run generate:friends:s1
# ... wait for reset ...
npm run generate:friends:s2
```

## Monitoring Progress

### Check Season Progress
```bash
cat data/tv-shows/friends/season-1/manifest.json | grep -A 5 "progress"
```

### Check Global Progress
```bash
cat data/tv-shows/manifest.json | grep -A 10 "statistics"
```

### Count Completed Episodes
```bash
find data/tv-shows/friends/season-1 -name "questions.json" | wc -l
```

## Examples

### Complete Friends Season 1 (from scratch)

```bash
# This will:
# 1. Skip episodes 1-13 (already have questions)
# 2. Generate questions for episode 14
# 3. Hit rate limit
# 4. Tell you to resume from episode 15

npm run generate:friends:s1
```

Output:
```
🚀 Smart Batch Question Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Show:     Friends
Season:   1
Episodes: 1-24

📺 Processing S01E01
   ⏭️  Episode 1 - Already has questions, skipping

📺 Processing S01E02
   ⏭️  Episode 2 - Already has questions, skipping

... (skips 3-13) ...

📺 Processing S01E14
   ✅ Transcript already exists
   🤖 Generating questions...
   ✅ Generated 33 questions
   📊 Difficulty: Easy 12 | Medium 21 | Hard 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Rate Limit Reached

To resume, run:
  bun scripts/batch-generate.ts "Friends" 1 15 24
```

### Resume After Rate Limit

```bash
# Just copy the command it gave you
bun scripts/batch-generate.ts "Friends" 1 15 24
```

## Tips for Maximum Efficiency

1. **Pre-scrape transcripts** - Do this once for all episodes, uses zero API tokens
2. **Run small batches** - Generate 5-10 episodes at a time
3. **Use multiple API keys** - If you have multiple Groq accounts, rotate them
4. **Check before running** - Look at manifest to see what's already done
5. **Let it auto-skip** - Don't manually calculate what's left, the script does it

## Troubleshooting

### "Already has questions, skipping" for everything
✅ This is normal! It means you've already completed these episodes.

### Script stops immediately
- Check if you've already completed all episodes in that range
- Verify your Groq API key in `config.json`

### Rate limit hit on first episode
- You likely hit your daily limit already
- Wait 1 hour and try again
- Check `cat data/tv-shows/manifest.json` to see token usage

## Cost Optimization

### Current Stats (from your data)
- **Average:** 30 questions per episode
- **Token usage:** ~0 tracked (implement token tracking for accuracy)
- **Estimated cost:** Very low on Groq's free tier

### Maximizing Free Tier
1. Spread generation across multiple days
2. Use the auto-skip feature (never regenerate)
3. Pre-scrape all transcripts first
4. Run during off-peak hours if possible

---

**Status:** ✅ Fully Operational
**Token Saving:** ✅ Auto-skip prevents waste
**Rate Limit Handling:** ✅ Graceful stops with resume
**Progress Tracking:** ✅ Automatic manifests
