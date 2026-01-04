# Claude Operating Rules

This document defines Claude's execution boundaries and skill definitions.
For architecture, schemas, and workflows, see `ARCHITECTURE.md`.

---

## Execution Safety Model

| Mode | Trigger | Effect |
|------|---------|--------|
| Chat | Normal conversation | Discussion only, NO state mutation |
| Armed | `POWER_UP <skill>` phrase | Execution authorized |

**No state mutation without explicit arming phrase.**

---

## Git Commit/Push Ritual

When **asked by the user** to prepare a commit or push, Claude MUST:

1. Ask for the secret code
2. Wait for the correct response
3. Only proceed if the code matches exactly

**Clarification:** Claude does NOT autonomously execute git commands. This ritual applies only when the user explicitly requests commit/push operations.

#### Rules
- NEVER commit or push without asking for the code first
- NEVER guess or assume the code
- Code must match exactly (case-sensitive)
- If user declines or provides wrong code, do NOT proceed

---

## Ownership Boundaries

**Current affairs expiry and lifecycle enforcement is the responsibility of the game server.** Generator and export pipelines do not mutate expiry fields; they only read and preserve them.

---

## Skill: generate_questions

### Arming Phrase
```
POWER_UP generate_questions
```

### Execution Safety Boundary (NON-NEGOTIABLE)
- Questions are ONLY generated when the exact arming phrase is used
- Casual requests MUST NOT trigger generation
- If invoked without arming phrase, respond: "To generate questions, use: `POWER_UP generate_questions`"
- This is a hard boundary with no exceptions

### Purpose
Generate quiz questions from local source content and insert into SQLite.

### Non-Hallucination Guarantee (CRITICAL)
- ALL questions MUST be derived strictly from local source files in `generation/`
- Internet knowledge, assumptions, or inferred facts are FORBIDDEN
- If source material is insufficient, STOP and report
- When in doubt, do not generate

### Forbidden Actions
- No web access during generation
- No auto-approval (all questions start as `pending`)
- No deletion or modification of existing questions

### Question Quality Guidelines
- Prefer conceptual understanding over pure memorization
- Avoid reliance on exact dates/numbers UNLESS the source emphasizes them
- Questions must be clear, unambiguous, and single-focus
- Avoid trick questions or misleading wording
- Each question must have exactly one defensible correct answer

### Difficulty Intent
| Level | Meaning |
|-------|---------|
| easy | Widely recognizable facts or concepts |
| medium | Requires contextual understanding or recall |
| hard | Less common but still fair, non-trick knowledge |

Difficulty must NOT be inflated artificially. Hard ≠ obscure or unfair.

### Question Caps
| Content Type | Max |
|--------------|-----|
| TV episode | 25 |
| Chapter/article | 30 |
| Long section | 50 |

### Validation Rules
- Exactly 4 options
- One correct answer (must be in options)
- No duplicate options
- Difficulty: easy, medium, or hard
- Deduplication via hash

### Insert Defaults
```sql
peer_reviewed = 0
review_status = 'pending'
quality_score = NULL
```

### Idempotency
- Default: Skip if questions exist for source unit
- `--force` flag to regenerate

---

## Skill: review_questions

### Arming Phrase
```
POWER_UP review_questions
```

### Purpose
Evaluate existing questions and mark them approved or rejected.

### Allowed Actions
- Read questions where `peer_reviewed = 0 AND review_status = 'pending'`
- Update ONLY these fields:
  - `peer_reviewed` → 1
  - `review_status` → 'approved' or 'rejected'
  - `quality_score` → 0.0 to 1.0
  - `review_notes` → reason for decision
  - `reviewed_at` → timestamp

### Decision Guidelines
- `quality_score` is an advisory signal; approval is an explicit reviewer decision
- Question must be factually accurate
- Question must have exactly 4 distinct options
- Only one answer should be clearly correct

### Rejection Rules (CRITICAL)
- **Rejected questions MUST have `review_notes` explaining why**
- The script will refuse to reject without notes
- Common rejection reasons:
  - Factually incorrect
  - Ambiguous wording
  - Multiple valid answers
  - Too obscure / unfair

### Forbidden Actions (NEVER)
- NEVER generate new questions
- NEVER insert new questions
- NEVER delete questions
- NEVER modify question content (question, options, correct_answer, difficulty)
- NEVER modify topic metadata (topic, part, chapter, title, subcategory)

### Idempotency
- Default: Skip questions where `peer_reviewed = 1`
- `--force` flag to re-review previously reviewed questions

---

## Skill: repair_questions

### Arming Phrase
```
POWER_UP repair_questions
```

### Purpose
Fix rejected questions by generating improved versions based on review_notes.

### Eligibility Criteria
Questions are eligible for repair when ALL of:
- `review_status = 'rejected'`
- `peer_reviewed = 1`
- `repair_attempts < 1` (max 1 attempt)
- `review_notes IS NOT NULL`

### CRITICAL RULES (NON-NEGOTIABLE)
- **NEVER modify the original rejected question**
- **NEVER delete rejected questions**
- **NEVER auto-approve repaired questions**
- Each repair creates a **NEW row** in the database
- Repaired questions start as `peer_reviewed=0, review_status='pending'`
- Repaired questions must go through normal review process

### Repair Guidelines
- Fix ONLY the issues described in `review_notes`
- Do NOT invent new facts
- Do NOT expand scope
- Maintain same category, subcategory, topic, part, chapter
- Ensure correct answer is in options

### Validation Rules
- Exactly 4 options
- Exactly 1 correct answer in options
- No duplicate options
- Valid difficulty (easy/medium/hard)
- No profanity or NSFW content

### Tracking
- After successful insert, `repair_attempts` increments on ORIGINAL
- Max 1 repair attempt per rejected question

---

## Skill: export_prod_db

### Arming Phrase
```
POWER_UP export_prod_db
```

### Purpose
Export approved questions into a production-ready SQLite database.

### Behavior
- Reads from all `data/*.db` files (read-only)
- Filters: `review_status = 'approved'` only
- Excludes: expired current affairs questions
- Outputs: `dist/prod-questions.db`
- Converts difficulty to integer (1=easy, 2=medium, 3=hard)
- Generates tags from metadata
- **Fails if zero approved questions found**

### Answer Ordering (CRITICAL)
- Answer ordering MUST be preserved exactly as stored in source
- No semantic modification of answer content or indices
- Determinism relies on stored indices, NOT alphabetical sorting
- The `correct_answer_index` corresponds to the stored answer position

### Safety Rules (CRITICAL)
- **Source databases are read-only** - NEVER modifies generator DBs
- **No mutation of review fields** - only reads, never writes to source
- **Only approved questions** - pending/rejected are excluded
- **No network access** - purely local file operations
- **No S3 upload** - export only, distribution handled separately

### Filters
| Flag | Description |
|------|-------------|
| `--category` | Filter to specific category |
| `--topic` | Filter to specific topic |
| `--difficulty` | Filter by difficulty |
| `--limit` | Maximum questions to export |
| `--dry-run` | Preview only |

### Production Schema
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question TEXT NOT NULL,
  answers TEXT NOT NULL,              -- JSON: [{text, index}]
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  is_current_affairs INTEGER NOT NULL,
  current_affairs_until TEXT,
  tags TEXT
);
```
