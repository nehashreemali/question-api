# Generic Quiz Generator - Project Plan

## Overview

A **universal quiz question generator** that supports multiple content types including TV shows, movies, history, science, sports, and more. Uses AI (Claude/Groq) to generate high-quality multiple-choice questions from various sources.

---

## Current Status: Phase 2.5 Complete ✅

### What's Been Built

#### 1. Registry-Based Configuration System ✅
- **File:** `data-generation/registry.json`
- Central configuration for all topics organized by Category > Subcategory > Topic
- Each category specifies which adapter(s) to use
- Topics include metadata like descriptions for comprehensive content fetching
- **All topics now have depth classification for question potential**

#### 2. Content Adapters ✅
- **Location:** `src/lib/adapters/`
- **Implemented Adapters:**
  | Adapter | Categories | Source |
  |---------|------------|--------|
  | `tv-adapter` | TV Shows | Subslikescript, GitHub transcripts |
  | `movies-adapter` | Movies | Subslikescript (scripts) |
  | `wikipedia-adapter` | History, Geography, Entertainment, Technology, General Knowledge | Wikipedia REST API |
  | `ncert-adapter` | Science, Mathematics | Wikipedia (NCERT-aligned topics) |
  | `sports-adapter` | Sports | Wikipedia + Sports APIs |

#### 3. Universal Question Generator ✅
- **File:** `src/generate.ts`
- Works with any category/topic from registry
- Supports Claude API (preferred) and Groq API (fallback)
- Usage: `bun src/generate.ts <category> <topic> [subcategory] [--count=N]`

#### 4. Topic Library ✅ (Comprehensive)

| Category | Topics | Subcategories | Notes |
|----------|--------|---------------|-------|
| **TV Shows** | 566 | 23 | sitcoms, drama, sci-fi, crime, medical, korean, anime, etc. |
| **Movies** | 445 | 19 | franchises, directors, decades, bollywood, korean, etc. |
| **History** | ~400 | 16 | ancient, medieval, world wars, regional histories, figures |
| **Science** | 67 | 7 | physics, chemistry, biology, astronomy, NCERT Class 10/12 |
| **Sports** | 43 | 8 | cricket, football, F1, tennis, olympics, WWE |
| **Entertainment** | 26 | 4 | music, literature, gaming, awards |
| **General Knowledge** | 25 | 4 | India, Indian epics, current affairs |
| **Technology** | 15 | 3 | computing, tech companies, innovations |
| **Geography** | 14 | 3 | political, physical, landmarks |
| **Mathematics** | 12 | 3 | fundamentals, advanced, applied |
| **TOTAL** | **~1,570** | | |

#### 5. Topic Design Philosophy ✅
- **Each topic must support 1000+ questions**
- Small topics merged into comprehensive ones
- Example restructuring:
  - Before: 132 individual global historical figures
  - After: 25 comprehensive topics (e.g., "Roman Empire Leaders", "Scientists & Inventors")
  - Before: 105 individual Indian historical figures
  - After: 22 comprehensive topics (e.g., "Mauryan Empire & Rulers", "Revolutionary Freedom Fighters")

#### 6. Depth Classification System ✅ (NEW)
Every topic now has a `depth` field indicating question generation potential:

| Depth | Questions | Description | Example Topics |
|-------|-----------|-------------|----------------|
| **limited** | ~1,000 | Individual films, short series | Single movies, mini-series |
| **medium** | 1,000-3,000 | Narrow topics, newer directors | Jordan Peele Films, 2020s Movies |
| **large** | 3,000-5,000 | Substantial topics | Christopher Nolan Films, specific wars |
| **massive** | 5,000-10,000 | Major franchises, long series | MCU, Game of Thrones, major empires |
| **immense** | 10,000+ | Long-running shows, broad topics | The Simpsons, Friends, Ancient Rome |

**Distribution:**
| Depth | Topics | Est. Questions |
|-------|--------|----------------|
| limited | 508 | 508,000 |
| medium | 151 | 302,000 |
| large | 273 | 1,092,000 |
| massive | 385 | 2,887,500 |
| immense | 253 | 3,036,000 |
| **TOTAL** | **1,570** | **~7.8 million** |

---

## Architecture

### File Structure
```
question-api/
├── data-generation/
│   └── registry.json              # Master topic configuration
│
├── src/
│   ├── generate.ts                # Main CLI entry point
│   ├── lib/
│   │   ├── adapters/
│   │   │   ├── index.ts           # Adapter registry
│   │   │   ├── types.ts           # ContentAdapter interface
│   │   │   ├── tv-adapter.ts      # TV show transcripts
│   │   │   ├── movies-adapter.ts  # Movie scripts
│   │   │   ├── wikipedia-adapter.ts # Wikipedia articles
│   │   │   ├── ncert-adapter.ts   # NCERT curriculum topics
│   │   │   └── sports-adapter.ts  # Sports statistics
│   │   └── logger.ts              # Logging utility
│   └── data/
│       └── enums/                 # Difficulty levels, etc.
│
├── data/                          # Generated content
│   ├── tv-shows/
│   │   └── {topic}/
│   │       ├── transcript.json    # Source content
│   │       └── questions.json     # Generated questions
│   ├── movies/
│   ├── history/
│   ├── science/
│   ├── sports/
│   └── ...
│
└── PLAN.md                        # This file
```

### Registry Structure
```json
{
  "categories": {
    "category-name": {
      "name": "Display Name",
      "adapter": "adapter-name",
      "subcategories": {
        "subcategory-name": {
          "name": "Display Name",
          "topics": {
            "topic-slug": {
              "name": "Topic Display Name",
              "depth": "immense|massive|large|medium|limited",
              "description": "Content to include..."
            }
          }
        }
      }
    }
  }
}
```

### Question Format
```json
{
  "category": "history",
  "subcategory": "indian-historical-figures",
  "topic": "mauryan-empire-rulers",
  "title": "Mauryan Empire & Rulers",
  "source": "Wikipedia",
  "sourceUrl": "https://...",
  "generatedAt": "2024-12-20T...",
  "questionCount": 25,
  "questions": [
    {
      "question": "Who was the founder of the Mauryan Empire?",
      "options": ["Chandragupta Maurya", "Ashoka", "Bindusara", "Chanakya"],
      "correct_answer": "Chandragupta Maurya",
      "difficulty": "easy",
      "explanation": "Chandragupta Maurya founded the empire in 321 BCE..."
    }
  ],
  "citations": [
    { "text": "Mauryan Empire", "source": "Wikipedia", "url": "..." }
  ]
}
```

---

## Topic Categories Detail

### TV Shows (566 topics)
**Depths:** immense(84) | massive(98) | large(91) | medium(120) | limited(173)

Subcategories: sitcoms, drama, sci-fi-fantasy, crime-thriller, animated, medical, legal, procedural, horror, teen-drama, comedy-drama, romance, reality-competition, true-crime, documentary, mini-series, action-adventure, family, british, indian, korean, anime, talk-variety

### Movies (445 topics)
**Depths:** immense(19) | massive(26) | large(39) | medium(26) | limited(335)

Subcategories: franchises, action, comedy, drama, horror, sci-fi, thriller, romance, animated, crime, war, directors, decades, bollywood, korean-cinema, japanese-cinema, documentary, studios, oscar-winners

### History (357 topics)
**Depths:** immense(83) | massive(171) | large(98) | medium(5) | limited(0)

Subcategories:
- **Time Periods:** ancient-civilizations (25), medieval (25), early-modern (25), revolutions (20), world-wars (25), cold-war-era (20)
- **Empires:** empires (20)
- **Regional:** american-history (25), indian-history (25), european-history (20), asian-history (20), african-history (20), middle-eastern-history (20)
- **Figures:** historical-figures (25 merged topics), indian-historical-figures (22 merged topics)
- **Wars:** wars-and-conflicts (20)

### Science (67 topics)
**Depths:** immense(8) | massive(25) | large(34) | medium(0) | limited(0)

Subcategories: physics, chemistry, biology, astronomy, earth-science, ncert-class-10, ncert-class-12

### Mathematics (12 topics)
**Depths:** immense(3) | massive(9) | large(0) | medium(0) | limited(0)

Subcategories: fundamentals, advanced, applied

### Sports (43 topics)
**Depths:** immense(19) | massive(19) | large(5) | medium(0) | limited(0)

Subcategories: cricket, football, american-sports, tennis, olympics, motorsport, combat-sports, other-sports

### Geography (14 topics)
**Depths:** immense(3) | massive(8) | large(3) | medium(0) | limited(0)

Subcategories: political, physical, landmarks

### Entertainment (26 topics)
**Depths:** immense(15) | massive(10) | large(1) | medium(0) | limited(0)

Subcategories: music, literature, gaming, awards

### Technology (15 topics)
**Depths:** immense(7) | massive(8) | large(0) | medium(0) | limited(0)

Subcategories: computing, tech-companies, innovations

### General Knowledge (25 topics)
**Depths:** immense(12) | massive(11) | large(2) | medium(0) | limited(0)

Subcategories: miscellaneous, current-affairs, india, indian-epics

---

## Next Steps

### Phase 3: Question Generation at Scale
- [ ] Generate questions for all topics (batch processing)
- [ ] Track generation progress in manifest
- [ ] Handle rate limiting for APIs
- [ ] Prioritize by depth (immense/massive topics first)

### Phase 4: Quality Assurance
- [ ] Implement AI self-scoring for questions
- [ ] Create quality thresholds (auto-approve/reject)
- [ ] Build review CLI for borderline questions
- [ ] Add question deduplication

### Phase 5: API & Frontend
- [ ] REST API for serving questions
- [ ] Random question selection with difficulty balancing
- [ ] Quiz session management
- [ ] Score tracking

---

## Usage

### Generate Questions
```bash
# Basic usage
bun src/generate.ts <category> <topic> [--count=N] [--force]

# Examples
bun src/generate.ts tv-shows friends --count=50
bun src/generate.ts history mauryan-empire-rulers
bun src/generate.ts science electricity ncert-class-10
bun src/generate.ts sports ipl cricket --count=30
```

### Environment Variables
```bash
ANTHROPIC_API_KEY=...  # Claude API (preferred)
GROQ_API_KEY=...       # Groq API (fallback)
```

---

## Design Decisions

### 1. Topic Sizing (1000+ Questions)
Every topic must be comprehensive enough to generate 1000+ quality questions. This means:
- Individual historical figures → Merged into eras/themes
- Individual scientists → Merged into "Scientists & Inventors"
- But: Major TV shows, sports leagues, empires remain standalone

### 2. Depth-Based Classification
Topics are classified by question potential:
- **TV Shows:** Based on episode count (200+ = immense, 100-199 = massive, etc.)
- **Movies:** Franchises by film count; individual films = limited
- **History:** By scope (civilizations = immense, specific events = large)
- **Directors:** By filmography size

### 3. Registry-Based Configuration
- Single source of truth for all topics
- Easy to add new topics without code changes
- Adapters selected based on category

### 4. Multi-Source Support
Topics can pull from multiple sources:
- Wikipedia for general knowledge
- Specialized APIs for sports statistics
- Transcript sites for media content

### 5. Adapter Pattern
Each content type has a dedicated adapter that:
- Fetches content from appropriate source
- Normalizes content format
- Handles caching and rate limiting

---

## Quality Guidelines

### Good Questions
- About memorable moments, key plot points, main characters
- Testable without rewatching/rereading
- Clear correct answer, plausible wrong answers
- Educational value for knowledge topics

### Bad Questions (Avoid)
- Colors of clothing/objects
- Exact counts ("How many times...")
- Background details
- Obscure minor characters
- Timestamp-specific details

### Difficulty Distribution
- **Easy (40%):** Well-known facts, main concepts
- **Medium (40%):** Specific but memorable details
- **Hard (20%):** Nuanced understanding, connections

---

## Metrics

### Current Totals
- **Total Topics:** 1,570
- **Potential Questions:** ~7.8 million (depth-weighted estimate)
- **Generated Questions:** 91 files (TV shows only)
- **Categories:** 10

### Question Potential by Estimate
| Estimate | Total Questions |
|----------|-----------------|
| Conservative | ~4.5 million |
| Realistic | ~7-8 million |
| Aggressive | ~12 million |

### Target
- Generate questions for all 1,570 topics
- Minimum 25 questions per topic initially
- Scale based on depth tier:
  - limited: 25-50 questions
  - medium: 50-100 questions
  - large: 100-200 questions
  - massive: 200-500 questions
  - immense: 500-1000+ questions
