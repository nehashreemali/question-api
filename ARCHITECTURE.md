# Architecture - Quiz Question Generator

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

## Directory Structure

```
data/
├── registry.db              # Central catalog (categories, topics)
├── pipeline.db              # Content tracking (dev only)
├── tv-shows.db              # Questions for TV shows
├── movies.db                # Questions for movies
├── epics.db                 # Questions for epics
└── ...                      # Per-category question databases

generation/                  # Source material (transcripts, scripts, texts)
├── transcripts/             # TV show transcripts
│   └── {show}/s{nn}e{nn}.json
├── movies/                  # Movie scripts
│   └── {movie-slug}.json
├── wikipedia/               # Wikipedia articles by category
│   └── {category}/{article}.json
├── books/                   # Book chapters
│   └── {book}/{chapter}.json
└── epics/                   # Religious & epic texts
    ├── mahabharata/parva-{nn}-{name}/section-{nnn}.json
    ├── ramayana/page-{nnn}.json
    ├── bhagavad-gita/chapter-{nn}.json
    ├── bible/{book}.json
    └── quran/surah-{nnn}.json

dist/
└── prod-questions.db        # Production export (approved questions only)
```

---

## Why SQLite?

- **No git conflicts** - Multiple people can work simultaneously
- **Fast queries** - Instant lookups by category/topic
- **Organic growth** - Topics created on-demand via `ensure*` functions
- **Simple structure** - One registry, one DB per category

---

## Database Schemas

### Registry Database (`registry.db`)

```sql
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  adapter TEXT,
  topic_count INTEGER DEFAULT 0
);

CREATE TABLE subcategories (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  topic_count INTEGER DEFAULT 0,
  UNIQUE(category, slug)
);

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
  hash TEXT UNIQUE NOT NULL,

  subcategory TEXT NOT NULL,
  topic TEXT NOT NULL,

  part INTEGER,
  chapter INTEGER,
  title TEXT,

  question TEXT NOT NULL,
  options TEXT NOT NULL,         -- JSON array of 4 options
  correct_answer TEXT NOT NULL,
  difficulty TEXT,
  explanation TEXT,

  -- Review workflow
  peer_reviewed INTEGER DEFAULT 0,
  review_status TEXT DEFAULT 'pending',
  quality_score REAL,
  review_notes TEXT,
  reviewed_at TEXT,

  -- Current affairs lifecycle
  is_current_affairs INTEGER DEFAULT 0,
  current_affairs_until TEXT,

  -- Repair tracking
  repair_attempts INTEGER DEFAULT 0,

  synced_to_mongo INTEGER DEFAULT 0,
  created_at TEXT
);
```

### Production Database (`dist/prod-questions.db`)

Read-only database for gameplay. Created by exporting approved questions.

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,   -- 1=easy, 2=medium, 3=hard
  question TEXT NOT NULL,
  answers TEXT NOT NULL,         -- JSON: [{"text":"...", "index":1}, ...]
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  is_current_affairs INTEGER DEFAULT 0,
  current_affairs_until TEXT,
  tags TEXT                      -- JSON: ["category", "subcategory", "topic", "difficulty"]
);
```

---

## Question Review Workflow

### Review States
| Status | Meaning |
|--------|---------|
| `pending` | Awaiting review (default for new questions) |
| `approved` | Ready for production export |
| `rejected` | Not suitable, will not be exported |

### Manual SQL Commands
```bash
# View pending questions
sqlite3 data/tv-shows.db "SELECT id, question FROM questions WHERE review_status='pending' LIMIT 10;"

# Approve a question
sqlite3 data/tv-shows.db "UPDATE questions SET review_status='approved', reviewed_at=datetime('now') WHERE id=123;"

# Reject a question with notes
sqlite3 data/tv-shows.db "UPDATE questions SET review_status='rejected', review_notes='Too obscure' WHERE id=456;"
```

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
./scripts/restore-databases.sh 2026-01-04_121911  # Restore specific
```

### What Gets Backed Up
- All `data/*.db` files (registry, pipeline, category DBs)
- Integrity checked before and after backup
- Last 7 days retained automatically

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Web server with API endpoints |
| `src/lib/registry.ts` | SQLite registry management |
| `src/lib/database.ts` | Per-category question databases |
| `src/lib/pipeline.ts` | Pipeline tracking |
| `src/lib/tv-scraper.ts` | Scrapes TV transcripts |
| `src/lib/http.ts` | HTTP utilities with retry logic |
| `src/download-transcripts.ts` | Batch download TV transcripts |
| `src/download-movies.ts` | Batch download movie scripts |
| `src/download-epics.ts` | Download religious/epic texts |
| `src/sync-pipeline.ts` | Sync pipeline.db with files |
| `scripts/generate-questions.ts` | Question generation script |
| `scripts/review-questions.ts` | Question review script |
| `scripts/repair-questions.ts` | Question repair script |
| `scripts/export-prod-db.ts` | Export to production DB |
| `scripts/backup-databases.sh` | Backup all databases |
| `scripts/restore-databases.sh` | Restore from backup |

---

## CLI Commands

```bash
# Start web server (http://localhost:3000)
bun start

# Kill anything on port 3000
bun run kill

# Sync pipeline database
bun src/sync-pipeline.ts

# Download content
bun src/download-transcripts.ts
bun src/download-movies.ts
bun src/download-epics.ts [source]
bun src/download-wikipedia.ts
```

---

## Web Server API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | List all categories |
| `/api/categories/:category` | GET | Get category details |
| `/api/topics/:category` | GET | List topics in category |
| `/api/questions/:category/:topic` | GET | Get questions for topic |
| `/api/pipeline` | GET | Pipeline summary |
| `/api/pipeline/topics` | GET | Per-topic breakdown |
| `/api/pipeline/pending` | GET | Pending generation items |
| `/api/pipeline/sync` | POST | Refresh pipeline tracking |
| `/api/stats/regenerate` | POST | Regenerate statistics |

---

## Pipeline Tracking System

The `pipeline.db` database tracks all downloaded content and question generation progress.

### Check Status
1. **Web UI**: http://localhost:3000/pipeline
2. **CLI**: `bun src/sync-pipeline.ts`
3. **SQL**: `sqlite3 data/pipeline.db "SELECT * FROM content_tracking WHERE generation_status='pending' LIMIT 10;"`

### Workflow
1. Download content → files saved to `generation/`
2. Run sync → updates `pipeline.db`
3. Generate questions → saved to category DB
4. Sync again → marks items as "completed"

---

## Question Quality Standards

### Good Questions
- Test memorable moments, plot points, character traits
- Reference specific dialogue or events
- Answerable by someone who engaged with the content
- Have one clearly correct answer

### Bad Questions (Avoid)
- Colors of clothing or background objects
- Exact counts ("How many times did X happen?")
- Minor background details
- Anything requiring freeze-frame analysis
- Trick questions

### Difficulty Distribution Target
- **Easy (40%):** Basic facts, main events
- **Medium (40%):** Specific details, context required
- **Hard (20%):** Subtle details (still fair, not obscure)

---

## Code Conventions

### Exports
- **Always use `export default`** - one export per file
- **One file per export** - don't combine multiple exports
- Index files can re-export: `export { default as Foo } from './foo'`

### Naming
- **Slugs:** lowercase, hyphenated (`the-big-bang-theory`)
- **Files:** lowercase, `.json` for data, `.db` for databases
- **No special characters:** `friends` not `Friend's`

---

## Registry Functions

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

## Content Sources

### TV Shows & Movies
| Source | Content |
|--------|---------|
| Springfield! Springfield! | 8,629 TV shows, 40,000 movies |

### Religious & Epic Texts
| Source | Content |
|--------|---------|
| sacred-texts.com | Mahabharata, Ramayana, Puranas |
| bhagavadgitaapi.in | Bhagavad Gita (18 chapters) |
| bible-api.com | Bible (66 books) |
| alquran.cloud | Quran (114 surahs) |

### Wikipedia
| Category | Articles |
|----------|----------|
| Greek Mythology | 79 |
| Norse Mythology | 44 |
| Hindu Mythology | 32 |
| Egyptian Mythology | 31 |
| And more... | 312 total |

### Future Sources
- Fandom wikis (Harry Potter, LOTR, ASOIAF)
- OpenStax textbooks
- Sports stats APIs (ESPN, Cricinfo)
- News APIs for current affairs

---

## Important Notes

1. **No JSON manifests** - Everything is in SQLite databases
2. **Organic growth** - Topics created on-demand via `ensure*` functions
3. **Transcripts stay as files** - Large text content in `generation/`
4. **Stats cached in memory** - Regenerate via API when needed
5. **No legacy code** - Deprecated scripts have been removed
