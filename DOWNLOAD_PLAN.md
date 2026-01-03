# Content Download Plan

Master plan for downloading all content before question generation begins.

---

## Already Downloaded ✅

| Category | Items | Details |
|----------|-------|---------|
| TV Shows | 14 shows | 2,057 episodes |
| Movies | 171 films | Full scripts |
| Classic Books | 103 books | Project Gutenberg |
| Epics | 5 texts | Bible, Quran, Gita, Mahabharata, Ramayana |
| Harry Potter | 7 novels + 296 wiki articles | Books + wiki |
| ASOIAF | 5 novels + 149 wiki articles | Books (1.78M words) + wiki |
| Greek Mythology | 958 pages | theoi.com (22 categories) |
| Norse Mythology | 185 pages | sacred-texts.com (Eddas, sagas, retellings) |
| Egyptian Mythology | 312 pages | sacred-texts.com (Book of Dead, Pyramid Texts, etc.) |
| Star Wars Wiki | 200 pages | Wookieepedia (characters, planets, ships, events) |
| Marvel MCU Wiki | 199 pages | MCU Wiki (heroes, villains, films, items) |
| DC Wiki | 115 pages | DCEU Wiki (heroes, villains, films) |
| Doctor Who Wiki | 152 pages | Tardis Wiki (Doctors, companions, episodes, villains) |

---

## Claude's Work (Web Scraping)

### Mythology (No books available - must scrape)

| # | Source | Content | Est. Pages | Script | Status |
|---|--------|---------|------------|--------|--------|
| 1 | theoi.com | Greek gods, heroes, creatures, myths | 958 | `src/download-greek-mythology.ts` | ✅ |
| 2 | sacred-texts.com/neu | Norse Eddas, sagas, gods | 185 | `src/download-norse-mythology.ts` | ✅ |
| 3 | sacred-texts.com/egy | Egyptian gods, Book of the Dead | 312 | `src/download-egyptian-mythology.ts` | ✅ |

### Movie/TV Franchise Wikis (Source is film, not books)

| # | Source | Content | Est. Articles | Script | Status |
|---|--------|---------|---------------|--------|--------|
| 4 | starwars.fandom.com | Star Wars characters, planets, ships | 200 | `src/download-starwars-wiki.ts` | ✅ |
| 5 | marvel.fandom.com | MCU characters, movies, events | 199 | `src/download-marvel-wiki.ts` | ✅ |
| 6 | dc.fandom.com | DC characters, movies, comics | 115 | `src/download-dc-wiki.ts` | ✅ |
| 7 | tardis.fandom.com | Doctor Who characters, episodes, aliens | 152 | `src/download-doctorwho-wiki.ts` | ✅ |

### Claude's Task List

```
[x] 1. Greek Mythology (theoi.com) - 958 pages
[x] 2. Norse Mythology (sacred-texts.com) - 185 pages
[x] 3. Egyptian Mythology (sacred-texts.com) - 312 pages
[x] 4. Star Wars Wiki (Wookieepedia) - 200 pages
[x] 5. Marvel MCU Wiki - 199 pages
[x] 6. DC Wiki - 115 pages
[x] 7. Doctor Who Wiki - 152 pages
```

---

## Russell's Work (Books)

**Instructions:**
1. Search term below, download EPUB
2. Convert EPUB → TXT using Calibre
3. Add to `generation/books/[folder-name]/`

### Copy-Paste Search List (Priority Order)

```
# TIER 1 - HIGH PRIORITY

Lord of the Rings Fellowship of the Ring epub
Lord of the Rings Two Towers epub
Lord of the Rings Return of the King epub
The Hobbit Tolkien epub
Hunger Games Suzanne Collins epub
Catching Fire Suzanne Collins epub
Mockingjay Suzanne Collins epub
Ballad of Songbirds and Snakes epub
Percy Jackson Lightning Thief epub
Percy Jackson Sea of Monsters epub
Percy Jackson Titan's Curse epub
Percy Jackson Battle of the Labyrinth epub
Percy Jackson Last Olympian epub
The Witcher - The Last Wish epub
The Witcher - Sword of Destiny epub
The Witcher - Blood of Elves epub
The Witcher - Time of Contempt epub
The Witcher - Baptism of Fire epub
The Witcher - The Tower of the Swallow epub
The Witcher - The Lady of the Lake epub
The Witcher - Season of Storms epub
Angels and Demons Dan Brown epub
The Da Vinci Code Dan Brown epub
The Lost Symbol Dan Brown epub
Inferno Dan Brown epub
Origin Dan Brown epub

# TIER 2 - MYSTERY/THRILLER

Murder on the Orient Express epub
And Then There Were None epub
Death on the Nile epub
The ABC Murders epub
Gone Girl Gillian Flynn epub

# TIER 3 - SCI-FI/DYSTOPIAN

Ender's Game Orson Scott Card epub
Divergent Veronica Roth epub
Insurgent Veronica Roth epub
Allegiant Veronica Roth epub
Maze Runner James Dashner epub
Scorch Trials James Dashner epub
Death Cure James Dashner epub

# TIER 4 - DEEP FANTASY

The Silmarillion Tolkien epub
Mistborn Final Empire epub
Mistborn Well of Ascension epub
Mistborn Hero of Ages epub
Stormlight Archive Way of Kings epub
Stormlight Words of Radiance epub
Stormlight Oathbringer epub
Stormlight Rhythm of War epub
Name of the Wind Patrick Rothfuss epub
Wise Man's Fear Patrick Rothfuss epub

# TIER 5 - LITERARY/OPTIONAL

The Kite Runner epub
Life of Pi epub
The Book Thief epub
Girl on the Train epub

# TIER 6 - MORE AGATHA CHRISTIE

Poirot Murder of Roger Ackroyd epub
Poirot Five Little Pigs epub
Miss Marple A Murder is Announced epub
Miss Marple The Body in the Library epub
```

### Russell's Status Tracking

| # | Series | Books | Folder | Status |
|---|--------|-------|--------|--------|
| 1 | A Song of Ice and Fire | 5 | `a-song-of-ice-and-fire/` | ✅ Done |
| 2 | Harry Potter | 7 | `harry-potter/` | ✅ Done |
| 3 | Lord of the Rings + Hobbit | 4 | `tolkien/` | ⬜ |
| 4 | Hunger Games | 4 | `hunger-games/` | ⬜ |
| 5 | Percy Jackson | 5 | `percy-jackson/` | ⬜ |
| 6a | The Witcher - The Last Wish | 1 | `witcher/` | ⬜ |
| 6b | The Witcher - Sword of Destiny | 1 | `witcher/` | ⬜ |
| 6c | The Witcher - Blood of Elves | 1 | `witcher/` | ⬜ |
| 6d | The Witcher - Time of Contempt | 1 | `witcher/` | ⬜ |
| 6e | The Witcher - Baptism of Fire | 1 | `witcher/` | ⬜ |
| 6f | The Witcher - The Tower of the Swallow | 1 | `witcher/` | ⬜ |
| 6g | The Witcher - The Lady of the Lake | 1 | `witcher/` | ⬜ |
| 6h | The Witcher - Season of Storms | 1 | `witcher/` | ⬜ |
| 7 | Robert Langdon (Dan Brown) | 5 | `dan-brown/` | ⬜ |
| 8 | Agatha Christie | 6+ | `agatha-christie/` | ⬜ |
| 9 | Divergent | 3 | `divergent/` | ⬜ |
| 10 | Maze Runner | 3 | `maze-runner/` | ⬜ |
| 11 | Ender's Game | 1 | `sci-fi/` | ⬜ |
| 12 | The Silmarillion | 1 | `tolkien/` | ⬜ |
| 13 | Mistborn | 3 | `mistborn/` | ⬜ |
| 14 | Stormlight Archive | 4 | `stormlight/` | ⬜ |
| 15 | Kingkiller Chronicle | 2 | `kingkiller/` | ⬜ |
| 16 | Literary Fiction | 4 | `literary/` | ⬜ |

**Total: ~56 books**

---

## Summary

| Owner | Task Type | Items |
|-------|-----------|-------|
| Claude | Mythology scraping | 3 sources (~500 pages) |
| Claude | Movie/TV wikis | 4 wikis (~1,800 articles) |
| Russell | Books (EPUB → TXT) | ~56 books |

---

_Last updated: January 2026_
