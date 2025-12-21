# Manifest Schema Design

**Structure:** 3-level hierarchy with manifests at each level

```
data/tv-shows/
├── manifest.json                          ← Global TV Shows Manifest
├── friends/
│   ├── manifest.json                      ← Series Level Manifest
│   ├── season-1/
│   │   ├── manifest.json                  ← Season Level Manifest
│   │   ├── episode-1/
│   │   │   ├── manifest.json              ← Episode Level Manifest
│   │   │   ├── transcript.json
│   │   │   ├── questions.json
│   │   │   └── rawQuestions.json
│   │   ├── episode-2/
│   │   │   ├── manifest.json
│   │   │   ├── transcript.json
│   │   │   ├── questions.json
│   │   │   └── rawQuestions.json
│   │   └── ...
│   ├── season-2/
│   │   ├── manifest.json
│   │   └── ...
│   └── ...
└── the-big-bang-theory/
    ├── manifest.json
    └── ...
```

---

## Level 1: Episode Level Manifest

**Location:** `data/tv-shows/{series}/season-{N}/episode-{N}/manifest.json`

**Purpose:** Track single episode data generation status

```json
{
  "episode": {
    "series": "Friends",
    "seriesSlug": "friends",
    "season": 1,
    "episode": 1,
    "title": "The One Where Monica Gets a Roommate",
    "airDate": "1994-09-22",
    "runtime": 22
  },
  "transcript": {
    "status": "completed",
    "source": "Friends Transcripts (fangj.github.io)",
    "sourceUrl": "https://fangj.github.io/friends/season/0101.html",
    "scrapedAt": "2025-12-15T15:30:00.000Z",
    "wordCount": 4424,
    "hasCharacterNames": true,
    "quality": "excellent"
  },
  "questions": {
    "status": "completed",
    "generatedAt": "2025-12-15T15:35:00.000Z",
    "totalCount": 24,
    "distribution": {
      "easy": 8,
      "medium": 15,
      "hard": 1
    },
    "types": {
      "dialogue": 12,
      "scene": 6,
      "character": 4,
      "plot": 2
    },
    "aiModel": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "tokensUsed": 5234
  },
  "files": {
    "transcript": "transcript.json",
    "questions": "questions.json",
    "rawQuestions": "rawQuestions.json"
  },
  "validation": {
    "transcriptValidated": true,
    "questionsValidated": true,
    "noDuplicates": true,
    "allAnswersValid": true
  },
  "metadata": {
    "createdAt": "2025-12-15T15:30:00.000Z",
    "updatedAt": "2025-12-15T15:35:00.000Z",
    "version": "1.0"
  }
}
```

### Episode Status Values
- `pending` - Not started
- `transcript_scraped` - Transcript obtained
- `questions_generated` - Questions generated
- `completed` - All files present and validated
- `failed` - Error occurred
- `partial` - Some data missing

---

## Level 2: Season Level Manifest

**Location:** `data/tv-shows/{series}/season-{N}/manifest.json`

**Purpose:** Track season-wide progress and statistics

```json
{
  "season": {
    "series": "Friends",
    "seriesSlug": "friends",
    "seasonNumber": 1,
    "totalEpisodes": 24,
    "airDateStart": "1994-09-22",
    "airDateEnd": "1995-05-18"
  },
  "progress": {
    "episodesCompleted": 2,
    "episodesInProgress": 1,
    "episodesPending": 21,
    "episodesFailed": 0,
    "completionPercentage": 8.33
  },
  "statistics": {
    "totalQuestions": 50,
    "totalTranscriptWords": 8545,
    "averageQuestionsPerEpisode": 25,
    "totalTokensUsed": 10468,
    "estimatedCost": 0.52
  },
  "episodes": [
    {
      "episode": 1,
      "title": "The One Where Monica Gets a Roommate",
      "status": "completed",
      "questionCount": 24,
      "lastUpdated": "2025-12-15T15:35:00.000Z"
    },
    {
      "episode": 2,
      "title": "The One With The Sonogram at the End",
      "status": "completed",
      "questionCount": 26,
      "lastUpdated": "2025-12-15T15:37:00.000Z"
    },
    {
      "episode": 3,
      "title": "The One With The Thumb",
      "status": "transcript_scraped",
      "questionCount": 0,
      "lastUpdated": "2025-12-16T10:35:00.000Z"
    },
    {
      "episode": 4,
      "title": "The One With George Stephanopoulos",
      "status": "pending",
      "questionCount": 0,
      "lastUpdated": null
    }
  ],
  "sources": {
    "primary": "Friends Transcripts (fangj.github.io)",
    "reliability": "excellent",
    "coverage": 100
  },
  "metadata": {
    "createdAt": "2025-12-15T15:30:00.000Z",
    "updatedAt": "2025-12-16T10:35:00.000Z",
    "version": "1.0"
  }
}
```

---

## Level 3: Series Level Manifest

**Location:** `data/tv-shows/{series}/manifest.json`

**Purpose:** Track entire series progress and metadata

```json
{
  "series": {
    "name": "Friends",
    "slug": "friends",
    "totalSeasons": 10,
    "totalEpisodes": 236,
    "genre": ["Sitcom", "Comedy", "Romance"],
    "yearStart": 1994,
    "yearEnd": 2004,
    "country": "USA",
    "language": "English",
    "network": "NBC",
    "imdbRating": 8.9,
    "priority": "high"
  },
  "progress": {
    "seasonsCompleted": 0,
    "seasonsInProgress": 1,
    "seasonsPending": 9,
    "episodesCompleted": 2,
    "episodesInProgress": 1,
    "episodesPending": 233,
    "overallCompletionPercentage": 0.85
  },
  "statistics": {
    "totalQuestions": 50,
    "totalTranscriptWords": 8545,
    "averageQuestionsPerEpisode": 25,
    "totalTokensUsed": 10468,
    "estimatedTotalCost": 0.52,
    "projectedTotalQuestions": 5900,
    "projectedTotalCost": 61.36
  },
  "seasons": [
    {
      "season": 1,
      "totalEpisodes": 24,
      "episodesCompleted": 2,
      "status": "in_progress",
      "questionCount": 50,
      "completionPercentage": 8.33,
      "lastUpdated": "2025-12-16T10:35:00.000Z"
    },
    {
      "season": 2,
      "totalEpisodes": 24,
      "episodesCompleted": 0,
      "status": "pending",
      "questionCount": 0,
      "completionPercentage": 0,
      "lastUpdated": null
    }
  ],
  "sources": {
    "primary": "Friends Transcripts (fangj.github.io)",
    "secondary": "Subslikescript",
    "reliability": "excellent",
    "overallCoverage": 100,
    "notes": "Best transcript source available with character names"
  },
  "quality": {
    "transcriptQuality": "excellent",
    "hasCharacterNames": true,
    "dialogueDensity": "high",
    "questionGenerationSuitability": "excellent"
  },
  "metadata": {
    "createdAt": "2025-12-15T15:30:00.000Z",
    "updatedAt": "2025-12-16T10:35:00.000Z",
    "version": "1.0",
    "addedBy": "system",
    "tier": 1,
    "phase": 1
  }
}
```

---

## Level 4: Global TV Shows Manifest

**Location:** `data/tv-shows/manifest.json`

**Purpose:** Track all series in the system

```json
{
  "tvShows": {
    "totalSeries": 50,
    "seriesCompleted": 0,
    "seriesInProgress": 2,
    "seriesPending": 48,
    "totalEpisodes": 6234,
    "episodesCompleted": 3,
    "completionPercentage": 0.05
  },
  "statistics": {
    "totalQuestions": 87,
    "totalTranscriptWords": 13709,
    "averageQuestionsPerEpisode": 29,
    "totalTokensUsed": 15702,
    "totalCostUSD": 0.79,
    "projectedTotalQuestions": 180000,
    "projectedTotalCostUSD": 9000
  },
  "series": [
    {
      "name": "Friends",
      "slug": "friends",
      "totalSeasons": 10,
      "totalEpisodes": 236,
      "episodesCompleted": 2,
      "questionsGenerated": 50,
      "status": "in_progress",
      "priority": "high",
      "tier": 1,
      "phase": 1,
      "completionPercentage": 0.85,
      "lastUpdated": "2025-12-16T10:35:00.000Z"
    },
    {
      "name": "The Big Bang Theory",
      "slug": "the-big-bang-theory",
      "totalSeasons": 12,
      "totalEpisodes": 279,
      "episodesCompleted": 1,
      "questionsGenerated": 37,
      "status": "in_progress",
      "priority": "high",
      "tier": 1,
      "phase": 1,
      "completionPercentage": 0.36,
      "lastUpdated": "2025-12-16T10:11:00.000Z"
    },
    {
      "name": "Breaking Bad",
      "slug": "breaking-bad",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "episodesCompleted": 0,
      "questionsGenerated": 0,
      "status": "pending",
      "priority": "high",
      "tier": 1,
      "phase": 1,
      "completionPercentage": 0,
      "lastUpdated": null
    }
  ],
  "phases": {
    "phase1": {
      "series": ["friends", "the-big-bang-theory", "breaking-bad", "the-office", "how-i-met-your-mother"],
      "totalEpisodes": 986,
      "episodesCompleted": 3,
      "completionPercentage": 0.30,
      "status": "in_progress"
    },
    "phase2": {
      "series": [],
      "totalEpisodes": 0,
      "episodesCompleted": 0,
      "completionPercentage": 0,
      "status": "pending"
    }
  },
  "sources": {
    "subslikescript": {
      "seriesCount": 48,
      "reliability": "good"
    },
    "friendsTranscripts": {
      "seriesCount": 1,
      "reliability": "excellent"
    },
    "other": {
      "seriesCount": 1,
      "reliability": "good"
    }
  },
  "metadata": {
    "createdAt": "2025-12-15T15:30:00.000Z",
    "updatedAt": "2025-12-16T10:35:00.000Z",
    "version": "1.0",
    "schemaVersion": "1.0"
  }
}
```

---

## Manifest Update Triggers

### Episode Manifest Updates When:
- Transcript scraped
- Questions generated
- Validation run
- Any file modified

### Season Manifest Updates When:
- Any episode in season changes
- New episode added
- Episode status changes

### Series Manifest Updates When:
- Any season changes
- New season added
- Progress milestones reached

### Global Manifest Updates When:
- Any series changes
- New series added
- Major statistics change

---

## Validation Rules

### Episode Level
- All 3 files must exist (transcript, questions, rawQuestions)
- Question count must match between questions.json and rawQuestions.json
- No duplicate questions
- All questions must have exactly 1 correct answer

### Season Level
- Sum of episode questions must match season total
- Episode list must be complete and ordered

### Series Level
- Sum of season statistics must match series total
- All seasons must be accounted for

### Global Level
- Sum of all series must match global totals
- No duplicate series slugs

---

## Status Priority

**Episode Status Flow:**
```
pending → transcript_scraped → questions_generated → completed
                                                    ↓
                                                  failed
```

**Completion Criteria:**
- Episode: All 3 files + validated
- Season: All episodes completed
- Series: All seasons completed
- Global: All series completed

---

## Next Steps

1. ✅ Manifest schema defined
2. Create utility functions to:
   - Initialize manifests
   - Update manifests
   - Validate manifests
   - Generate statistics
3. Integrate with scraper and question generator
4. Build manifest viewer/dashboard

---

**Status:** Ready for implementation
