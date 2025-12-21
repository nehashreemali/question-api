# Quiz Question Generator - Project Plan

## Overview

A **universal quiz question generator** that supports multiple content types including TV shows, movies, history, science, sports, and more.

---

## Current Status: SQLite Architecture Complete

### What's Been Built

#### 1. SQLite-Only Architecture

**Databases:**
- `data/registry.db` - Central registry with 5,214 topics across 44 categories
- `data/tv-shows.db` - Questions database for TV shows
- Per-category databases created on-demand

**No more JSON files for data storage** - everything is in SQLite.

#### 2. Topic Registry

| Category | Topics | Examples |
|----------|--------|----------|
| TV Shows | 566 | Friends, Breaking Bad, Game of Thrones |
| Movies | 445 | Marvel MCU, Christopher Nolan, Bollywood |
| History | 357 | Ancient civilizations, World Wars, Indian history |
| Sports | 300+ | Cricket, Football, WWE, Olympics |
| Science | 200+ | Physics, Chemistry, Biology |
| Literature | 100+ | Classic novels, Modern fiction |
| Music | 100+ | Rock, Pop, Classical, Hip-hop |
| And more... | | |

**Total: 5,214 topics**

#### 3. Web Server & API

- `src/server.ts` - Full REST API with web UI
- Browse categories, topics, and questions
- Regenerate statistics on demand

#### 4. Content Adapters

| Adapter | Source | Status |
|---------|--------|--------|
| `tv-adapter` | Subslikescript, GitHub transcripts | Ready |
| `wikipedia-adapter` | Wikipedia REST API | Ready |
| `movies-adapter` | Subslikescript | Ready |
| `sports-adapter` | Wikipedia + APIs | Ready |

---

## File Structure

```
question-api/
├── data/
│   ├── registry.db          # Central topic registry
│   ├── tv-shows.db          # TV questions
│   └── [category].db        # Per-category databases
│
├── generation/
│   └── transcripts/         # Source transcripts
│
├── src/
│   ├── server.ts            # Web server
│   ├── fetch-content.ts     # Test adapters
│   └── lib/
│       ├── registry.ts      # Registry operations
│       ├── database.ts      # Question operations
│       ├── tv-scraper.ts    # Transcript scraper
│       ├── adapters/        # Content adapters
│       ├── http.ts          # HTTP utilities
│       └── logger.ts        # Logging
│
├── garbage/                 # Archived old scripts
│
├── CLAUDE.md               # Project conventions
├── HOWTO.md                # Usage guide
├── README.md               # Overview
└── PLAN.md                 # This file
```

---

## Next Steps

### Phase 1: Question Generation

- [ ] Generate questions for TV shows (prioritize popular series)
- [ ] Generate questions for movies
- [ ] Generate questions for educational content

### Phase 2: Quality & Scale

- [ ] Implement question validation
- [ ] Add duplicate detection
- [ ] Track generation progress

### Phase 3: API Expansion

- [ ] Random question selection
- [ ] Quiz session management
- [ ] Mobile app integration

---

## Quality Guidelines

### Good Questions
- Test memorable moments, key plot points
- Clear correct answer with plausible distractors
- Answerable by attentive viewers/readers

### Bad Questions (Avoid)
- Obscure visual details
- Exact counts
- Trick questions

### Difficulty Distribution
- **Easy (40%):** Main events, well-known facts
- **Medium (40%):** Specific but memorable details
- **Hard (20%):** Nuanced understanding

---

## Commands

```bash
# Start server
bun start

# Kill port 3000
bun run kill

# Test adapters
bun src/fetch-content.ts
```

---

**Last Updated:** 2025-12-21
