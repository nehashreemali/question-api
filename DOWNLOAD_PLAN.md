# Content Download Plan

Master plan for downloading all content before question generation begins.

---

## Current Content (Already Downloaded) ✓

| Category           | Items        | Details                                   |
| ------------------ | ------------ | ----------------------------------------- |
| TV Shows           | 14 shows     | 2,057 episodes                            |
| Movies             | 171 films    | Full scripts                              |
| Classic Books      | 103 books    | Project Gutenberg                         |
| Epics              | 5 texts      | Bible, Quran, Gita, Mahabharata, Ramayana |
| Harry Potter Books | 7 novels     | Full text                                 |
| Harry Potter Wiki  | 296 articles | Characters, spells, creatures, etc.       |

---

## Phase 1: Fantasy Wiki Scrapers

**Goal:** Scrape major fantasy franchise wikis

### 1.a: ASOIAF Wiki (Game of Thrones)

| Source | awoiaf.westeros.org |
| ------ | ------------------- |
| Content | Characters, houses, locations, events |
| Est. Articles | 500+ |
| Script | `src/download-asoiaf-wiki.ts` |
| Status | ⬜ Pending |

### 1.b: Tolkien Gateway (Lord of the Rings)

| Source | tolkiengateway.net |
| ------ | ------------------ |
| Content | LOTR, Hobbit, Silmarillion lore |
| Est. Articles | 500+ |
| Script | `src/download-tolkien-wiki.ts` |
| Status | ⬜ Pending |

### 1.c: Wookieepedia (Star Wars)

| Source | starwars.fandom.com |
| ------ | ------------------- |
| Content | Characters, planets, ships, events |
| Est. Articles | 500+ |
| Script | `src/download-starwars-wiki.ts` |
| Status | ⬜ Pending |

---

## Phase 2: Mythology Scrapers

**Goal:** Scrape mythology sources from dedicated sites

### 2.a: Greek Mythology

| Source | theoi.com |
| ------ | --------- |
| Content | Gods, heroes, creatures, myths |
| Est. Pages | 300+ |
| Script | `src/download-greek-mythology.ts` |
| Status | ⬜ Pending |

### 2.b: Norse Mythology

| Source | sacred-texts.com/neu |
| ------ | -------------------- |
| Content | Eddas, sagas, Norse gods |
| Est. Pages | 100+ |
| Script | `src/download-norse-mythology.ts` |
| Status | ⬜ Pending |

### 2.c: Egyptian Mythology

| Source | sacred-texts.com/egy |
| ------ | -------------------- |
| Content | Egyptian gods, Book of the Dead, myths |
| Est. Pages | 100+ |
| Script | `src/download-egyptian-mythology.ts` |
| Status | ⬜ Pending |

---

## Phase 3: User-Provided Books (Copyrighted)

**Goal:** User downloads, converts to .txt, adds to `generation/books/`

**Instructions:**
1. Purchase EPUBs from DRM-free store (Google Play, Kobo) or strip DRM with Calibre
2. Convert EPUB → TXT using Calibre
3. Add to `generation/books/[folder-name]/`
4. Name files: `01-book-title.txt`, `02-book-title.txt`, etc.

### 3.a: Fantasy Epics

| #   | Series                 | Author          | Books | Folder             | Status  |
| --- | ---------------------- | --------------- | ----- | ------------------ | ------- |
| 1   | A Song of Ice and Fire | G.R.R. Martin   | 5     | `game-of-thrones/` | ⬜ Pending |
| 2   | The Witcher            | Andrzej Sapkowski | 8   | `the-witcher/`     | ⬜ Pending |
| 3   | The Wheel of Time      | Robert Jordan   | 14    | `wheel-of-time/`   | ⬜ Pending |
| 4   | The Stormlight Archive | Brandon Sanderson | 4   | `stormlight/`      | ⬜ Pending |
| 5   | Mistborn (Era 1)       | Brandon Sanderson | 3   | `mistborn/`        | ⬜ Pending |
| 6   | The Name of the Wind   | Patrick Rothfuss | 2    | `kingkiller/`      | ⬜ Pending |

### 3.b: YA Dystopian/Adventure

| #   | Series                        | Author          | Books | Folder           | Status  |
| --- | ----------------------------- | --------------- | ----- | ---------------- | ------- |
| 1   | The Hunger Games              | Suzanne Collins | 4     | `hunger-games/`  | ⬜ Pending |
| 2   | Percy Jackson & the Olympians | Rick Riordan    | 5     | `percy-jackson/` | ⬜ Pending |
| 3   | The Maze Runner               | James Dashner   | 3     | `maze-runner/`   | ⬜ Pending |
| 4   | Divergent                     | Veronica Roth   | 3     | `divergent/`     | ⬜ Pending |
| 5   | Ender's Game                  | Orson Scott Card | 1    | `sci-fi/`        | ⬜ Pending |

### 3.c: Thrillers & Literary Fiction

| #   | Series                | Author          | Books | Folder       | Status  |
| --- | --------------------- | --------------- | ----- | ------------ | ------- |
| 1   | The Da Vinci Code     | Dan Brown       | 1     | `thrillers/` | ⬜ Pending |
| 2   | Gone Girl             | Gillian Flynn   | 1     | `thrillers/` | ⬜ Pending |
| 3   | The Girl on the Train | Paula Hawkins   | 1     | `thrillers/` | ⬜ Pending |
| 4   | The Kite Runner       | Khaled Hosseini | 1     | `literary/`  | ⬜ Pending |
| 5   | Life of Pi            | Yann Martel     | 1     | `literary/`  | ⬜ Pending |
| 6   | The Book Thief        | Markus Zusak    | 1     | `literary/`  | ⬜ Pending |

---

## Phase 4: Additional Wiki Scrapers

**Goal:** More franchise wikis for popular media

### 4.a: Marvel Wiki (MCU)

| Source | marvel.fandom.com |
| ------ | ----------------- |
| Content | MCU characters, movies, events |
| Est. Articles | 500+ |
| Script | `src/download-marvel-wiki.ts` |
| Status | ⬜ Pending |

### 4.b: DC Wiki (DCEU)

| Source | dc.fandom.com |
| ------ | ------------- |
| Content | DC characters, movies, comics |
| Est. Articles | 500+ |
| Script | `src/download-dc-wiki.ts` |
| Status | ⬜ Pending |

### 4.c: Doctor Who Wiki

| Source | tardis.fandom.com |
| ------ | ----------------- |
| Content | Characters, episodes, aliens, planets |
| Est. Articles | 300+ |
| Script | `src/download-doctorwho-wiki.ts` |
| Status | ⬜ Pending |

### 4.d: Agatha Christie Wiki

| Source | agathachristie.fandom.com |
| ------ | ------------------------- |
| Content | Detectives, books, cases, characters |
| Est. Articles | 200+ |
| Script | `src/download-agathachristie-wiki.ts` |
| Status | ⬜ Pending |

---

## Phase Execution Summary

| Phase | Sub-phases | Owner  | Dependencies |
| ----- | ---------- | ------ | ------------ |
| 1     | 1.a, 1.b, 1.c | Claude | None |
| 2     | 2.a, 2.b, 2.c | Claude | None |
| 3     | 3.a, 3.b, 3.c | User   | None |
| 4     | 4.a, 4.b, 4.c, 4.d | Claude | Optional |

**Recommended Order:**
1. Phase 1.a → 1.b → 1.c (Fantasy wikis)
2. Phase 2.a → 2.b → 2.c (Mythology) - can run parallel with Phase 3
3. Phase 3.a → 3.b → 3.c (User downloads books async)
4. Phase 4.a → 4.b → 4.c → 4.d (Additional wikis if time permits)

---

## Progress Tracking

### Phase 1: Fantasy Wikis
- [ ] 1.a: ASOIAF Wiki (Game of Thrones)
- [ ] 1.b: Tolkien Gateway (LOTR)
- [ ] 1.c: Wookieepedia (Star Wars)

### Phase 2: Mythology
- [ ] 2.a: Greek Mythology (Theoi.com)
- [ ] 2.b: Norse Mythology (sacred-texts)
- [ ] 2.c: Egyptian Mythology (sacred-texts)

### Phase 3: User Books
- [ ] 3.a: Fantasy Epics (ASOIAF, Witcher, WoT, Stormlight, Mistborn, Kingkiller)
- [ ] 3.b: YA Dystopian (Hunger Games, Percy Jackson, Maze Runner, Divergent, Ender's Game)
- [ ] 3.c: Thrillers & Literary (Da Vinci Code, Gone Girl, Kite Runner, etc.)

### Phase 4: Additional Wikis
- [ ] 4.a: Marvel Wiki
- [ ] 4.b: DC Wiki
- [ ] 4.c: Doctor Who Wiki
- [ ] 4.d: Agatha Christie Wiki

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
