# Project Conventions - Quiz Question Generator

## Claude Code Question Generation

**To generate questions directly in Claude Code CLI (no external API costs):**

```
power up friends s1e10
```

See **[CLAUDE-CODE-GENERATION.md](./CLAUDE-CODE-GENERATION.md)** for full documentation.

---

## Project Overview

This is a **generic quiz question generator** that creates multiple-choice questions from various content sources:
- **Media content** (TV shows, movies, books) - from scraped transcripts
- **Knowledge content** (physics, history, etc.) - from Wikipedia, OpenStax, Khan Academy
- **Sports content** (cricket, football, WWE) - from stats APIs + Wikipedia

## Technology Stack

- **Runtime:** Bun (TypeScript)
- **AI Provider:** Claude Code CLI (via "power up" command)
- **Web Scraping:** Cheerio + Axios
- **Architecture:** Functional programming (no classes, pure functions)

---

## Data Structure

### Database Architecture

Questions are stored in SQLite databases (one per category), with a central registry for metadata.

```
data/                        # Output (databases only)
├── registry.db              # Central: categories, subcategories, topics, stats
├── tv-shows.db              # Questions for TV shows
├── movies.db                # Questions for movies
├── epics.db                 # Questions for epics
├── mythology.db             # Questions for mythology
├── sports.db                # Questions for sports
└── ...                      # Per-category question databases

generation/                  # Source material for question generation
└── transcripts/             # TV show transcripts (flat structure)
    ├── friends/
    │   ├── s01e01.json
    │   ├── s01e02.json
    │   └── ...
    └── the-big-bang-theory/
        └── s01e01.json
```

### Why This Architecture?

- **Per-category databases**: Multiple people can generate questions simultaneously without git conflicts
- **Flat transcript structure**: Simple `s{nn}e{nn}.json` naming, easy to see all episodes
- **Central registry**: Single source of truth for categories, subcategories, topics, and stats
- **Separation of concerns**: `data/` contains only databases, `generation/` contains source material
- **Organic growth**: Categories/subcategories/topics are created on-demand via `ensure*` functions

---

## Database Schema

### Questions Table (per-category database)

Each category (tv-shows.db, movies.db, etc.) has the same schema:

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,     -- For deduplication

  subcategory TEXT NOT NULL,     -- e.g., 'sitcoms', 'drama'
  topic TEXT NOT NULL,           -- e.g., 'friends', 'breaking-bad'

  part INTEGER,                  -- Season, Parva, Book (nullable)
  chapter INTEGER,               -- Episode, Chapter (nullable)
  title TEXT,                    -- Episode/chapter title

  question TEXT NOT NULL,
  options TEXT NOT NULL,         -- JSON array of 4 options
  correct_answer TEXT NOT NULL,
  difficulty TEXT,               -- 'easy', 'medium', 'hard'
  explanation TEXT,

  synced_to_mongo INTEGER NOT NULL DEFAULT 0,  -- MongoDB sync flag
  created_at TEXT
);
```

### Question Structure

| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question text |
| `options` | string[4] | Exactly 4 answer options |
| `correct_answer` | string | Must match one option exactly |
| `difficulty` | enum | "easy", "medium", or "hard" |
| `explanation` | string | Why the answer is correct |

---

## Transcript Files

Transcripts are stored in a flat structure: `generation/transcripts/{show}/s{nn}e{nn}.json`

```json
{
  "show": "Friends",
  "season": 1,
  "episode": 1,
  "title": "The One Where Monica Gets a New Roommate",
  "transcript": "Full transcript text...",
  "source": "Friends Transcripts (fangj.github.io)",
  "sourceUrl": "https://fangj.github.io/friends/season/0101.html",
  "scrapedAt": "2025-12-15T15:13:45.305Z",
  "wordCount": 4424,
  "hasCharacterNames": true
}
```

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
// src/lib/config.ts
const Config = {
  DATA_DIR: 'data',
  GENERATION_DIR: 'generation',
} as const;

export default Config;
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
# Start web server
bun start

# Generate questions (via Claude Code CLI)
power up friends s1e10
power up "The Big Bang Theory" s2e5
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Web server (read-only) |
| `src/lib/database.ts` | Question database operations |
| `src/lib/registry.ts` | Category/subcategory/topic registry |
| `src/lib/tv-scraper.ts` | Scrapes TV transcripts |
| `src/lib/http.ts` | HTTP utilities with retry logic |
| `src/lib/logger.ts` | Colored console logging |

---

## Important Notes

1. **Question Generation:** Use `power up [show] [season] [episode]` in Claude Code CLI. No external API keys needed.

2. **Stats:** Statistics are cached in `data/stats.json`. Use "Regenerate Stats" button in web UI after generating questions.

3. **Deduplication:** Questions are deduplicated per-episode using `raw_questions.log`.

4. **Source Priority:** For TV shows, `scrapeFriendsTranscript` is tried first, then `scrapeSubslikescript` as fallback.

5. **Citations:** Knowledge and sports content must include citations. Media content (TV/movies) doesn't need citations since questions are episode-specific.
