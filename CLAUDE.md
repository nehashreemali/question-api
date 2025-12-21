# Project Conventions - Quiz Question Generator

## Project Overview

A **universal quiz question generator** that creates multiple-choice questions from various content sources:
- **Media content** (TV shows, movies, books) - from scraped transcripts
- **Knowledge content** (physics, history, etc.) - from Wikipedia, OpenStax, Khan Academy
- **Sports content** (cricket, football, WWE) - from stats APIs + Wikipedia

## Technology Stack

- **Runtime:** Bun (TypeScript)
- **Database:** SQLite (registry + per-category question databases)
- **Web Scraping:** Cheerio + Axios
- **Architecture:** Functional programming (no classes, pure functions)

---

## Current Architecture (SQLite-Only)

### Database Structure

```
data/
├── registry.db              # Central catalog (5,214 topics)
│   ├── categories           # 44 categories
│   ├── subcategories        # Subcategories per category
│   └── topics               # Topics with metadata
│
├── tv-shows.db              # Questions for TV shows
├── movies.db                # Questions for movies (when generated)
├── sports.db                # Questions for sports (when generated)
└── ...                      # Per-category question databases

generation/                  # Source material (transcripts, etc.)
└── transcripts/
    └── {show}/
        └── s{nn}e{nn}.json  # Episode transcript
```

### Why SQLite?

- **No git conflicts** - Multiple people can work simultaneously
- **Fast queries** - Instant lookups by category/topic
- **Organic growth** - Topics created on-demand via `ensure*` functions
- **Simple structure** - One registry, one DB per category

---

## Database Schema

### Registry Database (`registry.db`)

```sql
-- Categories table
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  adapter TEXT,
  topic_count INTEGER DEFAULT 0
);

-- Subcategories table
CREATE TABLE subcategories (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  topic_count INTEGER DEFAULT 0,
  UNIQUE(category, slug)
);

-- Topics table
CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  depth TEXT,
  description TEXT,
  question_count INTEGER DEFAULT 0,
  UNIQUE(category, subcategory, slug)
);
```

### Questions Database (per-category, e.g., `tv-shows.db`)

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

  synced_to_mongo INTEGER DEFAULT 0,
  created_at TEXT
);
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Web server with API endpoints |
| `src/lib/registry.ts` | SQLite registry management |
| `src/lib/database.ts` | Per-category question databases |
| `src/lib/tv-scraper.ts` | Scrapes TV transcripts |
| `src/lib/adapters/` | Content adapters (Wikipedia, etc.) |
| `src/lib/http.ts` | HTTP utilities with retry logic |
| `src/lib/logger.ts` | Colored console logging |

---

## CLI Commands

```bash
# Start web server
bun start

# Kill anything on port 3000
bun run kill

# Test content adapters
bun src/fetch-content.ts
```

---

## Web Server API

The server at `http://localhost:3000` provides:

- **GET /api/categories** - List all categories with stats
- **GET /api/categories/:category** - Get category details
- **GET /api/topics/:category** - List topics in category
- **GET /api/questions/:category/:topic** - Get questions for topic
- **POST /api/stats/regenerate** - Regenerate statistics

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

### File Names
- Always lowercase
- JSON extension for data files
- SQLite databases use `.db` extension

---

## Registry Functions

The registry (`src/lib/registry.ts`) provides:

```typescript
// Ensure functions (create if not exists)
ensureCategory({ slug, name, adapter?, description? })
ensureSubcategory({ category, slug, name })
ensureTopic({ category, subcategory, slug, name, depth?, description? })

// Query functions
getCategories()
getCategory(slug)
getSubcategories(category)
getTopics(category, subcategory?)
getTopic(category, subcategory, slug)
```

---

## Current Stats

- **Total Topics:** 5,214
- **Categories:** 44
- **Questions Database:** `tv-shows.db` (active)

---

## Important Notes

1. **No JSON manifests** - Everything is in SQLite databases
2. **Organic growth** - Topics are created on-demand using `ensure*` functions
3. **Transcripts stay as files** - Large text content in `generation/transcripts/`
4. **Stats cached in memory** - Regenerate via API when needed
5. **Garbage folder** - Old/unused scripts archived in `/garbage/`
