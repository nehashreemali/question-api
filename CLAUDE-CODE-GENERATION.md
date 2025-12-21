# Claude Code Question Generation

This document describes how to generate quiz questions directly through Claude Code CLI, without using external APIs like Groq.

---

## Quick Start

**Trigger phrase:** `power up`

```
power up friends s1e10
power up The Big Bang Theory season 2 episode 5
power up breaking bad 1 1
```

Claude will understand natural language variations. The key trigger is `power up`.

---

## How It Works

When you say `power up [show] [season] [episode]`, Claude will:

1. **Parse your request** - Understand show name, season, episode
2. **Check/fetch transcript** - Read existing or scrape if missing
3. **Load existing questions** - Check both `rawQuestions.json` and `claude_code_raw_questions.json` for deduplication
4. **Generate questions** - Create questions until material is naturally exhausted
5. **Save output** - Write dated question file + append to raw questions
6. **Update manifests** - Track stats separately for Groq vs Claude Code
7. **Report results** - Show how many questions generated, duplicates skipped

---

## File Structure

For each episode, all questions are stored in a `questions/` subfolder:

```
data/tv-shows/{show}/season-{N}/episode-{N}/
├── transcript.json                        # Source content
├── manifest.json                          # Metadata with Groq/Claude Code stats
│
└── questions/                             # All questions in this subfolder
    │
    │ # Groq-generated
    ├── groq_questions_DD_MM_YYYY_HHMMSS.json    # Timestamped session file
    ├── groq_raw_questions.json                  # Master list (append-only)
    │
    │ # Claude Code generated
    ├── claude_code_questions_DD_MM_YYYY.json    # Session file (dated)
    └── claude_code_raw_questions.json           # Master list (append-only)
```

This structure makes it easy to find all questions - just scan for `questions/` folders.

### File Purposes

| File | Purpose |
|------|---------|
| `groq_questions_*.json` | Full question objects from Groq API sessions. Timestamped. |
| `groq_raw_questions.json` | Flat array of all Groq question strings. For deduplication. |
| `claude_code_questions_*.json` | Full question objects from Claude Code sessions. Dated. |
| `claude_code_raw_questions.json` | Flat array of all Claude Code question strings. For deduplication. |

---

## Deduplication

Before generating each question, Claude checks both raw question files in the `questions/` folder:
- `groq_raw_questions.json` (Groq-generated questions)
- `claude_code_raw_questions.json` (Claude Code-generated questions)

Fuzzy matching is used - questions that are semantically too similar are skipped silently.

---

## Manifest Stats

The manifest tracks generation stats separately:

```json
{
  "questions": {
    "groq": {
      "count": 29,
      "lastGenerated": "2025-12-16T10:30:00Z"
    },
    "claudeCode": {
      "count": 25,
      "lastGenerated": "2025-12-21T14:00:00Z"
    },
    "totalCount": 54
  }
}
```

Stats roll up through the hierarchy: episode → season → series → global.

---

## Question Format

Each question follows this structure:

```json
{
  "question": "What does Monica say is 'just some guy I work with'?",
  "options": [
    "Paul the wine guy",
    "Her new neighbor",
    "Her dentist",
    "Her gym trainer"
  ],
  "correct_answer": "Paul the wine guy",
  "difficulty": "easy",
  "explanation": "Monica tells her friends 'There's nothing to tell! He's just some guy I work with!' when asked about Paul."
}
```

### Difficulty Distribution (Target)
- **Easy (40%)** - Basic plot points, main events
- **Medium (40%)** - Specific dialogue, character motivations
- **Hard (20%)** - Subtle details, callbacks (still fair, not obscure)

---

## Quality Rules

### Good Questions
- Test memorable moments, plot points, character traits
- Reference specific dialogue or events
- Answerable by someone who watched attentively
- Have one clearly correct answer

### Avoid
- Colors of clothing or background objects
- Exact counts ("How many times did X happen?")
- Minor background details
- Anything requiring freeze-frame analysis
- Trick questions

---

## Output Report

After generation, Claude reports:

```
✓ Friends S1E9 - Generated 27 questions
  Skipped 3 duplicates
  Total for episode: 27 (Claude Code) + 29 (Groq) = 56
```

---

## Supported Content Types

| Type | Status | Trigger Example |
|------|--------|-----------------|
| TV Shows | ✅ Supported | `power up friends s1e10` |
| Movies | ✅ Supported | `power up the godfather` |
| Sports | ✅ Supported | `power up cricket world cup 2023` |
| Knowledge | ✅ Supported | `power up physics thermodynamics` |

All content types are supported. One topic at a time.

### Adapter Details

#### TV Shows
- **Trigger:** `power up [show] s[season]e[episode]`
- **Sources:** fangj.github.io (Friends), Subslikescript (other shows)
- **Data path:** `data/tv-shows/{show}/season-{N}/episode-{N}/`

#### Movies
- **Trigger:** `power up [movie name]`
- **Sources:** Wikipedia, IMDb summaries
- **Data path:** `data/movies/{movie-slug}/`

#### Sports
- **Trigger:** `power up [sport] [topic]`
- **Sources:** Wikipedia, ESPN, CricInfo
- **Topics:** tournaments, players, teams, records
- **Data path:** `data/sports/{sport}/{topic}/`

#### Knowledge (Science, History, Geography, etc.)
- **Trigger:** `power up [category] [topic]`
- **Sources:** Wikipedia, OpenStax, Khan Academy
- **Data path:** `data/{category}/{topic}/`

---

## Transcript Sources

For TV shows, transcripts are fetched from:
1. **Friends Transcripts** (fangj.github.io) - Primary for Friends
2. **Subslikescript.com** - Fallback for other shows

If a transcript doesn't exist, Claude will attempt to scrape it automatically.

---

## Comparison: Claude Code vs Groq

| Aspect | Claude Code | Groq API |
|--------|-------------|----------|
| Cost | Included in Claude subscription | Separate API cost |
| Interface | CLI conversation | Web UI or scripts |
| Speed | Conversational pace | Batch processing |
| Rate limits | Claude's limits | Groq's daily limits |
| Files | `claude_code_*.json` | `questions.json`, `rawQuestions.json` |

Both systems output the same question format and update the same manifest hierarchy.

---

## Session Start Checklist

When starting a new Claude Code session for question generation:

1. Read `PROGRESS-SUMMARY.md` to see current status
2. Check which episodes need questions
3. Use `power up [show] [season] [episode]` to generate

---

## Examples

```
# Generate questions for Friends Season 1 Episode 10
power up friends s1e10

# Different formats all work
power up Friends Season 1 Episode 10
power up friends 1 10
power up "The Big Bang Theory" s2e5
```
