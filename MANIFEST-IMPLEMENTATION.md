# Manifest System Implementation

## Overview

The manifest system is now fully implemented and provides 4-level tracking for the TV show quiz generation project.

## Architecture

### 4-Level Hierarchy

```
Global Manifest (data/tv-shows/manifest.json)
└── Series Manifest (data/tv-shows/{series}/manifest.json)
    └── Season Manifest (data/tv-shows/{series}/season-{N}/manifest.json)
        └── Episode Manifest (data/tv-shows/{series}/season-{N}/episode-{N}/manifest.json)
```

### Automatic Updates

The manifest system automatically updates when you:
1. **Scrape a transcript** - Creates/updates episode, season, series, and global manifests
2. **Generate questions** - Updates question statistics across all manifest levels

## Files

### Core Library
- **src/lib/manifest.ts** - All manifest functions (init, read, write, update)

### Scripts
- **src/init-manifests.ts** - Initialize manifests for existing data
- **src/scrape-tv.ts** - Integrated with manifest updates
- **src/generate-questions.ts** - Integrated with manifest updates

## Usage

### Initialize Manifests (One-time setup)

```bash
bun src/init-manifests.ts
```

This scans existing data and creates manifests for all series, seasons, and episodes.

### Normal Workflow

After initialization, manifests update automatically:

```bash
# Scrape transcript (creates/updates manifests)
bun src/scrape-tv.ts "Friends" 1 4

# Generate questions (updates manifests with question stats)
bun src/generate-questions.ts "Friends" 1 4
```

## Manifest Contents

### Episode Manifest
Tracks single episode:
- Episode info (series, season, episode, title)
- Transcript status (source, word count, quality)
- Questions status (count, difficulty distribution, type distribution)
- AI usage (model, tokens, cost)
- Files (transcript.json, questions.json, rawQuestions.json)

### Season Manifest
Tracks season progress:
- Progress (episodes completed/in progress/pending/failed)
- Statistics (total questions, word count, tokens, cost)
- Episode list with status
- Source reliability

### Series Manifest
Tracks entire series:
- Series metadata (name, genre, years, network)
- Progress across all seasons
- Statistics (questions, words, tokens, costs)
- Projected totals
- Quality assessment

### Global Manifest
Tracks all series:
- Overall statistics (2 series, 515 total episodes, 4 completed)
- Current stats (116 questions generated, 29 avg per episode)
- Series list with progress
- Phase tracking
- Source tracking

## Current Status

### Data as of 2025-12-16

**Overall Progress:**
- Total Series: 2 (Friends, The Big Bang Theory)
- Total Episodes: 515
- Episodes Completed: 4 (0.78% complete)
- Questions Generated: 116
- Average Questions Per Episode: 29

**Friends:**
- Episodes Completed: 3/236 (1.27%)
- Questions Generated: 79
- Status: In Progress

**The Big Bang Theory:**
- Episodes Completed: 1/279 (0.36%)
- Questions Generated: 37
- Status: In Progress

## Phase 1 Targets

From [TOP-50-SERIES.md](TOP-50-SERIES.md):

1. ✅ Friends (10 seasons, 236 episodes) - Started
2. ✅ The Big Bang Theory (12 seasons, 279 episodes) - Started
3. ⏳ Breaking Bad (5 seasons, 62 episodes) - Pending
4. ⏳ The Office (US) (9 seasons, 201 episodes) - Pending
5. ⏳ How I Met Your Mother (9 seasons, 208 episodes) - Pending

**Phase 1 Total:** 986 episodes → ~29,580 projected questions

## Monitoring Progress

### View Global Status
```bash
cat data/tv-shows/manifest.json | bun -e "JSON.parse(await Bun.stdin.text()).tvShows"
```

### View Series Status
```bash
cat data/tv-shows/friends/manifest.json | bun -e "JSON.parse(await Bun.stdin.text()).progress"
```

### View Season Status
```bash
cat data/tv-shows/friends/season-1/manifest.json | bun -e "JSON.parse(await Bun.stdin.text()).progress"
```

## Next Steps

1. **Continue Phase 1 Execution:**
   - Complete Friends Season 1 (21 episodes remaining)
   - Complete The Big Bang Theory Season 1 (16 episodes remaining)
   - Start Breaking Bad, The Office, How I Met Your Mother

2. **Build Manifest Viewer:**
   - Create dashboard to visualize progress
   - Show statistics and charts
   - Track daily/weekly progress

3. **Add Validation:**
   - Implement quality scoring
   - Add duplicate detection
   - Verify answer correctness

4. **Optimize Cost:**
   - Track token usage accurately
   - Calculate actual costs
   - Optimize prompt efficiency

## Technical Details

### Manifest Update Flow

```
Scrape Transcript:
1. scrapeAndSave() - Scrape and save transcript
2. initEpisodeManifest() - Create episode manifest if needed
3. updateEpisodeTranscript() - Update with transcript data
4. updateSeasonFromEpisodes() - Rollup to season
5. updateSeriesFromSeasons() - Rollup to series
6. updateGlobalFromSeries() - Rollup to global

Generate Questions:
1. generateQuestions() - Generate and save questions
2. updateEpisodeQuestions() - Update with question stats
3. updateSeasonFromEpisodes() - Rollup to season
4. updateSeriesFromSeasons() - Rollup to series
5. updateGlobalFromSeries() - Rollup to global
```

### Cost Tracking

Current implementation uses rough estimates:
- Cost per token: $0.00005 (approximation for Groq)
- Average tokens per episode: ~5,000-10,000

Future enhancement: Track actual token usage from Groq API responses.

---

**Status:** ✅ Fully Implemented and Tested
**Version:** 1.0
**Last Updated:** 2025-12-16
