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
├── registry.db              # Central catalog (categories, topics)
├── pipeline.db              # Content tracking (dev only - tracks downloads & generation progress)
├── tv-shows.db              # Questions for TV shows
├── movies.db                # Questions for movies (when generated)
├── epics.db                 # Questions for epics (when generated)
└── ...                      # Per-category question databases

generation/                  # Source material (transcripts, scripts, texts)
├── transcripts/             # TV show transcripts
│   └── {show}/s{nn}e{nn}.json
├── movies/                  # Movie scripts
│   └── {movie-slug}.json
└── epics/                   # Religious & epic texts
    ├── mahabharata/parva-{nn}-{name}/section-{nnn}.json
    ├── ramayana/page-{nnn}.json
    ├── bhagavad-gita/chapter-{nn}.json
    ├── bible/{book}.json
    └── quran/surah-{nnn}.json
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

  -- Review workflow
  peer_reviewed INTEGER DEFAULT 0,
  review_status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  quality_score REAL,
  review_notes TEXT,
  reviewed_at TEXT,

  -- Current affairs lifecycle
  is_current_affairs INTEGER DEFAULT 0,
  current_affairs_until TEXT,

  synced_to_mongo INTEGER DEFAULT 0,
  created_at TEXT
);
```

### Production Database (`prod/questions.db`)

Read-only database for gameplay. Created by exporting approved questions.

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,

  category TEXT NOT NULL,        -- e.g., 'tv-shows'
  subcategory TEXT NOT NULL,     -- e.g., 'sitcoms'
  topic TEXT NOT NULL,           -- e.g., 'friends'

  difficulty INTEGER NOT NULL,   -- 1=easy, 2=medium, 3=hard

  question TEXT NOT NULL,

  answers TEXT NOT NULL,         -- JSON: [{"text":"...", "index":1}, ...]
  correct_index INTEGER NOT NULL, -- 1-4 (matches answer index)

  explanation TEXT,

  is_current_affairs INTEGER DEFAULT 0,
  current_affairs_until TEXT,

  tags TEXT                      -- JSON: ["tv-shows", "sitcoms", "friends", "medium"]
);
```

**Note:** Answers are sorted alphabetically in storage. Client randomizes at runtime.

---

## Question Review Workflow

Questions go through a review process before appearing in production.

### Review States
| Status | Meaning |
|--------|---------|
| `pending` | Awaiting review (default for new questions) |
| `approved` | Ready for production export |
| `rejected` | Not suitable, will not be exported |

### How to Review Questions

```bash
# View pending questions
sqlite3 data/tv-shows.db "SELECT id, question FROM questions WHERE review_status='pending' LIMIT 10;"

# Approve a question
sqlite3 data/tv-shows.db "UPDATE questions SET review_status='approved', reviewed_at=datetime('now') WHERE id=123;"

# Reject a question with notes
sqlite3 data/tv-shows.db "UPDATE questions SET review_status='rejected', review_notes='Too obscure' WHERE id=456;"

# Bulk approve all questions for a topic
sqlite3 data/tv-shows.db "UPDATE questions SET review_status='approved', reviewed_at=datetime('now') WHERE topic='friends';"
```

### Export to Production

Only approved questions are exported to the production database:

```bash
# Preview what would be exported
bun scripts/export-prod-db.ts --dry-run

# Run the export
bun scripts/export-prod-db.ts

# Output: prod/questions.db
```

The export:
1. Reads all `data/*.db` files
2. Filters by `review_status = 'approved'`
3. Converts difficulty to integer (easy=1, medium=2, hard=3)
4. Converts options to `[{text, index}]` format, sorted alphabetically
5. Generates tags from category/subcategory/topic/difficulty
6. Writes to `prod/questions.db`

---

## Backup & Restore

### Create Backup
```bash
./scripts/backup-databases.sh           # Full backup with integrity check
./scripts/backup-databases.sh --dry-run # Preview only
```

Backups are stored in `backups/` as timestamped `.tar.gz` archives.

### Restore from Backup
```bash
./scripts/restore-databases.sh --list   # List available backups
./scripts/restore-databases.sh          # Restore from latest
./scripts/restore-databases.sh 2026-01-04_121911  # Restore specific backup
```

### What Gets Backed Up
- All `data/*.db` files (registry, pipeline, tv-shows, etc.)
- Integrity checked before and after backup
- Last 7 days retained automatically

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Web server with API endpoints |
| `src/lib/registry.ts` | SQLite registry management |
| `src/lib/database.ts` | Per-category question databases |
| `src/lib/pipeline.ts` | Pipeline tracking (downloads & generation status) |
| `src/lib/tv-scraper.ts` | Scrapes TV transcripts |
| `src/lib/http.ts` | HTTP utilities with retry logic |
| `src/download-transcripts.ts` | Batch download TV transcripts |
| `src/download-movies.ts` | Batch download movie scripts |
| `src/download-epics.ts` | Download religious/epic texts |
| `src/sync-pipeline.ts` | Sync pipeline.db with files & questions |
| `scripts/export-prod-db.ts` | Export approved questions to prod DB |
| `scripts/backup-databases.sh` | Backup all SQLite databases |
| `scripts/restore-databases.sh` | Restore from backup |

---

## CLI Commands

```bash
# Start web server (visit http://localhost:3000)
bun start

# Kill anything on port 3000
bun run kill

# Sync pipeline database (scan files & update tracking)
bun src/sync-pipeline.ts

# Download content
bun src/download-transcripts.ts    # TV shows (edit file for waves)
bun src/download-movies.ts         # Movies
bun src/download-epics.ts [source] # gita|bible|quran|ramayana|mahabharata
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
3. **Transcripts stay as files** - Large text content in `generation/`
4. **Stats cached in memory** - Regenerate via API when needed
5. **Garbage folder** - Old/unused scripts archived in `/garbage/`

---

## Pipeline Tracking System

The `pipeline.db` database tracks all downloaded content and question generation progress.

### Check Status
1. **Web UI**: http://localhost:3000/pipeline (click "Sync Pipeline" to refresh)
2. **CLI**: `bun src/sync-pipeline.ts`
3. **SQL**: `sqlite3 data/pipeline.db "SELECT * FROM content_tracking WHERE generation_status='pending' LIMIT 10;"`

### Pipeline API
- `GET /api/pipeline` - Summary stats by category
- `GET /api/pipeline/topics` - Per-topic breakdown
- `GET /api/pipeline/pending` - Items awaiting question generation
- `POST /api/pipeline/sync` - Refresh tracking from files

### Workflow
1. Download content → files saved to `generation/`
2. Run `sync-pipeline.ts` or click "Sync Pipeline" → updates `pipeline.db`
3. Generate questions → saved to category DB (e.g., `tv-shows.db`)
4. Sync again → marks items as "completed" in pipeline

---

## Current Status (Updated: Jan 2026)

### Downloaded Content
| Category | Content | Units | Source |
|----------|---------|-------|--------|
| TV Shows | 10 shows | 1,584 episodes | Springfield! Springfield! |
| Movies | 81 films | 81 scripts | Springfield! Springfield! |
| Mahabharata | 18 parvas | 2,093 sections | sacred-texts.com |
| Ramayana | - | 504 pages | sacred-texts.com |
| Bhagavad Gita | 18 chapters | 18 files | bhagavadgitaapi.in |
| Bible | 66 books | 66 files | bible-api.com |
| Quran | 114 surahs | 114 files | alquran.cloud |

### Questions Generated
| Topic | Questions |
|-------|-----------|
| Friends | 5,552 |
| Game of Thrones | 250 |
| Big Bang Theory | 28 |
| **Total** | **5,830** |

### What's Next
1. **Generate questions** for remaining TV shows (The Office, Seinfeld, etc.)
2. **Generate questions** for movies and epics
3. **Download more content**: Greek mythology, Norse mythology, Books (Harry Potter, LOTR)
4. See `V1_LAUNCH_PLAN.md` for full roadmap

---

## Content Sources (Where to Download More)

### TV Shows & Movies
| Source | URL | Content |
|--------|-----|---------|
| Springfield! Springfield! | springfieldspringfield.co.uk | 8,629 TV shows, 40,000 movies |

**Scripts:** `src/download-transcripts.ts`, `src/download-movies.ts`

### Religious & Epic Texts
| Source | URL | Content |
|--------|-----|---------|
| sacred-texts.com | sacred-texts.com/hin/ | Mahabharata, Ramayana, Puranas, Vedas |
| Bhagavad Gita API | bhagavadgitaapi.in | All 18 chapters with translations |
| Bible API | bible-api.com | All 66 books (KJV, ASV, etc.) |
| Al-Quran Cloud | alquran.cloud | All 114 surahs with translations |

**Script:** `src/download-epics.ts`

### Mythology (Not Yet Downloaded)
| Source | URL | Content |
|--------|-----|---------|
| Theoi.com | theoi.com | Greek mythology (~300 pages) |
| sacred-texts.com | sacred-texts.com/neu/poe/ | Norse Eddas |

**To add:** Create `src/download-mythology.ts`

### Books & Fiction (Not Yet Downloaded)
| Source | URL | Content |
|--------|-----|---------|
| Harry Potter Wiki | harrypotter.fandom.com | 24,000+ articles |
| Tolkien Gateway | tolkiengateway.net | 13,000+ LOTR articles |
| ASOIAF Wiki | awoiaf.westeros.org | Game of Thrones lore |
| Agatha Christie Wiki | agathachristie.fandom.com | Mystery novels |
| Project Gutenberg | gutenberg.org | Public domain classics |

**To add:** Create `src/download-books.ts` (scrape Fandom wikis)

### STEM (Not Yet Downloaded)
| Source | URL | Content |
|--------|-----|---------|
| Wikipedia | en.wikipedia.org/wiki/Portal:Science | Physics, Chemistry, Biology, Math |
| OpenStax | openstax.org | Free textbooks (Physics, Chemistry, Biology, etc.) |
| Simple Wikipedia | simple.wikipedia.org | Easier explanations for question generation |

**Approach:**
- Scrape Wikipedia category pages (e.g., `/wiki/Category:Physics`)
- Or use Wikipedia API to get articles by topic
- OpenStax PDFs can be parsed for structured content

### History & Current Affairs (Not Yet Downloaded)
| Source | URL | Content |
|--------|-----|---------|
| Wikipedia | en.wikipedia.org/wiki/Portal:History | All historical periods |
| Wikipedia Current Events | en.wikipedia.org/wiki/Portal:Current_events | Daily news archive |
| This Day in History | Various | Historical events by date |

**Approach:**
- Scrape Wikipedia history portals by era (Ancient, Medieval, Modern)
- For current affairs: scrape news archives or use news APIs

### Sports (Not Yet Downloaded)
| Source | URL | Content |
|--------|-----|---------|
| ESPN Cricinfo | espncricinfo.com | Cricket stats, records, players |
| Wikipedia Sports | en.wikipedia.org/wiki/Portal:Sports | All sports |
| Transfermarkt | transfermarkt.com | Football/soccer stats |
| Basketball Reference | basketball-reference.com | NBA stats |

**To add:** Create adapters in `src/lib/adapters/`
