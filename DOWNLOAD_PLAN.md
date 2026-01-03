# Content Download Plan

Master plan for downloading all content before question generation begins.

---

## Phase 1: Fantasy Wiki Scrapers

**Goal:** Scrape major fantasy franchise wikis

| Task | Source                               | Content                                   | Est. Articles | Status  |
| ---- | ------------------------------------ | ----------------------------------------- | ------------- | ------- |
| 1.1  | ASOIAF Wiki (awoiaf.westeros.org)    | GoT characters, houses, locations, events | 500+          | Pending |
| 1.2  | Tolkien Gateway (tolkiengateway.net) | LOTR/Hobbit/Silmarillion lore             | 500+          | Pending |
| 1.3  | Wookieepedia (starwars.fandom.com)   | Star Wars characters, planets, ships      | 500+          | Pending |

**Scripts to create:**

- `src/download-asoiaf-wiki.ts`
- `src/download-tolkien-wiki.ts`
- `src/download-starwars-wiki.ts`

---

## Phase 2: Mythology Scrapers

**Goal:** Scrape mythology sources

| Task | Source               | Content                              | Est. Pages | Status  |
| ---- | -------------------- | ------------------------------------ | ---------- | ------- |
| 2.1  | Theoi.com            | Greek gods, heroes, creatures, myths | 300+       | Pending |
| 2.2  | sacred-texts.com/neu | Norse Eddas, sagas                   | 100+       | Pending |
| 2.3  | sacred-texts.com/egy | Egyptian mythology                   | 100+       | Pending |

**Scripts to create:**

- `src/download-greek-mythology.ts`
- `src/download-norse-mythology.ts`
- `src/download-egyptian-mythology.ts`

---

## Phase 3: User-Provided Books (Copyrighted)

**Goal:** User downloads, converts to .txt, adds to `generation/books/`

### Priority Tier 1 (Must Have)

| #   | Series                        | Author          | Books | Folder             | Status  |
| --- | ----------------------------- | --------------- | ----- | ------------------ | ------- |
| 1   | A Song of Ice and Fire        | G.R.R. Martin   | 5     | `game-of-thrones/` | Pending |
| 2   | The Hunger Games              | Suzanne Collins | 4     | `hunger-games/`    | Pending |
| 3   | Percy Jackson & the Olympians | Rick Riordan    | 5     | `percy-jackson/`   | Pending |
| 4   | The Da Vinci Code             | Dan Brown       | 1     | `thrillers/`       | Pending |
| 5   | Gone Girl                     | Gillian Flynn   | 1     | `thrillers/`       | Pending |

### Priority Tier 2 (High Value)

| #   | Series           | Author            | Books | Folder         | Status  |
| --- | ---------------- | ----------------- | ----- | -------------- | ------- |
| 6   | The Witcher      | Andrzej Sapkowski | 8     | `the-witcher/` | Pending |
| 7   | Mistborn (Era 1) | Brandon Sanderson | 3     | `mistborn/`    | Pending |
| 8   | Ender's Game     | Orson Scott Card  | 1     | `sci-fi/`      | Pending |
| 9   | The Maze Runner  | James Dashner     | 3     | `maze-runner/` | Pending |
| 10  | Divergent        | Veronica Roth     | 3     | `divergent/`   | Pending |

### Priority Tier 3 (Nice to Have)

| #   | Series                 | Author            | Books | Folder           | Status  |
| --- | ---------------------- | ----------------- | ----- | ---------------- | ------- |
| 11  | The Kite Runner        | Khaled Hosseini   | 1     | `literary/`      | Pending |
| 12  | The Girl on the Train  | Paula Hawkins     | 1     | `thrillers/`     | Pending |
| 13  | The Name of the Wind   | Patrick Rothfuss  | 2     | `kingkiller/`    | Pending |
| 14  | Life of Pi             | Yann Martel       | 1     | `literary/`      | Pending |
| 15  | The Book Thief         | Markus Zusak      | 1     | `literary/`      | Pending |
| 16  | The Stormlight Archive | Brandon Sanderson | 4     | `stormlight/`    | Pending |
| 17  | The Wheel of Time      | Robert Jordan     | 14    | `wheel-of-time/` | Pending |

**User Instructions:**

1. Purchase EPUBs from DRM-free store (Google Play, Kobo) or strip DRM with Calibre
2. Convert EPUB → TXT using Calibre
3. Add to `generation/books/[folder-name]/`
4. Name files: `01-book-title.txt`, `02-book-title.txt`, etc.

---

## Phase 4: Additional Wiki Scrapers (Optional)

**Goal:** More franchise wikis if time permits

| Task | Source               | Content                      | Status  |
| ---- | -------------------- | ---------------------------- | ------- |
| 4.1  | Marvel Wiki          | MCU characters, events       | Pending |
| 4.2  | DC Wiki              | DC characters, events        | Pending |
| 4.3  | Doctor Who Wiki      | Characters, episodes, aliens | Pending |
| 4.4  | Agatha Christie Wiki | Detectives, books, cases     | Pending |

---

## Current Content (Already Downloaded)

| Category           | Items        | Details                                   |
| ------------------ | ------------ | ----------------------------------------- |
| TV Shows           | 14 shows     | 2,057 episodes                            |
| Movies             | 171 films    | Full scripts                              |
| Classic Books      | 103 books    | Project Gutenberg                         |
| Epics              | 5 texts      | Bible, Quran, Gita, Mahabharata, Ramayana |
| Harry Potter Books | 7 novels     | Full text                                 |
| Harry Potter Wiki  | 296 articles | Characters, spells, creatures, etc.       |

---

## Phase Execution Summary

| Phase   | Owner  | Sessions               | Dependencies |
| ------- | ------ | ---------------------- | ------------ |
| Phase 1 | Claude | 1-2 sessions           | None         |
| Phase 2 | Claude | 1 session              | None         |
| Phase 3 | User   | Async (user downloads) | None         |
| Phase 4 | Claude | 1 session              | Optional     |

**Recommended Order:**

1. Start Phase 1 + Phase 3 in parallel
2. Phase 2 while waiting for Phase 3
3. Phase 4 if time permits

---

## Progress Tracking

### Phase 1 Progress

- [ ] ASOIAF Wiki
- [ ] Tolkien Gateway
- [ ] Wookieepedia

### Phase 2 Progress

- [ ] Greek Mythology
- [ ] Norse Mythology
- [ ] Egyptian Mythology

### Phase 3 Progress

- [ ] A Song of Ice and Fire (5)
- [ ] The Hunger Games (4)
- [ ] Percy Jackson (5)
- [ ] The Da Vinci Code (1)
- [ ] Gone Girl (1)
- [ ] The Witcher (8)
- [ ] Mistborn (3)
- [ ] Ender's Game (1)
- [ ] The Maze Runner (3)
- [ ] Divergent (3)
- [ ] Remaining Tier 3 books

### Phase 4 Progress

- [ ] Marvel Wiki
- [ ] DC Wiki
- [ ] Doctor Who Wiki
- [ ] Agatha Christie Wiki

---

_Last updated: January 2026_

<!-- ⏺ | #   | Book/Series                   | Author             | Books |
  |-----|-------------------------------|--------------------|-------|
  | 1   | A Song of Ice and Fire        | George R.R. Martin | 5     |
  | 2   | The Hunger Games              | Suzanne Collins    | 4     |
  | 3   | Percy Jackson & the Olympians | Rick Riordan       | 5     |
  | 4   | The Da Vinci Code             | Dan Brown          | 1     |
  | 5   | Gone Girl                     | Gillian Flynn      | 1     |
  | 6   | The Witcher                   | Andrzej Sapkowski  | 8     |
  | 7   | Mistborn (Era 1)              | Brandon Sanderson  | 3     |
  | 8   | Ender's Game                  | Orson Scott Card   | 1     |
  | 9   | The Maze Runner               | James Dashner      | 3     |
  | 10  | Divergent                     | Veronica Roth      | 3     |
  | 11  | The Kite Runner               | Khaled Hosseini    | 1     |
  | 12  | The Girl on the Train         | Paula Hawkins      | 1     |
  | 13  | The Name of the Wind          | Patrick Rothfuss   | 2     |
  | 14  | Life of Pi                    | Yann Martel        | 1     |
  | 15  | The Book Thief                | Markus Zusak       | 1     |
  | 16  | The Stormlight Archive        | Brandon Sanderson  | 4     |
  | 17  | The Wheel of Time             | Robert Jordan      | 14    | -->
