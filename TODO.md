# Quiz App - Next Steps

> Updated: January 3, 2026
> Check pipeline status: `bun start` → http://localhost:3000/pipeline

---

## Priority 1: Generate Questions for Downloaded Content

We have 4,460 content units downloaded but only 5,830 questions generated.

### TV Shows (1,584 episodes downloaded, 237 with questions)
- [ ] The Office (188 episodes) - 0 questions
- [ ] Seinfeld (180 episodes) - 0 questions
- [ ] Parks and Recreation (123 episodes) - 0 questions
- [ ] How I Met Your Mother (208 episodes) - 0 questions
- [ ] Brooklyn Nine-Nine (135 episodes) - 0 questions
- [ ] Breaking Bad (62 episodes) - 0 questions
- [ ] Community (110 episodes) - 0 questions
- [ ] Big Bang Theory (279 episodes) - 28 questions (needs more)
- [ ] Game of Thrones (73 episodes) - 250 questions (needs more)
- [x] Friends (226 episodes) - 5,552 questions

### Movies (81 scripts downloaded, 0 questions)
- [ ] Generate questions for all 81 movies

### Epics (2,795 files downloaded, 0 questions)
- [ ] Mahabharata (2,093 sections)
- [ ] Ramayana (504 pages)
- [ ] Bhagavad Gita (18 chapters)
- [ ] Bible (66 books)
- [ ] Quran (114 surahs)

---

## Priority 2: Download More Content

### Mythology
- [ ] Greek mythology from Theoi.com (~300 pages)
- [ ] Norse mythology from sacred-texts.com (Eddas)
- [ ] Create `src/download-mythology.ts`

### Books & Fiction
- [ ] Harry Potter from harrypotter.fandom.com
- [ ] Lord of the Rings from tolkiengateway.net
- [ ] Game of Thrones lore from awoiaf.westeros.org
- [ ] Agatha Christie from agathachristie.fandom.com
- [ ] Create `src/download-books.ts`

### More TV Shows
- [ ] Download Wave 2-6 from `src/download-transcripts.ts`
- [ ] ~4,200 more episodes available

---

## Priority 3: New Content Categories (Need Scrapers)

### STEM
- [ ] Research Wikipedia API for structured content
- [ ] Create `src/lib/adapters/wikipedia.ts`
- [ ] Physics topics (Classical mechanics, Thermodynamics, etc.)
- [ ] Chemistry topics (Organic, Inorganic, etc.)
- [ ] Biology topics (Cell biology, Genetics, etc.)
- [ ] Consider OpenStax textbooks

### History
- [ ] Ancient History (Egypt, Greece, Rome, India, China)
- [ ] Medieval History (Europe, Islamic Golden Age, Mongols)
- [ ] Modern History (World Wars, Cold War, etc.)
- [ ] Indian History (Maurya, Gupta, Mughal, British Raj)

### Current Affairs
- [ ] Research news archive sources
- [ ] Consider "This Day in History" format
- [ ] Create update mechanism for fresh content

### Sports
- [ ] Cricket from ESPN Cricinfo
- [ ] Football/Soccer from Wikipedia + Transfermarkt
- [ ] Olympics history
- [ ] Create `src/lib/adapters/sports.ts`

---

## Quick Commands

```bash
# Start server & check pipeline
bun start
# Visit http://localhost:3000/pipeline

# Sync pipeline after downloads
bun src/sync-pipeline.ts

# Download content
bun src/download-transcripts.ts
bun src/download-movies.ts
bun src/download-epics.ts [gita|bible|quran|ramayana|mahabharata]
```

---

## Progress Summary
- **Target:** 1,000,000 questions
- **Current:** 5,830 questions (0.6%)
- **Downloaded:** 4,460 content units
- **Pending:** 4,223 units need question generation

See `V1_LAUNCH_PLAN.md` for full breakdown by category.
See `CLAUDE.md` for project conventions and content sources.
