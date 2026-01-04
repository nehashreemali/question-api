# ❌ DEPRECATED DOCUMENTATION

> **This document is DEPRECATED. See `CLAUDE.md` for current documentation.**
>
> The new arming phrase is: `POWER_UP generate_questions`
>
> All generation must go through: `scripts/generate-questions.ts`

---

# Claude Code Question Generation (ARCHIVED)

This document describes the OLD workflow for generating quiz questions via Claude Code CLI.

---

## Architecture Overview

```
data/                        # Output (databases only)
├── registry.db              # Central registry: categories, subcategories, topics
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

**Why per-category databases?**
- Allows multiple people to generate questions simultaneously without git conflicts
- Each category is self-contained and independently mergeable
- Registry provides the index for all content

**Why separate data/ and generation/ folders?**
- Clean separation: `data/` is output (databases), `generation/` is input (source material)
- Easy to understand what's generated vs what's used for generation
- Simple `s{nn}e{nn}.json` naming is concise and sortable

---

## Quick Start

**Trigger phrase:** `power up`

```
power up friends s1e10
power up mahabharata parva 1 chapter 5
power up The Big Bang Theory season 2 episode 5
```

---

## CRITICAL: Local Files Only Policy

**Power Up MUST only use local files. Never search the internet by default.**

### Rules

1. **LOCAL ONLY:** Only read files from `generation/` folder
2. **NO WEB SEARCH:** Do not use WebSearch or WebFetch during generation
3. **NO INTERNET:** Do not access any external URLs or APIs
4. **ASK PERMISSION:** If local data is insufficient, STOP and ask the user:
   ```
   "I don't have enough local data for [topic].
   Local file not found: generation/[path]

   Would you like me to search the internet for additional content?"
   ```
5. **WAIT FOR APPROVAL:** Only proceed with internet search if user explicitly approves

### Why This Matters

- **Decoupled phases:** Downloading and generation are separate activities
- **Reproducible:** Same local files = same results
- **Controlled:** User decides when internet is accessed
- **Debuggable:** Easy to trace issues to specific local files

### Valid Data Sources (Local Only)

| Content Type | Local Path |
|--------------|------------|
| TV Shows | `generation/transcripts/{show}/s{nn}e{nn}.json` |
| Movies | `generation/movies/{movie-slug}.json` |
| Books | `generation/books/{category}/{book}.json` or `.txt` |
| Epics | `generation/epics/{epic}/...` |
| Wiki Content | `generation/harry-potter/`, `generation/asoiaf/`, etc. |

### If File Not Found

```
User: power up stranger-things s1e1

Claude:
❌ Local file not found: generation/transcripts/stranger-things/s01e01.json

This content has not been downloaded yet. Options:
1. Download the content first (separate session)
2. Grant permission to search the internet now

What would you like to do?
```

---

## Power Up Workflow

When you hear "power up [topic] [part] [chapter]", follow this exact workflow:

### Step 1: Parse the Request

Extract category, subcategory, topic, part, and chapter from the user's request.

```typescript
// Examples:
// "power up friends s1e10" → category: 'tv-shows', subcategory: 'sitcoms', topic: 'friends', part: 1, chapter: 10
// "power up mahabharata parva 1" → category: 'epics', subcategory: 'hindu', topic: 'mahabharata', part: 1, chapter: null
// "power up greek gods" → category: 'mythology', subcategory: 'greek', topic: 'greek-gods', part: null, chapter: null
```

### Step 2: Load Existing Questions

Query the category database to see what questions already exist:

```typescript
import { getChapterQuestions } from './src/lib/database';

// Get existing questions for this specific chapter (queries tv-shows.db)
const existing = getChapterQuestions('tv-shows', 'friends', 1, 10);
console.log(`Found ${existing.length} existing questions for this episode`);

// Use these to avoid generating duplicates
```

### Step 3: Read Source Material (LOCAL ONLY)

**IMPORTANT: Only read from local files. Never search the internet.**

For TV shows, read the transcript:
```
generation/transcripts/{show-slug}/s{nn}e{nn}.json
```

Example: `generation/transcripts/friends/s01e10.json`

For epics/mythology/books, read the local source content:
```
generation/epics/{epic}/...
generation/books/{category}/{book}.json
generation/harry-potter/{category}/{article}.json
```

**If the file doesn't exist, STOP and ask user for permission before searching online.**

### Step 4: Generate NEW Questions

Generate questions while avoiding the existing ones. For each question:

```typescript
import { insertQuestion } from './src/lib/database';

const question = {
  category: 'tv-shows',       // Determines which .db file to use
  subcategory: 'sitcoms',     // Type within category
  topic: 'friends',           // The specific show/topic
  part: 1,                    // Season
  chapter: 10,                // Episode
  title: 'The One With The Monkey',
  question: 'What is the name of Ross\'s monkey?',
  options: ['Marcel', 'George', 'Charlie', 'Max'],
  correct_answer: 'Marcel',
  difficulty: 'easy',
  explanation: 'Ross\'s capuchin monkey is named Marcel.'
};

const result = insertQuestion(question);
if (result.inserted) {
  console.log(`✓ Added: ${question.question}`);
} else {
  console.log(`⊘ Duplicate, skipped`);
}
```

### Step 5: Report Results

```
✓ Friends S1E10 - Generated 20 questions
  Inserted: 18
  Skipped: 2 (duplicates)
  Total for episode: 43
```

---

## Database Architecture

### Registry Database (`registry.db`)

Central index of all categories, subcategories, and topics.

```sql
-- Categories
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,      -- 'tv-shows', 'movies', 'epics'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

-- Subcategories
CREATE TABLE subcategories (
  category TEXT NOT NULL,     -- FK to categories
  slug TEXT NOT NULL,         -- 'sitcoms', 'drama', 'hindu'
  name TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (category, slug)
);

-- Topics
CREATE TABLE topics (
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  slug TEXT NOT NULL,         -- 'friends', 'mahabharata'
  name TEXT NOT NULL,
  description TEXT,
  total_parts INTEGER,
  source_type TEXT,
  source_url TEXT,
  PRIMARY KEY (category, subcategory, slug)
);

-- Stats (aggregated from category databases)
CREATE TABLE stats (
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  topic TEXT NOT NULL,
  part INTEGER,
  total_questions INTEGER,
  easy_count INTEGER,
  medium_count INTEGER,
  hard_count INTEGER,
  PRIMARY KEY (category, subcategory, topic, part)
);
```

### Category Question Databases (`{category}.db`)

Each category has its own database with the same schema:

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,    -- For deduplication

  subcategory TEXT NOT NULL,    -- 'sitcoms', 'drama', etc.
  topic TEXT NOT NULL,          -- 'friends', 'mahabharata', 'greek-gods'

  part INTEGER,                 -- Season, Parva, Book (nullable)
  chapter INTEGER,              -- Episode, Chapter, Sarga (nullable)
  title TEXT,                   -- Episode/chapter title

  question TEXT NOT NULL,
  options TEXT NOT NULL,        -- JSON array of 4 options
  correct_answer TEXT NOT NULL,
  difficulty TEXT,              -- 'easy', 'medium', 'hard'
  explanation TEXT,

  created_at TEXT
);
```

---

## Database Helper Functions

### Registry Functions (`src/lib/registry.ts`)

| Function | Purpose |
|----------|---------|
| `initRegistry()` | Initialize registry database |
| `getCategories()` | List all categories |
| `getSubcategories(category?)` | List subcategories |
| `getTopics(category?, subcategory?)` | List topics |
| `getFullHierarchy()` | Complete category tree |
| `updateStats(stats)` | Update aggregated stats |

### Question Functions (`src/lib/database.ts`)

| Function | Purpose |
|----------|---------|
| `getCategoryDatabase(cat)` | Get/create category DB |
| `insertQuestion(q)` | Insert question (auto-dedup) |
| `questionExists(cat, text)` | Check if question exists |
| `getChapterQuestions(cat, topic, part, ch)` | Get questions for chapter |
| `getTopicQuestions(cat, topic)` | Get all questions for topic |
| `getQuestions(filters)` | Filtered query with pagination |
| `getStats()` | Aggregated statistics |

---

## Content Type Examples

| Category | Subcategory | Topic | Part | Chapter | Title |
|----------|-------------|-------|------|---------|-------|
| tv-shows | sitcoms | friends | 1 | 10 | The One With The Monkey |
| tv-shows | drama | breaking-bad | 5 | 16 | Felina |
| epics | hindu | mahabharata | 1 | 5 | Adi Parva - Chapter 5 |
| epics | greek | iliad | 1 | 1 | Book I |
| mythology | greek | greek-gods | NULL | NULL | The Olympians |
| sports | cricket | ipl | 2024 | NULL | IPL 2024 |

---

## Deduplication

Questions are deduplicated using a hash:
```typescript
hash = Bun.hash(question.replace(/\s+/g, '').toLowerCase())
```

- Stored in each category DB with UNIQUE constraint
- Duplicate inserts automatically rejected
- Same question can exist in different categories (different DBs)

---

## Quality Guidelines

### Good Questions
- Test memorable moments, plot points, character traits
- Reference specific dialogue or events
- Answerable by someone who engaged with the content
- Have one clearly correct answer

### Avoid
- Trivial visual details
- Exact counts ("How many times did X happen?")
- Minor background details
- Trick questions

### Difficulty Distribution (Target)
- **Easy (40%):** Basic plot points, main events
- **Medium (40%):** Specific dialogue, character motivations
- **Hard (20%):** Subtle details, callbacks (fair, not obscure)

---

## Example Session

```
User: power up friends s1e10

Claude:
1. Parsing: category='tv-shows', subcategory='sitcoms', topic='friends', part=1, chapter=10

2. Querying tv-shows.db for existing questions...
   Found 25 existing questions for this episode.

3. Reading transcript from generation/transcripts/friends/s01e10.json

4. Generating new questions (avoiding existing ones)...

   ✓ What is the name of Ross's monkey?
   ✓ Where do the friends celebrate New Year's Eve?
   ⊘ Skipped duplicate: Who brings a date to the party?
   ✓ What does Marcel keep turning on?
   ...

5. Results:
   ✓ Friends S1E10 - Complete
     New: 18 questions
     Skipped: 2 duplicates
     Total for episode: 43
```

---

## API Endpoints

### Registry API
- `GET /api/categories` - List all categories
- `GET /api/subcategories?category=tv-shows` - List subcategories
- `GET /api/hierarchy` - Full category tree

### Question API
- `GET /api/stats` - Aggregated statistics
- `GET /api/questions?category=tv-shows&topic=friends` - List questions
- `GET /api/topics` - List topics from questions
- `POST /api/import` - Import from JSON files
