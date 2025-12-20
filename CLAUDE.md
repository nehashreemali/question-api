# Project Conventions - Quiz Question Generator

## Project Overview

This is a **generic quiz question generator** that creates multiple-choice questions from various content sources:
- **Media content** (TV shows, movies, books) - from scraped transcripts
- **Knowledge content** (physics, history, etc.) - from Wikipedia, OpenStax, Khan Academy
- **Sports content** (cricket, football, WWE) - from stats APIs + Wikipedia

## Technology Stack

- **Runtime:** Bun (TypeScript)
- **AI Provider:** Groq API (LLaMA 3.3-70b-versatile)
- **Web Scraping:** Cheerio + Axios
- **Architecture:** Functional programming (no classes, pure functions)

---

## Data Structure

### Folder Hierarchy

```
data/
├── manifest.json              # Global manifest
├── categories.ts              # Category taxonomy (54 categories)
│
├── media/                     # TV shows, movies, books
│   └── tv-shows/
│       └── {series-slug}/
│           └── season-{n}/
│               └── episode-{n}/
│                   ├── manifest.json
│                   ├── transcript.json
│                   ├── questions.json
│                   └── rawQuestions.json
│
├── knowledge/                 # Educational content
│   └── {category}/
│       └── {topic}/
│           ├── manifest.json
│           ├── source-wikipedia.json
│           ├── source-openstax.json
│           └── questions.json
│
└── sports/                    # Sports content
    └── {sport}/
        └── {format-or-league}/
            └── {topic}/
                ├── manifest.json
                ├── source-wikipedia.json
                ├── source-{stats-api}.json
                └── questions.json
```

---

## Leaf Node Files (Episode/Topic Level)

At the deepest level of any content type, you'll find these files:

### 1. `manifest.json` - Metadata & Status Tracking

Tracks the status of transcript/source fetching, question generation, and validation.

```json
{
  "episode": {
    "series": "Friends",
    "seriesSlug": "friends",
    "season": 1,
    "episode": 1,
    "title": "The One Where Monica Gets a New Roommate"
  },
  "transcript": {
    "status": "pending" | "completed" | "failed" | "missing",
    "source": "Friends Transcripts (fangj.github.io)",
    "sourceUrl": "https://fangj.github.io/friends/season/0101.html",
    "scrapedAt": "2025-12-16T17:11:17.921Z",
    "wordCount": 4424,
    "hasCharacterNames": true,
    "quality": "excellent" | "good" | "fair" | "poor"
  },
  "questions": {
    "status": "pending" | "completed" | "failed",
    "generatedAt": "2025-12-16T17:11:17.921Z",
    "totalCount": 24,
    "distribution": {
      "easy": 8,
      "medium": 15,
      "hard": 1
    },
    "aiModel": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "tokensUsed": 0
  },
  "files": {
    "transcript": "transcript.json",
    "questions": "questions.json",
    "rawQuestions": "rawQuestions.json"
  },
  "validation": {
    "transcriptValidated": true,
    "questionsValidated": true,
    "noDuplicates": false,
    "allAnswersValid": false
  },
  "metadata": {
    "createdAt": "2025-12-16T17:11:17.920Z",
    "updatedAt": "2025-12-16T17:11:17.921Z",
    "version": "1.0"
  }
}
```

### 2. `transcript.json` - Source Content

The raw scraped content used for question generation.

```json
{
  "show": "Friends",
  "season": 1,
  "episode": 1,
  "title": "The One Where Monica Gets a New Roommate",
  "transcript": "Full transcript text...",
  "formattedTranscript": "Formatted version with scene markers...",
  "source": "Friends Transcripts (fangj.github.io)",
  "sourceUrl": "https://fangj.github.io/friends/season/0101.html",
  "scrapedAt": "2025-12-15T15:13:45.305Z",
  "wordCount": 4424,
  "hasCharacterNames": true
}
```

### 3. `questions.json` - Full Question Data

Complete question set with all metadata.

```json
{
  "show": "Friends",
  "season": 1,
  "episode": 1,
  "title": "The One Where Monica Gets a New Roommate",
  "source": "Friends Transcripts (fangj.github.io)",
  "generatedAt": "2025-12-15T15:54:35.670Z",
  "questionCount": 24,
  "questions": [
    {
      "question": "What does Monica say is 'just some guy I work with'?",
      "options": [
        "Paul the wine guy",
        "Her new neighbor",
        "Her dentist",
        "Her gym trainer"
      ],
      "correct_answer": "Paul the wine guy",
      "difficulty": "easy" | "medium" | "hard",
      "explanation": "Monica tells her friends 'There's nothing to tell! He's just some guy I work with!' when asked about Paul."
    }
  ]
}
```

**Question Structure:**
| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question text |
| `options` | string[4] | Exactly 4 answer options |
| `correct_answer` | string | Must match one option exactly |
| `difficulty` | enum | "easy", "medium", or "hard" |
| `explanation` | string | Why the answer is correct |

### 4. `rawQuestions.json` - Question Text Only

Simple array of just the question strings (for quick reference/deduplication).

```json
[
  "What does Monica say is 'just some guy I work with'?",
  "What is the unusual thing that Phoebe asks if the guy Monica is going out with does?",
  "What is the dream that Chandler describes to the group?"
]
```

---

## Manifest Hierarchy (Rollup Pattern)

Manifests exist at every level and aggregate statistics upward:

```
Episode Manifest → Season Manifest → Series Manifest → Global Manifest
     ↑                    ↑                 ↑                ↑
  (leaf data)     (sum of episodes)  (sum of seasons)  (sum of series)
```

Each parent manifest recalculates its statistics from its children.

---

## Question Quality Standards

### Good Questions
- Test memorable moments, plot points, character traits
- Reference specific dialogue or events
- Answerable by someone who watched attentively
- Have one clearly correct answer

### Bad Questions (Avoid)
- Colors of clothing or background objects
- Exact counts ("How many times did X happen?")
- Minor background details
- Anything requiring freeze-frame analysis
- Trick questions

### Difficulty Distribution Target
- **Easy (40%):** Basic plot points, main events
- **Medium (40%):** Specific dialogue, character motivations
- **Hard (20%):** Subtle details, callbacks (still fair, not obscure)

---

## Code Conventions

### Exports
- **Always use `export default`** - one export per file
- **One file per export** - don't combine multiple exports in one file
- Index files can re-export: `export { default as Foo } from './foo'`

### Example
```typescript
// data/enums/categories.ts
const Categories = {
  TV_SHOWS: 'tv-shows',
  SCIENCE: 'science',
} as const;

export default Categories;
```

```typescript
// data/enums/index.ts (re-exports for convenience)
export { default as Categories } from './categories';
export { default as Topics } from './topics';
```

---

## Naming Conventions

### Slugs
- Lowercase, hyphenated: `the-big-bang-theory`, `friends`
- No special characters: `friends` not `Friend's`
- Spaces become hyphens: `breaking bad` → `breaking-bad`

### Folder Names
- Seasons: `season-1`, `season-2`, etc.
- Episodes: `episode-1`, `episode-2`, etc.
- Topics: `mechanics`, `thermodynamics`, etc.

### File Names
- Always lowercase
- JSON extension for all data files
- Standard names: `manifest.json`, `transcript.json`, `questions.json`, `rawQuestions.json`

---

## Source Adapters

### Media Content
| Adapter | Source | Content Type |
|---------|--------|--------------|
| `tv-scraper` | fangj.github.io, Subslikescript | TV transcripts |

### Knowledge Content
| Adapter | Source | License |
|---------|--------|---------|
| `wikipedia` | Wikipedia REST API | CC BY-SA |
| `openstax` | OpenStax textbooks | CC BY |
| `khan-academy` | Khan Academy | Free |

### Sports Content
| Adapter | Source | Sports |
|---------|--------|--------|
| `cricinfo` | ESPNcricinfo | Cricket |
| `espn` | ESPN API | NFL, NBA, etc. |
| `wrestling` | Cagematch | WWE, AEW |

---

## CLI Commands

```bash
# TV Shows
bun index.ts "Friends" 1 1              # Single episode
bun index.ts "Friends" 1                # Entire season

# Batch generation
bun scripts/batch-generate.ts "Friends" 1

# Scrape only
bun src/scrape-tv.ts "Friends" 1 1
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/lib/tv-scraper.ts` | Scrapes TV transcripts |
| `src/lib/question-generator.ts` | Generates questions via Groq API |
| `src/lib/manifest.ts` | CRUD operations for manifests |
| `src/lib/http.ts` | HTTP utilities with retry logic |
| `src/lib/logger.ts` | Colored console logging |
| `index.ts` | Main entry point |
| `data/categories.ts` | 54 categories with 540 subcategories |

---

## Environment Variables

Required in `config.json`:
```json
{
  "api_keys": {
    "groq": "your-groq-api-key"
  },
  "ai_settings": {
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "questions_per_transcript": 35
  }
}
```

---

## Important Notes

1. **Rate Limits:** Groq free tier has daily limits. The system handles 429 errors gracefully and saves state for resumption.

2. **Manifest Updates:** Always update manifests after generating questions. Use `updateSeasonFromEpisodes()` and `updateSeriesFromSeasons()` to roll up statistics.

3. **Validation:** The manifest tracks validation status. Currently `noDuplicates` and `allAnswersValid` may be false - these are for future quality checks.

4. **Source Priority:** For TV shows, `scrapeFriendsTranscript` is tried first, then `scrapeSubslikescript` as fallback.

5. **Citations:** Knowledge and sports content must include citations. Media content (TV/movies) doesn't need citations since questions are episode-specific.

6. **Time-Sensitive Data:** Sports statistics questions must include "As of {date}" prefix and track `validAsOf` in metadata.
